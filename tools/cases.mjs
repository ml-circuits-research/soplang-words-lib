#!/usr/bin/env node
// The case corpus (Round 25 standing direction): language-free cases (acts, routes, turns,
// why) with what should come out, from the applications' ledgers and hand-overs, grouped
// by pipeline stage. Every release runs it and reports per stage; it only grows.
//
//   node tools/cases.mjs [--json] [--failures]
import { readFileSync, readdirSync } from 'node:fs';
import { World, turn, route } from '../src/index.mjs';
import { worldText } from './worlds.mjs';

const dir = new URL('../cases/', import.meta.url);
// A case names the published worlds it needs (`world`: read from sop-knowledge-worlds at the
// commit in repos.pin) and carries any other wires itself (`wires`: only what it needs).
// std.acts is always loaded. A case whose world cannot be had (offline) is skipped.
const cases = readdirSync(dir).filter((f) => f.endsWith('.cases.json')).flatMap((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));

/** Does one step's result meet what is expected? Returns null or the reason it does not. */
function check(w, r, e, kind) {
  if (!e) return null;
  if (kind === 'why') { const s = r?.steps?.[0] || {}; for (const k of Object.keys(e)) if (s[k] !== e[k]) return `why ${k}: ${s[k]} ≠ ${e[k]}`; return null; }
  if (kind === 'route') return r[0]?.world === e.world ? null : `route: ${r[0]?.world} ≠ ${e.world}`;
  if (kind === 'turn') return r.status === e.status ? null : `turn: ${r.status} ≠ ${e.status}`;
  if (e.ok !== undefined && r.ok !== e.ok) return `ok: ${r.ok} ≠ ${e.ok}${r.violations?.[0]?.why ? ` (${String(r.violations[0].why)})` : ''}`;
  if (e.changes !== undefined && Boolean(r.diff && r.diff.same === false) !== e.changes) return `changes: ${r.diff ? !r.diff.same : 'no diff'} ≠ ${e.changes}`;
  if (e.asks && JSON.stringify((r.result?.asks || []).map((a) => a.key)) !== JSON.stringify(e.asks)) return `asks: ${JSON.stringify((r.result?.asks || []).map((a) => a.key))} ≠ ${JSON.stringify(e.asks)}`;
  if (e.result) for (const [k, v] of Object.entries(e.result)) if (JSON.stringify(r.result?.[k]) !== JSON.stringify(v)) return `result.${k}: ${JSON.stringify(r.result?.[k])} ≠ ${JSON.stringify(v)}`;
  if (e.why && !String(r.violations?.[0]?.why ?? '').includes(e.why)) return `why: "${r.violations?.[0]?.why}" lacks "${e.why}"`;
  if (e.kind && r.violations?.[0]?.kind !== e.kind) return `kind: ${r.violations?.[0]?.kind} ≠ ${e.kind}`;
  const told = (r.diff?.added || []).filter((a) => a.tier === 'told').map((a) => a.id);
  if (e.added && JSON.stringify(told) !== JSON.stringify(e.added)) return `added: ${JSON.stringify(told)} ≠ ${JSON.stringify(e.added)}`;
  if (e.removed !== undefined && (r.diff?.removed || []).filter((x) => !String(x.id).startsWith('_')).length !== e.removed) return `removed: ${(r.diff?.removed || []).length} ≠ ${e.removed}`;
  if (e.changed) for (const c of e.changed) if (!(r.diff?.changed || []).some((x) => x.id === c.id && x.key === c.key && String(x.to) === String(c.to) && (c.from === undefined || String(x.from) === String(c.from)))) return `changed: no ${c.id}.${c.key} ${c.from ?? ''}→${c.to}`;
  if (e.count) for (const [k, n] of Object.entries(e.count)) if (w.ofType(k).length !== n) return `count ${k}: ${w.ofType(k).length} ≠ ${n}`;
  return null;
}

export function runCases() {
  const out = [];
  for (const c of cases) { // bounded: the corpus
    let fail = null;
    const texts = [].concat(c.world || []).map((n) => worldText(n));
    if (texts.some((t) => t === null)) { out.push({ id: c.id, stage: c.stage, source: c.source, ok: true, skipped: 'the published worlds cannot be read here' }); continue; }
    try {
      const w = new World();
      w.load(['@acts core.use world=std.acts', ...texts, c.wires || ''].join('\n'));
      for (const [i, s] of c.steps.entries()) {
        let r, kind = 'act';
        if (s.why) { r = w.why(...s.why); kind = 'why'; } else if (s.route) { r = route(w, s.route); kind = 'route'; } else if (s.turn) { r = turn(w, s.turn); kind = 'turn'; } else r = w.act({ action: s.act, args: s.args });
        const bad = check(w, r, s.expect, kind);
        if (bad) { fail = `step ${i + 1}: ${bad}`; break; }
      }
    } catch (e) { fail = `threw: ${e.message}`; }
    out.push({ id: c.id, stage: c.stage, source: c.source, ok: !fail, fail });
  }
  const byStage = {};
  for (const r of out) { const s = (byStage[r.stage] ||= { pass: 0, fail: 0 }); r.ok ? s.pass++ : s.fail++; }
  return { total: out.length, pass: out.filter((r) => r.ok).length, skipped: out.filter((r) => r.skipped).length, byStage, results: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = runCases();
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else {
    console.log(`cases: ${r.pass} / ${r.total} pass; ${Object.entries(r.byStage).map(([s, x]) => `${s} ${x.pass}/${x.pass + x.fail}`).join(', ')}`);
    if (process.argv.includes('--failures')) for (const x of r.results.filter((y) => !y.ok)) console.log(`  ${x.id} (${x.stage}): ${x.fail}`);
  }
}
