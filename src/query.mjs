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
    return { id: this.has(w.id) ? this.resolve(w.id) : undefined, type: first(w, v.type), seek: first(w, v.seek), where, about: about ? about.replace(/^\$/, '') : undefined, mode: first(w, v.mode) || 'value' };
  },

  /** What a registered function sees of the world. */
  /**
   * An action written as wires. The parameters are variables; the patterns read the
   * state; calcs compute; every check must hold (the guard); then all writes are applied
   * as one patch. Every expression was evaluated on the state before the action.
   */
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
    if (!matches.length) return refuse({ kind: 'guard', action: name, why: 'nothing in the world matches what the action needs' });
    if (matches.length > 1 && !action.all) return refuse({ kind: 'guard', action: name, why: `${matches.length} things match; the action is for one (say all=true to act on each)` });
    const patch = { wires: [], sets: [], retract: [] };
    let value;
    for (let s of matches) { // bounded: the matches of the action's patterns
      this._b.tick('match');
      for (const q of rule.calc) {
        const xs = q.args.map((a) => walk(a, s));
        this._cannot = [];
        const out = xs.some(hasVar) ? undefined : this.fns[q.fn](xs, this);
        const why = this._cannot[0];
        this._cannot = null;
        if (out === undefined || out === null) return refuse({ kind: 'guard', action: name, calc: q.id, why: why || `${q.fn} has no result here` });
        s = unify(q.out, this._round(String(out)), s);
        if (!s) return refuse({ kind: 'guard', action: name, calc: q.id, why: 'the result contradicts a value already known' });
      }
      for (const t of rule.test) {
        const xs = t.args.map((a) => walk(a, s));
        if (xs.some(hasVar) || !this.fns[t.fn](xs, this)) return refuse({ kind: 'guard', action: name, check: t.id, why: t.why ? this._say(str(t.why), rule, s).text : `${t.fn}(${xs.join(', ')}) does not hold`, bindings: this._say('', rule, s).bindings });
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
  _matching({ type, where = {}, about }) {
    if (about) { const w = this.get(about); return w ? [w] : []; }
    if (!type) return [];
    const c = this._compiled();
    const attrs = {};
    for (const k of Object.keys(where)) attrs[c.shortKey(type, k)] = [this._norm(String(where[k]))];
    const seen = new Set();
    const out = [];
    for (const s of this._matchAll([{ id: 'q', type, attrs, pattern: true }], 0, EMPTY)) {
      const id = walk('?q', s);
      if (!seen.has(id)) { seen.add(id); out.push(this.wires.get(id)); }
    }
    return out;
  },

  /**
   * Answer a question. Changes nothing unless { record: true }, which writes an answer
   * wire (and the question wire, if it was not one already) with status and provenance.
   */
  query(q, opts = {}) {
    return this._guard(opts, () => this._query(q, opts), (v) => ({ status: 'budget', ...v, from: [], wires: [] }));
  },

  // bounded: calls itself once, without `at`
  _query(q, { record = false, suppose = true, at } = {}) {
    if (at !== undefined) return this.asOf(at, () => this._query(q, { suppose }));
    const question = this._question(q);
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
      // standing issues (soft constraints) about the wires an answer rests on
      const issues = new Map();
      const flagged = (ids) => {
        for (const x of ids) for (const r of this.refs.get(x) || []) { // bounded: the wires that refer to one wire
          const i = this.wires.get(r);
          if (i && i.type === 'core.issue' && (i.attrs.about || []).includes('$' + x)) issues.set(i.id, i);
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
      const note = (value, from, via, ties) => {
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
          const id = this._freshId('suppose');
          const res = this._tell([{ id, type, attrs, pattern: false }], { strict: false });
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
    return this._guard(opts, () => this._act(request), (v) => ({ ok: false, status: 'budget', violations: [v] }));
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
        const wires = (typeof input === 'string' ? parse(input) : input).map(cloneWire);
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
