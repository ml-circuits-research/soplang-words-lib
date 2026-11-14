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

test('readByTypes, lexical generalisation: an unknown word read as its nearest known word through word senses, with its cost', () => {
  const v = new World();
  v.tell(`@cow k.animal name=cow sound=moo  @duck k.animal name=duck sound=quack
    @s1 k.words.sense word=noise pos=noun n=1 synonym=sound  @s2 k.words.sense word=heifer pos=noun n=1 is_a=cow kind_of=cow kind_of=cattle
    @s3 k.words.sense word=drake pos=noun n=1 is_a=duck  @vs core.word text=make text=makes means=sound`);
  const r = readByTypes(v, 'what noise does a heifer make', O);
  assert.deepEqual(r.best, { is: 'ask', key: 'sound', of: { id: 'cow' }, answer: ['moo'] });
  assert.deepEqual(r.near.map((x) => [x.word, x.as, x.via, x.cost]), [['noise', 'sound', 'synonym', 1], ['heifer', 'cow', 'kind', 2]]);
  assert.deepEqual(readByTypes(v, 'drake sound?', { ...O, near: 1 }).unread, ['drake'], 'a cost above the bound: not read');
  assert.equal(readByTypes(v, 'drake sound?', O).best.of.id, 'duck');
});

test('readByTypes, act frames: the act with typed arguments (the kind to make, the thing to act on, values of a closed set by their key)', () => {
  const v = new World();
  v.load('@acts core.use world=std.acts\n@art std.schema.world name=art doc=x\n@t core.type of=shape extends=std.schema.thing\n@s1 core.slot of=shape key=colour enum=red enum=blue\n@k std.schema.kind of=shape world=art acts=make acts=remove acts=change');
  v.tell('@c1 shape name=circle colour=red');
  const R = (t) => readByTypes(v, t, { skip: ['a', 'the', 'to', 'it'] }).best;
  assert.deepEqual(R('make a blue shape'), { is: 'act', act: 'make', args: { kind: 'shape', colour: 'blue' } });
  assert.deepEqual(R('a blue shape, make it'), R('make a blue shape'), 'any order');
  assert.deepEqual(R('remove the circle'), { is: 'act', act: 'remove', args: { thing: 'c1' } });
  assert.deepEqual(R('change the circle to blue'), { is: 'act', act: 'change', args: { thing: 'c1', colour: 'blue' } });
});
