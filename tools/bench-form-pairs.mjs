// learnFormOperators on PSys2's aligned pairs (reviewer 23:45: training/eval/form-pairs.jsonl), read in place
// from psys2 at a fixed commit; only the pairs judged same_meaning=true. Half to learn, half held out.
// node tools/bench-form-pairs.mjs
import { execFileSync } from 'node:child_process';
import { checkout } from './worlds.mjs';
import { learnFormOperators } from '../src/index.mjs';
const COMMIT = 'dbf72b0272f8b0719603d7df07bf41a1de1e82dc';
const dir = checkout('psys2');
try { execFileSync('git', ['-C', dir, 'cat-file', '-e', `${COMMIT}^{commit}`]); } catch { execFileSync('git', ['-C', dir, 'fetch', '-q', 'origin']); }
const rows = execFileSync('git', ['-C', dir, 'show', `${COMMIT}:training/eval/form-pairs.jsonl`], { maxBuffer: 1 << 26 }).toString().trim().split('\n').map((l) => JSON.parse(l));
const same = rows.filter((r) => r.same_meaning);
const train = same.filter((_, i) => i % 2 === 0), held = same.filter((_, i) => i % 2 === 1);
const r = learnFormOperators(train, { heldOut: held });
const bySource = {}; for (const x of same) bySource[x.source] = (bySource[x.source] || 0) + 1;
console.log(`pairs ${rows.length}, same meaning ${same.length} (${JSON.stringify(bySource)}); learn on ${train.length}, hold out ${held.length}`);
console.log(`operators ${r.coverage.operators}, unaligned ${r.unaligned}; 80 % of the aligned pairs by ${r.coverage.at80}, 95 % by ${r.coverage.at95}`);
const admitted = r.operators.filter((o) => o.admitted);
const heldPass = r.operators.reduce((s, o) => s + o.heldOut.pass, 0), heldOf = r.operators.reduce((s, o) => s + o.heldOut.of, 0);
console.log(`admitted ${admitted.length}; held-out pairs normalised back by some operator: ${heldPass}/${heldOf} applications`);
for (const o of r.operators.slice(0, 15)) console.log(`${String(o.support.length).padStart(3)}  ${o.from}  =>  ${o.to}   held ${o.heldOut.pass}/${o.heldOut.of}`);
const { learnFormEdits } = await import('../src/index.mjs');
const e = learnFormEdits(same);
console.log(`\nfamilies: ${JSON.stringify(e.families)}`); console.log(`atomic edits: ${e.edits} in ${e.operators.length} operators; 80 % of the edits by ${e.coverage.at80}, 95 % by ${e.coverage.at95}; every edit of 80 % of the pairs by ${e.coverage.pairsAt80}, of 95 % by ${e.coverage.pairsAt95}`);
for (const o of e.operators.slice(0, 20)) console.log(`${String(o.count).padStart(4)}  ${o.edit}`);
