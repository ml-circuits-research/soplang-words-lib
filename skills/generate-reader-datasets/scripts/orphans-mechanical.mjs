// orphans-mechanical.mjs — second-chance variants for orphan catalog-kind seeds.
// Why this exists (audit 2026-11-19): the catalog-kind mechanical tiers emit
// ~4 uniform frames per seed, so kinds whose canonical name repeats across seeds
// (or whose frames collide) die at duplicate-rejection — and the assembler drops
// the whole seed to ZERO examples. The fix uses what the catalog already has:
// EVERY surface a value declares (core.word text=… means=…), and a wider frame
// set, so each orphan kind gets distinct, vocabulary-shaped variants.
//
// Usage: node orphans-mechanical.mjs --seeds seeds-full.jsonl --examples examples.jsonl
//                     --vocabulary vocabulary.json [--out variants/orphans-mech.jsonl]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const examplesPath = arg('examples');
const vocabPath = arg('vocabulary');
const OUT = arg('out', 'variants/orphans-mech.jsonl');
const seeds = readFileSync(seedsPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const used = new Set(readFileSync(examplesPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l).cohort.seed));
const vocab = vocabPath ? JSON.parse(readFileSync(vocabPath, 'utf8')) : null;
const objects_ = vocab?.objects || {};
const faces = vocab?.faces || {};

const surfacesOf = (kindValue) => {
  const e = objects_[kindValue] || faces[kindValue];
  const pool = e?.surfaces?.length ? e.surfaces : [kindValue];
  return [...new Set([kindValue, ...pool])];
};
// distinct frames; kind surface is the ONLY variable, so frames rotate verbs/orders/articles
const frames = [
  (k) => `add ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k}`,
  (k) => `put ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k} on the board, would you`,
  (k) => `I'd like ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k}`,
  (k) => `${k}, please`,
  (k) => `draw ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k} for me`,
  (k) => `make it ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k}`,
  (k) => `can I get ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k}?`,
];

const out = [];
const orphans = seeds.filter((s) => !used.has(s.seedId) && (s.seedId.startsWith('cx-') || s.seedId.startsWith('ux-')));
let oi = 0;
for (const seed of orphans) {
  const surfaces = surfacesOf(seed.target.kindValue);
  const frame = frames[oi++ % frames.length];
  let emitted = 0;
  for (const surf of surfaces) {
    const text = frame(surf);
    const kindN = String(seed.constraints.findIndex((c) => c.key.endsWith('.kind')));
    const extras = seed.constraints.filter((c) => !c.key.endsWith('.kind'));
    out.push({
      seedId: seed.seedId, tier: 'mechanical-orphan', text,
      surfaces: { kind: surf, kind_ind: undefined, ...(kindN >= 0 ? { [kindN]: surf } : {}), ...Object.fromEntries(extras.map((c) => [String(c.n), c.surface])) },
    });
    emitted++;
    if (emitted >= 6) break;
  }
  // second frame tier for extra spread
  const f2 = frames[(oi + 3) % frames.length];
  const surf2 = surfaces[(oi) % surfaces.length];
  const kindN2 = String(seed.constraints.findIndex((c) => c.key.endsWith('.kind')));
  const extras2 = seed.constraints.filter((c) => !c.key.endsWith('.kind'));
  out.push({
    seedId: seed.seedId, tier: 'mechanical-orphan', text: f2(surf2),
    surfaces: { kind: surf2, ...(kindN2 >= 0 ? { [kindN2]: surf2 } : {}), ...Object.fromEntries(extras2.map((c) => [String(c.n), c.surface])) },
  });
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.map((v) => {
  const { kind_ind, ...rest } = v; return JSON.stringify(rest);
}).join('\n') + '\n');
console.log(`orphan second-chance variants: ${out.length} for ${orphans.length} orphan seeds -> ${OUT}`);
