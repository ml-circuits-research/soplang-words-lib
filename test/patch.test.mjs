import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, solvers } from '../tools/lib-under-test.mjs';

// a and b must come together: each alone is refused
const pair = `
@s1 core.slot of=box key=a required=true enum=1
@s2 core.slot of=box key=b required=true enum=1
@x box a=?v core.absent=b
@d1 core.deny when=$x why="a without b"
@y box b=?v2 core.absent=a
@d2 core.deny when=$y why="b without a"
`;

test('patch: values that are only valid together are found, suggested and applied together', () => {
  const w = new World();
  w.load(pair);
  assert.ok(w.tell('@b1 box').ok);
  assert.equal(w.fill('b1', 'a', '1', { dry: true }).ok, false, 'alone it is refused');
  assert.equal(w.check([{ id: 'b1', key: 'a', value: 1 }, { id: 'b1', key: 'b', value: 1 }]).ok, true, 'together it is accepted');
  assert.equal(w.get('b1').attrs.a, undefined, 'check changes nothing');
  for (const solver of [solvers.cdcl(), solvers.backtrack()]) {
    const r = w.solveReport({ solver });
    assert.deepEqual([r.status, r.assignment.map((f) => `${f.key}=${f.value}`)], ['sat', ['a=1', 'b=1']], solver.name);
  }
  assert.deepEqual(w.suggest('b1', 'a').map((c) => c.value), ['1']);
  const n = w.next();
  assert.deepEqual([n.dead, n.fills.map((f) => `${f.key}=${f.value} ${f.kind}`)], [[], ['a=1 forced', 'b=1 forced']]);
  const done = w.complete();
  assert.deepEqual([done.dead, done.filled.map((f) => f.key).sort()], [[], ['a', 'b']]);
  assert.deepEqual([w.get('b1').attrs.a, w.get('b1').attrs.b], [['1'], ['1']]);
  // the patch is one step of the history: a restored world is the same
  const again = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.deepEqual(again.get('b1').attrs, w.get('b1').attrs);
  assert.ok(w.retract('b1').ok);
});

test('patch: check and applyPatch take wires and fills, all or nothing', () => {
  const w = new World();
  w.load(pair);
  w.load('@k core.slot of=box key=size kind=integer');
  const bad = w.check({ wires: '@b2 box a=1 b=1 size=big', fills: [] });
  assert.deepEqual([bad.ok, bad.violations[0].kind], [false, 'domain']);
  assert.equal(w.applyPatch({ wires: '@b2 box  @b3 box a=1 b=1', fills: [{ id: 'b2', key: 'a', value: 1 }] }).ok, false, 'b2 would have a without b');
  assert.deepEqual([w.has('b2'), w.has('b3')], [false, false]);
  const ok = w.applyPatch({ wires: '@b2 box  @b3 box a=1 b=1', fills: [{ id: 'b2', key: 'a', value: 1 }, { id: 'b2', key: 'b', value: 1 }] });
  assert.deepEqual([ok.ok, ok.added, w.get('b2').attrs.b], [true, ['b2', 'b3'], ['1']]);
  assert.equal(w.check([{ id: 'nobody', key: 'a', value: 1 }]).violations[0].kind, 'unknown-wire');
  assert.equal(w.check([{ id: 'b2', key: 'a', value: 1 }], { budget: { steps: 0 } }).violations[0].kind, 'budget');
});

