const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {launch}=require('./native-harness.cjs');
(async()=>{
  const app=await launch(fs.mkdtempSync(path.join(os.tmpdir(),'daymark-editor-review-'))),p=app.page,d='2026-11-25';
  async function reset(){await p.evaluate(d=>{mutate(()=>{data=C.fresh()});selected=d;view='week';render()},d)}
  const submit=()=>p.locator('#form button[type=submit]').click();
  try{
    for(const repeat of [false,true]){
      await reset();await p.evaluate(()=>openEditor(selected,{cat:'ms',start:1380,end:420}));
      if(repeat)await p.locator('#repeat').check();
      await submit();
      await p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));
      if(repeat)await p.locator('#scope').selectOption('series');
      await p.locator('#to').fill('07:10');await submit();
      assert.deepEqual(await p.evaluate(()=>C.blocks(data,C.shift(selected,1)).map(b=>b.end)),[430]);
      assert.equal(await p.evaluate(()=>data.recurrences.length),repeat?2:0);
      if(repeat){
        await p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));
        await p.locator('#to').fill('06:50');await submit();
        assert.deepEqual(await p.evaluate(()=>C.blocks(data,C.shift(selected,1)).map(b=>b.end)),[410]);
        assert.deepEqual(await p.evaluate(()=>C.blocks(data,C.shift(selected,8)).map(b=>b.end)),[430]);
      }
    }
    assert.deepEqual(await p.evaluate(()=>[holidayBadge('1971-10-25').title,holidayBadge('1977-11-11'),holidayBadge('1978-11-10').title]),['Veterans Day','','Veterans Day (observed)']);
    await reset();await p.evaluate(()=>openEditor(selected,{cat:'ms',start:1320,end:0}));
    await submit();await p.evaluate(()=>flush());
    assert.deepEqual(await p.evaluate(()=>Object.values(data.days).flatMap(d=>d.blocks).map(b=>b.end)),[1440]);
    await reset();
    await p.evaluate(()=>mutate(()=>{
      data.backlog.t={id:'t',title:'Sleep',done:true,cat:'ms',notes:''};
      C.put(data,selected,{id:'evening',cat:'ms',details:'Sleep',notes:'',backlogId:'t',taskDone:true,start:1320,end:1380});
    }));
    await p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));await p.locator('#to').fill('07:00');await submit();
    assert.deepEqual(await p.evaluate(()=>{const b=C.blocks(data,C.shift(selected,1))[0];return [!!b.backlogId,'taskDone' in b,taskTemplates().filter(t=>t.section==='Used before').length]}),[false,false,0]);
    await p.evaluate(()=>{const block=document.querySelector('.block');block.classList.add('multiSelected');block.dataset.id='stale';$('removeSelection').click()});
    assert.equal(await p.evaluate(()=>C.blocks(data,selected).length),1);
    await reset();
    await p.evaluate(()=>mutate(()=>{
      const r={id:'r',cat:'ms',start:720,end:750,details:'Meeting',notes:'',weekdays:[1,3],startDate:'2026-11-01',endDate:null,skipDaysOff:false};
      data.recurrences.push(r);
      r.reminderMinutes=5;const override={...C.blocks(data,selected)[0],details:'Special agenda'};
      C.put(data,selected,override);data.days[selected].dailyNotes.push({id:'note',originDate:selected,text:'Calendar link',done:false,links:[{date:selected,id:override.id}]});
    }));
    await p.evaluate(()=>manageSimilar(selected,C.blocks(data,C.shift(selected,7))[0],'move'));
    await p.locator('#similarTime').fill('11:00');p.once('dialog',d=>d.accept());await p.locator('#applySimilar').click();
    assert.equal(await p.evaluate(()=>JSON.stringify(data).includes(C.occurrenceId('r',selected))),false);
    const planner=await p.evaluate(()=>C.normalize(data));
    const {due}=require('../reminders.cjs');
    const oldKey='2026-11-25|repeat:r:2026-11-25|720';
    assert.equal(due(planner,{enabled:true},{[oldKey]:1},new Date('2026-11-25T11:56:00')).length,0);
    assert.equal(due(planner,{enabled:true},{},new Date('2026-11-25T11:56:00')).length,1);
    await p.evaluate(()=>manageSimilar(selected,C.blocks(data,C.shift(selected,7))[0],'delete'));
    p.once('dialog',d=>d.accept());await p.locator('#applySimilar').click();
    assert.deepEqual(await p.evaluate(()=>[C.blocks(data,selected).length,C.blocks(data,C.shift(selected,-2)).length,day(selected).dailyNotes[0].links.length]),[0,1,0]);
    await reset();
    await p.locator('#heads button').nth(2).dblclick();assert.equal(await p.evaluate(()=>view),'day');
    await p.locator('#heads button').first().click();await p.locator('#saveDateTemplate').click();
    assert.deepEqual(await p.evaluate(()=>[$('templateFrom').value,$('templateThrough').value]),[d,d]);
    console.log('PASS repeated overnight edits, single occurrence override, midnight, series exceptions, link remapping and date controls');
  }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
