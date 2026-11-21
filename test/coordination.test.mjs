import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coordinationParts } from '../src/index.mjs';

const words = { separators: new Set(['and', ',', 'or']), pronouns: new Set(['it', 'them', 'her']), determiners: new Set(['her']), prepositions: new Set(['of', 'to', 'near']) };
const at = (text, w, from = 0) => { const i = Array.from(text).join('').indexOf(w, from); return [i, i + w.length]; };

test('mentions split at the last coordinator of each gap, with the shared head and tail', () => {
  const text = 'draw a house and two trees near the lake';
  const parts = coordinationParts(text, { cut: [0, text.length], trigger: at(text, 'draw'), mentions: [at(text, 'house'), at(text, 'trees')], words });
  assert.deepEqual(parts.map((p) => p.text), ['draw a house near the lake', 'draw two trees near the lake']);
  assert.deepEqual(parts.map((p) => p.said), ['a house', 'two trees']);
});

test('a list left after the one noun held is cut at its coordinators; runs of coordinators are one', () => {
  const text = 'draw a sun, three clouds, and a bird';
  const parts = coordinationParts(text, { cut: [0, text.length], trigger: at(text, 'draw'), kind: at(text, 'sun'), words });
  assert.deepEqual(parts.map((p) => p.text), ['draw a sun', 'draw three clouds', 'draw a bird']);
});

test('a later clause about what was made (an ungoverned pronoun) is not a further phrase; no coordinator is no split', () => {
  const a = 'draw a cat and call it Tom';
  assert.equal(coordinationParts(a, { cut: [0, a.length], trigger: at(a, 'draw'), kind: at(a, 'cat'), words }), null);
  const b = 'draw a cat with a dog';
  assert.equal(coordinationParts(b, { cut: [0, b.length], trigger: at(b, 'draw'), mentions: [at(b, 'cat'), at(b, 'dog')], words }), null);
  assert.equal(coordinationParts(b, { cut: [0, b.length], trigger: at(b, 'draw'), kind: at(b, 'cat'), words }), null);
});
