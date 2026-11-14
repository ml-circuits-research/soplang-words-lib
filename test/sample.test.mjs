// std.sample (reviewer 14:15): random but relevant commands, legal in the current state, from
// the worlds and their knowledge; seeded; every sample works (a dry run) and, with a
// realiser and a reader, reads back to the same frame.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, sample, diversity } from '../tools/lib-under-test.mjs';

const W = `@acts core.use world=std.acts
@art std.schema.world name=art doc="an example: shapes"
@t core.type of=shape extends=std.schema.thing closed=true
@s1 core.slot of=shape key=colour enum=red enum=blue enum=green
@s2 core.slot of=shape key=size kind=integer min=1 max=5 step=1
@k std.schema.kind of=shape world=art acts=make acts=change acts=remove acts=ask
@zoo std.schema.world name=zoo doc="an example: animals from a catalog"
@any std.schema.kinds world=zoo from=k.animal acts=make acts=remove
@a1 k.animal name=cat  @a2 k.animal name=dog  @a3 k.animal name=owl`;

test('sample: legal in the current state — no remove or change before there is a thing; seeded', () => {
  const w = new World(); w.load(W);
  const r = sample(w, { seed: 1, n: 6 });
  assert.ok(r.frames.length >= 3);
  assert.ok(r.frames.every((f) => f.action === 'make'), 'an empty world: only makes');
  assert.ok(r.frames.some((f) => ['cat', 'dog', 'owl'].includes(f.args.kind)), 'kinds from the catalog the world joins');
  assert.deepEqual(sample(w, { seed: 1, n: 6 }).frames, r.frames, 'the same seed, the same samples');
  w.act({ action: 'make', args: { kind: 'shape', colour: 'red' } });
  const after = sample(w, { seed: 2, n: 10 });
  assert.ok(after.frames.some((f) => f.action !== 'make'), 'now a thing exists: change, remove, ask, undo');
  for (const f of after.frames) assert.ok(w.fork().act({ action: f.action, args: f.args }).ok, `${f.action} works`);
  for (const f of after.frames.filter((x) => x.action === 'change')) assert.ok(f.args.attr === 'colour' ? ['red', 'blue', 'green'].includes(f.args.value) : Number(f.args.value) >= 1 && Number(f.args.value) <= 5, 'legal values');
});

test('sample: actions for a selected thing (buttons); a dice; novelty; the round-trip filter', () => {
  const w = new World(); w.load(W);
  w.act({ action: 'make', args: { kind: 'shape' } });
  const buttons = sample(w, { mode: 'actions', prefer: { thing: 'shape1' }, seed: 3 });
  assert.ok(buttons.frames.length >= 2 && buttons.frames.every((f) => f.args.thing === 'shape1'), 'all about the selected thing');
  assert.equal(sample(w, { mode: 'one', seed: 4 }).frames.length, 1);
  const seen = Array.from({ length: 20 }, () => ({ action: 'make', args: { kind: 'shape' } }));
  const fresh = sample(w, { seed: 5, n: 20, seen });
  assert.ok(fresh.frames.filter((f) => f.action !== 'make').length >= fresh.frames.filter((f) => f.action === 'make').length, 'what was seen a lot weighs less');
  const realise = (f) => `${f.action} ${Object.entries(f.args).map(([k, v]) => `${k}=${v}`).join(' ')}`;
  const read = (t) => { const [action, ...rest] = t.split(' '); return { action, args: Object.fromEntries(rest.map((x) => x.split('='))) }; };
  const rt = sample(w, { seed: 6, n: 8, realise, read });
  assert.equal(rt.roundTrip, 1);
  const lossy = sample(w, { seed: 6, n: 8, realise, read: (t) => ({ ...read(t), args: {} }) });
  assert.ok(lossy.frames.every((f) => Object.keys(f.args).length === 0), 'a frame that does not read back is not kept');
  const d = diversity(sample(w, { seed: 7, n: 30 }).frames);
  assert.ok(d.acts >= 3 && d.kinds >= 3, JSON.stringify(d));
});
