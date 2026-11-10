// Abduction: find what would have to be assumed for a goal pattern to hold, with the
// world still consistent.
//
// Two kinds of assumption, both declared in the matrix:
//   @a core.abducible of=rain                  a whole wire of this type may be assumed
//   @b core.abducible of=patient key=condition a value for this open key may be assumed
//
// Candidates are generated backwards (goal -> rule templates -> rule patterns) and then
// verified forwards in a scratch transaction, so calcs, tests and deny constraints apply.
//
// A rule's calcs are carried along backwards as equations. When the search is through,
// they are solved for what is still unknown: forwards when every argument is known,
// backwards for add, sub, mul and div when one argument is missing. A value that is
// still unknown after that is tried from the slot's enum or range, if it has one.

import { parse, format, cloneWire } from './parser.mjs';
import { EMPTY, walk, unify, hasVar, isVar } from './unify.mjs';
import { localize } from './matrix.mjs';
import { builtins } from './builtins.mjs';

// The missing argument of an arithmetic calc, from its result and its other arguments.
// `known` are the other arguments in order; `i` is the place of the missing one.
const INVERSE = {
  add: (out, known) => builtins.sub([out, ...known]),
  sub: (out, known, i) => (i === 0 ? builtins.add([out, ...known]) : builtins.sub([...known, out])),
  mul: (out, known) => builtins.div([out, ...known]),
  div: (out, known, i) => (i === 0 ? builtins.mul([out, ...known]) : builtins.div([...known, out])),
};

function rename(w, n) {
  const c = cloneWire(w);
  c.id = `${w.id}~${n}`;
  for (const k of Object.keys(c.attrs)) c.attrs[k] = c.attrs[k].map((v) => (hasVar(v) ? `${v}~${n}` : v));
  return c;
}

