#!/usr/bin/env node
// Rewrites the old way of declaring a pattern, `?id type ...`, as `@id type ...`.
//
//   node tools/migrate-syntax.mjs [--check] <file ...>
//
// `?` is for variables, which stand in value position (`key=?x`). A `?name` where a
// declaration starts, followed by a type name, is an old pattern declaration. The tool
// works on text, so it also converts wires that sit inside the strings of a program.
// With --check it changes nothing and exits 1 when a file would change.
import { readFileSync, writeFileSync } from 'node:fs';

// `?name` at the start of a line or after a space, a quote or a bracket, followed by a
// bare name (the type). A variable is never there: it follows `=`.
const OLD = /(^|[\s`'"([{>])\?([A-Za-z_][\w.\-]*)(?=[ \t]+[A-Za-z_][\w.\-]*(?![\w.\-]*=))/gm;

export const migrate = (text) => text.replace(OLD, '$1@$2');

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  let changed = 0;
  for (const file of args.filter((a) => a !== '--check')) {
    const before = readFileSync(file, 'utf8');
    const after = migrate(before);
    if (after === before) continue;
    changed++;
    const n = (before.match(OLD) || []).length;
    console.log(`${check ? 'would change' : 'changed'} ${file}: ${n} declaration${n === 1 ? '' : 's'}`);
    if (!check) writeFileSync(file, after);
  }
  if (check && changed) process.exit(1);
}
