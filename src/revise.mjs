// Retraction and revision of assumptions. Mixed into World.prototype.
//
// Both are incremental: the affected wires, values and rule firings are withdrawn
// (World._unsay), the chase re-derives what still holds, and the result is validated.
// Everything happens in one transaction, so a refused retraction changes nothing.

// what two worlds share after fork(), until one of them changes
const STATE = ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'events', 'seq', 'stamp', '_clock', '_lastOrder', '_c', '_logOf', '_fills', '_nsUsed', '_version'];

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
    res._touchedChange = true;
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
          // a reference held by a kind=ref slot is integrity: the retraction is refused, not spread
          const c = this._compiled();
          const held = w.meta.told && Object.keys(w.attrs).find((k) => w.attrs[k].includes('$' + x) && c.slotOf(w.type, k)?.ref);
          if (held) {
            const s = c.slotOf(w.type, held), v = { kind: 'dangling-ref', id: r, key: held, value: '$' + x, why: `${r} still refers to ${x}` };
            res.violations.push(s.why ? this._slotWhy(s, w, held, '$' + x, v) : v);
            continue;
          }
          if (w.meta.told) next.add(r); else res._touched.add(r);
        }
      }
      if (res.violations.length) break;
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
  _adopt(next, op, gone = null) {
    const before = gone ? null : new Set(this.wires.keys());
    if (this._shared) this._shared.holders--;
    for (const k of ['wires', 'byType', 'index', 'refs', 'matrix', 'alias', 'used', 'firings', 'byWire', 'byRule', 'log', 'seq', '_c', '_logOf', '_fills', '_lastOrder', '_nsUsed']) this[k] = next[k];
    this._shared = next._shared || null;
    this._pc = null;
    this.stamp = ++this._clock;
    this._version = next._version; // a rebuilt world is new content (a rewind takes the mark's)
    const removed = gone ? gone.filter((x) => !this.wires.has(x)) : [...before].filter((x) => !this.wires.has(x));
    // rebuilt: the world was replaced as a whole, so the events before this one do not say
    // what changed (rewind then compares everything)
    this.events = layerList(this.events); // shared with what came before, not copied
    this.events.push({ seq: this.seq, op, ids: removed, rebuilt: true });
    this._emitted = this.events.length;
    for (const l of this.listeners) l([{ ...this.events.at(-1) }], this);
    return removed;
  },

  /**
   * Take back the last statement, or the last n: what was told, filled, revised or done
   * by an action, most recent first. A patch counts as one. A statement that only told
   * or changed wires of transient types (a selection, a cursor) does not count and is
   * not taken back: it is told again after the others are gone, if it still can be. The
   * world is rebuilt from the statements that remain, so everything that followed from
   * the undone ones goes too. Returns { ok, undone, removed, added, changed }. What was
   * undone can be told again with redo(). (A retraction is not a statement and is not
   * undone by this; for an exact earlier state use mark and rewind.)
   */
  undo(n = 1, opts = {}) {
    return this._guard(opts, () => {
      const steps = this._steps();
      const undoing = [], kept = [];
      let i = steps.length - 1;
      for (; i >= 0 && undoing.length < n; i--) (steps[i].transient ? kept : undoing).unshift(steps[i]); // bounded: the steps
      if (!undoing.length) return { ok: false, undone: [], removed: [], added: [], changed: [], violations: [{ kind: 'nothing-to-undo', why: 'nothing has been told' }] };
      const keep = undoing[0].from;
      const next = new this.constructor(this.options);
      const refused = next._replay(this.log.slice(0, keep));
      if (refused) return { ok: false, undone: [], removed: [], added: [], changed: [], violations: refused.violations };
      for (const st of kept) next._replay(this.log.slice(st.from, st.to + 1)); // transient state after them, where it still fits
      const was = this.fork();
      const entries = undoing.flatMap((st) => this.log.slice(st.from, st.to + 1));
      const undone = [...entries].reverse().map((e) => (e.op === 'tell' ? { op: 'tell', ids: e.wires.map((w) => w.id) } : { op: e.op, id: e.id, key: e.key, value: e.value }));
      const redo = this._redo || [];
      this._adopt(next, 'undo');
      this._redo = [...redo, entries];
      const d = was.diff(this);
      return { ok: true, undone, removed: d.removed.map((x) => x.id), added: d.added.map((x) => x.id), changed: d.changed, violations: [] };
    }, (v) => ({ ok: false, undone: [], removed: [], added: [], changed: [], violations: [v] }));
  },

  /**
   * Tell again what the last undo (or the last n) took back, as the statements they were.
   * Any new statement that is not transient makes what was undone final. Returns
   * { ok, redone, removed, added, changed, violations }.
   */
  redo(n = 1, opts = {}) {
    return this._guard(opts, () => {
      const stack = this._redo || [];
      if (!stack.length) return { ok: false, redone: [], removed: [], added: [], changed: [], violations: [{ kind: 'nothing-to-redo', why: 'nothing has been undone since the last statement' }] };
      const groups = stack.slice(-n).reverse();
      const was = this.fork();
      const back = { world: this.fork(), seq: this.seq }; // not an open mark: only to go back if a group is refused
      this._redoing = true;
      let refused = null;
      try {
        for (const entries of groups) { refused = this._replay(entries); if (refused) break; } // bounded: the undone groups
      } finally { this._redoing = false; }
      if (refused) {
        this.rewind(back);
        this._redo = stack;
        return { ok: false, redone: [], removed: [], added: [], changed: [], violations: refused.violations };
      }
      this._redo = stack.slice(0, stack.length - groups.length);
      const redone = groups.flat().map((e) => (e.op === 'tell' ? { op: 'tell', ids: e.wires.map((w) => w.id) } : { op: e.op, id: e.id, key: e.key, value: e.value }));
      const d = was.diff(this);
      return { ok: true, redone, removed: d.removed.map((x) => x.id), added: d.added.map((x) => x.id), changed: d.changed, violations: [] };
    }, (v) => ({ ok: false, redone: [], removed: [], added: [], changed: [], violations: [v] }));
  },

  /**
   * Make a collection of told wires equal to a given list, in one transaction: the
   * collection is the told facts of a type (and its subtypes), or with { prefix } those
   * whose id starts with it. A given wire whose id is new is told; one whose content
   * differs from what was told replaces it in place; one that is the same is left; a
   * wire of the collection that is not in the list is retracted. Returns the change
   * result with { told, replaced, retracted, same } (ids).
   */
  sync(collection, input, opts = {}) {
    return this._guard(opts, () => {
      const c = this._compiled();
      const { type, prefix } = typeof collection === 'string' ? { type: collection } : collection || {};
      if (!type && !prefix) throw new Error('sync: name a type, or { prefix }');
      const ns = opts.raw ? undefined : opts.ns ?? this.options.ns; // raw: the ids are as given
      const given = (typeof input === 'string' ? parse(input) : input || []).map(cloneWire);
      if (!opts.raw) this._qualifyFacts(given, ns);
      const stated = new Map(this.told().map((w) => [w.id, w]));
      // in a namespace, the collection is that namespace's part of it
      const inside = (w) => (type ? c.isA(w.type, type) : w.id.startsWith(prefix)) && (ns === undefined || this._nsOf(w.id) === (ns || ''));
      const ids = new Set(given.map((w) => w.id));
      const out = { told: [], replaced: [], retracted: [], same: [] };
      const patch = { wires: [], replace: [], retract: [] };
      const sameContent = (a, b) => {
        const ka = Object.keys(a.attrs), kb = Object.keys(b.attrs);
        return a.type === b.type && ka.length === kb.length && ka.every((k) => b.attrs[k] && a.attrs[k].length === b.attrs[k].length && a.attrs[k].every((v, i) => v === b.attrs[k][i]));
      };
      for (const w of given) { // bounded: the given list
        const old = stated.get(w.id);
        if (!old) { patch.wires.push(w); out.told.push(w.id); } else if (sameContent(old, w)) out.same.push(w.id);
        else { patch.replace.push({ id: w.id, type: w.type, attrs: w.attrs }); out.replaced.push(w.id); }
      }
      for (const w of stated.values()) if (inside(w) && !ids.has(w.id)) { patch.retract.push(w.id); out.retracted.push(w.id); } // bounded: the told wires
      if (!patch.wires.length && !patch.replace.length && !patch.retract.length) return { ok: true, added: [], derived: [], filled: [], merged: [], removed: [], violations: [], ...out };
      const r = this._patch(patch, { strict: opts.strict, tier: opts.tier });
      return r.ok ? { ...r, ...out } : r;
    }, (v) => this._refusal(v));
  },

  /** The log as statements: { from, to, transient } (a patch is one statement). */
  _steps() {
    const transient = (e) => this._transientEntry(e);
    const out = [];
    for (let i = 0; i < this.log.length; i++) { // bounded: the log
      let j = i;
      while (this.log[i].group !== undefined && this.log[j + 1]?.group === this.log[i].group) j++; // bounded: one patch
      out.push({ from: i, to: j, transient: this.log.slice(i, j + 1).every(transient) });
      i = j;
    }
    return out;
  },

  /**
   * A point to come back to. The mark holds the world as it is now (it shares the state,
   * so it costs nothing until the world changes). world.rewind(mark) makes the world
   * exactly that again, whatever happened in between, and may be used more than once.
   */
  mark(label) {
    const m = { world: this.fork(), seq: this.seq, ...(label !== undefined ? { label: String(label) } : {}) };
    (this._marks ||= []).push(m);
    return m;
  },

  /** The open marks, oldest first: { label, seq, mark }. A rewind closes the marks made after the one it goes back to. */
  marks() { return (this._marks || []).map((m) => ({ label: m.label, seq: m.seq, mark: m })); },

  /**
   * Make the world what it was at the mark. What the rewind takes back is kept, as after
   * undo(): redo() tells it again, as one step, until the next statement (when the mark is
   * on the way of the log: an undo past the mark leaves nothing to redo). With { only },
   * one unit (the told wires of a type or an id prefix) is put back, as one statement;
   * redo() then puts the unit back as it was before the rewind.
   */
  rewind(mark, { only } = {}) {
    if (!mark || !mark.world || typeof mark.world.fork !== 'function') throw new Error('sopworld: rewind needs a mark from world.mark()');
    if (this._tx) throw new Error('sopworld: rewind inside a transaction');
    if (only) {
      // one unit only: the told wires of a type (or an id prefix) become what they were at
      // the mark, everything else stays; one transaction, like sync
      const coll = typeof only === 'string' ? { type: only } : only;
      const c = this._compiled();
      const inside = (w) => (coll.type ? c.isA(w.type, coll.type) : w.id.startsWith(coll.prefix));
      const before = this.told().filter(inside);
      const r = this.sync(coll, mark.world.told().filter(inside), { raw: true });
      if (r.ok && (r.retracted.length || r.told.length || r.replaced.length)) {
        // redo() puts the unit back as it was: the statements that would, computed on a fork
        const f = this.fork();
        f.sync(coll, before, { raw: true });
        const entries = f.log.slice(this.log.length);
        if (entries.length) this._redo = [...(this._redo || []), entries];
      }
      return { ok: r.ok, removed: r.retracted || [], added: r.told || [], changed: r.replaced || [], violations: r.violations };
    }
    const at = (this._marks || []).indexOf(mark);
    if (at >= 0) this._marks = this._marks.slice(0, at + 1);
    // what the rewind takes back, when the mark is on the way of the log: redo() tells it again
    const L = mark.world.log.length;
    const back = L < this.log.length && this._startsWith(mark.world.log) ? this.log.slice(L) : null;
    const was = this.fork();
    const copy = mark.world.fork();
    const events = this.events;
    // what changed since the mark is named by the events since then, unless the world was
    // rebuilt in between (undo, a retraction by replay): then everything is compared
    const n0 = mark.world.events.length;
    let touched = null;
    if (events.length >= n0) {
      const since = events.slice(n0);
      if (!since.some((e) => e.rebuilt)) {
        touched = new Set();
        for (const e of since) for (const x of [e.id, e.into, ...(e.ids || [])]) if (x) touched.add(x); // bounded: the events since the mark
      }
    }
    this._adopt(copy, 'rewind', touched ? [...touched] : null);
    if (back) this._redo = [...(this._redo || []), back];
    this.events = layerList(events);
    this.events.push({ seq: this.seq, op: 'rewind', to: mark.seq, ...(touched ? {} : { rebuilt: true }) });
    this._emitted = this.events.length;
    const d = touched ? was._diffOf(this, touched) : was.diff(this);
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
      // values that a statement told with a weaker tier of their own (tell(text, { tier: { key } }))
      const keyed = drop.filter((d) => d.key && this.wires.get(d.id)?.meta.keyTiers?.[d.key]);
      for (const d of keyed) {
        const w = this.wires.get(d.id), kt = w.meta.keyTiers;
        w.meta.keyTiers = { ...kt };
        delete w.meta.keyTiers[d.key];
        this._do(() => { w.meta.keyTiers = kt; });
      }
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
      if (keyed.length) {
        // and out of the statement that told them, so that the log tells what holds
        const old = this.log, before = new Map();
        this.log = old.map((e) => {
          if (e.op !== 'tell') return e;
          const hits = keyed.filter((d) => e.facts.includes(d.id));
          if (!hits.length) return e;
          const wires = e.wires.map((w) => {
            const mine = hits.filter((d) => d.id === w.id);
            if (!mine.length) return w;
            const attrs = { ...w.attrs };
            for (const d of mine) for (const k of Object.keys(attrs)) {
              if (this._compiled().shortKey(w.type, k) !== d.key) continue;
              attrs[k] = attrs[k].filter((v) => v !== d.value);
              if (!attrs[k].length) delete attrs[k];
            }
            return { ...w, attrs };
          });
          const next = { ...e, wires };
          for (const id of e.facts) { before.set(id, this._logOf.get(id)); this._logOf.set(id, next); }
          return next;
        });
        this._do(() => { this.log = old; for (const [id, e] of before) this._logOf.set(id, e); });
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
  // a bare id in the replacement belongs to the namespace of the wire it replaces
  const wires = this._qualifyFacts((typeof input === 'string' ? parse(input) : input).map(cloneWire), this._nsOf(id) || undefined);
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
  res._touchedChange = true;
  const rest = told.filter((w) => w !== successor);
  const entry = rest.length ? { op: 'tell', wires: rest, facts: facts.filter((x) => !successor || x !== id) } : null;
  const out = this._finish(mark, res, false, entry);
  out.removed = removed;
  return out;
};
