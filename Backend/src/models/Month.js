import mongoose from 'mongoose';
import {ref,monthField,paise,options} from './fields.js';
const schema=new mongoose.Schema({month:monthField,dues:[new mongoose.Schema({member:ref('Member'),amount:paise()},{_id:false,strict:'throw'})],interest:[new mongoose.Schema({loan:ref('Loan'),amount:paise()},{_id:false,strict:'throw'})]},options);
schema.index({month:1},{unique:true});
schema.pre('validate',function(){for(const[field,key]of[['dues','member'],['interest','loan']])if(new Set(this[field].map(v=>String(v[key]))).size!==this[field].length)this.invalidate(field,'Duplicate account in monthly snapshot');});
export default mongoose.model('Month',schema);
