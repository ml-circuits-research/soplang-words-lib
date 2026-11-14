// Discourse ellipsis (reviewer 03:20, PSys2's Q15 item 5a): a verbless continuation reuses the previous act with
// the roles it gives, read by type; a message that names an act is not an ellipsis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, continueAct } from '../tools/lib-under-test.mjs';

test('continueAct: "it to the top right" moves the same thing again; a new thing replaces it; an act word stops it', () => {
  const w = new World();
  w.load('@acts core.use world=std.acts\n@art std.schema.world name=art doc=x\n@t core.type of=shape extends=std.schema.thing\n@s1 core.slot of=shape key=place enum=top_right enum=bottom_left enum=up enum=down\n@k std.schema.kind of=shape world=art acts=make acts=place');
  w.tell('@c1 shape name=cat  @t1 shape name=tree');
  const prev = { act: 'place', args: { thing: 'c1', place: 'bottom_left' } };
  assert.deepEqual(continueAct(w, 'it to the top right', prev, { skip: ['to', 'the', 'and', 'still'] }), { act: 'place', args: { thing: 'c1', place: 'top right' }, reused: true, changed: ['place'] });
  assert.deepEqual(continueAct(w, 'and still up', prev, { skip: ['to', 'the', 'and', 'still'] }).args.place, 'up');
  assert.equal(continueAct(w, 'the tree too', prev, { skip: ['the', 'too'] }).args.thing, 't1');
  assert.equal(continueAct(w, 'make a tree', prev, { skip: ['a'] }), null, 'it names an act');
  assert.equal(continueAct(w, 'hello', prev), null, 'no role given');
});
