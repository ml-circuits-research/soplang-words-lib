// Copy-on-write layers (src/cow.mjs) and forks that share them. The whole suite is also
// run with SOPWORLD_COW_CHECK=1 (npm test does it), which forks after every change and
// makes any write to shared state throw.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CowMap, CowSet, CowList, layer, layerList } from '../src/cow.mjs';
import { World } from '../tools/lib-under-test.mjs';

function random(seed) { return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648; }

test('cow: layered maps, sets and lists behave as plain ones, in order, and never change what they were made over', () => {
  const r = random(7);
  for (let round = 0; round < 120; round++) {
    let ref = new Map(), m = new Map(), refS = new Set(), st = new Set(), refL = [], li = [];
    const n = 20 + Math.floor(r() * 80);
    for (let i = 0; i < n; i++) { const k = `k${Math.floor(r() * 80)}`; ref.set(k, i); m.set(k, i); refS.add(k); st.add(k); refL.push(i); li.push(i); }
    const kept = []; // every generation, with what it must still hold at the end
    for (let gen = 0; gen < 25; gen++) {
      kept.push([m, JSON.stringify([...ref]), st, JSON.stringify([...refS]), li, JSON.stringify(refL)]);
      m = layer(m); st = layer(st); li = layerList(li);
      ref = new Map(ref); refS = new Set(refS); refL = [...refL];
      for (let i = 0, ops = Math.floor(r() * 30); i < ops; i++) {
        const k = `k${Math.floor(r() * 90)}`, op = r();
        if (op < 0.35) { ref.set(k, gen * 100 + i); m.set(k, gen * 100 + i); }
        else if (op < 0.6) assert.equal(m.delete(k), ref.delete(k));
        else if (op < 0.85) { if (refS.has(k)) assert.equal(st.delete(k), refS.delete(k)); else { refS.add(k); st.add(k); } }
        else { refL.push(k); li.push(k); }
      }
      assert.deepEqual([...m], [...ref]);
      assert.equal(m.size, ref.size);
      assert.deepEqual([...st], [...refS]);
      assert.equal(st.size, refS.size);
      assert.deepEqual([...li], refL);
      assert.equal(li.length, refL.length);
      assert.deepEqual(li.slice(-3), refL.slice(-3));
      assert.equal(li.at(-1), refL.at(-1));
      for (let i = 0; i < 10; i++) { const k = `k${Math.floor(r() * 90)}`; assert.equal(m.get(k), ref.get(k)); assert.equal(m.has(k), ref.has(k)); assert.equal(st.has(k), refS.has(k)); }
    }
    for (const [om, mj, os, sj, ol, lj] of kept) {
      assert.equal(JSON.stringify([...om]), mj, 'a map a layer was made over is unchanged');
      assert.equal(JSON.stringify([...os]), sj, 'a set a layer was made over is unchanged');
      assert.equal(JSON.stringify([...ol]), lj, 'a list a layer was made over is unchanged');
    }
    assert.ok(!(m instanceof CowMap) || m.depth <= 16, `chains stay short (${m.depth})`);
    assert.ok(!(st instanceof CowSet) || st.depth <= 16);
    assert.ok(!(li instanceof CowList) || li.depth <= 16);
  }
});

test('cow: forks of a large world are independent in both directions, after any number of forks and marks', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=person key=name id=true
    @k2 core.slot of=person key=age kind=integer
    @v visit who=$p
    @p person name=?n
    @seen person core.on=$p visited=yes
    @r core.rule when=$v when=$p then=$seen
  `);
  w.load(Array.from({ length: 600 }, (_, i) => `@p${i} person name=n${i}\n@v${i} visit who=$p${i}`).join('\n'));
  const before = w.toSOP({ derived: true });
  const worlds = [w];
  const r = random(3);
  for (let i = 0; i < 60; i++) {
    const from = worlds[Math.floor(r() * worlds.length)];
    const f = from.fork();
    const snapshot = from.toSOP({ derived: true });
    const id = `x${i}`;
    if (r() < 0.5) f.tell(`@${id} person name=${id}  @v${id} visit who=$${id}`);
    else f.fill(`p${Math.floor(r() * 600)}`, 'age', String(i));
    if (r() < 0.3) f.retract(`v${Math.floor(r() * 600)}`);
    assert.equal(from.toSOP({ derived: true }), snapshot, 'the world a fork came from does not see its changes');
    const g = f.fork();
    g.tell(`@g${i} person name=g${i}`);
    assert.equal(f.has(`g${i}`), false, 'nor does the fork see its own fork');
    // a fork equals a world built from scratch from its log
    if (i % 10 === 0) assert.equal(World.fromJSON(f.toJSON()).toSOP({ derived: true }), f.toSOP({ derived: true }));
    worlds.push(f);
  }
  assert.equal(w.toSOP({ derived: true }), before);
  // a mark is a fork: rewinding to it gives the state back exactly, any number of times
  const m = w.mark();
  for (let i = 0; i < 5; i++) { w.tell(`@t${i} person name=t${i}  @vt${i} visit who=$t${i}`); w.rewind(m); }
  assert.equal(w.toSOP({ derived: true }), before);
});

test('cow: rewind names exactly what a full comparison names, after any mix of changes since the mark', () => {
  const r = random(11);
  const w = new World();
  w.load(`
    @k1 core.slot of=person key=name id=true
    @k2 core.slot of=person key=age kind=integer
    @v visit who=$p
    @p person name=?n
    @seen person core.on=$p visited=yes
    @r core.rule when=$v when=$p then=$seen
    @c core.aggregate over=$v count=?c then=$t
    @t total of=visits count=?c
  `);
  w.load(Array.from({ length: 40 }, (_, i) => `@p${i} person name=n${i}\n@v${i} visit who=$p${i}`).join('\n'));
  const sorted = (d) => JSON.stringify([d.added.map((x) => x.id ?? x).sort(), d.removed.map((x) => x.id ?? x).sort(), d.changed.map((x) => `${x.id}.${x.key}`).sort()]);
  for (let round = 0; round < 40; round++) {
    const m = w.mark();
    for (let i = 0, n = 1 + Math.floor(r() * 6); i < n; i++) {
      const x = Math.floor(r() * 40), op = r();
      if (op < 0.25) w.tell(`@q${round}_${i} person name=q${round}_${i}  @w${round}_${i} visit who=$q${round}_${i}`);
      else if (op < 0.45) w.fill(`p${x}`, 'age', String(round));
      else if (op < 0.6) { if (w.has(`v${x}`)) w.retract(`v${x}`); }
      else if (op < 0.75) { if (w.get(`p${x}`)?.attrs.age) w.revise(`p${x}`, 'age', String(100 + round)); }
      else if (op < 0.85) w.applyPatch({ replace: { id: `p${x}`, attrs: { name: `n${x}`, note: `r${round}` } } });
      else if (op < 0.93) w.undo();
      else w.tell(`@sel${round}_${i} selection at=${x}`);
    }
    const expected = w.fork().diff(m.world);
    const got = w.rewind(m);
    assert.equal(sorted({ added: got.added, removed: got.removed, changed: got.changed }), sorted(expected), `round ${round}`);
    assert.equal(w.diff(m.world).same, true, 'and the world is the marked one');
  }
});
