// resolve(phrase) -> ids + tier (PSys2's Q11 item 2): the things a noun phrase names, over
// synonyms (core.word), modifiers, names, ordinals, numbers, sets, coordination, relations,
// the focus and one-letter slips. The grammar is a toy one; no language in the library.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, resolve } from '../tools/lib-under-test.mjs';

function scene() {
  const w = new World();
  w.tell(`
@d1 x.det text=the  @d2 x.det text=a  @o1 x.ord text=second value=2  @o2 x.ord text=last value=-1
@pr x.pron text=it  @p1 x.prep text=next_to  @p2 x.prep text=at
@r1 x.rule lhs=NP rhs=DET? rhs=ORD? rhs=MOD* rhs=N head=N
@r2 x.rule lhs=NP rhs="[all|each|both]" rhs=DET? rhs=N head=N
@r3 x.rule lhs=NP rhs=N rhs=NUM head=N
@r4 x.rule lhs=NP rhs=NUM rhs=MOD* rhs=N head=N
@r5 x.rule lhs=NP rhs=N rhs=NAME head=N
@r6 x.rule lhs=NP rhs=NP rhs=PP head=NP
@r7 x.rule lhs=PP rhs=PREP rhs=NP
@r8 x.rule lhs=NP rhs=PRON
@r9 x.rule lhs=NP rhs=everything
@c x.coord word=and
@c2 x.coord word=or kind=choice  @p3 x.prep text=of
@r10 x.rule lhs=NP rhs=NUM rhs=PP  @r12 x.rule lhs=NP rhs=NUM  @r13 x.rule lhs=NP rhs=DET rhs=MOD+
@w3 core.word text=other means=std.other
@table1 std.schema.thing kind=table color=red
@table2 std.schema.thing kind=table color=blue
@table3 std.schema.thing kind=table color=red
@guest1 std.schema.thing kind=guest name=ann at=$table2
@guest2 std.schema.thing kind=guest name=bob at=$table1
@lamp1 std.schema.thing kind=lamp color=green
@w1 core.word text=desk means=table
@w2 core.word text=crimson means=red of=color`);
  const lexicon = Object.fromEntries('table tables desk guest guests lamp lmap red blue green crimson other them ann bob'.split(' ').map((x) => [x, { cat: /^(red|blue|green|crimson|other)$/.test(x) ? 'MOD' : /^(ann|bob)$/.test(x) ? 'NAME' : 'N', lemma: x.replace(/s$/, '') }]));
  const grammar = { digits: 'NUM', types: { rule: 'x.rule', coord: 'x.coord' }, classes: { DET: 'x.det', ORD: 'x.ord', PRON: 'x.pron', PREP: 'x.prep' }, lexicon };
  const cats = { det: 'DET', num: 'NUM', mod: 'MOD', head: 'N', pp: 'PP', ord: 'ORD', name: 'NAME', pron: 'PRON' };
  return { w, r: (s, o = {}) => resolve(w, s, { grammar, cats, ...o }) };
}

test('resolve: the words pick the things (tier user); one of a kind in the scene (tier scene); a synonym through core.word', () => {
  const { r } = scene();
  assert.deepEqual(r('the blue table'), { ids: ['table2'], tier: 'user', how: ['blue: 1 left'] });
  assert.deepEqual(r('the lamp'), { ids: ['lamp1'], tier: 'scene', how: [] });
  assert.deepEqual(r('the red desk').which, ['table1', 'table3'], 'a synonym of the kind; still two');
  assert.deepEqual(r('the crimson table').which, ['table1', 'table3'], 'a synonym of a value, scoped to its key');
  assert.deepEqual(r('guest ann').ids, ['guest1'], 'a name');
});

test('resolve: ordinals, a number after the noun, a count, sets, everything', () => {
  const { r } = scene();
  assert.deepEqual(r('the second table').ids, ['table2']);
  assert.deepEqual(r('the last table').ids, ['table3']);
  assert.deepEqual(r('table 3').ids, ['table3'], 'a number after the noun is the id, when there is one');
  assert.deepEqual(r('2 red tables').ids, ['table1', 'table3'], 'a count must match');
  assert.match(r('3 red tables').why, /there are 2 tables, not 3/);
  assert.deepEqual(r('all the tables').ids, ['table1', 'table2', 'table3']);
  assert.deepEqual(r('both guests').ids, ['guest1', 'guest2']);
  assert.match(r('both tables').why, /not two/);
  assert.equal(r('everything').ids.length, 6);
});

