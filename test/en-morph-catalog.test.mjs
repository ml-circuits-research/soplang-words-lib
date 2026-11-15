// English morphology from the catalog's facts (knowledge Q87, Q84): the singular of a listed singular is itself, the
// rule sets (a noun's lemma set), exception lists (us-plural, is-plural); realise takes plurals and a / an from the
// language world and can start a sentence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflectBy, morphOf, realise } from '../tools/lib-under-test.mjs';
import { catalogWorld, worldsDir } from '../tools/worlds.mjs';

const types = ['inflect', 'irregular', 'irregular_form', 'noun.exception', 'det', 'onset', 'class', 'ending'].map((x) => `w.lang.en.${x}`);

test('inflectBy on the catalog: bus, iris, buses, houses, taxis, octopuses (Q87)', { skip: !worldsDir() && 'offline' }, async () => {
  const en = await catalogWorld({ 'w.lang.en': types });
  const sg = (w) => inflectBy(en, w, 'singular'), pl = (w) => inflectBy(en, w, 'plural');
  assert.deepEqual(['bus', 'iris', 'lens', 'cactus', 'buses', 'houses', 'octopuses', 'taxis', 'kiwis', 'wolves', 'mice'].map(sg), ['bus', 'iris', 'lens', 'cactus', 'bus', 'house', 'octopus', 'taxi', 'kiwi', 'wolf', 'mouse']);
  assert.deepEqual(['house', 'taxi', 'mouse', 'box', 'cherry'].map(pl), ['houses', 'taxis', 'mice', 'boxes', 'cherries']);
  assert.equal(inflectBy(en, 'cats', 'singular', { set: 'act' }), 'cat', 'a rule set asked by name');
});

test('realise with the English language world: a / an by the next word, num=pl by its rules, a sentence (Q84)', { skip: !worldsDir() && 'offline' }, async () => {
  const en = await catalogWorld({ 'w.lang.en': types });
  const m = morphOf(en, { types: { cls: 'w.lang.en.class', ending: 'w.lang.en.ending', irregular: 'w.lang.en.irregular_form' } });
  assert.equal(realise(m, 'add a {value} {kind}.', { value: 'orange', kind: 'house' }, { sentence: true }), 'Add an orange house.');
  assert.equal(realise(m, 'add {number} {kind:num=pl}.', { number: 3, kind: 'mouse' }, { sentence: true }), 'Add 3 mice.');
  assert.equal(realise(m, 'add a {kind}.', {}), null);
});
