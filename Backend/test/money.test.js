import{test}from'node:test';import assert from'node:assert/strict';import{money,interest,allocate}from'../src/services/money.js';
test('decimal amounts convert exactly to paise',()=>{assert.equal(money('0.29'),29);assert.equal(money('100000.01'),10000001);for(const bad of ['-1','NaN','1.001','1e4',''])assert.throws(()=>money(bad));});
test('monthly interest follows remaining principal without compounding',()=>{assert.equal(interest(10000000,100),100000);assert.equal(interest(8000000,100),80000);assert.equal(interest(51,100),1);});
test('explicit allocation prevents negative balances',()=>{assert.deepEqual(allocate(10000,500,2000,200),{principal:8000,interest:300});assert.throws(()=>allocate(10000,500,10001,0));assert.throws(()=>allocate(10000,500,0,501));});
