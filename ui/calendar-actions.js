// Holiday annotations describe the nationwide calendar. Planner days off remain user choices.
function holidayBadge(date) {
  const t = new Date(date + 'T12:00:00'), year = t.getFullYear(), day = t.getDate();
  const weekday = t.getDay(), month = t.getMonth() + 1;
  const fixed = {'01-01':['🎉',"New Year’s Day"], '06-19':['✊','Juneteenth National Independence Day'],
    '07-04':['🎆','Independence Day'], '11-11':['🎖️','Veterans Day'], '12-25':['🎄','Christmas Day']};
  function fixedOn(key) {
    const y=Number(key.slice(0,4)),md=key.slice(5);
    if((md==='06-19'&&y<2021)||(md==='11-11'&&y<1978))return null;
    return fixed[md];
  }
  let item = fixedOn(date), observed = false;
  if (!item && (weekday === 5 || weekday === 1)) {
    item = fixedOn(C.shift(date,weekday === 5 ? 1 : -1)); observed = !!item;
  }
  if (!item && weekday === 1) {
    if (month===1 && year>=1986 && day>=15 && day<=21) item=['🕊️','Birthday of Martin Luther King, Jr.'];
    if (month===2 && day>=15 && day<=21) item=['🏛️','Washington’s Birthday'];
    if (month===5 && day>=25) item=['🌺','Memorial Day'];
    if (month===9 && day<=7) item=['🛠️','Labor Day'];
    if (month===10 && year>=1971 && year<=1977 && day>=22 && day<=28) item=fixed['11-11'];
    if (month===10 && day>=8 && day<=14) item=['🧭','Columbus Day'];
  }
  if (month===11 && weekday===4 && day>=22 && day<=28) item=['🦃','Thanksgiving Day'];
  if (!item || year<1971) return '';
  const badge=document.createElement('span');
  badge.textContent=' '+item[0]; badge.title=item[1]+(observed?' (observed)':'');
  badge.setAttribute('aria-label',badge.title); badge.setAttribute('role','img'); return badge;
}

function dayActions(date) {
  selected=date; render();
  const dialog=$('dateActions');
  $('actionDate').textContent=new Date(date+'T12:00:00').toLocaleDateString(undefined,{dateStyle:'full'});
  dialog.showModal();
}
function templateFromDate(capture) {
  $('dateActions').close(); $('dayTemplates').click();
  $('templateFrom').value=$('templateThrough').value=selected;
  templateWeekdays(selected,true);
  $('templateSkipDaysOff').checked=false; templateTargetSummary();
  if(capture){$('templateUseDay').click();$('dayTemplateName').focus()}
  else $('templateChoice').focus();
}

function matchingEntries(source,date,scope) {
  const rows=[],weekday=new Date(date+'T12:00:00').getDay();
  const matches=b=>b.cat===source.cat && (scope==='category'||b.details===source.details);
  for(const [key,day] of Object.entries(data.days)){
    for(const block of day.blocks){
      if(matches(block)&&(scope!=='slot'||(block.start===source.start&&new Date(key+'T12:00:00').getDay()===weekday)))
        rows.push({date:key,block});
    }
  }
  for(const series of data.recurrences){
    if(matches(series)&&(scope!=='slot'||(series.start===source.start&&series.weekdays.includes(weekday))))
      rows.push({series:true,block:series,weekday:scope==='slot'?weekday:null});
  }
  return rows;
}

