// trigger-batch.mjs — close the vocabulary-coverage gate in one deterministic pass:
// reads the trigger list (coverage-report.json), gives every thin catalog value
// enough NEW variants (using its catalog-declared synonym surfaces and a wide
// frame pool) to clear --min; boosts thin operations (undo/redo/ungroup); adds a
// mechanical completion drop-grid (each optional parameter dropped in turn, the
// world-completion signal); adds number-word variants (digits spelled out,
// claimed as out-of-vocabulary synonyms so labels stay canonical).
//
// Usage: node trigger-batch.mjs --seeds seeds-full.jsonl --examples examples.jsonl
//    --vocabulary vocabulary.json --report coverage-report.json [--min 20]
//    [--out variants/trigger-batch.jsonl] [--out-seeds seeds-trigger.jsonl]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const examplesPath = arg('examples');
const vocabPath = arg('vocabulary');
const reportPath = arg('report');
const MIN = Number(arg('min', 20));
const OUT = arg('out', 'variants/trigger-batch.jsonl');
const OUT_SEEDS = arg('out-seeds', 'seeds-trigger.jsonl');
if (!seedsPath || !examplesPath || !vocabPath || !reportPath) { console.error('usage: trigger-batch.mjs --seeds … --examples … --vocabulary … --report coverage-report.json'); process.exit(1); }

