// Retraction and revision of assumptions. Mixed into World.prototype.
//
// Both are incremental: the affected wires, values and rule firings are withdrawn
// (World._unsay), the chase re-derives what still holds, and the result is validated.
// Everything happens in one transaction, so a refused retraction changes nothing.

// what two worlds share after fork(), until one of them changes
const STATE = ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'events', 'seq', 'stamp', '_clock', '_lastOrder', '_c', '_logOf', '_fills'];

import { parse, cloneWire } from './parser.mjs';
import { CowMap, layer, layerList, sealState, CHECK } from './cow.mjs';

// the maps and sets that get a copy-on-write layer when a world that shared them changes
const LAYERED = ['byType', 'index', 'refs', 'byWire', 'byRule', 'matrix', 'alias', 'used', 'firings', '_logOf'];

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
    const removed = this._adopt(next, 'retract');
    return { ok: true, removed, violations: [] };
  },

  /** Take over the state of a world that was rebuilt from (part of) this one's log. Returns the wire ids that are gone. */
  _adopt(next, op) {
    const before = new Set(this.wires.keys());
    if (this._shared) this._shared.holders--;
    for (const k of ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'seq', '_c', '_logOf', '_fills', '_lastOrder']) this[k] = next[k];
    this._shared = next._shared || null;
    this._pc = null;
    this.stamp = ++this._clock;
    const removed = [...before].filter((x) => !this.wires.has(x));
    this.events = [...this.events, { seq: this.seq, op, ids: removed }];
    this._emitted = this.events.length;
    for (const l of this.listeners) l([{ ...this.events.at(-1) }], this);
    return removed;
  },

  /**
   * Take back the last statement, or the last n: what was told, filled, revised or done
   * by an action, most recent first. A patch counts as one. The world is rebuilt from
   * the statements that remain, so everything that followed from the undone ones goes
   * too. Returns { ok, undone, removed, added, changed }: the statements taken back and
   * what that did to the world. (A retraction is not a statement and is not undone by
   * this; for an exact earlier state use mark and rewind.)
   */
  undo(n = 1, opts = {}) {
    return this._guard(opts, () => {
      const steps = [];
      for (let i = this.log.length - 1; i >= 0 && steps.length < n;) { // bounded: the log, from the end
        let j = i;
        while (this.log[i].group !== undefined && j > 0 && this.log[j - 1].group === this.log[i].group) j--; // bounded: one patch
        steps.push({ from: j, to: i });
        i = j - 1;
      }
      if (!steps.length) return { ok: false, undone: [], removed: [], added: [], changed: [], violations: [{ kind: 'nothing-to-undo', why: 'nothing has been told' }] };
      const keep = steps.at(-1).from;
      const next = new this.constructor(this.options);
      const refused = next._replay(this.log.slice(0, keep));
      if (refused) return { ok: false, undone: [], removed: [], added: [], changed: [], violations: refused.violations };
      const was = this.fork();
      const undone = this.log.slice(keep).reverse().map((e) => (e.op === 'tell' ? { op: 'tell', ids: e.wires.map((w) => w.id) } : { op: e.op, id: e.id, key: e.key, value: e.value }));
      this._adopt(next, 'undo');
      const d = was.diff(this);
      return { ok: true, undone, removed: d.removed.map((x) => x.id), added: d.added.map((x) => x.id), changed: d.changed, violations: [] };
    }, (v) => ({ ok: false, undone: [], removed: [], added: [], changed: [], violations: [v] }));
  },

  /**
   * A point to come back to. The mark holds the world as it is now (it shares the state,
   * so it costs nothing until the world changes). world.rewind(mark) makes the world
   * exactly that again, whatever happened in between, and may be used more than once.
   */
  mark() { return { world: this.fork(), seq: this.seq }; },

  rewind(mark) {
    if (!mark || !mark.world || typeof mark.world.fork !== 'function') throw new Error('sopworld: rewind needs a mark from world.mark()');
    if (this._tx) throw new Error('sopworld: rewind inside a transaction');
    const was = this.fork();
    const copy = mark.world.fork();
    const events = this.events;
    this._adopt(copy, 'rewind');
    this.events = [...events, { seq: this.seq, op: 'rewind', to: mark.seq }];
    this._emitted = this.events.length;
    const d = was.diff(this);
    return { ok: true, removed: d.removed.map((x) => x.id), added: d.added.map((x) => x.id), changed: d.changed };
  },

  /**
   * An independent copy that costs nothing until one of the two worlds changes: both keep
   * using the same state, and each one, at its first change, puts a layer on top of it
   * (src/cow.mjs) and writes there. Only what a change touches is copied. Listeners are
   * not carried over.
   */
  fork() {
    const copy = new this.constructor(this.options);
    const share = this._shared || (this._shared = { holders: 1 });
    share.holders++;
    if (this.wires instanceof CowMap) this.wires.frozen = true; // nobody writes it again, not even a read that copies
    for (const k of STATE) copy[k] = this[k];
    copy._shared = share;
    copy._emitted = copy.events.length;
    if (CHECK) sealState(this);
    return copy;
  },

  /** Stop sharing: put a fresh layer on every structure; the shared state is never written again. */
  _detach() {
    const share = this._shared;
    this._shared = null;
    share.holders--;
    this._mine = new WeakSet(); // the index sets this world made or copied since then, and may change in place
    this.wires = layer(this.wires, { wires: true });
    for (const k of LAYERED) this[k] = layer(this[k]);
    this.events = layerList(this.events);
    this._pc = null; // the log is copied when it is first appended to (_logPush): it is short
  },

  /**
   * Defaults are assumptions. When a change is refused and default fills are involved in
   * the refusal, withdraw those defaults (and what followed from them) and try again.
   */
  // bounded: calls itself once, with broad = true
  _retryWithoutDefaults(r, redo, opts, broad = false) {
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
    // A conflict on one key is settled by what that value rests on; any other refusal by
    // everything assumed on the wires involved. If the narrow way does not do, the broad one is tried.
    const exact = [];
    for (const v of r.violations) {
      if (!broad && v.kind === 'conflict' && v.id && v.key && this.has(v.id) && !v.event) exact.push(...this._weakBasis(this.resolve(v.id), v.key));
      else { if (v.id) visit(v.id); for (const x of v.wires || []) visit(x); }
    }
    const drop = [], wires = [], weak = new Map();
    for (const cell of exact) {
      if (cell.key === null) { if (!wires.includes(cell.id)) { wires.push(cell.id); weak.set(cell.id, cell.tier); } }
      else if (!drop.some((d) => d.id === cell.id && d.key === cell.key)) drop.push({ id: cell.id, key: cell.key, value: cell.value, tier: cell.tier });
    }
    for (const id of involved) {
      const w = this.wires.get(id);
      // a wire that was itself only assumed (an adopted explanation) gives way as a whole
      if (w?.meta.told && w.meta.tier && this._rank(w.meta.tier) > this._rank('derived')) { wires.push(id); weak.set(id, w.meta.tier); continue; }
      for (const f of this.wires.get(id)?.meta.fills || []) {
        if (this._weakFill(f) && !drop.some((d) => d.id === id && d.key === f.key)) drop.push({ id, key: f.key, value: f.value, tier: f.tier || this.tier(id, f.key) });
      }
    }
    if (!drop.length && !wires.length) return broad ? r : this._retryWithoutDefaults(r, redo, opts, true);

    const res = this._result();
    const mark = this._begin(!opts.dry);
    let r2;
    try {
      const gone = this._withdraw(res, wires, drop);
      if (wires.length) this._logRemove(new Set([...wires, ...(gone || [])].filter((x) => !this.wires.has(x))));
      if (!res.violations.length) this._validate(res);
      if (res.violations.length) { this._rollback(mark); return broad ? r : this._retryWithoutDefaults(r, redo, opts, true); }
      if (this._fills) {
        const old = this.log, fills = this._fills;
        this.log = old.filter((e) => !(e.op === 'fill' && this._weakFill(e) && drop.some((d) => d.id === this.resolve(e.id) && d.key === e.key)));
        this._fills -= old.length - this.log.length;
        this._do(() => { this.log = old; this._fills = fills; });
      }
      for (const id of wires) drop.push({ id, tier: weak.get(id) });
      this._event({ op: 'revise', dropped: drop });
      r2 = redo({ ...opts, dry: false });
    } catch (e) {
      this._rollback(mark);
      throw e;
    }
    if (!r2.ok) { this._rollback(mark); return broad ? r : this._retryWithoutDefaults(r, redo, opts, true); }
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