function splitWeekday(target,weekday,id){
  const original=target.id;
  const split={...target,id,reminderSource:target.reminderSource||original,weekdays:[weekday]};
  target.weekdays=target.weekdays.filter(w=>w!==weekday);
  function remap(key){
    const origin=key.slice(-10);
    return C.isDate(origin)&&key===C.occurrenceId(original,origin)&&new Date(origin+'T12:00:00').getDay()===weekday?C.occurrenceId(id,origin):key;
  }
  for(const day of Object.values(data.days)){
    day.omitted=day.omitted.map(remap);
    for(const note of day.dailyNotes||[])for(const link of note.links)link.id=remap(link.id);
    for(const block of day.blocks)if(block.seriesId===original&&remap(block.id)!==block.id){
      block.id=remap(block.id);block.seriesId=id;
    }
  }
  data.recurrences.push(split);
  return split;
}
function manageSimilar(date,b,action='move') {
  const dialog=$('similarDialog'),scope=$('similarScope'),operation=$('similarOperation');
  scope.value='slot';operation.value=action;
  $('similarTime').value=String(Math.floor(b.start/60)).padStart(2,'0')+':'+String(b.start%60).padStart(2,'0');
  $('similarText').value=b.imported?b.notes:entryText(b);
  $('similarEnd').value=clockValue(b.end);$('similarUntil').value=data.recurrences.find(r=>r.id===b.seriesId)?.endDate||date;
  const matches=()=>matchingEntries(b,date,scope.value).filter(row=>operation.value!=='until'||row.series);
  function preview(){
    const rows=matches();
    const series=rows.filter(x=>x.series).length;
    $('similarCount').textContent=(rows.length-series)+' saved blocks and '+series+' repeating schedules match.'+(scope.value==='slot'?' Only the matching weekday is affected.':'');
    $('similarTime').parentElement.hidden=operation.value!=='move';
    $('similarEnd').parentElement.hidden=operation.value!=='end';$('similarUntil').parentElement.hidden=operation.value!=='until';
    $('similarText').parentElement.hidden=operation.value!=='notes';
    $('applySimilar').disabled=!rows.length;
  }
  scope.onchange=operation.onchange=preview; preview();
  $('applySimilar').onclick=()=>{
    const rows=matches();
    const newStart=$('similarTime').valueAsNumber/60000;
    const finish=$('similarEnd').valueAsNumber/60000, end=finish===0?1440:finish, until=$('similarUntil').value;
    if(!rows.length)return;
    if(operation.value==='end'&&rows.some(({block})=>!C.timing({...block,minutePrecision:true,end}))){$('similarCount').textContent='Choose an end time after every matching start.';return}
    if(operation.value==='until'&&(!C.isDate(until)||rows.some(({block})=>until<block.startDate))){$('similarCount').textContent='Choose a date on or after each matching series starts.';return}
    if(operation.value==='move' && rows.some(({block})=>!C.timing({...block,minutePrecision:true,start:newStart,end:newStart+block.end-block.start}))){
      $('similarCount').textContent='Choose a valid start time that keeps every matching block within its day.';return;
    }
    if(!confirm(operation.selectedOptions[0].text+' for '+rows.length+' matching blocks or schedules?'))return;
    mutate(()=>{
      for(const row of rows){
        let target=row.series?data.recurrences.find(r=>r.id===row.block.id):data.days[row.date].blocks.find(x=>x.id===row.block.id);
        if(row.series && row.weekday!==null && target.weekdays.length>1){
          const morning=data.recurrences.find(r=>r.id==='morning:'+target.id);
          const previous=(row.weekday+6)%7;
          const evening=target.id.startsWith('morning:')&&data.recurrences.find(r=>r.id===target.id.slice(8)&&r.weekdays.includes(previous));
          const newId=uid();
          if(evening&&evening.weekdays.length>1){
            splitWeekday(evening,previous,newId);
            target=splitWeekday(target,row.weekday,'morning:'+newId);
          }else if(evening){
            // The only evening weekday keeps the original morning ID. Detach the other weekdays.
            for(const weekday of [...target.weekdays])if(weekday!==row.weekday)splitWeekday(target,weekday,uid());
          }else target=splitWeekday(target,row.weekday,newId);
          const next=(row.weekday+1)%7;
          if(morning?.weekdays.includes(next)&&morning.weekdays.length>1)splitWeekday(morning,next,'morning:'+target.id);
        }
        if(operation.value==='delete'){
          if(row.series)removeSeriesAndExceptions(target.id);
          else C.removeOccurrence(data,row.date,target);
        }else if(operation.value==='until'){target.endDate=until}
        else if(operation.value==='end'){target.end=end;Object.assign(target,C.precisionFields(target.start,end));data.end=Math.max(data.end,Math.ceil(end/60))}
        else if(operation.value==='notes'){if(target.imported)target.notes=$('similarText').value;else Object.assign(target,entryFields($('similarText').value))}
        else {target.end=newStart+target.end-target.start;target.start=newStart;Object.assign(target,C.precisionFields(target.start,target.end));data.start=Math.min(data.start,Math.floor(newStart/60));data.end=Math.max(data.end,Math.ceil(target.end/60))}
      }
    });
    dialog.close();if($('editor').open)$('editor').close();
  };
  dialog.showModal();
}

