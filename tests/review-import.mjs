import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseCalendar} from '../calendar-import.mjs';
import C from '../ui/core.js';
import P from '../ui/planning-core.js';
const range={from:'2026-11-01',to:'2026-11-30'};
const event=(uid,start,end,extra=[])=>['BEGIN:VEVENT','UID:'+uid,'DTSTART'+start,'DTEND'+end,'SUMMARY:Meeting',...extra,'END:VEVENT'];
const parse=(...events)=>parseCalendar(['BEGIN:VCALENDAR','VERSION:2.0',...events.flat(),'END:VCALENDAR',''].join('\r\n'),range);
test('hourly occurrences and colon-prefix UIDs survive repeated updates',()=>{
  const preview=parse(event('urn:a',':20261104T090000',':20261104T093000',['RRULE:FREQ=HOURLY;COUNT=3']),event('urn:a:b',':20261104T120000',':20261104T123000'));
  const d=C.fresh();
  for(let i=0;i<2;i++){
    P.applyCalendar(d,preview,'ms',{updateMatching:true});
    assert.deepEqual(C.blocks(d,'2026-11-04').map(b=>b.start),[540,600,660,720]);
  }
});
test('invalid later time is rejected before applying any event',()=>{
  const preview=parse(event('a',':20261104T090000',':20261104T093000'));
  preview.events.push({...preview.events[0],id:'bad',date:'2026-11-05',end:0});
  const d=C.fresh(),before=C.clone(d);
  assert.throws(()=>P.applyCalendar(d,preview,'ms'));
  assert.deepEqual(d,before);
});
test('updates require opt-in and retain the existing task category',()=>{
  const d=C.fresh(),p=parse(event('a',':20261104T090000',':20261104T093000',['DESCRIPTION:new']));
  P.applyCalendar(d,p,'ms');const b=d.days['2026-11-04'].blocks[0];b.notes='local';b.cat='break';
  P.applyCalendar(d,p,'ms');assert.equal(b.notes,'local');
  P.applyCalendar(d,p,'ms',{updateMatching:true});assert.equal(b.notes,'new');assert.equal(b.cat,'break');
});
test('grouped daily notes merge individually and repeated import is stable',()=>{
  const date='2026-11-04',d=C.fresh();d.days[date]=C.emptyDay();
  d.days[date].dailyNotes.push({id:'a',originDate:date,text:'Existing',done:false,links:[]});
  const item=parse(event('notes-'+date+'@daymark.local',';VALUE=DATE:20261104',';VALUE=DATE:20261105',['DESCRIPTION:[ ] Existing (from 2026-11-04)\\n\\n[x] Different (from 2026-11-03)']));
  P.applyCalendar(d,item,'ms');P.applyCalendar(d,item,'ms');
  assert.deepEqual(d.days[date].dailyNotes.map(n=>[n.text,n.done,n.originDate]),[['Existing',false,date],['Different',true,'2026-11-03']]);
});
test('ICS exact minutes survive duplicate import and backup normalization on schema 9',()=>{
 const d=C.fresh(),p=parse(event('precise',':20261103T090500',':20261103T091300'));
 assert.equal(P.applyCalendar(d,p,'ms').added,1);assert.equal(P.applyCalendar(d,p,'ms').added,0);
 const saved=C.normalize(d);assert.equal(saved.version,9);
 assert.deepEqual(saved.days['2026-11-03'].blocks.map(b=>[b.start,b.end]),[[545,553]]);
});
test('ICS midnight splitting, exclusive all-day end, DST timezone conversion and stable re-import',()=>{
  const d=C.fresh(),p=parse(event('night',':20261125T230000',':20261126T070000'),event('off',';VALUE=DATE:20261103',';VALUE=DATE:20261105'),event('dst',';TZID=America/New_York:20261101T003000',';TZID=America/New_York:20261101T033000'));
  assert.deepEqual(p.warnings,[]);
  assert.deepEqual(p.events.filter(e=>e.uid==='night').map(e=>[e.date,e.start,e.end]),[['2026-11-25',1380,1440],['2026-11-26',0,420]]);
  assert.deepEqual(p.events.filter(e=>e.uid==='off').map(e=>e.date),['2026-11-03','2026-11-04']);
  const dst=p.events.filter(e=>e.uid==='dst'),start=new Date('2026-11-01T04:30:00Z'),end=new Date('2026-11-01T08:30:00Z');
  assert.equal(dst[0].date,C.dateKey(start));assert.equal(dst[0].start,start.getHours()*60+start.getMinutes());
  assert.equal(dst.at(-1).end,end.getHours()*60+end.getMinutes());
  P.applyCalendar(d,p,'ms');assert.equal(P.applyCalendar(d,p,'ms',{updateMatching:true}).added,0);
});
