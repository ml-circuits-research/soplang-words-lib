#!/usr/bin/env node
// How many worlds cooperate without code (standing direction, item 4): for each example and
// the case corpus, the library modules and schema worlds loaded together; a pair counts when
// the two are loaded in one world (the standard modules a module loads itself count too).
// `node tools/cooperation.mjs`
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const files = [...readdirSync(join(root, 'examples')).map((f) => join(root, 'examples', f)).flatMap((p) => (statSync(p).isDirectory() ? readdirSync(p).map((f) => join(p, f)) : [p])), ...readdirSync(join(root, 'cases/schemas')).map((f) => join(root, 'cases/schemas', f))];
const LOADS = { 'std.acts': ['std.schema'], 'std.focus': ['std.fill'], 'std.know': ['std.fill'] };
const pairs = new Map();
for (const f of files) { // bounded: the files
  const text = readFileSync(f, 'utf8');
  const mods = new Set([...text.matchAll(/core\.use world=(std\.[a-z]+)/g)].map((m) => m[1]));
  for (const m of [...mods]) for (const x of LOADS[m] || []) mods.add(x);
  const worlds = new Set([...text.matchAll(/std\.schema\.world name=([\w.]+)/g)].map((m) => `world:${m[1]}`));
  const all = [...mods, ...worlds].sort();
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const k = `${all[i]} + ${all[j]}`; (pairs.get(k) || pairs.set(k, new Set()).get(k)).add(f.replace(root, '')); }
}
console.log(`${pairs.size} pairs cooperate in ${files.length} files:`);
for (const [k, fs] of [...pairs].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))) console.log(`  ${k}: ${[...fs].join(', ')}`);
