// Compilation of the consistency matrix: schema wires -> slots, rules, deny constraints.
// Pure with respect to the world: reads world.matrix, world.wires and world.fns only.

import { TIERS } from './tiers.mjs';
import { cloneWire, str } from './parser.mjs';
import { hasVar, isVar } from './unify.mjs';
import { quantity, clock, date, aggregates, safeRegex, jsonValue } from './builtins.mjs';

const RANGE_CAP = 2000;

export const SCHEMA_TYPES = new Set([
  'core.slot', 'core.type', 'core.abducible', 'core.precision', 'core.tier', 'core.rule', 'core.deny', 'core.calc', 'core.check', 'core.use',
  'core.schema.map', 'core.namespace', 'core.producer', 'core.action',
  'core.sequence', 'core.fluent', 'core.effect', 'core.relation', 'core.aggregate', 'core.rank', 'core.module',
]);

/**
 * The attributes each matrix wire type reads. A name ending in `.` is a prefix
 * (`where.<key>`). An attribute that is not here is not an error (a wire may carry notes
 * of its own) but is reported in world.warnings, because it is usually a misspelling.
 * The reference (docs/reference.md) is checked against this table.
 */
export const GRAMMAR = {
  'core.slot': ['of', 'key', 'required', 'many', 'id', 'prefix', 'kind', 'type', 'enum', 'default', 'ask', 'min', 'max', 'step', 'soft', 'combine'],
  'core.type': ['of', 'extends', 'closed', 'complete', 'transient', 'shared'],
  'core.namespace': ['prefix', 'open'],
  'core.schema.map': ['from', 'as'], // and one attribute per field it maps
  'core.use': ['world', 'prefix'],
  'core.module': ['name', 'imports', 'exports'],
  'core.rule': ['when', 'not', 'with', 'if', 'then'],
  'core.deny': ['when', 'not', 'with', 'if', 'why', 'soft'],
  'core.calc': ['out', 'fn', 'args', 'over', 'pick', 'ties', 'relation'],
  'core.aggregate': ['over', 'by', 'then', 'default', 'fn', 'out', 'args', 'pick', 'ties', 'count', 'sum', 'min', 'max', 'argmin', 'argmax', 'collect'],
  'core.check': ['fn', 'args', 'why'],
  'core.rank': ['of', 'by', 'out', 'order', 'within'],
  'core.relation': ['when', 'sum', 'sub', 'equals'],
  'core.abducible': ['of', 'key', 'cost'],
  'core.sequence': ['key'],
  'core.fluent': ['of', 'key', 'by', 'delta'],
  'core.effect': ['on', 'fluent', 'op', 'amount', 'value', 'for', 'where.'],
  'core.producer': ['of', 'key', 'fn'],
  'core.action': ['name', 'fn', 'required', 'input', 'param', 'when', 'with', 'if', 'set', 'add', 'remove', 'returns', 'all', 'ask.'],
  'core.tier': ['name', 'below', 'cost'],
  'core.precision': ['decimals'],
};
/** Attributes that may stand on a pattern or a template of any type. */
export const MODIFIERS = { 'core.select': 'pattern', 'core.absent': 'pattern', 'core.on': 'template' };

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
  blob: (v) => v[0] !== '$' && v[0] !== '?', // opaque: kept as given, never indexed or matched
  json: (v) => jsonValue(v) !== undefined, // a structured value: a string whose text is JSON, within limits
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
    shared: new Set(),    // types whose wires belong to every namespace (matched and merged across them)
    transient: new Set(), // types of state that is looked at, not edited (a selection, a cursor): undo passes over it
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
      else {
        const old = c.maps.get(m.from);
        if (old && JSON.stringify([old.as, old.fields]) !== JSON.stringify([m.as, m.fields])) c.errors.push(`${w.id}: wires of type ${m.from} are already mapped differently by ${old.id}`);
        else c.maps.set(m.from, { ...m, id: w.id });
      }
    } else if (w.type === 'core.namespace') {
      const prefix = first(w, 'prefix');
      if (prefix && flag(w, 'open') && !c.openPrefixes.includes(prefix)) c.openPrefixes.push(prefix);
    }
  }
  const extra = []; // core.tier wires: the host's own tiers of certainty
  const actionWires = []; // core.action wires without fn=: actions written as wires
  const own = new Map(); // type -> Map(key -> slot) declared on that type itself
  // Two declarations of the same key of the same type: equal ones are one declaration;
  // different ones are a conflict unless one says how they combine (combine=intersect|override).
  const content = (s) => JSON.stringify([s.required, s.many, s.identity, s.prefix, s.refs, s.kinds, s.enum, s.default, s.ask, s.min, s.max, s.step, s.soft]);
  const both = (a, b) => (a && b ? a.filter((x) => b.includes(x)) : a || b);
  const declare = (of, key, s) => {
    const mine = own.get(of) || own.set(of, new Map()).get(of);
    const old = mine.get(key);
    if (!old || content(old) === content(s)) { if (!old) mine.set(key, s); return; }
    const how = s.combine || old.combine;
    const from = [...(old.combined?.from || [old.id]), s.id];
    if (how === 'override') {
      const winner = s.combine === 'override' ? s : old;
      mine.set(key, { ...winner, combined: { how, from } });
    } else if (how === 'intersect') {
      const m = { ...old, id: s.id, attrs: { ...old.attrs, ...s.attrs }, combined: { how, from } };
      m.enum = both(old.enum, s.enum);
      m.kinds = old.kinds.length && s.kinds.length ? old.kinds.filter((x) => s.kinds.includes(x)) : [...old.kinds, ...s.kinds];
      m.refs = old.refs.length && s.refs.length ? old.refs.filter((x) => s.refs.includes(x)) : [...old.refs, ...s.refs];
      m.type = m.refs[0];
      m.min = old.min && s.min ? (old.min.n >= s.min.n ? old.min : s.min) : old.min || s.min;
      m.max = old.max && s.max ? (old.max.n <= s.max.n ? old.max : s.max) : old.max || s.max;
      m.step = old.step || s.step;
      m.required = old.required || s.required;
      m.identity = old.identity || s.identity;
      m.many = old.many && s.many;
      m.soft = old.soft || s.soft;
      m.default = old.default ?? s.default;
      m.ask = old.ask ?? s.ask;
      const empty = (m.enum && !m.enum.length) || (m.min && m.max && m.min.n > m.max.n)
        || (old.kinds.length && s.kinds.length && !m.kinds.length) || (old.refs.length && s.refs.length && !m.refs.length);
      if (empty) c.errors.push(`${s.id}: ${of}.${key} combined with ${old.id} allows no value`);
      else if (m.default !== undefined && m.enum && !m.enum.includes(m.default)) c.errors.push(`${s.id}: the default of ${of}.${key} is not among the values left after combining with ${old.id}`);
      range(m);
      mine.set(key, m);
    } else {
      c.errors.push(`${s.id}: ${of}.${key} is already declared by ${old.id} with different content (say combine=intersect or combine=override on one of them)`);
    }
  };
  // min, max and step together make the key enumerable
  const range = (s) => {
    s.range = null;
    if (s.min && s.max && s.step && s.step.n > 0 && s.min.unit === s.max.unit) {
      const n = Math.floor((s.max.n - s.min.n) / s.step.n + 1e-9) + 1;
      if (n > 0 && n <= RANGE_CAP) s.range = Array.from({ length: n }, (_, i) => String(Number((s.min.n + i * s.step.n).toPrecision(12))) + s.min.unit);
    }
  };
  // a module declares types and slots only under its own prefix
  const owns = (w, what, name) => {
    if (w.module && name && name !== w.module && !name.startsWith(w.module + '.')) {
      const other = name.includes('.') ? ` (the prefix of module ${name.split('.')[0]})` : '';
      c.errors.push(`${w.id}: module ${w.module} declares the ${what} ${name}, which is not under its own prefix ${w.module}.${other}`);
    }
  };
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
        combine: get('combine'),
        soft: get('soft') === 'true', // a value outside min/max is accepted and kept as an issue
      };
      if (s.combine && !['intersect', 'override'].includes(s.combine)) c.errors.push(`${w.id}: combine must be intersect or override`);
      for (const k of ['min', 'max', 'step']) if (get(k) !== undefined && !s[k]) c.errors.push(`${w.id}: ${k} must be a number`);
      range(s);
      owns(w, 'slot of type', type);
      declare(type, key, s);
    } else if (w.type === 'core.type' || map?.as === 'type') {
      // core.type of=T names its type with of=; without of= the wire id is the type name
      const f = map ? map.fields : null;
      const name = f ? field(f.name || 'id', w) : of || w.id;
      // root= in a map: the parent of a type that names none
      const ext = (f ? field(f.extends, w) : first(w, 'extends')) || (f && f.root && f.root !== name ? f.root : undefined);
      const closed = f ? field(f.closed, w) === 'true' : flag(w, 'closed');
      if (!name) { c.errors.push(`${w.id}: the type has no name`); continue; }
      owns(w, 'type', name);
      const before = c.types.get(name);
      if (before && before !== w && c.parent.get(name) !== (ext && ext !== name ? ext : undefined)) {
        c.errors.push(`${w.id}: type ${name} is already declared by ${before.id} with another parent`);
        continue;
      }
      c.types.set(name, w);
      if (closed) c.closed.add(name);
      if (f ? field(f.complete, w) === 'true' : flag(w, 'complete')) c.complete.add(name);
      if (!f && flag(w, 'transient')) c.transient.add(name);
      if (!f && flag(w, 'shared')) c.shared.add(name);
      if (ext && ext !== name) c.parent.set(name, ext);
    } else if (map?.as === 'module' || w.type === 'core.module') {
      const native = w.type === 'core.module';
      const name = native ? first(w, 'name') || w.id : field(map.fields.name || 'id', w);
      if (!name) c.errors.push(`${w.id}: the module has no name`);
      else {
        const imports = native ? w.attrs.imports || [] : field(map.fields.imports, w, true), old = c.modules.get(name);
        // exports=: the types other modules may read; without it, all of them
        const ex = native ? w.attrs.exports : map.fields.exports ? field(map.fields.exports, w, true) : undefined;
        const exports = ex ? ex.map((t) => (t.includes('.') || t === name ? t : `${name}.${t}`)) : null;
        if (old && old.wire !== w && JSON.stringify(old.imports) !== JSON.stringify(imports)) c.errors.push(`${w.id}: module ${name} is already declared by ${old.wire.id} with other imports`);
        else c.modules.set(name, { wire: w, imports, exports });
      }
    } else if (w.type === 'core.tier') {
      extra.push(w);
    } else if (w.type === 'core.precision') {
      const d = Number(first(w, 'decimals'));
      if (!Number.isInteger(d) || d < 0 || d > 12) c.errors.push(`${w.id}: core.precision needs decimals= between 0 and 12`);
      else c.decimals = d;
    } else if (w.type === 'core.sequence') {
      c.seqKey = first(w, 'key') || null;
    } else if (w.type === 'core.fluent') {
      const key = first(w, 'key');
      if (!of || !key) { c.errors.push(`${w.id}: core.fluent needs of= and key=`); continue; }
      const f = { id: w.id, of, key, by: w.attrs.by || [], effects: [], delta: first(w, 'delta') };
      c.fluents.set(w.id, f);
      push(c.fluentsByType, of, f);
    } else if (w.type === 'core.producer') {
      const key = first(w, 'key'), fn = first(w, 'fn');
      if (!of || !key || !fn) { c.errors.push(`${w.id}: core.producer needs of=, key= and fn=`); continue; }
      if (!world._host('producer', fn)) c.errors.push(`${w.id}: unknown producer "${fn}"`);
      push(c.producers, `${of}.${key}`, { id: w.id, fn });
    } else if (w.type === 'core.action') {
      const name = first(w, 'name'), fn = first(w, 'fn');
      if (!name) { c.errors.push(`${w.id}: core.action needs name=`); continue; }
      if (!fn) { actionWires.push(w); continue; } // written as wires: compiled below, with the rules
      if (!world._host('action', fn)) c.errors.push(`${w.id}: unknown action function "${fn}"`);
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

  // ---- attributes nobody reads: most often a misspelling
  c.unknown = [];
  for (const w of world.matrix.values()) {
    const known = GRAMMAR[w.type === 'core.test' ? 'core.check' : w.type];
    if (!known || w.type === 'core.schema.map' || c.maps.has(w.type)) continue; // a mapped notation has its own attributes
    for (const k of Object.keys(w.attrs)) {
      if (known.includes(k) || known.some((p) => p.endsWith('.') && k.startsWith(p)) || (k.startsWith('core.') && k !== 'core.on')) continue;
      c.unknown.push({ id: w.id, type: w.type, key: k });
    }
  }

  // ---- tiers of certainty, strongest first; a host's tier goes right below the one it names
  c.tiers = [...TIERS];
  c.tierCost = new Map();
  for (const w of extra) {
    const name = first(w, 'name') || w.id, below = first(w, 'below') || 'told';
    if (c.tiers.includes(name)) { if (!TIERS.includes(name)) c.errors.push(`${w.id}: tier ${name} is declared twice`); }
    else if (!c.tiers.includes(below)) c.errors.push(`${w.id}: below=${below} is not a tier`);
    else c.tiers.splice(c.tiers.indexOf(below) + 1, 0, name);
    if (first(w, 'cost') !== undefined) c.tierCost.set(name, Number(first(w, 'cost')));
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
  const sharedCache = new Map();
  c.isShared = (type) => {
    if (!c.shared.size) return false;
    let r = sharedCache.get(type);
    if (r === undefined) sharedCache.set(type, (r = c.lineage(type).some((t) => c.shared.has(t))));
    return r;
  };
  c.hierarchy = [...c.parent].map(([t, p]) => `${t}<${p}`).sort().join(' ');
  for (const [t, p] of c.parent) {
    let x = p;
    for (let n = 0; x && n < 1000; n++) { if (x === t) { c.errors.push(`${t}: the type extends itself through ${p}`); break; } x = c.parent.get(x); }
  }

  // ---- slots of a type: its own and the inherited ones, the nearest declaration winning
  const effective = new Map();
  c.slots = {
    own, // the declarations of each type, before inheritance
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
  // ---- keys that hold opaque values (kind=blob): not indexed, not matched by patterns
  const blob = new Map();
  const isBlob = (s) => !!s && s.kinds.includes('blob');
  c.blobKeys = new Set();
  for (const [, mine] of own) for (const [k, s] of mine) if (isBlob(s)) c.blobKeys.add(k);
  c.blobs = [...c.blobKeys].sort().join(' ');
  c.blob = (type, key) => {
    if (!c.blobKeys.has(key)) return false;
    const id = type + '\u0001' + key;
    let b = blob.get(id);
    if (b === undefined) blob.set(id, (b = isBlob(c.slotOf(type, key))));
    return b;
  };
  // ---- keys that hold structured values (kind=json): patterns read them by path
  const json = new Map();
  c.jsonKeys = new Set();
  for (const [, mine] of own) for (const [k, s] of mine) if (s.kinds.includes('json')) c.jsonKeys.add(k);
  c.json = (type, key) => {
    if (!c.jsonKeys.has(key)) return false;
    const id = type + '\u0001' + key;
    let j = json.get(id);
    if (j === undefined) json.set(id, (j = !!c.slotOf(type, key)?.kinds.includes('json')));
    return j;
  };
  /** In a pattern, key.path=value under a json key reads into the value: moved to p.paths. */
  c.paths = (p) => {
    if (!c.jsonKeys.size) return p;
    for (const key of Object.keys(p.attrs)) {
      const dot = key.indexOf('.');
      if (dot < 0) continue;
      const base = key.slice(0, dot);
      if (!c.json(p.type, base)) continue;
      const path = key.slice(dot + 1).split('.');
      if (path.length > 10 || path.some((x) => !x)) { c.errors.push(`${p.id}: ${key}: a path is at most 10 names, none empty`); continue; }
      for (const v of p.attrs[key]) (p.paths ||= []).push([base, path, v]);
      delete p.attrs[key];
    }
    return p;
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
    else if (w.type === 'core.aggregate') buildAggregate(world, w, c);
  }
  buildRelations(world, c);
  // An action written as wires: parameters, patterns that read the state, a guard, and
  // writes that all read the state before the action. It is a rule that fires on request.
  for (const w of actionWires) {
    const body = { id: w.id, type: 'core.rule', attrs: { when: w.attrs.when || [], with: w.attrs.with || [], if: w.attrs.if || [], then: [...(w.attrs.set || []), ...(w.attrs.add || [])] }, pattern: false };
    const rule = buildRule(world, body, c, null, false);
    if (!rule) continue;
    const sets = new Set((w.attrs.set || []).map((v) => v.slice(1)));
    for (const t of rule.then) if (sets.has(t.id) && !t.on) c.errors.push(`${w.id}: set=$${t.id} needs core.on=$<pattern>, the wire to change`);
    const remove = (w.attrs.remove || []).map((v) => v.slice(1));
    for (const id of remove) if (!rule.when.some((p) => p.id === id)) c.errors.push(`${w.id}: remove=$${id} must name one of its when= patterns`);
    const params = w.attrs.param || [];
    c.actions.set(first(w, 'name'), { id: w.id, rule, params, required: params, remove, returns: first(w, 'returns'), all: flag(w, 'all'), inputs: [], ask: w.attrs });
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
  // ---- exports: a rule of one module reads another module's types only if it exports them
  const moduleOfType = (t) => { for (const [name, m] of c.modules) if (m.exports && (t === name || t.startsWith(name + '.'))) return [name, m]; return null; };
  const moduleOfRule = (r) => world.matrix.get(r.id)?.module || [...c.modules.keys()].find((n) => r.id.startsWith(n + '.'));
  if ([...c.modules.values()].some((m) => m.exports)) {
    for (const r of [...c.rules, ...c.denies]) {
      const mine = moduleOfRule(r);
      if (!mine) continue;
      for (const p of [...r.when, ...r.not, ...r.calc.flatMap((x) => x.over || [])]) {
        const owner = moduleOfType(p.type);
        if (!owner || owner[0] === mine) continue;
        if (!owner[1].exports.some((t) => c.isA(p.type, t))) c.errors.push(`${r.id}: module ${mine} reads ${p.type}, which module ${owner[0]} does not export (exports=${owner[1].exports.join(',')})`);
      }
    }
  }
  // ---- a short key that more than one module declares along one type's lineage
  c.ambiguous = [];
  const modOf = (s) => world.matrix.get(s.id)?.module || [...c.modules.keys()].find((n) => s.id.startsWith(n + '.'));
  for (const type of new Set([...own.keys(), ...c.types.keys()])) {
    const seen = new Map(); // key -> [{ module, type }]
    for (const t of c.lineage(type)) for (const [k, s] of own.get(t) || []) {
      const m = modOf(s);
      if (!m) continue;
      const list = seen.get(k) || seen.set(k, []).get(k);
      if (!list.some((x) => x.module === m)) list.push({ module: m, type: t, id: s.id });
    }
    for (const [k, list] of seen) if (list.length > 1) c.ambiguous.push({ type, key: k, names: list.map((x) => `${x.type}.${k}`), modules: list.map((x) => x.module) });
  }

  // ---- the keys that something reads: a value of any other key changes nothing a rule,
  // deny, relation, aggregate or state depends on, so filling it needs no propagation
  const readKeys = new Map(); // type -> Set<key>
  const read = (type, key) => (readKeys.get(type) || readKeys.set(type, new Set()).get(type)).add(key);
  for (const r of [...c.rules, ...c.denies]) {
    for (const p of [...r.when, ...r.not, ...r.calc.flatMap((x) => x.over || [])]) {
      for (const k of Object.keys(p.attrs)) read(p.type, k);
      for (const k of p.absent || []) read(p.type, k);
      for (const [k] of p.paths || []) read(p.type, k);
    }
  }
  for (const f of c.fluents.values()) {
    read(f.of, f.key);
    if (f.delta) read(f.of, f.delta);
    for (const k of f.by) read(f.of, k);
    for (const e of f.effects) {
      for (const k of [e.amount, e.target, ...e.where.map(([, ev]) => ev)]) if (k) read(e.on, k);
      for (const [hk] of e.where) read(f.of, hk);
    }
  }
  const readCache = new Map();
  c.reads = (type, key) => {
    if (key === c.seqKey) return true;
    const id = type + '\u0001' + key;
    let r = readCache.get(id);
    if (r === undefined) {
      r = c.lineage(type).some((t) => readKeys.get(t)?.has(key)) || !!c.slotOf(type, key)?.identity;
      readCache.set(id, r);
    }
    return r;
  };
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
  const wakes = (item, p) => c.isA(item.type, p.type) && (!item.keys || item.keys.some((k) => p.attrs[k] || p.absent?.includes(k)));
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
    // nor may it fill a key that it requires to be absent
    const filled = r.when.find((p) => p.absent && reach.some((item) => item.keys && c.isA(item.type, p.type) && item.keys.some((k) => p.absent.includes(k))));
    if (filled) c.errors.push(`${r.id}: not stratified, its consequences can fill a key of "${filled.type}" that it requires to be absent`);
  }
  return c;
}

/**
 * Relations that solve in more than one direction. A linear relation over cells,
 *
 *   @p payment paid=?paid total=?total change=?chg
 *   @r core.relation when=$p sum=?paid sub=?total sub=?chg equals=0
 *
 * becomes one rule per cell: when the others are known, this one is computed and put on
 * its wire (core.on). A cell that already has another value is a conflict; several
 * unknown cells leave the relation waiting. Everything else (provenance, tiers,
 * withdrawal, budgets) is what rules already have. A core.calc with fn=add or fn=sub
 * and relation=true is read as the same kind of relation over the cells of its rule.
 */
function buildRelations(world, c) {
  const isVar1 = (v) => typeof v === 'string' && v[0] === '?';
  const term = (v, sign) => { // "?x", "2*?x", "0.5*?x", or a constant
    const m = /^(-?[\d.]+)\*(\?.+)$/.exec(v);
    const coef = m ? m[1] : '1';
    return { c: sign < 0 ? (coef[0] === '-' ? coef.slice(1) : '-' + coef) : coef, v: m ? m[2] : v };
  };
  const make = (rid, patternIds, terms, k, skip) => {
    const pats = patternIds.map((id) => world.matrix.get(id)).filter(Boolean);
    if (pats.length !== patternIds.length) { c.errors.push(`${rid}: when= must name wires of the matrix`); return; }
    terms.forEach((t, i) => {
      if (!isVar1(t.v) || t.v === skip) return;
      const cells = pats.flatMap((p) => Object.keys(p.attrs).filter((key) => p.attrs[key].includes(t.v)).map((key) => ({ p, key })));
      if (!cells.length) { c.errors.push(`${rid}: ${t.v} is not the value of a key in its patterns`); return; }
      if (cells.length > 1) return; // the variable joins two wires: it is read, not solved for
      const { p: home, key } = cells[0];
      const name = (id) => `${rid}.${i}.${id}`;
      const extra = new Map();
      for (const p of pats) {
        const attrs = {};
        for (const k2 of Object.keys(p.attrs)) {
          const vals = p.attrs[k2].filter((v) => !(p === home && k2 === key && v === t.v)).map((v) => (v[0] === '$' && patternIds.includes(v.slice(1)) ? '$' + name(v.slice(1)) : v));
          if (vals.length) attrs[k2] = vals;
        }
        extra.set(name(p.id), { id: name(p.id), type: p.type, attrs, pattern: true });
      }
      const others = terms.filter((_, j) => j !== i).flatMap((o) => [o.c, o.v]);
      extra.set(name('calc'), { id: name('calc'), type: 'core.calc', attrs: { out: [t.v], fn: ['linsolve'], args: [k, t.c, ...others] }, pattern: false });
      extra.set(name('fill'), { id: name('fill'), type: home.type, attrs: { 'core.on': ['$' + name(home.id)], [key]: [t.v] }, pattern: false });
      const rule = { id: `${rid}.${i}`, type: 'core.rule', attrs: { when: pats.map((p) => '$' + name(p.id)), with: ['$' + name('calc')], then: ['$' + name('fill')] }, pattern: false };
      const before = c.rules.length;
      buildRule(world, rule, c, extra);
      if (c.rules.length > before) c.rules[c.rules.length - 1].relation = rid; // what it concludes is recorded as coming from the relation
    });
  };
  for (const w of world.matrix.values()) {
    if (w.type === 'core.relation') {
      const terms = [...(w.attrs.sum || []).map((v) => term(v, 1)), ...(w.attrs.sub || []).map((v) => term(v, -1))];
      if (!terms.length || !(w.attrs.when || []).length) { c.errors.push(`${w.id}: core.relation needs when= and sum= or sub= terms`); continue; }
      make(w.id, w.attrs.when.map((v) => v.slice(1)), terms, first(w, 'equals') ?? '0', null);
    } else if (w.type === 'core.rule') {
      for (const ref of w.attrs.with || []) {
        const calc = world.matrix.get(ref.slice(1));
        if (!calc || !flag(calc, 'relation')) continue;
        const fn = first(calc, 'fn'), out = first(calc, 'out'), args = calc.attrs.args || [];
        if ((fn !== 'add' && fn !== 'sub') || !out) { c.errors.push(`${calc.id}: relation=true needs fn=add or fn=sub`); continue; }
        // out = a0 (+|-) a1 (+|-) ...   <=>   a0 (+|-) a1 ... - out = 0
        const terms = [...args.map((a, j) => term(a, j === 0 || fn === 'add' ? 1 : -1)), term(out, -1)];
        make(calc.id, [...(w.attrs.when || []), ...(w.attrs.then || [])].map((v) => v.slice(1)), terms, '0', out);
      }
    }
  }
}

/**
 * core.aggregate: one aggregate over every match of its patterns, with no pattern of its
 * own to anchor it. Without by= it gives exactly one result, also over nothing (default=
 * for the functions that have no value then); with by=?v one result per value of ?v
 * among the matches. It is a rule with no when= and one aggregating calc.
 */
function buildAggregate(world, w, c) {
  const names = ['count', 'sum', 'min', 'max', 'argmin', 'argmax', 'collect'].filter((n) => w.attrs[n]);
  let fn = first(w, 'fn'), out = first(w, 'out');
  if (fn && names.length) { c.errors.push(`${w.id}: give fn= and out=, or one of ${names.join(', ')}=?var, not both`); return; }
  if (!fn) {
    if (names.length !== 1) { c.errors.push(`${w.id}: core.aggregate needs one result: count=?var, sum=?var, ... (or fn= and out=)`); return; }
    fn = names[0];
    out = first(w, fn);
  }
  if (!w.attrs.over) { c.errors.push(`${w.id}: core.aggregate needs over=`); return; }
  const calc = { id: `${w.id}.calc`, type: 'core.calc', pattern: false, attrs: { out: [out], fn: [fn], over: w.attrs.over } };
  for (const k of ['args', 'pick', 'ties']) if (w.attrs[k]) calc.attrs[k] = w.attrs[k];
  const body = { id: w.id, type: 'core.rule', pattern: false, attrs: { with: ['$' + calc.id], then: w.attrs.then || [] } };
  const by = (w.attrs.by || []).filter(isVar);
  if (by.length !== (w.attrs.by || []).length) c.errors.push(`${w.id}: by= takes variables (by=?kind)`);
  buildRule(world, body, c, new Map([[calc.id, calc]]), true, { by, dflt: first(w, 'default') });
}

function buildRule(world, w, c, extra, register = true, aggregate = null) {
  const find = (id) => extra?.get(id) || world.matrix.get(id);
  const locals = new Set();
  for (const k of LINKS) for (const v of w.attrs[k] || []) if (v[0] === '$') locals.add(v.slice(1));
  // the patterns an aggregate ranges over belong to the rule too
  for (const v of w.attrs.with || []) for (const o of find(v.slice(1))?.attrs.over || []) if (o[0] === '$') locals.add(o.slice(1));
  const get = (k, from = w) => (from.attrs[k] || []).map((v) => {
    const s = find(v.slice(1));
    if (!s) { c.errors.push(`${w.id}: ${k}=${v} is not a wire of the matrix`); return null; }
    for (const x of Object.values(s.attrs).flat()) {
      const id = x.slice(1);
      if (x[0] === '$' && x[1] !== '?' && !locals.has(id) && !world.wires.has(id) && !world.matrix.has(id) && !extra?.has(id)) {
        c.errors.push(`${w.id}: ${s.id} refers to unknown wire ${x} (write ?${id} for a variable)`);
      }
    }
    const l = localize(s, locals);
    if (l.attrs['core.select']) { l.select = l.attrs['core.select'][0]; delete l.attrs['core.select']; }
    // a template with core.on=$pattern adds its keys to the wire that pattern matched
    if (k === 'then' && l.attrs['core.on']) { l.on = l.attrs['core.on'][0].replace(/^\$/, ''); delete l.attrs['core.on']; }
    // core.absent=<key>: the pattern matches only a wire that has no value for that key
    if (l.attrs['core.absent']) { l.absent = l.attrs['core.absent'].map((key) => c.shortKey(l.type, key)); delete l.attrs['core.absent']; }
    for (const key of Object.keys(l.attrs)) { // full key names and short ones are the same key
      const short = c.shortKey(l.type, key);
      if (short !== key) { l.attrs[short] = [...(l.attrs[short] || []), ...l.attrs[key]]; delete l.attrs[key]; }
    }
    if (k !== 'then') c.paths(l);
    // an opaque value is not looked at by rules: a pattern may only ask that it is absent
    if (k !== 'then') for (const key of Object.keys(l.attrs)) if (c.blob(l.type, key)) c.errors.push(`${w.id}: ${s.id} matches ${key}, which holds opaque values (kind=blob): patterns cannot read it (core.absent=${key} can)`);
    return l;
  }).filter(Boolean);
  const fn = (x, kind) => {
    if (x.type === 'core.rank') return rankCalc(x);
    const name = first(x, 'fn');
    // with over= the calc is an aggregate over every match of those patterns
    const over = x.attrs.over ? get('over', find(x.id) || x) : null;
    if (over ? !aggregates[name] : !world.fns[name]) c.errors.push(`${w.id}: unknown ${over ? 'aggregate' : kind} function "${name}"`);
    // a pattern written in the matrix is checked when the matrix is read, not when it is first used
    const pat = (x.attrs.args || [])[1];
    if (name === 'matches' && pat !== undefined && !hasVar(pat)) { const re = safeRegex(str(pat)); if (re.refused) c.errors.push(`${w.id}: ${x.id}: ${re.refused}`); }
    const ties = first(x, 'ties');
    if (ties !== undefined && !['first', 'all'].includes(ties)) c.errors.push(`${w.id}: ${x.id} ties= is first or all`);
    return { id: x.id, why: first(x, 'why'), fn: name, out: first(x, 'out'), args: x.attrs.args || [], over, pick: first(x, 'pick'), ties };
  };
  // core.rank of=$p by=key: the position of the wire $p matched among its peers, ordered by
  // that key. Peers are the wires that fit the pattern's fixed values; with within=?v, only
  // those that share the value of ?v. An aggregate over a copy of the pattern.
  const rankCalc = (x) => {
    const of = first(x, 'of'), key = first(x, 'by'), out = first(x, 'out');
    const pid = of?.replace(/^\$\??/, '');
    const p = rule.when.find((q) => q.id === pid);
    if (!p || !key) { c.errors.push(`${w.id}: ${x.id} needs of= one of the rule's when= patterns, and by=`); return { id: x.id, out, fn: 'rank', args: [], over: [] }; }
    const short = c.shortKey(p.type, key);
    const within = new Set(x.attrs.within || []);
    const attrs = {};
    let n = 0;
    for (const [k, vs] of Object.entries(p.attrs)) attrs[k] = vs.map((v) => (hasVar(v) && !within.has(v) ? `?${x.id}\u0004f${n++}` : v));
    attrs[short] = [`?${x.id}\u0004v`];
    const peer = { ...p, id: `${p.id}\u0004rank`, attrs };
    const named = new Set(Object.values(p.attrs).flat());
    for (const v of within) if (!named.has(v)) c.errors.push(`${w.id}: ${x.id} within=${v} is not a variable of ${p.id}`);
    const own = p.attrs[short]?.[0];
    const order = first(x, 'order') || 'asc';
    if (!['asc', 'desc'].includes(order)) c.errors.push(`${w.id}: ${x.id} order= is asc or desc`);
    return { id: x.id, out, fn: 'rank', args: [`?${x.id}\u0004v`], over: [peer], rank: { of: '?' + pid, key: short, own, order } };
  };
  const rule = {
    id: w.id, kind: w.type === 'core.rule' ? 'rule' : 'deny',
    when: get('when'), then: get('then'), not: get('not'),
    calc: [], test: [],
    why: first(w, 'why') ? str(first(w, 'why')) : undefined,
  };
  rule.calc = get('with').map((x) => fn(x, 'calc'));
  rule.test = get('if').map((x) => fn(x, 'test'));
  // a reason may write a value through a filter (?n:ordinal): the filter must be registered
  for (const why of [rule.why, ...rule.test.map((t) => t.why && str(t.why))]) {
    for (const m of (why || '').matchAll(/\?[A-Za-z_][\w.\-]*:([A-Za-z_][\w\-]*)/g)) {
      if (!world.filters?.[m[1]]) c.errors.push(`${w.id}: the reason uses the filter "${m[1]}", which is not registered (world.register('filter', '${m[1]}', fn))`);
    }
  }
  if (aggregate) {
    rule.by = aggregate.by;
    if (aggregate.dflt !== undefined) rule.calc[0].dflt = aggregate.dflt;
    const seen = new Set(rule.calc[0].over.flatMap((p) => Object.values(p.attrs).flat().filter(hasVar).map((v) => (v[0] === '$' ? v.slice(1) : v))));
    for (const v of rule.by) if (!seen.has(v)) c.errors.push(`${w.id}: by=${v} is not a variable of its over= patterns`);
  } else if (!rule.when.length) { c.errors.push(`${w.id}: needs at least one when=`); return; }
  // A soft deny refuses nothing: it is a rule whose conclusion is a standing core.issue
  // wire about the wires it matched, kept up to date like any derived wire.
  if (rule.kind === 'deny' && flag(w, 'soft')) {
    rule.kind = 'rule';
    rule.soft = true;
    const attrs = { rule: ['$' + w.id], about: rule.when.map((p) => '$?' + p.id) };
    if (w.attrs.why) attrs.why = [w.attrs.why[0]];
    rule.then = [{ id: `${w.id}.issue`, type: 'core.issue', attrs, pattern: false }];
  }
  if (rule.kind === 'rule' && !rule.then.length && register) { c.errors.push(`${w.id}: core.rule needs then=`); return; }
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
  for (const v of rule.by || []) vars.add(v);
  // the tied picks of an argmax or argmin are part of what a firing concluded (see TIES in world.mjs)
  for (const x of rule.calc) if (x.out && (x.fn === 'argmax' || x.fn === 'argmin')) vars.add(x.out + '\u0003ties');
  rule.vars = [...vars].sort();
  // a pattern with core.select=latest|first picks one wire by sequence: what it picks can change
  // a pattern with core.absent= relies on something not being there: what it matched can stop matching
  rule.hasSelect = rule.when.some((p) => p.select || p.absent) || rule.not.some((p) => p.select) || rule.calc.some((x) => (x.over || []).some((p) => p.select));
  rule.aggregate = rule.calc.some((x) => x.over);
  rule.selective = rule.hasSelect || rule.aggregate;
  // An aggregate depends on a group: the bindings its patterns share with the rule's own
  // patterns. When a wire of an aggregated pattern changes, only its group is looked at again.
  const whenVars = new Set([...rule.when.flatMap((p) => ['?' + p.id, ...Object.values(p.attrs).flat().filter(hasVar).map((v) => (v[0] === '$' ? v.slice(1) : v))]), ...(rule.by || [])]);
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
  if (!register) return rule; // an action: built like a rule, run on request
  (rule.kind === 'rule' ? c.rules : c.denies).push(rule);
}
