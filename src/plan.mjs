// std.plan (Round 29): goals reached by methods that are knowledge (k.procedures, the format of
// the knowledge repository's Q44), decomposed into acts over a live world, with the method of
// each step and the alternatives it rejected. Language-free, budgeted, deterministic. The
// plan is applied by the host as one sentence (`world.act(plan.requests)`: one undo step, all
// or nothing).
//
// Alternatives: the methods of one goal whose goal facts fit, whose `world` is the live
// world's schema (or none), whose preconditions hold; then the lowest rank, then the name.
// Decomposition: a step expanded by a method whose goal fits it, to depth 3, never a method
// inside its own expansion; at most 200 acts.
//
// The knowledge is a fact store (`factStore(worlds)`: the facts of each type merged by
// identity) or a World; the chain of kinds ("a man is a person") comes from `chain`
// ([{ type, keys }]) or the store's `std.know.chain of= key=` facts.
import { parse } from './parser.mjs';

const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const num = (t) => (t === undefined ? undefined : Number(tok(t)));
const one = (a, k) => tok(a[k]?.[0]);
const all = (a, k) => (a[k] ?? []).map(tok);
export const PLAN_LIMITS = { acts: 200, depth: 3 };

/**
 * A fact store over published worlds: `worlds` = [{ id, schemaText, shards: [{ text }] }].
 * `facts(type)` gives { type, attrs, n } merged by identity (a fact told in two shards is
 * one), `index(type, key)`, and `kindsOf(world)` (a world schema's kinds by plain name).
 */
export function factStore(worlds) {
  const byType = new Map(), indexes = new Map();
  const schemaWires = worlds.flatMap((w) => parse(w.schemaText));
  const idsOf = (t, seen = new Set()) => { // bounded: the type chain, each once
    if (seen.has(t)) return [];
    seen.add(t);
    const own = schemaWires.filter((x) => x.type === 'core.slot' && x.attrs.of?.[0] === t && x.attrs.id?.[0] === 'true').map((x) => x.attrs.key[0]);
    if (own.length) return own;
    const parents = schemaWires.find((x) => x.type === 'core.type' && (x.attrs.of?.[0] ?? x.id) === t)?.attrs.extends ?? [];
    return parents.map((q) => idsOf(q, seen)).find((k) => k.length) ?? [];
  };
  return {
    facts(type) {
      if (byType.has(type)) return byType.get(type);
      const wid = worlds.map((w) => w.id).filter((id) => type.startsWith(`${id}.`)).sort((a, b) => b.length - a.length)[0];
      const world = worlds.find((w) => w.id === wid);
      const out = [], merged = new Map(), ids = idsOf(type);
      if (world) for (const s of world.shards) for (const x of parse(s.text)) { // bounded: the shards of one world
        if (x.type !== type) continue;
        const attrs = Object.fromEntries(Object.entries(x.attrs).filter(([k]) => k !== 'core.source').map(([k, vs]) => [k, vs.map(tok)]));
        const key = JSON.stringify(ids.map((k) => attrs[k]));
        const f = merged.get(key);
        if (!f) { merged.set(key, { type, attrs, n: out.length }); out.push(merged.get(key)); continue; }
        for (const [k, vs] of Object.entries(attrs)) f.attrs[k] = [...new Set([...(f.attrs[k] ?? []), ...vs])];
      }
      byType.set(type, out);
      return out;
    },
    index(type, key) {
      const id = `${type} ${key}`;
      if (!indexes.has(id)) { const ix = new Map(); for (const f of this.facts(type)) for (const v of f.attrs[key] ?? []) { if (!ix.has(v)) ix.set(v, []); ix.get(v).push(f); } indexes.set(id, ix); }
      return indexes.get(id);
    },
    kindsOf(world) {
      const types = schemaWires.filter((x) => x.type === 'core.type' && String(x.attrs.of?.[0] ?? '').startsWith(`${world}.`)).map((x) => x.attrs.of[0]);
      return types.length ? Object.fromEntries(types.map((t) => [t.slice(world.length + 1), t])) : null;
    },
  };
}

