// Several readers on psys2's form pairs (read in place) against k.animals: the gold reading of a variant is
// the world's reading of its canonical sentence. Each reader alone (coverage, precision), the ensemble, the
// agreement-only precision, and the risk–coverage curve. node tools/bench-ensemble.mjs
import { pairs, world, reading, READ } from '../skills/lib/pairs.mjs';
import { readEnsemble, defaultReaders, riskCoverage } from '../src/index.mjs';
const P = pairs(), w = await world();
const canonical = { fillers: ['um', 'hey', 'so'], splitters: ['and then', 'also', 'whatever', 'too'] };
const R = defaultReaders(READ, canonical);
const norm = (f) => (f ? JSON.stringify({ is: f.is, key: f.key, of: f.of }) : null);
const cases = P.map((p) => ({ text: p.variant, gold: reading(w, p.canonical) })).filter((c) => c.gold);
const alone = Object.fromEntries(Object.keys(R).map((n) => [n, { answered: 0, right: 0 }]));
const rows = [];
for (const c of cases) {
  for (const [n, fn] of Object.entries(R)) { const f = fn(w, c.text)[0]?.frame; if (f) { alone[n].answered++; if (norm(f) === c.gold) alone[n].right++; } }
  const e = readEnsemble(w, c.text, { read: READ, canonical, readers: R });
  if (e.frame) rows.push({ confidence: e.confidence, correct: norm(e.frame) === c.gold, agree: e.voices.length });
}
const pct = (a, b) => (b ? `${(100 * a / b).toFixed(1)} %` : '-');
console.log(`${cases.length} variants with a gold reading`);
for (const [n, s] of Object.entries(alone)) console.log(`${n.padEnd(10)} coverage ${pct(s.answered, cases.length)}  precision ${pct(s.right, s.answered)}`);
const right = rows.filter((r) => r.correct).length;
console.log(`ensemble   coverage ${pct(rows.length, cases.length)}  precision ${pct(right, rows.length)}`);
const all = rows.filter((r) => r.agree === Object.keys(R).length);
console.log(`all agree  coverage ${pct(all.length, cases.length)}  precision ${pct(all.filter((r) => r.correct).length, all.length)}`);
console.log('risk–coverage:', riskCoverage(rows).map((x) => `≥${x.threshold}: cov ${x.coverage}, risk ${x.risk}`).join('; '));

// weights learnt on a training half (each reader's precision there), judged on the other half
const train = cases.filter((_, i) => i % 2 === 0), held = cases.filter((_, i) => i % 2 === 1);
const prec = (n, list) => { let a = 0, r = 0; for (const c of list) { const f = R[n](w, c.text)[0]?.frame; if (f) { a++; if (norm(f) === c.gold) r++; } } return a ? r / a : 0; };
const weights = Object.fromEntries(Object.keys(R).map((n) => [n, +prec(n, train).toFixed(3)]));
const judge = (list, opts) => { let ans = 0, ok = 0; const rs = []; for (const c of list) { const e = readEnsemble(w, c.text, { read: READ, canonical, readers: R, ...opts }); if (e.frame) { ans++; const good = norm(e.frame) === c.gold; if (good) ok++; rs.push({ confidence: e.confidence, correct: good }); } } return { ans, ok, rs }; };
const u = judge(held, {}), l = judge(held, { weights });
console.log(`\nweights learnt on ${train.length}: ${JSON.stringify(weights)}`);
console.log(`held-out ${held.length}: equal weights precision ${pct(u.ok, u.ans)}; learnt weights precision ${pct(l.ok, l.ans)}`);
console.log('held-out risk–coverage, learnt:', riskCoverage(l.rs).map((x) => `≥${x.threshold}: cov ${x.coverage}, risk ${x.risk}`).join('; '));
// the pattern reader as an independent voice: patterns learnt on the training half (variant text, gold frame), judged on the held-out half
const { patternReader, readByTypes: rbt } = await import('../src/index.mjs');
const goldFrame = (p) => rbt(w, p, READ).best;
const trainCases = train.map((c, i) => ({ text: c.text, frame: JSON.parse(c.gold) })).filter((c) => c.frame);
const closed = ['a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'what', 'which', 'who', 'where', 'how', 'many', 'much', 'does', 'do', 'is', 'are', 'was', 'can', 'could', 'you', 'me', 'it', 'they', 'please', 'hey', 'um', 'also', 'then', 'too', 'whatever'];
const pr = patternReader(w, trainCases, { closed });
let pa = 0, pr2 = 0; for (const c of held) { const f = pr(w, c.text)[0]?.frame; if (f) { pa++; if (norm(f) === c.gold) pr2++; } }
console.log(`\npattern reader (learnt on ${trainCases.length}): held-out coverage ${pct(pa, held.length)}, precision ${pct(pr2, pa)}`);
const R4 = { ...R, patterns: pr };
const e4 = judge(held, { readers: R4 });
const e4w = judge(held, { readers: R4, weights: { ...weights, patterns: pa ? pr2 / pa : 0 } });
console.log(`ensemble with patterns, held-out: equal weights precision ${pct(e4.ok, e4.ans)}; learnt weights ${pct(e4w.ok, e4w.ans)}`);
console.log('risk–coverage with patterns (learnt):', riskCoverage(e4w.rs).map((x) => `≥${x.threshold}: cov ${x.coverage}, risk ${x.risk}`).join('; '));
