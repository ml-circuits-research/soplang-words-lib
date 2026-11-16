// Knowledge a planner and a tool binding share (owner 2026-11-15 19:27: the glue between a live world and the generic
// mechanisms is declarative). Nothing here names a world, a kind or a sentence.
//
//   rowsOf(sources, type)                    -> the rows of a type in a World, a factStore, or an array of them
//   kindLineage(kind, { live, catalog })     -> the kind and its parents: the world's core.type lineage, then the
//                                               catalog's k.kinds.parent rows; std.schema.drawn says what it is drawn as
//   expectedValue(kind, key, known, ctx)     -> the value a conditional expectation (k.expect.when) gives a key
//   cutToCount(items, links, n)              -> the first n items of a structure, kept connected (breadth first)
//   fillToCount(items, n, { pool, notAll })  -> the kinds to add to reach n, in the proportions there are
//   notAllOneKind(kinds, pool)               -> the kinds with a second kind of the pool when all are one
import { valueText } from './parser.mjs';
import { memoPerWorld } from './memo.mjs';

const V = (v) => (typeof v === 'string' ? valueText(v) : v);
/** The rows of `type` in a World (ofType), a factStore (facts) or an array of either, as { key: [values] } objects. */
export function rowsOf(src, type) {
  if (!src) return [];
  if (Array.isArray(src)) return src.flatMap((s) => rowsOf(s, type)); // bounded: the sources given
  if (Array.isArray(type)) return type.flatMap((t) => rowsOf(src, t)); // bounded: the types given
  const facts = typeof src.ofType === 'function' ? src.ofType(type) : typeof src.facts === 'function' ? src.facts(type) : [];
  return facts.map((f) => { const o = {}; for (const [k, vs] of Object.entries(f.attrs)) if (k !== 'core.source') o[k] = [].concat(vs).map(V); return o; });
}
const first = (o, k) => o?.[k]?.[0];
const num = (x) => (x === undefined || x === null || x === '' ? undefined : Number(x));

const sourceIds = new WeakMap();
/**
 * The kinds a world takes by join: every `std.schema.kinds world= from=<type> key=name acts= stand_in=<type> as=<type>` row makes
 * each row of the type `from` (its `key`, default name) a declared kind with those acts, and each row of `stand_in`
 * a kind drawn as the base its `drawing=` names (a `from` row's own `drawing=` says it too); `as` names a type of the
 * world the joined kinds are kinds of (they take its slots and its lineage: the parts of a whole, the presets of a
 * whole). Returns Map kind -> { acts: Set, world, from, as?, standIn? }; explicit kinds are not in it. `sources`: the live world and the catalog.
 */
export function joinedKinds(live, catalog = []) {
  const srcs = [live, ...[].concat(catalog ?? [])].filter(Boolean);
  const build = () => {
    const out = new Map();
    for (const j of rowsOf(live, 'std.schema.kinds')) {
      const acts = new Set(j.acts ?? []), from = first(j, 'from'), key = first(j, 'key') ?? 'name', world = first(j, 'world'), stand = first(j, 'stand_in'), as = first(j, 'as');
      const was = as !== undefined ? { as: String(as) } : {}; // `as=<type of the world>`: the joined kinds are kinds of that type (its slots, its lineage)
      if (from) for (const r of rowsOf(srcs, from)) for (const n of r[key] ?? []) if (!out.has(String(n))) out.set(String(n), { acts, world, from, ...was, ...(first(r, 'drawing') ? { standIn: String(first(r, 'drawing')) } : {}) });
      if (stand) for (const r of rowsOf(srcs, stand)) for (const n of r.name ?? []) if (!out.has(String(n)) && first(r, 'drawing')) out.set(String(n), { acts, world, from: stand, ...was, standIn: String(first(r, 'drawing')) });
    }
    return out;
  };
  const rows = rowsOf(live, 'std.schema.kinds');
  if (!rows.length) return new Map();
  const id = sourcesKey(srcs.slice(1));
  return memoPerWorld(live, `expect|joined|${id}`, () => {
    // shared by every world with the same join rows over the same sources (a fork of the world, the mirror of a state):
    // built once per version of the sources, not once per fork
    const types = [...new Set(rows.flatMap((j) => [first(j, 'from'), first(j, 'stand_in')]).filter(Boolean))];
    const sig = `${id}|${JSON.stringify(rows)}|${types.map((t) => rowsOf(live, t).length).join(',')}`;
    if (JOINED.has(sig)) return JOINED.get(sig);
    const out = build();
    if (JOINED.size >= 64) JOINED.delete(JOINED.keys().next().value); // bounded: the oldest goes
    JOINED.set(sig, out);
    return out;
  });
}
const JOINED = new Map();
/** A key for a list of sources (Worlds or factStores): their identities and versions, for caches built from them. */
export function sourcesKey(list) {
  return [].concat(list ?? []).filter(Boolean).map((c) => { if (typeof c !== 'object') return String(c); if (!sourceIds.has(c)) sourceIds.set(c, sourceIds.size + 1); return sourceIds.get(c) + ':' + (c.version ?? ''); }).join(',');
}

