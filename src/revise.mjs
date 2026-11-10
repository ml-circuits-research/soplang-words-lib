// Retraction and revision of assumptions. Mixed into World.prototype.
//
// Both are incremental: the affected wires, values and rule firings are withdrawn
// (World._unsay), the chase re-derives what still holds, and the result is validated.
// Everything happens in one transaction, so a refused retraction changes nothing.

// what two worlds share after fork(), until one of them changes
const STATE = ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'events', 'seq', 'stamp', '_clock', '_lastOrder', '_c', '_logOf', '_fills'];

import { parse, cloneWire } from './parser.mjs';

export const revision = {
  /**
   * Remove a told wire, every told wire that refers to it, and everything that was
   * derived from them. What has other support is derived again.
   */
  retract(id, opts = {}) {
    return this._guard(opts, () => this._retract(id), (v) => this._refusal(v));
  },

  _retract(id) {
    const target = this.wires.get(id);
    const nested = this._tx > 0;
    const unsupported = { ok: false, removed: [], violations: [{ kind: 'unsupported', id, why: 'a merged wire cannot be retracted inside a transaction' }] };
    if (this.alias.has(id)) return nested ? unsupported : this._retractByReplay(id);
    if (!target || !target.meta.told) {
      return { ok: false, removed: [], violations: [{ kind: 'unknown-wire', id, why: 'only told wires can be retracted' }] };
    }
    const res = this._result();
    const mark = this._begin(true);
    let gone, fallback = false;
    try {
      gone = this._withdraw(res, [id], []);
      if (!res.violations.length) this._validate(res);
      // a derived wire that absorbed a told one would take the told statements with it
      if (this.alias.size) fallback = [...this.alias.values()].some((t) => !this.wires.has(t));
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    if (fallback) { this._rollback(mark); return nested ? unsupported : this._retractByReplay(id); }
    if (res.violations.length) return this._finish(mark, res, false, null);

    const removed = [...gone].filter((x) => !this.wires.has(x));
    this._logRemove(new Set(removed));
    this._event({ op: 'retract', ids: removed });
    const out = this._finish(mark, res, false, null);
    out.removed = removed;
    return out;
  },

  /**
   * Withdraw, re-derive, then withdraw the told wires left with a dangling reference,
   * until nothing dangles. Derived wires left dangling are reported by validation.
   */
  _withdraw(res, ids, values) {
    const gone = new Set();
    let targets = ids;
    for (let round = 0; (targets.length || values.length) && round < 1000; round++) {
      this._b.tick('withdraw');
      for (const x of this._unsay(res, targets, values)) gone.add(x);
      values = [];
      this._chase(res);
      if (res.violations.length) break;
      const next = new Set();
      for (const x of gone) {
        if (this.wires.has(x)) continue;
        for (const r of this.refs.get(x) || []) {
          const w = this.wires.get(r);
          if (!w || !this._dependsOn(w, x)) continue;
          if (w.meta.told) next.add(r); else res._touched.add(r);
        }
      }
      targets = [...next];
    }
    return gone;
  },

  /** Does the wire refer to id through a key that is checked (not a bookkeeping key of an open namespace)? */
  _dependsOn(w, id) {
    const c = this._compiled();
    const ref = '$' + id;
    return Object.keys(w.attrs).some((k) => w.attrs[k].includes(ref) && (c.slotOf(w.type, k) || !c.isOpenKey(k)));
  },

  /** Reference implementation of retract: rebuild the world from the log without the wire. */
  _retractByReplay(id) {
    const gone = new Set([id]);
    const told = this.log.filter((e) => e.op === 'tell').flatMap((e) => e.wires.filter((w) => e.facts.includes(w.id)));
    for (let grew = true; grew;) { // bounded: each pass adds at least one told wire
      grew = false;
      for (const w of told) {
        if (gone.has(w.id)) continue;
        const c = this._compiled();
        const refs = Object.keys(w.attrs).filter((k) => !c.isOpenKey(k) || c.slotOf(w.type, c.shortKey(w.type, k)))
          .flatMap((k) => w.attrs[k]).filter((v) => v[0] === '$').map((v) => v.slice(1));
        if (refs.some((r) => gone.has(r))) { gone.add(w.id); grew = true; }
      }
    }
    const next = new this.constructor(this.options);
    const refused = next._replay(this.log, (e) => {
      if (e.op === 'tell') {
        const ws = e.wires.filter((w) => !(e.facts.includes(w.id) && gone.has(w.id)));
        return ws.length ? { ...e, wires: ws } : null;
      }
      return gone.has(this.resolve(e.id)) || !this.has(e.id) ? null : e;
    });
    if (refused) return { ok: false, removed: [], violations: refused.violations };
    const before = new Set(this.wires.keys());
    for (const k of ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'seq', '_c', '_logOf', '_fills', '_lastOrder']) this[k] = next[k];
    this._shared = null;
    this.stamp = ++this._clock;
    const removed = [...before].filter((x) => !this.wires.has(x));
    this.events = [...this.events, { seq: this.seq, op: 'retract', ids: removed }];
    this._emitted = this.events.length;
    for (const l of this.listeners) l([{ ...this.events.at(-1) }], this);
    return { ok: true, removed, violations: [] };
  },

  /**
   * An independent copy that costs nothing until one of the two worlds changes: both keep
   * using the same state, and the first one to commit a change copies it for itself.
   * Listeners are not carried over.
   */
  fork() {
    const copy = new this.constructor(this.options);
    const share = this._shared || (this._shared = { holders: 1 });
    share.holders++;
    for (const k of STATE) copy[k] = this[k];
    copy._shared = share;
    copy._emitted = copy.events.length;
    return copy;
  },

  /** Stop sharing: take a private copy of the state (unless the other holders are gone already). */
  _detach() {
    const share = this._shared;
    this._shared = null;
    if (--share.holders === 0) return; // the last holder owns the state
    const wires = new Map();
    for (const [id, w] of this.wires) { // bounded: one pass over the wires
      const attrs = {};
      for (const k of Object.keys(w.attrs)) attrs[k] = [...w.attrs[k]];
      const meta = { ...w.meta };
      if (meta.fills) meta.fills = [...meta.fills];
      if (meta.stated) meta.stated = Object.fromEntries(Object.entries(meta.stated).map(([k, v]) => [k, [...v]]));
      if (meta.tails) meta.tails = { ...meta.tails };
      wires.set(id, { id: w.id, type: w.type, attrs, pattern: w.pattern, meta });
    }
    const sets = (m) => new Map([...m].map(([k, v]) => [k, new Set(v)]));
    this.wires = wires;
    this.byType = sets(this.byType);
    this.index = sets(this.index);
    this.refs = sets(this.refs);
    this.byWire = sets(this.byWire);
    this.byRule = sets(this.byRule);
    this.matrix = new Map(this.matrix);
    this.alias = new Map(this.alias);
    this.used = new Set(this.used);
    this.firings = new Map(this.firings);
    this._logOf = new Map(this._logOf);
    this.log = [...this.log];
    this.events = [...this.events];
    this._pc = null;
  },

  /**
   * Defaults are assumptions. When a change is refused and default fills are involved in
   * the refusal, withdraw those defaults (and what followed from them) and try again.
   */
  _retryWithoutDefaults(r, redo, opts) {
    if (this._tx) return r;
    const involved = new Set();
    const visit = (id) => { // bounded: each wire is visited once
      id = this.resolve(id);
      if (involved.has(id)) return;
      involved.add(id);
      const w = this.wires.get(id);
      if (!w) return;
      for (const x of w.meta.from || []) visit(x);
      for (const f of w.meta.fills || []) for (const x of f.from || []) visit(x);
    };
    for (const v of r.violations) { if (v.id) visit(v.id); for (const x of v.wires || []) visit(x); }
    const drop = [];
    for (const id of involved) {
      for (const f of this.wires.get(id)?.meta.fills || []) {
        if (f.via === 'core.default') drop.push({ id, key: f.key, value: f.value });
      }
    }
    if (!drop.length) return r;

    const res = this._result();
    const mark = this._begin(!opts.dry);
    let r2;
    try {
      this._withdraw(res, [], drop);
      if (!res.violations.length) this._validate(res);
      if (res.violations.length) { this._rollback(mark); return r; }
      if (this._fills) {
        const old = this.log, fills = this._fills;
        this.log = old.filter((e) => !(e.op === 'fill' && e.via === 'core.default' && drop.some((d) => d.id === this.resolve(e.id) && d.key === e.key)));
        this._fills -= old.length - this.log.length;
        this._do(() => { this.log = old; this._fills = fills; });
      }
      this._event({ op: 'revise', dropped: drop });
      r2 = redo({ ...opts, dry: false });
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    if (!r2.ok) { this._rollback(mark); return r; }
    r2.revised = drop;
    if (opts.dry) this._rollback(mark); else this._commit();
    return r2;
  },
};

/**
 * Replace a told wire by new wires in one transaction. If anything is refused nothing
 * changes. Told wires that refer to the old wire stay when a new wire takes its id;
 * otherwise they go with it. This is how state changes over time.
 */
revision.replace = function replace(id, input, opts = {}) {
  return this._guard(opts, () => this._replace(id, input), (v) => this._refusal(v));
};

revision._replace = function _replace(id, input) {
  const target = this.wires.get(id);
  if (this.alias.has(id) || !target || !target.meta.told) {
    return { ...this._result(), ok: false, violations: [{ kind: 'unknown-wire', id, why: 'only told wires that were not merged can be replaced' }] };
  }
  const wires = (typeof input === 'string' ? parse(input) : input).map(cloneWire);
  const told = wires.map(cloneWire);
  const res = this._result();
  const mark = this._begin(true);
  let gone, facts, fallback = false;
  try {
    gone = this._unsay(res, [id], []);            // no cascade yet: the new wire may take the id
    facts = this._ingest(wires, res);
    if (!res.violations.length) {
      this._chase(res);
      const orphans = [];
      for (const x of gone) {
        if (this.wires.has(x)) continue;
        for (const r of this.refs.get(x) || []) {
          const w = this.wires.get(r);
          if (!w || !this._dependsOn(w, x)) continue;
          if (w.meta.told) orphans.push(r); else res._touched.add(r);
        }
      }
      if (!res.violations.length && orphans.length) for (const x of this._withdraw(res, orphans, [])) gone.add(x);
    }
    this._settle(res, this.options.strict);
    if (this.alias.size) fallback = [...this.alias.values()].some((t) => !this.wires.has(t));
  } catch (e) {
    this._rollback(mark);
    throw e;
  }
  if (fallback) res.violations.push({ kind: 'unsupported', id, why: 'the change would remove a wire that absorbed a told one; retract it first' });
  if (res.violations.length) return this._finish(mark, res, false, null);
  const removed = [...gone].filter((x) => !this.wires.has(x));
  // In the log the new wire takes the place of the old one when it keeps the id, so that
  // wires told later that refer to it still find it when the log is replayed.
  const successor = facts.includes(id) ? told.find((w) => w.id === id) : null;
  const dead = new Set(removed);
  if (!successor) dead.add(id);
  this._logRemove(dead, successor, id);
  this._event({ op: 'replace', id, removed });
  const rest = told.filter((w) => w !== successor);
  const entry = rest.length ? { op: 'tell', wires: rest, facts: facts.filter((x) => !successor || x !== id) } : null;
  const out = this._finish(mark, res, false, entry);
  out.removed = removed;
  return out;
};
