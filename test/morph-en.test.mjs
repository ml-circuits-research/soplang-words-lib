// Plurals and articles from the language world's facts (reviewer 22:30, [KNOW] Q54): the published
// w.lang.en (read in place at the pinned commit) gives the suffix rules, the irregulars, the articles
// and the onsets; std.morph applies them. No English in the library.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflectBy, articleFor, discourseRealiser } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';

test('inflectBy and articleFor over the published w.lang.en: plurals by rules and irregulars, a/an by onset', { skip: !worldsDir() && 'offline' }, async () => {
  const w = await catalogWorld({ 'w.lang.en': ['w.lang.en.inflect', 'w.lang.en.irregular', 'w.lang.en.det', 'w.lang.en.onset', 'w.lang.en.discourse', 'w.lang.en.slot'] });
  assert.deepEqual(['cat', 'box', 'baby', 'day', 'church', 'analysis', 'antenna'].map((x) => inflectBy(w, x)), ['cats', 'boxes', 'babies', 'days', 'churches', 'analyses', 'antennas']);
  assert.deepEqual(['owl', 'cow', 'hour', 'unicorn', 'umbrella', 'heir'].map((x) => articleFor(w, x)), ['an', 'a', 'an', 'a', 'an', 'an']);
  const r = discourseRealiser(w);
  const t = r({ move: 'introduce topic' }, 'scientific', { topic: 'owls' }, { kind: 'bird' });
  assert.ok(t === null || !/\ba [aeiou]/i.test(t.text), 'the article follows the next word');
});
