// std.space single placement and relation kinds (Round 28 item 8): a spot relative to a thing,
// in a region, or a default spot, avoiding overlaps; relations declared with their kind.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, placeFor, relationsOf } from '../tools/lib-under-test.mjs';

const W = `@acts core.use world=std.acts  @pic std.schema.world name=pic
@t core.type of=box extends=std.schema.thing closed=true
@sx core.slot of=box key=x kind=number  @sy core.slot of=box key=y kind=number  @sw core.slot of=box key=w kind=number  @sh core.slot of=box key=h kind=number
@k std.schema.kind of=box world=pic acts=make acts=connect
@sky std.schema.region name=sky x=0 y=0 w=100 h=30
@r1 std.schema.relation name=next_to kind=spatial  @r2 std.schema.relation name=inside kind=containment inverse=holds  @r3 std.schema.relation name=feeds kind=flow`;

test('space: right of, near (the first free side), on, in, in a region, a default spot; overlaps said', () => {
  const w = new World(); w.load(W);
  w.act({ action: 'make', args: { kind: 'box', x: 40, y: 40, w: 20, h: 20 } });
  assert.deepEqual(placeFor(w, { w: 10, h: 10 }, { rel: 'right_of', ref: 'box1' }), { x: 62, y: 45, how: 'right_of' });
  w.act({ action: 'make', args: { kind: 'box', x: 62, y: 45, w: 10, h: 10 } });
  assert.deepEqual(placeFor(w, { w: 10, h: 10 }, { rel: 'near', ref: 'box1' }), { x: 28, y: 45, how: 'near' }, 'the right side is taken: the left');
  assert.deepEqual(placeFor(w, { w: 10, h: 10 }, { rel: 'on', ref: 'box1' }), { x: 45, y: 30, how: 'on' });
  assert.equal(placeFor(w, { w: 10, h: 10 }, { rel: 'in', ref: 'box1' }).how, 'in');
  const sky = placeFor(w, { w: 10, h: 10 }, { region: 'sky' });
  assert.ok(sky.y + 10 <= 30 && sky.how === 'region');
  assert.deepEqual(placeFor(w, { w: 10, h: 10 }), { x: 0, y: 0, how: 'default' });
  assert.equal(placeFor(w, { w: 200, h: 10 }).overlaps, true, 'no free spot: said, not hidden');
  assert.match(placeFor(w, {}, { region: 'sea' }).why, /no region sea/);
});

test('space: relation kinds are declared; connect refuses a relation the schema does not have', () => {
  const w = new World(); w.load(W);
  assert.deepEqual(relationsOf(w, 'containment'), [{ name: 'inside', kind: 'containment', inverse: 'holds' }]);
  w.act({ action: 'make', args: { kind: 'box' } }); w.act({ action: 'make', args: { kind: 'box' } });
  assert.ok(w.act({ action: 'connect', args: { a: 'box1', b: 'box2', rel: 'feeds' } }).ok);
  assert.match(w.act({ action: 'connect', args: { a: 'box1', b: 'box2', rel: 'loves' } }).violations[0].why, /no relation loves/);
});
