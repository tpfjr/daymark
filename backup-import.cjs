const fs=require('node:fs/promises'),{Transform,Writable}=require('node:stream'),{pipeline}=require('node:stream/promises'),{createGunzip}=require('node:zlib');
const LIMITS=Object.freeze({compressed:32*1024*1024,expanded:64*1024*1024,timeout:30000});
function limit(bytes,message){let total=0;return new Transform({transform(chunk,encoding,done){total+=chunk.length;done(total>bytes?Object.assign(Error(message),{code:'BACKUP_LIMIT'}):null,chunk)}})}
async function readBackup(file){let handle,source,decoder,timer;try{
 handle=await fs.open(file,'r');let stat=await handle.stat();if(!stat.isFile())throw Error('Choose a regular backup file.');let header=Buffer.alloc(2);await handle.read(header,0,2,0);let compressed=/\.gz$/i.test(file)||(header[0]===31&&header[1]===139),max=compressed?LIMITS.compressed:LIMITS.expanded;
 if(stat.size>max)throw Object.assign(Error('Backup file exceeds the '+max/1024/1024+' MiB '+(compressed?'compressed ':'')+'size limit.'),{code:'BACKUP_LIMIT'});
 source=handle.createReadStream({start:0,autoClose:false});let chunks=[],total=0,sink=new Writable({write(chunk,encoding,done){chunks.push(chunk);total+=chunk.length;done()}}),streams=[source,limit(max,'Backup file grew beyond the size limit.')];
 if(compressed){decoder=createGunzip();streams.push(decoder,limit(LIMITS.expanded,'Decompressed backup exceeds the 64 MiB limit.'))}streams.push(sink);
 timer=setTimeout(()=>source.destroy(Object.assign(Error('Backup import exceeded the 30-second time limit.'),{code:'BACKUP_LIMIT'})),LIMITS.timeout);timer.unref?.();await pipeline(...streams);
 let json;try{json=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,total))}catch{throw Error('Backup contains invalid UTF-8 text.')}
 let envelope;try{envelope=JSON.parse(json)}catch{throw Error('Backup contains invalid JSON.')}
 if(!envelope||typeof envelope!=='object'||Array.isArray(envelope))throw Error('Backup must contain a valid Daymark planner or recovery export.');
 return {json,envelope};
 }catch(e){if(e.code?.startsWith('Z_'))throw Error('Backup gzip data is malformed or incomplete.');throw e}finally{clearTimeout(timer);source?.destroy();decoder?.destroy();await handle?.close()}}
async function prepareImport(file){const Core=require('./ui/core.js');let {envelope}=await readBackup(file);if(envelope.format!=='daymark-recovery')return {choices:[{key:'normal',data:Core.normalize(envelope)}]};if(envelope.formatVersion!==1)throw Error('This recovery export needs a newer version of Daymark. Update Daymark before opening it.');let choices=[],versionError;for(let [key,label]of [['confirmed','Last confirmed saved state'],['pending','Pending changes (not confirmed saved)']]){if(!envelope[key]?.state)continue;try{choices.push({key,label,data:Core.normalize(envelope[key].state)})}catch(e){if(e.code==='NEWER_VERSION')versionError=e}}if(!choices.length&&versionError)throw versionError;if(!choices.length)throw Error('This recovery export contains no valid restorable state.');return {choices}}
module.exports={readBackup,prepareImport,LIMITS};