test('patch: three keys that need each other; no way out is unsat, a way out from outside is unknown', () => {
  const three = `
    @s1 core.slot of=tri key=a required=true enum=1 enum=2
    @s2 core.slot of=tri key=b required=true enum=1 enum=2
    @s3 core.slot of=tri key=c required=true enum=1 enum=2
    @x tri a=?v core.absent=b
    @d1 core.deny when=$x why="a needs b"
    @y tri b=?v core.absent=c
    @d2 core.deny when=$y why="b needs c"
    @z tri c=?v core.absent=a
    @d3 core.deny when=$z why="c needs a"
    @e tri a=?v b=?v
    @d4 core.deny when=$e why="a and b differ"
  `;
  const w = new World();
  w.load(three);
  w.load('@t1 tri');
  for (const solver of [solvers.cdcl(), solvers.backtrack()]) {
    const r = w.solveReport({ solver });
    assert.equal(r.status, 'sat', solver.name);
    assert.equal(w.check(r.assignment).ok, true);
    const [a, b] = ['a', 'b'].map((k) => r.assignment.find((f) => f.key === k).value);
    assert.notEqual(a, b);
  }
  assert.deepEqual(w.suggest('t1', 'a').map((c) => c.value).sort(), ['1', '2']);
  assert.deepEqual(w.next().dead, []);
  // closing the last door: now there really is no assignment
  w.load('@f tri a=?p c=?q\n@d5 core.deny when=$f why="never both a and c"');
  assert.equal(w.solveReport().status, 'unsat');
  assert.equal(w.solveReport({ solver: solvers.backtrack() }).status, 'unsat');
  assert.deepEqual(w.next().dead.map((o) => o.key), ['a', 'b', 'c']);
  // a required key that only an outside answer can fill: the finite part cannot prove anything
  const v = new World();
  v.load(pair + '@s3 core.slot of=box key=note required=true\n?n box a=?p b=?q core.absent=note\n@d3 core.deny when=$n why="a note is needed"');
  v.load('@b1 box');
  const r = v.solveReport();
  assert.deepEqual([r.status, typeof r.reason], ['unknown', 'string']);
  assert.deepEqual(v.next().dead, []);
});

test('patch: the solvers agree with brute force over check, on random problems with absence', () => {
  let x = 12345;
  const rnd = (n) => { x = (Math.imul(x, 1103515245) + 12345) >>> 0; return (x >>> 8) % n; };
  const keys = ['a', 'b', 'c', 'd'];
  let sat = 0, unsat = 0;
  for (let round = 0; round < 60; round++) {
    const lines = keys.map((k) => `@s_${k} core.slot of=t key=${k} required=true enum=0 enum=1`);
    const n = 6 + rnd(24);
    for (let i = 0; i < n; i++) {
      const p = keys[rnd(4)], q = keys.filter((k) => k !== p)[rnd(3)], r = keys.filter((k) => k !== p && k !== q)[rnd(2)];
      const kind = rnd(7);
      if (kind === 0) lines.push(`?p${i} t ${p}=${rnd(2)} core.absent=${q}`);                 // p=v needs q
      else if (kind === 1 || kind > 3) lines.push(`?p${i} t ${p}=${rnd(2)} ${q}=${rnd(2)}`);                // a forbidden pair
      else if (kind === 2) lines.push(`?p${i} t ${p}=?v ${q}=?v ${r}=${rnd(2)}`);               // equal values, with a third
      else lines.push(`?p${i} t ${p}=${rnd(2)} ${q}=${rnd(2)} core.absent=${r}`);
      lines.push(`@d${i} core.deny when=$p${i} why="d${i}"`);
    }
    const w = new World();
    w.load(lines.join('\n'));
    w.load('@u t');
    // every one of the 16 whole assignments, judged by the world as one patch
    const good = [];
    for (let m = 0; m < 16; m++) {
      const fills = keys.map((k, i) => ({ id: 'u', key: k, value: String((m >> i) & 1) }));
      if (w.check(fills).ok) good.push(fills.map((f) => f.value).join(''));
    }
    for (const solver of [solvers.cdcl(), solvers.backtrack()]) {
      const r = w.solveReport({ solver, budget: 100000 });
      assert.equal(r.status, good.length ? 'sat' : 'unsat', `round ${round} ${solver.name}: ${good.length} solutions\n${lines.join('\n')}`);
      if (good.length) assert.ok(good.includes(keys.map((k) => r.assignment.find((f) => f.key === k).value).join('')), `round ${round}: the answer is one of the solutions`);
    }
    // a value is suggested exactly when some solution has it
    for (const [i, k] of keys.entries()) {
      const want = [...new Set(good.map((g) => g[i]))].sort();
      assert.deepEqual(w.suggest('u', k).map((c) => c.value).sort(), want, `round ${round} key ${k}`);
    }
    if (good.length) sat++; else unsat++;
  }
  assert.ok(sat >= 8 && unsat >= 8, `${sat} satisfiable, ${unsat} unsatisfiable`);
  console.log(`# ${sat} satisfiable and ${unsat} unsatisfiable problems compared`);
});
