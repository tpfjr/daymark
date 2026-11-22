const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {launch}=require('./native-harness.cjs');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'daymark-precise-')),app=await launch(profile),p=app.page,date='2026-11-23';
 const reset=()=>p.evaluate(date=>{mutate(()=>{data=C.fresh()});selected=date;rangeAnchor=null;view='week';render()},date);
 const submit=()=>p.locator('#form button[type=submit]').click();
 const open=()=>p.evaluate(()=>openEditor(selected,C.blocks(data,selected)[0]));
 const accept=()=>p.once('dialog',d=>d.accept());
 const similar=async op=>{await open();await p.locator('#editSimilar').click();await p.locator('#similarScope').selectOption('category');await p.locator('#similarOperation').selectOption(op)};
 try{
   await reset();await p.evaluate(()=>openEditor(selected,{cat:'ms',start:480,end:540}));
   await p.locator('#kind').selectOption('__custom');await p.locator('#customTask').fill('Studio');
   assert.equal(await p.locator('#form input[type=color]:visible').count(),1);
   await p.locator('#blockColor').fill('#a45948');await p.locator('#from').fill('07:05');await p.locator('#to').fill('07:15');
   await p.locator('#repeat').check();for(const box of await p.locator('[name=weekday]').all())await box.check();
   await submit();await p.evaluate(()=>flush());
   assert.deepEqual(await p.evaluate(()=>{const r=data.recurrences[0];return [r.start,r.end,data.categories[r.cat][1],r.allowOverlap,C.normalize(data).recurrences[0].start]}),[425,435,'#a45948',true,425]);
   await open();await p.locator('#from').fill('07:01');await submit();
   await open();await p.locator('#scope').selectOption('series');await p.locator('#from').fill('09:05');await p.locator('#to').fill('09:15');await submit();
   assert.deepEqual(await p.evaluate(()=>C.week(selected).map(d=>C.blocks(data,d).map(b=>b.start))),Array.from({length:7},()=>[545]));
   await similar('end');await p.locator('#similarEnd').fill('09:27');accept();await p.locator('#applySimilar').click();
   await similar('until');await p.locator('#similarUntil').fill('2026-11-28');accept();await p.locator('#applySimilar').click();
   assert.deepEqual(await p.evaluate(()=>[C.blocks(data,'2026-11-28')[0].end,C.blocks(data,'2026-11-29').length]),[567,0]);
   await reset();await p.evaluate(()=>mutate(()=>C.put(data,selected,{id:'studio',cat:'ms',details:'Studio',notes:'',start:900,end:960})));
   const source=p.locator('.lane[data-date="2026-11-23"] [data-id=studio] .spread.right');
   await source.scrollIntoViewIfNeeded();const r=await source.boundingBox(),lane=await p.locator('.lane[data-date="2026-11-25"]').boundingBox();
   await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(lane.x+lane.width/2,r.y+r.height/2,{steps:10});await p.mouse.up();
   assert.deepEqual(await p.evaluate(()=>[0,1,2].map(i=>C.blocks(data,C.shift(selected,i)).length)),[1,1,1]);
   await p.evaluate(()=>{dayActions(selected)});await p.locator('#saveDateTemplate').click();await p.locator('#dayTemplateName').fill('Studio day');await p.locator('#saveDayTemplate').click();
   await p.evaluate(()=>mutate(()=>{data.days['2026-11-24'].blocks=[]}));await p.locator('#templateTomorrow').click();await p.locator('#applySavedTemplate').click();await p.locator('#closeDayTemplates').click();assert.equal(await p.evaluate(()=>C.blocks(data,'2026-11-24').length),1);
   await p.evaluate(()=>dayActions('2026-11-28'));await p.locator('#anchorWeek').click();assert.deepEqual(await p.evaluate(()=>[daysVisible()[0],daysVisible().at(-1)]),['2026-11-28','2026-12-04']);
   await p.evaluate(()=>dayActions('2026-11-28'));await p.locator('#anchorMonth').click();assert.deepEqual(await p.evaluate(()=>[daysVisible()[0],daysVisible().at(-1)]),['2026-11-28','2026-12-27']);
   await p.locator('[data-date="2026-12-01"] .month-date').click();assert.deepEqual(await p.evaluate(()=>[view,selected,$('dateActions').open]),['day','2026-12-01',false]);
   await p.evaluate(()=>dayActions('2026-11-24'));accept();await p.locator('#clearDate').click();
   assert.deepEqual(await p.evaluate(()=>['2026-11-23','2026-11-24','2026-11-25'].map(d=>C.blocks(data,d).length)),[1,0,1]);
   await p.evaluate(()=>{selected='2026-11-23';view='week';render()});await p.locator('.block').first().click({modifiers:['Shift']});
   await p.locator('#selectionScope').selectOption('category');accept();await p.locator('#removeSelection').click();assert.equal(await p.locator('.block').count(),0);
   await p.evaluate(()=>mutate(()=>{for(const date of ['2026-11-23','2026-11-24','2026-11-30'])for(const cat of ['ms','break'])
     C.put(data,date,{id:cat+date,cat,details:'',notes:'',start:720,end:750})}));
   await p.locator('.block').first().click({modifiers:['Shift']});await p.locator('#selectionScope').selectOption('weekday');accept();await p.locator('#removeSelection').click();
   assert.deepEqual(await p.evaluate(()=>['2026-11-23','2026-11-24','2026-11-30'].map(d=>C.blocks(data,d).length)),[0,2,0]);
   await p.evaluate(async()=>{const r=await window.desktop.setTheme('charcoal');if(r.error)throw Error(r.error)});
   await p.waitForFunction(()=>document.documentElement.dataset.theme==='charcoal');
   console.log('PASS typed minute precision, task color, whole-series exception, bulk end and cutoff, horizontal drag, date commands, selection scope and charcoal');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
