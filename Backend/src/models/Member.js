import mongoose from 'mongoose';
import {text,monthField,paise,options} from './fields.js';
const share=new mongoose.Schema({month:monthField,amount:paise()},{_id:false,strict:'throw'});
const schema=new mongoose.Schema({code:{type:String,required:true,trim:true,match:/^\w{3,30}$/},name:text,father:text,active:{type:Boolean,default:true},joined:monthField,shares:{type:[share],required:true,validate:v=>v.length>0&&new Set(v.map(s=>s.month)).size===v.length}},options);
schema.index({code:1},{unique:true});schema.index({active:1,joined:1});
export default mongoose.model('Member',schema);
