// Experiment and ablation harnesses (Round 28 item 9): cells with expectations run through a host, each
// result a ledger row (pass, stage, cause); configurations × sets give a table, and the failures are grouped
// by cause, so what a mechanism buys is measured by turning it off (the ablation).

import { ledgerGroups } from './ledger.mjs';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Runs cells [{ id, input, expect, set?, class? }] through `run(input, config) -> output` and returns ledger
 * rows [{ source, text, cell, config, set, pass, got, expect, stage?, class? }]. `judge(got, expect, cell)`
 * decides a pass (default: equal as JSON); `stage(got, cell)` names where a failure happened.
 */
export function experiment(cells, run, { config = {}, name = 'base', judge = same, stage, source = 'experiment' } = {}) {
  return cells.map((c) => { // bounded: the cells
    let got, error;
    try { got = run(c.input, config); } catch (e) { error = String(e?.message ?? e); }
    const pass = error === undefined && !!judge(got, c.expect, c);
    return { source, text: typeof c.input === 'string' ? c.input : JSON.stringify(c.input), cell: c.id, config: name, set: c.set ?? 'all', ...(c.class ? { class: c.class } : {}),
      pass, got: error ? { error } : got, expect: c.expect, ...(!pass && stage ? { stage: stage(got, c) } : {}) };
  });
}

/**
 * The ablation: every configuration ({ name: config }) on every set of cells, as ledger rows, a table
 * { config: { set: { pass, of } } }, what each configuration buys against `baseline` (cells it passes that the
 * baseline fails, and the reverse), and the failures of each configuration grouped by cause (`signals`, as
 * ledgerGroups takes them).
 */
export function ablation(cells, run, configs, { baseline = Object.keys(configs)[0], signals = [], ...opts } = {}) {
  const rows = [], table = {};
  for (const [name, config] of Object.entries(configs)) { // bounded: the configurations
    const rs = experiment(cells, run, { ...opts, config, name });
    rows.push(...rs);
    const t = (table[name] = {});
    for (const r of rs) { const s = (t[r.set] ||= { pass: 0, of: 0 }); s.of++; if (r.pass) s.pass++; }
  }
  const by = (n) => new Map(rows.filter((r) => r.config === n).map((r) => [r.cell, r.pass]));
  const base = by(baseline);
  const buys = Object.fromEntries(Object.keys(configs).filter((n) => n !== baseline).map((n) => {
    const m = by(n);
    return [n, { gains: [...m].filter(([c, p]) => p && !base.get(c)).map(([c]) => c), losses: [...m].filter(([c, p]) => !p && base.get(c)).map(([c]) => c) }];
  }));
  const causes = Object.fromEntries(Object.keys(configs).map((n) => [n, ledgerGroups(rows.filter((r) => r.config === n && !r.pass), { signals }).map((g) => ({ key: g.key, rows: g.count }))]));
  return { rows, table, buys, causes, baseline };
}
