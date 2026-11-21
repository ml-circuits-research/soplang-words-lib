import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format } from '../tools/lib-under-test.mjs';
import { mechanics, family, garden, plant, procedure, clinic, meetings } from '../examples/worlds.mjs';

// Every type with its wires in ofType order and their exact values.
const snapshot = (w) => [...w.byType.keys()].sort().map((t) => t + ':' + w.ofType(t).filter((x) => x.type === t).map((x) => format(x, { canonical: true })).join(' | '))
  .filter((line) => !line.endsWith(':')).join('\n');

const scenarios = {
  family: [family, ['@e1 parent of=ana child=bogdan', '@e2 parent of=bogdan child=carla', '@e3 parent of=carla child=dan', '@e4 parent of=ana child=emil', '@e5 parent of=emil child=fay']],
  mechanics: [mechanics, ['@b1 body mass=2', '@a1 acceleration of=$b1', '@f1 force on=$b1 magnitude=10', '@b2 body mass=5', '@f2 force on=$b2 magnitude=10']],
  garden: [garden, ['@r1 rain place=lawn', '@s1 sprinkler place=lawn', '@r2 rain place=street', '@s2 sprinkler place=street']],
  plant: [plant, ['@t1 tank capacity=100', '@t2 tank capacity=50', '@r1 reading of=$t1 level=95', '@r2 reading of=$t2 level=49']],
  procedure: [procedure, ['@mix step name=mix first=true', '@bake step name=bake after=$mix', '@cool step name=cool after=$bake', '@d1 done step=$mix']],
};

// A seeded sequence of states: facts added, dropped (with what refers to them), changed (a number moved) and reordered.
function* states(facts, seed, n = 14) {
  let s = seed >>> 0;
  const rand = (k) => { s = (s * 1103515245 + 12345) >>> 0; return s % k; };
  const refs = (line) => [...line.matchAll(/\$(\S+)/g)].map((m) => m[1]);
  let cur = [];
  for (let i = 0; i < n; i++) {
    const op = rand(4), pick = facts[rand(facts.length)], id = pick.match(/^@(\S+)/)[1];
    if (op <= 1 && !cur.some((l) => l.startsWith('@' + id + ' '))) { if (refs(pick).every((r) => cur.some((l) => l.startsWith('@' + r + ' ')))) cur = [...cur, pick]; }
    else if (op === 2) { const gone = new Set([id]); for (let grew = true; grew;) { grew = false; for (const l of cur) { const lid = l.match(/^@(\S+)/)[1]; if (!gone.has(lid) && refs(l).some((r) => gone.has(r))) { gone.add(lid); grew = true; } } } cur = cur.filter((l) => !gone.has(l.match(/^@(\S+)/)[1])); }
    else cur = cur.map((l) => l.replace(/=(\d+)/, (_, d) => '=' + (Number(d) + 1 + rand(3))));
    if (rand(5) === 0) cur = [...cur].reverse();
    yield cur.join('\n');
  }
}

for (const [name, [matrix, facts]] of Object.entries(scenarios)) {
  test(`syncState: each incremental state equals its full derivation, values and order (${name})`, () => {
    const base = new World();
    base.load(matrix);
    for (let seed = 1; seed <= 6; seed++) {
      let w = base.fork();
      for (const text of states(facts, seed)) {
        const inc = w.fork(), full = base.fork();
        const a = inc.syncState(text), b = full.syncState(text);
        assert.equal(a.ok, b.ok, `${name} seed ${seed}: same verdict for\n${text}`);
        if (!a.ok) continue;
        assert.equal(snapshot(inc), snapshot(full), `${name} seed ${seed}:\n${text}`);
        w = inc;
      }
    }
  });
}

test('syncState: a changed fact is replaced in place, a dropped one retracted with what followed from it', () => {
  const base = new World();
  base.load(garden);
  const w = base.fork();
  assert.ok(w.syncState('@r1 rain place=lawn\n@r2 rain place=street').ok);
  assert.equal(w.ofType('wet').length, 2);
  assert.ok(w.syncState('@r1 rain place=lawn').ok);
  assert.equal(w.ofType('wet').length, 1);
  assert.ok(w.syncState('@r1 rain place=street').ok);
  assert.deepEqual(w.ofType('wet').map((x) => x.attrs.place[0]), ['street']);
  assert.equal(snapshot(w), snapshot((() => { const f = base.fork(); f.syncState('@r1 rain place=street'); return f; })()));
});

test('syncState: the order of a synced world does not depend on its history', () => {
  const base = new World();
  base.load(family);
  const all = ['@e1 parent of=ana child=bogdan', '@e2 parent of=bogdan child=carla', '@e3 parent of=carla child=dan'];
  const a = base.fork(); a.syncState(all.join('\n'));
  const b = base.fork(); b.syncState(all[2]); b.syncState([all[2], all[0]].join('\n')); b.syncState(all.join('\n'));
  assert.equal(snapshot(a), snapshot(b));
  assert.deepEqual(a.ofType('parent').map((x) => x.id), ['e1', 'e2', 'e3'], 'told wires in the order listed');
});

test('syncState: refused statements change nothing; ids must be unique', () => {
  const base = new World();
  base.load(procedure);
  const w = base.fork();
  assert.ok(w.syncState('@mix step name=mix first=true\n@bake step name=bake after=$mix').ok);
  const before = snapshot(w);
  const dup = [{ id: 'mix', type: 'step', attrs: { name: ['mix'] } }, { id: 'mix', type: 'step', attrs: { name: ['mix'] } }];
  assert.equal(w.syncState(dup).violations[0].kind, 'duplicate-id');
  assert.equal(w.syncState('@bake step name=bake after=$mix\n@d2 done step=$bake').ok, false, 'bake done before mix');
  assert.equal(snapshot(w), before);
});

test('syncState: a world that never synced keeps its insertion order', () => {
  const w = new World();
  w.load(clinic);
  w.load(meetings);
  assert.equal(w._syncBase, undefined);
});
