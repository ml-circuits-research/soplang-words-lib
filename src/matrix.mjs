// Compilation of the consistency matrix: schema wires -> slots, rules, deny constraints.
// Pure with respect to the world: reads world.matrix, world.wires and world.fns only.

import { cloneWire, str } from './parser.mjs';
import { hasVar, isVar } from './unify.mjs';
import { quantity, clock, date, aggregates } from './builtins.mjs';

const RANGE_CAP = 2000;

export const SCHEMA_TYPES = new Set([
  'core.slot', 'core.type', 'core.abducible', 'core.rule', 'core.deny', 'core.calc', 'core.check', 'core.use',
  'core.schema.map', 'core.namespace', 'core.producer', 'core.action',
  'core.sequence', 'core.fluent', 'core.effect',
]);

/**
 * A core.schema.map wire says how wires of another notation declare a schema, so that an
 * existing schema can be loaded unchanged:
 *   @m core.schema.map from=<wire type> as=slot|type|module  <field>=<where to find it> ...
 * A field is read from the foreign wire by: `id` (its id), `id.prefix` (the id up to the
 * last dot), `id.suffix` (the rest), `<attr>` (an attribute), or `<attr>:<value>` (true
 * when the attribute has that value).
 */
export function readMap(w) {
  const m = { id: w.id, from: first(w, 'from'), as: first(w, 'as') || 'slot', fields: {} };
  for (const k of Object.keys(w.attrs)) if (k !== 'from' && k !== 'as') m.fields[k] = w.attrs[k][0];
  return m;
}
function field(spec, w, all = false) {
  if (spec === undefined) return all ? [] : undefined;
  const dot = w.id.lastIndexOf('.');
  let vals;
  if (spec === 'id') vals = [w.id];
  else if (spec === 'id.prefix') vals = dot > 0 ? [w.id.slice(0, dot)] : [];
  else if (spec === 'id.suffix') vals = dot > 0 ? [w.id.slice(dot + 1)] : [w.id];
  else if (spec.includes(':')) {
    const [attr, value] = spec.split(':');
    vals = [(w.attrs[attr] || []).includes(value) ? 'true' : 'false'];
  } else vals = w.attrs[spec] || [];
  return all ? vals : vals[0];
}

