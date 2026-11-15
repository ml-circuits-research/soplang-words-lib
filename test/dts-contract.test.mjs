// The d.ts against the code by shape (architecture review finding 37, R4): every option an exported function
// destructures is declared in its index.d.ts options. The docs test checks the names of exports; this one their options.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');

test('index.d.ts declares every option an exported function reads', () => {
  const dir = new URL('../src/', import.meta.url);
  const src = readdirSync(dir).filter((f) => f.endsWith('.mjs')).map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
  const dts = read('../src/index.d.ts');
  const exported = new Set([...read('../src/index.mjs').matchAll(/export \{([^}]*)\}/g)].flatMap((m) => m[1].split(',').map((x) => x.trim())).filter(Boolean));
  const gaps = [];
  let checked = 0;
  for (const m of src.matchAll(/export function (\w+)\(([^)]*?)\{([^}]*)\}\s*=\s*\{\}\)\s*\{/g)) { // a last parameter destructured on one line, defaults without parentheses
    if (!exported.has(m[1])) continue;
    const keys = m[3].split(',').map((x) => x.trim().split(/[\s=:]/)[0]).filter((x) => /^\w+$/.test(x));
    const d = dts.match(new RegExp(`export function ${m[1]}(?:<[^>]*>)?\\(([^\\n]*)`));
    assert.ok(d, `${m[1]} has no declaration`);
    checked++;
    const missing = keys.filter((k) => !new RegExp(`[{;,&]\\s*${k}\\??:`).test(d[1]));
    if (missing.length) gaps.push(`${m[1]}: ${missing.join(', ')}`);
  }
  assert.ok(checked > 60, `${checked} functions checked`);
  assert.deepEqual(gaps, []);
});
