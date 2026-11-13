// The request pipeline as data (Round 25): std.turn declares the stages; turnFlow runs
// them; the declared default gives what `turn` gives; variants by telling facts only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, turn, turnFlow } from '../tools/lib-under-test.mjs';
import { seating, face } from '../examples/acts.mjs';

const make = (extra = '') => { const w = new World(); w.load(['@acts core.use world=std.acts', '@t core.use world=std.turn', seating, face, extra].join('\n')); return w; };
const R = (action, args) => ({ action, args });
// 30 requests, some taken, some refused, some ambiguous, some sentences
const REQUESTS = [
  [R('make', { kind: 'table', name: 'family' })], [R('make', { kind: 'seat' })], [R('make', { kind: 'seat' })], [R('change', { thing: 'seat1', attr: 'colour', value: 'red' })],
  [R('change', { thing: 'seat', attr: 'colour', value: 'green' })], [R('make', { kind: 'guest', name: 'Ana' })], [R('make', { kind: 'eye', side: 'left' })], [R('make', { kind: 'eye', side: 'right' })],
  [R('make', { kind: 'eye' })], [R('change', { thing: 'eye', nth: 1, attr: 'size', by: 'more' })], [R('change', { thing: 'eye2', attr: 'colour', value: 'blue' })], [R('make', { kind: 'glasses', colour: 'red' })],
  [R('remove', { thing: 'glasses' })], [R('change', { thing: 'seat1', attr: 'size', value: 3 })], [R('remove', { thing: 'mouth' })], [R('make', { kind: 'hat' })],
  [[R('make', { kind: 'seat' }), R('make', { kind: 'guest', name: 'Bo' })]], [[R('make', { kind: 'table' }), R('change', { thing: 'table1', attr: 'shape', value: 'oval' })]],
  [R('change', { thing: 'guest1', attr: 'name', value: 'Cy' })], [R('copy', { thing: 'seat1' })], [R('connect', { a: 'seat1', b: 'seat2' })], [R('ask', { thing: 'eye1', attr: 'size' })],
  [R('pick', { kind: 'seat' })], [R('change', { thing: 'seat', set: 'each', attr: 'colour', value: 'blue' })], [R('remove', { thing: 'guest', set: 'all' })], [R('change', { thing: 'guest9', attr: 'name' })],
  [R('make', { kind: 'table', name: 'x' }), R('make', { kind: 'seat' })], [R('change', { thing: 'table', attr: 'shape', value: 'square' })], [R('make', { kind: 'glasses' })], [R('change', { thing: 'glasses', attr: 'variant', value: 'square' })],
];

test('the declared default path gives the same results as turn, request by request (30 requests)', () => {
  const a = make(), b = make();
  assert.equal(REQUESTS.length, 30);
  for (const readings of REQUESTS) {
    const x = turn(a, readings), y = turnFlow(b, readings);
    assert.deepEqual([y.status, y.reading, y.replies, y.diff?.changed, y.diff?.added?.map((d) => d.id)], [x.status, x.reading, x.replies, x.diff?.changed, x.diff?.added?.map((d) => d.id)], JSON.stringify(readings));
  }
  assert.equal(a.toSOP({ derived: true }), b.toSOP({ derived: true }), 'the same world at the end');
});

test('a trace names every stage taken; a stage nobody provides is advice', () => {
  const w = make();
  w.act({ action: 'make', args: { kind: 'seat' } });
  const t = turnFlow(w, [R('change', { thing: 'seat', attr: 'size', value: 3 }), R('change', { thing: 'seat', attr: 'colour', value: 'red' })]);
  assert.deepEqual(t.trace.map((x) => `${x.stage}:${x.yielded ?? x.empty ?? x.skipped}`), ['read:2', 'dryrun:a seat has no size', 'dryrun:true', 'apply:true', 'reply:true']);
  const hole = make('@x std.turn.stage name=translate after=read');
  assert.deepEqual(hole.check().issues.map((i) => i.why), ['the stage translate has no provider']);
});

test('variants by telling facts only: a confirmation before removing a whole set; a second reader', () => {
  const w = make('@c std.turn.stage name=confirm before=apply on_empty=ask only=remove\n@pc std.turn.provider stage=confirm name=confirm');
  for (let i = 0; i < 3; i++) w.act({ action: 'make', args: { kind: 'seat' } });
  const ask = turnFlow(w, [R('remove', { thing: 'seat', set: 'all' })]);
  assert.deepEqual([ask.status, ask.question, w.ofType('seat').length], ['ask', 'Remove all 3 seats?', 3]);
  const yes = turnFlow(w, [R('remove', { thing: 'seat', set: 'all' })], { confirmed: true });
  assert.deepEqual([yes.status, w.ofType('seat').length], ['done', 0]);
  assert.equal(turnFlow(w, [R('make', { kind: 'seat' })]).trace.find((x) => x.stage === 'confirm').skipped, 'only', 'only before remove');
  // a second reader at the reading stage, ranked after the first: its candidates come after
  const v = make('@p2 std.turn.provider stage=read name=guesser tier=2');
  const r = turnFlow(v, [R('make', { kind: 'hat' })], { providers: { guesser: () => [R('make', { kind: 'glasses' })] } });
  assert.deepEqual([r.status, r.reading, r.replies], ['done', 1, ['I made a glasses (glasses1).']]);
});