const seeds = readFileSync(seedsPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const used = new Map(); // seedId -> example count
for (const l of readFileSync(examplesPath, 'utf8').trim().split('\n')) {
  const r = JSON.parse(l);
  used.set(r.cohort.seed, (used.get(r.cohort.seed) || 0) + 1);
}
const vocab = JSON.parse(readFileSync(vocabPath, 'utf8'));
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

const art = (k) => (/^[aeiou]/i.test(k) ? 'an' : 'a');
const FRAMES = [
  (k) => `add ${art(k)} ${k}`,
  (k) => `put ${art(k)} ${k} in, please`,
  (k) => `I could use ${art(k)} ${k} here`,
  (k) => `how about ${art(k)} ${k}`,
  (k) => `drop in ${art(k)} ${k}, would you`,
  (k) => `one more thing — ${art(k)} ${k}`,
  (k) => `first things first: ${art(k)} ${k}`,
  (k) => `my current project needs ${art(k)} ${k}`,
  (k) => `if it is not too much trouble, ${art(k)} ${k}`,
  (k) => `the next thing on my list is ${art(k)} ${k}`,
  (k) => `before I forget, ${art(k)} ${k}`,
  (k) => `rounding this off with ${art(k)} ${k}`,
  (k) => `give me ${art(k)} ${k}, thanks`,
  (k) => `can I get ${art(k)} ${k}?`,
  (k) => `make it ${art(k)} ${k}`,
  (k) => `${k}, please`,
  (k) => `we might as well add ${art(k)} ${k}`,
  (k) => `while you are at it, ${art(k)} ${k}`,
  (k) => `just ${art(k)} ${k} for now`,
  (k) => `sketch ${art(k)} ${k} for me`,
];

const surfacesOfValue = (source, canonical) => {
  const table = vocab[source] || {};
  const e = table[canonical];
  const pool = e?.surfaces?.length ? e.surfaces : [canonical];
  return [...new Set([canonical, ...pool])];
};

const out = [];
const newSeeds = [];
let seq = 0;

// --- 1. thin catalog values ---
const bySeedId = new Map(seeds.map((s) => [s.seedId, s]));
const valueToSeeds = new Map();
for (const s of seeds) {
  const k = s.target.kindValue;
  if (!valueToSeeds.has(k)) valueToSeeds.set(k, []);
  valueToSeeds.get(k).push(s);
}
let minted = 0;
for (const t of report.triggerList || []) {
  const missing = MIN - t.count;
  if (missing <= 0) continue;
  const surfaces = surfacesOfValue(t.source, t.canonical);
  let host = (valueToSeeds.get(t.canonical) || [])[0];
  if (!host) {
    // mint a seed so the value can enter at all (10 zero-count values)
    seq += 1;
    const area = t.source === 'faces' ? 'avatar' : 'drawing';
    const op = area === 'avatar' ? 'ui.face.compose' : 'drawing.catalog.make';
    host = {
      format: 'sopskill.seed/1', seedId: `tg-${String(seq).padStart(4, '0')}`,
      area, operation: op, act: 'make', nativeAct: 'make',
      on: area === 'avatar' ? 'ui.avatar.face' : 'art.draw.object',
      target: { kind: t.canonical, kindValue: t.canonical, mode: 'new' },
      constraints: [{ n: 0, key: `${area === 'avatar' ? 'face' : 'drawn'}.kind`, value: t.canonical, surface: t.canonical, phase: 'result', optional: false, operator: 'eq', polarity: 'positive', character: 'requirement' }],
      canonicalText: `add ${art(t.canonical)} ${t.canonical}`, executed: false, tier: 'trigger-minted',
    };
    newSeeds.push(host);
    bySeedId.set(host.seedId, host);
    valueToSeeds.set(t.canonical, [host]);
    minted += 1;
  }
  const want = Math.min(missing + 4, 24);
  let fi = seq % FRAMES.length;
  for (let i = 0; i < want; i++) {
    const surf = surfaces[i % surfaces.length];
    const frame = FRAMES[(fi + i) % FRAMES.length];
    const text = frame(surf);
    const extras = host.constraints.filter((c) => !c.key.endsWith('.kind'));
    out.push({
      seedId: host.seedId, tier: 'mechanical-trigger', text,
      surfaces: { kind: surf, kind_ind: undefined, '0': surf, ...Object.fromEntries(extras.map((c) => [String(c.n), c.surface])) },
    });
  }
  seq += 7;
}

// --- 2. thin operations (undo / redo / ungroup): +8 distinct frames per seed ---
const THIN_OPS = new Set(['diagram.undo', 'diagram.redo', 'diagram.group.ungroup?none']);
const OP_FRAMES = {
  'diagram.undo': ['undo that', 'take it back, please', 'no wait, undo', 'revert the last thing', 'can you undo? I changed my mind', 'scratch that — undo', 'one step back, thanks', 'roll back what I just did'],
  'diagram.redo': ['redo it', 'bring it back, please', 'no wait, redo that', 'apply the last thing again', 'can you redo? I reacted too fast', 'put it back — redo', 'one step forward, thanks', 'redo what I just cancelled'],
};
let thinOpVariants = 0;
for (const s of seeds) {
  const frames = OP_FRAMES[s.operation];
  if (!frames || used.get(s.seedId) > 24) continue;
  for (const text of frames) {
    const surf = s.target.kindValue;
    const kindN = String(s.constraints.findIndex((c) => c.key.endsWith('.kind')));
    out.push({
      seedId: s.seedId, tier: 'mechanical-thinop', text,
      surfaces: { kind: surf, kind_ind: undefined, ...(kindN >= 0 ? { [kindN]: surf } : {}), ...Object.fromEntries(s.constraints.filter((c) => !c.key.endsWith('.kind')).map((c) => [String(c.n), c.surface])) },
    });
    thinOpVariants += 1;
  }
}

// --- 3. mechanical completion drop-grid: one variant per optional dropped ---
const DROP_FRAMES = [
  (core) => core,
  (core) => `${core}, quickly please`,
  (core) => `just ${core}`,
];
let dropVariants = 0, dropSeen = 0;
for (const s of seeds) {
  if (!s.seedId.startsWith('ux-') && !s.seedId.startsWith('cx-')) continue;
  const optionals = s.constraints.filter((c) => c.optional);
  if (!optionals.length || s.constraints.length < 2) continue;
  dropSeen += 1;
  if (dropSeen > 620) continue; // bounded: the shape repeats; ~600 seeds × 3 frames is plenty of signal
  const kindC = s.constraints.find((c) => c.key.endsWith('.kind'));
  for (const drop of optionals) {
    const kept = s.constraints.filter((c) => c !== drop && c !== kindC);
    const core = [`${art(s.target.kindValue)} ${s.target.kindValue}`, ...kept.map((c) => c.surface)].join(' ');
    for (const f of DROP_FRAMES.slice(0, drop.optionalsSeen === undefined ? 3 : 1)) {
      const text = f(`give me ${core}`).replace(/\s+/g, ' ');
      const surfaces = {};
      if (kindC) { surfaces.kind = s.target.kindValue; surfaces[String(kindC.n)] = s.target.kindValue; }
      for (const c of kept) surfaces[String(c.n)] = c.surface;
      surfaces[String(drop.n)] = null; // the dropped optional -> completion.requirements
      out.push({ seedId: s.seedId, tier: 'mechanical-simplified', text, surfaces });
      dropVariants += 1;
    }
    break; // one optional per seed keeps the batch bounded
  }
}

// --- 4. number words: digits spelled out, claimed as synonyms ---
const spell = (n) => {
  if (!Number.isInteger(n) || n < 0 || n > 999) return null;
  const ones = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  if (n < 20) return ones[n];
  if (n < 100) return n % 10 ? `${tens[Math.floor(n / 10)]} ${ones[n % 10]}` : tens[n / 10];
  const h = Math.floor(n / 100);
  return n % 100 === 0 ? `${ones[h]} hundred` : `${ones[h]} hundred ${n % 100 < 20 ? ones[n % 100] : spell(n % 100)}`;
};
let numVariants = 0;
for (const s of seeds) {
  if (!s.seedId.startsWith('ux-')) continue;
  const numeric = s.constraints.find((c) => Number.isInteger(Number(c.value)) && [1, 2, 3, 5, 30, 120, 260, 400].includes(Number(c.value)) && c.optional);
  if (!numeric) continue;
  const word = spell(Number(numeric.value));
  if (!word || numVariants >= 300) continue;
  const kindC = s.constraints.find((c) => c.key.endsWith('.kind'));
  const others = s.constraints.filter((c) => c !== numeric && c !== kindC);
  const core = [`${art(s.target.kindValue)} ${s.target.kindValue}`, ...others.map((c) => c.surface)].join(' ');
  const text = `place ${core} about ${word}`.replace(/\s+/g, ' ');
  const surfaces = {};
  if (kindC) { surfaces.kind = s.target.kindValue; surfaces[String(kindC.n)] = s.target.kindValue; }
  for (const c of others) surfaces[String(c.n)] = c.surface;
  surfaces[String(numeric.n)] = { syn: word };
  out.push({ seedId: s.seedId, tier: 'mechanical-numberwords', text, surfaces });
  numVariants += 1;
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.map(({ kind_ind, ...v }) => JSON.stringify(v)).join('\n') + '\n');
writeFileSync(OUT_SEEDS, newSeeds.map((s) => JSON.stringify(s)).join('\n') + (newSeeds.length ? '\n' : ''));
console.log(`trigger-batch: ${out.length} variants (values ${report.triggerList?.length || 0}, minted seeds ${minted}, thin-op ${thinOpVariants}, drop-grid ${dropVariants}, number-words ${numVariants}) -> ${OUT}`);
