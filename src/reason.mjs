// A first layer of reasoning on the state of a live world (owner 2026-11-15 14:11): one flat view of any world as
// facts, and the three shallow steps the gap filler runs on it.
//
//   factsOf(world)                       -> the world as (thing, attribute, value) and (thing, relation, thing), indexed,
//                                           kept per world version and built from the last view by the changes since
//   kindFactsOf(catalog)                 -> what the catalog says of a kind, as (kind, attribute, value)
//   deduceState(view, ids, opts)         -> forward chaining (depth <= 2) and the constraints of REASON_RULES on the
//                                           things given: { hard, soft, ticks }
//   induceStyle(view, type, opts)        -> anti-unification (one step) of the things of a type: the attribute values
//                                           they all share
//   induceCorrections(list, opts)        -> the same over a session's corrections: the step they all took
//
// The rules are written against the view only: no code here knows the wire shapes of a world, a kind or an
// application. In the literature: forward chaining as in Datalog (bottom-up, to a fixed depth), anti-unification /
// least general generalisation (Plotkin 1970); the planner around it (src/request.mjs) is generate-and-test with
// constraints and weighted abduction (Hobbs et al. 1993).
import { valueText } from './parser.mjs';
import { memoPerWorld } from './memo.mjs';

const V = (v) => (typeof v === 'string' ? valueText(v) : v);
const plain = (t) => String(t ?? '').replace(/^\$/, '').split('.').pop().replace(/_/g, ' ').toLowerCase();

/** The bounds of the reasoning cycle: candidates, depth of chaining, ticks of one plan, examples for induction. */
export const REASONING = Object.freeze({ candidates: 5, depth: 2, ticks: 20000, induceMin: 3, correctionsMin: 2, flatten: 256, look: 64 });

/**
 * What the catalog says of a kind, read from these types (data): every row of `type` is a set of facts about the
 * kind named by its `by` key; a row with `key` / `value` / `parent` says (kind, key, value) and (kind, is_a, parent).
 */
export const KIND_FACTS = Object.freeze([
  Object.freeze({ type: 'k.commonsense.thing', by: 'name' }),
  Object.freeze({ type: 'k.scenes.thing', by: 'name' }),
  Object.freeze({ type: 'k.kinds.kind', by: 'name' }),
  Object.freeze({ type: 'k.kinds.parent', by: 'name', key: 'key', value: 'value', parent: 'is_a' }),
]);

/**
 * The constraints deduction checks on a simulated state (data). `join`: a relation names a thing that is there
 * (a link joins two existing nodes). `placed`: a thing whose kind the catalog places (`needs`: at, place) is in or
 * on (`via`) a thing that is such a place, by its kind or by what the catalog says of it (`holds`), through at most
 * one is_a step (each step of the chain that places it costs `step`: the shorter explanation is cheaper). `open`: a required key of a thing made is still open. `request`: the bounds the plan carries (the
 * kinds not wanted, the count said). Hard ones drop a candidate; soft ones cost `soft` each.
 */
export const REASON_RULES = Object.freeze([
  Object.freeze({ name: 'join', hard: true }),
  Object.freeze({ name: 'placed', needs: Object.freeze(['at', 'place']), via: Object.freeze(['in', 'on']), holds: Object.freeze(['kind', 'at', 'place', 'material', 'is_a']), soft: 1, step: 0.25 }),
  Object.freeze({ name: 'open', soft: 1 }),
  Object.freeze({ name: 'request', hard: true }),
]);

// ---- the view ------------------------------------------------------------------------------------------------------
const REG = new WeakMap(); // the last event object of a state -> the view of that state (shared by forks of it)
const OWN = new WeakMap(); // world -> { version, view }

