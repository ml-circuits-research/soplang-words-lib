// The case corpus (standing direction, 2026-11-14): language-free cases with what should
// come out, grouped by pipeline stage; it only grows, and a release passes at least the baseline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCases } from '../tools/cases.mjs';

test('the case corpus: at least the baseline passes, per stage reported', () => {
  const base = JSON.parse(readFileSync(new URL('../cases/baseline.json', import.meta.url), 'utf8'));
  const r = runCases();
  assert.ok(r.total >= base.total, `the corpus only grows (${r.total} < ${base.total})`);
  assert.ok(r.pass >= base.pass, `passing ${r.pass} < baseline ${base.pass}: ${r.results.filter((x) => !x.ok).map((x) => `${x.id}: ${x.fail}`).join('; ')}`);
  assert.ok(Object.keys(r.byStage).length >= 3);
});
