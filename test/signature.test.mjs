// Type signatures and a pattern inventory (reviewer 02:15): signatures with levels, chunks, patterns mined with
// their coverage. A toy world, invented here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, signatureOf, chunk, minePatterns } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell('@cow k.animal name=cow sound=moo legs=4  @dog k.animal name=dog sound=woof legs=4  @v core.word text=make text=makes means=sound');
const closed = ['what', 'does', 'a', 'the', 'how', 'many'];

test('signatureOf: knowledge types first, closed words literal, morphology for the rest, three levels', () => {
  assert.deepEqual(signatureOf(w, 'cow', { closed }), ['<k.animal>', '<thing>', '<N>']);
  assert.deepEqual(signatureOf(w, 'sound', { closed }), ['<attr:sound>', '<attr>', '<N>']);
  assert.deepEqual(signatureOf(w, 'makes', { closed }), ['<verb:sound>', '<verb>', '<V>']);
  assert.deepEqual(signatureOf(w, 'does', { closed }), ['does', 'does', 'does']);
  assert.deepEqual(signatureOf(w, '12', { closed }), ['<num>', '<num>', '<N>']);
  assert.deepEqual(signatureOf(w, 'barking', { closed }), ['<w-ing>', '<w>', '<w>']);
});

test('chunk and minePatterns: sentences about different things fall into one pattern; coverage counted', () => {
  assert.deepEqual(chunk(w, 'what sound does a cow make', { closed }).map((c) => c.sig[1]), ['what', '<attr>', 'does', 'a', '<thing>', '<verb>']);
  const r = minePatterns(w, ['what sound does a cow make', 'what sound does a dog make', 'how many legs does a cow have', 'what legs does a dog make'], { closed });
  assert.deepEqual([r.patterns[0].pattern, r.patterns[0].count, r.patterns.length, r.at80], ['what <attr> does a <thing> <verb>', 3, 2, 2]);
});

test('patternReader: a pattern learnt from cases reads new sentences of that pattern into frames (a voice for readEnsemble)', async () => {
  const { patternReader } = await import('../tools/lib-under-test.mjs');
  const v = new World();
  v.tell('@cow k.animal name=cow sound=moo legs=4  @dog k.animal name=dog sound=woof legs=4  @hen k.animal name=hen sound=cluck legs=2  @m core.word text=make text=makes means=sound');
  const C = (t, k, o) => ({ text: t, frame: { is: 'ask', key: k, of: { id: o } } });
  const read = patternReader(v, [C('hey what sound a cow makes', 'sound', 'cow'), C('hey what legs a dog makes', 'legs', 'dog')], { closed: ['hey', 'what', 'a'] });
  assert.deepEqual(read(v, 'hey what sound a hen makes')[0].frame, { is: 'ask', key: 'sound', of: { id: 'hen' }, answer: ['cluck'] });
  assert.deepEqual(read(v, 'what is this'), [], 'an unknown pattern: no reading');
});
