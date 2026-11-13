// Queries with a status, answers as wires, producers and actions. Mixed into World.prototype.
//
//   world.query({ type, seek, where, about, mode })   or a question wire of the same shape
//     -> { status, value | values, from, via, missing, alternatives, wires }
//   statuses: supported (one value), conflicting (several, listed), missing (none; names
//   the open key and its question), refused (the thing asked about cannot exist; the
//   violations say why), no / unknown (existence, for a complete / an open type)
//
// When no wire matches a question whose constraints are all values, the world supposes
// one: a wire of that type with those keys is told in a scratch transaction, the rules
// run, the answer is read, and everything is undone. So "what is the change from 20 for
// a ball?" is answered by the same rules that would complete a told purchase.
//
// A function registered with the world can be declared as a producer of a key
// (core.producer), tried when no wire has the value, or as an action (core.action), run
// inside one transaction by world.act().
//
// The wire types and key names used for questions, answers and requests are a vocabulary
// that the host can change: new World({ vocabulary: { status: 'core.status', ... } }).

import { parse, str, cloneWire } from './parser.mjs';
import { abduce } from './abduce.mjs';
import { rank, RANKING, vetoOf } from './rank.mjs';
import { EMPTY, walk, unify, hasVar } from './unify.mjs';

const VOCABULARY = {
  question: 'core.question', // wire type of a question
  answer: 'core.answer',     // wire type of a recorded answer
  request: 'core.request',   // wire type of a request for an action
  type: 'type', seek: 'seek', about: 'about', mode: 'mode',
  where: 'where.',           // prefix of the constraint keys of a question
  action: 'action', arg: 'arg.', // the action name and the prefix of its arguments
  to: 'to', value: 'value', status: 'status', via: 'core.via', from: 'core.from',
};
const first = (w, k) => w.attrs[k]?.[0];

