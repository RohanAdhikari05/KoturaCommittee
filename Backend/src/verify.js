import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getConfig, runtimeDirectory } from './config/runtime.js';
import * as models from './models/index.js';

try {
  const config=getConfig();
  await mongoose.connect(config.mongodbUrl,{dbName:'committee',serverSelectionTimeoutMS:10000});
  const collections={};
  for(const Model of Object.values(models)) {
    collections[Model.collection.name]={records:await Model.countDocuments(),indexes:(await Model.collection.indexes()).length};
  }
  const credentials=JSON.parse(readFileSync(path.join(runtimeDirectory,'admin-credentials.json'),'utf8'));
  const base='http://localhost:5173/api';
  const login=await fetch(base+'/admin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:5173'},body:JSON.stringify({password:credentials.password})});
  if(!login.ok)throw Error('LOGIN_CHECK_FAILED');
  const cookie=login.headers.get('set-cookie')?.split(';')[0];
  const month=new Date().toISOString().slice(0,7);
  const account=await fetch(base+'/account?month='+month,{headers:{Cookie:cookie}});
  if(!account.ok)throw Error('ACCOUNT_CHECK_FAILED');
  const statement=await account.json();
  const unauthorized=await fetch(base+'/account?month='+month);
  if(unauthorized.status!==401)throw Error('ACCESS_CHECK_FAILED');
  const publicResponse=await fetch(base+'/public/updates?month='+month);
  if(!publicResponse.ok)throw Error('PUBLIC_UPDATES_FAILED');
  const updates=await publicResponse.json();
  const directoryResponse=await fetch(base+'/public/members?month='+month);
  if(!directoryResponse.ok)throw Error('MEMBER_DIRECTORY_FAILED');
  const directory=await directoryResponse.json();
  for(const member of directory.members){if(Object.keys(member).some(k=>!['_id','name','code'].includes(k)))throw Error('MEMBER_DIRECTORY_FIELDS_FAILED');}
  if(directory.members.length){
    const response=await fetch(base+'/public/members/'+directory.members[0]._id+'?month='+month);
    if(!response.ok)throw Error('PUBLIC_ACCOUNT_FAILED');
    const view=await response.json();
    if('loans' in view||'father' in view||view.entries.some(e=>'note' in e||'actor' in e))throw Error('PUBLIC_ACCOUNT_FIELDS_FAILED');
  }
  const allowed=['month','activeMembers','monthOpen','contributionsDue','contributionsReceived'];
  if(Object.keys(updates).some(key=>!allowed.includes(key)))throw Error('PUBLIC_PRIVACY_FAILED');
  for(const endpoint of ['members','payments','loans','months','reversals','opening']){
    const denied=await fetch(base+'/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(denied.status!==401)throw Error('PUBLIC_WRITE_ACCESS_FAILED');
  }
  const singleton=(await models.User.collection.indexes()).some(i=>i.name==='one_administrator'&&i.unique&&i.partialFilterExpression?.role==='admin');
  if(!singleton)throw Error('ADMIN_INDEX_FAILED');
  console.log(JSON.stringify({database:mongoose.connection.name,collections,api:{adminPasswordLogin:'passed',account:'passed',unauthorizedAccess:'blocked',publicReadOnlyUpdates:'passed',memberNameDirectory:'passed',publicWriteAttempts:'blocked',singleAdministratorIndex:'passed',role:statement.role,memberCount:statement.members.length}},null,2));
}catch{console.error('Database/API verification failed. No connection credentials were logged.');process.exitCode=1;}
finally{await mongoose.disconnect();}


