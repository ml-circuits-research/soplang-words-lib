// Induction: generalise examples into matrix wires.
//
// induce / induceRule - least general generalisation (anti-unification) of example circuits:
//     what is equal in all examples stays constant, what differs becomes a variable, and
//     the same pair of differing values always becomes the same variable, which is how
//     co-reference between wires is recovered. A value of the conclusion that is not
//     copied from the premises but computed from them (sum, difference, product, ratio)
//     is recognised and written as a core.calc. Patterns of the same type are required
//     to match different wires, and negative examples add the comparisons between
//     variables that are needed to exclude them.
// induceSlots - required keys, reference types and small enums observed in a set of wires.

import { parse, format, cloneWire, quote } from './parser.mjs';
import { builtins, quantity } from './builtins.mjs';
import { World } from './world.mjs';

const toWires = (x) => (typeof x === 'string' ? parse(x) : x || []).map(cloneWire);

function permutations(xs) {
  if (xs.length <= 1) return [xs];
  const out = [];
  xs.forEach((x, i) => {
    for (const p of permutations([...xs.slice(0, i), ...xs.slice(i + 1)])) out.push([x, ...p]);
  });
  return out;
}

/** All ways to pair general wires with example wires of the same type (capped). */
function alignments(gen, ex, cap = 5000) {
  const groups = new Map();
  ex.forEach((w, i) => (groups.get(w.type) || groups.set(w.type, []).get(w.type)).push(i));
  const slots = new Map();
  gen.forEach((w, i) => (slots.get(w.type) || slots.set(w.type, []).get(w.type)).push(i));
  for (const [type, idx] of slots) {
    if ((groups.get(type) || []).length !== idx.length) throw new Error(`examples differ in the number of "${type}" wires`);
  }
  if (groups.size !== slots.size) throw new Error('examples differ in wire types');
  let all = [new Array(gen.length)];
  for (const [type, idx] of slots) {
    const perms = permutations(groups.get(type));
    if (all.length * perms.length > cap) { // too many: keep the given order for this type
      all = all.map((a) => { const b = [...a]; idx.forEach((g, j) => (b[g] = groups.get(type)[j])); return b; });
      continue;
    }
    const next = [];
    for (const a of all) for (const p of perms) { const b = [...a]; idx.forEach((g, j) => (b[g] = p[j])); next.push(b); }
    all = next;
  }
  return all;
}

/** Anti-unify the running generalisation with one more example under a given alignment. */
function generalise(gen, ex, align, start, vals, folded) {
  const exToGen = new Map(align.map((e, g) => [ex[e].id, gen[g].id]));
  const table = new Map();
  const newVals = new Map();
  let k = start;
  const out = gen.map((g, gi) => {
    const e = ex[align[gi]];
    const attrs = {};
    for (const key of Object.keys(g.attrs)) {
      const gv = g.attrs[key], ev = e.attrs[key];
      if (!ev || ev.length !== gv.length) continue; // key not shared by all examples: dropped
      attrs[key] = gv.map((a, i) => {
        let b = ev[i];
        if (b[0] === '$' && exToGen.has(b.slice(1))) b = '$?' + exToGen.get(b.slice(1));
        if (a === b) return a;
        const pair = a + '\u0000' + b;
        if (!table.has(pair)) {
          const v = `?v${k++}`;
          table.set(pair, v);
          newVals.set(v, [...(a[0] === '?' ? vals.get(a) : new Array(folded).fill(a)), b]);
        }
        return table.get(pair);
      });
    }
    return { ...g, attrs };
  });
  return { out, vars: table.size, k, vals: newVals };
}

const OPS = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b };

/** For conclusion variables that no premise binds, look for a binary operation that explains them. */
function findCalcs(gen, nWhen, vals, name) {
  const varsOf = (ws) => new Set(ws.flatMap((w) => Object.values(w.attrs).flat()).filter((v) => v[0] === '?'));
  const whenVars = [...varsOf(gen.slice(0, nWhen))];
  const numeric = (v) => vals.get(v)?.every((x) => x !== '' && Number.isFinite(Number(x)));
  const inputs = whenVars.filter(numeric);
  const calcs = [];
  for (const t of varsOf(gen.slice(nWhen))) {
    if (whenVars.includes(t) || !numeric(t)) continue;
    const want = vals.get(t).map(Number);
    search: for (const [fn, f] of Object.entries(OPS)) {
      for (const a of inputs) for (const b of inputs) {
        if (a === b || ((fn === 'add' || fn === 'mul') && a > b)) continue;
        const xs = vals.get(a).map(Number), ys = vals.get(b).map(Number);
        if (want.every((w, i) => Math.abs(f(xs[i], ys[i]) - w) <= 1e-9 * Math.max(1, Math.abs(w)))) {
          calcs.push({ id: `${name}_c${calcs.length}`, out: t, fn, args: [a, b] });
          break search;
        }
      }
    }
  }
  return calcs;
}

