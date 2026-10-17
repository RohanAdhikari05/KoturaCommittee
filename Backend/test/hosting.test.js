import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {configureHosting} from '../src/config/hosting.js';
import {existsSync} from 'node:fs';
test('production serves frontend and SPA paths without treating API requests as HTML',{skip:!existsSync(new URL('../../frontend/dist/index.html',import.meta.url))?'Run npm run build first':false},async()=>{
 const app=express();let ready=true;
 configureHosting(app,true,()=>ready);
 app.use('/api',(req,res)=>res.status(401).json({error:'LOGIN_REQUIRED'}));
 const server=app.listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 const url=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const path of ['/','/members/history']){const r=await fetch(url+path);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);assert.match(await r.text(),/Kotura Navyuvak Sangatan Committee/);}
  const api=await fetch(url+'/api/account');assert.equal(api.status,401);assert.deepEqual(await api.json(),{error:'LOGIN_REQUIRED'});
  assert.equal((await fetch(url+'/health')).status,200);ready=false;assert.equal((await fetch(url+'/health')).status,503);
  assert.equal(app.get('trust proxy'),1);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
