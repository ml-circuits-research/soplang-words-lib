// enrich-mechanical.mjs — deterministic enrichment variants for EVERY seed:
//   - reorder frames (optional values before the verb, trailing politeness,
//     question and ellipsis shapes) so every combination seed carries >=5
//     equivalent writings;
//   - small deliberate typos on the kind word (letter transposition, dropped
//     letter, doubled letter), claimed as {"typo": ...} so the label stays
//     CANONICAL — the reader learns misspellings resolving to declared values.
// All values still come only from the seed; typos alter only surface shapes.
// The surfaces map claims BOTH the "kind" key and the seed's kind-constraint
// index (they are the same wire, and the assembler checks every index).
//
// Usage: node enrich-mechanical.mjs --seeds seeds-all.jsonl --out variants/enriched-mech.jsonl
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const seedsPath = arg('seeds');
const OUT = arg('out', 'variants/enriched-mech.jsonl');
const seeds = readFileSync(seedsPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

const typoTransposition = (w) => (w.length >= 4 ? w.slice(0, 2) + w[3] + w[2] + w.slice(4) : null);
const typoDropped = (w) => (w.length >= 4 ? w.slice(0, 2) + w.slice(3) : null);
const typoDoubled = (w) => (w.length >= 3 ? w.slice(0, 2) + w[2] + w[2] + w.slice(3) : null);
const isWord = (w) => /^[a-z][a-z\s-]*$/i.test(w);

const out = [];
for (const seed of seeds) {
  const kind = String(seed.target.kindValue);
  const extras = seed.constraints.filter((c) => !c.key.endsWith('.kind'));
  const kindN = seed.constraints.findIndex((c) => c.key.endsWith('.kind'));
  const surfacesFor = (kindClaim) => {
    const m = { kind: kindClaim, ...Object.fromEntries(extras.map((c) => [String(c.n), c.surface])) };
    if (kindN >= 0) m[String(kindN)] = kindClaim;
    return m;
  };
  const tail = extras.map((c) => c.surface).join(' ');
  const kindOnly = extras.length === 0;
  const act = seed.act;
  const lead = act === 'make' ? 'add' : act;
  const artk = /^[aeiou]/i.test(kind) ? 'an' : 'a';

  if (tail) {
    out.push({ seedId: seed.seedId, tier: 'mechanical', text: `${tail} — ${lead} ${artk} ${kind}, please`, surfaces: surfacesFor(kind) });
    out.push({ seedId: seed.seedId, tier: 'mechanical', text: `${artk} ${kind} for me, ${tail}`, surfaces: surfacesFor(kind) });
    out.push({ seedId: seed.seedId, tier: 'mechanical', text: `can you ${lead} ${artk} ${kind} ${tail}?`, surfaces: surfacesFor(kind) });
  } else {
    out.push({ seedId: seed.seedId, tier: 'mechanical', text: `${kind}, please`, surfaces: surfacesFor(kind) });
    out.push({ seedId: seed.seedId, tier: 'mechanical', text: `give me ${artk} ${kind}`, surfaces: surfacesFor(kind) });
    out.push({ seedId: seed.seedId, tier: 'mechanical', text: `can you ${lead} ${artk} ${kind}?`, surfaces: surfacesFor(kind) });
  }

  if (isWord(kind)) {
    const candidates = [typoTransposition(kind), typoDropped(kind), typoDoubled(kind)]
      .filter((t) => t && t !== kind);
    for (const typo of candidates) {
      out.push({ seedId: seed.seedId, tier: 'mechanical-typo', text: `${lead} ${/^[aeiou]/i.test(typo) ? 'an' : 'a'} ${typo}${tail ? ' ' + tail : ''}`, surfaces: surfacesFor({ typo }) });
    }
  }
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.map((v) => JSON.stringify(v)).join('\n') + '\n');
console.log(`enrichment variants: ${out.length} across ${seeds.length} seeds -> ${OUT}`);
