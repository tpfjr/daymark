const assert=require('node:assert/strict'),C=require('../ui/core.js'),{due}=require('../reminders.cjs');
const data=C.fresh(),date='2026-11-10';data.days[date]=C.emptyDay();data.days[date].blocks=[{id:'a',cat:'ms',details:'A',notes:'',start:600,end:630,reminderMinutes:15},{id:'b',cat:'ms',details:'B',notes:'',start:600,end:630}];
assert.equal(C.normalize(data).days[date].blocks[0].reminderMinutes,15,'block reminders survive storage');
assert.throws(()=>C.normalize({...data,days:{[date]:{...data.days[date],blocks:[{...data.days[date].blocks[0],reminderMinutes:-1}]}}}),/reminder/i);
assert.deepEqual(due(data,{enabled:true,minutes:60},{},new Date(date+'T09:50:00')).map(x=>x.b.id),['a'],'only configured blocks remind');
data.recurrences=[{id:'series',cat:'ms',details:'R',notes:'',start:600,end:630,startDate:date,weekdays:[2],skipDaysOff:false,reminderMinutes:0}];assert.equal(C.blocks(C.normalize(data),date).find(x=>x.seriesId).reminderMinutes,0);
let t=C.captureDayTemplate(data,date,'Test');assert.equal(t.blocks[0].reminderMinutes,15);data.dayTemplates.t=t;assert.equal(C.normalize(data).dayTemplates.t.blocks[0].reminderMinutes,15);
console.log('PASS per-block reminders validated, isolated, recurring and template roundtrip');
