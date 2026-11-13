// Composition and advice (Round 23, items 5 and 6): acts that reach inside a thing ("the
// eyes of the second face"); advice at load for authors, off by default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { face } from '../examples/acts.mjs';

test('composition: an act reaches the things inside another by `in` and `in_nth`', () => {
  const w = new World();
  w.load(['@acts core.use world=std.acts', face.replace('@l.eye std.schema.limit of=eye max=2', ''), String.raw`
@pic std.schema.world name=picture
@t.face core.type of=a_face extends=std.schema.thing closed=true
@s.face.name core.slot of=a_face key=name
@k.face std.schema.kind of=a_face world=picture acts=make
@s.eye.of core.slot of=eye key=of type=a_face`].join('\n'));
  for (const n of ['Ana', 'Bo']) w.act({ action: 'make', args: { kind: 'a_face', name: n } });
  for (const f of ['a_face1', 'a_face2']) for (const side of ['left', 'right']) w.act({ action: 'make', args: { kind: 'eye', side, of: '$' + f } });
  const r = w.act({ action: 'change', args: { thing: 'eye', set: 'each', attr: 'colour', value: 'green', in: 'a_face', in_nth: 2 } });
  assert.deepEqual([r.result.things, w.get('eye1').attrs.colour, w.get('eye3').attrs.colour], [['eye3', 'eye4'], ['brown'], ['green']]);
  assert.deepEqual(w.act({ action: 'change', args: { thing: 'eye', set: 'first', attr: 'size', by: 'more', in: 'a_face1' } }).result.values, { eye1: '6' });
  assert.equal(w.act({ action: 'change', args: { thing: 'eye', attr: 'colour', value: 'blue', in: 'a_face' } }).violations[0].why, 'which a_face? there are 2');
  assert.equal(w.act({ action: 'remove', args: { thing: 'eye', in: 'a_face2' } }).violations[0].why, 'which eye? there are 2');
});

test('advice at load: a kind with the shape of another module\'s, a rule already in the standard pack; off by default', () => {
  const library = { shapes: '@shapes core.module name=shapes exports=box\n@b1 core.slot of=shapes.box key=x kind=number\n@b2 core.slot of=shapes.box key=y kind=number\n@b3 core.slot of=shapes.box key=w kind=number' };
  const text = String.raw`@u core.use world=std.relations
@m core.module name=app imports=shapes
@a1 core.slot of=card key=x kind=number
@a2 core.slot of=card key=y kind=number
@a3 core.slot of=card key=w kind=number
@kp std.relations.keep ref=?r rel=?l kept=?z
@slot2 core.rank of=$kp by=kept within=?r within=?l out=?i
@ks std.relations.keep core.on=$kp slot=?i
@mine core.rule when=$kp with=$slot2 then=$ks`;
  const w = new World({ library, advise: true });
  w.load(text);
  assert.deepEqual(w.warnings.filter((x) => x.kind === 'advice').map((x) => x.why), [
    'kind card here has the shape of shapes.box in module shapes: import it?',
    'the rule mine is already in std.relations (std.relations.slotted)',
  ]);
  const quiet = new World({ library });
  quiet.load(text);
  assert.equal(quiet.warnings.filter((x) => x.kind === 'advice').length, 0);
});
