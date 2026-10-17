import mongoose from 'mongoose';
import {ref,options} from './fields.js';
const schema=new mongoose.Schema({actor:ref('User'),action:{type:String,required:true,enum:['CREATE_MEMBER','OPEN_MONTH','PAYMENT','DISBURSE_LOAN','OPENING_CASH','SHARE_CHANGE','REVERSE_PAYMENT']},record:{type:mongoose.Schema.Types.ObjectId},detail:{type:String,maxlength:5000}},options);
schema.index({actor:1,createdAt:-1});schema.index({record:1,createdAt:-1});
export default mongoose.model('Audit',schema);
