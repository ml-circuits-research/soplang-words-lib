// Completion as a finite-domain problem, and the solver strategies that search it.
//
// A Problem is the neutral form of "find values for the open keys":
//   variables   one per open key with a closed domain: { index, id, key, type, domain }
//   nogoods     combinations of values that the deny constraints rule out, found by
//               matching the denies once against all candidate values at the same time
//   oracle      the world itself: push/pop one value at a time, or verify a whole assignment
//
// A solver is a strategy: { name, solve(problem, { preset, budget }) } returning
// { status: 'sat' | 'unsat' | 'unknown', assignment?, stats }. The world is always the
// judge: whatever a solver proposes is accepted only after the oracle has verified it.
//
//   backtrack()   the minimal one. Chronological search, every step checked by the oracle.
//   cdcl()        the default: grounded nogoods handed to a built-in clause-learning SAT
//                 solver. Plain JavaScript, runs in Node and in browsers.
//   external()    hands the neutral problem to any outside solver and verifies its answers.
//   dimacs(), clingo()   external() with a SAT (DIMACS CNF) or ASP (clingo) encoding.

import { EMPTY, walk } from './unify.mjs';

const NOGOOD_CAP = 200000;

export class Problem {
  constructor(world) {
    this.world = world;
    this.stamp = world.stamp;
    this.stats = { oracle: 0 };
    this.variables = [];
    const c = world._compiled();
    // With negation, absence, selectors or states a violation may depend on what is not
    // there: no small cause can be named, and a value refused on its own may be fine with
    // others. Then nothing is judged before the assignment is whole.
    this.monotone = world._singles();
    for (const o of world.open()) {
      const slot = c.slots.get(o.type).get(o.key);
      if (!world._closedDomain(slot)) { this.free = (this.free || 0) + 1; continue; } // a key only an outside answer can fill
      const domain = world._shallow(world.wires.get(o.id), o.key).map((x) => x.value);
      this.variables.push({ index: this.variables.length, id: o.id, key: o.key, type: o.type, domain });
    }
    this._byWire = new Map();
    for (const v of this.variables) (this._byWire.get(v.id) || this._byWire.set(v.id, []).get(v.id)).push(v.index);
    this._marks = [];
    this._assigned = [];
    this._nogoods = null;
  }

  indexOf(id, key) {
    const v = this.variables.find((x) => x.id === id && x.key === key);
    return v ? v.index : -1;
  }

  /** Static nogoods: arrays of { v: variable index, value }. Computed once, on demand. */
  get nogoods() { return this._nogoods || (this._nogoods = ground(this)); }

  /** Variables whose values took part in a refusal. Falls back to all assigned ones. */
  _culprits(violations, assigned) {
    if (!this.monotone) return assigned;
    const out = new Set();
    for (const v of violations) {
      if (!v.closure) return assigned;
      for (const id of v.closure) for (const i of this._byWire.get(id) || []) if (assigned.includes(i)) out.add(i);
    }
    return out.size ? [...out] : assigned;
  }

  /** Apply one value on top of the values already pushed. Stays applied when ok. */
  push(index, value) {
    const w = this.world, v = this.variables[index];
    const mark = w._begin();
    this.stats.oracle++;
    const r = w._fill(v.id, v.key, value, { strict: false, via: 'core.search' });
    if (!r.ok) {
      w._rollback(mark);
      return { ok: false, culprits: this._culprits(r.violations, [...this._assigned, index]) };
    }
    this._marks.push(mark);
    this._assigned.push(index);
    return { ok: true };
  }

  pop() {
    this.world._rollback(this._marks.pop());
    this._assigned.pop();
  }

  reset() { while (this._marks.length) this.pop(); } // bounded: one pop per pushed value

  /** Check a whole assignment (values by variable index; undefined = leave open) as one patch. Changes nothing. */
  verify(values) {
    const assigned = [];
    for (let i = 0; i < values.length; i++) if (values[i] !== undefined) assigned.push(i);
    this.stats.oracle++;
    const r = this.world._patch(assigned.map((i) => ({ id: this.variables[i].id, key: this.variables[i].key, value: values[i] })), { dry: true, strict: false, via: 'core.search' });
    return r.ok ? { ok: true } : { ok: false, culprits: this._culprits(r.violations, assigned) };
  }

  toAssignment(values) {
    return this.variables.filter((v) => values[v.index] !== undefined).map((v) => ({ id: v.id, key: v.key, value: values[v.index] }));
  }