/** One thing of the world as a record, or null when the wire is not a thing (a pattern, a matrix wire, gone). */
function recordOf(world, id, c) {
  const w = world._peek ? world._peek(id) : world.get(id);
  if (!w || w.pattern || w.id !== id || String(w.type).startsWith('core.')) return null;
  const kinds = [...new Set([...c.lineage(w.type), ...(w.attrs.kind ?? []).map(V).map(String)])];
  const attrs = new Map(), rels = [];
  const slots = c.slots.get(w.type);
  for (const [key, vs] of Object.entries(w.attrs)) {
    if (key.startsWith('core.')) continue;
    const s = slots?.get(key);
    for (const raw of [].concat(vs)) {
      if (typeof raw === 'string' && raw[0] === '$') { rels.push({ relation: key, to: raw.slice(1) }); continue; }
      const v = V(raw);
      if (s?.type && s.by) { rels.push({ relation: key, to: null, value: v, joins: { type: s.type, by: s.by } }); continue; } // a declared join: resolved by `related`
      const list = attrs.get(key) ?? [];
      list.push(v); attrs.set(key, list);
    }
  }
  return Object.freeze({ id, type: w.type, kinds, attrs, rels });
}

class FactView {
  constructor(world, base, version) {
    this.version = version;
    this.base = base;
    this.depth = base ? base.depth + 1 : 0;
    this.own = new Map(); // id -> record | null (this layer)
    this.ownKind = new Map(); // kind -> Set(id) (records of this layer)
    this.ownIn = new Map(); // id -> Set(id of a thing of this layer with a relation to it)
    this.order = base ? base.order : [];
  }
  /** The ids ever in the order (a removed one stays, read through `thing`). */
  _inOrder() { return this._orderSet ?? (this._orderSet = new Set(this.order)); }
  get size() { return this.ids().length; }
  _set(id, rec) {
    this.own.set(id, rec);
    if (rec) {
      for (const k of rec.kinds) { const s = this.ownKind.get(k) ?? new Set(); s.add(id); this.ownKind.set(k, s); }
      for (const r of rec.rels) if (r.to) { const s = this.ownIn.get(r.to) ?? new Set(); s.add(id); this.ownIn.set(r.to, s); }
    }
  }
  /** The record of a thing, or undefined. */
  thing(id) {
    for (let v = this; v; v = v.base) if (v.own.has(id)) return v.own.get(id) ?? undefined; // bounded: the layers (flattened past REASONING.flatten)
    return undefined;
  }
  /** Every thing's id, in the order the world got them. */
  ids() { return this.order.filter((id) => this.thing(id)); }
  /** The ids of the things of a kind (a type, a type it extends, or a value of `kind`). */
  ofKind(kind) {
    const out = new Set();
    for (let v = this; v; v = v.base) for (const id of v.ownKind.get(kind) ?? []) if (!out.has(id) && this.thing(id)?.kinds.includes(kind)) out.add(id); // bounded: the layers
    return this.order.filter((id) => out.has(id));
  }
  /** The values of a thing's attribute. */
  values(id, key) { return this.thing(id)?.attrs.get(key) ?? []; }
  /** The things a thing points to by a relation (every relation when none is named); a declared join is resolved here. */
  related(id, relation) {
    const r = this.thing(id);
    if (!r) return [];
    return r.rels.filter((x) => !relation || x.relation === relation).map((x) => x.to ?? this.ofKind(x.joins.type).find((t) => this.values(t, x.joins.by).map(String).includes(String(x.value))) ?? null);
  }
  /** The things that point to a thing. */
  inbound(id, relation) {
    const out = new Set();
    for (let v = this; v; v = v.base) for (const src of v.ownIn.get(id) ?? []) if (!out.has(src) && this.thing(src)?.rels.some((x) => x.to === id && (!relation || x.relation === relation))) out.add(src); // bounded: the layers
    return [...out];
  }
  /** The flat view: [{ thing, attribute, value }] and [{ thing, relation, to }] of every thing, or of one. */
  attributes(id) { return (id ? [id] : this.ids()).flatMap((t) => [...(this.thing(t)?.attrs ?? [])].flatMap(([attribute, vs]) => vs.map((value) => ({ thing: t, attribute, value })))); }
  relations(id) { return (id ? [id] : this.ids()).flatMap((t) => (this.thing(t)?.rels ?? []).map((x, i) => ({ thing: t, relation: x.relation, to: x.to ?? this.related(t, x.relation)[i] ?? null }))); }
}

