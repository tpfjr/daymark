const {launch}=require('./native-harness.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'daymark-actions-'));
 const app=await launch(profile),p=app.page;
 try{
   await p.waitForFunction(()=>document.documentElement.dataset.fit==='true');
   assert(await p.locator('#leftSidebar').isHidden());
   assert(await p.locator('#rightSidebar').isHidden());
   assert.equal(await p.locator('#weekView').getAttribute('aria-pressed'),'true');
   assert(await p.evaluate(()=>{const s=document.querySelector('#scroll');return s.scrollHeight<=s.clientHeight+2}));
   await p.locator('#date').fill('2026-11-26');await p.locator('#date').dispatchEvent('change');
   assert.equal(await p.locator('#heads [title="Thanksgiving Day"]').count(),1);
   await p.locator('#heads button').nth(3).click();await p.locator('#saveDateTemplate').click();
   assert(await p.locator('#dayTemplateDialog').isVisible());await p.locator('#closeDayTemplates').click();
   await p.locator('.lane').nth(3).click({position:{x:15,y:30}});
   await p.locator('#entryNotes').fill('Sleep');await p.locator('#from').fill('23:00');await p.locator('#to').fill('07:00');
   await p.locator('#blockColor').fill('#445566');await p.locator('#form button[type=submit]').click();
   assert.deepEqual(await p.evaluate(()=>[data.days[selected].blocks[0].end,data.days[C.shift(selected,1)].blocks[0].end,data.categories.ms[1]]),[1440,420,'#445566']);
   await p.evaluate(()=>{mutate(()=>{day(selected).dailyNotes.push({id:'daily',originDate:selected,text:'Preserve me',done:false,links:[]})})});
   await p.locator('.block').first().click({button:'right'});await p.locator('#contextSimilar').click();
   await p.locator('#similarScope').selectOption('category');await p.locator('#similarOperation').selectOption('notes');await p.locator('#similarText').fill('Rest');
   p.once('dialog',d=>d.accept());await p.locator('#applySimilar').click();
   assert(await p.evaluate(()=>Object.values(data.days).flatMap(d=>d.blocks).every(b=>entryText(b)==='Rest')));
   await p.locator('#dataMenu summary').first().click();await p.locator('#clearPlanner').click();p.once('dialog',d=>d.accept());await p.locator('#confirmClear').click();
   await p.waitForFunction(()=>!document.querySelector('#clearPlannerDialog').open);
   assert.equal(await p.locator('.block').count(),0);
   assert.equal(await p.evaluate(()=>day(selected).dailyNotes[0].text),'Preserve me');
   const backup=fs.readdirSync(path.join(profile,'backups')).find(name=>name.startsWith('before-clear'));
   const state=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(profile,'backups',backup))));
   assert.equal(Object.values(state.days).flatMap(d=>d.blocks).length,2);
   await p.evaluate(()=>{mutate(()=>{data.start=8;data.end=18;const cat='ms';for(const start of [540,600])C.put(data,selected,{id:uid(),cat,details:'Test',notes:'',start,end:start+30})})});
   const first=await p.locator('.block').first().boundingBox(),last=await p.locator('.block').last().boundingBox();
   await p.keyboard.down('Shift');await p.mouse.move(first.x+4,first.y+3);await p.mouse.down();
   await p.mouse.move(last.x+10,last.y+12,{steps:5});await p.mouse.up();await p.keyboard.up('Shift');
   assert.equal(await p.locator('.multiSelected').count(),2);
   p.once('dialog',d=>d.accept());await p.locator('#removeSelection').click();assert.equal(await p.locator('.block').count(),0);
   await p.locator('#dataMenu summary').first().click();await p.locator('#clearPlanner').click();
   await p.locator('#clearMode').selectOption('all');p.once('dialog',d=>d.accept());await p.locator('#confirmClear').click();
   await p.waitForFunction(()=>!document.querySelector('#clearPlannerDialog').open);
   assert.equal(await p.evaluate(()=>Object.keys(data.days).length),0);
   await p.evaluate(()=>mutate(()=>{data.recurrences.push({id:'weekly',cat:'ms',details:'Meeting',notes:'',start:720,end:750,startDate:'2026-11-01',endDate:null,weekdays:[1,3],skipDaysOff:false})}));
   await p.locator('.block').last().click({button:'right'});await p.locator('#contextSimilar').click();await p.locator('#similarTime').fill('11:00');
   p.once('dialog',d=>d.accept());await p.locator('#applySimilar').click();
   const times=await p.evaluate(()=>['2026-11-23','2026-11-25'].map(d=>C.blocks(data,d)[0].start));assert.deepEqual(times,[720,660]);
   const folder=path.join(profile,'backups'),offline=folder+'-offline';fs.renameSync(folder,offline);fs.writeFileSync(folder,'blocked');
   try{
     await p.locator('#dataMenu summary').first().click();await p.locator('#clearPlanner').click();
     p.once('dialog',d=>d.accept());await p.locator('#confirmClear').click();await p.waitForFunction(()=>document.querySelector('#clearError').textContent);
     assert.equal(await p.evaluate(()=>data.recurrences.length),2);
   }finally{fs.unlinkSync(folder);fs.renameSync(offline,folder)}
   console.log('PASS week fit, hidden panels, holiday, date template, overnight, recolor, bulk text and real pre-clear backup');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exit(1)});
