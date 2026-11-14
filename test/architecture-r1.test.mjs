// The architecture review's serious findings (reviewer 10:10, R1), each with the test that would have caught it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose } from '../src/rank.mjs'; // imported before anything else: its default criteria must not depend on import order
import { World, readByTypes, typedLexicon, valueText, defaultReaders } from '../tools/lib-under-test.mjs';
import { seeded, below } from '../src/random.mjs';

test('R1.4 choose ranks by std.decide\'s criteria whatever was imported first', () => {
  const r = choose(null, 'reading', [{ unread: 3 }, { unread: 0 }]);
  assert.deepEqual(r.best, { unread: 0 });
  assert.ok(r.criteria.length > 1);
});

test('R1.1 a per-world cache follows a changed value (revise, then read again)', () => {
  const w = new World();
  w.tell('@a animal name=cow sound=moo  @v core.word text=says means=sound');
  assert.ok(typedLexicon(w).has('moo'));
  w.revise('a', 'sound', 'low');
  assert.ok(typedLexicon(w).has('low') && !typedLexicon(w).has('moo'), 'the lexicon is built again after a value changed');
  assert.equal(readByTypes(w, 'which animal says low', { question: ['which'] }).best?.answer?.[0], 'a');
});

test('R1.2 one seeded generator: a two-value draw gives both values over seeds', () => {
  for (const seed of [1, 3, 12345, 99991]) {
    const r = seeded(seed), seen = new Set();
    for (let i = 0; i < 20; i++) seen.add(below(r, 2));
    assert.deepEqual([...seen].sort(), [0, 1], `seed ${seed}`);
  }
  assert.deepEqual([seeded(7)(), seeded(7)()], [seeded(7)(), seeded(7)()], 'the same seed, the same sequence');
});

test('R1.3 valueText decodes the escapes of a quoted value', () => {
  assert.equal(valueText('"the \\"big\\" one"'), 'the "big" one');
  assert.equal(valueText('"a\\nb"'), 'a\nb');
  assert.equal(valueText('plain'), 'plain');
  assert.equal(valueText(undefined), '');
});

test('R1.6 the default ensemble voices are independent readers', () => {
  assert.deepEqual(Object.keys(defaultReaders()).sort(), ['canonical', 'types']);
});