// Literal kinds a slot may declare with kind=. A reference is declared with type=.
const KINDS = {
  integer: (v) => /^-?\d+$/.test(v),
  number: (v) => { const q = quantity(v); return !!q && !q.unit; },
  boolean: (v) => v === 'true' || v === 'false',
  string: (v) => v[0] !== '$',
  atom: (v) => v[0] !== '$' && v[0] !== '"',
  any: () => true, // any literal or reference
  'time.clock': (v) => !!clock(v),
  'time.date': (v) => date(v) !== null,
  'time.datetime': (v) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.test(v) && !Number.isNaN(Date.parse(v)),
  'time.duration': (v) => { const q = quantity(v); return !!q && ['s', 'sec', 'min', 'm', 'h', 'd', 'day', 'days', 'w', 'week', 'weeks'].includes(q.unit); },
};
/** Is the kind one the library checks? */
export function knownKind(kind) {
  return kind in KINDS || kind.startsWith('quantity.') || kind.startsWith('time.');
}
/** Does the value fit the literal kind? Unknown kinds accept any value that is not a reference. */
export function fitsKind(kind, v) {
  if (KINDS[kind]) return KINDS[kind](v);
  if (kind.startsWith('quantity.')) return !!quantity(v);
  return v[0] !== '$'; // other time.* kinds and kinds this version does not know: any literal
}
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
    closed: new Set(), abducible: new Map(), abducibleKeys: new Map(), errors: [],
    types: new Map(),    // declared type name -> the wire that declares it
    parent: new Map(),   // type -> the type it extends
    maps: new Map(),     // foreign wire type -> how it declares a slot, a type or a module
    modules: new Map(),  // module name -> { wire, imports } for modules that declare themselves
    openPrefixes: ['core.'], // keys with these prefixes are always allowed and never shortened
    complete: new Set(),  // types whose instances are all known (closed world for existence)
    producers: new Map(), // <type>.<key> -> functions that can compute the key when no wire has it
    actions: new Map(),   // action name -> the function that carries it out
    seqKey: null,         // the key that carries a wire's place in the sequence, when one is declared
    fluents: new Map(),   // fluent id -> { id, of, key, by, effects }
    fluentsByType: new Map(), // holder type -> fluents
    effectsByEvent: new Map(), // event type -> effects
  };
  for (const w of world.matrix.values()) {
    if (w.type === 'core.schema.map') {
      const m = readMap(w);
      if (!m.from || !['slot', 'type', 'module'].includes(m.as)) c.errors.push(`${w.id}: core.schema.map needs from= and as=slot|type|module`);
      else c.maps.set(m.from, m);
    } else if (w.type === 'core.namespace') {
      const prefix = first(w, 'prefix');
      if (prefix && flag(w, 'open') && !c.openPrefixes.includes(prefix)) c.openPrefixes.push(prefix);
    }
  }
  const own = new Map(); // type -> Map(key -> slot) declared on that type itself
  const declare = (of, key, s) => (own.get(of) || own.set(of, new Map()).get(of)).set(key, s);
  for (const w of world.matrix.values()) {
    const of = first(w, 'of');
    const map = c.maps.get(w.type);
    if (w.type === 'core.slot' || map?.as === 'slot') {
      // native: core.slot of=T key=k ...   foreign: the fields are read through the map
      const f = map ? map.fields : null;
      const get = (name, native = name) => (f ? field(f[name], w) : first(w, native));
      const list = (name, native = name) => (f ? field(f[name], w, true) : w.attrs[native] || []);
      const type = f ? field(f.owner || 'id.prefix', w) : of;
      const key = f ? field(f.key || 'id.suffix', w) : first(w, 'key');
      if (!type || !key) { c.errors.push(`${w.id}: ${w.type} needs a type and a key`); continue; }
      // value= of a map holds kinds and $type references together; kind= and type= hold one sort each
      const mixed = list('value', '\u0000none');
      const kinds = [...list('kind'), ...mixed.filter((v) => v[0] !== '$')];
      const refs = [...list('type'), ...mixed.filter((v) => v[0] === '$')].map((v) => (v[0] === '$' ? v.slice(1) : v));
      const en = list('enum');
      const s = {
        id: w.id, of: type, key, required: get('required') === 'true', many: get('many') === 'true', identity: get('id') === 'true',
        prefix: get('prefix') === 'true', // the key is a prefix: any key that starts with it is this slot
        type: refs[0], refs, kinds, enum: en.length ? en : null, default: get('default'), ask: get('ask'),
        min: quantity(get('min') ?? ''), max: quantity(get('max') ?? ''), step: quantity(get('step') ?? ''), range: null,
        attrs: w.attrs, // everything the wire says, used or not
      };
      for (const k of ['min', 'max', 'step']) if (get(k) !== undefined && !s[k]) c.errors.push(`${w.id}: ${k} must be a number`);
      // min, max and step together make the key enumerable
      if (s.min && s.max && s.step && s.step.n > 0 && s.min.unit === s.max.unit) {
        const n = Math.floor((s.max.n - s.min.n) / s.step.n + 1e-9) + 1;
        if (n > 0 && n <= RANGE_CAP) {
          s.range = Array.from({ length: n }, (_, i) => String(Number((s.min.n + i * s.step.n).toPrecision(12))) + s.min.unit);
        }
      }
      declare(type, key, s);
    } else if (w.type === 'core.type' || map?.as === 'type') {
      // core.type of=T names its type with of=; without of= the wire id is the type name
      const f = map ? map.fields : null;
      const name = f ? field(f.name || 'id', w) : of || w.id;
      // root= in a map: the parent of a type that names none
      const ext = (f ? field(f.extends, w) : first(w, 'extends')) || (f && f.root && f.root !== name ? f.root : undefined);
      const closed = f ? field(f.closed, w) === 'true' : flag(w, 'closed');
      if (!name) { c.errors.push(`${w.id}: the type has no name`); continue; }
      c.types.set(name, w);
      if (closed) c.closed.add(name);
      if (f ? field(f.complete, w) === 'true' : flag(w, 'complete')) c.complete.add(name);
      if (ext && ext !== name) c.parent.set(name, ext);
    } else if (map?.as === 'module') {
      const name = field(map.fields.name || 'id', w);
      if (!name) c.errors.push(`${w.id}: the module has no name`);
      else c.modules.set(name, { wire: w, imports: field(map.fields.imports, w, true) });
    } else if (w.type === 'core.sequence') {
      c.seqKey = first(w, 'key') || null;
    } else if (w.type === 'core.fluent') {
      const key = first(w, 'key');
      if (!of || !key) { c.errors.push(`${w.id}: core.fluent needs of= and key=`); continue; }
      const f = { id: w.id, of, key, by: w.attrs.by || [], effects: [] };
      c.fluents.set(w.id, f);
      push(c.fluentsByType, of, f);
    } else if (w.type === 'core.producer') {
      const key = first(w, 'key'), fn = first(w, 'fn');
      if (!of || !key || !fn) { c.errors.push(`${w.id}: core.producer needs of=, key= and fn=`); continue; }
      if (!world.fns[fn]) c.errors.push(`${w.id}: unknown function "${fn}"`);
      push(c.producers, `${of}.${key}`, { id: w.id, fn });
    } else if (w.type === 'core.action') {
      const name = first(w, 'name'), fn = first(w, 'fn');
      if (!name || !fn) { c.errors.push(`${w.id}: core.action needs name= and fn=`); continue; }
      if (!world.fns[fn]) c.errors.push(`${w.id}: unknown function "${fn}"`);
      c.actions.set(name, { id: w.id, fn, required: w.attrs.required || [], inputs: w.attrs.input || [], ask: w.attrs });
    } else if (w.type === 'core.abducible') {
      if (!of) { c.errors.push(`${w.id}: core.abducible needs of=`); continue; }
      const cost = Math.max(Number(first(w, 'cost')) || 1, 0.001);
      const key = first(w, 'key');
      if (key) c.abducibleKeys.set(`${of}.${key}`, cost);
      else c.abducible.set(of, cost);
    }
  }

  // effects: how an event type changes a fluent
  for (const w of world.matrix.values()) {
    if (w.type !== 'core.effect') continue;
    const on = first(w, 'on'), fluent = c.fluents.get((first(w, 'fluent') || '').replace(/^\$/, ''));
    const op = first(w, 'op') || 'set';
    if (!on || !fluent) { c.errors.push(`${w.id}: core.effect needs on=<event type> and fluent=$<a core.fluent>`); continue; }
    if (!['add', 'sub', 'set'].includes(op) && !world.fns[op]) c.errors.push(`${w.id}: unknown function "${op}"`);
    const where = [];
    for (const k of Object.keys(w.attrs)) if (k.startsWith('where.')) where.push([k.slice(6), w.attrs[k][0]]);
    const e = { id: w.id, on, fluent, op, amount: first(w, 'amount'), value: first(w, 'value'), target: first(w, 'for'), where };
    if (!e.target && !where.length) c.errors.push(`${w.id}: core.effect needs for=<event key that refers to the holder> or where.<holder key>=<event key>`);
    if (e.amount === undefined && e.value === undefined) c.errors.push(`${w.id}: core.effect needs amount=<event key> or value=<literal>`);
    fluent.effects.push(e);
    push(c.effectsByEvent, on, e);
  }

  // ---- type hierarchy: a type, then what it extends, up to the root
  const lineages = new Map();
  c.lineage = (type) => {
    let l = lineages.get(type);
    if (!l) {
      l = [type];
      for (let t = c.parent.get(type); t && !l.includes(t); t = c.parent.get(t)) l.push(t);
      lineages.set(type, l);
    }
    return l;
  };
  c.isA = (type, ancestor) => type === ancestor || c.lineage(type).includes(ancestor);
  c.hierarchy = [...c.parent].map(([t, p]) => `${t}<${p}`).sort().join(' ');
  for (const [t, p] of c.parent) {
    let x = p;
    for (let n = 0; x && n < 1000; n++) { if (x === t) { c.errors.push(`${t}: the type extends itself through ${p}`); break; } x = c.parent.get(x); }
  }

  // ---- slots of a type: its own and the inherited ones, the nearest declaration winning
  const effective = new Map();
  c.slots = {
    get(type) {
      if (effective.has(type)) return effective.get(type);
      let merged;
      const line = c.lineage(type);
      for (let i = line.length - 1; i >= 0; i--) {
        const mine = own.get(line[i]);
        if (!mine) continue;
        merged = merged || new Map();
        for (const [k, s] of mine) merged.set(k, s);
      }
      effective.set(type, merged);
      return merged;
    },
  };
  /** The slot of a key: declared under that name, or a prefix slot the key starts with. */
  c.slotOf = (type, key) => {
    const slots = c.slots.get(type);
    if (!slots) return undefined;
    const exact = slots.get(key);
    if (exact) return exact;
    for (const s of slots.values()) if (s.prefix && key.startsWith(s.key.endsWith('.') ? s.key : s.key + '.')) return s;
    return undefined;
  };
  // ---- keys that hold numbers by declaration (every kind of the slot is integer or number):
  // their values are indexed and compared in one canonical spelling, so 5 and 5.0 are one value
  const numeric = new Map();
  const isNumber = (s) => !!s && !s.prefix && s.kinds.length > 0 && s.kinds.every((k) => k === 'integer' || k === 'number');
  c.numKeys = new Set();
  const declared = [];
  for (const [type, mine] of own) for (const [k, s] of mine) if (isNumber(s)) { c.numKeys.add(k); declared.push(`${type}.${k}`); }
  c.numbers = declared.sort().join(' ');
  c.numeric = (type, key) => {
    if (!c.numKeys.has(key)) return false;
    const id = type + '\u0001' + key;
    let n = numeric.get(id);
    if (n === undefined) numeric.set(id, (n = isNumber(c.slotOf(type, key))));
    return n;
  };
  const identity = new Map();
  c.idKeys = {
    get(type) {
      if (!identity.has(type)) {
        const keys = [...(c.slots.get(type)?.values() || [])].filter((s) => s.identity).map((s) => s.key);
        identity.set(type, keys.length ? keys : undefined);
      }
      return identity.get(type);
    },
  };
  /** A key written in full (<type>.<key>, for the wire's type or an ancestor) and its short form are one key. */
  c.isOpenKey = (key) => c.openPrefixes.some((p) => key.startsWith(p));
  c.shortKey = (type, key) => {
    if (key.indexOf('.') < 0 || c.isOpenKey(key)) return key;
    for (const t of c.lineage(type)) if (key.startsWith(t + '.') && key.indexOf('.', t.length + 1) < 0) return key.slice(t.length + 1);
    return key;
  };

  for (const w of world.matrix.values()) {
    if (w.type === 'core.rule' || w.type === 'core.deny') buildRule(world, w, c);
  }
  c.selRules = [];
  for (const r of c.rules) {
    if (r.not.length) {
      c.negRules.push(r);
      for (const n of r.not) push(c.negByType, n.type, r);
    }
    // a rule with a selector is not driven by single wires: it is re-evaluated in full when things are quiet
    if (r.selective) { c.selRules.push(r); if (!r.not.length) c.negRules.push(r); }
    if (r.hasSelect) continue;
    r.when.forEach((p, idx) => push(c.ruleByType, p.type, { rule: r, idx }));
  }
  c.overByType = new Map(); // type of an aggregated pattern -> { rule, pat, group }
  for (const r of [...c.rules, ...c.denies]) for (const o of r.overs) push(c.overByType, o.pat.type, { rule: r, ...o });
  for (const d of c.denies) d.when.forEach((p, idx) => push(c.denyByType, p.type, { rule: d, idx }));
  // Entries of a by-type index for a wire of the given type: its own and its ancestors'.
  const merged = new Map();
  c.forType = (index, type) => {
    let per = merged.get(index);
    if (!per) merged.set(index, (per = new Map()));
    let list = per.get(type);
    if (!list) {
      list = [];
      for (const t of c.lineage(type)) for (const x of index.get(t) || []) list.push(x);
      per.set(type, list);
    }
    return list;
  };
  // stratification: a rule may not negate a type that its own consequences can produce.
  // A produced wire also feeds the rules whose patterns name one of its ancestor types.
  // A template that adds keys to a matched wire (core.on=) can only wake a pattern that
  // names one of those keys; a template that makes a wire can wake any pattern of its type.
  const made = (r) => r.then.map((t) => ({ type: t.type, keys: t.on ? Object.keys(t.attrs) : null }));
  const wakes = (item, p) => c.isA(item.type, p.type) && (!item.keys || item.keys.some((k) => p.attrs[k]));
  const reads = (r) => [...r.when, ...r.not, ...r.calc.flatMap((x) => x.over || [])];
  for (const r of c.negRules) {
    if (r.kind !== 'rule') continue;
    const reach = made(r);
    const seen = new Set([r]);
    for (let i = 0; i < reach.length; i++) { // bounded: each rule adds its templates once
      for (const r2 of c.rules) {
        if (seen.has(r2) || !reads(r2).some((p) => wakes(reach[i], p))) continue;
        seen.add(r2);
        reach.push(...made(r2));
      }
    }
    const bad = [...r.not, ...r.calc.flatMap((x) => x.over || [])].find((n) => reach.some((item) => wakes(item, n)));
    if (bad) c.errors.push(`${r.id}: not stratified, its consequences can produce "${bad.type}", which it negates or aggregates`);
  }
  return c;
}

