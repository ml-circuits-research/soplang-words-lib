// coverage.mjs — the vocabulary-coverage auditor and batch trigger for the
// reader-dataset skill. The rule it enforces (owner, 2026-11-19): every value the
// knowledge worlds declare (k.objects/colours/faces…) should appear in the dataset
// at least --min N times (default 20). Anything below N is a trigger: mint new
// seeds for those values and generate diverse variants around them.
//
// Usage: node coverage.mjs --vocabulary vocabulary.json --examples examples.jsonl
//                     [--min 20] [--out coverage-report.json] [--fail-under 90]
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const VOCAB = arg('vocabulary');
const EXAMPLES = arg('examples');
const MIN = Number(arg('min', 20));
const FAIL_UNDER = Number(arg('fail-under', 90));
const OUT = arg('out', 'coverage-report.json');
if (!VOCAB || !EXAMPLES) { console.error('usage: coverage.mjs --vocabulary <json> --examples <jsonl> [--min 20]'); process.exit(1); }

const vocab = JSON.parse(readFileSync(VOCAB, 'utf8'));
const words = new Map();
for (const line of readFileSync(EXAMPLES, 'utf8').trim().split('\n')) {
  if (!line) continue;
  const r = JSON.parse(line);
  const text = String(r.text || '').toLowerCase();
  for (const w of text.match(/[a-zà-ÿ']+/g) || []) words.set(w, (words.get(w) || 0) + 1);
}

const perValue = [];
let covered = 0, total = 0;
for (const [source, table] of Object.entries(vocab)) {
  if (source === 'format' || typeof table !== 'object') continue;
  for (const [canonical, info] of Object.entries(table)) {
    total++;
    const surfaces = [canonical.toLowerCase(), ...(info.surfaces || []).map((s) => s.toLowerCase())];
    const count = surfaces.reduce((n, s) => n + [...s.split(/\s+/)].reduce((m, w) => Math.max(m, words.get(w) || 0), 0), 0);
    const ok = count >= MIN;
    if (ok) covered++;
    perValue.push({ source, canonical, count, ok, trigger: !ok });
  }
}
const pct = total ? Math.round((100 * covered) / total) : 100;
const triggers = perValue.filter((v) => v.trigger).sort((a, b) => a.count - b.count);
writeFileSync(OUT, JSON.stringify({
  min: MIN, totalValues: total, covered, pct,
  missing: triggers.filter((v) => v.count === 0).length,
  thin: triggers.filter((v) => v.count > 0).length,
  triggerList: triggers.map((v) => ({ source: v.source, canonical: v.canonical, count: v.count })),
}, null, 1));
console.log(`coverage: ${covered}/${total} values >= ${MIN} occurrences (${pct}%)`);
console.log(`missing (0): ${triggers.filter((v) => v.count === 0).length}, thin (<${MIN}): ${triggers.filter((v) => v.count > 0).length}`);
console.log(`-> ${OUT}; batch trigger list included; exit ${pct < FAIL_UNDER ? 1 : 0}`);
if (pct < FAIL_UNDER) process.exit(1);
