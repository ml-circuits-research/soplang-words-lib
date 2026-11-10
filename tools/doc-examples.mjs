#!/usr/bin/env node
// Runs the examples in the documentation and checks that what they print is what is shown.
//
//   node tools/doc-examples.mjs [--write] [file.md ...]      (default: docs/*.md)
//
// A block fenced as ```js run is executed with the library's exports in scope and a
// `print(...)` function. The block that follows it, fenced as ```output, must hold
// exactly what was printed. With --write the output blocks are (re)written instead.
// Blocks do not share state. A block that throws fails the check.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const lib = await import(process.env.SOPWORLD_BUNDLE ? '../docs/sopworld.mjs' : '../src/index.mjs');

const show = (x) => (typeof x === 'string' ? x : x === undefined ? 'undefined' : JSON.stringify(x));
const BLOCK = /```js run\n([\s\S]*?)\n```(\n+```output\n([\s\S]*?)```)?/g;

/** Run one block; returns what it printed (one line per print call). */
export function runBlock(code) {
  const lines = [];
  const print = (...xs) => lines.push(xs.map(show).join(' '));
  const names = Object.keys(lib).filter((n) => n !== 'default');
  new Function(...names, 'print', code)(...names.map((n) => lib[n]), print); // eslint-disable-line no-new-func
  return lines.join('\n');
}

/** Check (or rewrite) one markdown text. Returns { text, blocks, problems }. */
export function checkText(text, { write = false } = {}) {
  const problems = [];
  let blocks = 0;
  const out = text.replace(BLOCK, (whole, code, shownBlock, shown) => {
    blocks++;
    let printed;
    try { printed = runBlock(code); } catch (e) { problems.push(`block ${blocks} throws: ${e.message}`); return whole; }
    const want = printed ? printed + '\n' : '';
    if (!write && shown !== want) problems.push(`block ${blocks}: shown output differs from what the code prints\n--- shown\n${shown ?? '(none)'}\n--- printed\n${want}`);
    return '```js run\n' + code + '\n```\n\n```output\n' + want + '```';
  });
  return { text: write ? out : text, blocks, problems };
}

export const docFiles = () => readdirSync(join(root, 'docs')).filter((f) => f.endsWith('.md')).map((f) => join(root, 'docs', f));

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const files = args.filter((a) => a !== '--write');
  let failed = 0, total = 0;
  for (const file of files.length ? files.map((f) => resolve(f)) : docFiles()) {
    const before = readFileSync(file, 'utf8');
    const r = checkText(before, { write });
    total += r.blocks;
    if (write && r.text !== before) writeFileSync(file, r.text);
    for (const p of r.problems) { failed++; console.log(`${file}: ${p}`); }
  }
  console.log(`${total} runnable examples, ${failed} problems${write ? ' (outputs written)' : ''}`);
  if (failed) process.exit(1);
}
