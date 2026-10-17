import {test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {User,Member,Loan,Month,Entry,Audit} from '../src/models/index.js';
const id=()=>new mongoose.Types.ObjectId();
const member=()=>({code:'KK_101',name:'राम कुमार',father:'सुरेश कुमार',joined:'2026-10',shares:[{month:'2026-10',amount:200000}]});
const entry=()=>({key:'request-1',member:id(),date:'2026-10-18',month:'2026-10',type:'payment',contribution:200000,cash:200000,actor:id()});

test('all six MongoDB collections have explicit models',()=>{
 assert.deepEqual([User,Member,Loan,Month,Entry,Audit].map(m=>m.collection.name),['users','members','loans','months','entries','audits']);
});
test('member schema preserves Hindi names and integer share history',async()=>{
 const m=new Member(member());await m.validate();assert.equal(m.name,'राम कुमार');
 await assert.rejects(new Member({...member(),shares:[{month:'2026-10',amount:1.5}]}).validate());
 await assert.rejects(new Member({...member(),shares:[{month:'2026-10',amount:1},{month:'2026-10',amount:2}]}).validate());
 await assert.rejects(new Member({...member(),father:''}).validate());
});
test('loan exceptions require explicit approval and full guarantee details',async()=>{
 const base={member:id(),amount:10000001,date:'2026-10-18'};
 await assert.rejects(new Loan(base).validate());
 await assert.rejects(new Loan({...base,guarantor:'Person',guarantee:'Details'}).validate());
 await new Loan({...base,guarantor:'Person',guarantee:'Details',exceptionApproved:true}).validate();
 await assert.rejects(new Loan({...base,amount:100,date:'2026-02-30'}).validate());
});
test('cash ledger validates totals, dates, signs, and reversal links',async()=>{
 await new Entry(entry()).validate();
 await assert.rejects(new Entry({...entry(),cash:199999}).validate());
 await assert.rejects(new Entry({...entry(),month:'2026-11'}).validate());
 await assert.rejects(new Entry({...entry(),principal:1.5}).validate());
 await assert.rejects(new Entry({...entry(),type:'reversal',contribution:-200000,cash:-200000}).validate());
 await new Entry({...entry(),type:'reversal',contribution:-200000,cash:-200000,reverses:id()}).validate();
});
test('monthly snapshots reject duplicate dues or loan interest',async()=>{
 const memberId=id(),loanId=id();
 await assert.rejects(new Month({month:'2026-10',dues:[{member:memberId,amount:100},{member:memberId,amount:100}]}).validate());
 await assert.rejects(new Month({month:'2026-10',interest:[{loan:loanId,amount:1},{loan:loanId,amount:1}]}).validate());
 await assert.rejects(new Month({month:'2026-13'}).validate());
});
test('passwords are excluded from normal reads and member users require a relationship',async()=>{
 assert.equal(User.schema.path('password').options.select,false);
 const password='$2a$12$'+'x'.repeat(53);
 await new User({login:'admin',password,role:'admin'}).validate();
 await assert.rejects(new User({login:'member_1',password,role:'member'}).validate());
 await assert.rejects(new User({login:'admin',password:'plain text',role:'admin'}).validate());
});
test('unique indexes protect identifiers, monthly snapshots and repeat submissions',()=>{
 const has=(m,key)=>m.schema.indexes().some(([fields,options])=>fields[key]===1&&options.unique);
 assert.ok(has(User,'login'));assert.ok(has(Member,'code'));assert.ok(has(Loan,'member'));assert.ok(has(Month,'month'));assert.ok(has(Entry,'key'));assert.ok(has(Entry,'reverses'));
});
test('only administrator roles have the singleton role constraint',()=>{
 const singleton=User.schema.indexes().find(([keys,opts])=>keys.role===1&&opts.unique);
 assert.ok(singleton);
 assert.deepEqual(singleton[1].partialFilterExpression,{role:'admin'});
});
