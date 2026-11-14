// Several readers, one confidence (reviewer 02:30, owner 18:18): readers run as parallel voices, not a
// fallback chain. Their candidate frames are pooled with features (which readers proposed each: agreement;
// words left unread; the cost of assumptions; specificity), std.decide (kind ensemble) combines them, and the
// winner comes with a confidence. Below a threshold the answer is a question naming the competing readings.

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