function fullView(world, c) {
  const v = new FactView(world, null, world.version);
  const order = [];
  for (const id of world.wires.keys()) { const r = recordOf(world, id, c); if (r) { order.push(id); v._set(id, r); } } // bounded: the wires of the world
  v.order = order;
  return v;
}

/** The ids an event touches, or null when it rebuilt the world (a rewind, a retraction that rebuilt). */
function touched(e) {
  if (e.rebuilt || e.op === 'rewind') return null;
  return [e.id, e.into, ...(e.ids ?? [])].filter((x) => typeof x === 'string');
}

/**
 * The world as facts: things (every wire that is not a pattern or a matrix wire), each with its kinds (its type and
 * the types it extends, and its `kind` values), its attributes and its relations (a `$` reference, or a declared
 * join `type= by=`). Kept per `world.version`; a new version is built from the last view of the same history (this
 * world's, or the world it was forked from) by the events since, and flattened when the layers grow. Methods:
 * `thing(id)`, `ids()`, `ofKind(kind)`, `values(id, key)`, `related(id, relation?)`, `inbound(id, relation?)`,
 * `attributes(id?)`, `relations(id?)`; `version`, `size`.
 */
export function factsOf(world) {
  const own = OWN.get(world);
  if (own && own.version === world.version) return own.view;
  const c = world._compiled();
  const ev = world.events, n = ev.length;
  let base = null, from = n;
  for (let k = n; k > 0 && k >= n - REASONING.look; k--) { // bounded: the last events looked at
    const hit = REG.get(ev.at(k - 1));
    if (hit && hit.n === k && hit.compiled === c) { base = hit.view; from = k; break; }
  }
  let view = null;
  if (base) {
    const ids = new Set();
    let rebuilt = false;
    for (const e of ev.slice(from)) { const t = touched(e); if (!t) { rebuilt = true; break; } for (const id of t) { ids.add(id); ids.add(world.resolve(id)); } } // bounded: the events since
    if (!rebuilt) {
      if (!ids.size) view = base;
      else if (base.depth < 8 && ids.size < REASONING.flatten) {
        view = new FactView(world, base, world.version);
        const fresh = [];
        for (const id of ids) { const r = recordOf(world, id, c); view._set(id, r); if (r && !base._inOrder().has(id)) fresh.push(id); } // bounded: the ids the events touched
        if (fresh.length) view.order = [...base.order, ...fresh];
      }
    }
  }
  if (!view) view = fullView(world, c);
  OWN.set(world, { version: world.version, view });
  if (n) REG.set(ev.at(n - 1), { n, compiled: c, view });
  return view;
}

// ---- the catalog's facts of kinds ------------------------------------------------------------------------------------
/** What the catalog says of each kind: Map(kind name -> [{ attribute, value, from }]), built once per catalog version. */
export function kindFactsOf(catalog, types = KIND_FACTS) {
  const out = new Map();
  const add = (k, attribute, value, from) => { if (value === undefined || value === null || value === '') return; const key = plain(k); const l = out.get(key) ?? []; l.push({ attribute, value: plain(value), from }); out.set(key, l); };
  for (const src of [].concat(catalog ?? [])) {
    if (!src?.ofType) continue;
    const m = memoPerWorld(src, `reason|kinds|${types.map((t) => t.type).join(',')}`, () => {
      const local = new Map();
      const put = (k, attribute, value, from) => { if (value === undefined || value === null || value === '') return; const key = plain(k); const l = local.get(key) ?? []; l.push({ attribute, value: plain(value), from }); local.set(key, l); };
      for (const t of types) for (const f of src.ofType(t.type)) { // bounded: the catalog's rows of these types
        const name = f.attrs[t.by]?.[0];
        if (name === undefined) continue;
        if (t.key) { const p = V(f.attrs[t.parent]?.[0]); put(V(name), V(f.attrs[t.key]?.[0]) ?? 'is_a', V(f.attrs[t.value]?.[0]) ?? p, t.type); put(V(name), 'is_a', p, t.type); continue; }
        for (const [a, vs] of Object.entries(f.attrs)) if (a !== t.by && !a.startsWith('core.') && a !== 'derived' && a !== 'named') for (const v of vs) put(V(name), a, V(v), t.type);
      }
      return local;
    });
    for (const [k, l] of m) for (const x of l) add(k, x.attribute, x.value, x.from);
  }
  return out;
}

