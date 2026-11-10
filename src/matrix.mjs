// Compilation of the consistency matrix: schema wires -> slots, rules, deny constraints.
// Pure with respect to the world: reads world.schema, world.wires and world.fns only.

import { cloneWire, str } from './parser.mjs';
import { hasVar, isVar } from './unify.mjs';
import { quantity } from './builtins.mjs';

const RANGE_CAP = 2000;

export const SCHEMA_TYPES = new Set([
  'core.slot', 'core.type', 'core.abducible', 'core.rule', 'core.deny', 'core.calc', 'core.test', 'core.use',
]);
export const LINKS = ['when', 'then', 'not', 'with', 'if'];

const first = (w, k) => w.attrs[k]?.[0];
const flag = (w, k) => first(w, k) === 'true';
const push = (map, k, v) => (map.get(k) || map.set(k, []).get(k)).push(v);

/** Rewrite `$x` into `$?x` for every x that is a pattern/template of the same rule or query. */
export function localize(w, locals) {
  const c = cloneWire(w);
  for (const k of Object.keys(c.attrs)) {
    c.attrs[k] = c.attrs[k].map((v) => (v[0] === '$' && locals.has(v.slice(1)) ? '$?' + v.slice(1) : v));
  }
  return c;
}

/** Give every wire of a module an id prefixed with the module name. */
export function prefixModule(wires, name) {
  const ids = new Set(wires.map((w) => w.id));
  return wires.map((w) => {
    const c = cloneWire(w);
    c.id = `${name}.${w.id}`;
    for (const k of Object.keys(c.attrs)) {
      c.attrs[k] = c.attrs[k].map((v) => (v[0] === '$' && ids.has(v.slice(1)) ? `$${name}.${v.slice(1)}` : v));
    }
    return c;
  });
}

export function compileMatrix(world) {
  const c = {
    rules: [], denies: [], negRules: [], ruleByType: new Map(), negByType: new Map(), denyByType: new Map(),
    slots: new Map(), closed: new Set(), idKeys: new Map(),
    abducible: new Map(), abducibleKeys: new Map(), errors: [],
  };
  for (const w of world.schema.values()) {
    const of = first(w, 'of');
    if (w.type === 'core.slot') {
      const key = first(w, 'key');
      if (!of || !key) { c.errors.push(`${w.id}: core.slot needs of= and key=`); continue; }
      const s = {
        id: w.id, of, key, required: flag(w, 'required'), many: flag(w, 'many'), identity: flag(w, 'id'),
        type: first(w, 'type'), enum: w.attrs.enum || null, default: first(w, 'default'), ask: first(w, 'ask'),
        min: quantity(first(w, 'min') ?? ''), max: quantity(first(w, 'max') ?? ''), step: quantity(first(w, 'step') ?? ''), range: null,
      };
      for (const k of ['min', 'max', 'step']) if (first(w, k) !== undefined && !s[k]) c.errors.push(`${w.id}: ${k}= must be a number`);
      // min, max and step together make the key enumerable
      if (s.min && s.max && s.step && s.step.n > 0 && s.min.unit === s.max.unit) {
        const n = Math.floor((s.max.n - s.min.n) / s.step.n + 1e-9) + 1;
        if (n > 0 && n <= RANGE_CAP) {
          s.range = Array.from({ length: n }, (_, i) => String(Number((s.min.n + i * s.step.n).toPrecision(12))) + s.min.unit);
        }
      }
      if (!c.slots.has(of)) c.slots.set(of, new Map());
      c.slots.get(of).set(key, s);
      if (s.identity) push(c.idKeys, of, key);
    } else if (w.type === 'core.type') {
      if (of && flag(w, 'closed')) c.closed.add(of);
    } else if (w.type === 'core.abducible') {
      if (!of) { c.errors.push(`${w.id}: core.abducible needs of=`); continue; }
      const cost = Math.max(Number(first(w, 'cost')) || 1, 0.001);
      const key = first(w, 'key');
      if (key) c.abducibleKeys.set(`${of}.${key}`, cost);
      else c.abducible.set(of, cost);
    } else if (w.type === 'core.rule' || w.type === 'core.deny') {
      buildRule(world, w, c);
    }
  }
  for (const r of c.rules) {
    if (r.not.length) {
      c.negRules.push(r);
      for (const n of r.not) push(c.negByType, n.type, r);
    }
    r.when.forEach((p, idx) => push(c.ruleByType, p.type, { rule: r, idx }));
  }
  for (const d of c.denies) d.when.forEach((p, idx) => push(c.denyByType, p.type, { rule: d, idx }));
  // stratification: a rule may not negate a type that its own consequences can produce
  const produces = new Map();
  for (const r of c.rules) for (const p of [...r.when, ...r.not]) for (const t of r.then) {
    (produces.get(p.type) || produces.set(p.type, new Set()).get(p.type)).add(t.type);
  }
  for (const r of c.negRules) {
    const reach = new Set(r.then.map((t) => t.type));
    for (const t of reach) for (const u of produces.get(t) || []) reach.add(u);
    const bad = r.not.find((n) => reach.has(n.type));
    if (bad) c.errors.push(`${r.id}: not stratified, its consequences can produce "${bad.type}", which it negates`);
  }
  return c;
}

