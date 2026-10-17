import express from 'express';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
export function configureHosting(app,production,isReady=()=>mongoose.connection.readyState===1){
 if(production)app.set('trust proxy',1);
 app.get('/health',(req,res)=>res.status(isReady()?200:503).json({status:isReady()?'ok':'unavailable'}));
 if(!production)return;
 const directory=fileURLToPath(new URL('../../../frontend/dist/',import.meta.url));
 const index=path.join(directory,'index.html');
 if(!existsSync(index))throw Error('Frontend build missing. Run npm run build before npm start.');
 app.use(express.static(directory,{index:false,maxAge:0}));
 app.get('*',(req,res,next)=>{
   if(req.path==='/api'||req.path.startsWith('/api/'))return next();
   res.set('Cache-Control','no-cache').sendFile(index);
 });
}
