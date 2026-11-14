// Type-driven reading (abstraction round item 1, questions.md Q54): paraphrases with different word
// orders read to one frame by the types of their words. A toy world, invented here: animals with a
// sound and legs, the verbs the world declares as words of its keys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readByTypes, typedLexicon } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell(`@cow k.animal name=cow sound=moo legs=4  @duck k.animal name=duck sound=quack legs=2  @dog k.animal name=dog sound=woof legs=4
@vs core.word text=make text=makes text=say text=says means=sound  @vl core.word text=have text=has means=legs`);
const O = { question: ['what', 'which', 'how', 'many', 'does', 'do', 'is'], skip: ['a', 'an', 'the', 'of'] };
const SETS = [
  [{ is: 'ask', key: 'sound', of: { id: 'cow' }, answer: ['moo'] }, ['what sound does a cow make', 'a cow makes which sound', 'cow sound?', 'the sound of a cow', 'what does a cow say', 'sounds of cows']],
  [{ is: 'ask', key: 'legs', of: { id: 'duck' }, answer: ['2'] }, ['how many legs does a duck have', 'a duck has how many legs', 'duck legs?', 'the legs of the duck']],
  [{ is: 'find', key: 'sound', value: 'woof', kind: 'k.animal', answer: ['dog'] }, ['which animal says woof', 'woof is the sound of which animal', 'what animal makes woof']],
];

test('readByTypes: every paraphrase of a set reads to the same frame, whatever its word order', () => {
  let n = 0;
  for (const [frame, texts] of SETS) for (const t of texts) { assert.deepEqual(readByTypes(w, t, O).best, frame, t); n++; }
  assert.equal(n, 13);
});

test('readByTypes: unread words are said; a lexicon from the world; acts by the types of their arguments', () => {
  assert.deepEqual(readByTypes(w, 'what sound does a zebra make', O).unread, ['zebra']);
  assert.ok(typedLexicon(w).get('cow').some((s) => s.cat === 'thing'));
  const v = new World();
  v.load('@acts core.use world=std.acts');
  v.tell('@cow k.animal name=cow');
  const r = readByTypes(v, 'remove the cow', { skip: ['the'] });
  assert.deepEqual([r.best.is, r.best.act], ['act', 'remove']);
});
