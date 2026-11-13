// std.focus (Round 19): the dialogue focus kept per turn; a request that leaves out its
// thing or its action is completed from the focus after the turn before it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { matrix, KEYS } from '../examples/focus.mjs';

const make = (extra = '') => { const w = new World(); w.load(matrix + extra); return w; };
const readOf = (w, id) => {
  const req = w.get(id);
  return KEYS.map((k) => req.attrs[k]?.[0] ?? w.ofType('std.fill.need').find((n) => n.attrs.for[0] === '$' + id && n.attrs.key[0] === k)?.attrs.value?.[0] ?? '-').join(' ');
};
const now = (w) => Object.fromEntries(w.ofType('std.focus.last').map((l) => [l.attrs.kind[0], l.attrs.value?.[0] ?? null]));

test('std.focus: continuations take the thing and the action of the turn before; earlier turns keep theirs', () => {
  const w = make();
  w.tell('@q1 draw.request action=draw thing=cup place=table');
  w.tell('@q2 draw.request colour=red');
  assert.equal(readOf(w, 'q2'), 'draw cup');
  w.tell('@q3 draw.request action=move direction=right');
  w.tell('@q4 draw.request direction=down');
  assert.deepEqual(['q2', 'q3', 'q4'].map((id) => readOf(w, id)), ['draw cup', 'move cup', 'move cup'], 'q2 stays a drawing when the action moves on');
  const need = w.ofType('std.fill.need').find((n) => n.attrs.for[0] === '$q4' && n.attrs.key[0] === 'thing');
  assert.deepEqual([need.attrs.tier, need.attrs.source], [['focus'], ['focus']]);
  assert.deepEqual(now(w), { thing: 'cup', action: 'move', place: 'table', world: null });
  assert.deepEqual(w.ofType('core.issue'), []);
});

test('std.focus: the first turn has no focus to take from; a told key needs nothing', () => {
  const w = make();
  w.tell('@q1 draw.request colour=red');
  assert.equal(readOf(w, 'q1'), '- -');
  w.tell('@q2 draw.request action=draw thing=boat');
  assert.equal(w.ofType('std.fill.need').filter((n) => n.attrs.for[0] === '$q2').length, 0);
  w.tell('@q3 draw.request thing=kite');
  assert.equal(readOf(w, 'q3'), 'draw kite');
});

test('std.focus: a turn taken back (retract or undo) gives the focus of the turn before it again', () => {
  const w = make();
  w.tell('@q1 draw.request action=draw thing=cup');
  w.tell('@q2 draw.request thing=boat');
  w.tell('@q3 draw.request colour=red');
  assert.equal(readOf(w, 'q3'), 'draw boat');
  w.retract('q2');
  assert.deepEqual([readOf(w, 'q3'), now(w).thing], ['draw cup', 'cup']);
  // told again, it is a new turn: after q3, so q3 keeps the cup
  w.tell('@q2 draw.request thing=boat');
  assert.deepEqual([readOf(w, 'q3'), now(w).thing], ['draw cup', 'boat']);
  w.undo();
  assert.deepEqual([readOf(w, 'q3'), now(w).thing], ['draw cup', 'cup']);
});

test('std.focus: two dialogues keep separate focus', () => {
  const two = matrix.replace('@turn std.focus.turn of=$any in=main', '@turn std.focus.turn of=$any in=?who').replace('@any draw.request', '@any draw.request by=?who');
  const w = new World();
  w.load(two);
  w.tell('@a1 draw.request by=ann action=draw thing=cup');
  w.tell('@b1 draw.request by=bob action=move thing=boat');
  w.tell('@a2 draw.request by=ann colour=red  @b2 draw.request by=bob direction=up');
  assert.deepEqual([readOf(w, 'a2'), readOf(w, 'b2')], ['draw cup', 'move boat']);
});

test('std.focus: a better tier still wins over the focus (std.fill decides)', () => {
  const w = make(String.raw`
@uq draw.request
@un std.fill.need for=$uq key=?k
@us user.said key=?k value=?v
@uo std.fill.offer for=$un value=?v tier=user source=user
@ur core.rule when=$uq when=$un when=$us then=$uo
`);
  w.tell('@q1 draw.request action=draw thing=cup');
  w.tell('@p1 user.said key=thing value=star  @q2 draw.request colour=red');
  assert.equal(readOf(w, 'q2'), 'draw star');
});
