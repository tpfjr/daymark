import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseCalendar} from '../calendar-import.mjs';
import C from '../ui/core.js';
import P from '../ui/planning-core.js';
const text=(start,end,uid='event',more='')=>['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:'+uid,'DTSTART'+start,'DTEND'+end,'SUMMARY:Test',more,'END:VEVENT','END:VCALENDAR',''].filter(Boolean).join('\r\n');
test('blank and nonnumeric description limits default to 1000 and explicit zero is preserved',()=>{
  const from='2026-11-25',input=text(':20261125T100000',':20261125T110000','limit','DESCRIPTION:'+'a'.repeat(1010));
  for(const value of ['',null,NaN,'n/a','  ',0,20]){
    const n=value===0?0:value===20?20:1000;
    assert.equal(parseCalendar(input,{from,to:from,descriptionMode:'truncate',descriptionLimit:value}).events[0].notes,'a'.repeat(n)+' [description truncated]');
  }
});
test('all-day note deletion survives save and repeat import, even when grouped source notes reorder',()=>{
  const date='2026-11-25',range={from:date,to:date},d=C.fresh();
  const parse=(lines)=>parseCalendar(text(';VALUE=DATE:20261125',';VALUE=DATE:20261126','notes-'+date+'@daymark.local','DESCRIPTION:'+lines.map(s=>'[ ] '+s+' (from '+date+')').join('\\n\\n')),range);
  P.applyCalendar(d,parse(['A','B']),'ms');
  const day=d.days[date];P.removeDailyNote(day,day.dailyNotes[0]);
  const saved=C.normalize(d);
  P.applyCalendar(saved,parse(['B','New','A']),'ms');
  assert.deepEqual(saved.days[date].dailyNotes.map(n=>n.text),['B','New']);
  const personal={id:'ics:my-export',date,allDay:true,uid:'mine@daymark.local',noteId:'native',title:'Personal',notes:''};
  P.applyCalendar(saved,{events:[personal]},'ms');P.removeDailyNote(saved.days[date],saved.days[date].dailyNotes.at(-1));
  assert.equal(P.applyCalendar(saved,{events:[personal]},'ms').added,0);
});
test('a weekend only suppresses the morning series when that date is listed off',()=>{
  const d=C.fresh();d.recurrences=[{id:'morning:e',startDate:'2026-11-21',endDate:null,weekdays:[6],start:0,end:420,cat:'ms',details:'Sleep',notes:'',skipDaysOff:true}];
  assert.equal(C.blocks(d,'2026-11-21').length,1);
  d.daysOff.push('2026-11-21');assert.equal(C.blocks(d,'2026-11-21').length,0);
});
test('IANA timezone gap uses prior offset and repeated hour chooses first instant',()=>{
  for(const [date,time,expected,end] of [['2026-03-08','023000','2026-03-08T07:30:00Z','043000'],['2026-11-01','013000','2026-11-01T05:30:00Z','033000']]){
    const prefix=';TZID=America/New_York:'+date.replaceAll('-','')+'T';
    const result=parseCalendar(text(prefix+time,prefix+end),{from:C.shift(date,-1),to:C.shift(date,1)});
    assert.deepEqual(result.warnings,[]);
    const instant=new Date(expected);
    assert.deepEqual([result.events[0].date,result.events[0].start],[C.dateKey(instant),instant.getHours()*60+instant.getMinutes()]);
  }
});
test('overnight event with an unrepresentable segment contributes no partial entry',()=>{
  const out=parseCalendar(text(':20261125T230000',':20261126T000030'),{from:'2026-11-25',to:'2026-11-26'});
  assert.equal(out.warnings.length,1);assert.deepEqual(out.events,[]);
  const combined=text(':20261125T230000',':20261126T000030').replace('END:VCALENDAR','BEGIN:VEVENT\r\nUID:good\r\nDTSTART:20261125T100000\r\nDTEND:20261125T103000\r\nEND:VEVENT\r\nEND:VCALENDAR');
  const mixed=parseCalendar(combined,{from:'2026-11-25',to:'2026-11-26'});
  assert.deepEqual(mixed.events.map(e=>e.uid),['good']);
});
test('grouped-note truncation warns without creating fragments; checkbox-like paragraphs survive full import',()=>{
  const date='2026-11-25',d=C.fresh(),fullText='Review items\n\n[ ] buy milk';
  const input=text(';VALUE=DATE:20261125',';VALUE=DATE:20261126','notes-'+date+'@daymark.local','DESCRIPTION:[x] '+fullText.replaceAll('\n','\\n')+' (from 2026-11-22)\\n\\n[ ] Another note (from 2026-11-24)');
  const short=parseCalendar(input,{from:date,to:date,descriptionMode:'truncate',descriptionLimit:50});
  assert.ok(short.warnings.length);P.applyCalendar(d,short,'ms');assert.equal(d.days[date]?.dailyNotes.length||0,0);
  const full=parseCalendar(input,{from:date,to:date});P.applyCalendar(d,full,'ms');P.applyCalendar(d,full,'ms');
  assert.deepEqual(d.days[date].dailyNotes.map(n=>[n.text,n.done,n.originDate]),[[fullText,true,'2026-11-22'],['Another note',false,'2026-11-24']]);
});