function removeSeriesAndExceptions(id){
  data.recurrences=data.recurrences.filter(r=>r.id!==id);
  const exceptions=new Set();
  for(const day of Object.values(data.days)){
    for(const b of day.blocks)if(b.seriesId===id)exceptions.add(b.id);
    day.blocks=day.blocks.filter(b=>b.seriesId!==id);
  }
  const belongs=key=>exceptions.has(key)||key===C.occurrenceId(id,key.slice(-10));
  for(const day of Object.values(data.days)){
    day.omitted=day.omitted.filter(key=>!belongs(key));
    for(const note of day.dailyNotes||[])note.links=note.links.filter(link=>!belongs(link.id));
  }
}
function clearPlannerDialog(){
  const dialog=$('clearPlannerDialog');$('clearError').textContent='';dialog.showModal();
  $('confirmClear').onclick=async()=>{
    const all=$('clearMode').value==='all';
    if(!confirm(all?'Back up and clear all planner content, including custom tasks, notes, templates and history?':'Back up and remove all scheduled blocks and repeating schedules across every date?'))return;
    $('confirmClear').disabled=true;
    try{
      const confirmedRevision=revision;await flush();const backup=await window.desktop.checkpoint(all?'clear-all':'clear-calendar');
      if(backup?.error||!backup?.result?.ok)throw Error(backup?.error||'Backup was not confirmed.');
      if(revision!==confirmedRevision)throw Error('The planner changed while backing up. Please try again.');
      if(backup.result.empty){dialog.close();notify('Nothing to clear.');return}
      mutate(()=>{
        if(all)data=C.fresh();
        else{
          data.recurrences=[];
          for(const day of Object.values(data.days)){
            day.blocks=[];day.omitted=day.omitted.filter(id=>id.startsWith('ics:'));
            for(const n of day.dailyNotes||[])n.links=[];
          }
        }
      });
      await flush();dialog.close();notify('Planner saved. Your pre-clear backup is in Automatic backups.');
    }catch(e){$('clearError').textContent=e.message}
    finally{$('confirmClear').disabled=false}
  };
}