  /** The problem without the world: plain data for an outside solver. */
  toJSON() {
    return {
      variables: this.variables.map((v) => ({ index: v.index, name: `${v.id}.${v.key}`, domain: [...v.domain] })),
      nogoods: this.nogoods.map((n) => n.map((l) => ({ ...l }))),
    };
  }
}

/**
 * Ground the deny constraints. Every candidate value of every variable is put on its wire
 * at once; each match of a deny then names the values it used, and that set is a nogood.
 * Denies with negation are left to the oracle.
 */
function ground(problem) {
  const w = problem.world, c = w._compiled();
  const out = [];
  if (!problem.variables.length) return out;
  const seen = new Set();
  problem.nogoodsComplete = true;
  w._trial(() => {
    const tags = new Map(); // wire id -> key -> value -> variable index
    for (const v of problem.variables) {
      const wire = w.wires.get(v.id);
      const keys = tags.get(v.id) || tags.set(v.id, new Map()).get(v.id);
      const vals = new Map();
      keys.set(v.key, vals);
      for (const value of v.domain) {
        vals.set(value, v.index);
        (wire.attrs[v.key] ||= []).push(value);
        w._link(wire, v.key, value);
        w._do(() => {
          wire.attrs[v.key].pop();
          if (!wire.attrs[v.key].length) delete wire.attrs[v.key];
          w._unlink(wire, v.key, value, false);
        });
      }
    }
    const done = new Set();
    for (const v of problem.variables) {
      if (done.has(v.id)) continue;
      done.add(v.id);
      const wire = w.wires.get(v.id);
      for (const { rule: d, idx } of c.forType(c.denyByType, wire.type)) {
        if (d.not.length || d.selective) continue;
        for (const s0 of w._matchWire(d.when[idx], wire, EMPTY)) {
          for (const s of w._bodies(d, s0, idx)) {
            w._b.tick('ground');
            const lits = new Map();
            let consistent = true;
            for (const p of d.when) {
              const keys = tags.get(walk('?' + p.id, s));
              if (!keys) continue;
              for (const k of Object.keys(p.attrs)) {
                const vals = keys.get(k);
                if (!vals) continue;
                for (const pv of p.attrs[k]) {
                  const value = walk(pv, s);
                  const i = vals.get(value);
                  if (i === undefined) continue;
                  if (lits.has(i) && lits.get(i) !== value) consistent = false;
                  lits.set(i, value);
                }
              }
            }
            if (!consistent || !lits.size) continue;
            const ng = [...lits].sort((a, b) => a[0] - b[0]).map(([i, value]) => ({ v: i, value }));
            const key = ng.map((l) => `${l.v}=${l.value}`).join('&');
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(ng);
            if (out.length >= NOGOOD_CAP) { problem.nogoodsComplete = false; return; }
          }
        }
      }
    }
  });
  return out;
}

const result = (problem, status, values, stats) => ({
  status,
  assignment: status === 'sat' ? problem.toAssignment(values) : undefined,
  stats: { ...stats, oracle: problem.stats.oracle, variables: problem.variables.length },
});

// ----------------------------------------------------------------------------- backtrack

