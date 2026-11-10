// The documentation is checked like code: its examples are run, and what it lists is
// compared with what the library has.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkText, docFiles } from '../tools/doc-examples.mjs';

test('docs: every runnable example prints what the document shows', () => {
  let blocks = 0;
  for (const file of docFiles()) {
    const r = checkText(readFileSync(file, 'utf8'));
    blocks += r.blocks;
    assert.deepEqual(r.problems, [], file);
  }
  assert.ok(blocks >= 6, `${blocks} examples`);
  console.log(`# ${blocks} documented examples run`);
});

// ---- the reference lists exactly what the library has -------------------------------------
import { GRAMMAR, MODIFIERS, SCHEMA_TYPES, builtins, aggregates } from '../tools/lib-under-test.mjs';

const reference = readFileSync(new URL('../docs/reference.md', import.meta.url), 'utf8');
/** The text of the entry whose heading names `type`, up to the next heading of the same depth. */
function entry(type) {
  const at = reference.search(new RegExp(`^### .*${type.replace(/\./g, '\\.')}(,|$)`, 'm'));
  if (at < 0) return null;
  const rest = reference.slice(at + 4);
  const end = rest.search(/^#{2,3} /m);
  return end < 0 ? rest : rest.slice(0, end);
}
/** The attribute names in the first column of the entry's syntax table. */
function documented(text) {
  const names = new Set();
  for (const row of text.matchAll(/^\| ([^|]+) \|/gm)) {
    for (const m of row[1].matchAll(/`([a-z][\w.]*?)(<[^>`]*>)?`/g)) names.add(m[1]);
  }
  return names;
}

test('docs: every matrix wire type has an entry in the reference, and every entry is a type', () => {
  const types = new Set([...SCHEMA_TYPES, ...Object.keys(GRAMMAR)]);
  for (const t of types) assert.ok(entry(t), `no entry for ${t} in docs/reference.md`);
  const fact = new Set(['core.issue', 'core.question', 'core.answer', 'core.request']); // written by the world or the host
  for (const m of reference.matchAll(/^### (core\.[\w., ]+)$/gm)) {
    for (const t of m[1].split(/,\s*/)) assert.ok(types.has(t) || fact.has(t), `the reference describes ${t}, which the library does not know`);
  }
  for (const section of ['Syntax', 'Meaning', 'When it is evaluated', 'Interactions', 'Violations', 'Example', 'Limits']) {
    for (const t of Object.keys(GRAMMAR)) {
      if (['Interactions', 'Violations', 'When it is evaluated', 'Limits'].includes(section) && ['core.precision'].includes(t)) continue;
      assert.match(entry(t), new RegExp(`\\*\\*${section}`), `${t} has no "${section}"`);
    }
  }
});

test('docs: every attribute a type reads is in its table, and the table lists nothing else', () => {
  for (const [type, attrs] of Object.entries(GRAMMAR)) {
    if (type === 'core.schema.map') continue;          // its fields are named by the host's notation
    const have = documented(entry(type).split('**Meaning')[0]);
    const want = new Set(attrs.map((a) => a));
    for (const a of want) assert.ok(have.has(a), `${type}: attribute ${a} is not documented`);
    for (const a of have) assert.ok(want.has(a), `${type}: the reference lists ${a}, which the type does not read`);
  }
  for (const m of Object.keys(MODIFIERS)) assert.ok(reference.includes(`| \`${m}\` |`), `modifier ${m} is not documented`);
});

test('docs: every built-in function and aggregate is in the reference, and the reverse', () => {
  const fns = reference.slice(reference.indexOf('\n## Functions'));
  const listed = new Set();
  for (const row of fns.matchAll(/^\| ([^|]+) \|/gm)) for (const m of row[1].matchAll(/`([a-z_]+)`/g)) listed.add(m[1]);
  const have = new Set([...Object.keys(builtins), ...Object.keys(aggregates)]);
  for (const f of have) assert.ok(listed.has(f), `function ${f} is not in docs/reference.md`);
  for (const f of listed) assert.ok(have.has(f), `the reference lists ${f}, which is not a function`);
});
