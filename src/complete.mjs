// Completion: what is open, which values are still possible, what is forced,
// what must be asked. Mixed into World.prototype. The search itself is delegated to the
// solver strategy given to the world (see solve.mjs).

import { str, quote } from './parser.mjs';
import { Problem } from './solve.mjs';

const K = (type, key, value) => `${type}\u0001${key}\u0001${value}`;

export const completion = {
  /** Required keys that have no value yet: the world's open questions. */
  open(id) {
    const c = this._compiled();
    const out = [];
    const ws = id ? [this.get(id)].filter(Boolean) : this.wires.values();
    for (const w of ws) {
      for (const s of c.slots.get(w.type)?.values() || []) {
        if (s.required && !s.prefix && !w.attrs[s.key]) {
          out.push({ id: w.id, type: w.type, key: s.key, ask: s.ask ? str(s.ask) : undefined });
        }
      }
    }
    return out;
  },

  /** A slot is searchable when its values can be listed: enum, wires of a type, or a stepped range. */
  _closedDomain(s) { return !!(s.enum || s.type || s.range); },

  /** Candidate values a slot offers, before any consistency check. */
  _domain(s) {
    const cands = [];
    const push = (value, source) => { if (!cands.some((c) => c.value === value)) cands.push({ value, source }); };
    if (s.default !== undefined) push(s.default, 'default');
    for (const v of s.enum || []) push(v, 'enum');
    if (s.type) for (const x of this.byType.get(s.type) || []) push('$' + x, 'wire');
    for (const v of s.range || []) push(v, 'range');
    return cands;
  },

  /**
   * Is trying one value on its own a sound test? Not when a rule or a deny reads what is
   * absent (not=, core.absent=, a selector, an aggregate) or a state: a value refused
   * alone may be fine together with others.
   */
  _singles() {
    const c = this._compiled();
    return !c.negRules.length && !c.fluents.size && !c.denies.some((d) => d.not.length || d.selective);
  },

  /** Candidates that the world accepts on their own (one step ahead), where that test is sound. */
  _shallow(w, key) {
    const s = this._compiled().slots.get(w.type)?.get(key);
    if (!s) return [];
    if (!this._singles()) return this._domain(s);
    return this._domain(s).filter((c) => {
      this._b.tick('complete');
      return this._fill(w.id, key, c.value, { dry: true, strict: false, via: 'core.search' }).ok;
    });
  },

  /** The completion problem of the current state, built once per state. */
  _problem() {
    if (!this._pc || this._pc.stamp !== this.stamp) this._pc = new Problem(this);
    return this._pc;
  },

  _run(problem, { solver = this.options.solver, preset, budget = this.options.searchBudget } = {}) {
    if (problem.stamp !== this.stamp) throw new Error('sopworld: the world changed while it was being solved');
    try {
      const r = solver.solve(problem, { preset: preset || new Map(), ...(budget === undefined ? {} : { budget }) });
      r.solver = solver.name;
      // "no assignment works" is a proof only inside the finite part: where absence matters
      // and some open key has no list of values, an answer from outside could still save it
      if (r.status === 'unsat' && !problem.monotone && problem.free) { r.status = 'unknown'; r.reason = 'open keys without a closed domain remain, and the matrix reads what is absent'; }
      return r;
    } finally {
      problem.reset();
    }
  },

  /**
   * Values for wire.key that keep the world consistent, each tried in a scratch
   * transaction. With lookahead (default) a value is kept only if the other open keys with
   * a closed domain can still be completed together with it. Ordered: default first,
   * then most used; the `rank` option of the world can reorder them.
   */
  suggest(id, key, opts = {}) {
    return this._guard(opts, () => this._suggest(id, key, opts), (budget) => Object.assign([], { budget }));
  },

  _suggest(id, key, { deep = this.options.lookahead } = {}) {
    const w = this.get(id);
    if (!w) return [];
    let cands = this._shallow(w, key);
    if (deep && cands.length) {
      const problem = this._problem();
      const index = problem.indexOf(w.id, key);
      // a value that appears in a solution already found needs no search of its own
      const supported = problem.supported || (problem.supported = new Set());
      cands = cands.filter((c) => {
        this._b.tick('complete');
        if (index >= 0) {
          if (supported.has(`${index}\u0001${c.value}`)) return true;
          const r = this._run(problem, { preset: new Map([[index, c.value]]) });
          if (r.status === 'sat') for (const f of r.assignment) supported.add(`${problem.indexOf(f.id, f.key)}\u0001${f.value}`);
          return r.status !== 'unsat';
        }
        return this._trial(() => { // the key is not part of the search: apply it, then solve the rest
          if (!this._fill(w.id, key, c.value, { strict: false, via: 'core.search' }).ok) return !this._singles();
          return this._run(new Problem(this)).status !== 'unsat';
        });
      });
    }
    for (const c of cands) c.count = this.index.get(K(w.type, key, c.value))?.size || 0;
    cands.sort((a, b) => (b.source === 'default') - (a.source === 'default') || b.count - a.count);
    if (this.options.rank) cands = this.options.rank(cands, { kind: 'value', world: this, id: w.id, key }) || cands;
    return cands;
  },

  /**
   * Search for one joint assignment of every open key with a closed domain.
   * Returns { status: 'sat' | 'unsat' | 'unknown', assignment, stats, solver }.
   * 'unknown' means the solver's budget ran out. Changes nothing.
   */
  solveReport(opts = {}) {
    return this._guard(opts.limit ? { budget: opts.limit } : null, () => this._run(this._problem(), { solver: opts.solver, budget: opts.budget }),
      (v) => ({ status: 'unknown', stats: { budget: v }, solver: (opts.solver || this.options.solver).name }));
  },

  /** The assignment, or null when there is none. An exhausted budget returns an empty assignment. */
  solve(options) {
    const r = this.solveReport(options);
    return r.status === 'unsat' ? null : r.assignment || [];
  },

  /** Can the open closed-domain keys still be completed together? */
  satisfiable(options) { return this.solveReport(options).status !== 'unsat'; },

  /** solveReport() for solvers that answer asynchronously (a WebAssembly or remote solver). */
  async solveAsync({ solver = this.options.solver, budget = this.options.searchBudget } = {}) {
    // each synchronous part runs under a budget of its own; the waiting in between does not count
    const unknown = (v) => ({ status: 'unknown', stats: { budget: v }, solver: solver.name });
    const problem = this._guard(null, () => new Problem(this), () => null);
    if (!problem) return unknown(this._b.violation());
    if (!solver.solveAsync) return this._guard(null, () => this._run(problem, { solver, budget }), unknown);
    const verify = problem.verify.bind(problem);
    problem.verify = (values) => this._guard(null, () => verify(values), () => ({ ok: false, culprits: [], budget: true }));
    const r = await solver.solveAsync(problem, budget === undefined ? {} : { budget });
    r.solver = solver.name;
    return r;
  },

  /** Commit an assignment from solve(): all fills in one transaction. */
  apply(assignment, opts = {}) {
    return this._guard(opts, () => this._apply(assignment, opts), (v) => this._refusal(v));
  },

  _apply(assignment, { via = 'core.complete' } = {}) {
    // one patch: the values are judged together, not one after another
    return this._patch(assignment || [], { via, strict: false });
  },

  /**
   * What the world can say next about its open keys, without changing anything:
   *   fills      values that are forced (only one consistent value) or defaults
   *   questions  core.question wires for keys that need an outside answer
   *   dead       keys for which no consistent value exists
   */
  next(opts = {}) {
    return this._guard(opts, () => this._next(), (budget) => ({ fills: [], questions: [], dead: [], budget }));
  },

  _next() {
    const c = this._compiled();
    const out = { fills: [], questions: [], dead: [] };
    for (const o of this.open()) {
      const s = c.slots.get(o.type).get(o.key);
      const cands = this._suggest(o.id, o.key);
      const closedDomain = this._closedDomain(s);
      if (cands.length === 1 && closedDomain) {
        out.fills.push({ ...o, value: cands[0].value, kind: 'forced' });
      } else if (cands.length && cands[0].source === 'default') {
        out.fills.push({ ...o, value: cands[0].value, kind: 'default' });
      } else if (!cands.length && closedDomain) {
        out.dead.push(o);
      } else {
        const q = { id: `q_${o.id}_${o.key}`, type: 'core.question', pattern: false, attrs: { about: ['$' + o.id], seek: [o.key] } };
        if (cands.length) q.attrs.option = cands.map((x) => x.value);
        if (o.ask) q.attrs.text = [quote(o.ask)];
        out.questions.push(q);
      }
    }
    return out;
  },

  /**
   * Commit forced values until nothing more is forced (each fill can force others).
   * { defaults: true } also commits defaults, as revisable assumptions.
   * { choose: true } goes further and commits one full solution for the keys that are
   * still open with a closed domain, recorded as assumptions too.
   */
  complete(opts = {}) {
    return this._guard(opts, () => this._complete(opts), (budget) => ({ filled: [], questions: [], dead: [], pending: [], budget }));
  },

  _complete({ defaults = false, choose = false } = {}) {
    const filled = [];
    const mark = this._begin(true); // one transaction: out of budget, nothing of it stays
    try {
      const out = this._completing(filled, defaults, choose);
      this._commit();
      return out;
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
  },

  _completing(filled, defaults, choose) {
    for (;;) {
      this._b.tick('complete');
      const n = this._next();
      const f = n.fills.find((x) => x.kind === 'forced') || (defaults && n.fills.find((x) => x.kind === 'default'));
      if (!f) {
        if (choose && n.questions.length) {
          const picked = this.solve() || [];
          const r = picked.length ? this._apply(picked, { via: 'core.default' }) : { ok: false };
          if (r.ok) {
            filled.push(...picked.map((p) => ({ ...p, kind: 'chosen' })));
            choose = false;
            continue;
          }
        }
        return { filled, questions: n.questions, dead: n.dead, pending: n.fills };
      }
      const via = f.kind === 'forced' ? 'core.complete' : 'core.default';
      // where one value alone proves nothing, the forced values go in together
      const group = f.kind === 'forced' && !this._singles() ? n.fills.filter((x) => x.kind === 'forced') : [f];
      const r = this._patch(group, { via, strict: false });
      if (!r.ok) {
        if (!this._singles()) return { filled, questions: n.questions, dead: n.dead, pending: n.fills };
        return { filled, questions: n.questions, dead: [...n.dead, f], pending: [] };
      }
      const own = new Set(group.map((x) => `${x.id}\u0001${x.key}`));
      filled.push(...group.map((x) => ({ id: x.id, key: x.key, value: x.value, kind: x.kind })), ...r.filled.filter((x) => x.via !== via && !own.has(`${x.id}\u0001${x.key}`)));
    }
  },

  /** Answer a core.question wire produced by next() or complete(). */
  answer(question, value) {
    const about = question?.attrs?.about?.[0], seek = question?.attrs?.seek?.[0];
    if (!about || !seek) throw new Error('answer: expected a core.question wire with about= and seek=');
    return this.fill(about.slice(1), seek, value);
  },

  /**
   * One turn of a dialogue or one event from the environment: tell, then complete.
   * Returns the tell result extended with what was completed and what must be asked.
   */
  step(input, opts = {}) {
    const { defaults = true, choose = false, strict } = opts;
    return this._guard(opts, () => {
      const r = this.tell(input, strict === undefined ? {} : { strict });
      if (!r.ok) return { ...r, questions: [], dead: [], pending: [] };
      const c = this._complete({ defaults, choose });
      return { ...r, filled: [...r.filled, ...c.filled], questions: c.questions, dead: c.dead, pending: c.pending };
    }, (v) => ({ ...this._refusal(v), questions: [], dead: [], pending: [] }));
  },
};