/** Minimal solver: depth-first, smallest live domain first, every step checked by the world. */
export function backtrack() {
  return {
    name: 'backtrack',
    solve(problem, { preset = new Map(), budget = 2000 } = {}) {
      const n = problem.variables.length;
      const values = new Array(n).fill(undefined);
      let nodes = 0, exhausted = false;
      if (!problem.monotone) { // no step can be judged alone: enumerate, and let the world judge whole assignments
        for (const [i, value] of preset) {
          if (!problem.variables[i].domain.includes(value)) return result(problem, 'unsat', values, { nodes });
          values[i] = value;
        }
        const broken = () => problem.nogoods.some((ng) => ng.every((l) => values[l.v] === l.value));
        const all = (i) => { // each call ticks the budget
          problem.world._b.tick('solve');
          if (i === n) return problem.verify(values).ok;
          if (values[i] !== undefined) return all(i + 1);
          for (const value of problem.variables[i].domain) {
            if (++nodes > budget) { exhausted = true; return true; }
            values[i] = value;
            if (!broken() && all(i + 1)) return true;
            values[i] = undefined;
          }
          return false;
        };
        const found = !broken() && all(0);
        return result(problem, exhausted ? 'unknown' : found ? 'sat' : 'unsat', exhausted ? [] : values, { nodes });
      }
      const live = (i) => problem.variables[i].domain.filter((value) => {
        const r = problem.push(i, value);
        if (r.ok) problem.pop();
        return r.ok;
      });
      const search = () => { // each call ticks the budget
        problem.world._b.tick('solve');
        let best = -1, cands = null;
        for (let i = 0; i < n; i++) {
          if (values[i] !== undefined) continue;
          const c = live(i);
          if (!c.length) return false;
          if (!cands || c.length < cands.length) { best = i; cands = c; }
          if (c.length === 1) break;
        }
        if (best < 0) return true;
        for (const value of cands) {
          if (++nodes > budget) { exhausted = true; return true; }
          if (!problem.push(best, value).ok) continue;
          values[best] = value;
          if (search()) { problem.pop(); return true; }
          values[best] = undefined;
          problem.pop();
        }
        return false;
      };
      try {
        for (const [i, value] of preset) {
          if (!problem.push(i, value).ok) return result(problem, 'unsat', values, { nodes });
          values[i] = value;
        }
        const found = search();
        return result(problem, exhausted ? 'unknown' : found ? 'sat' : 'unsat', values, { nodes });
      } finally {
        problem.reset();
      }
    },
  };
}

// ----------------------------------------------------------------------------- cdcl

/**
 * A conflict-driven clause-learning SAT solver, small and dependency-free: two watched
 * literals, first-UIP learning with clause minimisation, activity-based decisions, phase
 * saving, Luby restarts, and periodic removal of the learnt clauses that helped least.
 * Literals are signed integers: v is "variable v is true", -v is "variable v is false".
 */
export class Sat {
  constructor(n) {
    this.n = n;
    this.val = new Int8Array(n + 1);          // 0 unassigned, 1 true, -1 false
    this.level = new Int32Array(n + 1);
    this.reason = new Array(n + 1).fill(null);
    this.activity = new Float64Array(n + 1);
    this.phase = new Int8Array(n + 1).fill(1);
    this.seen = new Uint8Array(n + 1);
    this.watches = Array.from({ length: 2 * n + 2 }, () => []);
    this.trail = [];
    this.lim = [];
    this.qhead = 0;
    this.inc = 1;
    this.ok = true;
    this.conflicts = 0;
    this.decisions = 0;
    this.learned = 0;
    this.learnts = [];
    this.keep = 4000; // learnt clauses kept before the database is reduced
  }

  value(lit) { return lit > 0 ? this.val[lit] : -this.val[-lit]; }
  _w(lit) { return lit > 0 ? 2 * lit : -2 * lit + 1; }

  _enqueue(lit, reason) {
    const v = lit > 0 ? lit : -lit;
    this.val[v] = lit > 0 ? 1 : -1;
    this.level[v] = this.lim.length;
    this.reason[v] = reason;
    this.trail.push(lit);
  }

  /** Add a clause. Only between searches (the solver is at decision level 0). */
  addClause(lits) {
    if (!this.ok) return false;
    const c = [];
    for (const l of new Set(lits)) {
      const v = this.value(l);
      if (v === 1 || lits.includes(-l)) return true; // already satisfied, or a tautology
      if (v === 0) c.push(l);
    }
    if (!c.length) return (this.ok = false);
    if (c.length === 1) { this._enqueue(c[0], null); return (this.ok = this._propagate() === null); }
    this.watches[this._w(c[0])].push(c);
    this.watches[this._w(c[1])].push(c);
    return true;
  }

  _propagate() {
    while (this.qhead < this.trail.length) { // bounded: each literal of the trail is visited once
      if (this.tick) this.tick();
      const f = -this.trail[this.qhead++]; // this literal has just become false
      const ws = this.watches[this._w(f)];
      let j = 0;
      for (let i = 0; i < ws.length; i++) {
        const c = ws[i];
        if (c.dead) continue; // removed from the database: drop the watch
        if (c[0] === f) { c[0] = c[1]; c[1] = f; }
        const first = c[0];
        if (this.value(first) === 1) { ws[j++] = c; continue; }
        let moved = false;
        for (let k = 2; k < c.length; k++) {
          if (this.value(c[k]) !== -1) {
            c[1] = c[k]; c[k] = f;
            this.watches[this._w(c[1])].push(c);
            moved = true;
            break;
          }
        }
        if (moved) continue;
        ws[j++] = c;
        if (this.value(first) === -1) {
          for (i++; i < ws.length; i++) ws[j++] = ws[i];
          ws.length = j;
          this.qhead = this.trail.length;
          return c;
        }
        this._enqueue(first, c);
      }
      ws.length = j;
    }
    return null;
  }

