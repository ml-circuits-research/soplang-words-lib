// The contextual spell repair: generic, deterministic; wrong-repair guards; a property over the example worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, repairWords, editCost, worldWords, factsOf, readRequest, SPELL_SOURCES } from '../tools/lib-under-test.mjs';
import { SKETCH, NOTES, GARDEN, exampleWorld } from '../examples/request-app.mjs';

const toy = (text) => { const w = new World(); assert.ok(w.load(text).ok); return w; };
const SHOP = `@acts core.use world=std.acts
@t.gadget core.type of=gadget extends=std.schema.thing closed=true
@s.label core.slot of=gadget key=label kind=string
@g1 gadget label="turbine"
@g2 gadget label="Zorbleton"`;
const language = () => { const l = new World(); assert.ok(l.load(`@a w.lang.en.det text=the\n@b w.lang.en.pron text=table text=banana text=cabinet`).ok); return l; };

test('editCost: keyboard neighbours, accents, doubled and swapped letters are cheap; other edits cost 1', () => {
  assert.equal(editCost('table', 'table'), 0);
  assert.ok(editCost('tabel', 'table') < 1, 'swap');
  assert.ok(editCost('tavle', 'table') < 1, 'adjacent key');
  assert.ok(editCost('cafe', 'café') < 0.2, 'missing diacritic');
  assert.ok(editCost('ballon', 'balloon') < 1, 'dropped double');
  assert.equal(editCost('table', 'tuber', 1.2), Infinity);
  assert.ok(SPELL_SOURCES.map((s) => s.source).join() === 'world,worlds,dialogue,dictionary');
});

test('repairWords: a typo of a live world word is repaired, with its source, cost and the order of the sources as data', () => {
  const w = toy(SHOP), other = toy(SHOP.replace('turbine', 'compressor'));
  const r = repairWords(['show', 'the', 'trubine', 'and', 'compresor'], { worlds: [w, other] });
  assert.deepEqual(r.tokens, ['show', 'the', 'turbine', 'and', 'compressor']);
  assert.deepEqual(r.repairs.map((x) => [x.from, x.to, x.source]), [['trubine', 'turbine', 'world'], ['compresor', 'compressor', 'worlds']]);
  assert.ok(r.repairs.every((x) => x.cost > 0 && x.cost < 1.2) && !r.asks.length);
  assert.deepEqual(repairWords(['trubine'], { worlds: [w] }), repairWords(['trubine'], { worlds: [w] }), 'deterministic');
  assert.equal(repairWords(['trubine'], { dialogue: { words: ['turbine'] } }).repairs[0].source, 'dialogue');
});

test('repairWords: wrong-repair guards (near dictionary word beats a far world word; names, known words, numbers, quotes untouched)', () => {
  const w = toy(SHOP), lang = language();
  // "tabel" is near "table" (dictionary) and far from every word of the world
  const r = repairWords(['tabel'], { worlds: [w], language: lang });
  assert.deepEqual(r.repairs.map((x) => [x.to, x.source]), [['table', 'dictionary']]);
  // a name of the world and a capitalized or quoted word are never changed; nor a known word, a number, a short word
  const n = repairWords(['zorbletno', 'Zorbletn', 'turbine', '42', 'tbl', '"', 'trubine', '"', 'Trubine'], { worlds: [w] });
  assert.equal(n.tokens[1], 'Zorbletn');
  assert.deepEqual(n.tokens.slice(2, 9), ['turbine', '42', 'tbl', '"', 'trubine', '"', 'Trubine'], 'quoted text and the capitalized name stay');
  assert.equal(repairWords(['Zorbleton'], { worlds: [w] }).repairs.length, 0);
  assert.equal(repairWords(['turbine', 'table'], { worlds: [w], language: lang }).repairs.length, 0);
  assert.equal(repairWords(['turbin'], { worlds: [w], protect: ['turbin'] }).repairs.length, 0);
});

test('repairWords: ambiguity asks instead of guessing', () => {
  const lang = language();
  const r = repairWords(['cabinat', 'banama'], { language: lang, dictionary: ['cabinet', 'cabinas'] });
  assert.deepEqual(r.repairs.map((x) => x.to), ['banana']);
  assert.equal(r.asks.length, 1);
  assert.equal(r.asks[0].from, 'cabinat');
  assert.ok(r.asks[0].candidates.map((c) => c.word).includes('cabinet') && r.asks[0].candidates.length >= 2);
  assert.equal(r.tokens[0], 'cabinat', 'an ask changes nothing');
});

test('readRequest with spell: one candidate source of the reader, no separate stage', () => {
  const w = exampleWorld(SKETCH);
  const r = readRequest(w, 'draw 3 smal red cirlces', { spell: true });
  assert.ok(r.spell.repairs.some((x) => x.to === 'circles'), JSON.stringify(r.spell));
  assert.equal(readRequest(w, 'draw 3 red circles').spell, undefined, 'off by default');
});

// Property: a swapped-letters typo of a thing's label or kind, in each example world, is repaired to it.
for (const [name, text] of [['sketch', SKETCH], ['notes', NOTES], ['garden', GARDEN]]) {
  test(`property over ${name}: a typo of a label or kind is repaired to it`, () => {
    const w = exampleWorld(text), view = factsOf(w);
    const words = [...worldWords(w)].filter((x) => x.length >= 5 && /^[a-z]+$/.test(x));
    assert.ok(words.length >= 2, 'the world offers words');
    let checked = 0;
    for (const x of words) {
      const typo = x.slice(0, 2) + x[3] + x[2] + x.slice(4); // two inner letters swapped
      if (typo === x || words.includes(typo) || worldWords(w).has(typo)) continue;
      const r = repairWords([typo], { worlds: [w] });
      const near = words.filter((y) => editCost(typo, y, 1.2) < Infinity);
      if (near.length > 1) { assert.ok(r.asks.length === 1 || r.repairs.length === 1, `${x}: repaired or asked`); continue; }
      assert.deepEqual(r.repairs.map((q) => q.to), [x], `${name}: ${typo} -> ${x}`); checked++;
    }
    assert.ok(checked >= 2, `${name}: ${checked} typos checked`);
  });
}