export function abduce(world, goal, { maxDepth = 3, max = 10, maxAssumptions = 4, maxCandidates = 500 } = {}) {
  const c = world._compiled();
  const goalWires = typeof goal === 'string' ? parse(goal) : goal;
  const locals = new Set(goalWires.map((w) => w.id));
  const goals = goalWires.map((w) => localize(w, locals));
  let n = 0;
  const size = (h) => h.wires.length + h.fills.length;
  const equation = (calc, k) => ({ fn: calc.fn, out: hasVar(calc.out) ? `${calc.out}~${k}` : calc.out, args: calc.args.map((a) => (hasVar(a) ? `${a}~${k}` : a)) });

  /** Solve the equations for what they determine. Returns the bindings, or null when an equation cannot hold. */
  function propagate(calcs, s) {
    for (;;) {
      world._b.tick('abduce');
      let progress = false;
      for (const q of calcs) {
        const out = walk(q.out, s);
        const args = q.args.map((a) => walk(a, s));
        const missing = args.filter(hasVar).length;
        if (missing === 0) {
          const v = world.fns[q.fn](args, world);
          if (v === undefined || v === null) return null;
          if (hasVar(out)) { s = unify(out, String(v), s); if (!s) return null; progress = true; }
          else if (String(v) !== out && !builtins.eq([String(v), out])) return null;
        } else if (missing === 1 && !hasVar(out) && INVERSE[q.fn] && world.fns[q.fn] === builtins[q.fn]) {
          const i = args.findIndex(hasVar);
          if (!isVar(args[i])) continue;
          const v = INVERSE[q.fn](out, args.filter((_, j) => j !== i), i);
          if (v === undefined || v === null) return null;
          s = unify(args[i], String(v), s);
          progress = true;
        }
      }
      if (!progress) return s;
    }
  }

  /** Turn a finished search into hypotheses without variables. */
  // bounded: one level per assumed value that is still unknown (at most maxAssumptions)
  function* finalise(hyp, s) {
    s = hyp.calcs.length ? propagate(hyp.calcs, s) : s;
    if (!s) return;
    const open = hyp.fills.find((f) => hasVar(walk(f.value, s)));
    if (open) { // nothing determines it: try the values its slot allows
      const t = walk(open.value, s);
      const slot = c.slotOf(world.get(open.id).type, open.key);
      const domain = isVar(t) && slot ? slot.enum || slot.range : null;
      for (const v of domain || []) {
        world._b.tick('abduce');
        const s2 = unify(t, v, s);
        if (s2) yield* finalise(hyp, s2);
      }
      return;
    }
    const wires = hyp.wires.map((h) => {
      const attrs = {};
      for (const k of Object.keys(h.attrs)) {
        const vals = h.attrs[k].map((v) => walk(v, s)).filter((v) => !hasVar(v));
        if (vals.length) attrs[k] = vals;
      }
      return { ...h, attrs };
    });
    yield { wires, fills: hyp.fills.map((f) => ({ id: f.id, key: f.key, value: walk(f.value, s) })) };
  }

  function* solve(todo, s, hyp, depth) { // each call ticks the budget
    world._b.tick('abduce');
    if (!todo.length) { yield* finalise(hyp, s); return; }
    const [g, ...rest] = todo;

    // (a) the goal is already a fact
    for (const t of world._candidates(g, s)) yield* solve(rest, t, hyp, depth);

    // (b) an existing wire would match if some of its open keys had the right value
    const idv = walk('?' + g.id, s);
    const pool = isVar(idv) ? world.ofType(g.type) : [world.get(idv)].filter((w) => w && c.isA(w.type, g.type));
    for (const w of pool) {
      let s2 = unify('?' + g.id, w.id, s);
      const fills = [];
      let reused = false;
      for (const key of Object.keys(g.attrs)) {
        for (const v of g.attrs[key]) {
          if (!s2) break;
          const t = walk(v, s2);
          const have = w.attrs[key];
          if (have) {
            let hit = null;
            for (const fv of have) if ((hit = unify(t, fv, s2))) break;
            s2 = hit;
          } else {
            const assumed = [...hyp.fills, ...fills].find((f) => f.id === w.id && f.key === key);
            if (assumed) { s2 = unify(t, assumed.value, s2); reused = true; } // already assumed for an earlier goal
            else if (!c.abducibleKeys.has(`${g.type}.${key}`) || (hasVar(t) && !isVar(t))) s2 = null;
            else fills.push({ id: w.id, key, value: t }); // a variable here is settled by a calc or by the slot's domain
          }
        }
      }
      if (s2 && (fills.length || reused) && size(hyp) + fills.length <= maxAssumptions) {
        yield* solve(rest, s2, { wires: hyp.wires, fills: [...hyp.fills, ...fills], calcs: hyp.calcs }, depth);
      }
    }
    if (!isVar(idv)) return; // bound to an existing wire: no new wire to assume or derive

    // (c) assume a new wire
    if (c.abducible.has(g.type) && size(hyp) < maxAssumptions) {
      const h = { id: `hyp${++n}`, type: g.type, attrs: {}, pattern: false };
      for (const k of Object.keys(g.attrs)) {
        h.attrs[k] = [...g.attrs[k]]; // values still unknown here may be settled by a calc; the rest are left out at the end
      }
      yield* solve(rest, unify('?' + g.id, h.id, s), { wires: [...hyp.wires, h], fills: hyp.fills, calcs: hyp.calcs }, depth);
    }

    // (d) derive it through a rule whose template has the same shape
    if (depth <= 0) return;
    for (const rule of c.rules) {
      for (const t of rule.then) {
        if (!c.isA(t.type, g.type)) continue; // a rule that produces a subtype also produces the goal
        const k = ++n;
        const tr = rename(t, k);
        let s2 = unify('?' + g.id, `~derived${k}`, s);
        s2 = s2 && unify('?' + tr.id, `~derived${k}`, s2);
        for (const key of Object.keys(g.attrs)) {
          for (const gv of g.attrs[key]) {
            if (!s2) break;
            let hit = null;
            for (const tv of tr.attrs[key] || []) if ((hit = unify(gv, tv, s2))) break;
            s2 = hit;
          }
        }
        if (!s2) continue;
        const calcs = rule.calc.filter((q) => !q.over).map((q) => equation(q, k));
        yield* solve([...rule.when.map((p) => rename(p, k)), ...rest], s2, calcs.length ? { ...hyp, calcs: [...hyp.calcs, ...calcs] } : hyp, depth - 1);
      }
    }
  }

  // collect, verify, keep the minimal ones, cheapest first
  const wireKey = (h) => format({ ...h, id: '_' }).replace(/\$hyp\d+/g, '$hyp');
  const fillKey = (f) => `${f.id}.${f.key}=${f.value}`;
  const seen = new Set();
  const cands = [];
  let raw = 0;
  for (const hyp of solve(goals, EMPTY, { wires: [], fills: [], calcs: [] }, maxDepth)) {
    if (++raw > maxCandidates) break;
    const parts = new Set([...hyp.wires.map(wireKey), ...hyp.fills.map(fillKey)]);
    const key = [...parts].sort().join('\n');
    if (seen.has(key)) continue;
    seen.add(key);
    const cost = hyp.wires.reduce((sum, h) => sum + (c.abducible.get(h.type) || 1), 0)
      + hyp.fills.reduce((sum, f) => sum + (c.abducibleKeys.get(`${world.get(f.id).type}.${f.key}`) || 1), 0);
    cands.push({ ...hyp, parts, cost });
  }
  cands.sort((a, b) => a.cost - b.cost || a.parts.size - b.parts.size);

  let out = [];
  for (const cand of cands) {
    world._b.tick('abduce');
    if (out.length >= max) break;
    if (out.some((o) => [...o.parts].every((p) => cand.parts.has(p)))) continue; // a smaller explanation exists
    const ok = world._trial(() => {
      if (cand.wires.length && !world._tell(cand.wires, { strict: false }).ok) return false;
      for (const f of cand.fills) if (!world._fill(f.id, f.key, f.value, { strict: false, via: 'core.assume' }).ok) return false;
      return world.holds(goalWires);
    });
    if (!ok) continue;
    out.push({
      assume: cand.wires.map(cloneWire),
      fills: cand.fills.map((f) => ({ ...f })),
      text: [...cand.wires.map((h) => format(h)), ...cand.fills.map(fillKey)].join('\n'),
      cost: cand.cost,
      parts: cand.parts,
    });
  }
  out = out.map(({ parts, ...e }) => e);
  if (world.options.rank) out = world.options.rank(out, { kind: 'explanation', world }) || out;
  return out;
}

/** Commit an explanation returned by abduce(). */
export function adopt(world, explanation) {
  const results = [];
  // what is adopted is a guess, and stays marked as one
  if (explanation.assume.length) results.push(world.tell(explanation.assume, { tier: 'guessed' }));
  for (const f of explanation.fills || []) results.push(world.fill(f.id, f.key, f.value, { tier: 'guessed' }));
  return { ok: results.every((r) => r.ok), results };
}