function deleteDayRows(rows){
  for(const {date,b} of rows)C.removeOccurrence(data,date,b);
  const removed=new Set(rows.map(({date,b})=>JSON.stringify([date,b.id])));
  for(const day of Object.values(data.days))for(const note of day.dailyNotes||[])
    note.links=note.links.filter(l=>!removed.has(JSON.stringify([l.date,l.id])));
}
function selectionMatches(rows,scope){
  const singles=new Map(),series=new Map();
  if(scope==='weekday'){
    const weekdays=new Set(rows.map(row=>new Date(row.date+'T12:00:00').getDay()));
    for(const [date,day] of Object.entries(data.days))if(weekdays.has(new Date(date+'T12:00:00').getDay()))
      for(const b of day.blocks)singles.set(JSON.stringify([date,b.id]),{date,b});
    for(const r of data.recurrences){
      const matched=r.weekdays.filter(w=>weekdays.has(w));if(matched.length)series.set(r.id,new Set(matched));
    }
    return {singles:[...singles.values()],series};
  }
  for(const {date,b} of rows)for(const row of matchingEntries(b,date,scope)){
    if(!row.series){singles.set(JSON.stringify([row.date,row.block.id]),{date:row.date,b:row.block});continue}
    const days=series.get(row.block.id)||new Set();
    for(const w of row.weekday===null?row.block.weekdays:[row.weekday])days.add(w);
    series.set(row.block.id,days);
  }
  return {singles:[...singles.values()],series};
}
function setupSelection(){
  const grid=$('grid');let drag=null;
  const status=$('selectionActions');
  function reset(){$('selectionScope').value='selected';$('removeSelection').textContent='Delete 0 selected';grid.querySelectorAll('.multiSelected').forEach(el=>el.classList.remove('multiSelected'));status.hidden=true}
  const observer=new MutationObserver(()=>{if(!grid.querySelector('.multiSelected'))reset()});
  observer.observe(grid,{childList:true});
  grid.addEventListener('pointerdown',e=>{
    if(!e.shiftKey||e.button!==0)return;
    e.preventDefault();e.stopPropagation();drag={x:e.clientX,y:e.clientY,initial:new Set(grid.querySelectorAll('.multiSelected')),hit:e.target.closest('.block,.month-event'),moved:false};grid.setPointerCapture(e.pointerId);
    document.body.classList.add('selectingBlocks');
  },true);
  grid.addEventListener('pointermove',e=>{
    if(!drag)return;
    if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)<4&&!drag.moved)return;drag.moved=true;
    const left=Math.min(drag.x,e.clientX),top=Math.min(drag.y,e.clientY),right=Math.max(drag.x,e.clientX),bottom=Math.max(drag.y,e.clientY);
    for(const el of grid.querySelectorAll('.block,.month-event')){
      const r=el.getBoundingClientRect();el.classList.toggle('multiSelected',drag.initial.has(el)!==(r.right>=left&&r.left<=right&&r.top<=bottom&&r.bottom>=top));
    }
    const count=grid.querySelectorAll('.multiSelected').length;
    status.hidden=!count;$('removeSelection').textContent='Delete '+count+' selected';
  },true);
  function finish(){
    if(drag&&!drag.moved&&drag.hit)drag.hit.classList.toggle('multiSelected');
    const count=grid.querySelectorAll('.multiSelected').length;status.hidden=!count;$('removeSelection').textContent='Delete '+count+' selected';
    drag=null;document.body.classList.remove('selectingBlocks')}
  grid.addEventListener('pointerup',finish);grid.addEventListener('pointercancel',()=>{finish();reset()});
  $('cancelSelection').onclick=reset;
  $('removeSelection').onclick=()=>{
    const rows=[...grid.querySelectorAll('.multiSelected')].map(el=>{const date=el.closest('[data-date]')?.dataset.date;return {date,b:date&&C.blocks(data,date).find(b=>b.id===el.dataset.id)}}).filter(row=>row.b);
    if(!rows.length){reset();return}
    const scope=$('selectionScope').value;
    const {singles,series}=scope==='selected'?{singles:rows,series:new Map()}:selectionMatches(rows,scope);
    const bounds=singles.map(row=>row.date);let openEnded=false;
    for(const r of data.recurrences)if(series.has(r.id)){bounds.push(r.startDate);if(r.endDate)bounds.push(r.endDate);else openEnded=true}
    bounds.sort();
    const span=bounds.length?' Date range: '+bounds[0]+(openEnded?' onward (no end date).':' through '+bounds.at(-1)+'.'):'';
    if(!confirm('Delete '+singles.length+' saved or selected occurrences'+(series.size?' and matching weekdays in '+series.size+' repeating schedules':'')+'?'+span))return;
    mutate(()=>{
      deleteDayRows(singles);
      for(const [id,weekdays] of series){
        const r=data.recurrences.find(r=>r.id===id);if(!r)continue;
        if(r.weekdays.every(w=>weekdays.has(w)))removeSeriesAndExceptions(id);
        else for(const w of weekdays){const split=splitWeekday(r,w,uid());removeSeriesAndExceptions(split.id)}
      }
    });$('selectionScope').value='selected';reset();
  };
}
for(const [id,period] of [['anchorWeek','week'],['anchorMonth','month']]){
  $(id).onclick=()=>{if($('dateActions').open)$('dateActions').close();startRange(selected);view=period;render();$('scroll').scrollTop=0};
}
$('clearDate').onclick=()=>{
  const rows=C.blocks(data,selected).map(b=>({date:selected,b}));
  if(rows.length&&!confirm('Delete '+rows.length+' blocks on '+selected+'? Other dates in repeating schedules stay.'))return;
  if(rows.length)mutate(()=>deleteDayRows(rows));
  $('dateActions').close();
};
$('saveDateTemplate').onclick=()=>templateFromDate(true);
$('applyDateTemplate').onclick=()=>templateFromDate(false);
$('openDate').onclick=()=>{$('dateActions').close();openCalendarDay(selected)};
$('editSimilar').onclick=()=>manageSimilar(editingDate,editing);
$('clearPlanner').onclick=clearPlannerDialog;
setupSelection();
