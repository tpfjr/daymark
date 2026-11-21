const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { test } = require('node:test');
const { PlannerStorage } = require('../storage.cjs');
const C = require('../ui/core.js');
const { prepareImport } = require('../backup-import.cjs');

function storeFor(t) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'daymark-checkpoint-'));
  const store = new PlannerStorage(profile, () => new Date('2026-11-21T12:00:00Z'));
  t.after(() => { store.close(); fs.rmSync(profile, {recursive:true, force:true}); });
  const data = C.fresh();
  data.days['2026-11-21'] = {...C.emptyDay(), blocks:[{id:'meeting',cat:'ms',start:600,end:650,details:'Meeting',notes:''}]};
  store.save(data);
  return store;
}
for (const mode of ['clear-calendar', 'clear-all']) {
  for (const fault of ['truncated', 'different valid planner']) {
    test(mode + ' refuses ' + fault, t => {
      const store = storeFor(t), before = store.read();
      store.checkpoint(mode);
      const files = fs.readdirSync(store.backups);
      store.backupNamed = name => store.atomicBackup(name, fault === 'truncated'
        ? Buffer.from([31,139]) : zlib.gzipSync(JSON.stringify(C.fresh())));
      assert.throws(() => store.checkpoint(mode), /verify|verification|verify the backup/i);
      assert.deepEqual(store.read(), before);
      assert.deepEqual(fs.readdirSync(store.backups), files);
    });
  }
}
test('fixed clock keeps the newest 20 in each pool, including old suffix format', async t => {
  const store = storeFor(t);
  for (let i=0; i<25; i++) {
    const data = store.read();
    data.days['2026-11-21'].blocks[0].notes = String(i);
    store.save(data);
    store.checkpoint('clear-all');
    store.checkpoint();
  }
  for (const prefix of ['before-clear-', 'before-restore-']) {
    const files = fs.readdirSync(store.backups).filter(f => f.startsWith(prefix));
    const values = [];
    for (const file of files) {
      const restored = await prepareImport(path.join(store.backups,file));
      values.push(Number(restored.choices[0].data.days['2026-11-21'].blocks[0].notes));
    }
    assert.deepEqual(values.sort((a,b)=>a-b), Array.from({length:20},(_,i)=>i+5));
  }
});
test('a backward clock change cannot prune the just-verified checkpoint', async t => {
  const store=storeFor(t);
  for(let i=0;i<20;i++)store.checkpoint('clear-calendar');
  store.clock=()=>new Date('2026-01-01T00:00:00Z');
  const data=store.read();
  data.days['2026-11-21'].blocks[0].notes='Last change before clear';
  store.save(data);
  store.checkpoint('clear-calendar');
  const file=fs.readdirSync(store.backups).find(f=>f.startsWith('before-clear-2026-01-01'));
  assert.ok(file);
  const restored=await prepareImport(path.join(store.backups,file));
  assert.equal(restored.choices[0].data.days['2026-11-21'].blocks[0].notes,'Last change before clear');
});
test('repeated empty clears preserve the last meaningful clear checkpoint', t => {
  const store = storeFor(t);
  store.checkpoint('clear-calendar');
  const before = fs.readdirSync(store.backups).filter(f=>f.startsWith('before-clear-'));
  assert.equal(before.length,1);
  store.save(C.fresh());
  for (let i=0; i<21; i++) {
    assert.equal(store.checkpoint('clear-calendar').empty,true);
    assert.equal(store.checkpoint('clear-all').empty,true);
  }
  assert.deepEqual(fs.readdirSync(store.backups).filter(f=>f.startsWith('before-clear-')),before);
});