/**
 * The kind and its parents, nearest first: the live world's core.type lineage (without std.* and core.* types), then
 * the catalog's `k.kinds.parent name= is_a=` rows, to depth 4. `drawn`: also what `std.schema.drawn kind= as=` says the
 * kind is drawn as (in the world and the catalog), first.
 */
export function kindLineage(kind, { live = null, catalog = [], drawn = false } = {}) {
  if (kind === undefined || kind === null) return [];
  const out = [];
  const add = (k) => { if (k !== undefined && k !== null && !out.includes(String(k))) out.push(String(k)); };
  if (drawn) for (const r of rowsOf([live, ...[].concat(catalog ?? [])], 'std.schema.drawn')) if (first(r, 'kind') === kind) add(first(r, 'as'));
  add(kind);
  const c = live?._compiled?.();
  if (c) for (const t of c.lineage(String(kind))) if (!/^(std|core)\./.test(t)) add(t);
  const as = joinedKinds(live, catalog).get(String(kind))?.as; // a joined kind is a kind of the type its join names (as=)
  if (as !== undefined) { add(as); if (c) for (const t of c.lineage(as)) if (!/^(std|core)\./.test(t)) add(t); }
  const stand = drawn ? joinedKinds(live, catalog).get(String(kind))?.standIn : undefined; // a joined kind drawn as a base (villa -> house): the base and its lineage
  if (stand !== undefined) { add(stand); if (c) for (const t of c.lineage(stand)) if (!/^(std|core)\./.test(t)) add(t); }
  const parents = rowsOf([].concat(catalog ?? []), 'k.kinds.parent');
  for (let depth = 0, frontier = [...out]; depth < 4 && frontier.length; depth++) { // bounded: four levels of the catalog's parents
    const next = [];
    for (const k of frontier) for (const r of parents) if (first(r, 'name') === k) for (const p of r.is_a ?? []) if (!out.includes(String(p))) { add(p); next.push(String(p)); }
    frontier = next;
  }
  return out;
}

/** The row types of conditional expectations: `k.expect.value on= value= when.<key>=` (the review's form) and `k.expect.when key= value= if.<key>=` (0.152.0). */
export const EXPECT_TYPES = Object.freeze(['k.expect.value', 'k.expect.when']);
/** The conditions of a k.expect.value / k.expect.when row: [{ key, op: 'eq' | 'min' | 'max', value }] from its when.<key>[.min|.max] (or if.<key>...) attributes. */
export function conditionsOf(row) {
  const out = [];
  for (const [k, vs] of Object.entries(row)) {
    const pre = k.startsWith('when.') ? 5 : k.startsWith('if.') ? 3 : 0;
    if (!pre) continue;
    const rest = k.slice(pre), m = rest.match(/^(.*)\.(min|max)$/);
    for (const v of vs) out.push(m ? { key: m[1], op: m[2], value: Number(v) } : { key: rest, op: 'eq', value: v });
  }
  return out;
}
const before = (a, b) => { const i = a.findIndex((x, k) => x !== b[k]); return i >= 0 && a[i] < b[i]; }; // lexicographic
const holds = (c, known) => {
  const v = known[c.key];
  if (c.op === 'eq' && c.value === 'none') return v === undefined || v === null || v === ''; // when.<key>=none: the key is absent
  if (v === undefined || v === null) return false;
  if (c.op === 'min') return Number(v) >= c.value;
  if (c.op === 'max') return Number(v) <= c.value;
  return [].concat(v).map(String).includes(String(c.value));
};

/**
 * The value a conditional expectation gives `key` of a thing of `kind`, the things already `known` of it (its other
 * values, `kind`, `size`, `count`, `role`): the rows `k.expect.value [of=] on=<key> value= [min= max= typical=]
 * when.<key>=<v> when.<key>.min= when.<key>.max=` (also `k.expect.when key= ... if.<key>=`) of the live world (source `world`), then of the catalog (source `expect`), whose `of` is
 * in the kind's lineage and whose conditions all hold. The most specific wins: the most conditions, then the nearest
 * kind of the lineage, then the world before the catalog, then the order given. The values of one if-key are alternatives (any of them holds). Returns { value, min, max, typical,
 * from, because: [conditions], of } or null.
 */
