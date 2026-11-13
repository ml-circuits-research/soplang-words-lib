#!/usr/bin/env node
// Validate a world in one command (Round 24, A6): load its files into a World (with the
// standard pack and, with --advise, advice for authors), report what is refused and what
// is noted, and, for schema worlds, the holes of the coverage grid.
//
//   node tools/validate.mjs [--advise] <file.sop | file.mjs> ...
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { World, schemaGrid } from '../src/index.mjs';

const args = process.argv.slice(2), advise = args.includes('--advise');
const texts = [];
for (const f of args.filter((a) => !a.startsWith('--'))) { // bounded: the files given
  if (extname(f) === '.mjs') { const m = await import(pathToFileURL(resolve(f)).href); texts.push(...Object.values(m).filter((v) => typeof v === 'string' && /(^|\s)@[\w.]+ [\w.]+/.test(v))); } else texts.push(readFileSync(f, 'utf8'));
}
const w = new World({ advise });
const all = texts.join('\n'), notes0 = [];
// a schema world needs the acts: loaded when the files use std.schema and do not load them
if (/\bstd\.schema\./.test(all) && !/core\.use\s+world=std\.acts\b/.test(all)) { w.tell('@validate.acts core.use world=std.acts'); notes0.push('note: the files declare std.schema worlds and do not load std.acts: loaded here (add `core.use world=std.acts`)'); }
const r = w.tell(all);
const refused = r.violations.map((v) => `refused: ${v.kind}: ${v.why || v.id || ''}`);
const notes = [...notes0, ...w.warnings.map((x) => `${x.kind}: ${x.why}`)];
let holes = [];
if (r.ok && w.ofType('std.schema.world').length) holes = schemaGrid(w).filter((c) => !c.expect.ok).map((c) => `hole: ${c.world} × ${c.kind} × ${c.act}: "${c.text}": ${c.expect.why}`);
for (const l of [...refused, ...notes, ...holes]) console.log(l);
console.log(`${r.ok ? 'ok' : 'refused'}: ${w.size ?? [...w.wires.keys()].length} wires, ${w.matrix.size} matrix wires, ${refused.length} refused, ${notes.length} notes, ${holes.length} grid holes`);
process.exit(r.ok ? 0 : 1);
