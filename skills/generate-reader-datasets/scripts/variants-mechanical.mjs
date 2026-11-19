// variants-mechanical.mjs — deterministic surface variants for EVERY enumerated
// seed. These are marked tier:"mechanical" and exist so that combination space is
// covered多样化的 in writing style, not only in values: verbs rotate, optional
// surfaces change phrase shape, coordinate spellings rotate, and catalog kinds use
// EVERY surface the knowledge world declares for that value (core.word synonyms).
// Nothing here invents values; every variant keeps the seed's constraints verbatim.
//
// Usage: node variants-mechanical.mjs --seeds seeds-all.jsonl --vocabulary vocabulary.json --out mech-variants.jsonl
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const vocabPath = arg('vocabulary', '');
const OUT = arg('out', 'mech-variants.jsonl');
if (!seedsPath) { console.error('usage: variants-mechanical.mjs --seeds <seeds.jsonl> [--vocabulary vocabulary.json]'); process.exit(1); }
const seeds = readFileSync(seedsPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const vocab = vocabPath ? JSON.parse(readFileSync(vocabPath, 'utf8')) : null;
const objects_ = vocab?.objects || {};
const faces = vocab?.faces || {};
const kindSurfacePool = (kindValue) => {
  const e = objects_[kindValue] || faces[kindValue];
  const pool = e?.surfaces?.length ? e.surfaces : [kindValue];
  return pool.includes(kindValue) ? pool : [...pool, kindValue];
};

const VERB_ALT = { add: ['add', 'draw', 'put', 'create', 'make'], change: ['change', 'make', 'update', 'set'], select: ['select', 'pick', 'choose', 'take'], remove: ['remove', 'delete', 'get rid of', 'erase'], move: ['move', 'place', 'put'], place: ['place', 'position', 'put'], group: ['group', 'combine', 'join'], reset: ['reset', 'clear', 'wipe'], toggle: ['show', 'toggle', 'switch'], read: ['read', 'check', 'list'], write: ['write', 'compose'], connect: ['connect', 'link', 'join'] };
const ARTICLE_VARIANT = (kind, i) => i % 2 === 0 ? `${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}` : `one ${kind}`;

const out = [];
for (const seed of seeds) {
  const canonical = seed.canonicalText || '';
  const [verb, ...rest] = canonical.split(' ');
  const kindCons = seed.constraints.find((c) => c.key.endsWith('.kind'));
  const kindValue = seed.target.kindValue;
  const surfaces = kindSurfacePool(kindValue);
  const verbs = VERB_ALT[seed.nativeAct] || [verb];
  const extras = seed.constraints.filter((c) => !c.key.endsWith('.kind') && c.key.endsWith('x') === false);
  let variantNo = 0;
  const emitVariant = (text, surfacesUsed) => {
    out.push({ seedId: seed.seedId, tier: 'mechanical', text, surfaces: surfacesUsed });
    variantNo++;
  };
  // 1) verb rotations × catalog synonym surfaces
  const verbsToUse = verbs.slice(0, 4);
  for (let vi = 0; vi < verbsToUse.length; vi++) {
    const surf = surfaces[vi % surfaces.length];
    const tail = seed.constraints.filter((c) => c.key.endsWith('.kind') === false).map((c) => c.surface).join(' ');
    const text = [`${verbsToUse[vi]} ${ARTICLE_VARIANT(surf, vi)}`, tail].filter(Boolean).join(' ');
    const used = Object.fromEntries(seed.constraints.map((c) => [String(c.n), c.key.endsWith('.kind') ? surf : c.surface]));
    if (text.trim()) emitVariant(text.trim(), used);
  }
  // 2) elliptical / terse forms rotate article away
  if (seed.act === 'make') {
    const surf = surfaces[(surfaces.length - 1) % surfaces.length];
    const used = Object.fromEntries(seed.constraints.map((c) => [String(c.n), c.key.endsWith('.kind') ? surf : c.surface]));
    emitVariant(`${surf}, please`, used);
    emitVariant(`give me ${ARTICLE_VARIANT(surf, 1)}`, used);
  }
  if (variantNo < 6 && seed.constraints.length > 1) { // reorder the extras once
    const surf = surfaces[0];
    const tail = [...seed.constraints.filter((c) => !c.key.endsWith('.kind'))].reverse().map((c) => c.surface).join(' ');
    const used = Object.fromEntries(seed.constraints.map((c) => [String(c.n), c.key.endsWith('.kind') ? surf : c.surface]));
    emitVariant(`${VERB_ALT[seed.nativeAct]?.[0] || verb} ${ARTICLE_VARIANT(surf, 0)} ${tail}`, used);
  }
}
writeFileSync(OUT, out.map((v) => JSON.stringify(v)).join('\n') + (out.length ? '\n' : ''));
console.log(`mechanical variants: ${out.length} across ${seeds.length} seeds -> ${OUT}`);
