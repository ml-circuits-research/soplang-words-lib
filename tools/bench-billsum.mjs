// BillSum 200 (reviewer 19:00): summarizeText against lead-3, ROUGE-1/2 (recall, F1) computed here.
// Read in place from psys2 at a fixed commit (training/eval/billsum-test-200.jsonl, public domain);
// nothing is copied. Items 1-100 may be used for tuning; items 101-200 are held out.
// node tools/bench-billsum.mjs [--n 3] [--part dev|held|all]
import { execFileSync } from 'node:child_process';
import { checkout } from './worlds.mjs';
import { summarizeText } from '../src/index.mjs';

const COMMIT = '56bd1ba04251e9649b8e9df93a2fb94583fe9f17';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const n = Number(arg('--n', 3)), part = arg('--part', 'dev'), budget = Number(arg('--words', 0));
const dir = checkout('psys2');
try { execFileSync('git', ['-C', dir, 'cat-file', '-e', `${COMMIT}^{commit}`]); } catch { execFileSync('git', ['-C', dir, 'fetch', '-q', 'origin']); }
const rows = execFileSync('git', ['-C', dir, 'show', `${COMMIT}:training/eval/billsum-test-200.jsonl`], { maxBuffer: 1 << 28 }).toString().trim().split('\n').map((l) => JSON.parse(l));
const set = part === 'dev' ? rows.slice(0, 100) : part === 'held' ? rows.slice(100) : rows;

const toks = (s) => s.toLowerCase().match(/[a-z0-9]+/g) || [];
const grams = (t, k) => { const m = new Map(); for (let i = 0; i + k <= t.length; i++) { const g = t.slice(i, i + k).join(' '); m.set(g, (m.get(g) || 0) + 1); } return m; };
function rouge(sys, ref, k) {
  const a = grams(toks(sys), k), b = grams(toks(ref), k); let hit = 0, nb = 0, na = 0;
  for (const [g, c] of b) { nb += c; hit += Math.min(c, a.get(g) || 0); } for (const c of a.values()) na += c;
  const r = nb ? hit / nb : 0, p = na ? hit / na : 0; return { r, f: r + p ? (2 * r * p) / (r + p) : 0 };
}
const clean = (t) => t.replace(/``|''/g, '"').replace(/\s+/g, ' ');
const sentences = (t) => clean(t).split(/(?<=[.;:])\s+(?=[A-Z(])/).filter((s) => s.split(' ').length > 3);
const systems = {
  [budget ? `lead-${budget}w` : 'lead-3']: (t) => budget ? toks(clean(t)).slice(0, budget).join(' ') : sentences(t).slice(0, n).join(' '),
  summarizeText: (t) => summarizeText(clean(t), budget ? { words: budget } : { n }).picked.join(' '),
};
const out = {};
for (const [name, f] of Object.entries(systems)) {
  const acc = { r1: 0, f1: 0, r2: 0, f2: 0, words: 0 };
  for (const row of set) { const s = f(row.text), a = rouge(s, row.summary, 1), b = rouge(s, row.summary, 2); acc.r1 += a.r; acc.f1 += a.f; acc.r2 += b.r; acc.f2 += b.f; acc.words += toks(s).length; }
  out[name] = Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, +(v / set.length).toFixed(k === 'words' ? 0 : 3)]));
}
console.log(`BillSum ${part} (${set.length} bills), n=${n}, reference ${Math.round(set.reduce((s, r) => s + toks(r.summary).length, 0) / set.length)} words on average`);
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(14), `R-1 recall ${v.r1} F1 ${v.f1}  R-2 recall ${v.r2} F1 ${v.f2}  ${v.words} words`);
