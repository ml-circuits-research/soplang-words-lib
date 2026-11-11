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

// ---- the semantics cite tests that exist ---------------------------------------------------
import { readdirSync } from 'node:fs';

test('docs: every test that docs/semantics.md cites exists, and every statement cites one', () => {
  const dir = new URL('../test/', import.meta.url);
  const names = new Set();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.test.mjs')) continue;
    for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/^test\((['"`])(.*)\1, /gm)) names.add(m[2].replace(/\\(.)/g, '$1'));
  }
  const text = readFileSync(new URL('../docs/semantics.md', import.meta.url), 'utf8');
  const statements = text.split(/\n(?=\*\*S\d+\.\*\*)/).slice(1);
  assert.ok(statements.length >= 60, `${statements.length} statements`);
  statements.forEach((s, i) => {
    const id = s.match(/^\*\*(S\d+)\.\*\*/)[1];
    assert.equal(id, `S${i + 1}`, 'statements are numbered in order');
    const cited = [...s.split(/\n## /)[0].matchAll(/\*Tests?:\*((?:\s*`[^`]+`;?)+)/g)].flatMap((m) => [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]));
    assert.ok(cited.length > 0, `${id} names no test`);
    for (const name of cited) assert.ok(names.has(name), `${id} cites a test that does not exist: ${name}`);
  });
});

test('docs: every kind of violation the library raises is in the table of docs/semantics.md', () => {
  const text = readFileSync(new URL('../docs/semantics.md', import.meta.url), 'utf8');
  const table = text.slice(text.indexOf('\n## Violations'));
  const listed = new Set([...table.matchAll(/`([a-z-]+)`/g)].map((m) => m[1]));
  const src = new URL('../src/', import.meta.url);
  const notViolations = new Set(['chosen', 'default', 'forced', 'explanation', 'value', 'atom', 'string', 'ref', 'var']); // kinds of suggestions, rankings and values
  for (const f of readdirSync(src)) {
    if (!f.endsWith('.mjs')) continue;
    for (const m of readFileSync(new URL(f, src), 'utf8').matchAll(/kind: '([a-z-]+)'/g)) {
      if (!notViolations.has(m[1])) assert.ok(listed.has(m[1]), `${m[1]} (${f}) is not in the table of violations`);
    }
  }
});

// ---- the API page, the type declarations and the library name the same things -------------
import * as library from '../tools/lib-under-test.mjs';

test('docs: api.md, index.d.ts and the library agree on every export and every public method', async () => {
  const api = readFileSync(new URL('../docs/api.md', import.meta.url), 'utf8');
  const dts = readFileSync(new URL('../src/index.d.ts', import.meta.url), 'utf8');
  const lib = await import(process.env.SOPWORLD_BUNDLE ? '../docs/sopworld.mjs' : '../src/index.mjs');
  const headings = [...api.matchAll(/^### (.*)$/gm)].map((m) => m[1]).join('\n');

  // exports
  const exported = Object.keys(lib).filter((n) => n !== 'default');
  const declared = new Set([...dts.matchAll(/^export (?:declare )?(?:const|function|class) (\w+)/gm)].map((m) => m[1]));
  for (const name of exported) {
    assert.ok(new RegExp(`(^|[\\s,(])${name}\\b`).test(headings), `export ${name} has no entry in docs/api.md`);
    assert.ok(declared.has(name), `export ${name} is not declared in src/index.d.ts`);
    assert.ok(name in library, `export ${name} is not reachable through tools/lib-under-test.mjs`);
  }
  for (const name of declared) assert.ok(exported.includes(name), `src/index.d.ts declares ${name}, which the library does not export`);

  // methods of a world
  const own = (o) => Object.getOwnPropertyNames(o).filter((n) => !n.startsWith('_') && !['constructor', 'length', 'name', 'prototype'].includes(n));
  const methods = own(lib.World.prototype), statics = own(lib.World);
  const body = dts.slice(dts.indexOf('export class World {'));
  const cls = body.slice(0, body.indexOf('\n}\n'));
  const typedMethods = new Set([...cls.matchAll(/^  (?:get )?(\w+)(?:<[^>]*>)?\(/gm)].map((m) => m[1]));
  const typedStatics = new Set([...cls.matchAll(/^  static (\w+)\(/gm)].map((m) => m[1]));
  for (const m of methods) {
    assert.ok(headings.includes(`world.${m}(`), `world.${m}() has no entry in docs/api.md`);
    assert.ok(typedMethods.has(m), `world.${m}() is not declared in src/index.d.ts`);
  }
  for (const m of statics) {
    assert.ok(headings.includes(`World.${m}(`), `World.${m}() has no entry in docs/api.md`);
    assert.ok(typedStatics.has(m), `World.${m}() is not declared in src/index.d.ts`);
  }
  for (const m of headings.matchAll(/\bworld\.(\w+)\(/g)) assert.ok(methods.includes(m[1]), `docs/api.md describes world.${m[1]}(), which does not exist`);
  for (const m of headings.matchAll(/\bWorld\.(\w+)\(/g)) assert.ok(statics.includes(m[1]), `docs/api.md describes World.${m[1]}(), which does not exist`);
  for (const m of typedMethods) if (m !== 'constructor') assert.ok(methods.includes(m), `src/index.d.ts declares world.${m}(), which does not exist`);
  for (const m of typedStatics) assert.ok(statics.includes(m), `src/index.d.ts declares World.${m}(), which does not exist`);

  // every entry has an example
  for (const section of api.split(/\n(?=### )/).slice(1)) assert.match(section, /```js( run)?\n/, `no example under "${section.split('\n')[0]}"`);
});

// ---- one source: the HTML pages are the markdown, and nothing stale is left ----------------
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';

test('docs: every HTML page is generated from the current text of its markdown file', () => {
  const root = new URL('../', import.meta.url);
  const sources = { 'index.html': 'SPEC.md', 'language.html': 'docs/language.md', 'reference.html': 'docs/reference.md', 'semantics.html': 'docs/semantics.md', 'api.html': 'docs/api.md', 'glossary.html': 'docs/glossary.md', 'integration.html': 'docs/integration.md' };
  for (const [page, source] of Object.entries(sources)) {
    const hash = createHash('sha256').update(readFileSync(new URL(source, root))).digest('hex').slice(0, 12);
    const html = readFileSync(new URL(`docs/${page}`, root), 'utf8');
    assert.ok(html.includes(`<meta name="source-hash" content="${hash}">`), `docs/${page} is not built from the current ${source}: run python3 tools/build_docs.py`);
  }
  const pages = readdirSync(new URL('docs/', root)).filter((f) => f.endsWith('.html'));
  for (const p of pages) assert.ok(p in sources || ['playground.html', 'selftest.html'].includes(p), `docs/${p} has no markdown source`);
  for (const f of readdirSync(new URL('docs/', root)).filter((x) => x.endsWith('.md') && x !== 'version.md')) {
    assert.ok(Object.values(sources).includes(`docs/${f}`), `docs/${f} has no HTML page`);
  }
});

test('docs: nothing in the documentation speaks of an earlier state of the library', async () => {
  const root = new URL('../', import.meta.url);
  const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const files = ['SPEC.md', 'README.md', ...readdirSync(new URL('docs/', root)).filter((f) => /\.(md|html)$/.test(f)).map((f) => `docs/${f}`)];
  for (const f of files) {
    const text = readFileSync(new URL(f, root), 'utf8').replace(/<style[\s\S]*?<\/style>/g, '');
    assert.doesNotMatch(text, /seven wire types/i, f);
    // "before version N" is history and stays true; anything else that names a version must name this one
    for (const m of text.matchAll(/(?<!before )\b(?:version|sopworld|since|in) (0\.\d+)(?:\.\d+)?\b/gi)) {
      assert.ok(version.startsWith(m[1]), `${f} mentions ${m[0]}; the version is ${version}`);
    }
    // the language page is where the old declaration is shown, once, as something still read
    if (!/language\.(md|html)$/.test(f)) assert.doesNotMatch(text, /(^|[^@\w$?])\?[a-z]\w* [a-z][\w.]* [a-z][\w.]*=/m, `${f} declares a pattern the old way (?id type ...)`);
  }
  assert.ok(existsSync(new URL('docs/version.md', root)));
});

test('docs: every statement of the Scope chapter of docs/language.md cites a test that exists', () => {
  const dir = new URL('../test/', import.meta.url);
  const names = new Set();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.test.mjs')) continue;
    for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/^test\((['"`])(.*)\1, /gm)) names.add(m[2].replace(/\\(.)/g, '$1'));
  }
  const text = readFileSync(new URL('../docs/language.md', import.meta.url), 'utf8');
  const scope = text.slice(text.indexOf('## 12. Scope'));
  const statements = scope.split(/\n(?=\*\*SC\d+\.)/).slice(1);
  assert.ok(statements.length >= 7);
  for (const s of statements) {
    const cited = [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((x) => names.has(x));
    const claimed = [...s.matchAll(/\*Tests?:\*((?:\s*`[^`]+`;?)+)/g)].flatMap((m) => [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]));
    assert.ok(claimed.length > 0, `${s.slice(0, 12)} names no test`);
    for (const c of claimed) assert.ok(names.has(c), `${s.slice(0, 12)} cites a test that does not exist: ${c}`);
    assert.ok(cited.length >= claimed.length);
  }
});
