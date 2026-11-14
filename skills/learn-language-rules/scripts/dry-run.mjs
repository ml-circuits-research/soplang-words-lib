// Dry run of learn-language-rules: typed form operators learnt from aligned pairs (here psys2's form pairs at a
// fixed commit, read in place) become proposed facts of the language world in its alternation format.
// node skills/learn-language-rules/scripts/dry-run.mjs
import { execFileSync } from 'node:child_process';
import { checkout, catalogWorld } from '../../../tools/worlds.mjs';
import { learnFormOperators, learnFormEdits } from '../../../src/index.mjs';
const COMMIT = 'dbf72b0272f8b0719603d7df07bf41a1de1e82dc', dir = checkout('psys2');
try { execFileSync('git', ['-C', dir, 'cat-file', '-e', `${COMMIT}^{commit}`]); } catch { execFileSync('git', ['-C', dir, 'fetch', '-q', 'origin']); }
const pairs = execFileSync('git', ['-C', dir, 'show', `${COMMIT}:training/eval/form-pairs.jsonl`]).toString().trim().split('\n').map((l) => JSON.parse(l)).filter((p) => p.same_meaning);
const world = await catalogWorld({ 'k.animals': ['k.animals.animal'] });
const train = pairs.filter((_, i) => i % 2 === 0), held = pairs.filter((_, i) => i % 2 === 1);
const r = learnFormOperators(train, { heldOut: held, world });
const literals = (x) => x.split(' ').filter((t) => !t.startsWith('{') && !t.startsWith('<')).length;
const admitted = r.operators.filter((o) => o.admitted && o.heldOut.of && o.heldOut.pass / o.heldOut.of >= 0.8 && literals(o.from) <= 3); // admitted, 80 % of held-out passing, and general (at most 3 literal words: never a phrase)
console.log(`${pairs.length} same-meaning pairs; ${r.operators.length} typed operators; ${admitted.length} admitted with at least 80 % of their held-out applications passing`);
console.log('proposed facts (review, then add to the language world; never a phrase list):');
for (const [i, o] of admitted.slice(0, 10).entries()) console.log(`@w.lang.en.alternation.learnt_${i + 1} w.lang.en.alternation name=learnt_${i + 1} n=${900 + i} family=learnt from="${o.from}" to="${o.to}"   # support ${o.support.length}, held-out ${o.heldOut.pass}/${o.heldOut.of}`);
const e = learnFormEdits(pairs, { world });
console.log(`edit families: ${JSON.stringify(e.families)}`);
