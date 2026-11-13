// Refusable readings (Round 19, item 5): score is the dry run. For each candidate reading it
// says whether the world would refuse it now and why, and changes nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { GAMES, READINGS } from '../examples/refusal.mjs';

const verdicts = (w) => w.score(READINGS).candidates.map((c) => (c.ok ? (c.lacks.length ? `lacks ${c.lacks.map((l) => l.key).join(',')}` : 'ok') : `${c.judgedBy}: ${c.violations[0].why}`));

test('refusable readings: score says which readings the present state would refuse, and why', () => {
  const w = new World();
  w.load(GAMES);
  assert.deepEqual(verdicts(w), [
    'action: nothing matches game name=hangman state=running', // a declared action: its guard
    'denies: no game of hangman runs', // a host action: a deny on the wire it would be
    'ok',
    'lacks thing', // not refused, incomplete: the question to ask is in lacks
  ]);
  w.tell('@g1 game name=hangman state=running');
  assert.deepEqual(verdicts(w), ['ok', 'ok', 'ok', 'lacks thing']);
  assert.ok(w.revise('g1', 'state', 'over').ok);
  assert.deepEqual(verdicts(w).slice(0, 2), ['action: nothing matches game name=hangman state=running', 'denies: no game of hangman runs']);
});

test('refusable readings: nothing is applied, nothing is recorded', () => {
  const w = new World();
  w.load(GAMES);
  w.tell('@g1 game name=hangman state=running');
  const before = [w.toSOP({ derived: true }), w.history().length];
  w.score(READINGS);
  assert.deepEqual([w.toSOP({ derived: true }), w.history().length], before);
  assert.equal(w.get('g1').attrs.guess, undefined);
});
