// std.grammar (Round 26 B, smallest version): a toy grammar world read by the library's
// parser; noun phrases with determiners, numbers, modifiers and a prepositional phrase;
// coordination; ambiguity returned, best first; bounded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, parseText, nounPhrase, grammarOf } from '../tools/lib-under-test.mjs';

const TOY = String.raw`
@w1 g.word text=a lemma=a cat=Det  @w2 g.word text=the lemma=the cat=Det  @w3 g.word text=two lemma=2 cat=Num
@w4 g.word text=red lemma=red cat=Adj  @w5 g.word text=big lemma=big cat=Adj  @w6 g.word text=cup lemma=cup cat=N  @w7 g.word text=cups lemma=cup cat=N num=plural
@w8 g.word text=plate lemma=plate cat=N  @w9 g.word text=on lemma=on cat=P  @w10 g.word text=table lemma=table cat=N
@r1 g.rule lhs=NP rhs=Det? rhs=Num? rhs=Adj* rhs=N rhs=PP?
@r2 g.rule lhs=PP rhs=P rhs=NP
@c g.coord word=and`;
const make = () => { const w = new World(); w.tell(TOY); return w; };
const np = (w, s) => { const p = parseText(w, s, { start: 'NP' }); return p.length ? nounPhrase(p[0].tree) : null; };

test('grammar: a noun phrase read with the world\'s lexicon and rules: determiner, number, modifiers, head and its lemma', () => {
  const w = make();
  assert.deepEqual(np(w, 'two big red cups'), { span: [0, 4], num: '2', mods: ['big', 'red'], head: 'cups', lemma: 'cup' });
  assert.deepEqual(np(w, 'The cup on the table').pp, [{ span: [2, 5], words: ['on', 'the', 'table'] }]);
  assert.equal(np(w, 'cup red'), null, 'what the grammar does not allow is not read');
  assert.ok(grammarOf(w).rules.get('Adj+').length === 2, 'Adj* is one or more Adj, or none');
});

test('grammar: coordination gives a list; an ambiguous phrase gives every parse, the higher coordination first', () => {
  const w = make();
  assert.deepEqual(np(w, 'a cup and a plate').coord.map((x) => x.lemma), ['cup', 'plate']);
  const p = parseText(w, 'a cup on the table and a plate', { start: 'NP' });
  assert.equal(p.length, 2);
  assert.deepEqual(nounPhrase(p[0].tree).coord.map((x) => x.lemma), ['cup', 'plate'], '(a cup on the table) and (a plate)');
  assert.equal(nounPhrase(p[1].tree).lemma, 'cup', 'a cup on (the table and a plate)');
});

test('grammar: bounded — a step budget, never a hang; no language in the library', () => {
  const w = make();
  assert.throws(() => parseText(w, 'a cup and a cup and a cup and a cup and a cup and a cup', { start: 'NP', budget: 50 }), /grammar: more than 50 steps/);
  const other = new World();
  other.tell('@x g.word text=ko lemma=cup cat=N  @y g.word text=mi lemma=red cat=Adj  @r g.rule lhs=NP rhs=N rhs=Adj*');
  assert.deepEqual(nounPhrase(parseText(other, 'ko mi', { start: 'NP' })[0].tree), { span: [0, 2], mods: ['red'], head: 'ko', lemma: 'cup' }, 'a made-up language with its modifiers after the noun');
});
