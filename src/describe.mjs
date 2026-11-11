// A summary of the world as plain data, for a host to turn into text or a screen, and
// the difference between two worlds. No prose is made here. Mixed into World.prototype.

import { str } from './parser.mjs';

const values = (w, key) => (w.attrs[key].length === 1 ? w.attrs[key][0] : [...w.attrs[key]]);

export const describing = {
  /**
   * { types, wires, open, assumed, issues, changes }.
   *   about   a wire id or a type: only that wire (and its neighbours up to `depth`), or the wires of that type
   *   depth   how many reference steps around `about` to include (default 1)
   *   since   only changes after this event number
   *   last    at most this many changes (default 20)
   */
  describe({ about, depth = 1, since = 0, last = 20 } = {}) {
    let chosen = null;
    if (about !== undefined) {
      const start = this.has(about) ? [this.resolve(about)] : [...(this.byType.get(about) || [])];
      chosen = new Set(start);
      let edge = start;
      for (let d = 0; d < depth && edge.length; d++) { // bounded: depth steps, each wire once
        const next = [];
        for (const id of edge) {
          const w = this._peek(id);
          const near = [...Object.values(w.attrs).flat().filter((v) => v[0] === '$').map((v) => this.resolve(v.slice(1))), ...(this.refs.get(id) || [])];
          for (const n of near) if (this.wires.has(n) && !chosen.has(n)) { chosen.add(n); next.push(n); }
        }
        edge = next;
      }
    }
    const inScope = (id) => !chosen || chosen.has(id);
    const types = {}, wires = {};
    for (const w of this.wires.values()) { // bounded: one pass over the wires
      if (!inScope(w.id) || w.type === 'core.issue') continue;
      const t = types[w.type] || (types[w.type] = { count: 0, instances: [] });
      t.count++;
      t.instances.push(w.id);
      const keys = {};
      for (const k of Object.keys(w.attrs)) keys[k] = { value: values(w, k), tier: this.tier(w.id, k) };
      wires[w.id] = { type: w.type, tier: this.tier(w.id), keys };
      if (w.meta.via) wires[w.id].via = w.meta.via;
    }
    const open = this.open().filter((o) => inScope(o.id));
    const assumed = this.assumptions().filter((a) => inScope(a.id)).map((a) => ({ id: a.id, key: a.key, ...(a.value === undefined ? {} : { value: a.value }), tier: a.tier, dependants: a.dependants.length }));
    const issues = this.ofType('core.issue')
      .map((i) => ({ id: i.id, rule: (i.attrs.rule || [])[0]?.slice(1), about: (i.attrs.about || []).map((v) => v.slice(1)), ...(i.attrs.key ? { key: i.attrs.key[0] } : {}), why: i.attrs.why ? str(i.attrs.why[0]) : undefined }))
      .filter((i) => !chosen || i.about.some((x) => chosen.has(x)));
    const touches = (e) => !chosen || [e.id, e.into, ...(e.ids || [])].some((x) => x !== undefined && chosen.has(this.resolve(x)));
    const changes = this.events.filter((e) => e.seq > since && touches(e)).slice(-last).map((e) => ({ ...e }));
    return { types, wires, open, assumed, issues, changes };
  },

  /** What is different in `other` compared with this world: wires added and removed, values changed (with their tiers). */
  diff(other) {
    const added = [], removed = [], changed = [];
    for (const w of other.wires.values()) if (!this.wires.has(w.id)) added.push({ id: w.id, type: w.type, tier: other.tier(w.id) }); // bounded: one pass
    for (const w of this.wires.values()) { // bounded: one pass
      const o = other.wires.peek ? other.wires.peek(w.id) : other.wires.get(w.id);
      if (!o) { removed.push({ id: w.id, type: w.type, tier: this.tier(w.id) }); continue; }
      for (const k of new Set([...Object.keys(w.attrs), ...Object.keys(o.attrs)])) {
        const a = w.attrs[k], b = o.attrs[k];
        const same = a && b && a.length === b.length && a.every((v, i) => v === b[i]);
        const ta = a ? this.tier(w.id, k) : undefined, tb = b ? other.tier(w.id, k) : undefined;
        if (same && ta === tb) continue;
        changed.push({ id: w.id, key: k, ...(a ? { from: values(w, k), fromTier: ta } : {}), ...(b ? { to: values(o, k), toTier: tb } : {}) });
      }
    }
    return { same: !added.length && !removed.length && !changed.length, added, removed, changed };
  },

  /** diff() restricted to some wire ids: what the events since a point say may have changed. */
  _diffOf(other, ids) {
    const added = [], removed = [], changed = [];
    const peek = (w, id) => (w.wires.peek ? w.wires.peek(id) : w.wires.get(id));
    for (const id of ids) { // bounded: the ids given
      const w = peek(this, id), o = peek(other, id);
      if (!w && o) { added.push({ id, type: o.type, tier: other.tier(id) }); continue; }
      if (w && !o) { removed.push({ id, type: w.type, tier: this.tier(id) }); continue; }
      if (!w) continue;
      for (const k of new Set([...Object.keys(w.attrs), ...Object.keys(o.attrs)])) {
        const a = w.attrs[k], b = o.attrs[k];
        const same = a && b && a.length === b.length && a.every((v, i) => v === b[i]);
        const ta = a ? this.tier(id, k) : undefined, tb = b ? other.tier(id, k) : undefined;
        if (same && ta === tb) continue;
        changed.push({ id, key: k, ...(a ? { from: values(w, k), fromTier: ta } : {}), ...(b ? { to: values(o, k), toTier: tb } : {}) });
      }
    }
    return { same: !added.length && !removed.length && !changed.length, added, removed, changed };
  },
};
