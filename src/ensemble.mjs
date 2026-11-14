// Several readers, one confidence (reviewer 02:30, owner 18:18): readers run as parallel voices, not a
// fallback chain. Their candidate frames are pooled with features (which readers proposed each: agreement;
// words left unread; the cost of assumptions; specificity), std.decide (kind ensemble) combines them, and the
// winner comes with a confidence. Below a threshold the answer is a question naming the competing readings.
// In the literature: ensembles with reranking (Charniak and Johnson 2005) and selective prediction, risk-coverage (Geifman and El-Yaniv 2017); docs/literature.md.

import { choose } from './rank.mjs';
import { readByTypes } from './readtypes.mjs';
import { readCanonical } from './alternate.mjs';

const keyOf = (f) => (f ? JSON.stringify({ is: f.is, key: f.key, of: f.of, value: f.value, kind: f.kind, act: f.act, args: f.args }) : null);

/** The library's own voices: types (readByTypes), canonical (readCanonical, first clause), exact (no near words). */
export function defaultReaders(read = {}, canonical = {}) {
  return {
    types: (w, t) => { const r = readByTypes(w, t, read); return r.best ? [{ frame: r.best, unread: r.unread.length + r.left.length, cost: (r.near || []).reduce((s, x) => s + x.cost, 0), specificity: r.frames[0]?.words?.length ?? 0 }] : []; },
    canonical: (w, t) => readCanonical(w, t, { ...canonical, read }).filter((c) => c.frame).slice(0, 1).map((c) => ({ frame: c.frame, unread: c.unread.length, cost: (c.near || []).reduce((s, x) => s + x.cost, 0) + c.applied.length * 0.5, specificity: 0 })),
    exact: (w, t) => { const r = readByTypes(w, t, { ...read, near: 0 }); return r.best && !r.unread.length ? [{ frame: r.best, unread: 0, cost: 0, specificity: r.frames[0]?.words?.length ?? 0 }] : []; },
  };
}

/**
 * Reads `text` with every reader ({ name: (world, text) -> [{ frame, unread?, cost?, specificity? }] }) and
 * combines: { frame, confidence, voices: [names], candidates: [{ frame, agreement, readers, ... }], ask? }.
 * `confidence` is the weighted share of the readers that proposed the winner (`weights`: { reader: w },
 * default 1 each; learnt from cases, for example each reader's precision on a training half). Below `threshold` (default 0.5)
 * the result has `ask`: the competing frames, for "did you mean A or B?". Options: `readers`, `read`,
 * `canonical`, `threshold`, `seed`.
 */
export function readEnsemble(world, text, { readers, read = {}, canonical = {}, threshold = 0.5, seed = 1, weights = {} } = {}) {
  const R = readers ?? defaultReaders(read, canonical);
  const pool = new Map();
  let ran = 0;
  for (const [name, fn] of Object.entries(R)) { // bounded: the readers
    let out = [];
    try { out = fn(world, text) || []; } catch { out = []; }
    if (out.length) ran++;
    for (const c of out) {
      const k = keyOf(c.frame);
      if (!k) continue;
      const p = pool.get(k) || pool.set(k, { frame: c.frame, readers: [], unread: Infinity, cost: Infinity, specificity: 0 }).get(k);
      if (!p.readers.includes(name)) p.readers.push(name);
      p.unread = Math.min(p.unread, c.unread ?? 0); p.cost = Math.min(p.cost, c.cost ?? 0); p.specificity = Math.max(p.specificity, c.specificity ?? 0);
    }
  }
  const wt = (n) => weights[n] ?? 1; // a reader's weight: 1, or learnt from cases (its precision on a training half)
  const cands = [...pool.values()].map((p) => ({ ...p, agreement: +p.readers.reduce((s, n) => s + wt(n), 0).toFixed(3) }));
  if (!cands.length) return { frame: null, confidence: 0, voices: [], candidates: [], ask: [] };
  const c = choose(world, 'ensemble', cands, { seed });
  const best = c.best, confidence = +(best.agreement / Math.max(1e-9, Object.keys(R).reduce((s, n) => s + wt(n), 0))).toFixed(3);
  const out = { frame: best.frame, confidence, voices: best.readers, candidates: c.order, ranked: c.ranked };
  out.complete = best.unread === 0; // every content word consumed by the winning reading
  if (confidence < threshold || !out.complete || (c.order[1] && c.order[1].agreement === best.agreement && c.order[1].unread === best.unread)) out.ask = c.order.slice(0, 3).map((x) => x.frame); // an incomplete reading is not final
  return out;
}

