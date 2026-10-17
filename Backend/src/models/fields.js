import mongoose from 'mongoose';
export const monthField = { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ };
export function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v; }
export const dateField = { type: String, required: true, validate: validDate };
export const text = { type: String, required: true, trim: true, maxlength: 200 };
export function paise({signed=false,defaultValue}={}) { return {type:Number,required:true,...(defaultValue!==undefined?{default:defaultValue}:{}),validate:{validator:n=>Number.isSafeInteger(n)&&Math.abs(n)<=1000000000000&&(signed||n>=0),message:'Money must be integer paise within the supported range'}}; }
export const ref = (name, required=true) => ({type:mongoose.Schema.Types.ObjectId,ref:name,required});
export const options = {timestamps:true,strict:'throw'};
