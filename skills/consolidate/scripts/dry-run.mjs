// Dry run of consolidate: freeze a held-out half, learn from the other half (filler words from the edit
// families), and measure the reading of the held-out variants before and after, with the experiment harness.
// The change is kept only if the held-out share rises. node skills/consolidate/scripts/dry-run.mjs
import { pairs, world, reading, READ } from '../../lib/pairs.mjs';
import { learnFormEdits, fillersFrom, canonicalise, readByTypes, ablation } from '../../../src/index.mjs';
const P = pairs(), w = await world();
const usable = P.filter((p) => reading(w, p.canonical)); // cases the world reads in their canonical form
const train = usable.filter((_, i) => i % 2 === 0), held = usable.filter((_, i) => i % 2 === 1); // held-out frozen before learning
const fillers = fillersFrom(learnFormEdits(train, { world: w }));
const splitters = ['and then', 'also', 'whatever', 'too'];
const cells = held.map((p, i) => ({ id: `h${i}`, input: p.variant, expect: reading(w, p.canonical), set: p.source }));
const run = (text, cfg) => {
  if (!cfg.canonical) return reading(w, text);
  const cs = canonicalise(w, text, { fillers: cfg.fillers, splitters: cfg.splitters }).clauses;
  for (const c of cs) { const r = readByTypes(w, c.text, READ); if (r.best && r.best.is === 'ask') return JSON.stringify({ is: r.best.is, key: r.best.key, of: r.best.of }); }
  return reading(w, text);
};
const r = ablation(cells, run, { before: {}, fillers: { canonical: true, fillers, splitters: [] }, after: { canonical: true, fillers, splitters } });
console.log(`${usable.length} usable pairs: learn on ${train.length}, held-out ${held.length}; fillers learnt: ${fillers.join(', ')}`);
for (const [cfg, sets] of Object.entries(r.table)) console.log(`${cfg.padEnd(8)} ${Object.entries(sets).map(([s, t]) => `${s} ${t.pass}/${t.of}`).join('   ')}`);
const total = (c) => Object.values(r.table[c]).reduce((a, t) => a + t.pass, 0);
console.log(`after vs before on held-out: ${total('after')} vs ${total('before')} (gains ${r.buys.after.gains.length}, losses ${r.buys.after.losses.length}) → ${total('after') > total('before') && !r.buys.after.losses.length ? 'keep' : 'do not keep'}`);
