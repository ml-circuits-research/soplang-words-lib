// The arbitration contract (reviewer 07:40 item 1, from PSys2's lessons): own / decline /
// refuse; the act verb claim; no schema world takes another world's sentence; the pass;
// the resolves hook.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, arbitrate } from '../tools/lib-under-test.mjs';

const TWO = `@acts core.use world=std.acts
@w1 std.schema.world name=kitchen  @w2 std.schema.world name=garden
@t1 core.type of=pot extends=std.schema.thing closed=true  @s1 core.slot of=pot key=size kind=integer min=1 max=5
@t2 core.type of=tree extends=std.schema.thing closed=true  @s2 core.slot of=tree key=height kind=integer
@t3 core.type of=bucket extends=std.schema.thing closed=true
@k1 std.schema.kind of=pot world=kitchen acts=make acts=change
@k2 std.schema.kind of=tree world=garden acts=make acts=remove
@k3 std.schema.kind of=bucket world=kitchen acts=make
@k4 std.schema.kind of=bucket world=garden acts=make`;

test("arbitrate: three verdicts; the act verb claim; no world takes another world's sentence", () => {
  const w = new World(); w.load(TWO);
  const v = (req) => Object.fromEntries(arbitrate(w, req).verdicts.map((x) => [x.world, x.verdict]));
  assert.deepEqual(v({ action: 'make', args: { kind: 'pot' } }), { kitchen: 'own', garden: 'decline' });
  assert.deepEqual(v({ action: 'remove', args: { kind: 'pot' } }), { kitchen: 'refuse', garden: 'decline' }, 'has the kind, not the act: refuse');
  assert.deepEqual(v({ action: 'make', args: { kind: 'pot', size: 9 } }), { kitchen: 'refuse', garden: 'decline' }, 'its dry run refuses');
  for (const k of w.ofType('std.schema.kind')) { // every kind's make: only its own worlds own it
    const r = arbitrate(w, { action: 'make', args: { kind: k.attrs.of[0] } });
    for (const x of r.verdicts) assert.equal(x.verdict === 'own', k.attrs.of[0] === 'bucket' || x.world === k.attrs.world[0], `${x.world} on make ${k.attrs.of[0]}`);
  }
  assert.deepEqual(arbitrate(w, { action: 'make', args: { kind: 'pot' } }).owner, 'kitchen');
});

test('arbitrate: a variant pass never refuses; resolves breaks a tie; a thing belongs to its world', () => {
  const w = new World(); w.load(TWO);
  assert.equal(arbitrate(w, { action: 'remove', args: { kind: 'pot' } }, { pass: 'spelling' }).verdicts.find((x) => x.world === 'kitchen').verdict, 'decline');
  const tie = arbitrate(w, { action: 'make', args: { kind: 'bucket' } });
  assert.deepEqual([tie.owner, tie.ambiguous], [null, ['kitchen', 'garden']]);
  assert.equal(arbitrate(w, { action: 'make', args: { kind: 'bucket' } }, { words: ['watering'], resolves: (world) => world === 'garden' }).owner, 'garden');
  w.act({ action: 'make', args: { kind: 'tree', world: 'garden' } });
  assert.equal(arbitrate(w, { action: 'remove', args: { thing: 'tree1' } }).owner, 'garden');
});