  _bump(v) {
    if ((this.activity[v] += this.inc) > 1e100) {
      for (let i = 1; i <= this.n; i++) this.activity[i] *= 1e-100;
      this.inc *= 1e-100;
    }
  }

  _cancel(level) {
    if (this.lim.length <= level) return;
    const to = this.lim[level];
    while (this.trail.length > to) { // bounded: the trail above that level
      const lit = this.trail.pop();
      const v = lit > 0 ? lit : -lit;
      this.phase[v] = this.val[v];
      this.val[v] = 0;
      this.reason[v] = null;
    }
    this.qhead = to;
    this.lim.length = level;
  }

  /** First unique implication point: the learnt clause and the level to return to. */
  _analyze(conflict) {
    const learnt = [0];
    const current = this.lim.length;
    let open = 0, p = 0, index = this.trail.length - 1, c = conflict;
    do { // bounded: walks the trail of the current level once
      for (const q of c) {
        if (q === p) continue;
        const v = q > 0 ? q : -q;
        if (this.seen[v] || this.level[v] === 0) continue;
        this.seen[v] = 1;
        this._bump(v);
        if (this.level[v] >= current) open++; else learnt.push(q);
      }
      while (!this.seen[Math.abs(this.trail[index])]) index--; // bounded: by the trail
      p = this.trail[index--];
      c = this.reason[Math.abs(p)];
      this.seen[Math.abs(p)] = 0;
      open--;
    } while (open > 0); // bounded: see the head of the loop
    learnt[0] = -p;
    // minimise: a literal is redundant when every other literal of its reason is already in the clause
    let size = 1;
    for (let k = 1; k < learnt.length; k++) {
      const r = this.reason[Math.abs(learnt[k])];
      let needed = !r;
      if (r) for (const q of r) {
        const v = q > 0 ? q : -q;
        if (v !== Math.abs(learnt[k]) && !this.seen[v] && this.level[v] > 0) { needed = true; break; }
      }
      if (needed) learnt[size++] = learnt[k]; else this.seen[Math.abs(learnt[k])] = 2; // cleared below
    }
    for (let k = 1; k < learnt.length; k++) this.seen[Math.abs(learnt[k])] = 0;
    learnt.length = size;
    let back = 0;
    const levels = new Set([current]);
    for (let k = 1; k < learnt.length; k++) {
      const lv = this.level[Math.abs(learnt[k])];
      levels.add(lv);
      if (lv > back) { back = lv; const t = learnt[1]; learnt[1] = learnt[k]; learnt[k] = t; }
    }
    learnt.lbd = levels.size; // how many decision levels the clause spans: lower is better
    return { learnt, back };
  }

  /** true: satisfiable (see model()); false: unsatisfiable; null: the conflict budget ran out. */
  solve(budget = Infinity) {
    if (!this.ok) return false;
    this._cancel(0);
    const luby = (i) => { // 1 1 2 1 1 2 4 ...
      let size = 1, seq = 0;
      while (size < i + 1) { seq++; size = 2 * size + 1; } // bounded: logarithmic in i
      while (size - 1 !== i) { size = (size - 1) >> 1; seq--; i %= size; } // bounded: logarithmic in i
      return 2 ** seq;
    };
    let restarts = 0, since = 0, limit = 100;
    const stop = this.conflicts + budget;
    for (;;) {
      if (this.tick) this.tick();
      const conflict = this._propagate();
      if (conflict) {
        this.conflicts++;
        if (!this.lim.length) return (this.ok = false);
        const { learnt, back } = this._analyze(conflict);
        this._cancel(back);
        this.learned++;
        if (learnt.length === 1) this._enqueue(learnt[0], null);
        else {
          this.watches[this._w(learnt[0])].push(learnt);
          this.watches[this._w(learnt[1])].push(learnt);
          this._enqueue(learnt[0], learnt);
          if (learnt.length > 2) this.learnts.push(learnt);
        }
        this.inc /= 0.95;
        if (this.conflicts >= stop) { this._cancel(0); return null; }
        if (++since >= limit) {
          since = 0; limit = 100 * luby(++restarts);
          this._cancel(0);
          if (this.learnts.length > this.keep) this._reduce();
        }
      } else {
        let v = 0, best = -1;
        for (let i = 1; i <= this.n; i++) if (this.val[i] === 0 && this.activity[i] > best) { best = this.activity[i]; v = i; }
        if (!v) return true;
        this.decisions++;
        this.lim.push(this.trail.length);
        this._enqueue(this.phase[v] >= 0 ? v : -v, null);
      }
    }
  }

