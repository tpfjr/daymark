(function(root){const C=typeof module==='object'?require('./core.js'):root.PlannerCore;
function groupedNoteId(eventId,origin,text){
  // Legacy summaries have no constituent UIDs. Give each original note a stable identity across reordering.
  let hash=14695981039346656037n;
  for(const character of origin+'\n'+text)hash=BigInt.asUintN(64,(hash^BigInt(character.codePointAt(0)))*1099511628211n);
  return eventId+':group:'+hash.toString(16);
}
function removeDailyNote(day,note){
  const keys=[note.id];
  const legacy=/^(ics:notes-.*@daymark\.local:.*):note:\d+$/.exec(note.id);
  if(legacy)keys.push(groupedNoteId(legacy[1],note.originDate,note.text));
  for(const key of keys){const marker='ics:deleted-note:'+key;if(!day.omitted.includes(marker))day.omitted.push(marker)}
  day.dailyNotes=day.dailyNotes.filter(n=>n.id!==note.id);
}
function mergeGroupedNotes(day,item){
  let changed=false;
  const ids=new Set(day.dailyNotes.map(n=>n.id));
  for(const part of (item.notes||'').split(/(?<= \(from \d{4}-\d{2}-\d{2}\))\n\n(?=\[[ x]\] )/i)){
    if(!part.trim())continue;
    const match=/^\[([ x])\] ([\s\S]*) \(from (\d{4}-\d{2}-\d{2})\)$/i.exec(part);
    const text=match?match[2]:part,originDate=match&&C.isDate(match[3])?match[3]:item.date;
    if(day.dailyNotes.some(n=>n.text===text&&n.originDate===originDate))continue;
    const id=groupedNoteId(item.id,originDate,text);
    if(ids.has(id)||day.omitted.includes('ics:deleted-note:'+id))continue;
    ids.add(id);day.dailyNotes.push({id,text,originDate,done:match?.[1].toLowerCase()==='x',links:[]});changed=true;
  }
  return changed;
}
function importIdentity(blocks,item,allowTimeChange){
  const exact=blocks.find(b=>b.id===item.id);
  if(exact||!allowTimeChange||item.seriesOccurrence)return exact;
  const candidates=blocks.filter(b=>b.imported&&/^ics:(.*):\d{4}-\d\d-\d\d(?:T\d\d:\d\d:\d\dZ?)?:\d{4}-\d\d-\d\d$/s.exec(b.id)?.[1]===item.uid);
  return candidates.length===1?candidates[0]:null;
}
function applyCalendar(data,preview,cat,{expandHours=false,updateMatching=false}={}){if(!data.categories[cat])throw Error('Choose a task category.');const counts=new Map();
for(const item of preview.events){
  if(!C.isDate(item.date)||typeof item.title!=='string'||typeof item.id!=='string'||(item.notes!=null&&typeof item.notes!=='string')||(!item.allDay&&!C.timing({...item,imported:true})))throw Error('Invalid imported time or event on '+item.date);
  const key=JSON.stringify([item.uid,item.date]);counts.set(key,(counts.get(key)||0)+1);
}
let added=0,skipped=0,updated=0;for(let item of preview.events){let day=data.days[item.date]??=C.emptyDay();if(item.allDay){day.dailyNotes??=[];if(day.omitted.includes('ics:deleted-note:'+(item.noteId||item.id))){skipped++;continue}if(item.uid==='notes-'+item.date+'@daymark.local'){if(mergeGroupedNotes(day,item))added++;else skipped++;continue}if((item.noteId&&day.dailyNotes.some(n=>n.id===item.noteId))||day.dailyNotes.some(n=>n.id===item.id||n.text===item.title+(item.notes?'\n'+item.notes:''))){skipped++;continue}day.dailyNotes.push({id:item.noteId||item.id,text:item.noteId?(typeof item.noteText==='string'?item.noteText:item.title):item.title+(item.notes?'\n'+item.notes:''),originDate:item.noteId&&C.isDate(item.noteOrigin)?item.noteOrigin:item.date,done:item.noteId?item.noteDone===true:false,links:[]})}else{if(day.omitted.includes(item.id)){skipped++;continue}const blocks=C.blocks(data,item.date),linked=importIdentity(blocks,item,updateMatching&&counts.get(JSON.stringify([item.uid,item.date]))===1);let existing=linked||blocks.find(b=>item.uid===item.date+'-'+b.id+'@daymark.local'||(!b.id.startsWith('ics:')&&b.start===item.start&&b.end===item.end&&[C.label(data,b),b.details||data.categories[b.cat][0]].some(t=>t.trim().toLowerCase()===item.title.trim().toLowerCase())));if(existing){if(updateMatching&&linked&&existing.imported&&!existing.seriesId&&(existing.start!==item.start||existing.end!==item.end||existing.details!==item.title||existing.notes!==item.notes)){if(!C.timing({...item,imported:true}))throw Error('Invalid imported time on '+item.date);Object.assign(existing,{start:item.start,end:item.end,details:item.title,notes:item.notes});if(expandHours){data.start=Math.min(data.start,Math.floor(existing.start/60));data.end=Math.max(data.end,Math.ceil(existing.end/60))}updated++;continue}if(expandHours){data.start=Math.min(data.start,Math.floor(existing.start/60));data.end=Math.max(data.end,Math.ceil(existing.end/60))}skipped++;continue}let block={id:item.id,cat,details:item.title,notes:item.notes,start:item.start,end:item.end,imported:true,...(item.allowOverlap?{allowOverlap:true}:{})};if(!C.timing(block))throw Error('Invalid imported time on '+item.date);day.blocks.push(block);if(expandHours){data.start=Math.min(data.start,Math.floor(block.start/60));data.end=Math.max(data.end,Math.ceil(block.end/60))}}added++}return updateMatching?{added,skipped,updated}:{added,skipped}}
function applyTemplates(data,id,from,to,weekdays,uuid,skipDaysOff=false,allowOverlap){let dates=[...C.dates(from,to,366)].filter(date=>weekdays.includes(new Date(date+'T12:00:00').getDay())&&(!skipDaysOff||!C.isDayOff(data,date)));if(!dates.length)throw Error('Choose at least one day.');let result={days:dates.length,added:0,skipped:0};for(let date of dates){for(let b of data.dayTemplates[id]?.blocks||[]){data.start=Math.min(data.start,Math.floor(b.start/60));data.end=Math.max(data.end,Math.ceil(b.end/60))}let before=new Set(C.blocks(data,date).map(b=>b.id));let r=C.applyDayTemplate(data,id,date,uuid);if(typeof allowOverlap==='boolean')for(let b of data.days[date]?.blocks||[])if(!before.has(b.id)){if(allowOverlap)b.allowOverlap=true;else delete b.allowOverlap;}result.added+=r.added;result.skipped+=r.skipped}return result}
function review(data,date){let week=C.week(date).filter(C.isDate),previous=week.map(d=>C.shift(d,-7)).filter(C.isDate);function stats(dates){let report=C.report(data,dates[0],dates.at(-1)),notes=[];let unique=new Map();for(let date of dates)for(let note of data.days[date]?.dailyNotes||[]){let prior=unique.get(note.id);unique.set(note.id,{date,...note,done:note.done||prior?.done===true})}notes=[...unique.values()];return {scheduled:report.scheduled,byTask:report.byTask,backlogDone:report.backlogDone,notes,completed:notes.filter(n=>n.done).length,total:notes.length}}return {from:week[0],to:week.at(-1),current:stats(week),previous:previous.length?stats(previous):null}}
const api={applyCalendar,applyTemplates,review,removeDailyNote};if(typeof module==='object')module.exports=api;else root.PlannerPlanning=api;
})(globalThis);
