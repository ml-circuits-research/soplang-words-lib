// One request pipeline with a graded fallback (Round 24, A3 and A4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, turn } from '../tools/lib-under-test.mjs';
import { seating, face } from '../examples/acts.mjs';
import { makeWorld as zooWorld } from '../examples/views.mjs';

const make = () => { const w = new World(); w.load(['@acts core.use world=std.acts', seating, face].join('\n')); return w; };

test('turn: the first reading the world takes is applied, with its difference, why and replies; the others are dropped with the reason', () => {
  const w = make();
  w.act({ action: 'make', args: { kind: 'seat' } });
  const t = turn(w, [
    { action: 'change', args: { thing: 'seat', attr: 'size', value: 3 } }, // "make the seat 3": no size
    { action: 'change', args: { thing: 'seat', attr: 'colour', value: 'red' } },
  ]);
  assert.deepEqual([t.status, t.reading, t.replies], ['done', 1, ['I changed the colour of the seat (seat1) from blue to red.']]);
  assert.deepEqual(t.diff.changed, [{ id: 'seat1', key: 'colour', from: 'blue', to: 'red', toTier: 'told' }]);
  assert.deepEqual(t.why[0].steps[0].how, 'action');
  assert.equal(t.dropped[0].violation.why, 'a seat has no size');
  // one sentence of two requests is one reading: all or nothing, one undo step
  const s = turn(w, [[{ action: 'make', args: { kind: 'eye' } }, { action: 'make', args: { kind: 'glasses' } }]]);
  assert.deepEqual([s.status, s.replies], ['done', ['I made an eye (eye1).', 'I made a glasses (glasses1).']]);
  w.undo();
  assert.deepEqual([w.has('eye1'), w.has('glasses1')], [false, false]);
});

test('turn: graded fallback — one question; not here but there; the best guess named', () => {
  const w = make();
  const ask = turn(w, [{ action: 'make', args: { kind: 'guest' } }, { action: 'change', args: { thing: 'seat' } }]);
  assert.equal(ask.status, 'done', 'a guest without a name is made: a required key is an open question, not a refusal');
  const q = turn(w, [{ action: 'change', args: { thing: 'guest1' } }]);
  assert.deepEqual([q.status, q.missing.map((m) => m.key)], ['ask', ['attr']]);
  w.act({ action: 'make', args: { kind: 'seat' } });
  const there = turn(w, [{ action: 'change', args: { thing: 'seat', attr: 'size', value: 3 } }]);
  assert.deepEqual([there.status, there.replies], ['elsewhere', ["I can't change the size of a seat: a seat has no size. The eye in face has a size."]]);
  const guess = turn(w, [{ action: 'make', args: { kind: 'hat' } }]);
  assert.deepEqual([guess.status, guess.question], ['unknown', 'Did you mean to make hat? (no world here has a hat)']);
  assert.equal(w.has('hat1'), false);
});

test('turn: a value filled from knowledge is said as a guess', () => {
  const w = zooWorld();
  const t = turn(w, [{ action: 'make', args: { kind: 'fish' } }]);
  assert.deepEqual(t.replies, ['I made a fish (fish1).', 'I guessed place water (knowledge, hand-core 1), size small (knowledge, hand-core 1).']);
});
