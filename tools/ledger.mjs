#!/usr/bin/env node
// The failure ledger on disk (Round 24, A6): an append-only JSONL file and a report by
// stage, class and cause.
//
//   node tools/ledger.mjs add <ledger.jsonl> <rows.jsonl>    append the rows that are new
//   node tools/ledger.mjs report <ledger.jsonl> [--signals <module.mjs>] [--out report.md]
//
// A row: { text, world, language, happened, expected, stage, class, source, first_seen,
// build, was_passing }. A signals module exports `signals`: [[name, (row) => boolean], ...].
import { readFileSync, appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ledgerAppend, ledgerGroups } from '../src/ledger.mjs';

const [cmd, file, ...rest] = process.argv.slice(2);
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
if (cmd === 'add') {
  const add = ledgerAppend(read(file), read(rest[0]));
  if (add.length) appendFileSync(file, add.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`${file}: ${add.length} rows added`);
} else if (cmd === 'report') {
  const at = (f) => { const i = rest.indexOf(f); return i >= 0 ? rest[i + 1] : undefined; };
  const signals = at('--signals') ? (await import(pathToFileURL(resolve(at('--signals'))).href)).signals : [];
  const groups = ledgerGroups(read(file), { signals });
  const md = [`# Failures by stage, class and cause (${groups.reduce((n, g) => n + g.count, 0)} rows)`, '', '| count | stage | class | cause | examples |', '| --- | --- | --- | --- | --- |',
    ...groups.map((g) => `| ${g.count} | ${g.stage} | ${g.class} | ${g.cause} | ${g.examples.map((e) => `${e.text} (${e.source})`).join('; ').replace(/\|/g, '/')} |`)].join('\n');
  if (at('--out')) writeFileSync(at('--out'), md + '\n'); else console.log(md);
} else { console.error('usage: node tools/ledger.mjs add <ledger> <rows> | report <ledger> [--signals m.mjs] [--out f.md]'); process.exit(1); }
