import mongoose from 'mongoose';
import {ref,options} from './fields.js';
const schema=new mongoose.Schema({displayName:{type:String,trim:true,maxlength:120},displayNameHi:{type:String,trim:true,maxlength:120},login:{type:String,required:true,trim:true,match:/^\w{3,30}$/},password:{type:String,required:true,select:false,match:/^\$2[aby]\$\d{2}\$.{53}$/},role:{type:String,required:true,enum:['admin','member']},member:ref('Member',false),active:{type:Boolean,default:true}},options);
schema.index({login:1},{unique:true});
schema.index({role:1},{unique:true,partialFilterExpression:{role:'admin'},name:'one_administrator'});
schema.index({member:1},{unique:true,partialFilterExpression:{member:{$type:'objectId'}}});
schema.pre('validate',function(){if(this.role==='member'&&!this.member)this.invalidate('member','Members require an account link');});
export default mongoose.model('User',schema);

