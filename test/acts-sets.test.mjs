// Sets and values in acts (Round 21, item 5): each, all, the first, the last; random,
// different, same as X; one undo step for the whole set.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const make = () => {
  const w = new World();
  w.load(String.raw`@acts core.use world=std.acts
@g std.schema.world name=garage
@t core.type of=car extends=std.schema.thing closed=true
@s core.slot of=car key=colour enum=red enum=blue enum=green enum=black default=black
@n core.slot of=car key=name
@k std.schema.kind of=car world=garage acts=make acts=change acts=remove`);
  for (let i = 0; i < 3; i++) w.act({ action: 'make', args: { kind: 'car' } });
  return w;
};
const colours = (w) => ['car1', 'car2', 'car3'].filter((i) => w.has(i)).map((i) => w.get(i).attrs.colour[0]);
const change = (w, args) => w.act({ action: 'change', args });

test('sets: each, all, the first, the last; the whole set is one undo step', () => {
  const w = make();
  change(w, { thing: 'car', set: 'first', attr: 'colour', value: 'red' });
  change(w, { thing: 'car', set: 'last', attr: 'colour', value: 'green' });
  assert.deepEqual(colours(w), ['red', 'black', 'green']);
  const r = change(w, { thing: 'car', set: 'each', attr: 'colour', value: 'blue' });
  assert.deepEqual([r.result.things, colours(w)], [['car1', 'car2', 'car3'], ['blue', 'blue', 'blue']]);
  w.undo();
  assert.deepEqual(colours(w), ['red', 'black', 'green']);
  assert.deepEqual(w.act({ action: 'remove', args: { thing: 'car', set: 'all' } }).result.things, ['car1', 'car2', 'car3']);
  assert.equal(w.ofType('car').length, 0);
});

test('values: random (from the slot), different (none the same, none as it was), same as another', () => {
  const w = make();
  const r = change(w, { thing: 'car', set: 'each', attr: 'colour', value: 'random' });
  assert.ok(Object.values(r.result.values).every((v) => ['red', 'blue', 'green', 'black'].includes(v)));
  const d = change(w, { thing: 'car', set: 'each', attr: 'colour', value: 'different' });
  const vs = Object.values(d.result.values);
  assert.equal(new Set(vs).size, 3, 'three different colours');
  assert.ok(['car1', 'car2', 'car3'].every((id) => d.result.values[id] !== r.result.values[id]), 'each other than it was');
  change(w, { thing: 'car3', attr: 'colour', value: 'same as car1' });
  assert.equal(w.get('car3').attrs.colour[0], w.get('car1').attrs.colour[0]);
  assert.equal(change(w, { thing: 'car', set: 'each', attr: 'name', value: 'random' }).violations[0].why, 'the name of a car has no list of values to choose from');
});