  /** Forget the half of the learnt clauses that span the most decision levels. At level 0 only. */
  _reduce() {
    this.learnts.sort((a, b) => a.lbd - b.lbd || a.length - b.length);
    const kept = this.learnts.slice(0, this.learnts.length >> 1);
    for (const c of this.learnts.slice(this.learnts.length >> 1)) {
      if (c.lbd <= 2) kept.push(c); else c.dead = true;
    }
    this.learnts = kept;
    this.keep = Math.floor(this.keep * 1.1);
  }

  model() { return Array.from(this.val, (x) => x === 1); }
}

/**
 * The stronger built-in solver. The grounded nogoods and "exactly one value per key"
 * become clauses for the SAT solver above; the world verifies each complete answer, and a
 * refusal comes back as one more clause. Plain JavaScript: runs in Node and in browsers.
 */
export function cdcl() {
  return {
    name: 'cdcl',
    solve(problem, { preset = new Map(), budget = 30000 } = {}) {
      const vars = problem.variables;
      const lit = [];
      let n = 0;
      for (const v of vars) lit[v.index] = v.domain.map(() => ++n);
      const aux = [];
      for (const v of vars) aux[v.index] = v.domain.length > 8 ? v.domain.slice(1).map(() => ++n) : null;
      const sat = new Sat(n);
      sat.tick = () => problem.world._b.tick('solve');
      for (const v of vars) {
        const x = lit[v.index], s = aux[v.index];
        sat.addClause(x); // at least one value
        if (!s) { // at most one, pairwise
          for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) sat.addClause([-x[i], -x[j]]);
        } else { // at most one, sequential counter: s[i] means "one of x[0..i] is chosen"
          for (let i = 0; i < x.length - 1; i++) {
            sat.addClause([-x[i], s[i]]);
            if (i > 0) { sat.addClause([-s[i - 1], s[i]]); sat.addClause([-x[i], -s[i - 1]]); }
          }
          sat.addClause([-x[x.length - 1], -s[x.length - 2]]);
        }
      }
      const of = (i, value) => lit[i][vars[i].domain.indexOf(value)];
      for (const ng of problem.nogoods) sat.addClause(ng.map((l) => -of(l.v, l.value)));
      for (const [i, value] of preset) {
        const x = of(i, value);
        if (x === undefined) { sat.ok = false; break; }
        sat.addClause([x]);
      }
      const stats = () => ({ conflicts: sat.conflicts, decisions: sat.decisions, nogoods: problem.nogoods.length, learned: sat.learned, booleans: n });
      let left = budget;
      for (;;) {
        problem.world._b.tick('solve');
        const before = sat.conflicts;
        const r = sat.solve(left);
        left -= sat.conflicts - before;
        if (r === false) return result(problem, 'unsat', [], stats());
        if (r === null) return result(problem, 'unknown', [], stats());
        const m = sat.model();
        const values = vars.map((v) => v.domain[lit[v.index].findIndex((x) => m[x])]);
        const checked = problem.verify(values);
        if (checked.ok) return result(problem, 'sat', values, stats());
        sat._cancel(0);
        sat.addClause(checked.culprits.map((i) => -of(i, values[i])));
      }
    },
  };
}

// ----------------------------------------------------------------------------- external

/**
 * Use any outside solver. `run(data)` receives { variables: [{ index, name, domain }],
 * nogoods: [[{ v, value }]], preset: [{ v, value }] } and returns the chosen value per
 * variable (array by index), or null when there is none. It may return a promise, in
 * which case use world.solveAsync(). Every answer is verified by the world; a refused
 * answer becomes one more nogood and the solver is asked again.
 */
