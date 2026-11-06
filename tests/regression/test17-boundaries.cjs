const assert=require('assert/strict'),{spawnSync}=require('child_process'),C=require('./daymark-desktop/ui/core.js');
if(process.argv[2]!=='child'){let r=spawnSync(process.execPath,[__filename,'child'],{timeout:2000,encoding:'utf8'});assert(!r.error,'Boundary report must terminate within 2 seconds');assert.equal(r.status,0,r.stderr);console.log(r.stdout.trim());}else{
let d=C.normalize(C.fresh());d.recurrences=[{id:'r',cat:'ms',details:'Boundary',notes:'',start:480,end:510,startDate:'9999-12-30',weekdays:[0,1,2,3,4,5,6]}];
let r=C.report(d,'9999-12-30','9999-12-31','9999-12-31');assert.equal(r.scheduled,60);assert.equal(r.rows.length,2);assert(r.rows.every(x=>C.isDate(x.date)));
assert.throws(()=>C.report(d,'1000-01-01','9999-12-31'),/range|years/i);assert.throws(()=>C.report(d,'9999-12-31','10000-01-01'),/date|range/i);assert.throws(()=>C.report(d,'2026-12-02','2026-12-01'),/range/i);
assert.equal(C.nextWorkingDay(d,'9999-12-31'),null);assert.equal(C.nextWorkingDay(d,'1000-01-01',-1),null);assert(C.week('9999-12-31').every(C.isDate));assert(C.week('1000-01-01').every(C.isDate));assert.equal(C.report(d,'1000-01-01','1000-01-01','1000-01-01').rows.length,0);
console.log('PASS 11 boundary assertions: final-year totals, bounded ranges, invalid/reversed ranges, working-day boundaries, clipped weeks, lower boundary report.');}
