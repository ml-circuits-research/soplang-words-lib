// The pattern index (Round 19, item 7): only the patterns a sentence can match.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PatternIndex } from '../tools/lib-under-test.mjs';

const PATTERNS = [
  { id: 'draw', kind: 'do', needs: [['draw', 'paint', 'make']] },
  { id: 'move', kind: 'do', needs: [['move', 'put'], ['left', 'right', 'up', 'down']] },
  { id: 'colour', kind: 'set', needs: [['red', 'blue', 'green']] },
  { id: 'hangman', kind: 'do', needs: ['hangman', ['word', 'letter']] },
  { id: 'yes', kind: 'answer', needs: [['yes', 'yeah', 'sure']] },
  { id: 'catch', kind: 'fallback' }, // needs no word: always tried
];

test('pattern index: a sentence gets only the patterns whose needed words it has, in the order added', () => {
  const ix = new PatternIndex(PATTERNS);
  const ids = (s, o) => ix.candidates(s, o).map((p) => p.id);
  assert.deepEqual(ids('Draw a RED cup'), ['draw', 'colour', 'catch']);
  assert.deepEqual(ids('move it to the right'), ['move', 'catch']);
  assert.deepEqual(ids('move it'), ['catch'], 'a pattern needs one word of every set');
  assert.deepEqual(ids('hangman word cat'), ['hangman', 'catch']);
  assert.deepEqual(ids(['paint', 'it', 'blue'], { kind: 'do' }), ['draw']);
  assert.deepEqual(ids('sure', { kind: ['answer', 'fallback'] }), ['yes', 'catch']);
  ix.add({ id: 'again', kind: 'do', needs: [['again']], value: 42 });
  assert.deepEqual(ix.candidates('draw it again').map((p) => [p.id, p.value]), [['draw', undefined], ['catch', undefined], ['again', 42]]);
  assert.deepEqual(ix.stats(), { patterns: 7, words: 13, open: 1, perSentence: 2 });
});

test('pattern index: each pattern is kept under its rarest set; the answer does not depend on it', () => {
  const many = Array.from({ length: 50 }, (_, i) => ({ id: `p${i}`, needs: ['the', `w${i}`] }));
  const ix = new PatternIndex(many);
  assert.deepEqual(ix.candidates('the w7 thing').map((p) => p.id), ['p7']);
  assert.equal(ix.stats().words, 50, 'anchored on w0..w49, not on "the"');
  const plain = (s) => many.filter((p) => p.needs.every((n) => s.split(' ').includes(n))).map((p) => p.id);
  for (const s of ['the w1 w2', 'w3', 'the', 'the w49 w0']) assert.deepEqual(ix.candidates(s).map((p) => p.id), plain(s), s);
});
