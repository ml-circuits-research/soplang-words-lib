// Order and state over time. Mixed into World.prototype.
//
// Sequence. Every wire has a place in a sequence: the number under the key declared with
// `core.sequence key=<key>` when the wire carries it, else the place the last such wire
// had; ties are broken by arrival. world.compare(a, b), the tests `before` and `after`,
// and the pattern selector `core.select=latest|first` read it.
//
// Fluents. `core.fluent of=<type> key=<key>` declares a key as a state that events
// change, and `core.effect on=<event type> fluent=$f op=add|sub|set|<fn> amount=<event key>`
// says how. The value on the wire is always the current one: the last explicit statement,
// then the effects of the later events in sequence order. An unknown start stays unknown.
//
// As-of. world.asOf(at, fn), ask(pattern, { at }) and query(q, { at }) see the world as it
// was at that point of the sequence.

import { quantity } from './builtins.mjs';

const K = (type, key, value) => `${type}\u0001${key}\u0001${value}`;

export const timing = {
  /** The sequence moves on to the place a wire declares. Returns that place, or NaN when it declares none. */
  _advance(w) {
    const key = this._compiled().seqKey;
    const declared = key && w.attrs[key] ? Number(w.attrs[key][0]) : NaN;
    if (Number.isFinite(declared) && declared > (this._lastOrder ?? -Infinity)) {
      const prev = this._lastOrder;
      this._lastOrder = declared;
      this._do(() => { this._lastOrder = prev; });
    }
    return declared;
  },

  /** Give a new wire its place in the sequence. */
  _stamp(w) {
    const declared = this._advance(w);
    w.meta.order = Number.isFinite(declared) ? declared : this._compiled().seqKey ? this._lastOrder ?? 0 : w.meta.seq;
  },

  /** The key that carries the sequence changed: give every wire its place again, in order of arrival. */
  _restamp() {
    const before = [...this.wires.keys()].map((id) => this.wires.get(id)).map((w) => [w, w.meta.order]); // get(): the world's own copies, to change
    const last = this._lastOrder;
    this._lastOrder = undefined;
    this._do(() => { this._lastOrder = last; });
    for (const [w, old] of before.sort((x, y) => x[0].meta.seq - y[0].meta.seq)) { // bounded: one pass over the wires
      this._stamp(w);
      const order = w.meta.order;
      // what the wire stated about its fluents when it arrived moves with it
      const moved = Object.values(w.meta.stated || {}).flat().filter((e) => e.seq === w.meta.seq && e.order === old);
      for (const e of moved) e.order = order;
      this._do(() => { w.meta.order = old; for (const e of moved) e.order = old; });
    }
  },

  /** The place of a wire in the sequence (the declared number, or its arrival number). */
  seqOf(id) { return this._peek(id)?.meta.order; },

  /**
   * Negative when wire a comes before wire b in the sequence, positive when after. Facts of
   * a host's provider have no place in it: they come before the world's wires, by id.
   */
  compare(a, b) {
    const x = this._peek(a).meta, y = this._peek(b).meta;
    if (x.external || y.external) return x.external && y.external ? (a < b ? -1 : a > b ? 1 : 0) : x.external ? -1 : 1;
    return x.order - y.order || x.seq - y.seq;
  },

  // ---------------------------------------------------------------- fluents

  /** A wire arrived: remember what it states about a fluent, and mark what it may change. */
  _fluentNote(w, res) {
    const c = this._compiled();
    if (!c.fluents.size) return;
    for (const f of c.forType(c.fluentsByType, w.type)) {
      if (w.attrs[f.key] && !w.meta.stated?.[f.key]) this._state(w, f.key, w.attrs[f.key][0], w.meta.order, w.meta.seq);
    }
    this._fluentTouch(w, res, true);
  },

  _state(w, key, value, order, seq) {
    const list = ((w.meta.stated ||= {})[key] ||= []);
    const entry = { order, seq, value };
    list.push(entry);
    this._do(() => list.splice(list.indexOf(entry), 1));
  },

  /** A told value for a fluent key of an existing wire is a new statement at the current point. */
  _fluentState(w, key, value, res) {
    const c = this._compiled();
    if (!c.fluents.size) return false;
    const f = c.forType(c.fluentsByType, w.type).find((x) => x.key === key);
    if (!f) return false;
    const seq = this._event({ op: 'state', id: w.id, key, value });
    this._state(w, key, value, this._c.seqKey ? this._lastOrder ?? 0 : seq, seq);
    res._fluents.set(`${w.id}\u0001${f.id}`, 'full');
    res._touched.add(w.id);
    return true;
  },

  /**
   * Mark the fluents that a change to this wire can affect: its own, and those of the
   * holders it is an event for. `arrived` says the wire is a new event: if it turns out
   * to be the last in sequence, its effect is applied to the current value directly.
   */
  _fluentTouch(w, res, arrived = false) {
    const c = this._c;
    if (!c || !c.fluents.size) return;
    for (const f of c.forType(c.fluentsByType, w.type)) res._fluents.set(`${w.id}\u0001${f.id}`, 'full');
    for (const e of c.forType(c.effectsByEvent, w.type)) {
      for (const h of this._holders(e, w)) {
        const k = `${h}\u0001${e.fluent.id}`;
        res._fluents.set(k, arrived && !res._fluents.has(k) ? w.id : 'full');
      }
    }
  },

  /** The wires whose fluent an event changes. */
  _holders(e, ev) {
    if (e.target) return (ev.attrs[e.target] || []).filter((v) => v[0] === '$').map((v) => this.resolve(v.slice(1)));
    const [key, from] = e.where[0];
    const value = ev.attrs[from]?.[0];
    if (value === undefined) return [];
    return [...(this.index.get(K(e.fluent.of, key, value)) || [])].filter((id) => {
      const h = this.wires.get(id);
      return e.where.every(([k, f]) => h.attrs[k]?.[0] !== undefined && h.attrs[k][0] === ev.attrs[f]?.[0]);
    });
  },

  /** The events that change the fluent of one holder through one effect. */
  _events(e, h) {
    if (e.target) return [...(this.index.get(K(e.on, e.target, '$' + h.id)) || [])];
    const [key, from] = e.where[0];
    const value = h.attrs[key]?.[0];
    if (value === undefined) return [];
    return [...(this.index.get(K(e.on, from, value)) || [])].filter((id) => {
      const ev = this.wires.get(id);
      return e.where.every(([k, f]) => h.attrs[k]?.[0] !== undefined && h.attrs[k][0] === ev.attrs[f]?.[0]);
    });
  },

  /** One effect applied to a value: the new value, undefined when it does not apply, or a conflict. */
  _effect(e, ev, value, h, f, slot, res) {
    const amount = e.value !== undefined ? e.value : ev.attrs[e.amount]?.[0];
    if (amount === undefined) return undefined;
    let next;
    if (e.op === 'set') next = amount;
    else if (value === undefined) return undefined; // an unknown start stays unknown
    else next = this._call(e.op, [value, amount]);
    if (next === undefined || next === null) return undefined;
    next = this._round(String(next));
    const q = quantity(next);
    const broken = q && slot && !slot.soft ? (slot.min && q.n < slot.min.n ? `below ${slot.min.n}` : slot.max && q.n > slot.max.n ? `above ${slot.max.n}` : null) : null;
    if (broken) {
      res.violations.push({ kind: 'conflict', id: h.id, key: f.key, value: next, event: ev.id, wires: [h.id, ev.id], why: `${ev.id} would take ${f.key} of ${h.id} ${broken} (from ${value} to ${next})` });
      return null;
    }
    return next;
  },

  _fluentSet(h, f, value, from, last, res) {
    const current = h.attrs[f.key]?.[0];
    // where the line ended: lets the next event that comes after it be applied on its own
    const tails = (h.meta.tails ||= {});
    tails[f.key] = last;
    if (value === current) return;
    if (current !== undefined) this._unsay(res, [], [{ id: h.id, key: f.key, value: current }]);
    // it rests on the events that moved it, and on what was last stated
    if (value !== undefined) this._addValue(h, f.key, value, { via: f.id, from, cells: [...from.map((id) => [id, null]), ...(h.meta.stated?.[f.key]?.length ? [[h.id, null]] : [])] }, res);
    res._fluents.delete(`${h.id}\u0001${f.id}`); // writing the value marked it again: it is up to date
  },

  /** Recompute one marked fluent: the last statement, then the effects after it, in sequence order. */
  _fluentRun(res, c) {
    const [mark, cause] = res._fluents.entries().next().value;
    res._fluents.delete(mark);
    const [hid, fid] = mark.split('\u0001');
    const h = this.wires.get(hid), f = c.fluents.get(fid);
    if (!h || !f) return;
    const slot = c.slotOf(h.type, f.key);

    // one new event that comes after everything applied so far: apply it to the current value
    const tail = h.meta.tails?.[f.key];
    const ev0 = cause !== 'full' ? this.wires.get(cause) : null;
    if (ev0 && tail && !f.delta && (ev0.meta.order - tail.order || ev0.meta.seq - tail.seq) > 0) {
      const effects = f.effects.filter((e) => c.isA(ev0.type, e.on) && this._holders(e, ev0).includes(h.id));
      if (effects.length === 1) {
        const current = h.attrs[f.key]?.[0];
        const next = this._effect(effects[0], ev0, current, h, f, slot, res);
        if (next === null) return;
        const last = { order: ev0.meta.order, seq: ev0.meta.seq };
        if (next === undefined) { (h.meta.tails ||= {})[f.key] = last; return; }
        // provenance: the events that changed the value since it was last set
        const fill = (h.meta.fills || []).find((x) => x.key === f.key && x.value === current && x.via === f.id);
        this._fluentSet(h, f, next, effects[0].op === 'set' ? [ev0.id] : [...(fill?.from || []), ev0.id], last, res);
        return;
      }
    }

    const line = (h.meta.stated?.[f.key] || []).map((s) => ({ order: s.order, seq: s.seq, set: s.value }));
    for (const e of f.effects) {
      for (const id of this._events(e, h)) { // bounded: the events of one holder
        const ev = this.wires.get(id);
        line.push({ order: ev.meta.order, seq: ev.meta.seq, e, ev });
      }
    }
    line.sort((a, b) => a.order - b.order || a.seq - b.seq);
    let value, from = [];
    // the known change since the last statement: what add and sub effects amount to, even when the start is unknown
    let delta, deltaFrom = [];
    for (const step of line) {
      this._b.tick('fluent');
      if (step.set !== undefined) { value = step.set; from = []; delta = undefined; deltaFrom = []; continue; }
      if (f.delta) {
        const amount = step.e.value !== undefined ? step.e.value : step.ev.attrs[step.e.amount]?.[0];
        if (step.e.op === 'set') { delta = undefined; deltaFrom = []; }
        else if (amount !== undefined && (step.e.op === 'add' || step.e.op === 'sub')) {
          const signed = step.e.op === 'add' ? amount : this.fns.mul([amount, '-1'], this);
          delta = delta === undefined ? signed : this.fns.add([delta, signed], this);
          deltaFrom.push(step.ev.id);
        }
      }
      const next = this._effect(step.e, step.ev, value, h, f, slot, res);
      if (next === null) return;
      if (next === undefined || next === value) continue; // an event that changes nothing is not a source
      value = next;
      if (step.e.op === 'set') from = [step.ev.id]; else from.push(step.ev.id);
    }
    const end = line[line.length - 1];
    const last = end ? { order: end.order, seq: end.seq } : null;
    if (f.delta) this._fluentSet(h, { id: f.id, key: f.delta }, delta === undefined ? undefined : this._round(String(delta)), deltaFrom, last, res);
    this._fluentSet(h, f, value, from, last, res);
  },

  // ---------------------------------------------------------------- as-of

  /**
   * Run fn against the world as it was at a point of the sequence: wires told after it,
   * statements made after it, and everything that rested on them are set aside, then
   * restored. `at` is a number of the declared sequence key, or an arrival number (seqOf).
   */
  asOf(at, fn, opts = {}) {
    return this._guard(opts, () => this._asOf(at, fn), () => undefined);
  },

  _asOf(at, fn) {
    return this._trial(() => {
      const res = this._result();
      const later = [];
      for (const seen of this.wires.values()) { // bounded: one pass over the wires
        if (seen.meta.told && seen.meta.order > at) later.push(seen.id);
        else if (seen.meta.stated) {
          for (const key of Object.keys(seen.meta.stated)) {
            if (!seen.meta.stated[key].some((s) => s.order > at)) continue;
            const w = this.wires.get(seen.id); // the world's own copy, to change (iteration may give a shared one)
            const list = w.meta.stated[key];
            const gone = list.filter((s) => s.order > at);
            for (const s of gone) { list.splice(list.indexOf(s), 1); this._do(() => list.push(s)); }
            this._fluentTouch(w, res);
          }
        }
      }
      this._withdraw(res, later, []);
      if (res._fluents.size) this._chase(res);
      return fn(this);
    });
  },
};
