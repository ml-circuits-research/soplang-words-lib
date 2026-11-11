// Certainty. Every value has a tier that says how it got into the world:
//
//   told      somebody said it
//   derived   it follows from told values
//   forced    the only value its domain had left
//   default   the slot's default, taken as an assumption
//   guessed   chosen by a search, or an explanation that was adopted
//
// strongest first. A value that follows from others takes the weakest tier among them
// (and is never stronger than `derived`). The tiers are ranks, not probabilities. A host
// may add its own with `@t core.tier name=<name> below=<tier> cost=<n>` and state a tier
// when it tells or fills: tell(text, { tier }). Mixed into World.prototype.

export const TIERS = ['told', 'derived', 'forced', 'default', 'guessed'];

// how a value was written when nobody stated a tier
const VIA = { 'core.tell': 'told', 'core.complete': 'forced', 'core.default': 'default', 'core.choose': 'guessed', 'core.assume': 'guessed', 'core.search': 'guessed' };

export const tiering = {
  _rank(name) {
    const i = this._compiled().tiers.indexOf(name);
    return i < 0 ? this._compiled().tiers.indexOf('guessed') : i;
  },

  _knownTier(name) {
    if (name !== undefined && !this._compiled().tiers.includes(name)) throw new Error(`sopworld: unknown tier "${name}" (declare it with core.tier)`);
    return name;
  },

  /** The record of how a value was filled, if it was filled after the wire arrived. */
  _fillOf(w, key) {
    const value = w.attrs[key]?.[0];
    return value === undefined ? undefined : (w.meta.fills || []).find((f) => f.key === key && f.value === value);
  },

  /** Where a cell comes from: a tier of its own, or the cells it was derived from. `key` null is the wire itself. */
  _origin(w, key) {
    if (key !== null && key !== undefined) {
      if (!w.attrs[key]) return null;
      const fill = this._fillOf(w, key);
      if (fill) {
        if (fill.tier) return { tier: fill.tier };
        if (VIA[fill.via]) return { tier: VIA[fill.via] };
        return { cells: fill.cells || (fill.from || []).map((id) => [id, null]), via: fill.via };
      }
    }
    // the value came with the wire: it is as solid as the wire
    if (w.meta.tier) return { tier: w.meta.tier, whole: true };
    if (w.meta.told) return { tier: 'told', whole: true };
    return { cells: w.meta.cells || (w.meta.from || []).map((id) => [id, null]), via: w.meta.via };
  },

  /** Walk a cell down to the values it rests on. Returns { rank, basis: Map("id key" -> cell) }. */
  // bounded: each cell is computed once (memo)
  _rests(id, key, memo) {
    const name = `${id}\u0001${key ?? ''}`;
    const done = memo.get(name);
    if (done) return done;
    const out = { rank: this._rank('derived'), basis: new Map() };
    memo.set(name, out); // a cycle counts as derived
    const w = this._peek(id);
    const o = w && this._origin(w, key);
    if (!o) return out;
    if (o.tier) {
      out.rank = this._rank(o.tier);
      if (o.whole) out.basis.set(`${w.id}\u0001`, { id: w.id, key: null, tier: o.tier });
      else out.basis.set(name, { id: w.id, key, value: w.attrs[key][0], tier: o.tier });
      return out;
    }
    for (const [cid, ckey] of o.cells) {
      const s = this._rests(this.resolve(cid), ckey, memo);
      if (s.rank > out.rank) out.rank = s.rank;
      for (const [k, v] of s.basis) out.basis.set(k, v);
    }
    return out;
  },

  /** The tier of a value (or of a wire, without a key): how solid it is. */
  tier(id, key) {
    const w = this._peek(id);
    if (!w || (key !== undefined && key !== null && !w.attrs[this._compiled().shortKey(w.type, key)])) return undefined;
    const k = key === undefined || key === null ? null : this._compiled().shortKey(w.type, key);
    return this._compiled().tiers[this._rests(w.id, k, new Map()).rank];
  },

  /** What a value rests on that is weaker than derived: the assumptions under it, weakest first. */
  _weakBasis(id, key, memo = new Map()) {
    const floor = this._rank('derived');
    return [...this._rests(id, key, memo).basis.values()].filter((c) => this._rank(c.tier) > floor).sort((a, b) => this._rank(b.tier) - this._rank(a.tier));
  },

  /**
   * Everything in the world that is only assumed (weaker than derived), weakest first and,
   * among equals, the one most depends on first. Each entry lists the cells that rest on it.
   */
  assumptions() {
    const c = this._compiled();
    const memo = new Map();
    const found = new Map();
    const floor = this._rank('derived');
    for (const w of this.wires.values()) { // bounded: one pass over the cells of the world
      for (const key of [null, ...Object.keys(w.attrs)]) {
        const s = this._rests(w.id, key, memo);
        for (const [name, cell] of s.basis) {
          if (this._rank(cell.tier) <= floor) continue;
          const e = found.get(name) || found.set(name, { ...cell, cost: c.tierCost.get(cell.tier), dependants: [] }).get(name);
          if (cell.id !== w.id || cell.key !== key) e.dependants.push({ id: w.id, key });
        }
      }
    }
    return [...found.values()].sort((a, b) => this._rank(b.tier) - this._rank(a.tier) || b.dependants.length - a.dependants.length);
  },

  /** Is this filled value an assumption (something a told value may replace)? */
  _weakFill(f) {
    const tier = f.tier || VIA[f.via];
    return tier !== undefined && this._rank(tier) > this._rank('derived');
  },
};