/**
 * The risk–coverage curve of a reader with a confidence: rows [{ confidence, correct }] → [{ threshold,
 * coverage, risk }]: answering only at or above each threshold, the share answered and the share of those wrong.
 */
export function riskCoverage(rows) {
  const ts = [...new Set(rows.map((r) => r.confidence))].sort((a, b) => b - a);
  return ts.map((t) => { const ans = rows.filter((r) => r.confidence >= t); return { threshold: t, coverage: +(ans.length / Math.max(1, rows.length)).toFixed(3), risk: +(ans.filter((r) => !r.correct).length / Math.max(1, ans.length)).toFixed(3) }; });
}

/**
 * Probability calibration of a reader's confidence (the literature's calibration: Platt 1999, Zadrozny and
 * Elkan 2002): rows [{ confidence, correct }] → { method, p(score) -> probability, params?, steps?, brier: {
 * before, after } }. `method`: 'isotonic' (default: pool-adjacent-violators, a non-decreasing step function,
 * interpolated between steps) or 'platt' (a logistic curve 1 / (1 + exp(a·s + b)), fit by Newton's method on
 * the log loss with Platt's smoothed targets). Fit on held-out rows, not the rows the reader was tuned on.
 */
export function calibrate(rows, { method = 'isotonic', iterations = 100 } = {}) {
  const pts = rows.map((r) => ({ s: Number(r.confidence ?? r.score), y: r.correct ? 1 : 0 })).filter((r) => Number.isFinite(r.s));
  if (!pts.length) return { method, p: () => null, brier: { before: null, after: null } };
  const brier = (f) => +(pts.reduce((t, r) => t + (f(r.s) - r.y) ** 2, 0) / pts.length).toFixed(4);
  const clip = (x) => Math.min(1, Math.max(0, x));
  let p, extra;
  if (method === 'platt') {
    const pos = pts.filter((r) => r.y).length, neg = pts.length - pos;
    const tp = (pos + 1) / (pos + 2), tn = 1 / (neg + 2); // Platt's targets: no 0 or 1, so the fit does not run off
    let a = 0, b = Math.log((neg + 1) / (pos + 1));
    for (let it = 0; it < iterations; it++) { // bounded: iterations
      let ga = 0, gb = 0, haa = 0, hab = 0, hbb = 0;
      for (const r of pts) { const t = r.y ? tp : tn, q = 1 / (1 + Math.exp(a * r.s + b)), d = t - q, w = q * (1 - q); ga += r.s * d; gb += d; haa += r.s * r.s * w; hab += r.s * w; hbb += w; }
      const det = haa * hbb - hab * hab;
      if (Math.abs(det) < 1e-12) break;
      const da = (hbb * ga - hab * gb) / det, db = (haa * gb - hab * ga) / det;
      a -= da; b -= db;
      if (Math.abs(da) + Math.abs(db) < 1e-9) break;
    }
    p = (s) => 1 / (1 + Math.exp(a * Number(s) + b));
    extra = { params: { a: +a.toFixed(6), b: +b.toFixed(6) } };
  } else {
    const sorted = pts.slice().sort((x, y) => x.s - y.s);
    const blocks = []; // pool adjacent violators: blocks of { lo, hi, sum, n }, means non-decreasing
    for (const r of sorted) { // bounded: each row joins once, each merge removes a block
      blocks.push({ lo: r.s, hi: r.s, sum: r.y, n: 1 });
      while (blocks.length > 1 && blocks[blocks.length - 2].sum / blocks[blocks.length - 2].n >= blocks[blocks.length - 1].sum / blocks[blocks.length - 1].n) { // bounded: each pass removes a block
        const t = blocks.pop(), u = blocks[blocks.length - 1]; u.hi = t.hi; u.sum += t.sum; u.n += t.n; }
    }
    const steps = blocks.map((k) => ({ lo: k.lo, hi: k.hi, p: +(k.sum / k.n).toFixed(4), n: k.n }));
    p = (s) => {
      s = Number(s);
      if (s <= steps[0].hi) return steps[0].p;
      for (let i = 1; i < steps.length; i++) { // bounded: the steps
        if (s <= steps[i].lo) { const a = steps[i - 1], c = steps[i]; return clip(a.p + ((c.p - a.p) * (s - a.hi)) / Math.max(1e-12, c.lo - a.hi)); }
        if (s <= steps[i].hi) return steps[i].p;
      }
      return steps[steps.length - 1].p;
    };
    extra = { steps };
  }
  return { method, p, ...extra, brier: { before: brier((s) => clip(s)), after: brier(p) } };
}
