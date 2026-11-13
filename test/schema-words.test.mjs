// From a schema to words (Round 21, item 3): the card, example sentences per act, and the
// reply for a done act or a refusal, generated from the schema and the act's result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, schemaCard, schemaExamples, actReply } from '../tools/lib-under-test.mjs';
import { seating, face } from '../examples/acts.mjs';

const make = (...s) => { const w = new World(); w.load(['@acts core.use world=std.acts', ...s].join('\n')); return w; };

test('schema to words: the card of a world, from its schema alone', () => {
  const w = make(face, '@w1 core.word text=peeper means=eye');
  const [card] = schemaCard(w, 'face');
  assert.deepEqual([card.world, card.doc, card.kinds.map((k) => k.kind)], ['face', 'a face: eyes, mouth, glasses', ['eye', 'mouth', 'glasses']]);
  assert.deepEqual(card.kinds[0], { kind: 'eye', words: ['peeper'], acts: ['make', 'change', 'ask', 'copy'], limit: 2, attrs: [
    { name: 'colour', values: ['brown', 'blue', 'green'], default: 'brown' },
    { name: 'size', kind: 'number', min: 1, max: 10, step: 1, default: '5' },
    { name: 'side', values: ['left', 'right'] },
  ] });
});

test('schema to words: every example sentence becomes a request that is done, on a world with one thing of each kind', () => {
  const w = make(seating, face);
  for (const k of ['table', 'seat', 'mouth', 'glasses', 'eye']) assert.ok(w.act({ action: 'make', args: { kind: k } }).ok || k === 'mouth', k);
  w.tell('@m1 mouth kind=mouth world=face');
  w.act({ action: 'make', args: { kind: 'guest', name: 'Ana' } });
  const ex = schemaExamples(w, undefined, { per: 2 });
  const done = ex.filter((e) => w.fork().act(e.request).ok);
  const notDone = ex.filter((e) => !done.includes(e)).map((e) => e.text);
  assert.deepEqual([notDone, ex.length], [[], 35]);
  assert.deepEqual(ex.find((e) => e.act === 'change' && e.kind === 'eye').request, { action: 'change', args: { thing: 'eye', attr: 'colour', value: 'blue' } });
});

test('schema to words: the reply for a done act and for a refusal, from the result', () => {
  const w = make(seating, face);
  const say = (action, args) => { const req = { action, args }; return actReply(w, req, w.act(req)); };
  assert.equal(say('make', { kind: 'seat' }), 'I made a seat (seat1).');
  assert.equal(say('change', { thing: 'seat', attr: 'colour', value: 'red' }), 'I changed the colour of the seat (seat1) from blue to red.');
  assert.equal(say('change', { thing: 'seat', attr: 'size', value: 3 }), "I can't change the size of a seat: a seat has no size. The eye in face has a size.");
  assert.equal(say('remove', { thing: 'mouth' }), "I can't remove a mouth: there is no mouth. I can change or ask a mouth; remove works in seating or face.");
  say('make', { kind: 'eye' }); say('make', { kind: 'eye' });
  assert.equal(say('remove', { thing: 'eye' }), 'Which eye? There are 2: the eye (eye1) and the eye (eye2).');
  assert.equal(say('make', { kind: 'guest', name: 'Ana' }), 'I made a guest (guest1).');
  assert.equal(say('ask', { thing: 'guest', attr: 'name' }), 'The name of guest Ana is Ana.');
});

test('a fork keeps the host functions registered later and those a standard module brought', () => {
  const w = make(face);
  w.register('function', 'twice', ([x]) => String(2 * x));
  const f = w.fork();
  assert.deepEqual([typeof f.fns.twice, typeof f.actions.acts_make, f.act({ action: 'make', args: { kind: 'eye' } }).ok], ['function', 'function', true]);
});
