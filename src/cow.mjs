// Copy-on-write maps and sets, so that a fork costs nothing and its first change copies
// only what the change touches.
//
// A layer is a Map or a Set that reads through to a base (a plain Map or Set, or another
// layer) and keeps its own changes. The base is never written again: after a fork both
// worlds put a layer on top of what they shared. Iteration gives exactly the order a
// plain Map or Set would give after the same operations: base entries in base order
// (an entry changed in place keeps its place), then the entries added in this layer in
// the order they were added (a deleted base entry that comes back goes to the end).
//
// Chains are kept short. A layer whose base is an empty layer skips it. When a chain gets
// deeper than MAX_DEPTH, the top layers are merged into one, at the cost of their own
// changes, not of the base; when their changes are a large part of the base, the whole is
// flattened into a plain Map or Set, which the changes have paid for already.

const TOMB = Symbol('deleted');
const MAX_DEPTH = 8;
const SMALL = 32; // a base this small is copied, not layered

/** Depth of a chain of layers; a plain Map or Set is 0. */
const depthOf = (x) => (x instanceof CowMap || x instanceof CowSet ? x.depth : 0);

export class CowMap {
  constructor(base) {
    this.base = base;
    this.mod = new Map(); // base key -> new value, or TOMB
    this.added = new Map(); // keys not visible in the base, in the order they were added
    this.n = base.size;
    this.depth = depthOf(base) + 1;
  }
  get size() { return this.n; }
  /** The value without making it this layer's own (see WireMap). */
  peek(k) {
    if (this.added.has(k)) return this.added.get(k);
    const m = this.mod.get(k);
    if (m === TOMB) return undefined;
    if (m !== undefined) return m;
    return this.base instanceof CowMap ? this.base.peek(k) : this.base.get(k);
  }
  get(k) { return this.peek(k); }
  has(k) {
    if (this.added.has(k)) return true;
    const m = this.mod.get(k);
    if (m === TOMB) return false;
    return m !== undefined || this.base.has(k);
  }
  set(k, v) {
    if (this.added.has(k)) { this.added.set(k, v); return this; }
    const m = this.mod.get(k);
    if (m === TOMB) { this.added.set(k, v); this.n++; return this; }
    if (m !== undefined || this.base.has(k)) { this.mod.set(k, v); return this; }
    this.added.set(k, v);
    this.n++;
    return this;
  }
  delete(k) {
    if (this.added.has(k)) { this.added.delete(k); this.n--; return true; }
    const m = this.mod.get(k);
    if (m === TOMB) return false;
    if (m !== undefined || this.base.has(k)) { this.mod.set(k, TOMB); this.n--; return true; }
    return false;
  }
  clear() { this.base = new Map(); this.mod = new Map(); this.added = new Map(); this.n = 0; this.depth = 1; }
  *entries() {
    const base = this.base instanceof CowMap ? this.base.peekEntries() : this.base.entries();
    for (const [k, v] of base) { // bounded: the base
      const m = this.mod.get(k);
      if (m === TOMB) continue;
      yield [k, m === undefined ? v : m];
    }
    yield* this.added.entries();
  }
  peekEntries() { return this.entries(); }
  *keys() { for (const [k] of this.entries()) yield k; }
  *values() { for (const [, v] of this.entries()) yield v; }
  [Symbol.iterator]() { return this.entries(); }
  forEach(fn, self) { for (const [k, v] of this.entries()) fn.call(self, v, k, this); }
  get changes() { return this.mod.size + this.added.size; }
  get [Symbol.toStringTag]() { return 'Map'; }
}

export class CowSet {
  constructor(base) {
    this.base = base;
    this.gone = new Set(); // base values deleted here
    this.added = new Set(); // values not visible in the base, in the order they were added
    this.n = base.size;
    this.depth = depthOf(base) + 1;
  }
  get size() { return this.n; }
  has(v) { return this.added.has(v) || (!this.gone.has(v) && this.base.has(v)); }
  add(v) {
    if (this.added.has(v)) return this;
    if (!this.gone.has(v) && this.base.has(v)) return this;
    this.added.add(v);
    this.n++;
    return this;
  }
  delete(v) {
    if (this.added.delete(v)) { this.n--; return true; }
    if (this.gone.has(v) || !this.base.has(v)) return false;
    this.gone.add(v);
    this.n--;
    return true;
  }
  clear() { this.base = new Set(); this.gone = new Set(); this.added = new Set(); this.n = 0; this.depth = 1; }
  *values() {
    for (const v of this.base) if (!this.gone.has(v)) yield v; // bounded: the base
    yield* this.added;
  }
  keys() { return this.values(); }
  *entries() { for (const v of this.values()) yield [v, v]; }
  [Symbol.iterator]() { return this.values(); }
  forEach(fn, self) { for (const v of this.values()) fn.call(self, v, v, this); }
  get changes() { return this.gone.size + this.added.size; }
  get [Symbol.toStringTag]() { return 'Set'; }
}

