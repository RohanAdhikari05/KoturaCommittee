import mongoose from 'mongoose';
import {ref,paise,dateField,options} from './fields.js';
const schema=new mongoose.Schema({member:ref('Member'),amount:paise(),date:dateField,rateBps:{type:Number,default:100,required:true,min:0,max:10000,validate:Number.isSafeInteger},guarantor:{type:String,trim:true,maxlength:500},guarantee:{type:String,trim:true,maxlength:2000},exceptionApproved:{type:Boolean,default:false}},options);
schema.index({member:1},{unique:true});schema.index({date:1});
schema.pre('validate',function(){if(this.amount<=0)this.invalidate('amount','Loan must be positive');if(this.amount>10000000&&(!this.guarantor||!this.guarantee||!this.exceptionApproved))this.invalidate('exceptionApproved','Explicit exception approval and guarantee required');});
export default mongoose.model('Loan',schema);
