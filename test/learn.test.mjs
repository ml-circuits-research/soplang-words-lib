// Induction from cases (abstraction round item 4, Q54): the library's `induce` anti-unifies cases
// that share a frame into one reading rule, the filler lifted to its kind; the rule is admitted only
// when its training cases pass and its held-out cases and cousins do too. A toy world, invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, learnRules, cousins } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell(`@cow k.animal name=cow kind=bovine sound=moo legs=4  @yak k.animal name=yak kind=bovine sound=grunt legs=4
@sheep k.animal name=sheep kind=ovine sound=baa legs=4  @goat k.animal name=goat kind=ovine sound=bleat legs=4
@duck k.animal name=duck kind=fowl sound=quack legs=2  @hen k.animal name=hen kind=fowl sound=cluck legs=2
@bovine k.kind name=bovine is_a=ruminant  @ovine k.kind name=ovine is_a=ruminant  @fowl k.kind name=fowl is_a=bird  @ruminant k.kind name=ruminant is_a=mammal`);
const C = (t, k, o) => ({ text: t, frame: { is: 'ask', key: k, of: { id: o } } });
const O = { question: ['what', 'does'], skip: ['a'] };

test('learnRules: two cases anti-unified into a rule lifted to the kind, admitted on held-out cases and cousins', () => {
  const [r] = learnRules(w, [C('what sound does a cow make', 'sound', 'cow'), C('what sound does a duck make', 'sound', 'duck')],
    { heldOut: [C('what sound does a goat make', 'sound', 'goat')], cousins: (c) => cousins(w, c, { degree: 4, dims: ['filler'], read: O }) });
  assert.match(r.text, /k\.animal name=\?v0/, 'the filler lifted to its kind');
  assert.match(r.text, /ask key=sound of=\?v0/);
  assert.deepEqual(r.train, { pass: 2, of: 2 });
  assert.ok(r.heldOut.of >= 5 && r.heldOut.pass === r.heldOut.of, JSON.stringify(r.heldOut));
  assert.equal(r.admitted, true);
});

test('learnRules: an over-general rule (the key word made a variable) is refused by its held-out cases', () => {
  const [r] = learnRules(w, [C('what sound does a cow make', 'sound', 'cow'), C('what noise does a duck make', 'sound', 'duck')],
    { heldOut: [C('what legs does a hen make', 'legs', 'hen')] });
  assert.equal(r.train.pass, 2);
  assert.deepEqual([r.admitted, r.why], [false, 'held-out 0/1']);
});

test('learnRules ties the word, the fact name and the holder when the id is not the name (reviewer 00:05), and refuses a rule that fails its own cases', () => {
  const v = new World();
  v.tell('@k.animals.animal.cow k.animals.animal name=cow sound=moo  @k.animals.animal.duck k.animals.animal name=duck sound=quack  @k.animals.animal.hen k.animals.animal name=hen sound=cluck');
  const C = (t, o) => ({ text: t, frame: { is: 'ask', key: 'sound', of: { id: `k.animals.animal.${o}` } } });
  const [r] = learnRules(v, [C('what sound does a cow make', 'cow'), C('what sound does a duck make', 'duck')], { heldOut: [C('what sound does a hen make', 'hen')] });
  assert.match(r.text, /t5=\?v0[\s\S]*name=\?v0[\s\S]*of=\?v0/, 'one variable for the word, the name and the holder');
  assert.deepEqual([r.train, r.heldOut, r.admitted], [{ pass: 2, of: 2 }, { pass: 1, of: 1 }, true]);
});