function buildRule(world, w, c) {
  const locals = new Set();
  for (const k of LINKS) for (const v of w.attrs[k] || []) if (v[0] === '$') locals.add(v.slice(1));
  // the patterns an aggregate ranges over belong to the rule too
  for (const v of w.attrs.with || []) for (const o of world.matrix.get(v.slice(1))?.attrs.over || []) if (o[0] === '$') locals.add(o.slice(1));
  const get = (k, from = w) => (from.attrs[k] || []).map((v) => {
    const s = world.matrix.get(v.slice(1));
    if (!s) { c.errors.push(`${w.id}: ${k}=${v} is not a wire of the matrix`); return null; }
    for (const x of Object.values(s.attrs).flat()) {
      const id = x.slice(1);
      if (x[0] === '$' && x[1] !== '?' && !locals.has(id) && !world.wires.has(id) && !world.matrix.has(id)) {
        c.errors.push(`${w.id}: ${s.id} refers to unknown wire ${x} (write ?${id} for a variable)`);
      }
    }
    const l = localize(s, locals);
    if (l.attrs['core.select']) { l.select = l.attrs['core.select'][0]; delete l.attrs['core.select']; }
    // a template with core.on=$pattern adds its keys to the wire that pattern matched
    if (k === 'then' && l.attrs['core.on']) { l.on = l.attrs['core.on'][0].replace(/^\$/, ''); delete l.attrs['core.on']; }
    for (const key of Object.keys(l.attrs)) { // full key names and short ones are the same key
      const short = c.shortKey(l.type, key);
      if (short !== key) { l.attrs[short] = [...(l.attrs[short] || []), ...l.attrs[key]]; delete l.attrs[key]; }
    }
    return l;
  }).filter(Boolean);
  const fn = (x, kind) => {
    const name = first(x, 'fn');
    // with over= the calc is an aggregate over every match of those patterns
    const over = x.attrs.over ? get('over', world.matrix.get(x.id) || x) : null;
    if (over ? !aggregates[name] : !world.fns[name]) c.errors.push(`${w.id}: unknown ${over ? 'aggregate' : kind} function "${name}"`);
    return { fn: name, out: first(x, 'out'), args: x.attrs.args || [], over, pick: first(x, 'pick') };
  };
  const rule = {
    id: w.id, kind: w.type === 'core.rule' ? 'rule' : 'deny',
    when: get('when'), then: get('then'), not: get('not'),
    calc: get('with').map((x) => fn(x, 'calc')), test: get('if').map((x) => fn(x, 'test')),
    why: first(w, 'why') ? str(first(w, 'why')) : undefined,
  };
  if (!rule.when.length) { c.errors.push(`${w.id}: needs at least one when=`); return; }
  if (rule.kind === 'rule' && !rule.then.length) { c.errors.push(`${w.id}: core.rule needs then=`); return; }
  for (const t of rule.then) {
    if (!t.on) continue;
    const p = rule.when.find((x) => '?' + x.id === t.on);
    if (!p) { c.errors.push(`${w.id}: ${t.id} has core.on=, which must name one of the rule's when= patterns`); continue; }
    t.type = p.type; // the keys go on the matched wire, whatever type the template was written with
  }
  for (const x of rule.calc) if (!x.out || !isVar(x.out)) c.errors.push(`${w.id}: core.calc needs out=?var`);

  const vars = new Set();
  for (const p of rule.when) {
    vars.add('?' + p.id);
    for (const v of Object.values(p.attrs).flat()) if (hasVar(v)) vars.add(v[0] === '$' ? v.slice(1) : v);
  }
  for (const x of rule.calc) if (x.out) vars.add(x.out);
  rule.vars = [...vars].sort();
  // a pattern with core.select=latest|first picks one wire by sequence: what it picks can change
  rule.hasSelect = rule.when.some((p) => p.select) || rule.not.some((p) => p.select) || rule.calc.some((x) => (x.over || []).some((p) => p.select));
  rule.aggregate = rule.calc.some((x) => x.over);
  rule.selective = rule.hasSelect || rule.aggregate;
  // An aggregate depends on a group: the bindings its patterns share with the rule's own
  // patterns. When a wire of an aggregated pattern changes, only its group is looked at again.
  const whenVars = new Set(rule.when.flatMap((p) => ['?' + p.id, ...Object.values(p.attrs).flat().filter(hasVar).map((v) => (v[0] === '$' ? v.slice(1) : v))]));
  rule.overs = rule.calc.flatMap((x) => (x.over || []).map((p) => ({
    pat: p,
    group: [...new Set(Object.values(p.attrs).flat().filter(hasVar).map((v) => (v[0] === '$' ? v.slice(1) : v)))].filter((v) => whenVars.has(v)),
  })));
  // the types whose wires can change what the rule concludes
  rule.types = [...new Set([...rule.when, ...rule.not, ...rule.calc.flatMap((x) => x.over || [])].map((p) => p.type))];
  for (const p of [...rule.when, ...rule.not]) if (p.select && !['latest', 'first'].includes(p.select)) c.errors.push(`${w.id}: core.select must be latest or first`);

  // templates in dependency order, so a template is created before the ones that refer to it
  const byId = new Map(rule.then.map((t) => [t.id, t]));
  const order = [], state = new Map();
  const visit = (t) => { // bounded: each template is visited once (state)
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
