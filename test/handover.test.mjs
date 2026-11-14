// General host code taken into the library (handover LIB-5..8): genres and topics, a typed world from a
// session and roles re-read by type, slot-type assignment over patterns, judging a reply and tabulating.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, genreOf, topicIndex, randomTopics, typedWorldOf, readRolesByTypes, assignBySlotTypes, judgeReply, tabulate, tableText } from '../tools/lib-under-test.mjs';
import { worldsDir, worldText } from '../tools/worlds.mjs';

test('genreOf, topicIndex, randomTopics', { skip: !worldsDir() && 'offline' }, () => {
  const w = new World(); w.tell(worldText('k.interest')); w.tell(worldText('k.genres'));
  assert.equal(genreOf(w, 'scientific-article'), 'scientific article');
  assert.equal(genreOf(w, 'slide show'), 'presentation');
  assert.equal(genreOf(w, 'sonnet'), null);
  w.tell('@peru k.country name=peru  @p1 k.fact about=peru area=1  @p2 k.fact about=peru lang=es  @chad k.country name=chad  @c1 k.fact about=chad area=2  @x k.country name=nowhere');
  assert.deepEqual(topicIndex(w, { types: ['k.country'] }).map((t) => [t.topic, t.facts]), [['peru', 2]], 'named by at least two facts');
  assert.deepEqual(topicIndex(w, { types: ['k.country'], min: 1 }).map((t) => t.topic), ['peru', 'chad']);
  const r = randomTopics(w, { types: ['k.country'], min: 1, count: 1, seed: 3 });
  assert.equal(r.length, 1); assert.ok(['peru', 'chad'].includes(r[0]));
  assert.deepEqual(randomTopics(w, { types: ['k.country'], min: 1, count: 2, seed: 3 }), randomTopics(w, { types: ['k.country'], min: 1, count: 2, seed: 3 }), 'seeded');
});

test('typedWorldOf and readRolesByTypes: all words placed or nothing', () => {
  const w = typedWorldOf([{ id: 'c1', label: 'circle', kind: 'shape', attrs: { colour: 'red' } }, { id: 't1', label: 'tree', kind: 'shape' }], { values: { colour: ['red', 'blue', 'green'] } });
  assert.deepEqual(readRolesByTypes(w, 'the circle blue', ['thing', 'value'], { skip: ['the'] }), { thing: 'c1', value: 'blue' });
  assert.deepEqual(readRolesByTypes(w, 'colour of the tree green', ['thing', 'attribute', 'value'], { skip: ['of', 'the'] }), { attribute: 'colour', thing: 't1', value: 'green' });
  assert.equal(readRolesByTypes(w, 'the circle very blue', ['thing', 'value'], { skip: ['the'] }), null, 'a word left: nothing');
});

test('assignBySlotTypes: exactly one assignment is a reading; an anchor is required', () => {
  const P = [{ name: 'colour', slots: [{ name: 'thing', type: 'thing' }, { name: 'value', type: 'colour' }], literals: ['make', 'the'], anchor: ['make'] },
    { name: 'two', slots: [{ name: 'a', type: 'thing' }, { name: 'b', type: 'thing' }], literals: ['and'] }];
  const L = { thing: new Set(['circle', 'tree']), colour: new Set(['red', 'blue']) };
  assert.deepEqual(assignBySlotTypes(P, ['make', 'the', 'circle', 'red'], L), [{ pattern: 'colour', assignment: { thing: 'circle', value: 'red' } }]);
  assert.deepEqual(assignBySlotTypes(P, ['circle', 'and', 'tree'], L), [], 'two assignments of the same types: no reading');
  assert.deepEqual(assignBySlotTypes(P, ['the', 'circle', 'red'], L), [], 'no anchor');
});

test('judgeReply, tabulate, tableText', () => {
  assert.equal(judgeReply('A spider has eight legs.', ['8'], { numberWords: { 8: 'eight' } }), true);
  assert.equal(judgeReply('A spider has legs.', ['8']), false);
  assert.equal(judgeReply('It says moo.', ['moo'], { before: { n: 1 }, after: { n: 2 } }), false, 'a question changed the state');
  const t = tabulate([{ degree: 1, dim: 'kind', pass: true }, { degree: 1, dim: 'kind', pass: false }, { degree: 2, dims: ['form:op1'], pass: true }]);
  assert.deepEqual(t, { '1|kind': { pass: 1, of: 2 }, '2|form:op1': { pass: 1, of: 1 } });
  assert.match(tableText(t), /degree 1  kind\s+1\/2  50 %/);
});
