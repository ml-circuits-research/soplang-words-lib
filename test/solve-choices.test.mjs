// Choice points solved jointly (std.plan, reviewer 15:15 item 1): hard constraints prune, weights
// order a seeded draw, the same seed gives the same solution, and no solution is said with where.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveChoices } from '../tools/lib-under-test.mjs';

const distinct = (p) => new Set(Object.values(p)).size === Object.keys(p).length;
test('solveChoices: joint, weighted, seeded, bounded', () => {
  const r = solveChoices(['a', 'b', 'c'], { domain: () => [1, 2, 3], ok: distinct, seed: 5 });
  assert.ok(distinct(r.values) && Object.keys(r.values).length === 3);
  assert.deepEqual(solveChoices(['a', 'b', 'c'], { domain: () => [1, 2, 3], ok: distinct, seed: 5 }).values, r.values, 'same seed, same draw');
  const heavy = solveChoices(['a'], { domain: () => ['x', 'y'], weight: (v, c) => (c === 'y' ? 1 : 0) });
  assert.equal(heavy.values.a, 'y', 'weight 0 is never drawn');
  const none = solveChoices(['a', 'b', 'c', 'd'], { domain: () => [1, 2, 3], ok: distinct });
  assert.match(none.why, /no assignment/); assert.equal(none.deepest, 'd');
  assert.match(solveChoices(['a', 'b', 'c', 'd', 'e'], { domain: () => [1, 2, 3, 4], ok: distinct, limit: 10 }).why, /within 10 nodes/);
  const later = solveChoices(['x', 'y'], { domain: (v, p) => (v === 'y' ? [p.x * 2] : [1, 2]), seed: 2 });
  assert.equal(later.values.y, later.values.x * 2, 'a domain may depend on the choices before it');
});
