// Runs one experiment over the corpus and writes:
//  results/<exp>.json        — status, timing, determinism, mechanical validity per case
//  results/<exp>.cases.jsonl — one compact per-case record for the agent judge
// Usage: node common/run.mjs baseline z3 cassowary milp
import { mkdirSync, writeFileSync, appendFileSync, unlinkSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { CASES } from './corpus.mjs';
import { mechanical, judged } from './judge.mjs';

const EXPS = process.argv.slice(2);
if (!EXPS.length) { console.error('usage: node common/run.mjs <experiment>...'); process.exit(1); }
mkdirSync(new URL('../results/', import.meta.url), { recursive: true });

const median = (xs) => (!xs.length ? '-' : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]);
const all = [];
for (const exp of EXPS) {
  const compiler = await import(new URL(`../${exp}/compiler.mjs`, import.meta.url));
  const rows = [];
  const jsonl = new URL(`../results/${exp}.cases.jsonl`, import.meta.url);
  try { unlinkSync(jsonl); } catch {}
  for (const caseDef of CASES) {
    const row = { exp, case: caseDef.id, family: caseDef.family };
    let out1, out2;
    try {
      const t0 = performance.now();
      out1 = await compiler.compile(caseDef);
      const ms = performance.now() - t0;
      out2 = await compiler.compile(caseDef);
      row.ms = Math.round(ms);
      row.deterministic = JSON.stringify(out1) === JSON.stringify(out2);
    } catch (e) {
      Object.assign(row, { status: 'error', error: String(e.message).split('\n')[0].slice(0, 200) });
      rows.push(row);
      continue;
    }
    if (!out1.ok) {
      Object.assign(row, { status: 'refused', reason: out1.reason?.slice(0, 200) });
    } else {
      const m = mechanical(caseDef, out1.sop);
      Object.assign(row, { status: m.tellOk ? 'compiled' : 'invalid', tellOk: m.tellOk, reason: m.reason });
      if (m.tellOk) appendFileSync(jsonl, JSON.stringify(judged(caseDef, out1.sop)) + '\n');
      row.sop = out1.sop.trim();
    }
    rows.push(row);
  }
  writeFileSync(new URL(`../results/${exp}.json`, import.meta.url), JSON.stringify(rows, null, 1));
  const by = (s) => rows.filter((r) => r.status === s).length;
  console.log(`${exp}: compiled ${by('compiled')}/${rows.length}, refused ${by('refused')}, invalid ${by('invalid')}, error ${by('error')}, median ${median(rows.filter((r) => r.ms !== undefined).map((r) => r.ms))} ms`);
  all.push(...rows);
}
console.log('all rows:', all.length);
