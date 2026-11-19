// matrix.mjs — the diversity report for an assembled dataset: operation × area ×
// tier coverage, length distribution and the filler-dominance check (the failure of
// the first human corpus was a prescribed filler list; this report makes any
// dominating word visible per area, so it cannot hide).
//
// Usage: node matrix.mjs --examples examples.jsonl [--out matrix.md]
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const IN = arg('examples');
const OUT = arg('out', 'matrix.md');
const rows = readFileSync(IN, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

const by = (fn) => rows.reduce((m, r) => ((m[fn(r)] = (m[fn(r)] || 0) + 1), m), {});
const perArea = by((r) => r.world);
const perTier = by((r) => r.tier);
const perOp = by((r) => r.cohort.operation);
const lens = rows.map((r) => r.text.split(/\s+/).length).sort((a, b) => a - b);
const q = (p) => lens[Math.floor(lens.length * p)];
const words = {};
for (const r of rows) {
  const m = /^[\W]*?(\w+)/.exec(r.text.toLowerCase());
  if (!m) continue;
  (words[r.world] ||= {});
  words[r.world][m[1]] = (words[r.world][m[1]] || 0) + 1;
}
let md = `# Diversity matrix\n\nExamples: **${rows.length}**\n\n`;
md += `| area | examples |\n| --- | ---: |\n`;
for (const [a, n] of Object.entries(perArea).sort()) md += `| ${a} | ${n} |\n`;
md += `\n| tier | examples |\n| --- | ---: |\n`;
for (const [t, n] of Object.entries(perTier).sort()) md += `| ${t} | ${n} |\n`;
md += `\nWords per example: min ${lens[0]}, median ${q(0.5)}, p90 ${q(0.9)}, max ${lens[lens.length - 1]}.\n`;
md += `\nOperations covered: ${Object.keys(perOp).length} distinct; thinnest: ${
  Object.entries(perOp).sort((a, b) => a[1] - b[1]).slice(0, 8).map(([o, n]) => `${o} (${n})`).join(', ')}.\n`;
md += `\n## Filler dominance check (first word per area; the previous corpus failed here)\n\n`;
for (const a of Object.keys(words).sort()) {
  const top = Object.entries(words[a]).sort((x, y) => y[1] - x[1]).slice(0, 6)
    .map(([w, n]) => `${w}:${Math.round((100 * n) / Object.values(words[a]).reduce((x, y) => x + y, 0))}%`).join(', ');
  md += `- **${a}**: ${top}\n`;
}
writeFileSync(OUT, md);
console.log(md.split('\n').filter(Boolean).slice(0, 8).join(' | '));
console.log(`-> ${OUT}`);
