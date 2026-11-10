#!/usr/bin/env node
// sopworld <command> <file.sop ...> [options]
//
//   check   load the files in order; report what the world refuses (exit code 1)
//   run     load, complete, and print the resulting facts and open questions
//   ask     load, then print the matches of --query "<pattern wires>"
//
// options: --defaults      commit defaults when completing (run)
//          --provenance    print core.via / core.from on derived wires (run)
//          --strict        refuse changes that leave no possible completion
//          --json          machine-readable output

import { readFileSync } from 'node:fs';
import { World, format } from '../src/index.mjs';

const args = process.argv.slice(2);
const cmd = args.shift();
const flags = new Set(args.filter((a) => a.startsWith('--') && a !== '--query'));
const qi = args.indexOf('--query');
const query = qi >= 0 ? args[qi + 1] : null;
const files = args.filter((a, i) => !a.startsWith('--') && (qi < 0 || i !== qi + 1));

if (!['check', 'run', 'ask'].includes(cmd) || !files.length || (cmd === 'ask' && !query)) {
  console.error('usage: sopworld check|run|ask <file.sop ...> [--query "<pattern>"] [--defaults] [--provenance] [--strict] [--json]');
  process.exit(2);
}

const world = new World({ strict: flags.has('--strict') });
const refused = [];
for (const file of files) {
  let r;
  try {
    r = world.tell(readFileSync(file, 'utf8'));
  } catch (e) {
    r = { ok: false, violations: [{ kind: 'syntax', why: e.message }] };
  }
  if (!r.ok) refused.push({ file, violations: r.violations });
}

const out = { ok: !refused.length, refused };
if (cmd === 'run') {
  const c = world.complete({ defaults: flags.has('--defaults') });
  out.facts = world.toSOP({ provenance: flags.has('--provenance') });
  out.completed = c.filled;
  out.questions = c.questions.map((q) => format(q));
  out.dead = c.dead;
} else if (cmd === 'ask') {
  out.matches = world.ask(query);
} else {
  out.wires = world.wires.size;
  out.open = world.open().length;
  out.satisfiable = world.satisfiable();
}

if (flags.has('--json')) {
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const r of refused) {
    console.log(`REFUSED ${r.file}`);
    for (const v of r.violations) console.log(`  ${v.kind}${v.rule ? ' ' + v.rule : ''}${v.id ? ' ' + v.id : ''}: ${v.why || JSON.stringify(v)}`);
  }
  if (cmd === 'check') {
    console.log(`${out.ok ? 'OK' : 'NOT OK'}: ${out.wires} wires, ${out.open} open keys, ${out.satisfiable ? 'completable' : 'no completion possible'}`);
  } else if (cmd === 'run') {
    console.log(out.facts);
    for (const f of out.completed) console.log(`# completed ${f.id}.${f.key}=${f.value}${f.kind ? ` (${f.kind})` : ''}`);
    for (const q of out.questions) console.log(`# asks ${q}`);
    for (const d of out.dead) console.log(`# dead ${d.id}.${d.key}`);
  } else {
    for (const m of out.matches) console.log(JSON.stringify(m));
  }
}
process.exit(out.ok ? 0 : 1);
