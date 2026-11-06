import {build} from 'esbuild';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const coreSha256=hash('ui/core.js');
await build({stdin:{contents:"import * as Immer from 'immer';window.Immer=Immer;",resolveDir:process.cwd()},bundle:true,minify:true,format:'iife',outfile:'ui/immer.js'});
const result=await build({entryPoints:['worker-entry.cjs'],bundle:true,platform:'node',format:'cjs',outfile:'storage-worker.cjs',external:['node:*'],metafile:true,banner:{js:'// Daymark shared core SHA256: '+coreSha256}});
if(!result.metafile.inputs['ui/core.js']||hash('ui/core.js')!==coreSha256)throw Error('Shared core changed or was not bundled');
fs.writeFileSync('build-info.json',JSON.stringify({version:JSON.parse(fs.readFileSync('package.json')).version,electron:JSON.parse(fs.readFileSync('package.json')).devDependencies.electron,coreSha256,workerSha256:hash('storage-worker.cjs')},null,2));
console.log('Shared renderer/worker core verified: '+coreSha256);

await build({entryPoints:['calendar-worker-entry.mjs'],bundle:true,platform:'browser',format:'iife',outfile:'ui/calendar-worker.js'});
