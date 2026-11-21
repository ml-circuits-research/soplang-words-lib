// Incremental derivation by difference of told state, and a stable order of the facts of a synced world.
// Mixed into World.prototype.
//
// world.syncState(wires) makes the facts this world was told through sync equal to `wires`: a wire with a new id is told,
// a wire whose content changed is replaced in place (it keeps its id and what refers to it), a wire no longer listed
// is retracted, all in one patch. Everything derived follows incrementally (World._unsay and the chase), so a host
// that keeps a sequence of states (an editor after each command) derives each one from the previous one instead of
// from the bare base. The first sync of a lineage records what the world held then as its base.
//
// The result is the full derivation of the same state: the same wires with the same values, and, because the order
// in which incremental maintenance inserts wires is history, ofType() of a synced world returns its wires in a stable
// order that is a function of the state alone (synced worlds only; other worlds keep insertion order):
//   - a wire of the base: its position in the base;
//   - a wire told through sync: base size + its index in the last sync's list;
//   - a wire told after that: base size + list size + its event sequence after the sync;
//   - a derived wire: the least key over the firings that made or matched it of the keys of their premises, in rule
//     body order, concatenated and cut to KEY_LENGTH numbers (a fixpoint computed from the top of the finite lattice
//     of cut keys, so the order of evaluation does not change it); ties by id.
// SOPWORLD_SYNC_CHECK=1 compares every incremental sync with the full derivation (the base forked and synced once),
// wires, values and order, and every incremental retraction or patch with a replay of the log; a mismatch throws.
// SOPWORLD_SYNC_CHECK=sync checks the syncs only.
// SOPWORLD_SYNC_CHECK=sync checks the syncs only.

import { parse, cloneWire, format } from './parser.mjs';

const KEY_LENGTH = 8;
const UNKNOWN = Number.MAX_SAFE_INTEGER; // a premise that is not a wire of the world (a host fact)
const CHECK_MODE = globalThis.process?.env?.SOPWORLD_SYNC_CHECK;
export const SYNC_CHECK = CHECK_MODE === '1' || CHECK_MODE === 'sync'; // 'sync': only the syncs (large hosts); '1': also every retraction
const REPLAY_CHECK = CHECK_MODE === '1';
// the counts of checks made in this process (tools/sync-check-report.mjs reads them when the process ends)
const checks = globalThis.__sopworldSyncChecks ??= { sync: 0, replay: 0, skipped: 0 };
export const syncChecks = () => ({ ...checks });

const bases = new WeakMap(); // wires map of a base world -> { ids: Map(id -> position), size }
const ORDERS = new Map(); // world version -> computed keys and sorted types (a version names one content in this process)
const ORDERS_MAX = 32;

const less = (a, b) => {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return a.length < b.length;
};
const canonicalWire = (w) => format({ id: w.id, type: w.type, attrs: w.attrs }, { canonical: true });

