// General host code taken into the library (handover LIB-5..8): genres and topics, a typed world from a
// session and roles re-read by type, slot-type assignment over patterns, judging a reply and tabulating.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, genreOf, topicIndex, randomTopics, typedWorldFor, readText, judgeReply, tabulate, tableText } from '../tools/lib-under-test.mjs';
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

test('the session\'s things typed (typedWorldFor) and re-read under the Reader contract: every word placed, or not complete', () => {
  const t = typedWorldFor({ kinds: [{ type: 'shape', keys: [{ key: 'colour', enum: ['red', 'blue', 'green'] }] }] }, null, { things: [{ id: 'c1', label: 'circle', kind: 'shape', attrs: { colour: 'red' } }, { id: 't1', label: 'tree', kind: 'shape' }] });
  const r = readText(t.world, 'the colour of the circle', { question: ['what'], skip: ['the', 'of'] });
  assert.deepEqual([r.complete, r.best.key, r.best.of.id], [true, 'colour', 'c1']);
  assert.equal(readText(t.world, 'the colour of the circle very', { skip: ['the', 'of'] }).complete, false, 'a word left: not complete');
});

test('judgeReply, tabulate, tableText', () => {
  assert.equal(judgeReply('A spider has eight legs.', ['8'], { numberWords: { 8: 'eight' } }), true);
  assert.equal(judgeReply('A spider has legs.', ['8']), false);
  assert.equal(judgeReply('It says moo.', ['moo'], { before: { n: 1 }, after: { n: 2 } }), false, 'a question changed the state');
  const t = tabulate([{ distance: 1, axis: 'kind', pass: true }, { distance: 1, axis: 'kind', pass: false }, { distance: 2, axes: ['form:op1'], pass: true }]);
  assert.deepEqual(t, { '1|kind': { pass: 1, of: 2 }, '2|form:op1': { pass: 1, of: 1 } });
  assert.match(tableText(t), /distance 1  kind\s+1\/2  50 %/);
});