/** A working live world for planning: things with a kind and attributes, groups, links, the history of acts. */
export class PlanLive {
  constructor({ world = null, things = [], history = [], kinds = null, store = null } = {}) {
    this.world = world; this.things = new Map(); this.count = new Map(); this.history = history.map((h, i) => ({ at: i + 1, ...h })); this.links = [];
    this.kinds = kinds ?? (world && store?.kindsOf ? store.kindsOf(world) : null); // plain kind -> the world schema's (table -> w.seating.table)
    for (const t of things) this.add(t.kind, t.id, t.attrs ?? {}, t);
  }
  add(kind, id, attrs = {}, extra = {}) {
    const k = String(kind);
    if (!id) { const base = k.replace(/\s+/g, '_'); let n = this.count.get(base) ?? 0; do n += 1; while (this.things.has(`${base}${n}`)); this.count.set(base, n); id = `${base}${n}`; } // bounded: the things
    const t = { id, kind: k, attrs: { ...attrs }, members: extra.members ?? [], on: extra.on, in: extra.in };
    this.things.set(id, t);
    return t;
  }
  thing(v) { return typeof v === 'object' && v?.id && this.things.get(v.id) === v ? v : (typeof v === 'string' ? this.things.get(v) : undefined); }
}

/** A planner over the methods of a knowledge store. Options: `chain`, `prefix` (default k.procedures), `roles` (default k.actions.role). */
export function planner(store, { chain, prefix = 'k.procedures', roles = 'k.actions.role' } = {}) {
  const k = store;
  const links = chain ?? store.facts('std.know.chain').map((f) => ({ type: f.attrs.of[0], keys: f.attrs.key })); // what "is a kind of" is
  const parentsCache = new Map();
  const parents = (name) => {
    if (parentsCache.has(name)) return parentsCache.get(name);
    const up = new Set(), todo = [name];
    parentsCache.set(name, up);
    while (todo.length) { // bounded: each name once (up)
      const n = todo.pop();
      for (const { type, keys } of links) for (const f of k.facts(type)) {
        if (!(f.attrs.name ?? []).includes(n)) continue;
        for (const key of keys) for (const p of f.attrs[key] ?? []) if (!up.has(p) && p !== name) { up.add(p); todo.push(p); }
      }
    }
    return up;
  };
  const isA = (a, b) => a === b || parents(String(a)).has(String(b));
  const methods = readMethods(store, prefix);
  const needed = new Set(k.facts(roles).filter((f) => f.attrs.needed?.[0] === 'true').map((f) => `${f.attrs.act[0]} ${f.attrs.name[0]}`));
  const same = (x, r) => x === r || x === 'thing' || x === 'any' || (x !== undefined && r !== undefined && isA(r, x));
  const keyOf = (live, item, key) => {
    if (item === undefined || item === null) return [];
    if (!key) return [item];
    if (item.type && item.attrs) return item.attrs[key] ?? [];
    const t = live.thing(item);
    if (t) return key === 'kind' ? [t.kind] : key === 'id' ? [t.id] : (t.attrs[key] !== undefined ? [].concat(t.attrs[key]) : []);
    if (typeof item === 'object') return item[key] !== undefined ? [item[key]] : [];
    return key === 'kind' || key === 'name' ? [item] : [];
  };
  const kindName = (live, v) => { const t = live.thing(v); return t ? t.kind : v; };
  const show = (live, item) => { if (item && item.type && item.attrs) return item.attrs.name?.[0] ?? JSON.stringify(item.attrs); const t = live.thing(item); return t ? t.id : String(item); };
  const roleValue = (goal, role, g) => { const x = goal.roles?.[role]; return x === undefined ? (g?.default !== undefined ? g.default : undefined) : x; };

  function values(ctx, name) { // bounded: bindings name earlier ones (together, upto, equals); the method facts have no cycle
    const { live, env, method } = ctx;
    if (env.current.has(name)) return [env.current.get(name)];
    const bd = method.bind[name];
    if (!bd) throw new Error(`sopworld: plan: ${method.name}: no binding ${name}`);
    let vals;
    if (bd.goal) { const x = roleValue(env.goal, bd.goal, method.goal[bd.goal]); vals = x === undefined ? [] : [].concat(x && typeof x === 'object' && !Array.isArray(x) && 'value' in x ? x.value : x); }
    else if (bd.step.length) vals = bd.step.flatMap((s) => (env.made.get(s) ?? []).filter((t) => !t.id || live.things.has(t.id)));
    else if (bd.from) vals = candidates(ctx, bd).filter((f) => passes(ctx, bd, f));
    else if (bd.live) vals = [...live.things.values()].filter((t) => (bd.live === 'any' || same(bd.live, t.kind)) && passes(ctx, bd, t));
    else if (bd.together.length) vals = bd.together.flatMap((x) => values(ctx, x));
    else if (bd.history) vals = [...(live.before ?? live.history)];
    else if (bd.upto) { const n = Number(values(ctx, bd.upto)[0] ?? 0); vals = Array.from({ length: n }, (_, i) => i + 1); }
    else vals = bd.value === undefined ? [] : [bd.value];
    if (bd.key) vals = [...new Set(vals.flatMap((x) => keyOf(live, x, bd.key)))];
    return vals;
  }
  function candidates(ctx, bd) {
    const facts = k.facts(bd.from);
    const m = Object.entries(bd.match).find(([, t]) => t.equals);
    if (!m) return facts;
    const [key, t] = m;
    const refs = values(ctx, t.equals).flatMap((r) => (t.equals_key ? keyOf(ctx.live, r, t.equals_key) : [kindName(ctx.live, r)]));
    const want = new Set(['thing', 'any']);
    for (const r of refs) { want.add(r); for (const p of parents(String(r))) want.add(p); }
    const index = k.index(bd.from, key);
    return [...new Set([...want].flatMap((w) => index.get(w) ?? []))].sort((a, b) => a.n - b.n);
  }
  function passes(ctx, bd, item) {
    for (const [key, t] of Object.entries(bd.match)) {
      const vals = keyOf(ctx.live, item, key);
      if (t.present !== undefined && (vals.length > 0) !== t.present) return false;
      if (t.value !== undefined && !vals.includes(t.value)) return false;
      if (t.not !== undefined && vals.includes(t.not)) return false;
      if (t.equals) {
        const refs = values(ctx, t.equals).flatMap((r) => (t.equals_key ? keyOf(ctx.live, r, t.equals_key) : [kindName(ctx.live, r)]));
        if (!vals.some((x) => refs.some((r) => same(x, r)))) return false;
      }
    }
    return true;
  }
  function holds(ctx, c) {
    const { live } = ctx;
    const vals = values(ctx, c.thing);
    const present = (x) => (live.thing(x) ? true : (typeof x === 'string' ? [...live.things.values()].some((t) => same(x, t.kind) && x === t.kind) : x !== undefined));
    const things = () => vals.map((x) => live.thing(x) ?? [...live.things.values()].find((t) => t.kind === x)).filter(Boolean);
    const other = () => (c.other ? values(ctx, c.other).map((x) => live.thing(x) ?? [...live.things.values()].find((t) => t.kind === x)).filter(Boolean) : []);
    switch (c.fact) {
      case 'exists': return ctx.method.bind[c.thing]?.goal && !ctx.env.current.has(c.thing) ? vals.some(present) : vals.length > 0;
      case 'absent': return ctx.method.bind[c.thing]?.goal && !ctx.env.current.has(c.thing) ? !vals.some(present) : vals.length === 0;
      case 'on': return things().length > 0 && things().every((t) => other().some((o) => t.on === o.id));
      case 'inside': return things().length > 0 && things().every((t) => other().some((o) => t.in === o.id));
      case 'grouped': { const gs = c.other ? other() : [...live.things.values()].filter((g) => g.kind === 'group'); return things().length > 0 && things().every((t) => gs.some((g) => g.members.includes(t.id))); }
      case 'has': return vals.some((x) => { const v = keyOf(live, x, c.attribute); return v.length > 0 && (c.value === undefined || v.includes(c.value)); });
      default: throw new Error(`sopworld: plan: unknown condition fact ${c.fact}`);
    }
  }
  function fits(method, goal, live) {
    if (method.act !== goal.act) return { ok: false, why: 'another act' };
    const asks = [];
    for (const [role, g] of Object.entries(method.goal)) {
      const x = roleValue(goal, role, g);
      if (x === undefined) { if (g.needed) { asks.push(role); continue; } if (g.from || g.value || g.kind || g.rel) return { ok: false, why: `no ${role}` }; continue; }
      const v = x && typeof x === 'object' && !Array.isArray(x) && 'value' in x ? x.value : x;
      const name = kindName(live, [].concat(v)[0]);
      if (g.value !== undefined && name !== g.value) return { ok: false, why: `${role} is not ${g.value}` };
      if (g.kind !== undefined && !same(g.kind, name)) return { ok: false, why: `${role} is no ${g.kind}` };
      if (g.rel !== undefined && x?.rel !== g.rel) return { ok: false, why: `${role} not ${g.rel}` };
      if (g.from && !k.facts(g.from).some((f) => (f.attrs[g.by ?? 'name'] ?? []).some((y) => same(y, name)))) return { ok: false, why: `${name} is no ${g.from}` };
    }
    return { ok: true, asks };
  }
  function choose(goal, live, above = []) {
    const tried = [], ok = [];
    for (const m of methods) { // bounded: the methods
      if (above.includes(m.name)) continue;
      const f = fits(m, goal, live);
      if (!f.ok) { if (m.act === goal.act) tried.push({ method: m.name, why: f.why }); continue; }
      if (m.world && m.world !== live.world) { tried.push({ method: m.name, why: `only in ${m.world}` }); continue; }
      const ctx = { live, method: m, env: { goal, made: new Map(), current: new Map() } };
      const failing = m.conditions.filter((c) => c.when === 'before' && !c.step).find((c) => !holds(ctx, c));
      if (failing) { tried.push({ method: m.name, why: `${failing.fact} ${failing.thing}` }); continue; }
      ok.push({ m, asks: f.asks });
    }
    ok.sort((p, q) => p.m.rank - q.m.rank || (p.m.name < q.m.name ? -1 : 1));
    return { chosen: ok[0], others: ok.slice(1).map((x) => x.m.name), tried };
  }
  const order = (method) => {
    const done = new Set(), res = [], left = [...method.steps];
    while (left.length) { // bounded: the steps of one method
      const i = left.findIndex((s) => s.after.every((a) => done.has(a)));
      if (i < 0) throw new Error(`sopworld: plan: ${method.name}: steps in a circle`);
      const [s] = left.splice(i, 1); done.add(s.n); res.push(s);
    }
    return res;
  };
  function expand(method, goal, live, depth, out, above) { // bounded: depth < PLAN_LIMITS.depth, acts < PLAN_LIMITS.acts
    out.methods.push(method.name);
    const env = { goal, made: new Map(), current: new Map() };
    const ctx = { live, method, env };
    const made = [];
    for (const step of order(method)) {
      const items = step.each ? values(ctx, step.each) : [undefined];
      for (const item of items) {
        if (step.each) env.current.set(step.each, item);
        const pre = method.conditions.filter((c) => c.when === 'before' && c.step === step.n);
        if (pre.some((c) => !holds(ctx, c))) { out.skipped.push(`${method.name} ${step.n}`); continue; }
        const args = [];
        let empty = false;
        for (const a of step.args) {
          let vals;
          if (a.binding) {
            vals = values(ctx, a.binding).flatMap((x) => { const kk = keyOf(live, x, a.key); return kk.length || !a.else_key ? (a.key ? kk : [x]) : keyOf(live, x, a.else_key); });
            if (!a.key) vals = vals.map((x) => (x && x.type && x.attrs ? x.attrs.name?.[0] : x));
          } else vals = [a.value];
          if (vals.length === 0 || vals[0] === undefined) { if (a.binding && method.bind[a.binding]?.goal && !needed.has(`${step.act} ${a.role}`)) continue; empty = true; break; }
          let rel = a.rel;
          const bd = a.binding && method.bind[a.binding];
          if (!rel && a.role === 'place' && bd?.goal) { const g = env.goal.roles?.[bd.goal]; if (g && typeof g === 'object' && !Array.isArray(g)) rel = g.rel; }
          const ofv = a.of ? values(ctx, a.of).map((x) => live.thing(x) ?? [...live.things.values()].find((t) => t.kind === x) ?? x)[0] : undefined;
          args.push({ ...a, rel, vals, ofv });
        }
        if (empty) { out.skipped.push(`${method.name} ${step.n}${step.each ? ` ${show(live, item)}` : ''}`); continue; }
        const sub = step.expand && depth + 1 < PLAN_LIMITS.depth ? subgoal(step, args, live) : null;
        let things;
        if (sub) {
          const c = choose(sub, live, above);
          if (c.chosen && !c.chosen.asks.length) {
            const before = new Set(live.things.keys());
            expand(c.chosen.m, sub, live, depth + 1, out, [...above, c.chosen.m.name]);
            things = [...live.things.values()].filter((t) => !before.has(t.id));
          }
        }
        if (!things) things = act(step, args, live, out, method);
        env.made.set(step.n, [...(env.made.get(step.n) ?? []), ...things]);
        made.push(...things);
        if (out.acts.length > PLAN_LIMITS.acts) { out.truncated = true; return made; }
      }
      if (step.each) env.current.delete(step.each);
    }
    for (const c of method.conditions.filter((x) => x.when === 'after')) out.effects.push({ method: method.name, fact: c.fact, thing: c.thing, ok: holds(ctx, c) });
    return made;
  }
  function subgoal(step, args, live) {
    const roles = {};
    for (const a of args) {
      const v = a.vals.length === 1 ? a.vals[0] : a.vals;
      if (a.role === 'value' && a.attribute) continue;
      roles[a.role] = a.rel || a.ofv ? { value: a.ofv ? (live.thing(a.ofv) ? a.ofv.id : a.ofv) : (live.thing(v)?.id ?? v), rel: a.rel, part: a.ofv ? v : undefined } : (live.thing(v)?.id ?? v);
    }
    return { act: step.act, roles };
  }
  function act(step, args, live, out, method) {
    const words = [step.act === 'take apart' ? 'take_apart' : step.act];
    const shown = (x) => show(live, x);
    const get = (role) => args.find((a) => a.role === role && !a.attribute);
    const request = { action: step.act, args: {} };
    for (const a of args) {
      let vs = a.vals;
      if (a.role === 'kind' && live.kinds) vs = vs.map((x) => live.kinds[x] ?? x);
      words.push(`${a.attribute ?? a.role}=${vs.map(shown).join(',')}`);
      request.args[a.attribute ?? a.role] = vs.length === 1 ? shown(vs[0]) : vs.map(shown);
      if (a.ofv !== undefined) { words.push(`of=${shown(a.ofv)}`); request.args.of = shown(a.ofv); }
      if (a.rel) { words.push(`rel=${a.rel}`); request.args.rel = a.rel; }
    }
    out.lines.push(words.join(' '));
    out.explain.push(`${method.name}${step.about ? ` (${step.about})` : ''}: ${words.join(' ')}`);
    out.acts.push({ act: step.act, args });
    out.requests.push(request);
    const attrs = Object.fromEntries(args.filter((a) => a.role === 'value' && a.attribute).map((a) => [a.attribute, a.vals.length === 1 ? (live.thing(a.vals[0])?.id ?? a.vals[0]) : a.vals]));
    const placeOf = (a) => (a ? (a.ofv !== undefined ? live.thing(a.ofv) : (live.thing(a.vals[0]) ?? [...live.things.values()].find((t) => t.kind === a.vals[0]))) : undefined);
    const record = (thing) => live.history.push({ act: step.act, thing, at: live.history.length + 1 });
    switch (step.act) {
      case 'make': {
        const n = Number(get('number')?.vals[0] ?? 1), p = get('place'), target = placeOf(p), res = [];
        for (let i = 0; i < n; i++) res.push(live.add(get('kind').vals[0], undefined, attrs, { on: p?.rel === 'on' && target ? target.id : undefined, in: p?.rel === 'in' && target ? target.id : undefined }));
        record(res[0]?.id);
        return res;
      }
      case 'place': { const p = get('place'), target = placeOf(p); for (const x of get('thing').vals) { const t = live.thing(x); if (t && target) { if (p.rel === 'in') t.in = target.id; else t.on = target.id; } } record(shown(get('thing').vals[0])); return []; }
      case 'remove': for (const x of get('thing').vals) live.things.delete(live.thing(x)?.id); record(shown(get('thing').vals[0])); return [];
      case 'change': record(shown(get('thing').vals[0])); return [];
      case 'connect': live.links.push([shown(get('thing').vals[0]), shown(get('target')?.vals[0])]); record(shown(get('thing').vals[0])); return [];
      case 'group': { const g = live.add('group', undefined, { name: get('group')?.vals[0] }, { members: get('thing').vals.map((x) => live.thing(x)?.id).filter(Boolean) }); record(g.id); return [g]; }
      case 'take apart': live.things.delete(live.thing(get('thing').vals[0])?.id); record(shown(get('thing').vals[0])); return [];
      case 'ask': { const counts = new Map(); for (const x of get('thing')?.vals ?? []) { const t = live.thing(x); if (t) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1); } return [...counts].sort((p, q) => (p[0] < q[0] ? -1 : 1)).map(([kind, count]) => ({ kind, count })); }
      default: record(undefined); return [];
    }
  }
  return {
    methods,
    isA,
    /**
     * The plan for a goal ({ act, roles }) over a live world (a PlanLive): { method, acts,
     * lines, explain, requests, methods, skipped, effects, asks, refused?, tried?, truncated? }.
     */
    plan(goal, live = new PlanLive({ store })) {
      const out = { acts: [], lines: [], explain: [], requests: [], skipped: [], methods: [], effects: [], asks: [] };
      const top = choose(goal, live);
      if (!top.chosen) return { ...out, refused: true, tried: top.tried };
      if (top.chosen.asks.length) return { ...out, method: top.chosen.m.name, asks: top.chosen.asks };
      out.method = top.chosen.m.name;
      live.before = [...live.history];
      expand(top.chosen.m, goal, live, 0, out, [top.chosen.m.name]);
      return out;
    },
  };
}