// ---- deduction ---------------------------------------------------------------------------------------------------------
/**
 * Forward chaining on the facts of the things given, to `depth` (default 2): level 0 the thing's own facts (its kinds,
 * attributes, relations), level 1 what the catalog says of its kinds, level 2 what it says of their is_a parents.
 * Then the constraints of `rules` (REASON_RULES) on the things given. `opts`: `catalog`, `kindFacts` (instead of
 * reading the catalog), `bounds` ({ count: [lo, hi], not: [kinds], items: [ids] }), `depth`, `budget` ({ ticks, used }).
 * Returns { hard: [{ rule, thing, why }], soft: [{ rule, thing, why, cost }], derived: [{ thing, attribute, value, depth }],
 * cost } (cost: the soft violations, plus `step` for each inference step a satisfied soft rule needed).
 */
export function deduceState(view, ids, opts = {}) {
  const rules = opts.rules ?? REASON_RULES;
  const KF = opts.kindFacts ?? kindFactsOf(opts.catalog ?? []);
  const depth = Math.min(opts.depth ?? REASONING.depth, REASONING.depth);
  const budget = opts.budget ?? { ticks: REASONING.ticks, used: 0 };
  const tick = (n = 1) => { budget.used += n; return budget.used <= budget.ticks; };
  const hard = [], soft = [], derived = [];
  let chain = 0; // the cost of the inference steps that satisfied a soft rule (a longer explanation costs more)
  const rule = (name) => rules.find((r) => r.name === name);
  // the facts of a thing's kinds, levels 1 and 2 (the most specific kind that has any, first)
  const kindNames = (id) => (view.thing(id)?.kinds ?? []).filter((k) => !String(k).startsWith('std.')).map(plain);
  const factsOfKind = (k, attrs) => {
    const one = (KF.get(k) ?? []).filter((f) => attrs.includes(f.attribute)).map((f) => ({ ...f, depth: 1 }));
    if (depth < 2) return one;
    const up = (KF.get(k) ?? []).filter((f) => f.attribute === 'is_a').flatMap((p) => (KF.get(p.value) ?? []).filter((f) => attrs.includes(f.attribute) && f.attribute !== 'is_a').map((f) => ({ ...f, depth: 2, via: p.value })));
    tick(one.length + up.length);
    return [...one, ...up];
  };
  for (const id of ids) {
    if (!tick()) break;
    const t = view.thing(id);
    if (!t) continue;
    // join: every relation names a thing that is there
    if (rule('join')) for (const r of t.rels) if (r.to && !view.thing(r.to)) (rule('join').hard ? hard : soft).push({ rule: 'join', thing: id, why: `the ${r.relation} of ${id} names ${r.to}, which is not there`, cost: rule('join').soft ?? 1 });
    // placed: a kind the catalog places is in or on such a place
    const P = rule('placed');
    if (P) {
      let needs = [];
      for (const k of kindNames(id)) { needs = factsOfKind(k, P.needs); if (needs.length) { needs = needs.map((f) => ({ ...f, kind: k })); break; } }
      const where = P.via.flatMap((r) => view.related(id, r)).filter(Boolean);
      if (needs.length && (where.length || opts.placeable?.(id))) {
        for (const f of needs) derived.push({ thing: id, attribute: f.attribute, value: f.value, depth: f.depth });
        const wanted = new Set(needs.map((f) => f.value));
        // the shortest chain that places it: the container's own kind (0 steps), a fact of its kind (1), of a parent (2)
        let steps = Infinity;
        for (const c of where) for (const k of kindNames(c)) { if (wanted.has(k)) steps = 0; else for (const f of factsOfKind(k, P.holds)) if (wanted.has(f.value)) steps = Math.min(steps, f.depth); }
        const ok = steps < Infinity;
        if (ok) chain += steps * (P.step ?? 0);
        if (!ok) (P.hard ? hard : soft).push({ rule: 'placed', thing: id, why: `a ${needs[0].kind} is usually at ${[...wanted].slice(0, 3).join(' or ')}${where.length ? `, not in ${where.join(', ')}` : ''}`, cost: P.soft ?? 1 });
      }
    }
    // open: a required key of the thing is open
    const O = rule('open');
    if (O && opts.required) for (const key of opts.required(t)) if (!t.attrs.has(key) && !t.rels.some((r) => r.relation === key)) (O.hard ? hard : soft).push({ rule: 'open', thing: id, why: `the ${key} of ${id} is open`, cost: O.soft ?? 1 });
  }
  // request: the bounds the plan carries, on the items it made
  const B = opts.bounds, Q = rule('request');
  if (B && Q) {
    const items = (B.items ?? []).filter((id) => view.thing(id));
    const not = new Set((B.not ?? []).map(String));
    for (const id of items) if (view.thing(id).kinds.some((k) => not.has(k))) (Q.hard ? hard : soft).push({ rule: 'request', thing: id, why: `${id} is of a kind not wanted`, cost: Q.soft ?? 1 });
    if (B.count && (items.length < B.count[0] || items.length > B.count[1])) (Q.hard ? hard : soft).push({ rule: 'request', thing: null, why: `${items.length} made, the request said ${B.count[0] === B.count[1] ? B.count[0] : `${B.count[0]} to ${B.count[1]}`}`, cost: Q.soft ?? 1 });
  }
  const cost = soft.reduce((a, x) => a + (x.cost ?? 1), 0) + chain;
  return { hard, soft, derived, cost, ticks: budget.used, exhausted: budget.used > budget.ticks };
}