/**
 * A map of wires. Reading a wire that lives in a base layer through get() makes a copy
 * of it this layer's own, so that whatever the caller then changes on the wire changes
 * only this world; has(), iteration and peek() do not copy.
 */
export class WireMap extends CowMap {
  get(k) {
    if (this.added.has(k)) return this.added.get(k);
    const m = this.mod.get(k);
    if (m === TOMB) return undefined;
    if (m !== undefined) return m;
    const v = this.base instanceof CowMap ? this.base.peek(k) : this.base.get(k);
    if (v === undefined || this.frozen) return v; // a layer that is shared now is only read
    const own = copyWire(v);
    this.mod.set(k, own);
    return own;
  }
}

/** A wire that can be changed without changing the one it was copied from. */
export function copyWire(w) {
  const attrs = {};
  for (const k of Object.keys(w.attrs)) attrs[k] = [...w.attrs[k]];
  const meta = { ...w.meta };
  if (meta.fills) meta.fills = [...meta.fills];
  if (meta.stated) meta.stated = Object.fromEntries(Object.entries(meta.stated).map(([k, v]) => [k, v.map((e) => ({ ...e }))]));
  if (meta.tails) meta.tails = { ...meta.tails };
  return { id: w.id, type: w.type, attrs, pattern: w.pattern, meta };
}

/** Replay the changes of `top` (a layer) onto `into` (a writable map or set). */
function replay(top, into) {
  if (top instanceof CowMap) {
    for (const [k, v] of top.mod) { if (v === TOMB) into.delete(k); else into.set(k, v); }
    for (const [k, v] of top.added) into.set(k, v);
  } else {
    for (const v of top.gone) into.delete(v);
    for (const v of top.added) into.add(v);
  }
}

/**
 * Something to write on, in place of `x` (whatever the world has now), that leaves `x`
 * as it is. A small map or set is copied; otherwise a layer is put on top of it. An empty
 * layer is skipped, and a deep chain is merged first. Maps of wires are always layered
 * (`WireMap`), since their values must be copied too, one by one, when written.
 */
export function layer(x, { wires = false } = {}) {
  const isMap = x instanceof Map || x instanceof CowMap;
  let base = x;
  while ((base instanceof CowMap || base instanceof CowSet) && base.changes === 0) base = base.base; // bounded: the chain
  if (!wires && base.size <= SMALL) return isMap ? new Map(base.entries()) : new Set(base.values());
  if (depthOf(base) >= MAX_DEPTH) base = flatten(base);
  return new (wires ? WireMap : isMap ? CowMap : CowSet)(base);
}

/**
 * The same content with a shorter chain. Layers are merged from the top while the next
 * one down is not much bigger than what has been merged so far, so that the layers that
 * remain grow geometrically towards the bottom: a change is merged again only a
 * logarithmic number of times. When everything above the plain base would be merged and
 * it is a large part of the base, the whole is flattened into a plain Map or Set, which
 * those changes have paid for.
 */
export function flatten(x) {
  if (x instanceof Map || x instanceof Set) return x;
  const isMap = x instanceof CowMap;
  const chain = [];
  let b = x;
  while (b instanceof CowMap || b instanceof CowSet) { chain.push(b); b = b.base; } // bounded: the chain
  let acc = 0, i = 0;
  while (i < chain.length && (i < 2 || chain[i].changes <= 2 * acc)) acc += chain[i++].changes; // bounded: the chain
  if (i === chain.length && acc * 4 >= b.size) return isMap ? new Map(x.peekEntries()) : new Set(x.values());
  const merged = new (isMap ? CowMap : CowSet)(i < chain.length ? chain[i] : b);
  for (let j = i - 1; j >= 0; j--) replay(chain[j], merged); // bounded: the chain
  return merged;
}