test('resolve: coordination is the union; a relation narrows by the thing it names; focus and pronouns; one-letter slips', () => {
  const { r } = scene();
  assert.deepEqual(r('the lamp and the blue table'), { ids: ['lamp1', 'table2'], tier: 'scene', how: ['blue: 1 left'] }, 'the least sure tier of the parts');
  assert.deepEqual(r('the guest at the blue table').ids, ['guest1']);
  assert.deepEqual(r('the red table', { focus: ['table3'] }), { ids: ['table3'], tier: 'focus', how: ['red: 2 left', 'table3: the one in focus'] });
  assert.deepEqual(r('it', { focus: ['guest2'] }), { ids: ['guest2'], tier: 'focus', how: ['it = guest2 (the focus)'], guess: { word: 'it', ids: ['guest2'] } });
  assert.match(r('it').why, /nothing in focus/);
  assert.deepEqual(r('the lmap'), { ids: ['lamp1'], tier: 'slip', how: ['"lmap" read as lamp (one letter away)'] });
  assert.match(r('the chair').why, /cannot read/);
  assert.deepEqual(r('the chair').unknown, [{ word: 'chair', at: 1 }]);
});

// with PSys2's English facts (CC0, read in place; skipped when not checked out next to the library)
import { existsSync, readFileSync } from 'node:fs';
const HANDOVER = new URL('../../ml-circuits-research/psys2/handover/lang.en/', import.meta.url);
test('resolve: with the lang.en hand-over grammar, read in place', { skip: !existsSync(HANDOVER) && 'the hand-over is not checked out next to the library' }, () => {
  const w = new World();
  for (const f of ['np', 'determiners', 'numbers', 'prepositions', 'pronouns']) w.tell(readFileSync(new URL(`shards/${f}.sop`, HANDOVER), 'utf8'));
  w.tell('@table1 std.schema.thing kind=table color=red  @table2 std.schema.thing kind=table color=blue  @star1 std.schema.thing kind=star near=$table2  @star2 std.schema.thing kind=star');
  const lexicon = { table: { cat: 'N' }, tables: { cat: 'N', lemma: 'table' }, star: { cat: 'N' }, red: { cat: 'MOD' }, blue: { cat: 'MOD' } };
  const grammar = { digits: 'NUM', types: { rule: 'lang.en.rule' }, classes: { DET: 'lang.en.det', NUM: 'lang.en.numeral', ORD: 'lang.en.ordinal', PREP: 'lang.en.prep', PRON: 'lang.en.pron' }, lexicon };
  const cats = { det: 'DET', num: 'NUM', mod: 'MOD', head: 'N', pp: 'PP', ord: 'ORD', name: 'NAME', pron: 'PRON' };
  const r = (s, o = {}) => resolve(w, s, { grammar, cats, ...o });
  assert.deepEqual(r('the last table').ids, ['table2']);
  assert.deepEqual(r('table 1').ids, ['table1']);
  assert.deepEqual(r('the star next to the blue table').ids, ['star1']);
  assert.deepEqual(r('all the tables').ids, ['table1', 'table2']);
  assert.deepEqual(r('it', { focus: ['star2'] }).ids, ['star2']);
});

test('resolve (section 8): a choice is asked; a part without its noun borrows one; a part of a set; the other one', () => {
  const { r } = scene();
  assert.deepEqual([r('table 1 or table 2').ask, r('table 1 or table 2').which], [true, ['table1', 'table2']], 'never both, never the last');
  assert.deepEqual(r('tables 1 and 2').ids, ['table1', 'table2'], 'a bare number takes the noun of the part before');
  assert.equal(r('the blue or the green lamp').why, 'there is no blue lamp', 'a part without its noun takes the next one');
  assert.deepEqual(r('2 of the red tables').ids, ['table1', 'table3'], 'the count covers the set: all of it');
  assert.deepEqual([r('1 of the red tables').ask, r('1 of the red tables').which], [true, ['table1', 'table3']], 'else asked');
  assert.deepEqual(r('the other red table', { focus: ['table1'] }).ids, ['table3'], 'the other one: of the kind, not the focus');
});