export function external({ name = 'external', run, maxRounds = 1000 }) {
  const encode = (problem, preset, extra) => {
    const data = problem.toJSON();
    data.nogoods.push(...extra);
    data.preset = [...preset].map(([v, value]) => ({ v, value }));
    return data;
  };
  const judge = (problem, values, extra) => {
    if (!values) return result(problem, 'unsat', [], { rounds: extra.length + 1 });
    const r = problem.verify(values);
    if (r.ok) return result(problem, 'sat', values, { rounds: extra.length + 1 });
    extra.push(r.culprits.map((i) => ({ v: i, value: values[i] })));
    return null;
  };
  return {
    name,
    solve(problem, { preset = new Map() } = {}) {
      const extra = [];
      for (let round = 0; round < maxRounds; round++) {
        problem.world._b.tick('solve');
        const values = run(encode(problem, preset, extra));
        if (values && typeof values.then === 'function') throw new Error(`${name}: this solver is asynchronous, call world.solveAsync()`);
        const done = judge(problem, values, extra);
        if (done) return done;
      }
      return result(problem, 'unknown', [], { rounds: maxRounds });
    },
    async solveAsync(problem, { preset = new Map() } = {}) {
      const extra = [];
      for (let round = 0; round < maxRounds; round++) {
        const done = judge(problem, await run(encode(problem, preset, extra)), extra);
        if (done) return done;
      }
      return result(problem, 'unknown', [], { rounds: maxRounds });
    },
  };
}

/** DIMACS CNF text for a problem in neutral form, and the literal numbering used. */
export function toDimacs(data) {
  const lit = [];
  let next = 1;
  for (const v of data.variables) lit[v.index] = v.domain.map(() => next++);
  const clauses = [];
  for (const v of data.variables) {
    const ls = lit[v.index];
    clauses.push(ls);
    for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) clauses.push([-ls[i], -ls[j]]);
  }
  const of = (l) => lit[l.v][data.variables[l.v].domain.indexOf(l.value)];
  for (const ng of data.nogoods) clauses.push(ng.map((l) => -of(l)));
  for (const p of data.preset || []) clauses.push([of(p)]);
  return { text: `p cnf ${next - 1} ${clauses.length}\n${clauses.map((c) => c.join(' ') + ' 0').join('\n')}\n`, lit };
}

/** SAT solver through DIMACS. `exec(cnfText)` returns the solver's output ("s SATISFIABLE", "v 1 -2 ... 0"). */
export function dimacs({ exec, name = 'dimacs' }) {
  const decode = (data, lit, output) => {
    if (!/^s SATISFIABLE/m.test(output)) return null;
    const on = new Set();
    for (const line of output.split('\n')) if (line.startsWith('v ')) for (const t of line.slice(2).trim().split(/\s+/)) if (Number(t) > 0) on.add(Number(t));
    return data.variables.map((v) => v.domain[lit[v.index].findIndex((l) => on.has(l))]);
  };
  return external({
    name,
    run(data) {
      const { text, lit } = toDimacs(data);
      const output = exec(text);
      return output && typeof output.then === 'function' ? output.then((o) => decode(data, lit, o)) : decode(data, lit, output);
    },
  });
}

/** Answer set program for a problem in neutral form: a(variable, value index). */
export function toASP(data) {
  const lines = [];
  for (const v of data.variables) lines.push(`1 { ${v.domain.map((_, j) => `a(${v.index},${j})`).join('; ')} } 1.`);
  const of = (l) => `a(${l.v},${data.variables[l.v].domain.indexOf(l.value)})`;
  for (const ng of data.nogoods) lines.push(`:- ${ng.map(of).join(', ')}.`);
  for (const p of data.preset || []) lines.push(`${of(p)}.`);
  lines.push('#show a/2.');
  return lines.join('\n') + '\n';
}

/** clingo. `exec(programText)` returns clingo's standard output (text mode). */
export function clingo({ exec, name = 'clingo' }) {
  const decode = (data, output) => {
    if (/UNSATISFIABLE/.test(output) || !/SATISFIABLE/.test(output)) return null;
    const values = new Array(data.variables.length).fill(undefined);
    const answer = output.split('\n').filter((l) => /^a\(/.test(l.trim())).pop() || '';
    for (const m of answer.matchAll(/a\((\d+),(\d+)\)/g)) values[Number(m[1])] = data.variables[Number(m[1])].domain[Number(m[2])];
    return values;
  };
  return external({
    name,
    run(data) {
      const output = exec(toASP(data));
      return output && typeof output.then === 'function' ? output.then((o) => decode(data, o)) : decode(data, output);
    },
  });
}

export const solvers = { backtrack, cdcl, external, dimacs, clingo };
