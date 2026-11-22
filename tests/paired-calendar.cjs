const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {launch}=require('./native-harness.cjs');
(async()=>{
  const app=await launch(fs.mkdtempSync(path.join(os.tmpdir(),'daymark-pair-'))),p=app.page;
  const submit=()=>p.locator('#form button[type=submit]').click();
  const reset=()=>p.evaluate(()=>{mutate(()=>{data=C.fresh()});selected='2026-11-23';view='week';render()});
  async function night(repeat=false){
    await reset();await p.evaluate(()=>openEditor(selected,{cat:'ms',start:1380,end:420}));
    if(repeat){await p.locator('#repeat').check();await p.locator('[name=weekday][value="3"]').check()}
    await submit();
  }
  try{
    await night(true);
    await p.evaluate(()=>{const d=C.shift(selected,1);manageSimilar(d,C.blocks(data,d)[0],'move')});
    await p.locator('#similarTime').fill('00:30');p.once('dialog',d=>d.accept());await p.locator('#applySimilar').click();
    assert.deepEqual(await p.evaluate(()=>C.blocks(data,C.shift(selected,1)).map(b=>b.start)),[30]);
    await p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));await p.locator('#scope').selectOption('series');
    await p.locator('#to').fill('07:10');await submit();
    assert.deepEqual(await p.evaluate(()=>[1,3].map(n=>C.blocks(data,C.shift(selected,n)).map(b=>[b.start,b.end]))),[[[0,430]],[[0,420]]]);
    for(const repeat of [false,true]){
      await night(repeat);await p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));
      await p.locator('#entryDate').fill('2026-11-27');await submit();
      assert.deepEqual(await p.evaluate(()=>['2026-11-24','2026-11-28'].map(d=>C.blocks(data,d).length)),[0,1]);
      if(repeat)assert.equal(await p.evaluate(()=>C.blocks(data,'2026-12-01').length),1);
    }
    for(const action of ['context','resize']){
      await night();await p.evaluate(()=>setCalendarDensity('spacious'));
      const lane=p.locator('.lane[data-date="2026-11-23"]'),block=lane.locator('.block');
      let prompted=false;p.once('dialog',d=>{prompted=d.message().includes('morning');return d.accept()});
      if(action==='context'){
        await block.click({button:'right'});await p.locator('#contextDelete').click();
      }else{
        const grip=block.locator('.resize:not(.resizeTop)');await grip.scrollIntoViewIfNeeded();const rect=await grip.boundingBox();
        const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
        await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x,y-72,{steps:6});await p.mouse.up();
      }
      assert.ok(prompted,action);assert.equal(await p.evaluate(()=>C.blocks(data,'2026-11-24').length),0);
    }
    await reset();await p.evaluate(()=>mutate(()=>{data.daysOff=['2026-11-26'];data.start=0;data.end=24;
      C.put(data,selected,{id:'tiny',cat:'ms',details:'Quick task',notes:'',start:60,end:70})}));
    await p.evaluate(()=>setCalendarDensity('fit'));await p.setViewportSize({width:1280,height:700});await p.locator('#monthView').click();
    const holiday=/Thanksgiving Day.*day off|day off.*Thanksgiving Day/i;
    assert.match(await p.locator('[data-date="2026-11-26"] .month-date').getAttribute('aria-label'),holiday);
    await p.locator('#weekView').click();assert.match(await p.locator('#heads button').nth(3).getAttribute('aria-label'),holiday);
    assert.deepEqual(await p.evaluate(()=>{const g=$('grid'),s=$('scroll'),b=g.querySelector('[data-id="tiny"]');return [b.getBoundingClientRect().height>=14,s.scrollHeight>s.clientHeight,Math.abs(s.scrollHeight-g.offsetHeight-$('heads').offsetHeight)<4]}),[true,true,true]);
    const count=await p.evaluate(()=>{const date=selected,item={id:'ics:event:'+date,uid:'event',date,title:'Holiday booking',notes:'',allDay:true};
      mutate(()=>PlannerPlanning.applyCalendar(data,{events:[item]},'ms'));
      notesAction({action:'delete',date,id:item.id});
      mutate(()=>PlannerPlanning.applyCalendar(data,{events:[item]},'ms'));
      return data.days[date].dailyNotes.length});
    assert.equal(count,0);
    console.log('PASS linked weekday splits, date moves, context delete, drag resize, short Fit rows, accessible dates and deleted imported notes');
  }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
