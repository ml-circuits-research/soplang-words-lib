// The sums of a list, computed, never stored (reviewer 09:20 L3; real turns r0598, r0599, r0622, r0624, r0625,
// r0627): the total of quantity × price, the change, what is left, what is short; the list meant when none is
// named; the provenance of a value by act. Prices are the application's (a toy price list here).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, listMeant, listSums } from '../tools/lib-under-test.mjs';
import { worldText, worldsDir } from '../tools/worlds.mjs';

const prices = { puzzle: 7, pencil: 2, ball: 9, milk: 5 };
const priceOf = (e) => prices[String(e.attrs.text[0]).replace(/"/g, '')];

test('listSums on the published w.list: the change of the real shop turns, short money, the list meant', { skip: !worldsDir() && 'offline' }, () => {
  const w = new World();
  assert.ok(w.load(['@acts core.use world=std.acts', worldText('w.list')].join('\n')).ok);
  w.tell('@l1 w.list.list name=shop sort=shopping tendered=10 currency=RON\n@e1 w.list.item text=puzzle list=$l1'); // "I want a puzzle and I pay 10 lei. What is the change?"
  assert.deepEqual([listSums(w, listMeant(w), { priceOf }).total, listSums(w, 'l1', { priceOf }).change], [7, 3]);
  w.tell('@l2 w.list.list name=pencils sort=shopping tendered=10\n@e2 w.list.item text=pencil quantity=2 list=$l2'); // "I want 2 pencils and I give the cashier 10 lei"
  assert.equal(listSums(w, listMeant(w), { priceOf }).change, 6, 'quantity × price; the list made last is the one meant');
  w.tell('@l3 w.list.list name=toys tendered=20 budget=15\n@e3 w.list.item text=ball list=$l3\n@e4 w.list.item text=pencil list=$l3'); // "a ball and a pencil and pay with 20 lei"
  const s = listSums(w, 'l3', { priceOf });
  assert.deepEqual([s.total, s.change, s.left, s.affordable], [11, 9, 4, true]);
  w.tell('@l4 w.list.list name=short tendered=5\n@e5 w.list.item text=ball list=$l4');
  assert.deepEqual([listSums(w, 'l4', { priceOf }).short, listSums(w, 'l4', { priceOf }).why], [4, '4 short']);
  w.tell('@e6 w.list.item text=kite list=$l4');
  assert.match(listSums(w, 'l4', { priceOf }).why, /no price for kite/, 'a total is not guessed');
  assert.equal(listMeant(w, { name: 'shop' }).id, 'l1');
});

test('listSums on a toy list: done entries do not count; why a value is so', () => {
  const w = new World();
  w.load('@a core.type of=lst  @b core.type of=ent  @c core.slot of=ent key=list type=lst');
  w.tell('@l lst name=week tendered=20\n@m ent text=milk list=$l status=done\n@b1 ent text=ball list=$l');
  assert.equal(listSums(w, 'l', { itemType: 'ent', priceOf }).total, 9, 'the milk is bought');
  assert.equal(listSums(w, 'l', { itemType: 'ent', priceOf, all: true }).total, 14);
  assert.ok(w.why('m', 'status')?.steps?.length, 'the provenance of a value: world.why');
});
