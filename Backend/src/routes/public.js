import express from 'express';
import {Member,Month,Entry} from '../models/index.js';
import mongoose from 'mongoose';
import {accounts} from '../services/accounts.js';
import {publicAccount} from '../services/publicAccount.js';
export const publicRouter=express.Router();
publicRouter.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
publicRouter.get('/members',async(req,res,next)=>{try{
 const month=req.query.month;
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return res.status(400).json({error:'INVALID_DATE'});
 const members=await Member.find({joined:{$lte:month}}).select('_id name code').sort({name:1,code:1}).lean();
 res.json({members});
}catch(error){next(error);}});
publicRouter.get('/members/:id',async(req,res,next)=>{try{
 const month=req.query.month;
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!mongoose.isObjectIdOrHexString(req.params.id))return res.status(400).json({error:'INVALID_INPUT'});
 const exists=await Member.exists({_id:req.params.id,joined:{$lte:month}});
 if(!exists)return res.status(404).json({error:'MEMBER_NOT_FOUND'});
 const [account]=await accounts(month,req.params.id);
 res.json(publicAccount(account));
}catch(error){next(error);}});
publicRouter.get('/updates',async(req,res,next)=>{try{
 const month=req.query.month;
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return res.status(400).json({error:'INVALID_DATE'});
 const [activeMembers,snapshot,receipts]=await Promise.all([
  Member.countDocuments({active:true,joined:{$lte:month}}),
  Month.findOne({month}).select('dues.amount -_id').lean(),
  Entry.aggregate([{$match:{date:{$gte:month+'-01',$lte:month+'-31'},type:{$in:['payment','reversal']}}},{$group:{_id:null,total:{$sum:'$contribution'}}}])
 ]);
 res.set('Cache-Control','no-store').json({month,activeMembers,monthOpen:!!snapshot,contributionsDue:snapshot?.dues.reduce((s,d)=>s+d.amount,0)||0,contributionsReceived:receipts[0]?.total||0});
}catch(error){next(error);}});
