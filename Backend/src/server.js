import {configureHosting} from './config/hosting.js';
import {getConfig} from './config/runtime.js';
import {initializeDatabase} from './config/database.js';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {User,Member,Loan,Month,Entry,Audit} from './models/index.js';
import {money,interest,allocate} from './services/money.js';
import {accounts} from './services/accounts.js';
import {financeRouter} from './routes/finance.js';
import {publicRouter} from './routes/public.js';
let config;
try { config=getConfig(); } catch { console.error('Configure MONGODB_URL; production also requires the Render-generated JWT_SECRET.'); process.exit(process.env.NODE_ENV==='production'?1:0); }
try { await initializeDatabase(config); } catch { console.error('Database startup failed. Check MONGODB_URL, network access, database permissions and replica-set support.'); process.exit(1); }
const app=express();app.disable('x-powered-by');app.use(helmet(),express.json({limit:'32kb'}),cookieParser());
configureHosting(app,config.production);
app.use('/api', (req,res,next)=>{if(req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.get('host')}`&&(config.production||!['http://localhost:5173','http://127.0.0.1:5173'].includes(req.headers.origin)))return res.status(403).json({error:'FORBIDDEN'});next();});
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
app.post('/api/admin/login',rateLimit({windowMs:900000,limit:15}),wrap(async(req,res)=>{const u=await User.findOne({role:'admin',active:true}).select('+password');if(!u||!await bcrypt.compare(String(req.body.password),u.password))return res.status(401).json({error:'LOGIN_FAILED'});res.cookie('session',jwt.sign({id:u.id},config.jwtSecret,{expiresIn:'8h'}),{httpOnly:true,sameSite:'strict',secure:config.production,maxAge:28800000}).json({role:u.role});}));
app.use('/api/public',publicRouter);
app.post('/api/logout',(req,res)=>res.clearCookie('session').json({ok:true}));
app.use('/api',wrap(async(req,res,next)=>{try{const data=jwt.verify(req.cookies.session,config.jwtSecret);req.user=await User.findById(data.id);if(!req.user||!req.user.active||(req.user.role==='member'&&!req.user.member))throw Error();next();}catch{res.status(401).json({error:'LOGIN_REQUIRED'});}}));
app.get('/api/account',wrap(async(req,res)=>{const month=req.query.month;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('INVALID_DATE');const list=await accounts(month,req.user.role==='member'?req.user.member:undefined);const cash=req.user.role==='admin'?(await Entry.find({date:{$lte:month+'-31'}}).lean()).reduce((s,e)=>s+e.cash,0):null;res.json({role:req.user.role,profile:{displayName:req.user.displayName,displayNameHi:req.user.displayNameHi},members:list,cash,monthOpen:!!await Month.exists({month})});}));
app.use('/api',(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'FORBIDDEN'}));
const transact=async(fn)=>{const session=await mongoose.startSession();try{return await session.withTransaction(async()=>{await User.updateOne({role:'admin'},{$inc:{__v:1}},{session});return fn(session);});}finally{await session.endSession();}};
app.post('/api/members',wrap(async(req,res)=>{const {code,name,father,month}=req.body;if(!name?.trim()||!father?.trim()||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!/^\w{3,30}$/.test(code))throw Error('INVALID_INPUT');const amount=money(req.body.share);await transact(async session=>{if(await Month.exists({month:{$gt:month}}).session(session))throw Error('CLOSED_HISTORY');const [m]=await Member.create([{code,name:name.trim(),father:father.trim(),joined:month,shares:[{month,amount}]}],{session});await Month.updateOne({month},{$push:{dues:{member:m._id,amount}}},{session,runValidators:true});await Audit.create([{actor:req.user._id,action:'CREATE_MEMBER',record:m._id}],{session});});res.json({ok:true});}));
app.post('/api/months',wrap(async(req,res)=>{const {month}=req.body;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('INVALID_DATE');await transact(async session=>{if(await Month.exists({month:{$gte:month}}).session(session))throw Error('MONTH_EXISTS');const latest=await Month.findOne().sort({month:-1}).session(session);if(latest){const next=new Date(latest.month+'-01T00:00:00Z');next.setUTCMonth(next.getUTCMonth()+1);if(next.toISOString().slice(0,7)!==month)throw Error('MONTH_SEQUENCE');}const all=await Member.find({active:true,joined:{$lte:month}}).session(session);const loans=await Loan.find({date:{$lte:month+'-31'}}).session(session);const payments=await Entry.find({date:{$lt:month+'-01'}}).session(session);await Month.create([{month,dues:all.map(m=>({member:m._id,amount:[...m.shares].filter(s=>s.month<=month).sort((a,b)=>b.month.localeCompare(a.month))[0]?.amount||0})),interest:loans.map(l=>({loan:l._id,amount:interest(l.amount-payments.filter(e=>String(e.loan)===String(l._id)).reduce((s,e)=>s+e.principal,0),l.rateBps)}))}],{session});await Audit.create([{actor:req.user._id,action:'OPEN_MONTH',detail:month}],{session});});res.json({ok:true});}));
app.post('/api/payments',wrap(async(req,res)=>{const b=req.body;if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||new Date(b.date).toISOString().slice(0,10)!==b.date||!b.key)throw Error('INVALID_DATE');await transact(async session=>{const month=b.date.slice(0,7);if(await Month.exists({month:{$gt:month}}).session(session))throw Error('CLOSED_HISTORY');if(!await Month.exists({month}).session(session))throw Error('MONTH_REQUIRED');if(await Entry.exists({date:{$gt:b.date}}).session(session))throw Error('CHRONOLOGY');await Member.updateOne({_id:b.member},{$inc:{__v:1}},{session});const [m]=await accounts(month,b.member,session);if(!m)throw Error('INVALID_INPUT');const contribution=money(b.contribution||0),p=money(b.principal||0),i=money(b.interest||0);allocate(m.principal,m.interest,p,i);if(contribution>m.arrears||contribution+p+i===0)throw Error('INVALID_ALLOCATION');if((p||i)&&m.loans.length!==1)throw Error('INVALID_ALLOCATION');const [entry]=await Entry.create([{key:b.key,date:b.date,month,member:m._id,loan:m.loans[0]?._id,type:'payment',contribution,principal:p,interest:i,cash:contribution+p+i,note:String(b.note||''),actor:req.user._id}],{session});await Audit.create([{actor:req.user._id,action:'PAYMENT',record:entry._id}],{session});});res.json({ok:true});}));
app.use('/api',financeRouter(transact));
app.use((err,req,res,next)=>res.status(400).json({error:err.code===11000?'DUPLICATE': /^[A-Z_]+$/.test(err.message)?err.message:'REQUEST_FAILED'}));
const server=app.listen(config.port,'0.0.0.0',()=>console.log('Committee API ready'));
let closing=false;
function shutdown(){if(closing)return;closing=true;server.close(async()=>{await mongoose.disconnect();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);










