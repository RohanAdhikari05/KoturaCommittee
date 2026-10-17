import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicAccount} from '../src/services/publicAccount.js';
test('public member view returns financial fields without administrative or guarantee details',()=>{
 const a=publicAccount({name:'Member',code:'KK_101',principal:10000,interest:100,father:'Private',password:'secret',loans:[{guarantor:'Private'}],entries:[{date:'2026-10-18',type:'payment',contribution:100,principal:0,interest:0,cash:100,note:'Private admin note',actor:'admin',key:'secret-key'}]});
 assert.equal(a.name,'Member');assert.equal(a.principal,10000);assert.equal(a.entries[0].contribution,100);
 for(const field of ['father','password','loans'])assert.equal(field in a,false);
 for(const field of ['note','actor','key'])assert.equal(field in a.entries[0],false);
});