export const synchronizing = {
  /**
   * Make the facts told through sync equal to `input` (SOP text or wires, ids unique). Same result contract as tell().
   * opts.factsOnly (default true): the wires are facts, never matrix wires.
   */
  syncState(input, opts = {}) {
    return this._guard(opts, () => this._syncState(input, opts), (v) => this._refusal(v));
  },

  _syncState(input, { factsOnly = true, tier } = {}) {
    const target = (typeof input === 'string' ? parse(input) : input).map(cloneWire);
    const next = new Map();
    for (const w of target) {
      if (next.has(w.id)) return { ok: false, added: [], derived: [], filled: [], merged: [], removed: [], violations: [{ kind: 'duplicate-id', id: w.id, why: `${w.id} is listed twice` }] };
      next.set(w.id, canonicalWire(w));
    }
    let base = this._syncBase;
    if (!base) {
      let at = bases.get(this.wires);
      if (!at) { at = { ids: new Map(), size: 0 }; for (const id of this.wires.keys()) at.ids.set(id, at.size++); bases.set(this.wires, at); }
      base = { ...at, world: this.fork() };
    }
    const prev = this._syncTold || new Map();
    const wires = [], replace = [], retract = [];
    for (const w of target) {
      const old = prev.get(w.id);
      if (old === undefined) wires.push(w);
      else if (old !== next.get(w.id)) replace.push({ id: w.id, type: w.type, attrs: w.attrs });
    }
    for (const id of prev.keys()) if (!next.has(id)) retract.push(id);
    const incremental = prev.size > 0;
    // A retraction takes the told wires that refer to the retracted one with it: when one of them stays listed, the
    // state is derived from the base instead (as when the incremental patch is refused).
    const kept = (id) => next.has(id);
    let cascade = false;
    for (const queue = [...retract], seen = new Set(queue); queue.length && !cascade;) { // bounded: each told wire once
      for (const ref of this.refs.get(queue.pop()) || []) {
        if (seen.has(ref) || !this.wires.get(ref)?.meta?.told) continue;
        if (kept(ref)) { cascade = true; break; }
        seen.add(ref); queue.push(ref);
      }
    }
    let r = cascade ? { ok: false } : wires.length || replace.length || retract.length
      ? this._patch({ wires, replace, retract }, { factsOnly, tier })
      : { ok: true, added: [], derived: [], filled: [], merged: [], removed: [], violations: [] };
    const lost = r.ok && target.some((w) => !this.wires.get(w.id)?.meta?.told);
    if (!r.ok && incremental || lost) {
      const fresh = base.world.fork();
      const full = fresh._syncState(target, { factsOnly, tier });
      if (!full.ok) return full;
      this._adopt(fresh, 'sync');
      this._version = fresh._version;
      r = full;
    }
    if (!r.ok) return r;
    const same = prev.size === next.size && [...prev.keys()].every((id, i) => this._syncOrderIds?.[i] === id) && target.every((w, i) => this._syncOrderIds?.[i] === w.id);
    this._syncBase = base;
    this._syncTold = next;
    if (!same || !this._syncOrder) { this._syncOrderIds = target.map((w) => w.id); this._syncOrder = new Map(this._syncOrderIds.map((id, i) => [id, i])); }
    this._syncSeq = this.seq;
    if (SYNC_CHECK && incremental) checkSync(this, target, { factsOnly, tier });
    return r;
  },

  /** The order keys of a synced world's wires, computed once per content (see the header). */
  _orderState() {
    const version = this._version;
    let memo = ORDERS.get(version);
    if (memo && memo.base === this._syncBase && memo.order === this._syncOrder && memo.seq === this._syncSeq && memo.wires === this.wires) return memo;
    const { ids: pos, size: nB } = this._syncBase, order = this._syncOrder, nS = order.size, seq0 = this._syncSeq;
    const keys = new Map(), derived = [];
    for (const [id, w] of this.wires.entries()) {
      if (pos.has(id)) continue;
      if (w.meta?.told) { const i = order.get(id); keys.set(id, [i !== undefined ? nB + i : nB + nS + ((w.meta.seq ?? 0) - seq0)]); }
      else derived.push(w);
    }
    const keyOf = (id) => keys.get(id) ?? (pos.has(id) ? [pos.get(id)] : this.wires.has(id) ? undefined : [UNKNOWN]);
    const support = derived.map((w) => [w.id, [...(this.byWire.get(w.id) || [])].map((sig) => this.firings.get(sig))
      .filter((rec) => rec && (rec.made.includes(w.id) || rec.hits.includes(w.id))).map((rec) => rec.from)]);
    // bounded: every pass lowers at least one key in a finite lattice (keys are cut to KEY_LENGTH numbers of a finite set)
    for (let changed = true; changed;) {
      changed = false;
      for (const [id, froms] of support) {
        let best = keys.get(id);
        for (const from of froms) {
          const cand = [];
          let ok = true;
          for (const p of from) {
            const k = keyOf(this.resolve(p));
            if (!k) { ok = false; break; }
            for (let i = 0; i < k.length && cand.length < KEY_LENGTH; i++) cand.push(k[i]);
            if (cand.length >= KEY_LENGTH) break;
          }
          if (ok && (!best || less(cand, best))) best = cand;
        }
        if (best && best !== keys.get(id)) { keys.set(id, best); changed = true; }
      }
    }
    memo = { base: this._syncBase, order, seq: seq0, wires: this.wires, keys, pos, types: new Map() };
    ORDERS.delete(version);
    ORDERS.set(version, memo);
    if (ORDERS.size > ORDERS_MAX) ORDERS.delete(ORDERS.keys().next().value);
    return memo;
  },

  /** ofType of a synced world outside a transaction: the stable order. */
  _stableOfType(type) {
    const memo = this._orderState();
    let ids = memo.types.get(type);
    if (!ids) {
      const { keys, pos } = memo, none = [UNKNOWN];
      const k = (id) => keys.get(id) ?? (pos.has(id) ? [pos.get(id)] : none);
      ids = [...(this.byType.get(type) || [])].map((id) => [id, k(id)])
        .sort((a, b) => (less(a[1], b[1]) ? -1 : less(b[1], a[1]) ? 1 : a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([id]) => id);
      memo.types.set(type, ids);
    }
    return ids.map((id) => this.wires.get(id));
  },
};

// ---- checking mode ---------------------------------------------------------------------------------------------

/** Every type with its wires, in ofType order, with exact values. */
function snapshotOf(world, ordered) {
  const types = [...world.byType.keys()].filter((t) => world.byType.get(t)?.size).sort();
  return types.map((t) => {
    const rows = world.ofType(t).filter((w) => w.type === t).map((w) => canonicalWire(w));
    return t + ':' + (ordered ? rows : rows.sort()).join('\n');
  }).filter((line) => !line.endsWith(':')).join('\n');
}
function firstDifference(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) return `${String(A[i]).slice(0, 300)} <> ${String(B[i]).slice(0, 300)}`;
  return '';
}
function checkSync(world, target, opts) {
  if (replaying) return;
  const full = world._syncBase.world.fork();
  const r = full._syncState(target, opts);
  if (!r.ok) throw new Error('sopworld: sync check, the full derivation was refused: ' + JSON.stringify(r.violations).slice(0, 300));
  const a = snapshotOf(world, true), b = snapshotOf(full, true);
  if (a !== b) throw new Error('sopworld: sync check, incremental and full derivation differ: ' + firstDifference(a, b));
  checks.sync++;
}
/** After an incremental retraction or patch: the world equals a replay of its log on a new world (wires and values). */
let replaying = false; // the replay of a check makes retractions too: those are not checked again
export function checkReplay(world) {
  if (!REPLAY_CHECK || replaying) return;
  if (!REPLAY_CHECK) return;
  const fresh = new world.constructor(world.options);
  for (const k of ['fns', 'actions', 'producers', 'filters']) if (world[k]) fresh[k] = { ...world[k] };
  fresh.context = { ...(world.context || {}) };
  if (world.lemma) fresh.lemma = world.lemma;
  fresh._retained = world._retained;
  let refused;
  replaying = true;
  try { refused = fresh._replay(world.log); } catch { refused = true; } finally { replaying = false; }
  if (refused) { checks.skipped++; return; }
  const a = snapshotOf(world, false), b = snapshotOf(fresh, false);
  if (a !== b) throw new Error('sopworld: replay check, incremental and full derivation differ: ' + firstDifference(a, b));
  checks.replay++;
}