/** The methods of a knowledge store (the Q44 format under `prefix`). */
export function readMethods(k, prefix = 'k.procedures') {
  const of = (type) => k.facts(`${prefix}.${type}`).map((f) => f.attrs);
  const methods = new Map();
  for (const a of of('method')) methods.set(one(a, 'name'), { name: one(a, 'name'), about: one(a, 'about'), act: one(a, 'act'), world: one(a, 'world'), rank: num(a.rank?.[0]) ?? 1, example: all(a, 'example'), goal: {}, bind: {}, steps: [], conditions: [] });
  const m = (a) => { const x = methods.get(one(a, 'method')); if (!x) throw new Error(`sopworld: plan: no method ${one(a, 'method')}`); return x; };
  for (const a of of('goal')) m(a).goal[one(a, 'role')] = { from: one(a, 'from'), by: one(a, 'by'), value: one(a, 'value'), kind: one(a, 'kind'), rel: one(a, 'rel'), needed: one(a, 'needed') === 'true', default: one(a, 'default') };
  for (const a of of('binding')) m(a).bind[one(a, 'name')] = { goal: one(a, 'goal'), step: (a.step ?? []).map(num), from: one(a, 'from'), live: one(a, 'live'), history: one(a, 'history') === 'true', upto: one(a, 'upto'), together: all(a, 'together'), value: one(a, 'value'), key: one(a, 'key'), match: {} };
  for (const a of of('match')) { const bd = m(a).bind[one(a, 'binding')]; if (!bd) throw new Error(`sopworld: plan: match on unknown binding ${one(a, 'binding')}`); bd.match[one(a, 'key')] = { value: one(a, 'value'), not: one(a, 'not'), equals: one(a, 'equals'), equals_key: one(a, 'equals_key'), present: a.present ? one(a, 'present') === 'true' : undefined }; }
  for (const a of of('step')) m(a).steps.push({ n: num(a.n[0]), act: one(a, 'act'), each: one(a, 'each'), after: (a.after ?? []).map(num), expand: one(a, 'expand') !== 'false', optional: one(a, 'optional') === 'true', about: one(a, 'about'), args: [] });
  for (const x of methods.values()) x.steps.sort((p, q) => p.n - q.n);
  for (const a of of('arg')) { const st = m(a).steps.find((s) => s.n === num(a.step[0])); st.args.push({ role: one(a, 'role'), attribute: one(a, 'attribute'), binding: one(a, 'binding'), key: one(a, 'key'), else_key: one(a, 'else_key'), value: one(a, 'value'), rel: one(a, 'rel'), of: one(a, 'of') }); }
  for (const a of of('condition')) m(a).conditions.push({ n: num(a.n[0]), step: num(a.step?.[0]), when: one(a, 'when'), fact: one(a, 'fact'), thing: one(a, 'thing'), other: one(a, 'other'), attribute: one(a, 'attribute'), value: one(a, 'value') });
  return [...methods.values()];
}
