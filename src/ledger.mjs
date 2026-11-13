// A failure ledger (Round 24, A6): a failing case is data. Rows are kept append-only (a row
// already there — same source, text and world — is never rewritten or added again), and
// grouped by the stage of the request pipeline where it failed (reading, routing, filling,
// acting) and by cause signals the host plugs in, so a change can name a group and report
// its count before and after. Pure functions: storing the rows is the host's (tools/ledger.mjs
// keeps them in a JSONL file).

export const STAGES = ['reading', 'routing', 'filling', 'acting', 'replying'];

/** The key of a row: one per source, text and world. */
export const ledgerKey = (row) => `${row.source ?? ''}\u0001${row.text ?? ''}\u0001${row.world ?? ''}`;

/** The rows of `add` that are new to `rows` (append-only: old rows stay as they are). */
export function ledgerAppend(rows, add) {
  const seen = new Set(rows.map(ledgerKey));
  const out = [];
  for (const r of add) { const k = ledgerKey(r); if (!seen.has(k)) { seen.add(k); out.push(r); } } // bounded: the rows given
  return out;
}

/** The stage of the pipeline a `turn` result failed at, or null when it was done. */
export function stageOf(result) {
  if (!result || result.status === 'nothing') return 'reading';
  if (result.status === 'done') return null;
  if (result.status === 'ask') return 'filling';
  if (result.status === 'elsewhere') return 'routing';
  const why = String(result.dropped?.[0]?.violation?.why ?? '');
  return /no world here has|there is no world/.test(why) ? 'routing' : 'acting';
}

/**
 * Groups rows by stage, class and the first cause signal that holds (`signals`: [name,
 * predicate(row)], the host's list); each group with its count and up to `examples` rows
 * spread over sources. Largest first; the order of equal groups is stable.
 */
export function ledgerGroups(rows, { signals = [], examples = 5 } = {}) {
  const groups = new Map();
  for (const r of rows) { // bounded: the rows
    const cause = signals.find(([, p]) => { try { return p(r); } catch { return false; } })?.[0] ?? 'other';
    const key = `${r.stage ?? 'unknown'} / ${r.class ?? '-'} / ${cause}`;
    (groups.get(key) || groups.set(key, { key, stage: r.stage ?? 'unknown', class: r.class ?? '-', cause, rows: [] }).get(key)).rows.push(r);
  }
  const out = [...groups.values()].map((g) => {
    const bySource = new Map();
    for (const r of g.rows) (bySource.get(r.source) || bySource.set(r.source, []).get(r.source)).push(r);
    const picked = [];
    for (let i = 0; picked.length < examples && picked.length < g.rows.length; i++) for (const list of bySource.values()) if (list[i] && picked.length < examples) picked.push(list[i]); // round robin over sources
    return { key: g.key, stage: g.stage, class: g.class, cause: g.cause, count: g.rows.length, examples: picked };
  });
  return out.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}
