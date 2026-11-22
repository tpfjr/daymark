const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {launch}=require('./native-harness.cjs');
(async()=>{
  const app=await launch(fs.mkdtempSync(path.join(os.tmpdir(),'daymark-boundary-'))),p=app.page;
  const date='2026-11-25',submit=()=>p.locator('#form button[type=submit]').click();
  async function reset(){
    await p.evaluate(date=>{mutate(()=>{data=C.fresh()});selected=date;view='week';render()},date);
  }
  const morning=()=>p.evaluate(()=>C.blocks(data,C.shift(selected,1)).length);
  async function night(repeat=false){
    await reset();await p.evaluate(()=>openEditor(selected,{cat:'ms',start:1380,end:420}));
    if(repeat)await p.locator('#repeat').check();await submit();
    assert.equal(await morning(),1);
    await p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));
  }
  try{
    for(const accept of [true,false]){
      await night();await p.locator('#to').selectOption('1410');
      let asked=false;p.once('dialog',d=>{asked=true;return accept?d.accept():d.dismiss()});await submit();
      assert.ok(asked,'offer choice for linked morning');assert.equal(await morning(),accept?0:1);
    }
    await night();p.once('dialog',d=>d.accept());await p.locator('#delete').click();assert.equal(await morning(),0);
    await night(true);
    assert.equal(await p.evaluate(()=>{const s=data.recurrences.find(r=>r.id.startsWith('morning:'));return 'backlogId' in s||'taskDone' in s||'reminderMinutes' in s}),false);
    await p.locator('#scope').selectOption('series');
    const dialogs=[];const confirm=d=>{dialogs.push(d.message());return d.accept()};p.on('dialog',confirm);
    await p.locator('#delete').click();p.off('dialog',confirm);assert.equal(dialogs.length,2);
    assert.equal(await p.evaluate(()=>data.recurrences.length),0);
    await night(true);p.once('dialog',d=>d.accept());await p.locator('#delete').click();
    assert.deepEqual(await p.evaluate(()=>[1,7,8].map(n=>C.blocks(data,C.shift(selected,n)).length)),[0,1,1]);

    await reset();
    assert.deepEqual(await p.evaluate(()=>{
      const raw=C.fresh();raw.version=3;raw.days[selected]=C.emptyDay();delete raw.days[selected].dailyNotes;
      const legacy=C.normalize(raw);const normalized=Array.isArray(legacy.days[selected].dailyNotes);
      mutate(()=>{data=legacy});
      mutate(()=>{
        data.recurrences.push({id:'legacy',cat:'ms',details:'Call',notes:'',start:540,end:570,startDate:selected,endDate:null,weekdays:[1,3],skipDaysOff:false});
        const split=splitWeekday(data.recurrences[0],3,'split');removeSeriesAndExceptions(split.id);
      });
      return [normalized,data.recurrences[0].weekdays];
    }),[true,[1]]);
    await reset();
    await p.locator('#heads button').first().click();await p.locator('#heads button').nth(2).click();
    await p.locator('#dateActions').waitFor();assert.equal(await p.evaluate(()=>selected),date);
    await p.locator('#dateActions').press('Escape');await p.locator('#monthView').click();
    await p.locator('[data-date="2026-11-16"] .month-date').dblclick();
    assert.deepEqual(await p.evaluate(()=>[view,selected,$('scroll').scrollTop]),['day','2026-11-16',0]);

    await reset();
    const item={date,id:'ics:review:2026-11-25T09:00:00:2026-11-25',uid:'review',start:540,end:570,title:'A meeting',notes:''};
    await p.evaluate(item=>mutate(()=>{PlannerPlanning.applyCalendar(data,{events:[item]},'ms');C.removeOccurrence(data,selected,C.blocks(data,selected)[0])}),item);
    for(const withBlock of [false,true]){
      if(withBlock)await p.evaluate(()=>mutate(()=>C.put(data,selected,{id:'another',cat:'ms',details:'',notes:'',start:600,end:620})));
      await p.locator('#dataMenu summary').first().click();await p.locator('#clearPlanner').click();p.once('dialog',d=>d.accept());
      await p.locator('#confirmClear').click();await p.waitForFunction(()=>!$('clearPlannerDialog').open);
      assert.equal(await p.evaluate(item=>{let result;mutate(()=>{result=PlannerPlanning.applyCalendar(data,{events:[item]},'ms')});return result.added},item),0);
    }
    await reset();await night();await p.locator('#cancel').click();
    await p.evaluate(()=>mutate(()=>C.put(data,selected,{id:'short',cat:'ms',details:'Read',notes:'',start:600,end:630})));
    for(const height of [700,1400]){
      await p.setViewportSize({width:1280,height});
      await p.waitForFunction(h=>innerHeight===h, height);
      await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const bounds=await p.evaluate(()=>{const s=$('scroll');return [s.scrollHeight,s.clientHeight,document.querySelector('[data-id="short"]').getBoundingClientRect().height]});
      assert.ok(bounds[2]>=14,JSON.stringify(bounds));
      if(height===700)assert.ok(bounds[0]>bounds[1]+2);else assert.ok(bounds[0]<=bounds[1]+2);
    }
    console.log('PASS linked morning choices, exclusion consistency, rapid headings, Month double-click and Fit resizing');
  }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
