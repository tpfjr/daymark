const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const C = require('../ui/core.js');
const {PlannerStorage} = require('../storage.cjs');
const {launch} = require('./native-harness.cjs');
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(),'daymark-review-'));
const date = '2027-01-25', tomorrow = C.shift(date,1);
const block = {id:'minute',cat:'ms',details:'',notes:'keep',start:545,end:548,minutePrecision:true};
function storageTest(){
 const dir=temp(),store=new PlannerStorage(dir);
 assert.equal(store.read().version,9);
 const day={...C.emptyDay(),blocks:[block]};
 const applied=store.patch({days:{[date]:day}});
 assert.equal(applied.applied.meta.version,10);
 store.patch({days:{[tomorrow]:C.emptyDay()}});
 assert.equal(store.read().version,10);
 store.close();
 const reopened=new PlannerStorage(dir);
 const saved=reopened.read();assert.equal(saved.days[date].blocks[0].start,545);
 const restored=C.normalize(JSON.parse(JSON.stringify(saved)));
 const merged=C.merge(C.fresh(),restored,()=> 'new').data;
 assert.equal(C.normalize(merged).version,10);
 assert.equal(merged.days[date].blocks[0].end,548);
 for(const meta of [{dayTemplates:{template:{name:'Test',blocks:[block]}}},{recurrences:[{...block,startDate:date,weekdays:[1],endDate:null}]}]){
   assert.equal(C.normalize({...C.fresh(),...meta}).version,10);
 }
 assert.equal(C.normalize({...C.fresh(),days:{[date]:{...day,blocks:[{...block,imported:true,minutePrecision:false}]}}}).version,9);
 assert.throws(()=>C.normalize({...saved,version:11}),{code:'NEWER_VERSION'});
 reopened.close();
}
async function desktopTest(){
 const app=await launch(temp()),p=app.page;
 const click=id=>p.locator('#'+id).click();
 const set=(id,value)=>p.locator('#'+id).fill(value);
 const submit=()=>p.locator('#form button[type=submit]').click();
 async function reset(){await p.evaluate(date=>{mutate(()=>{data=C.fresh()});selected=date;view='week';rangeAnchor=null;render()},date)}
 try {
 await reset();
 await p.evaluate(()=>openEditor(selected,{cat:'break',start:540,end:550}));await p.locator('#kind').selectOption('__custom');
 const [label,color]=await p.evaluate(()=>data.categories.ms);
 await set('customTask',label.toUpperCase());assert.equal(await p.locator('#blockColor').inputValue(),color);
 await submit();assert.equal(await p.evaluate(()=>data.categories.ms[1]),color);
 await p.evaluate(()=>dayActions('2027-01-31'));await click('anchorMonth');await click('next');
 assert.deepEqual(await p.evaluate(()=>[daysVisible()[0],daysVisible().at(-1)]),['2027-02-28','2027-03-30']);
 await click('next');assert.equal(await p.evaluate(()=>selected),'2027-03-31');await click('prev');await click('prev');assert.equal(await p.evaluate(()=>selected),'2027-01-31');
 await reset();await p.evaluate(()=>$('dayTemplates').click());
 assert.deepEqual(await p.locator('[name=templateWeekday]:checked').evaluateAll(es=>es.map(e=>+e.value)),[1,2,3,4,5]);
 await set('templateStart','23:55');await set('templateEnd','00:00');await click('templateAddBlock');
 assert.deepEqual(await p.evaluate(()=>templateDraft.map(b=>[b.start,b.end])),[[1435,1440]]);
 await click('closeDayTemplates');
 await p.evaluate(({date,block})=>mutate(()=>C.put(data,date,block)),{date,block});
 let el=p.locator('[data-id=minute]').first();await el.focus();await el.press('ArrowDown');
 assert.equal(await p.evaluate(()=>C.blocks(data,selected)[0].start),555);
 assert.ok((await el.boundingBox()).height>=10);
 const grip=el.locator('.resize:not(.resizeTop)');await grip.scrollIntoViewIfNeeded();const box=await grip.boundingBox();
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2,box.y+box.height/2+30,{steps:7});await p.mouse.up();
 assert.ok(await p.evaluate(()=>C.blocks(data,selected)[0].end>558));
 await p.evaluate(()=>{copyCalendarBlock(C.blocks(data,selected)[0],true);showPasteBlock(C.shift(selected,1),605)});await click('pasteBlock');
 assert.equal(await p.evaluate(()=>C.normalize(data).days[selected].blocks[0].start),605);
 await el.click({modifiers:['Shift']});await click('next');assert.ok(await p.locator('#selectionActions').isHidden());
 await reset();await p.evaluate(()=>mutate(()=>data.recurrences.push({id:'rec',cat:'ms',details:'',notes:'',start:540,end:570,startDate:selected,endDate:null,weekdays:[1,2,3]})));
 await p.evaluate(()=>{const b=C.blocks(data,selected)[0];moveBlock(selected,C.shift(selected,3),b,545,575)});
 await p.evaluate(date=>{const t=C.shift(date,1),b=C.blocks(data,t)[0];mutate(()=>{C.removeOccurrence(data,t,b);C.put(data,t,{...b,start:600,end:630})});openEditor(selected,C.blocks(data,selected)[0])},date);
 await p.locator('#scope').selectOption('series');await set('from','08:35');await submit();
 assert.deepEqual(await p.evaluate(d=>[0,1,2,3].map(i=>C.blocks(data,C.shift(d,i)).map(b=>b.start)),date),[[515],[600],[515],[]]);
 await p.locator('.lane[data-date="'+date+'"] .block').click({modifiers:['Shift']});
 await p.locator('#selectionScope').selectOption('weekday');let question;
 p.once('dialog',async d=>{question=d.message();await d.accept()});await click('removeSelection');
 assert.ok(question.includes(date)&&/no end date/i.test(question));
 assert.deepEqual(await p.evaluate(d=>[0,1,2,7,8].map(i=>C.blocks(data,C.shift(d,i)).length),date),[0,1,1,0,1]);
 await reset();
 await p.evaluate(d=>mutate(()=>{for(const i of [1,3])C.put(data,C.shift(d,i),{id:'edge'+i,cat:'ms',details:'',notes:'match',start:605,end:615,minutePrecision:true})}),date);
 const left=p.locator('[data-id=edge3] .spread.left');await left.scrollIntoViewIfNeeded();const edge=await left.boundingBox();
 const target=await p.locator('.lane[data-date="'+date+'"]').boundingBox();
 await p.mouse.move(edge.x+edge.width/2,edge.y+edge.height/2);await p.mouse.down();await p.mouse.move(target.x+target.width/2,edge.y+edge.height/2,{steps:8});await p.mouse.up();
 const counts=()=>p.evaluate(d=>[0,1,2,3].map(i=>C.blocks(data,C.shift(d,i)).length),date);
 assert.deepEqual(await counts(),[1,1,1,1]);await p.evaluate(()=>undo());assert.deepEqual(await counts(),[0,1,0,1]);
 const a=p.locator('[data-id=edge1]');await a.click({modifiers:['Shift']});const hit=await a.boundingBox();
 await p.keyboard.down('Shift');await p.mouse.move(hit.x+hit.width/2,hit.y+hit.height/2);await p.mouse.down();await p.mouse.move(hit.x+hit.width/2+14,hit.y+hit.height/2,{steps:5});await p.mouse.up();await p.keyboard.up('Shift');
 assert.ok(await p.locator('#selectionActions').isHidden());
 // Moving an exact-minute block using the body preserves its time offset.
 const s=await a.boundingBox(),dest=await p.locator('.lane[data-date="'+date+'"]').boundingBox();
 await p.mouse.move(s.x+s.width/2,s.y+s.height/2);await p.mouse.down();await p.mouse.move(dest.x+dest.width/2,s.y+s.height/2,{steps:8});await p.mouse.up();
 assert.deepEqual(await p.evaluate(d=>C.normalize(data).days[d].blocks.map(b=>[b.start,b.end]),date),[[605,615]]);
 await p.evaluate(()=>window.desktop.setTheme('charcoal'));await p.evaluate(()=>window.desktop.openTray());
 const tray=await app.context.waitForEvent('page',{predicate:q=>q.url().includes('tray.html'),timeout:600}).catch(()=>app.context.pages().find(q=>q.url().includes('tray.html')));
 await tray.waitForFunction(()=>document.documentElement.dataset.theme==='charcoal');
 assert.equal(await tray.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(52, 54, 58)');
 console.log('PASS reviewed calendar interactions, stored schema and charcoal tray');
 }finally{await app.close()}
}
(async()=>{storageTest();await desktopTest()})().catch(err=>{console.error(err);process.exitCode=1});