const COMPARISONS = ['neq', 'lt', 'gt', 'lte', 'gte'];

/**
 * Tests that separate the positive examples from the negative ones.
 * A negative example is covered while the patterns (with the tests so far) still match it;
 * for each surviving match we add a comparison that holds in every positive example and
 * fails on that match.
 */
function findTests(gen, nWhen, vals, tests, negatives, name) {
  const patterns = gen.slice(0, nWhen).map((w) => {
    const attrs = {};
    for (const k of Object.keys(w.attrs)) attrs[k] = w.attrs[k].map((v) => (v.startsWith('$?') ? '$' + v.slice(2) : v));
    return { ...w, attrs, pattern: true };
  });
  const vars = [...vals.keys()];
  const numeric = (v) => vals.get(v).every((x) => quantity(x));
  const candidates = [];
  for (const fn of COMPARISONS) {
    for (const a of vars) for (const b of vars) {
      if (a === b || (fn === 'neq' && a > b)) continue;
      if (fn !== 'neq' && !(numeric(a) && numeric(b))) continue;
      if (vals.get(a).every((x, i) => builtins[fn]([x, vals.get(b)[i]]))) candidates.push({ fn, args: [a, b] });
    }
  }
  const value = (row, arg) => row[arg.slice(1)];
  const passes = (row, t) => builtins[t.fn](t.args.map((x) => value(row, x)));
  const covered = [];
  negatives.forEach((neg, index) => {
    const w = new World();
    if (!w.tell(toWires(neg.when)).ok) return;
    for (let guard = 0; guard < 50; guard++) {
      const row = w.ask(patterns).find((r) => tests.every((t) => passes(r, t)));
      if (!row) return;
      const fix = candidates.find((t) => !tests.includes(t) && !passes(row, t));
      if (!fix) { covered.push(index); return; }
      fix.id = `${name}_x${tests.length}`;
      tests.push(fix);
    }
  });
  return covered;
}

/**
 * examples: [{ when, then }] of ground wires (text or wire objects).
 * options:  name      id of the rule and prefix of its wires
 *           kind      'rule' (default) or 'deny' (examples then need only `when`)
 *           why       text of a deny
 *           tolerant  skip examples whose shape differs from the first instead of throwing
 *           distinct  patterns of the same type must match different wires (default true)
 *           negatives [{ when }] circuits that the rule must not match
 * Returns { text, skipped, calcs, tests, coversNegative, variables, examples }.
 */
