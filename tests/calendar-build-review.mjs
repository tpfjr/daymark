import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyBuild} from '../verify-build.mjs';
import Core from '../ui/core.js';
import Daymark112 from './regression/compatibility/Daymark-1.12.0-core.js';

const date='2027-01-25',planner=Core.fresh();
planner.days[date]={...Core.emptyDay(),blocks:[{id:'exact',cat:'ms',start:545,end:548,minutePrecision:true,notes:'',details:''}]};
const precise=Core.normalize(planner);
assert.throws(()=>Daymark112.normalize(precise),e=>e.code==='NEWER_VERSION'&&/newer version of Daymark.*schema 10/i.test(e.message));
precise.days[date].blocks=[];
assert.equal(Core.normalize(precise).version,10);
assert.equal(Daymark112.normalize(Core.normalize(Core.fresh())).version,9);

const root=fs.mkdtempSync(path.join(os.tmpdir(),'daymark-bundle-review-'));
try {
 const info=JSON.parse(fs.readFileSync('build-info.json','utf8'));
 const files=['package.json','build-info.json','storage-worker.cjs','ui/core.js','ui/calendar-worker.js',...Object.keys(info.calendarInputs||{})];
 for(const file of new Set(files)){
   const target=path.join(root,file);
   fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
 }
 verifyBuild(root);
 for(const file of ['ui/calendar-worker.js','calendar-import.mjs']){
   const target=path.join(root,file);
   fs.appendFileSync(target,'\n// stale build fixture\n');
   assert.throws(()=>verifyBuild(root),/verification failed/i);
   fs.copyFileSync(file,target);
 }
}finally{fs.rmSync(root,{recursive:true,force:true})}
console.log('PASS Daymark 1.12 downgrade message, persistent schema and calendar worker build verification');