export const querying = {
  _vocab() { return this._v || (this._v = { ...VOCABULARY, ...this.options.vocabulary }); },

  /** A question as plain data, from an object, a wire, the id of a told wire, or SOP Lang text. */
  _question(q) {
    const v = this._vocab();
    let w = q;
    if (typeof q === 'string') w = this.get(q) || parse(q)[0];
    if (!w || typeof w !== 'object') throw new Error('query: expected a question');
    if (!w.attrs) return { mode: 'value', where: {}, ...w, about: w.about ? String(w.about).replace(/^\$/, '') : undefined };
    const where = {};
    for (const k of Object.keys(w.attrs)) if (k.startsWith(v.where)) where[k.slice(v.where.length)] = w.attrs[k][0];
    const about = first(w, v.about);
    const absent = w.attrs['core.absent']; // the pattern modifier: keys the wire must not have
    return { id: this.has(w.id) ? this.resolve(w.id) : undefined, type: first(w, v.type), seek: first(w, v.seek), where, ...(absent ? { absent: [...absent] } : {}), about: about ? about.replace(/^\$/, '') : undefined, mode: first(w, v.mode) || 'value' };
  },

  /** What a registered function sees of the world. */
  /**
   * An action written as wires. The parameters are variables; the patterns read the
   * state; calcs compute; every check must hold (the guard); then all writes are applied
   * as one patch. Every expression was evaluated on the state before the action.
   */
  /**
   * Score candidate readings against the world, telling nothing. A candidate is
   *   { wires }      a statement (SOP text or wires), with `$name` for a referent
   *   { refer }      referents by description: { name: { type, where } }
   *   { action, args }  a request
   *   { question }   a question (as for query)
   * (one candidate may have several). For each it returns: ok and violations (the world
   * with it applied), referents with the ids they resolve to and whether that is unique,
   * lacks (required keys or arguments missing), assumes (defaults it would rest on),
   * action ({ available, status, missing }), answer (for a question), and `order`, the
   * candidates best first by `rank` (src/rank.mjs): consistent, then fewer referents left
   * ambiguous (a referent is settled when unique by its description, or when only one of
   * them fits the world: `fits`), then fewer lacks, then fewer assumptions, then fewer
   * words left out (from interpret's `unused` and `unresolved`), then as given. Each
   * scored candidate has `place` and `why` (and `lostTo`, `on` when it lost). Options:
   * `criteria` (default RANKING). A referent nothing matches lacks; it is left out of the
   * statement rather than counted as wrong.
   */
  score(candidates, opts = {}) {
    return this._guard(opts, () => {
      const list = [].concat(candidates || []);
      const scored = list.map((cand, index) => this._scoreOne(cand, index));
      const { order, ranked } = rank(scored, opts.criteria || RANKING);
      scored.forEach((r, i) => Object.assign(r, { place: ranked[i].place, why: ranked[i].why }, ranked[i].on ? { lostTo: ranked[i].lostTo, on: ranked[i].on } : ranked[i].lostTo !== undefined ? { lostTo: ranked[i].lostTo } : {}));
      return { candidates: scored, order };
    }, (v) => ({ candidates: [], order: [], budget: v }));
  },

  /** Answer with the top reading, or not: veto(result, options) from src/rank.mjs. */
  veto(result, opts = {}) {
    return vetoOf(result, opts);
  },

  _scoreOne(cand, index, keep = false) {
    if (cand.parts) return this._scoreParts(cand, index);
    const out = { index, ok: true, violations: [], referents: [], lacks: [], assumes: [] };
    if (cand.unused || cand.unresolved) out.words = { used: cand.used || [], unused: cand.unused || [], unresolved: cand.unresolved || [] };
    const read = (cand.assumes || []).filter((a) => a.word !== undefined); // words read as near known ones
    const options = {}; // referent -> the ids it may be
    for (const [name, d] of Object.entries(cand.refer || {})) {
      const ids = this._matching({ type: d.type, where: d.where || {}, absent: d.absent, ns: d.ns }).map((w) => w.id).filter((id) => !d.not?.includes(id));
      out.referents.push({ name, ids, unique: ids.length === 1 });
      if (!ids.length) out.lacks.push({ referent: name, type: d.type });
      else options[name] = ids.slice(0, 20);
    }
    // every way of choosing the referents that are not unique (at most 50): which fit the world
    let combos = [{}];
    for (const [name, ids] of Object.entries(options)) {
      combos = combos.flatMap((c) => ids.map((id) => ({ ...c, [name]: id }))).slice(0, 50);
    }
    const missing = new Set(out.lacks.filter((l) => l.referent).map((l) => '$' + l.referent));
    let first = null;
    const fitting = [];
    for (const bind of combos) { // bounded: at most 50 choices
      const r = this._scoreWith(cand, bind, missing);
      if (!first) first = r;
      if (r.ok) fitting.push({ bind, r });
    }
    const best = fitting[0]?.r || first;
    if (keep) this._scoreWith(cand, fitting[0]?.bind || combos[0], missing, true); // a part of a message: later parts see it
    Object.assign(out, { ok: best.ok, violations: best.violations, lacks: [...out.lacks, ...best.lacks], assumes: [...read, ...best.assumes] });
    if (best.action) out.action = best.action;
    if (best.answer) out.answer = best.answer;
    out.judged = !!best.judgedBy;
    out.judgedBy = best.judgedBy || null;
    if (best.checks) out.checks = best.checks;
    // a referent the description left open may be settled by what fits the world
    for (const ref of out.referents) {
      if (ref.unique || !ref.ids.length) continue;
      ref.fits = [...new Set(fitting.map((f) => f.bind[ref.name]))];
    }
    return out;
  },

  /**
   * A message read as several parts (a split from interpret): the parts in order, each
   * judged on the world with the parts before it applied (the best choice of each), all
   * in one transaction that is undone. The whole is consistent when every part is; lacks,
   * assumptions, referents and violations are those of the parts (each marked `part`).
   */
  _scoreParts(cand, index) {
    const out = { index, ok: true, violations: [], referents: [], lacks: [], assumes: [], parts: [] };
    if (cand.split !== undefined) out.split = cand.split;
    if (cand.unused || cand.unresolved) out.words = { used: cand.used || [], unused: cand.unused || [], unresolved: cand.unresolved || [] };
    this._trial(() => {
      cand.parts.forEach((p, part) => { // bounded: the parts of one message
        if (p.unread) { out.parts.push({ index: part, unread: true, ok: true, judged: false, judgedBy: null, violations: [], referents: [], lacks: [], assumes: [] }); return; } // a frame interpret could not read: its words are in the message's unresolved
        const r = this._scoreOne(p, part, true);
        delete r.words;
        out.parts.push(r);
        out.ok &&= r.ok;
        out.violations.push(...r.violations.map((v) => ({ ...v, part })));
        out.referents.push(...r.referents.map((x) => ({ ...x, part })));
        out.lacks.push(...r.lacks.map((x) => ({ ...x, part })));
        out.assumes.push(...r.assumes.map((x) => ({ ...x, part })));
      });
    });
    out.judged = out.parts.every((p) => p.judged);
    out.judgedBy = out.judged ? 'parts' : null;
    return out;
  },

  /** One choice of referents, tried in a transaction that is undone (or kept, inside a message's trial). */
  _scoreWith(cand, bind, missing, keep = false) {
    // an overlay: a declared function that is not pure is not called, and refuses the reading
    const [out, impure] = this._asOverlay(() => this._scoreBody(cand, bind, missing, keep));
    if (impure) { out.ok = false; out.violations.push({ kind: 'impure', fn: impure, why: `${impure} is not declared pure=true, so it does not run on a reading that is only tried` }); }
    return out;
  },

  _scoreBody(cand, bind, missing, keep) {
    const out = { ok: true, violations: [], lacks: [], assumes: [] };
    const sub = (v) => (v[0] === '$' && bind[v.slice(1)] ? '$' + bind[v.slice(1)] : v);
    (keep ? (f) => f() : (f) => this._trial(f))(() => {
      if (cand.wires) {
        // a referent that nothing matched is left out of the statement: it lacks, it is not wrong
        const ws = (typeof cand.wires === 'string' ? parse(cand.wires) : cand.wires).map((w) => ({ ...w, attrs: Object.fromEntries(Object.entries(w.attrs).map(([k, vs]) => [k, vs.filter((v) => !missing.has(v)).map(sub)]).filter(([, vs]) => vs.length)) }));
        const r = this._tell(ws, { strict: false, ns: cand.ns });
        out.judgedBy = 'statement';
        out.ok = r.ok;
        out.violations = r.violations;
        if (r.ok) {
          const mine = new Set([...r.added, ...r.merged.map((m) => m.into)]);
          out.lacks.push(...[...mine].flatMap((id) => this.open(id)).map((o) => ({ id: o.id, key: o.key, ask: o.ask })));
          out.assumes.push(...this._next().fills.filter((f) => mine.has(f.id) && f.kind === 'default').map((f) => ({ id: f.id, key: f.key, value: f.value })));
        }
      }
      if (cand.revise) { // a follow-up that changes a wire already told
        const values = Object.fromEntries(Object.entries(cand.revise.values || {}).filter(([, v]) => !missing.has(v)).map(([k, v]) => [k, sub(v)]));
        const r = this.revise(cand.revise.id, values);
        out.judgedBy = 'statement';
        out.ok = r.ok;
        out.violations = r.violations || [];
      }
      if (cand.action) {
        const args = Object.fromEntries(Object.entries(cand.args || {}).map(([k, v]) => [k, typeof v === 'string' ? sub(v) : v]));
        if (!this._compiled().actions.get(cand.action)) {
          out.action = { available: false, status: 'unsupported' };
          if (!out.judgedBy) this._judgeLoosely(cand, args, missing, out); // an action the host carries out: judged without it
        } else {
          out.judgedBy = 'action';
          const r = this.act({ action: cand.action, args });
          out.action = { available: r.ok, status: r.status, ...(r.missing ? { missing: r.missing } : {}) };
          if (r.missing) out.lacks.push(...r.missing.map((m) => ({ action: cand.action, key: m.key, ask: m.ask })));
          if (!r.ok && r.status !== 'missing') { out.ok = false; out.violations.push(...(r.violations || [])); }
        }
      }
      if (cand.question) {
        const r = this._query(cand.question, { ns: cand.ns });
        out.judgedBy ||= 'question';
        out.answer = r;
        if (r.status === 'refused') { out.ok = false; out.violations.push(...(r.violations || [])); }
        // the value a question asks for is what it wants, not what it lacks: on a subject
        // that is there, or on one the matrix makes (a computed answer not made yet); only a
        // told subject that is not there lacks. The question may be an object, a wire or text.
        if (r.status === 'missing') {
          const q = this._question(cand.question);
          const c = this._compiled();
          const made = c._madeTypes || (c._madeTypes = new Set(c.rules.flatMap((x) => x.then.map((t) => t.type))));
          const computed = (type) => [...made].some((t) => c.isA(t, type) || c.isA(type, t));
          const sought = (m) => q?.seek !== undefined && c.shortKey(m.type, m.key) === c.shortKey(m.type, q.seek) && (m.id !== undefined || computed(m.type));
          out.lacks.push(...(r.missing || []).filter((m) => !sought(m)));
        }
      }
    });
    return out;
  },

  /**
   * The judgement of a reading whose action the matrix does not declare (the host carries
   * it out), with what the matrix does know, in the reading's undone transaction:
   *   referents  every `$id` among the arguments is a wire of the world;
   *   slots      the arguments, as keys of `of` (a type; by default the type named like the
   *              action, so a host describes its action's parameters as the slots of a
   *              type of that name) or as `type.key` names, are told as a wire of that
   *              type: each value must fit its slot's kind, enum and range; the type's
   *              required keys the reading does not give lack, with their ask;
   *   denies     and no deny fires on the world with that wire.
   * `judgedBy` is the test that refused, or 'fallback' when all that could run passed
   * (`checks` lists them); with nothing to check the reading stays unjudged.
   */
  _judgeLoosely(cand, args, missing, out) {
    const checks = [];
    const c = this._compiled();
    const of = cand.of ?? (c.slots.get(cand.action) ? cand.action : undefined);
    const refs = Object.entries(args).filter(([, v]) => typeof v === 'string' && v[0] === '$' && !missing.has(v));
    if (refs.length) {
      checks.push('referents');
      const gone = refs.filter(([, v]) => !this.has(v.slice(1)));
      if (gone.length) {
        out.ok = false;
        out.violations.push(...gone.map(([k, v]) => ({ kind: 'dangling-ref', key: k, ref: v.slice(1), why: `${k}=${v}: no such wire` })));
        out.judgedBy = 'referents';
        out.checks = checks;
        return;
      }
    }
    // the arguments as wires: one per type (of=, or type.key names)
    const byType = new Map();
    for (const [k, v] of Object.entries(args)) { // bounded: the arguments
      if (typeof v !== 'string' && typeof v !== 'number') continue;
      if (missing.has(v)) continue;
      const dot = k.lastIndexOf('.');
      const type = dot > 0 ? k.slice(0, dot) : of;
      if (!type) continue;
      (byType.get(type) || byType.set(type, {}).get(type))[dot > 0 ? k.slice(dot + 1) : k] = [String(v)];
    }
    if (!byType.size && of) byType.set(of, {}); // no arguments: the parameters it needs still show
    if (byType.size) {
      checks.push('slots', 'denies');
      let n = 0;
      const wires = [...byType].map(([type, attrs]) => ({ id: `\u0006judge${++n}`, type, attrs, pattern: false }));
      const r = this._tell(wires, { strict: false, ns: cand.ns });
      if (!r.ok) {
        out.ok = false;
        out.violations.push(...r.violations);
        out.judgedBy = r.violations.some((v) => v.kind !== 'deny') ? 'slots' : 'denies'; // a value that does not fit its slot decides first
        out.checks = checks;
        return;
      }
      // required parameters the reading does not give: what a host would ask
      const mine = new Set(wires.map((w) => w.id));
      out.lacks.push(...[...mine].flatMap((id) => this.open(id)).map((o) => ({ action: cand.action, key: o.key, ...(o.ask ? { ask: o.ask } : {}) })));
    }
    if (checks.length) { out.judgedBy = 'fallback'; out.checks = checks; }
  },

  /**
   * mode=check: is the value given for the sought key (in `where`, or as `value`) the one
   * the world holds or derives? `supported` with `yes`; `no` with the values it does
   * have (`actual`) and where they come from; `missing` when it has none; any other
   * status (refused, conflicting, ...) as a value query gives it.
   */
  _check(question, opts) {
    const c = this._compiled();
    const { seek } = question;
    if (!seek) throw new Error('query: mode=check needs seek= and the value to check');
    const type = question.type || this._matching(question)[0]?.type;
    const key = type ? c.shortKey(type, seek) : seek;
    const where = { ...(question.where || {}) };
    let expected = question.value;
    for (const k of Object.keys(where)) {
      if ((type ? c.shortKey(type, k) : k) !== key) continue;
      expected ??= where[k];
      delete where[k];
    }
    if (expected === undefined) throw new Error(`query: mode=check needs the value of ${seek} to check (in where or as value)`);
    expected = this._norm(String(expected));
    const r = this._query({ ...question, where, mode: 'list' }, opts);
    if (r.status !== 'supported') return r;
    const values = r.values || [r.value];
    const { values: _v, value: _one, ...rest } = r;
    if (values.some((v) => this._same(type, key, v, expected))) return { ...rest, status: 'supported', value: 'yes', checked: expected };
    return { ...rest, status: 'no', actual: values, checked: expected };
  },

  /**
   * Tell several queued statements as one change: each is taken in (and logged) as its
   * own statement, then the rules run once and the world is validated once. A refusal
   * names, under `queued`, every queued tell whose wires are involved in it, in the order
   * they were told: { index, ids }.
   */
  _tellQueued(batch) {
    const res = this._result();
    const mark = this._begin(true);
    const entries = [];
    try {
      for (const q of batch) { // bounded: the queued statements
        const from = res.violations.length;
        const facts = this._ingest(q.wires, res);
        entries.push({ op: 'tell', wires: q.told, facts });
        // what this statement became (a wire it merged into) and what its intake raised
        q.ids = new Set(q.told.flatMap((w) => [w.id, this.resolve(w.id)]));
        q.raised = new Set(res.violations.slice(from));
        if (res.violations.length) break;
      }
      this._settle(res, this.options.strict);
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    const r = this._finish(mark, res, false, entries);
    if (!r.ok) {
      for (const v of r.violations) {
        const ids = new Set([v.id, v.into, ...(v.wires || []), ...(v.support || []), ...(v.involved || []).map((x) => x.id)].filter(Boolean));
        v.queued = batch.filter((q) => q.raised?.has(v) || [...(q.ids || [])].some((x) => ids.has(x))).map((q) => ({ index: q.index, ids: q.told.map((w) => w.id) }));
      }
    }
    return r;
  },

  _actDeclared(action, name, args) {
    const rule = action.rule;
    const refuse = (v) => ({ ok: false, status: 'refused', violations: [v] });
    let s0 = EMPTY;
    for (const p of action.params) s0 = unify('?' + p, this._norm(String(args[p])), s0);
    const matches = [...this._matchAll(rule.when, 0, s0)];
    if (!matches.length) {
      // name the first pattern that nothing matches, with the values it asked for
      let at = rule.when.length - 1;
      for (let i = 1; i <= rule.when.length; i++) if (this._matchAll(rule.when.slice(0, i), 0, s0).next().done) { at = i - 1; break; }
      const p = rule.when[at];
      const asked = Object.entries(p.attrs).flatMap(([k, vs]) => vs.map((v) => [k, walk(v, s0)])).filter(([k, v]) => !hasVar(v) && !k.startsWith('core.')).map(([k, v]) => `${k}=${v}`);
      return refuse({ kind: 'guard', action: name, pattern: p.id, why: `nothing matches ${[p.type, ...asked].join(' ')}` });
    }
    if (matches.length > 1 && !action.all) return refuse({ kind: 'guard', action: name, why: `${matches.length} things match; the action is for one (say all=true to act on each)` });
    const patch = { wires: [], sets: [], retract: [] };
    let value;
    for (let s of matches) { // bounded: the matches of the action's patterns
      this._b.tick('match');
      for (const q of rule.calc) {
        const xs = q.args.map((a) => walk(a, s));
        this._cannot = [];
        const out = xs.some(hasVar) ? undefined : this._call(q.fn, xs);
        const why = this._cannot[0];
        this._cannot = null;
        if (out === undefined || out === null) return refuse({ kind: 'guard', action: name, calc: q.id, why: why || `${q.fn} has no result here` });
        s = unify(q.out, this._round(String(out)), s);
        if (!s) return refuse({ kind: 'guard', action: name, calc: q.id, why: 'the result contradicts a value already known' });
      }
      for (const t of rule.test) {
        const xs = t.args.map((a) => walk(a, s));
        if (xs.some(hasVar) || !this._call(t.fn, xs)) return refuse({ kind: 'guard', action: name, check: t.id, why: t.why ? this._say(str(t.why), rule, s).text : `${t.fn}(${xs.join(', ')}) does not hold`, bindings: this._say('', rule, s).bindings, vars: this._say('', rule, s).vars });
      }
      for (const t of rule.then) {
        const attrs = {};
        for (const k of Object.keys(t.attrs)) {
          const vals = t.attrs[k].map((v) => walk(v, s)).filter((v) => !hasVar(v));
          if (vals.length) attrs[k] = vals;
        }
        if (t.on) {
          const id = walk(t.on, s);
          for (const k of Object.keys(attrs)) patch.sets.push({ id, key: k, value: attrs[k][0] });
        } else {
          const id = this._freshId(`${t.id.replace(/[^A-Za-z0-9_.]/g, '_')}_`) + (patch.wires.length ? `_${patch.wires.length}` : '');
          patch.wires.push({ id, type: t.type, attrs, pattern: false });
          s = unify('?' + t.id, id, s);
        }
      }
      for (const id of action.remove) patch.retract.push(walk('?' + id, s));
      if (action.returns) value = walk(action.returns, s);
    }
    const r = this._patch(patch, { strict: false });
    if (!r.ok) return { ok: false, status: 'refused', violations: r.violations };
    return { ok: true, status: 'done', value: value === undefined || hasVar(value) ? undefined : value, result: r };
  },

  /**
   * Which values of an open, abducible key would make the other keys of the question
   * hold? The question's keys that rules compute are the goal; the rest describe the
   * wire. Returns [{ value, cost, fills, assume }], cheapest first. Changes nothing.
   */
  _howto(type, key, where) {
    const c = this._compiled();
    const computed = new Set();
    for (const r of c.rules) for (const t of r.then) if (c.isA(type, t.type)) for (const k of Object.keys(t.attrs)) computed.add(k);
    const given = {};
    for (const k of Object.keys(where)) given[c.shortKey(type, k)] = this._norm(String(where[k]));
    const out = [];
    this._trial(() => {
      const fits = (w) => !w.attrs[key] && Object.keys(given).every((k) => !w.attrs[k] || w.attrs[k].some((v) => this._same(w.type, k, v, given[k])));
      let targets = [...(this.byType.get(type) || [])].map((id) => this.wires.get(id)).filter(fits);
      if (!targets.length) { // nothing to complete: suppose the wire, without the keys that rules compute
        const attrs = {};
        for (const k of Object.keys(given)) if (!computed.has(k)) attrs[k] = [given[k]];
        const id = this._freshId('_howto');
        if (!this._tell([{ id, type, attrs, pattern: false }], { strict: false }).ok) return;
        targets = [this.wires.get(id)];
      }
      const ids = new Set(targets.map((w) => w.id));
      const goal = [{ id: '_goal', type, attrs: Object.fromEntries(Object.entries(given).map(([k, v]) => [k, [v]])), pattern: false }];
      for (const e of abduce(this, goal, {})) {
        const mine = (e.fills || []).find((f) => ids.has(f.id) && f.key === key);
        if (!mine) continue;
        out.push({ value: mine.value, cost: e.cost, fills: (e.fills || []).map((f) => ({ ...(this.wires.get(f.id)?.meta.told && !String(f.id).startsWith('_howto') ? { id: f.id } : {}), key: f.key, value: f.value })), assume: e.assume || [] });
      }
    });
    return out;
  },

  _context(extra = {}) {
    const world = this;
    return {
      world,
      find: (type, where = {}) => world._matching({ type, where }),
      val: (wire, key) => (typeof wire === 'string' ? world.get(wire.replace(/^\$/, '')) : wire)?.attrs[key]?.[0],
      vals: (wire, key) => (typeof wire === 'string' ? world.get(wire.replace(/^\$/, '')) : wire)?.attrs[key] || [],
      ...extra,
    };
  },

  /** The wires a question is about: the one it names, or those of its type that meet the constraints. */
  _matching({ type, where = {}, absent, ns, about }) {
    // in a namespace: an id or a reference without one is in it, and only its wires match
    const q = (id) => (ns === undefined || id.includes('::') ? id.replace(/^::/, '') : ns ? `${ns}::${id}` : id);
    if (about) { const w = this.get(q(about)); return w ? [w] : []; }
    if (!type) return [];
    const c = this._compiled();
    const attrs = {};
    for (const k of Object.keys(where)) { const v = String(where[k]); attrs[c.shortKey(type, k)] = [this._norm(v[0] === '$' && v[1] !== '?' ? '$' + q(v.slice(1)) : v)]; }
    const seen = new Set();
    const out = [];
    const s0 = ns !== undefined && this._nsUsed ? unify('?\u0005ns', ns, EMPTY) : EMPTY;
    // absent: keys the wire has no value for (the object form of core.absent=)
    const pat = { id: 'q', type, attrs, pattern: true, ...(absent?.length ? { absent: [].concat(absent).map((k) => c.shortKey(type, k)) } : {}) };
    for (const s of this._matchAll([pat], 0, s0)) {
      const id = walk('?q', s);
      if (!seen.has(id)) { seen.add(id); out.push(this.wires.get(id) || this._external.get(id)); }
    }
    return out;
  },

  /**
   * Answer a question. Changes nothing unless { record: true }, which writes an answer
   * wire (and the question wire, if it was not one already) with status and provenance.
   */
  query(q, opts = {}) {
    if (this._compiled().lazyRules.length && !this._lazyOn) {
      // what lazy rules make is made for the question, then taken back
      return this._guard(opts, () => this._trial(() => { this._materialize(); this._lazyOn = true; try { return this.query(q, { ...opts, budget: undefined }); } finally { this._lazyOn = false; } }), (v) => ({ status: 'budget', ...v, from: [], wires: [] }));
    }
    if (opts.given) {
      // on the world as it would be with these wires and values; nothing stays
      const r = this.check(opts.given, { query: q });
      return r.ok ? r.answer : { status: 'refused', violations: r.violations, from: [...new Set(r.violations.flatMap((x) => x.support || []))], wires: [] };
    }
    return this._guard(opts, () => this._query(q, opts), (v) => ({ status: 'budget', ...v, from: [], wires: [] }));
  },

  // bounded: calls itself once, without `at`
  _query(q, { record = false, suppose = true, at, ns } = {}) {
    if (at !== undefined) return this.asOf(at, () => this._query(q, { suppose, ns }));
    const question = this._question(q);
    if (ns !== undefined) question.ns = ns;
    const c = this._compiled();
    const { seek, mode } = question;
    const wires = this._matching(question);
    const type = question.type || wires[0]?.type;
    const key = seek && type ? c.shortKey(type, seek) : seek;
    const slot = key && type ? c.slotOf(type, key) : undefined;
    const ask = slot?.ask ? slot.ask.replace(/^"|"$/g, '') : undefined;
    let r, suppositionOf = null;

    if (mode === 'check') return this._check(question, { record, suppose });
    if (mode === 'count') {
      r = { status: 'supported', value: String(key ? wires.filter((w) => w.attrs[key]).length : wires.length), from: wires.map((w) => w.id) };
    } else if (mode === 'exists') {
      const hits = key ? wires.filter((w) => w.attrs[key]) : wires;
      if (hits.length) r = { status: 'supported', value: 'yes', from: hits.map((w) => w.id) };
      else r = { status: type && c.lineage(type).some((t) => c.complete.has(t)) ? 'no' : 'unknown', from: [] };
    } else if (!key) {
      throw new Error('query: a question needs seek= unless its mode is exists or count');
    } else {
      // every value some wire has, with where it came from; then what a producer computes
      const found = new Map(); // value -> { from, via }
      const lacking = [];
      // standing issues (soft constraints) about the wires an answer rests on. An issue that
      // names this key (a soft bound on the value) makes the answer conflicting; an issue of
      // a soft deny names no key: it is advice about a combination of wires, so the answer
      // keeps its status and lists it under `advice`
      const issues = new Map(), advice = new Map();
      const flagged = (ids) => {
        for (const x of ids) for (const r of this.refs.get(x) || []) { // bounded: the wires that refer to one wire
          const i = this.wires.get(r);
          if (!i || i.type !== 'core.issue' || !(i.attrs.about || []).includes('$' + x)) continue;
          if ((i.attrs.key || []).includes(key)) issues.set(i.id, i);
          else advice.set(i.id, i);
        }
      };
      // how solid the answer is: the weakest tier among the values it rests on, and the assumptions under it
      let rank = -1;
      const rests = new Map(), memo = new Map(), floor = this._rank('derived');
      const weigh = (id, k, skip) => {
        const s = this._rests(id, k, memo);
        if (s.rank > rank) rank = s.rank;
        for (const [name, cell] of s.basis) if (this._rank(cell.tier) > floor && cell.id !== skip) rests.set(name, cell);
      };
      // one value however written: 2 and 2.0 under a numeric key, the same quantity in its unit
      const same = new Map(); // normalized -> the first spelling seen
      const note = (value, from, via, ties) => {
        const iv = type ? this._iv(type, key, value) : value;
        if (!same.has(iv)) same.set(iv, value);
        value = same.get(iv);
        const e = found.get(value) || found.set(value, { from: [], via: [] }).get(value);
        if (ties) e.ties = ties;
        for (const x of from) if (!e.from.includes(x)) e.from.push(x);
        if (via && !e.via.includes(via)) e.via.push(via);
      };
      for (const w of wires) {
        const vals = w.attrs[key];
        if (!vals) { lacking.push(w); continue; }
        for (const value of vals) {
          const fill = (w.meta.fills || []).find((f) => f.key === key && f.value === value);
          note(value, [w.id, ...(fill?.from || [])], fill ? fill.via : w.meta.via, fill ? fill.ties : w.meta.ties?.[key]);
          flagged([w.id, ...(fill?.from || [])]);
          weigh(w.id, key);
        }
      }
      // nothing matches: suppose a wire of that type with the given keys and let the rules work
      let refused = null, supposed = null;
      const ground = Object.values(question.where).every((x) => !String(x).startsWith('?'));
      if (suppose && !wires.length && type && !question.about && ground) {
        this._cannot = []; // functions say here why they have no result
        this._trial(() => {
          const attrs = {};
          for (const k of Object.keys(question.where)) attrs[c.shortKey(type, k)] = [String(question.where[k])];
          const space = question.ns ?? this.options.ns;
          const id = (space ? `${space}::` : '') + this._freshId('suppose');
          const res = this._tell([{ id, type, attrs, pattern: false }], { strict: false, ns: space });
          if (!res.ok) { refused = res.violations.map((x) => ({ ...x, wires: (x.wires || []).filter((y) => y !== id), support: (x.support || []).filter((y) => y !== id) })); return; }
          // the supposed wire as the rules left it: everything they set on it, not only the key asked for
          const sw = this.get(id);
          if (sw) {
            const told = new Set(Object.keys(attrs));
            const set = {};
            for (const k of Object.keys(sw.attrs)) if (!told.has(k)) set[k] = sw.attrs[k].length === 1 ? sw.attrs[k][0] : [...sw.attrs[k]];
            supposed = {
              type: sw.type,
              attrs: Object.fromEntries(Object.entries(sw.attrs).map(([k, v]) => [k, [...v]])),
              set,
              fills: (sw.meta.fills || []).map((f) => ({ key: f.key, value: f.value, via: f.via, from: (f.from || []).filter((x) => x !== id), tier: this.tier(sw.id, f.key) })),
            };
          }
          // the value may be filled on the supposed wire or sit on a wire a rule derived from it
          for (const w of this._matching(question)) {
            for (const value of w.attrs[key] || []) {
              const fill = (w.meta.fills || []).find((f) => f.key === key && f.value === value);
              const from = fill ? fill.from || [] : w.meta.from || [];
              flagged([w.id, ...from]);
              weigh(w.id, key, id);
              note(value, from.filter((x) => x !== id && this.wires.get(x)?.meta.told), fill ? fill.via : w.meta.via, fill ? fill.ties : w.meta.ties?.[key]);
            }
          }
        });
      }
      const reasons = this._cannot || [];
      if (supposed) suppositionOf = supposed;
      this._cannot = null;
      const producers = type ? c.lineage(type).flatMap((t) => c.producers.get(`${t}.${key}`) || []) : [];
      if (!refused && !found.size && producers.length && (lacking.length || !wires.length)) {
        for (const w of lacking.length ? lacking : [undefined]) {
          for (const p of producers) {
            const out = this._host('producer', p.fn)(this._context({ wire: w, type, key, where: question.where }));
            if (out === undefined || out === null) continue;
            for (const value of Array.isArray(out) ? out : [out]) note(String(value), w ? [w.id] : [], p.id);
            if (w) lacking.splice(lacking.indexOf(w), 1);
            break;
          }
        }
      }
      const values = [...found.keys()];
      const from = (list) => [...new Set(list.flatMap((value) => found.get(value).from))];
      const via = (list) => [...new Set(list.flatMap((value) => found.get(value).via))];
      if (!refused && issues.size && values.length) {
        // the value rests on something that is recorded as wrong: report it, do not vouch for it
        const list = [...issues.values()];
        r = { status: 'conflicting', reason: str(list[0].attrs.why?.[0] || ''), issues: list.map((i) => i.id), alternatives: values.map((value) => ({ value, from: found.get(value).from })), from: from(values), via: via(values) };
      } else if (refused) {
        r = { status: 'refused', violations: refused, from: [...new Set(refused.flatMap((x) => x.support || []))] };
      } else if ((mode === 'list' || (slot?.many && values.length > 1)) && values.length) {
        // several values of a key that may hold several are one answer, not a conflict
        r = { status: 'supported', values, from: from(values), via: via(values) };
      } else if (values.length === 1 && found.get(values[0]).ties) {
        // the value was picked among several equally good ones: say so instead of choosing
        r = { status: 'ambiguous', alternatives: found.get(values[0]).ties.map((value) => ({ value })), from: from(values), via: via(values) };
      } else if (values.length === 1) {
        r = { status: 'supported', value: values[0], from: from(values), via: via(values) };
      } else if (values.length > 1) {
        r = { status: 'conflicting', alternatives: values.map((value) => ({ value, from: found.get(value).from })), from: from(values), via: via(values) };
      } else if (reasons.length) {
        // a rule would have answered, but one of its calculations cannot be done
        r = { status: 'unsupported', reason: reasons[0], from: [] };
      } else {
        const missing = lacking.length ? lacking.slice(0, 20).map((w) => ({ id: w.id, type: w.type, key, ask })) : [{ type, key, ask }];
        r = { status: 'missing', missing, from: [] };
      }
      if (advice.size && (r.value !== undefined || r.values)) r.advice = [...advice.values()].map((i) => ({ issue: i.id, why: str(i.attrs.why?.[0] || '') }));
      if (rank >= 0 && (r.value !== undefined || r.values || r.alternatives)) {
        r.tier = c.tiers[rank];
        if (rests.size) r.rests = [...rests.values()].sort((x, y) => this._rank(y.tier) - this._rank(x.tier));
      }
    }
    if (suppositionOf) r.supposed = suppositionOf;
    // The key is open and may be assumed: say which values would make the rest hold.
    if (type && key && (mode === 'abduce' || r.status === 'missing') && c.lineage(type).some((t) => c.abducibleKeys.has(`${t}.${key}`))) {
      const howto = this._howto(type, key, question.where);
      if (howto.length) r.howto = howto;
      if (mode === 'abduce' && howto.length) {
        const distinct = [...new Set(howto.map((h) => h.value))];
        r = distinct.length === 1
          ? { ...r, status: 'supported', value: distinct[0], tier: 'guessed', via: ['core.abduce'], howto }
          : { ...r, status: 'ambiguous', alternatives: howto.map((h) => ({ value: h.value, cost: h.cost })), tier: 'guessed', howto };
        delete r.missing;
      }
    }
    r.wires = wires.map((w) => w.id);
    if (record) r.answer = this._record(q, question, r);
    return r;
  },

  /** Write the answer (and the question, when it is not yet a wire of the world) as wires. */
  _record(q, question, r) {
    const v = this._vocab();
    const mark = this._begin(true);
    const told = [];
    let qid = question.id;
    if (!qid) {
      qid = this._freshId('q');
      const attrs = {};
      if (question.type) attrs[v.type] = [question.type];
      if (question.seek) attrs[v.seek] = [question.seek];
      if (question.about) attrs[v.about] = ['$' + question.about];
      if (question.mode && question.mode !== 'value') attrs[v.mode] = [question.mode];
      for (const k of Object.keys(question.where || {})) attrs[v.where + k] = [String(question.where[k])];
      told.push({ id: qid, type: v.question, attrs, pattern: false });
    }
    const attrs = { [v.to]: ['$' + qid], [v.status]: [r.status] };
    const values = r.value !== undefined ? [r.value] : r.values || (r.alternatives || []).map((a) => a.value);
    if (values.length) attrs[v.value] = values;
    const via = (r.via || []).filter((x) => this.matrix.has(x));
    if (via.length) attrs[v.via] = via.map((x) => '$' + x);
    const from = (r.from || []).filter((x) => this.has(x));
    if (from.length) attrs[v.from] = from.map((x) => '$' + x);
    const aid = this._freshId('a');
    told.push({ id: aid, type: v.answer, attrs, pattern: false });
    const res = this._tell(told, { strict: false });
    if (!res.ok) { this._rollback(mark); return { ok: false, violations: res.violations }; }
    this._commit();
    return { ok: true, id: aid, question: qid };
  },

  _freshId(prefix) {
    let n = this.seq + 1;
    while (this.wires.has(`${prefix}${n}`) || this.alias.has(`${prefix}${n}`)) n++; // bounded: by the ids in use
    return `${prefix}${n}`;
  },

  /**
   * Carry out an action: { action, args } or a request wire (action=<name> arg.<k>=<v>).
   * The registered function runs inside one transaction with a context that can tell, fill,
   * replace and retract. If it throws, returns { ok: false }, or any change is refused, the
   * world is left as it was. A required argument that is missing is reported, not guessed.
   */
  act(request, opts = {}) {
    if (Array.isArray(request)) return this._guard(opts, () => this._actAll(request), (v) => ({ ok: false, status: 'budget', results: [], violations: [v] }));
    return this._guard(opts, () => this._act(request), (v) => ({ ok: false, status: 'budget', violations: [v] }));
  },

  /**
   * The requests of one sentence, all or nothing: each is run in turn inside one
   * transaction; if one is not done (missing an argument, refused, unknown, an error) none
   * is kept. What they did together is one step for undo.
   */
  _actAll(requests) {
    const mark = this._begin(true);
    const step = `s${this.seq}`;
    const outer = this._step;
    this._step = step;
    const results = [];
    let failed = -1;
    try {
      for (let i = 0; i < requests.length; i++) { // bounded: the requests given
        const r = this._act(requests[i]);
        results.push(r);
        if (!r.ok) { failed = i; break; }
      }
    } catch (e) {
      this._step = outer;
      this._rollback(mark);
      throw e;
    }
    this._step = outer;
    if (failed >= 0) {
      this._rollback(mark);
      const r = results[failed];
      return { ok: false, status: r.status, failed, results, missing: r.missing, violations: r.violations };
    }
    this._commit();
    return { ok: true, status: 'done', results, violations: [] };
  },

  _act(request) {
    const v = this._vocab();
    let name, args = {}, id;
    let w = request;
    if (typeof request === 'string') w = this.get(request) || parse(request)[0];
    if (w?.attrs) {
      name = first(w, v.action);
      id = this.has(w.id) ? this.resolve(w.id) : undefined;
      for (const k of Object.keys(w.attrs)) if (k.startsWith(v.arg)) args[k.slice(v.arg.length)] = w.attrs[k].length === 1 ? w.attrs[k][0] : [...w.attrs[k]];
    } else ({ action: name, args = {} } = request || {});
    const action = this._compiled().actions.get(name);
    if (!action) return { ok: false, status: 'unsupported', violations: [{ kind: 'unknown-action', why: `no action named "${name}"` }] };
    const by = this._by;
    this._by = name; // what it states is recorded as said by this action
    try { return this._actNamed(action, name, args, id); } finally { this._by = by; }
  },

  _actNamed(action, name, args, id) {
    const lacking = action.required.filter((k) => args[k] === undefined);
    if (lacking.length) {
      return { ok: false, status: 'missing', missing: lacking.map((k) => ({ action: name, key: k, ask: (first({ attrs: action.ask }, `ask.${k}`) || '').replace(/^"|"$/g, '') || undefined })), violations: [] };
    }
    if (action.rule) return this._actDeclared(action, name, args);
    const mark = this._begin(true);
    const violations = [];
    const guard = (r) => { if (r && r.ok === false) { violations.push(...(r.violations || [])); throw REFUSED; } return r; };
    // Tells are queued and propagated together, at the first read and at the end: an
    // action is checked where it reads and at its end, not after every tell (Q13).
    const queue = [];
    let told = 0;
    const flush = () => {
      if (!queue.length) return { ok: true, added: [], derived: [], filled: [], merged: [], removed: [], violations: [] };
      return guard(this._tellQueued(queue.splice(0)));
    };
    const world = new Proxy(this, { // a host that uses the world directly sees what it told
      get: (t, p) => { flush(); const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; },
    });
    const reading = (fn) => (...a) => { flush(); return fn(...a); };
    const base = this._context();
    const ctx = this._context({
      args, request: id, world,
      find: reading(base.find), val: reading(base.val), vals: reading(base.vals),
      get: reading((wid) => this.get(String(wid).replace(/^\$/, ''))),
      query: reading((q, o) => this.query(q, o)),
      ask: reading((q, o) => this.ask(q, o)),
      tell: (input, { now = false } = {}) => {
        const index = told++;
        if (now) { flush(); return guard(this.tell(input)); }
        const wires = this._qualifyFacts((typeof input === 'string' ? parse(input) : input).map(cloneWire), this.options.ns);
        queue.push({ index, wires, told: wires.map(cloneWire) });
        return { ok: true, queued: true, added: [], derived: [], filled: [], merged: [], removed: [], violations: [] };
      },
      flush,
      fill: (wid, key, value) => { flush(); return guard(this.fill(wid, key, value)); },
      replace: (wid, input) => { flush(); return guard(this.replace(wid, input)); },
      retract: (wid) => { flush(); return guard(this.retract(wid)); },
    });
    let out;
    try {
      out = this._host('action', action.fn)(ctx, args);
      if (out && out.ok === false) { violations.push({ kind: 'refused', why: out.why || out.reason, reason: out.reason }); throw REFUSED; }
      flush();
    } catch (e) {
      this._rollback(mark);
      if (e === this._b.signal) throw e; // out of budget: the outermost call reports it
      if (e !== REFUSED) violations.push({ kind: 'error', why: e.message });
      return { ok: false, status: e === REFUSED ? 'refused' : 'error', violations };
    }
    this._commit();
    return { ok: true, status: 'done', value: out === undefined || typeof out === 'object' ? undefined : String(out), result: out };
  },
};

const REFUSED = {};
