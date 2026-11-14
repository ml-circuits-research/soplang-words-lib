// Dry run of audit-knowledge: model-labelled numbers of the catalog (named=model) checked against the typical
// ranges the knowledge publishes from sources (k.attributes.range); the farthest are listed to check by hand
// against a source, then fixed or flagged in the knowledge repository. Read in place at the pinned commit.
// node skills/audit-knowledge/scripts/dry-run.mjs [n]
import { catalogWorld } from '../../../tools/worlds.mjs';
const n = Number(process.argv[2] ?? 10);
const w = await catalogWorld({ 'k.attributes': ['k.attributes.number', 'k.attributes.range'], 'k.animals': ['k.animals.animal'] });
const q = (v) => String(v ?? '').replace(/^"|"$/g, '');
const animals = new Set(w.ofType('k.animals.animal').map((a) => q(a.attrs.name[0])));
const ranges = w.ofType('k.attributes.range').filter((r) => q(r.attrs.kind?.[0]) === 'animal' && q(r.attrs.basis?.[0]) === 'source');
const model = w.ofType('k.attributes.number').filter((f) => q(f.attrs.named?.[0]) === 'model' && animals.has(q(f.attrs.name[0])));
const flags = [];
for (const f of model) for (const r of ranges) {
  const key = q(r.attrs.key[0]), v = Number(q(f.attrs[key]?.[0]));
  if (!Number.isFinite(v)) continue;
  const lo = Number(q(r.attrs.low[0])), hi = Number(q(r.attrs.high[0]));
  if (!(v > 0 && lo > 0 && hi > 0)) continue;
  const L = Math.log10, width = (L(hi) - L(lo)) || 1; // sizes and weights spread over orders of magnitude: compare on a log scale
  const far = v > hi ? (L(v) - L(hi)) / width : v < lo ? (L(lo) - L(v)) / width : 0;
  flags.push({ name: q(f.attrs.name[0]), key, value: v, range: `${lo}..${hi}`, far: +far.toFixed(1) });
}
flags.sort((a, b) => b.far - a.far);
console.log(`${model.length} model-labelled animal numbers, ${ranges.length} sourced animal ranges, ${flags.length} values checked; ${flags.filter((x) => x.far > 5).length} more than 5 log-widths outside`);
console.log('to check against a source (a far value is not wrong by itself: an elephant is far from the median animal):');
for (const x of flags.slice(0, n)) console.log(`  ${x.name} ${x.key}=${x.value} (typical ${x.range}, ${x.far} log-widths out)`);
