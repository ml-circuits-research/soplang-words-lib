// std.grammar (Round 26 B, smallest version): a toy grammar world read by the library's
// parser; noun phrases with determiners, numbers, modifiers and a prepositional phrase;
// coordination; ambiguity returned, best first; bounded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { World, parseText, nounPhrase, grammarOf, grammarView, viewDiff } from '../tools/lib-under-test.mjs';

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
  assert.deepEqual(np(w, 'two big red cups'), { span: [0, 4], rule: 'r1', num: '2', mods: ['big', 'red'], head: 'cups', lemma: 'cup' });
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
  const cut = parseText(w, 'a cup and a cup and a cup and a cup and a cup and a cup', { start: 'NP', budget: 50 });
  assert.equal(cut.truncated, true, 'past the budget: truncated, never a throw');
  assert.deepEqual(parseText(w, 'a mug', { start: 'NP' }).unknown, [{ word: 'mug', at: 1 }], 'a word the lexicon lacks is reported, not judged');
  const other = new World();
  other.tell('@x g.word text=ko lemma=cup cat=N  @y g.word text=mi lemma=red cat=Adj  @r g.rule lhs=NP rhs=N rhs=Adj*');
  assert.deepEqual(nounPhrase(parseText(other, 'ko mi', { start: 'NP' })[0].tree), { span: [0, 2], rule: 'r', mods: ['red'], head: 'ko', lemma: 'cup' }, 'a made-up language with its modifiers after the noun');
});

test('grammar: a grammar world with its own names — classes as categories, literal words, [a|b], digits, words of several parts, a possessive with its head', () => {
  const w = new World();
  w.tell(`
@d1 x.det text=the  @d2 x.det text=a  @p1 x.prep text=next_to rel=near  @p2 x.prep text=on rel=on
@o3 x.ord text=third value=3
@r1 x.rule lhs=NP rhs=DET? rhs=ORD? rhs=MOD* rhs=N head=N
@r2 x.rule lhs=NP rhs="[all|each]" rhs=DET? rhs=N head=N
@r3 x.rule lhs=NP rhs=N rhs=NUM head=N
@r4 x.rule lhs=NP rhs=NP rhs=PP head=NP
@r5 x.rule lhs=NP rhs=NP rhs="'s" rhs=N head=N
@r6 x.rule lhs=PP rhs=PREP rhs=NP head=PREP
@r7 x.rule lhs=NP rhs=everything
@r8 x.rule lhs=NP rhs=N rhs=N status=hole`);
  const opts = { start: 'NP', digits: 'NUM', types: { rule: 'x.rule' }, classes: { DET: 'x.det', PREP: 'x.prep', ORD: 'x.ord' },
    lexicon: { star: { cat: 'N' }, house: { cat: 'N' }, door: { cat: 'N' }, tables: { cat: 'N', lemma: 'table' }, table: { cat: 'N' }, red: { cat: 'MOD' } } };
  const cats = { det: 'DET', num: 'NUM', mod: 'MOD', head: 'N', pp: 'PP', ord: 'ORD' };
  const np = (s) => nounPhrase(parseText(w, s, opts)[0].tree, cats);
  assert.deepEqual(np('the third red table'), { span: [0, 4], rule: 'r1', det: 'the', ord: '3', mods: ['red'], head: 'table', lemma: 'table' }, 'an ordinal from a closed class, with its value as lemma');
  assert.equal(np('each table').quant, 'each', 'one of several literal words');
  assert.equal(np('table 2').num, '2', 'digits, when the grammar names their category');
  assert.deepEqual(np('the star next to the house').pp[0].words, ['next to', 'the', 'house'], 'a word of several parts (next_to) is one token; NP -> NP PP grows to the left');
  assert.deepEqual([np("the house's door").head, np("the house's door").parts[0].head], ['door', 'house'], "the rule's head decides: the door, of the house");
  assert.equal(np('everything').rule, 'r7', 'a rule made of one literal word');
  assert.equal(parseText(w, 'star house', opts).length, 0, 'a rule with status=hole is not read');
});

// PSys2's English grammar hand-over (CC0), read in place: the integration test asked for by the reviewer (01:20)
const HANDOVER = new URL('../../ml-circuits-research/psys2/handover/lang.en/', import.meta.url);
test('grammar: the lang.en hand-over facts read in place parse every noun-phrase example they give', { skip: !existsSync(HANDOVER) && 'the hand-over is not checked out next to the library' }, () => {
  const w = new World();
  for (const f of ['np', 'determiners', 'numbers', 'prepositions', 'pronouns']) assert.ok(w.tell(readFileSync(new URL(`shards/${f}.sop`, HANDOVER), 'utf8')).ok, f);
  const lexicon = Object.fromEntries('house star table circle door guest crocodile'.split(' ').map((x) => [x, { cat: 'N' }]));
  Object.assign(lexicon, { tables: { cat: 'N', lemma: 'table' }, legs: { cat: 'N', lemma: 'leg' }, eyes: { cat: 'N', lemma: 'eye' }, big: { cat: 'MOD' }, red: { cat: 'MOD' }, ann: { cat: 'NAME' } });
  const opts = { start: 'NP', digits: 'NUM', types: { rule: 'lang.en.rule' }, classes: { DET: 'lang.en.det', NUM: 'lang.en.numeral', ORD: 'lang.en.ordinal', PREP: 'lang.en.prep', PRON: 'lang.en.pron' }, lexicon };
  const cases = { 'the big red house': 'house', '3 red tables': 'table', 'table 2': 'table', 'guest Ann': 'guest', 'the third table': 'table', 'the last circle': 'circle', 'all the tables': 'table', 'each guest': 'guest', 'both eyes': 'eye', 'everything': undefined, 'the legs of the crocodile': 'leg', "the house's door": 'door', 'the star next to the house': 'star', 'it': undefined };
  for (const [s, lemma] of Object.entries(cases)) {
    const p = parseText(w, s, opts);
    assert.ok(p.length, `parses: ${s}`);
    assert.equal(nounPhrase(p[0].tree, { det: 'DET', num: 'NUM', mod: 'MOD', head: 'N', pp: 'PP', ord: 'ORD', name: 'NAME', pron: 'PRON' }).lemma, lemma, s);
  }
});

test('grammar: views — the words a caller uses, and where two views disagree', () => {
  const w = new World();
  w.tell('@a x.det text=the in=v1 in=v2  @b x.det text=a in=v1  @c x.det text=every in=v2  @d x.det text=no_more in=v2');
  assert.deepEqual(grammarView(w, 'x.det', 'v1'), ['a', 'the']);
  assert.deepEqual(grammarView(w, 'x.det'), ['a', 'every', 'no more', 'the']);
  assert.deepEqual(viewDiff(w, 'x.det', 'v1', 'v2'), { only: { v1: ['a'], v2: ['every', 'no more'] }, both: ['the'] });
});