export function induce(examples, { name = 'induced', kind = 'rule', why, tolerant = false, distinct = true, negatives = [] } = {}) {
  if (!examples.length) throw new Error('induce: no examples');
  const prep = examples.map((e, index) => {
    const when = toWires(e.when), then = kind === 'deny' ? [] : toWires(e.then);
    return { all: [...when, ...then], nWhen: when.length, index };
  });
  const head = prep[0];
  const ids = new Map(head.all.map((w, i) => [w.id, i < head.nWhen ? `${name}_p${i}` : `${name}_t${i - head.nWhen}`]));
  let gen = head.all.map((w) => {
    const c = cloneWire(w);
    c.id = ids.get(w.id);
    for (const k of Object.keys(c.attrs)) {
      c.attrs[k] = c.attrs[k].map((v) => (v[0] === '$' && ids.has(v.slice(1)) ? '$?' + ids.get(v.slice(1)) : v));
    }
    return c;
  });

  let n = 0, folded = 1, vals = new Map();
  const skipped = [];
  for (const ex of prep.slice(1)) {
    try {
      if (ex.nWhen !== head.nWhen) throw new Error('examples differ in the number of when wires');
      const whenAligns = alignments(gen.slice(0, ex.nWhen), ex.all.slice(0, ex.nWhen));
      const thenAligns = alignments(gen.slice(ex.nWhen), ex.all.slice(ex.nWhen)).map((a) => a.map((i) => i + ex.nWhen));
      let best = null;
      for (const wa of whenAligns) for (const ta of thenAligns) {
        const r = generalise(gen, ex.all, [...wa, ...ta], n, vals, folded);
        if (!best || r.vars < best.vars) best = r;
      }
      gen = best.out; n = best.k; vals = best.vals; folded++;
    } catch (e) {
      if (!tolerant) throw new Error(`induce: ${e.message}`);
      skipped.push({ index: ex.index, why: e.message });
    }
  }

  const calcs = kind === 'rule' && folded > 1 ? findCalcs(gen, head.nWhen, vals, name) : [];
  const tests = [];
  if (distinct) {
    for (let i = 0; i < head.nWhen; i++) for (let j = i + 1; j < head.nWhen; j++) {
      if (gen[i].type === gen[j].type) tests.push({ id: `${name}_x${tests.length}`, fn: 'neq', args: ['?' + gen[i].id, '?' + gen[j].id] });
    }
  }
  const coversNegative = negatives.length ? findTests(gen, head.nWhen, vals, tests, negatives, name) : [];
  const lines = [];
  gen.forEach((w, i) => {
    const attrs = {};
    for (const k of Object.keys(w.attrs)) attrs[k] = w.attrs[k].map((v) => (v.startsWith('$?') ? '$' + v.slice(2) : v));
    lines.push(format({ ...w, attrs, pattern: i < head.nWhen }));
  });
  for (const c of calcs) lines.push(`@${c.id} core.calc out=${c.out} fn=${c.fn} args=${c.args[0]} args=${c.args[1]}`);
  for (const t of tests) lines.push(`@${t.id} core.test fn=${t.fn} args=${t.args[0]} args=${t.args[1]}`);
  const links = [
    ...gen.map((w, i) => `${i < head.nWhen ? 'when' : 'then'}=$${w.id}`),
    ...calcs.map((c) => `with=$${c.id}`),
    ...tests.map((t) => `if=$${t.id}`),
  ];
  if (kind === 'deny') links.push(`why=${quote(why || `induced from ${folded} examples`)}`);
  lines.push(`@${name} ${kind === 'deny' ? 'core.deny' : 'core.rule'} ${links.join(' ')}`);
  return { text: lines.join('\n'), skipped, calcs, tests, coversNegative, variables: n, examples: folded };
}

/** Shorthand for induce(...).text. */
export function induceRule(examples, options) { return induce(examples, options).text; }

/** Slots observed in a set of ground wires, as core.slot text. */
export function induceSlots(input, { enumMax = 4, prefix = 'slot' } = {}) {
  const wires = toWires(input);
  const typeOf = new Map(wires.map((w) => [w.id, w.type]));
  const byType = new Map();
  for (const w of wires) (byType.get(w.type) || byType.set(w.type, []).get(w.type)).push(w);
  const lines = [];
  for (const [type, ws] of byType) {
    const keys = new Set(ws.flatMap((w) => Object.keys(w.attrs)));
    for (const key of keys) {
      const present = ws.filter((w) => w.attrs[key]);
      const values = present.flatMap((w) => w.attrs[key]);
      const parts = [`@${prefix}_${type}_${key}`.replace(/[^@\w.\-]/g, '_'), 'core.slot', `of=${type}`, `key=${key}`];
      if (present.length === ws.length && ws.length > 1) parts.push('required=true');
      if (present.some((w) => w.attrs[key].length > 1)) parts.push('many=true');
      const refTypes = new Set(values.map((v) => (v[0] === '$' ? typeOf.get(v.slice(1)) : null)));
      const distinct = [...new Set(values)];
      if (refTypes.size === 1 && !refTypes.has(null) && !refTypes.has(undefined)) parts.push(`type=${[...refTypes][0]}`);
      else if (!values.some((v) => v[0] === '$') && distinct.length <= enumMax && values.length > distinct.length) {
        for (const v of distinct) parts.push(`enum=${v}`);
      }
      lines.push(parts.join(' '));
    }
  }
  return lines.join('\n');
}
