const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {launch} = require('./native-harness.cjs');
const {prepareImport} = require('../backup-import.cjs');
const Core = require('../ui/core.js');

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'daymark-review-'));
  const app = await launch(profile), p = app.page;
  const date = '2026-11-25', folder = path.join(profile,'backups');
  const accept = () => p.once('dialog', dialog => dialog.accept());
  async function reset(date) {
    await p.evaluate(d => {mutate(()=>{data=C.fresh()}); selected=d; view='week'; render()},date);
  }
  async function openClear(mode) {
    await p.locator('#dataMenu summary').first().click();
    await p.locator('#clearPlanner').click();
    await p.locator('#clearMode').selectOption(mode);
    accept(); await p.locator('#confirmClear').click();
  }
  async function seed() {
    await p.evaluate(d => mutate(()=>{
      const b={id:'block',cat:'custom',start:660,end:690,notes:'Agenda',details:'Meeting'};
      data.categories.custom=['Client','#654321','#aaaabb'];
      data.taskSettings.custom={archived:false,duration:30};
      C.put(data,d,b);
      data.days[d].dailyNotes.push({id:'n',originDate:d,text:'Minutes',done:true,links:[{date:d,id:b.id}]});
      data.dayTemplates.work={name:'Work day',blocks:[b]};
      data.backlog.todo={title:'Prepare',cat:'custom',notes:'Call',done:false};
      data.recurrences.push({...b,id:'series',weekdays:[3],startDate:d,endDate:null,skipDaysOff:false});
      data.completionLog.done={title:'Confirm',completedDate:d};
    }),date);
    await p.evaluate(()=>flush());
    return p.evaluate(()=>C.normalize(data));
  }
  try {
    for(const mode of ['blocks','all']) {
      await reset(date);
      const before=await seed(),snapshot=await p.evaluate(()=>JSON.stringify(data));
      const files=fs.readdirSync(folder);
      const offline=folder+'-offline';
      fs.renameSync(folder,offline);fs.writeFileSync(folder,'blocked');
      try{
        await openClear(mode);
        await p.waitForFunction(()=>document.querySelector('#clearError').textContent.length>0);
        assert.equal(await p.evaluate(()=>JSON.stringify(data)),snapshot);
        await p.locator('#clearPlannerDialog').press('Escape');
      } finally {fs.unlinkSync(folder);fs.renameSync(offline,folder)}
      await openClear(mode);
      await p.waitForFunction(()=>!document.querySelector('#clearPlannerDialog').open);
      const added=fs.readdirSync(folder).filter(f=>f.startsWith('before-clear-')&&!files.includes(f));
      assert.equal(added.length,1);
      assert.deepEqual((await prepareImport(path.join(folder,added[0]))).choices[0].data,before);
      const after=await p.evaluate(()=>C.normalize(data));
      if(mode==='all') assert.deepEqual(after,Core.normalize(Core.fresh()));
      else {
        before.days[date].blocks=[];before.days[date].dailyNotes[0].links=[];before.recurrences=[];
        assert.deepEqual(after,before);
      }
    }
    console.log('PASS both clear modes preserve full restorable checkpoints and leave every field unchanged on backup failure');

    await reset(date);
    const {parseCalendar}=await import('../calendar-import.mjs');
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:team','DTSTART:20261125T120000','DTEND:20261125T123000','SUMMARY:Meeting','DESCRIPTION:Imported agenda','END:VEVENT','END:VCALENDAR',''].join('\r\n');
    const [item]=parseCalendar(ics,{from:date,to:date}).events;
    await p.evaluate(item=>mutate(()=>{
      data.categories.twin=['Different category',...data.categories.ms.slice(1)];
      PlannerPlanning.applyCalendar(data,{events:[item]},'ms');
      const b={cat:'ms',start:720,end:750,details:'Meeting',notes:''};
      C.put(data,item.date,{...b,id:'same-color',cat:'twin'});
      C.put(data,'2026-11-26',{...b,id:'thursday'});
      data.recurrences.push({...b,id:'native',startDate:'2026-11-01',endDate:null,weekdays:[1,3],skipDaysOff:false});
    }),item);
    const open=async id=>p.evaluate(({id,d})=>openEditor(d,C.blocks(data,d).find(b=>b.id===id)),{id,d:date});
    await open(item.id);
    assert(await p.locator('#scopeField').isHidden());
    await p.locator('#editSimilar').click();await p.locator('#similarTime').fill('11:00');
    accept();await p.locator('#applySimilar').click();
    assert.deepEqual(await p.evaluate(d=>[...C.blocks(data,d).map(b=>[b.cat,b.start]),...C.blocks(data,'2026-11-26').map(b=>[b.cat,b.start])],date),
      [['ms',660],['ms',660],['twin',720],['ms',720]]);
    await open(item.id);
    await p.locator('#editSimilar').click();await p.locator('#similarScope').selectOption('category');
    await p.locator('#similarOperation').selectOption('notes');await p.locator('#similarText').fill('Updated');
    accept();await p.locator('#applySimilar').click();
    assert.equal(await p.evaluate(d=>data.days[d].blocks.find(b=>b.cat==='twin').notes,date),'');
    assert.equal(await p.evaluate(d=>data.days[d].blocks.find(b=>b.imported).notes,date),'Updated');
    const again=()=>p.evaluate(item=>{let result;mutate(()=>{result=PlannerPlanning.applyCalendar(data,{events:[item]},'ms')});return result},item);
    assert.equal((await again()).added,0);
    const nativeId=await p.evaluate(d=>C.blocks(data,d).find(b=>b.generated).id,date);
    await open(nativeId);assert(await p.locator('#scopeField').isVisible());
    await p.locator('#scope').selectOption('series');await p.locator('#entryNotes').fill('Native only');
    await p.locator('#form button[type=submit]').click();
    assert.equal(await p.evaluate(d=>data.days[d].blocks.find(b=>b.imported).notes,date),'Updated');
    // Remove the independent same-title match from the original slot before testing an identical re-import.
    await p.evaluate(d=>mutate(()=>{data.days[d].blocks.find(b=>b.id==='same-color').details='Other meeting'}),date);
    await open(item.id);await p.locator('#delete').click();
    assert.equal((await again()).added,0,'re-import revived a deleted occurrence');
    console.log('PASS same-color categories, imported and native scope, weekday split and repeated import after edits and deletion');

    await reset(date);
    await p.evaluate(date=>mutate(()=>{
      for(const id of ['one','two'])data.recurrences.push({id,cat:'ms',details:id,notes:'',start:650,end:720,weekdays:[3],startDate:'2026-11-01',endDate:null,skipDaysOff:false});
    }),date);
    const selectedId=Core.occurrenceId('one',date);
    const rect=await p.locator('.lane[data-date="'+date+'"] [data-id="'+selectedId+'"]').boundingBox();
    await p.keyboard.down('Shift');await p.mouse.move(rect.x+3,rect.y+3);await p.mouse.down();
    await p.mouse.move(rect.x+8,rect.y+8,{steps:4});await p.mouse.up();await p.keyboard.up('Shift');
    assert.equal(await p.locator('.multiSelected').count(),1);
    accept();await p.locator('#removeSelection').click();
    assert.deepEqual(await p.evaluate(d=>C.blocks(data,d).map(b=>b.seriesId),date),['two']);
    assert.deepEqual(await p.evaluate(()=>C.blocks(data,'2026-12-02').map(b=>b.seriesId)),['one','two']);
    console.log('PASS selecting one parallel occurrence leaves the other series and future occurrences in place');

    for(const [evening,morning] of [['2026-12-31','2027-01-01'],['2028-02-28','2028-02-29'],['2028-02-29','2028-03-01'],['2026-03-07','2026-03-08'],['2026-10-31','2026-11-01']]){
      await reset(evening);
      await p.evaluate(d=>openEditor(d,{cat:'ms',start:1380,end:420}),evening);
      await p.locator('#form button[type=submit]').click();
      assert.deepEqual(await p.evaluate(([a,b])=>[C.blocks(data,a)[0].end,C.blocks(data,b)[0].end,C.report(data,a,b).scheduled],[evening,morning]),[1440,420,480]);
      for(const d of [evening,morning]){
        await p.evaluate(d=>{selected=d;view='month';render()},d);
        assert.equal(await p.locator('[data-date="'+d+'"] .month-event').count(),1);
      }
      await p.locator('[data-date="'+morning+'"] .month-event').click();await p.locator('#delete').click();
      assert.equal(await p.evaluate(d=>C.blocks(data,d).length,evening),1);
    }
    await reset('2026-03-07');
    await p.evaluate(()=>openEditor(selected,{cat:'ms',start:1380,end:420}));
    await p.locator('#repeat').check();await p.locator('#skipDaysOff').check();await p.locator('#repeatEnd').fill('2026-03-14');
    await p.locator('#form button[type=submit]').click();
    assert.deepEqual(await p.evaluate(()=>data.recurrences.map(r=>[r.startDate,r.endDate,r.weekdays])),
      [['2026-03-07','2026-03-14',[6]],['2026-03-08','2026-03-15',[0]]]);
    assert.deepEqual(await p.evaluate(()=>{mutate(()=>data.daysOff.push('2026-03-08'));return ['2026-03-07','2026-03-08','2026-03-15'].map(d=>C.blocks(data,d).length)}),[1,0,1]);
    await reset('2027-12-31');
    assert.equal(await p.evaluate(()=>holidayBadge(selected).title),'New Year’s Day (observed)');
    await p.evaluate(()=>openEditor(selected,{cat:'ms',start:1380,end:1380}));
    await p.locator('#form button[type=submit]').click();assert(await p.locator('#error').innerText());
    await p.locator('#to').selectOption('1440');await p.locator('#form button[type=submit]').click();
    await p.evaluate(()=>flush());
    assert.equal(await p.evaluate(()=>C.blocks(data,'2028-01-01').length),0);
    console.log('PASS midnight, equal endpoints, overnight month/year/leap/DST dates, repeat bounds and observed holiday year edge');
  } finally {await app.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
