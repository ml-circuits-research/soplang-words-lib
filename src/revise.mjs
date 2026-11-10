// Retraction and revision of assumptions. Mixed into World.prototype.
//
// Both are incremental: the affected wires, values and rule firings are withdrawn
// (World._unsay), the chase re-derives what still holds, and the result is validated.
// Everything happens in one transaction, so a refused retraction changes nothing.

import { parse, cloneWire } from './parser.mjs';

export const revision = {
  /**
   * Remove a told wire, every told wire that refers to it, and everything that was
   * derived from them. What has other support is derived again.
   */
  retract(id) {
    const target = this.wires.get(id);
    const nested = this._tx > 0;
    const unsupported = { ok: false, removed: [], violations: [{ kind: 'unsupported', id, why: 'a merged wire cannot be retracted inside a transaction' }] };
    if (this.alias.has(id)) return nested ? unsupported : this._retractByReplay(id);
    if (!target || !target.meta.told) {
      return { ok: false, removed: [], violations: [{ kind: 'unknown-wire', id, why: 'only told wires can be retracted' }] };
    }
    const res = this._result();
    const mark = this._begin();
    let gone, fallback = false;
    try {
      gone = this._withdraw(res, [id], []);
      if (!res.violations.length) this._validate(res);
      // a derived wire that absorbed a told one would take the told statements with it
      fallback = [...this.alias.values()].some((t) => !this.wires.has(t));
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    if (fallback) { this._rollback(mark); return nested ? unsupported : this._retractByReplay(id); }
    if (res.violations.length) return this._finish(mark, res, false, null);

    const removed = [...gone].filter((x) => !this.wires.has(x));
    const dead = new Set(removed);
    const old = this.log;
    this.log = old
      .filter((e) => e.op !== 'fill' || !dead.has(e.id))
      .map((e) => (e.op !== 'tell' ? e : { ...e, wires: e.wires.filter((w) => !(e.facts.includes(w.id) && dead.has(w.id))), facts: e.facts.filter((x) => !dead.has(x)) }))
      .filter((e) => e.op !== 'tell' || e.wires.length);
    this._do(() => { this.log = old; });
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
      for (const x of this._unsay(res, targets, values)) gone.add(x);
      values = [];
      this._chase(res);
      if (res.violations.length) break;
      const next = new Set();
      for (const x of gone) {
        if (this.wires.has(x)) continue;
        for (const r of this.refs.get(x) || []) {
          const w = this.wires.get(r);
          if (!w) continue;
          if (w.meta.told) next.add(r); else res._touched.add(r);
        }
      }
      targets = [...next];
    }
    return gone;
  },

  /** Reference implementation of retract: rebuild the world from the log without the wire. */
  _retractByReplay(id) {
    const gone = new Set([id]);
    const told = this.log.filter((e) => e.op === 'tell').flatMap((e) => e.wires.filter((w) => e.facts.includes(w.id)));
    for (let grew = true; grew;) {
      grew = false;
      for (const w of told) {
        if (gone.has(w.id)) continue;
        const refs = Object.values(w.attrs).flat().filter((v) => v[0] === '$').map((v) => v.slice(1));
        if (refs.some((r) => gone.has(r))) { gone.add(w.id); grew = true; }
      }
    }
    const next = new this.constructor(this.options);
    for (const e of this.log) {
      let r = { ok: true };
      if (e.op === 'tell') {
        const ws = e.wires.filter((w) => !(e.facts.includes(w.id) && gone.has(w.id)));
        if (ws.length) r = next._tell(ws, { strict: false });
      } else if (next.has(e.id)) {
        r = next._fill(e.id, e.key, e.value, { via: e.via, strict: false });
      }
      if (!r.ok) return { ok: false, removed: [], violations: r.violations };
    }
    const before = new Set(this.wires.keys());
    for (const k of ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'seq', '_c']) this[k] = next[k];
    this.stamp = ++this._clock;
    const removed = [...before].filter((x) => !this.wires.has(x));
    this.events = [...this.events, { seq: this.seq, op: 'retract', ids: removed }];
    this._emitted = this.events.length;
    for (const l of this.listeners) l([{ ...this.events.at(-1) }], this);
    return { ok: true, removed, violations: [] };
  },

  /** Independent copy (replays the log). */
  fork() { return this.constructor.fromJSON(this.toJSON(), this.options); },

  /**
   * Defaults are assumptions. When a change is refused and default fills are involved in
   * the refusal, withdraw those defaults (and what followed from them) and try again.
   */
  _retryWithoutDefaults(r, redo, opts) {
    if (this._tx) return r;
    const involved = new Set();
    const visit = (id) => {
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
    const mark = this._begin();
    let r2;
    try {
      this._withdraw(res, [], drop);
      if (!res.violations.length) this._validate(res);
      if (res.violations.length) { this._rollback(mark); return r; }
      const old = this.log;
      this.log = old.filter((e) => !(e.op === 'fill' && e.via === 'core.default' && drop.some((d) => d.id === this.resolve(e.id) && d.key === e.key)));
      this._do(() => { this.log = old; });
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
revision.replace = function replace(id, input) {
  const target = this.wires.get(id);
  if (this.alias.has(id) || !target || !target.meta.told) {
    return { ...this._result(), ok: false, violations: [{ kind: 'unknown-wire', id, why: 'only told wires that were not merged can be replaced' }] };
  }
  const wires = (typeof input === 'string' ? parse(input) : input).map(cloneWire);
  const told = wires.map(cloneWire);
  const res = this._result();
  const mark = this._begin();
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
          if (!w) continue;
          if (w.meta.told) orphans.push(r); else res._touched.add(r);
        }
      }
      if (!res.violations.length && orphans.length) for (const x of this._withdraw(res, orphans, [])) gone.add(x);
    }
    this._settle(res, this.options.strict);
    fallback = [...this.alias.values()].some((t) => !this.wires.has(t));
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
  const old = this.log;
  this.log = old
    .filter((e) => e.op !== 'fill' || !(dead.has(e.id) || e.id === id))
    .map((e) => (e.op !== 'tell' ? e : {
      ...e,
      wires: e.wires.filter((w) => !(e.facts.includes(w.id) && dead.has(w.id))).map((w) => (successor && e.facts.includes(w.id) && w.id === id ? successor : w)),
      facts: e.facts.filter((x) => !dead.has(x)),
    }))
    .filter((e) => e.op !== 'tell' || e.wires.length);
  this._do(() => { this.log = old; });
  this._event({ op: 'replace', id, removed });
  const rest = told.filter((w) => w !== successor);
  const entry = rest.length ? { op: 'tell', wires: rest, facts: facts.filter((x) => !successor || x !== id) } : null;
  const out = this._finish(mark, res, false, entry);
  out.removed = removed;
  return out;
};
