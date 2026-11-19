// v2 runner: the same contract over corpus2 (harder, real-grounded cases), with
// per-case timing recorded for the scale cases.
// Usage: node common/run2.mjs z3world baseline z3 cassowary milp
// Env: CASES=w4,s-cal to run a subset (a compiler that dies on one case can then
// still be measured on the others).
import { mkdirSync, writeFileSync, appendFileSync, unlinkSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { CASES2 } from './corpus2.mjs';
import { mechanical, judged } from './judge.mjs';

const EXPS = process.argv.slice(2);
if (!EXPS.length) { console.error('usage: node common/run2.mjs <experiment>...'); process.exit(1); }
const ONLY = (process.env.CASES || '').split(',').filter(Boolean);
const RUN = ONLY.length ? CASES2.filter((c) => ONLY.includes(c.id)) : CASES2;
mkdirSync(new URL('../results2/', import.meta.url), { recursive: true });

const median = (xs) => (!xs.length ? '-' : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]);
for (const exp of EXPS) {
  const jsonl = new URL(`../results2/${exp}.cases.jsonl`, import.meta.url);
  if (!ONLY.length) try { unlinkSync(jsonl); } catch {} // a subset run APPENDS: subsets never own the file

  for (const caseDef of RUN) {
    const row = { exp, case: caseDef.id, family: caseDef.family, scale: caseDef.scale || '' };
    let out1, out2;
    try {
      const t0 = performance.now();
      out1 = await compiler.compile(caseDef);
      const ms = performance.now() - t0;
      out2 = await compiler.compile(caseDef);
      row.ms = Math.round(ms * 10) / 10;
      row.deterministic = JSON.stringify(out1) === JSON.stringify(out2);
    } catch (e) {
      Object.assign(row, { status: 'crashed', error: String(e.message).split('\n')[0].slice(0, 120) });
      rows.push(row); console.log(`${exp} ${caseDef.id}: CRASHED ${row.error}`); continue;
    }
    if (!out1.ok) {
      Object.assign(row, { status: 'refused', reason: out1.reason?.slice(0, 140) });
    } else {
      const m = mechanical(caseDef, out1.sop);
      Object.assign(row, { status: m.tellOk ? 'compiled' : 'invalid', tellOk: m.tellOk, reason: m.reason });
      if (m.tellOk) appendFileSync(jsonl, JSON.stringify(judged(caseDef, out1.sop)) + '\n');
      row.sop = out1.sop.trim().slice(0, 400);
    }
    rows.push(row);
    console.log(`${exp} ${caseDef.id}: ${row.status} ${row.ms}ms${caseDef.scale ? ' [' + caseDef.scale + ']' : ''}${row.reason ? ' — ' + row.reason : ''}`);
  }
  const by = (s) => rows.filter((r) => r.status === s).length;
  console.log(`\n${exp} TOTAL (${RUN.length} cases): compiled ${by('compiled')}, refused ${by('refused')}, invalid ${by('invalid')}, crashed ${by('crashed')}, median ${median(rows.filter((r) => r.ms !== undefined).map((r) => r.ms))} ms`);
  writeFileSync(new URL(`../results2/${exp}.json`, import.meta.url), JSON.stringify(rows, null, 1));
}