export function expectedValue(kind, key, known = {}, { live = null, catalog = [], sources = ['world', 'expect'], lineage = null } = {}) {
  const line = lineage ?? kindLineage(kind, { live, catalog });
  const from = { world: [live], expect: [].concat(catalog ?? []) };
  let best = null;
  sources.filter((s) => from[s]).forEach((s, si) => {
    rowsOf(from[s], EXPECT_TYPES).forEach((r, ri) => {
      if ((first(r, 'on') ?? first(r, 'key')) !== key) return;
      const of = first(r, 'of'), d = of === undefined ? line.length : line.indexOf(of);
      if (d < 0) return;
      const cs = conditionsOf(r);
      const k0 = { kind, ...known }, groups = new Map(); // the values of one if-key are alternatives: if.size=big if.size=huge
      for (const c of cs) { const g = `${c.key}|${c.op}`; groups.set(g, [...(groups.get(g) ?? []), c]); }
      if (![...groups.values()].every((g) => g.some((c) => holds(c, k0)))) return;
      const met = cs.filter((c) => holds(c, k0)); // the alternatives that hold are the reason
      const rank = [-new Set(cs.map((c) => c.key)).size, d, si, ri];
      if (!best || before(rank, best.rank)) best = { rank, r, s, cs: met, of };
    });
  });
  if (!best) return null;
  const r = best.r;
  return { value: first(r, 'value'), min: num(first(r, 'min')), max: num(first(r, 'max')), typical: num(first(r, 'typical')), from: best.s, because: best.cs.map((c) => `${c.key}${c.op === 'eq' ? '=' : c.op === 'min' ? '>=' : '<='}${c.value}`), of: best.of };
}

/**
 * Cut a structure to n items keeping it connected: breadth first from the items nothing links to (in their order),
 * along the links, then the rest in order. `items`: ids (or indexes) in order; `links`: [{ a, b }]. Returns
 * { keep: [items], drop: [items], links: [links kept] }.
 */
export function cutToCount(items, links = [], n) {
  const keep = [], seen = new Set();
  const out = new Map(items.map((x) => [x, []])), into = new Map(items.map((x) => [x, 0]));
  for (const l of links) { if (out.has(l.a) && out.has(l.b)) { out.get(l.a).push(l.b); into.set(l.b, into.get(l.b) + 1); } }
  const queue = items.filter((x) => into.get(x) === 0);
  if (!queue.length && items.length) queue.push(items[0]); // a cycle: from its first item
  for (let i = 0; i < queue.length && keep.length < n; i++) { // bounded: each item enters the queue once per link into it
    const x = queue[i];
    if (seen.has(x)) continue;
    seen.add(x); keep.push(x);
    for (const y of out.get(x)) if (!seen.has(y)) queue.push(y); // breadth first: what x links to, after what is waiting
  }
  for (const x of items) if (keep.length < n && !seen.has(x)) { seen.add(x); keep.push(x); } // bounded: unreached items, in order
  const kept = new Set(keep);
  const order = items.filter((x) => kept.has(x));
  return { keep: order, drop: items.filter((x) => !kept.has(x)), links: links.filter((l) => kept.has(l.a) && kept.has(l.b)) };
}

/**
 * The kinds to add to a structure of `kinds` (one per item, in order) to reach n: each new item takes the kind that is
 * most under its share of the proportions there are (ties in the order of `pool`, else of first appearance). `pool`:
 * the kinds allowed (default the kinds there are); `notAll`: at least two kinds in the end when the pool has two.
 */
export function fillToCount(kinds, n, { pool = null, notAll = false } = {}) {
  const P = (pool ?? [...new Set(kinds)]).filter((k) => k !== undefined);
  const add = [];
  if (!P.length) return add;
  const count = new Map(P.map((k) => [k, 0]));
  for (const k of kinds) if (count.has(k)) count.set(k, count.get(k) + 1);
  const total0 = kinds.filter((k) => count.has(k)).length;
  const share = new Map(P.map((k) => [k, total0 ? count.get(k) / total0 : 1 / P.length]));
  for (let i = kinds.length; i < n; i++) { // bounded: n - the items there are
    const t = kinds.length + add.length + 1;
    const k = [...P].sort((a, b) => (count.get(a) - share.get(a) * t) - (count.get(b) - share.get(b) * t) || P.indexOf(a) - P.indexOf(b))[0];
    add.push(k); count.set(k, count.get(k) + 1);
  }
  if (notAll && P.length > 1 && new Set([...kinds, ...add]).size < 2 && add.length) add[add.length - 1] = P.find((k) => k !== add[add.length - 1]);
  return add;
}

/** The kinds (one per item) with every second item of a second kind of the pool, when all are of one kind and the pool has another. */
export function notAllOneKind(kinds, pool = []) {
  if (new Set(kinds).size !== 1 || kinds.length < 2) return [...kinds];
  const other = pool.find((k) => k !== kinds[0]);
  return other === undefined ? [...kinds] : kinds.map((k, i) => (i % 2 ? other : k));
}
