// std.relations (Round 19): relations kept between things (on, in, next to, above, in front
// of) re-derived when a thing moves; sets: each, the first, all, one per place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { scene, at } from '../examples/relations.mjs';

const make = () => { const w = new World(); w.load('@use core.use world=std.relations'); w.tell(scene); return w; };

test('std.relations: a kept relation follows the thing it is kept to, through a chain', () => {
  const w = make();
  w.tell('@cup3 std.relations.box kind=cup w=10 h=10  @cup3.on std.relations.keep thing=$cup3 rel=on ref=$book');
  assert.deepEqual(['table', 'book', 'cup3'].map((id) => at(w, id)), ['0/80', '40/70', '45/60']);
  assert.ok(w.revise('t.at', { x: 50, y: 100 }).ok);
  assert.deepEqual(['table', 'book', 'cup3'].map((id) => at(w, id)), ['50/100', '90/90', '95/80']);
  w.retract('book.on');
  assert.deepEqual([at(w, 'book'), at(w, 'cup3')], ['-', '-'], 'no relation, no place');
});

test('std.relations: the five relations, and several things kept the same way stand in a row', () => {
  const w = make();
  for (const rel of ['in', 'above', 'in_front_of', 'next_to', 'on']) w.tell(`@x.${rel} std.relations.box w=10 h=10  @k.${rel} std.relations.keep thing=$x.${rel} rel=${rel} ref=$table`);
  // the table: x 0, y 80, w 100, h 20; the book (20 wide) is already on it
  assert.deepEqual(['in', 'above', 'in_front_of', 'next_to', 'on'].map((r) => at(w, `x.${r}`)), ['45/85', '45/60', '45/95', '105/90', '60/70']);
  assert.equal(at(w, 'book'), '40/70', 'the first on the table');
  // a told place and a kept one for the same thing: refused
  assert.equal(w.tell('@bad std.relations.at thing=$book x=1 y=1').violations[0].kind, 'conflict');
});

test('std.relations: each, the first, put all, one per place', () => {
  const w = make();
  w.tell('@first std.relations.nth kind=cup n=1');
  assert.deepEqual(w.get('first').attrs.item, ['$cup2'], 'the leftmost cup');
  w.tell('@lamps std.relations.each kind=lamp w=6 h=12 rel=on over=shelf');
  assert.deepEqual(w.ofType('std.relations.box').filter((b) => b.attrs.kind?.[0] === 'lamp').map((b) => at(w, b.id)), ['217/8', '317/8']);
  w.tell('@s3 std.relations.box kind=shelf w=40 h=5  @s3.at std.relations.at thing=$s3 x=400 y=20');
  assert.equal(w.ofType('std.relations.box').filter((b) => b.attrs.kind?.[0] === 'lamp').length, 3, 'a new shelf gets its lamp');
  w.tell('@spread std.relations.spread kind=cup over=shelf');
  assert.deepEqual(w.ofType('std.relations.pair').map((p) => `${p.attrs.thing[0]}>${p.attrs.ref[0]}`).sort(), ['$cup1>$s2', '$cup2>$s1']);
  const m = w.mark(); // the action retracts the told places: undo does not bring retractions back, a mark does
  const r = w.act({ action: 'relations.put_pairs', args: { s: '$spread', rel: 'next_to' } });
  assert.deepEqual([r.ok, at(w, 'cup2'), at(w, 'cup1')], [true, '245/15', '345/15']);
  w.rewind(m);
  assert.deepEqual([at(w, 'cup2'), at(w, 'cup1')], ['120/0', '150/0']);
  const all = w.act({ action: 'relations.put_all', args: { k: 'cup', rel: 'on', ref: '$table' } });
  assert.deepEqual([all.ok, at(w, 'cup1'), at(w, 'cup2')], [true, '60/70', '75/70'], 'in a row after the book, in the order kept');
  assert.equal(w.get('first').attrs.item[0], '$cup1', 'the first cup is now the one on the left of the row');
});
