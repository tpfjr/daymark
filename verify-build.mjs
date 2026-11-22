import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function verifyBuild(root='.'){
 const read=file=>fs.readFileSync(path.join(root,file));
 const hash=file=>createHash('sha256').update(read(file)).digest('hex');
 const info=JSON.parse(read('build-info.json')),pkg=JSON.parse(read('package.json'));
 const inputs=info.calendarInputs||{};
 if(info.coreSha256!==hash('ui/core.js')||
    info.workerSha256!==hash('storage-worker.cjs')||
    !read('storage-worker.cjs').toString().includes('// Daymark shared core SHA256: '+info.coreSha256)||
    info.calendarSha256!==hash('ui/calendar-worker.js')||
    !inputs['calendar-worker-entry.mjs']||!inputs['package-lock.json']||
    Object.entries(inputs).some(([file,expected])=>hash(file)!==expected)||
    info.electron!==pkg.devDependencies.electron||info.version!==pkg.version){
   throw Error('Build verification failed: rebuild before packaging');
 }
 console.log('Build hashes and Electron pin verified');
 return info;
}
