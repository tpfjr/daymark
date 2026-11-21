// Holiday annotations describe the nationwide calendar. Planner days off remain user choices.
function holidayBadge(date) {
  const t = new Date(date + 'T12:00:00'), year = t.getFullYear(), day = t.getDate();
  const weekday = t.getDay(), month = t.getMonth() + 1;
  const fixed = {'01-01':['🎉',"New Year’s Day"], '06-19':['✊','Juneteenth National Independence Day'],
    '07-04':['🎆','Independence Day'], '11-11':['🎖️','Veterans Day'], '12-25':['🎄','Christmas Day']};
  function fixedOn(key) { return key.endsWith('06-19') && +key.slice(0,4)<2021 ? null : fixed[key.slice(5)] }
  let item = fixedOn(date), observed = false;
  if (!item && (weekday === 5 || weekday === 1)) {
    item = fixedOn(C.shift(date,weekday === 5 ? 1 : -1)); observed = !!item;
  }
  if (!item && weekday === 1) {
    if (month===1 && year>=1986 && day>=15 && day<=21) item=['🕊️','Birthday of Martin Luther King, Jr.'];
    if (month===2 && day>=15 && day<=21) item=['🏛️','Washington’s Birthday'];
    if (month===5 && day>=25) item=['🌺','Memorial Day'];
    if (month===9 && day<=7) item=['🛠️','Labor Day'];
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
  document.querySelectorAll('[name=templateWeekday]').forEach(c=>c.checked=true);
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

function manageSimilar(date,b,action='move') {
  const dialog=$('similarDialog'),scope=$('similarScope'),operation=$('similarOperation');
  scope.value='slot';operation.value=action;
  $('similarTime').value=String(Math.floor(b.start/60)).padStart(2,'0')+':'+String(b.start%60).padStart(2,'0');
  $('similarText').value=b.imported?b.notes:entryText(b);
  function preview(){
    const rows=matchingEntries(b,date,scope.value);
    const series=rows.filter(x=>x.series).length;
    $('similarCount').textContent=(rows.length-series)+' saved blocks and '+series+' repeating schedules match.'+(scope.value==='slot'?' Only the matching weekday is affected.':'');
    $('similarTime').parentElement.hidden=operation.value!=='move';
    $('similarText').parentElement.hidden=operation.value!=='notes';
    $('applySimilar').disabled=!rows.length;
  }
  scope.onchange=operation.onchange=preview; preview();
  $('applySimilar').onclick=()=>{
    const rows=matchingEntries(b,date,scope.value);
    const newStart=$('similarTime').valueAsNumber/60000;
    if(!rows.length)return;
    if(operation.value==='move' && rows.some(({block})=>!C.timing({...block,start:newStart,end:newStart+block.end-block.start}))){
      $('similarCount').textContent='Choose a valid start time that keeps every matching block within its day.';return;
    }
    if(!confirm(operation.selectedOptions[0].text+' for '+rows.length+' matching blocks or schedules?'))return;
    mutate(()=>{
      for(const row of rows){
        let target=row.series?data.recurrences.find(r=>r.id===row.block.id):data.days[row.date].blocks.find(x=>x.id===row.block.id);
        if(row.series && row.weekday!==null && target.weekdays.length>1){
          // Split this weekday into an independent series; keep edited/skipped occurrences.
          const original=target.id;
          const split={...target,id:uid(),weekdays:[row.weekday]};
          target.weekdays=target.weekdays.filter(w=>w!==row.weekday);
          const remap=id=>{
            const origin=id.slice(-10);
            return C.isDate(origin)&&new Date(origin+'T12:00:00').getDay()===row.weekday&&id===C.occurrenceId(original,origin)
              ? C.occurrenceId(split.id,origin):id;
          };
          for(const d of Object.values(data.days)){
            d.omitted=d.omitted.map(remap);
            for(const n of d.dailyNotes)for(const link of n.links)link.id=remap(link.id);
            for(const block of d.blocks)if(block.seriesId===original&&remap(block.id)!==block.id){
              block.id=remap(block.id);block.seriesId=split.id;
            }
          }
          data.recurrences.push(split);target=split;
        }
        if(operation.value==='delete'){
          if(row.series){data.recurrences=data.recurrences.filter(r=>r.id!==target.id);for(const d of Object.values(data.days))for(const block of d.blocks)if(block.seriesId===target.id)delete block.seriesId}
          else C.removeOccurrence(data,row.date,target);
        }else if(operation.value==='notes'){if(target.imported)target.notes=$('similarText').value;else Object.assign(target,entryFields($('similarText').value))}
        else {target.end=newStart+target.end-target.start;target.start=newStart;data.start=Math.min(data.start,Math.floor(newStart/60));data.end=Math.max(data.end,Math.ceil(target.end/60))}
      }
    });
    dialog.close();if($('editor').open)$('editor').close();
  };
  dialog.showModal();
}

function clearPlannerDialog(){
  const dialog=$('clearPlannerDialog');$('clearError').textContent='';dialog.showModal();
  $('confirmClear').onclick=async()=>{
    const all=$('clearMode').value==='all';
    if(!confirm(all?'Back up and clear all planner content, including custom tasks, notes, templates and history?':'Back up and remove all scheduled blocks and repeating schedules across every date?'))return;
    $('confirmClear').disabled=true;
    try{
      const confirmedRevision=revision;await flush();const backup=await window.desktop.checkpoint();
      if(backup?.error||!backup?.result?.ok)throw Error(backup?.error||'Backup was not confirmed.');
      if(revision!==confirmedRevision)throw Error('The planner changed while backing up. Please try again.');
      mutate(()=>{
        if(all)data=C.fresh();
        else{
          data.recurrences=[];
          for(const day of Object.values(data.days)){
            day.blocks=[];day.omitted=[];
            for(const n of day.dailyNotes||[])n.links=[];
          }
        }
      });
      await flush();dialog.close();notify('Planner saved. Your pre-clear backup is in Automatic backups.');
    }catch(e){$('clearError').textContent=e.message}
    finally{$('confirmClear').disabled=false}
  };
}

function setupSelection(){
  const grid=$('grid');let drag=null;
  const status=$('selectionActions');
  function reset(){grid.querySelectorAll('.multiSelected').forEach(el=>el.classList.remove('multiSelected'));status.hidden=true}
  const observer=new MutationObserver(()=>{if(!grid.querySelector('.multiSelected'))status.hidden=true});
  observer.observe(grid,{childList:true});
  grid.addEventListener('pointerdown',e=>{
    if(!e.shiftKey||e.button!==0)return;
    e.preventDefault();e.stopPropagation();reset();drag={x:e.clientX,y:e.clientY};grid.setPointerCapture(e.pointerId);
    document.body.classList.add('selectingBlocks');
  },true);
  grid.addEventListener('pointermove',e=>{
    if(!drag)return;
    const left=Math.min(drag.x,e.clientX),top=Math.min(drag.y,e.clientY),right=Math.max(drag.x,e.clientX),bottom=Math.max(drag.y,e.clientY);
    for(const el of grid.querySelectorAll('.block,.month-event')){
      const r=el.getBoundingClientRect();el.classList.toggle('multiSelected',r.right>=left&&r.left<=right&&r.top<=bottom&&r.bottom>=top);
    }
    const count=grid.querySelectorAll('.multiSelected').length;
    status.hidden=!count;$('removeSelection').textContent='Delete '+count+' selected';
  },true);
  function finish(){drag=null;document.body.classList.remove('selectingBlocks')}
  grid.addEventListener('pointerup',finish);grid.addEventListener('pointercancel',()=>{finish();reset()});
  $('cancelSelection').onclick=reset;
  $('removeSelection').onclick=()=>{
    const rows=[...grid.querySelectorAll('.multiSelected')].map(el=>{const date=el.closest('[data-date]').dataset.date;return {date,b:C.blocks(data,date).find(b=>b.id===el.dataset.id)}});
    if(!confirm('Delete '+rows.length+' selected occurrences?'))return;
    mutate(()=>rows.forEach(({date,b})=>C.removeOccurrence(data,date,b)));reset();
  };
}
$('saveDateTemplate').onclick=()=>templateFromDate(true);
$('applyDateTemplate').onclick=()=>templateFromDate(false);
$('openDate').onclick=()=>{$('dateActions').close();view='day';render()};
$('editSimilar').onclick=()=>manageSimilar(editingDate,editing);
$('clearPlanner').onclick=clearPlannerDialog;
setupSelection();