// ---- induction -----------------------------------------------------------------------------------------------------------
/**
 * Anti-unification of the things of a type, one step: the attribute values all of them share (a key with one value
 * each, the same in all), at the most specific type of `types` (in order) with at least `min` things (default 3).
 * `except`: ids left out (the things a revision replaces); `keys(type)`: the keys to generalise over.
 * Returns { of, n, pattern: { key: value } } or null.
 */
export function induceStyle(view, types, { except = new Set(), min = REASONING.induceMin, keys = null } = {}) {
  for (const type of [].concat(types)) {
    const ids = view.ofKind(type).filter((id) => !except.has(id));
    if (ids.length < min) continue;
    const allowed = keys ? new Set(keys(type)) : null;
    let pattern = null;
    for (const id of ids) { // bounded: the things of the type
      const t = view.thing(id), own = {};
      for (const [k, vs] of t.attrs) if (vs.length === 1 && (!allowed || allowed.has(k))) own[k] = vs[0];
      pattern = pattern === null ? own : Object.fromEntries(Object.entries(pattern).filter(([k, v]) => own[k] !== undefined && String(own[k]) === String(v)));
      if (!Object.keys(pattern).length) break;
    }
    return { of: type, n: ids.length, pattern: pattern ?? {} };
  }
  return null;
}

/**
 * Anti-unification of a session's last corrections ([{ on, step, value }], newest last): the fields the last `min`
 * (default 2) share, when they share `on` and `step` or `value`. Returns { on, step?, value?, n } or null.
 */
export function induceCorrections(list, { min = REASONING.correctionsMin } = {}) {
  const xs = (list ?? []).slice(-min);
  if (xs.length < min) return null;
  const keys = ['on', 'step', 'value'];
  const g = Object.fromEntries(keys.filter((k) => xs.every((x) => x[k] !== undefined && x[k] === xs[0][k])).map((k) => [k, xs[0][k]]));
  return g.on && (g.step || g.value) ? { ...g, n: xs.length } : null;
}
