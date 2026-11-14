// The knowledge repository's w.lang.ro (its first draft), read in place at its commit in
// repos.pin: the round trip analyse(generate(x)) for every lemma of its dictionary and every
// cell of its class, in exact spelling and typed without diacritics (Q51, Q52); replies
// realised from its templates. The words are the language world's data; the library holds
// no Romanian.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { World, morphOf, generate, analyse, fold, dictionary, realise, templateFor } from '../tools/lib-under-test.mjs';
import { worldText, worldsDir } from '../tools/worlds.mjs';

const D = worldsDir() ? `${worldsDir()}docs/worlds/w.lang.ro/dictionary/` : null;
const skip = (!D || !existsSync(D)) && 'the knowledge repository (with w.lang.ro) cannot be read here';
const T = { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', vowel: 'w.lang.ro.vowel', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', template: 'w.lang.ro.template' };
const setup = () => {
  const w = new World(); assert.ok(w.tell(worldText('w.lang.ro')).ok);
  const m = morphOf(w, { types: T }), exact = morphOf(w, { types: { ...T, fold: 'w.lang.ro.none' } });
  const file = (p) => (existsSync(`${D}${p}.tsv`) ? readFileSync(`${D}${p}.tsv`, 'utf8') : null);
  const lex = readdirSync(D).flatMap((f) => readFileSync(D + f, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t').slice(0, 2)));
  return { m, exact, lex, dict: dictionary({ read: file, fold: (s) => fold(m, s) }), dictExact: dictionary({ read: (p) => file(fold(m, p)) }) };
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

test('w.lang.ro: round trip for every lemma and cell, exact spelling and typed without diacritics', { skip }, () => {
  const { m, exact, lex, dict, dictExact } = setup();
  let cells = 0, ok = 0, okFolded = 0;
  for (const [lemma, cls] of lex) for (const cell of m.classes.get(cls).cells.values()) {
    cells++;
    const form = generate(exact, lemma, cls, cell.feat);
    if (analyse(exact, form, { dictionary: dictExact }).some((x) => x.lemma === lemma && x.class === cls && same(x.features, cell.feat))) ok++;
    if (analyse(m, fold(m, generate(m, lemma, cls, cell.feat)), { dictionary: dict }).some((x) => x.lemma === lemma && x.class === cls && same(x.features, cell.feat))) okFolded++;
  }
  assert.deepEqual([cells, ok, okFolded], [cells, cells, cells], 'every cell comes back, both ways');
  assert.ok(cells > 2000);
});

test('w.lang.ro: replies from its templates, the adjective agreeing with the noun', { skip }, () => {
  const { m, dict } = setup();
  const base = { num: 'sg', case: 'nomacc' };
  assert.equal(realise(m, templateFor(m, 'make'), { kind: 'casă', colour: 'roșu' }, { dictionary: dict, base }), 'am desenat casă roșie');
  assert.equal(realise(m, templateFor(m, 'make'), { kind: 'copac', colour: 'verde' }, { dictionary: dict, base }), 'am desenat copac verde');
  assert.equal(realise(m, templateFor(m, 'remove'), { thing: 'stea' }, { dictionary: dict, base }), 'am șters steaua');
  assert.equal(realise(m, templateFor(m, 'change'), { thing: 'mașină', colour: 'galben' }, { dictionary: dict, base }), 'mașina este acum galbenă');
});
