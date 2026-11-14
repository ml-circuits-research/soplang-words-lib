// std.morph (Round 30): paradigm classes as rules, run both ways, on an invented toy
// language ("Toyish"). Nothing of a real language in the library.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, morphOf, generate, analyse, fold, splitClitics, dictionary, realise, templateFor } from '../tools/lib-under-test.mjs';

export const TOYISH = String.raw`
# Toyish, an invented language for the tests: two noun classes (one with a subclass), an adjective class
@c1 m.class name=n1 alt=a>e
@e1 m.ending class=n1 num=sg def=no suffix=_
@e2 m.ending class=n1 num=sg def=yes suffix=ul
@e3 m.ending class=n1 num=pl def=no suffix=i alt=yes
@e4 m.ending class=n1 num=pl def=yes suffix=ii alt=yes
@c2 m.class name=n2 drop=a
@e5 m.ending class=n2 num=sg def=no suffix=a
@e6 m.ending class=n2 num=sg def=yes suffix=ah
@e7 m.ending class=n2 num=pl def=no suffix=e
@e8 m.ending class=n2 num=pl def=yes suffix=ele
@c3 m.class name=n2t parent=n2 alt=t>ts
@e9 m.ending class=n2t num=pl def=no suffix=i alt=yes
@c4 m.class name=a1
@a1 m.ending class=a1 gender=m num=sg suffix=_
@a2 m.ending class=a1 gender=f num=sg suffix=a
@a3 m.ending class=a1 gender=m num=pl suffix=i
@a4 m.ending class=a1 gender=f num=pl suffix=e
@i1 m.irregular lemma=om num=pl def=no form=oameni
@f1 m.fold from=ō to=o
@s1 m.split text="-"
@t1 m.template act=make text="am facut {thing:num=sg,def=no} {colour@thing}"
`;
const DICT = { b: 'bak\tn1\tm\tk.words.box', k: 'kata\tn2\tf', p: 'pōta\tn2t\tf\tk.words.door', o: 'om\tn1\tm', r: 'rum\ta1' };

const setup = () => { const w = new World(); w.tell(TOYISH); const m = morphOf(w); return { m, d: dictionary({ read: (p) => DICT[p] ?? null, fold: (s) => fold(m, s) }) }; };

test('morph: generate by class, alternation, inheritance with an override, irregular first', () => {
  const { m } = setup();
  assert.deepEqual(['sg.no', 'sg.yes', 'pl.no', 'pl.yes'].map((c) => { const [num, def] = c.split('.'); return generate(m, 'bak', 'n1', { num, def }); }), ['bak', 'bakul', 'beki', 'bekii'], 'a>e in the plural');
  assert.deepEqual([generate(m, 'kata', 'n2', { num: 'pl', def: 'no' }), generate(m, 'pōta', 'n2t', { num: 'pl', def: 'no' }), generate(m, 'pōta', 'n2t', { num: 'pl', def: 'yes' })], ['kate', 'pōtsi', 'pōtele'], 'n2t = n2 + one override, with t>ts');
  assert.equal(generate(m, 'om', 'n1', { num: 'pl', def: 'no' }), 'oameni', 'the irregular is consulted first');
  assert.equal(generate(m, 'bak', 'n1', { num: 'dual', def: 'no' }), null);
});

test('morph: round trip — analyse(generate(x)) contains x for every class and cell', () => {
  const { m, d } = setup();
  const lemmas = { n1: 'bak', n2: 'kata', n2t: 'pōta', a1: 'rum' };
  let cells = 0;
  for (const [cls, c] of m.classes) for (const cell of c.cells.values()) {
    const form = generate(m, lemmas[cls], cls, cell.feat);
    const back = analyse(m, form, { dictionary: d }).filter((r) => r.lemma === lemmas[cls] && r.class === cls && JSON.stringify(r.features) === JSON.stringify(cell.feat));
    assert.equal(back.length, 1, `${cls} ${JSON.stringify(cell.feat)}: ${form}`);
    cells++;
  }
  assert.equal(cells, 16);
});

test('morph: a folded spelling finds the diacritic lemma; the dictionary is read by prefix, lazily; clitics split', () => {
  const { m, d } = setup();
  const r = analyse(m, 'potsi', { dictionary: d });
  assert.deepEqual([r[0].lemma, r[0].form, r[0].exact], ['pōta', 'pōtsi', false], 'potsi read as pōtsi');
  assert.deepEqual(d.loaded(), ['p'], 'only the file of p was read');
  assert.deepEqual(analyse(m, 'oameni', { dictionary: d }).map((x) => [x.lemma, x.features.num]), [['om', 'pl']]);
  const all = analyse(m, 'beki');
  assert.ok(all.some((x) => x.lemma === 'bak' && x.class === 'n1' && x.features.num === 'pl') && all.length > 1, 'without a dictionary: every reading the rules allow, the right one among them');
  assert.deepEqual(splitClitics(m, 'da-mi'), ['da', 'mi']);
});

test('morph: realise a template with agreement (gender through unification) from the language world', () => {
  const { m, d } = setup();
  const t = templateFor(m, 'make');
  assert.equal(realise(m, t, { thing: 'kata', colour: 'rum' }, { dictionary: d, base: { num: 'sg' } }), 'am facut kata ruma', 'the adjective takes the feminine of kata');
  assert.equal(realise(m, t, { thing: 'bak', colour: 'rum' }, { dictionary: d, base: { num: 'sg' } }), 'am facut bak rum');
  assert.equal(realise(m, '{thing:num=pl,def=yes}', { thing: 'pōta' }, { dictionary: d }), 'pōtele');
});