/**
 * An append-only list (the history of events) that shares its beginning with the world
 * it was forked from. Reads like an array: length, at, slice, filter, map, iteration.
 */
export class CowList {
  constructor(base) {
    this.base = base;
    this.tail = [];
    this.depth = (base instanceof CowList ? base.depth : 0) + 1;
  }
  get length() { return this.base.length + this.tail.length; }
  push(x) { return this.tail.push(x) + this.base.length; }
  pop() {
    if (this.tail.length) return this.tail.pop();
    const all = [...this.base];
    const x = all.pop();
    this.base = all;
    this.depth = 1;
    return x;
  }
  at(i) {
    const n = this.length;
    if (i < 0) i += n;
    if (i < 0 || i >= n) return undefined;
    const b = this.base.length;
    return i < b ? this.base.at(i) : this.tail[i - b];
  }
  *[Symbol.iterator]() { yield* this.base; yield* this.tail; }
  toArray() { return [...this]; }
  slice(a, b) {
    const base = this.base.length;
    const n = this.length;
    const from = a === undefined ? 0 : a < 0 ? Math.max(n + a, 0) : Math.min(a, n);
    if (from >= base && (b === undefined || b >= n)) return this.tail.slice(from - base); // the common case: what came since
    return this.toArray().slice(a, b);
  }
  filter(fn) { return this.toArray().filter(fn); }
  map(fn) { return this.toArray().map(fn); }
  forEach(fn) { this.toArray().forEach(fn); }
  toJSON() { return this.toArray(); }
}

/** A list to append to, over `x` (an array or a CowList), sharing what is there. */
export function layerList(x) {
  let base = x;
  while (base instanceof CowList && base.tail.length === 0) base = base.base; // bounded: the chain
  if (base instanceof CowList && base.depth >= MAX_DEPTH) {
    // as flatten(): merge tails from the top while the next one is not much longer
    const chain = [];
    let b = base;
    while (b instanceof CowList) { chain.push(b); b = b.base; } // bounded: the chain
    let acc = 0, i = 0;
    while (i < chain.length && (i < 2 || chain[i].tail.length <= 2 * acc)) acc += chain[i++].tail.length; // bounded: the chain
    if (i === chain.length && acc * 4 >= b.length) base = [...base];
    else {
      const merged = new CowList(i < chain.length ? chain[i] : b);
      for (let j = i - 1; j >= 0; j--) merged.tail.push(...chain[j].tail); // bounded: the chain
      base = merged;
    }
  }
  return new CowList(base);
}

// ---- checking mode: SOPWORLD_COW_CHECK=1 ----------------------------------------------------
// Every committed change forks the world (and drops the fork), and fork() seals what the
// two worlds share: any write to it then throws. Running the tests this way proves that
// no code path writes shared state.
export const CHECK = globalThis.process?.env?.SOPWORLD_COW_CHECK === '1';

const refuse = (what) => () => { throw new Error(`sopworld: internal error, a shared ${what} was written after a fork`); };
function sealCollection(x, what) {
  if (!x || x.__sealed) return;
  Object.defineProperty(x, '__sealed', { value: true });
  for (const m of ['set', 'delete', 'clear', 'add']) if (typeof x[m] === 'function') Object.defineProperty(x, m, { value: refuse(what), configurable: true });
}
// bounded: recursion over the parts of one object, which form a tree
function deepFreeze(o) {
  if (!o || typeof o !== 'object' || Object.isFrozen(o)) return o;
  Object.freeze(o);
  for (const v of Object.values(o)) deepFreeze(v);
  return o;
}
export function sealState(world) {
  const wires = world.wires;
  for (const w of wires instanceof CowMap ? wires.peekEntries() : wires.entries()) deepFreeze(w[1]); // bounded: the wires
  sealCollection(wires, 'map of wires');
  for (const k of ['byType', 'index', 'refs', 'byWire', 'byRule']) {
    for (const [, set] of world[k]) sealCollection(set, `set of ${k}`); // bounded: the index
    sealCollection(world[k], k);
  }
  for (const k of ['matrix', 'alias', 'used', 'firings', '_logOf']) sealCollection(world[k], k);
  for (const [, rec] of world.firings) deepFreeze(rec); // bounded: the firings
  Object.freeze(world.log);
  if (Array.isArray(world.events)) Object.freeze(world.events); else { Object.freeze(world.events.tail); world.events.push = refuse('history'); }
}