function buildRule(world, w, c) {
  const locals = new Set();
  for (const k of LINKS) for (const v of w.attrs[k] || []) if (v[0] === '$') locals.add(v.slice(1));
  const get = (k) => (w.attrs[k] || []).map((v) => {
    const s = world.schema.get(v.slice(1));
    if (!s) { c.errors.push(`${w.id}: ${k}=${v} is not a wire of the matrix`); return null; }
    for (const x of Object.values(s.attrs).flat()) {
      const id = x.slice(1);
      if (x[0] === '$' && x[1] !== '?' && !locals.has(id) && !world.wires.has(id) && !world.schema.has(id)) {
        c.errors.push(`${w.id}: ${s.id} refers to unknown wire ${x} (write ?${id} for a variable)`);
      }
    }
    return localize(s, locals);
  }).filter(Boolean);
  const fn = (x, kind) => {
    const name = first(x, 'fn');
    if (!world.fns[name]) c.errors.push(`${w.id}: unknown ${kind} function "${name}"`);
    return { fn: name, out: first(x, 'out'), args: x.attrs.args || [] };
  };
  const rule = {
    id: w.id, kind: w.type === 'core.rule' ? 'rule' : 'deny',
    when: get('when'), then: get('then'), not: get('not'),
    calc: get('with').map((x) => fn(x, 'calc')), test: get('if').map((x) => fn(x, 'test')),
    why: first(w, 'why') ? str(first(w, 'why')) : undefined,
  };
  if (!rule.when.length) { c.errors.push(`${w.id}: needs at least one when=`); return; }
  if (rule.kind === 'rule' && !rule.then.length) { c.errors.push(`${w.id}: core.rule needs then=`); return; }
  for (const x of rule.calc) if (!x.out || !isVar(x.out)) c.errors.push(`${w.id}: core.calc needs out=?var`);

  const vars = new Set();
  for (const p of rule.when) {
    vars.add('?' + p.id);
    for (const v of Object.values(p.attrs).flat()) if (hasVar(v)) vars.add(v[0] === '$' ? v.slice(1) : v);
  }
  for (const x of rule.calc) if (x.out) vars.add(x.out);
  rule.vars = [...vars].sort();

  // templates in dependency order, so a template is created before the ones that refer to it
  const byId = new Map(rule.then.map((t) => [t.id, t]));
  const order = [], state = new Map();
  const visit = (t) => {
    if (state.get(t.id) === 2) return;
    if (state.get(t.id) === 1) { c.errors.push(`${w.id}: templates refer to each other in a cycle`); return; }
    state.set(t.id, 1);
    for (const v of Object.values(t.attrs).flat()) {
      if (v[0] === '$' && v[1] === '?' && byId.has(v.slice(2))) visit(byId.get(v.slice(2)));
    }
    state.set(t.id, 2);
    order.push(t);
  };
  rule.then.forEach(visit);
  rule.then = order;
  (rule.kind === 'rule' ? c.rules : c.denies).push(rule);
}
