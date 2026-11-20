import { quote, serialize, str } from './parser.mjs';

const family = 'std.capability.';
const get = (wire, key) => wire?.attrs[key]?.[0];
const text = (wire, key) => str(get(wire, key));
const ref = (world, wire, key) => world.get(get(wire, key)?.slice(1));
const number = (wire, key) => Number(get(wire, key));
const flag = (wire, key) => get(wire, key) === 'true';
const listed = (wire, key) => wire.attrs[key] || [];
const byOrder = (left, right) => number(left, 'order') - number(right, 'order');
const safeKey = (key) => !['__proto__', 'constructor', 'prototype'].includes(key);
const absent = Symbol('absent');
const inferredSeed = (rule) => get(rule, 'scope') !== undefined || get(rule, 'kind') !== undefined || get(rule, 'whenArgument') !== undefined;

function typedValue(token, world, tick, depth = 0) {
  tick();
  if (typeof token !== 'string' || depth > 24) return absent;
  if (!token.startsWith('$')) {
    try {
      const value = JSON.parse(token);
      return value === null || ['string', 'boolean'].includes(typeof value) || Number.isFinite(value) ? value : absent;
    } catch {
      return absent;
    }
  }
  const wire = world.get(token.slice(1));
  if (wire?.type === family + 'list') {
    const items = listed(wire, 'member').map((id) => {
      tick();
      return world.get(id.slice(1));
    }).sort((left, right) => number(left, 'index') - number(right, 'index'));
    if (items.some((row, index) => row?.type !== family + 'item' || number(row, 'index') !== index)) return absent;
    const values = items.map((row) => typedValue(get(row, 'value'), world, tick, depth + 1));
    return values.includes(absent) ? absent : values;
  }
  if (wire?.type === family + 'record') {
    const fields = new Map();
    for (const id of listed(wire, 'entry')) {
      const entry = world.get(id.slice(1));
      const key = text(entry, 'name');
      if (entry?.type !== family + 'arg' || !safeKey(key) || fields.has(key)) return absent;
      const value = typedValue(get(entry, 'value'), world, tick, depth + 1);
      if (value === absent) return absent;
      fields.set(key, value);
    }
    return Object.fromEntries(fields);
  }
  return absent;
}

function encodeValue(value, append, tick) {
  tick();
  if (value === null || typeof value !== 'object') return Object.is(value, -0) ? '-0' : JSON.stringify(value);
  if (Array.isArray(value)) {
    const members = value.map((item, index) => '$' + append(family + 'item', {
      index: [String(index)], value: [encodeValue(item, append, tick)],
    }));
    return '$' + append(family + 'list', { member: members });
  }
  return '$' + append(family + 'record', {
    entry: Object.entries(value).map(([key, item]) => '$' + append(family + 'arg', {
      name: [quote(key)], value: [encodeValue(item, append, tick)],
    })),
  });
}

function output(tick, status, data = {}, call, alternatives = [], selection = []) {
  tick();
  const wires = [];
  const append = (type, attrs) => {
    tick();
    const id = 'capability.output.' + wires.length;
    wires.push({ id, type, attrs, pattern: false });
    return id;
  };
  const fields = { status: [status] };
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const write = ['reason', 'act', 'repeat'].includes(key) ? String : quote;
    fields[key] = [].concat(value).map((datum) => {
      tick();
      return write(datum);
    });
  }
  if (call) {
    const args = Array.from(call.args, ([name, value]) => '$' + append(family + 'arg', {
      name: [quote(name)], value: [encodeValue(value, append, tick)],
    }));
    fields.call = ['$' + append(family + 'call', { operation: [quote(call.name)], argument: args })];
  }
  fields.alternative = alternatives.map((alternative) => '$' + append(family + 'alternative', {
    operation: [quote(alternative.name)], status: [alternative.reason ? 'unavailable' : 'available'],
    ...(alternative.preferences?.length ? { preference: [String(alternative.score)], support: alternative.preferences.map(id=>quote(id)) } : {}),
    ...(alternative.reason ? { reason: [alternative.reason] } : { applied: [String(alternative.applied.length)] }),
  }));
  fields.selection = selection.map(({ object, status, support }) => '$' + append(family + 'selection', {
    id: [quote(text(object, 'id'))], status: [status], support: support.map(quote),
  }));
  return serialize([{ id: 'capability.result', type: family + 'result', attrs: fields, pattern: false }, ...wires]);
}

function graph(request, nodes) {
  const targets = nodes.filter((node) => node.type === 'std.request.target');
  const targetsAndConstraints = new Set(['std.request', 'std.request.source', 'std.request.target', 'std.request.constraint']);
  if (text(request, 'mood') !== 'do' || targets.length !== 1 || nodes.some((node) => !targetsAndConstraints.has(node.type))) return null;
  const [target] = targets;
  const selectorId = get(target, 'selector')?.slice(1);
  const constraints = nodes.filter((node) => node.type === 'std.request.constraint');
  const selector = constraints.find((node) => node.id === selectorId);
  const results = constraints.filter((node) => node.id !== selectorId);
  return { target, selector, results: results.sort((a, b) => number(a, 'source.start') - number(b, 'source.start')) };
}

function records(world, scope, tick) {
  const all = (type) => world.ofType(family + type).filter((row) => {
    tick();
    return row.type === family + type;
  });
  const scoped = (type) => all(type).filter((row) => ref(world, row, 'scope')?.id === scope.id);
  const byRef = (type, key) => {
    const index = new Map();
    for (const row of all(type)) {
      tick();
      const id = ref(world, row, key)?.id;
      if (!index.has(id)) index.set(id, []);
      index.get(id).push(row);
    }
    return index;
  };
  return {
    scope, modes: all('mode'), operations: scoped('operation').sort(byOrder),
    targets: scoped('target'), properties: scoped('property').sort(byOrder),
    objects: scoped('object').sort(byOrder), literals: all('value'),
    preferences: scoped('preference'), repeats: scoped('repeat'), seeds: all('seed').sort(byOrder), guards: all('guard'), signals: scoped('signal'),
    degrees: all('degree'), bases: all('base').filter((row) => !get(row, 'scope') || ref(world, row, 'scope')?.id === scope.id),
    fields: byRef('field', 'object'), params: byRef('parameter', 'operation'),
  };
}

function observationProperty(data,on,concept,tick) {
  return data.properties.find(row=>{
    tick();
    return text(row,'on')===on&&get(row,'concept')===concept&&get(row,'binding');
  });
}

function matchObject(world, data, types, kinds, target, selector, tick, labels = []) {
  if (selector && !positiveEq(selector)) return { unsupported: true };
  const targetName = text(target, 'name');
  const matches = [], selection = [], support = new Set();
  let mapped = false, resolved = false;
  const bindings = new Map();
  // Which members denote the target's kind: an observed kind a kind parameter accepts; else, when no enum accepts
  // any of the kind's labels (a kind another operation of the same source type creates), an observed kind equal to
  // one of its labels. A shared source type alone never proves it. Only when no member has such a kind and the
  // target names nothing, a member the user named with one of the labels ("the box" for a rectangle named Box).
  const denoted = kinds.size ? kinds : new Set(labels);
  const typed = data.objects.filter((object) => { tick(); return types.has(text(object, 'on')); });
  const named = (object) => targetName === undefined || text(object, 'name') === targetName;
  let members = typed.filter((object) => (!denoted.size || denoted.has(text(object, 'kind'))) && named(object));
  if (!members.length && denoted.size && targetName === undefined) {
    const lower = new Set([...labels, ...kinds].map((label) => String(label).toLowerCase()));
    members = typed.filter((object) => text(object, 'name') !== undefined && lower.has(String(text(object, 'name')).toLowerCase()));
  }
  for (const object of members) {
    tick();
    const on = text(object, 'on');
    if (!selector) {
      matches.push(object);
      continue;
    }
    if (!bindings.has(on)) {
      const property = observationProperty(data,on,get(selector,'concept'),tick);
      const codec = get(property, 'codec');
      const lookup = codec === 'lookup' ? lookupValue(world, data, selector, tick) : null;
      bindings.set(on, { property, lookup });
    }
    const { property, lookup } = bindings.get(on);
    if (property) mapped = true;
    if (lookup?.value !== absent && property) resolved = true;
    const fields = (data.fields.get(object.id) || []).filter((field) => {
      tick();
      return property && text(field, 'binding') === text(property, 'binding');
    });
    const rowSupport = [...(property ? [property.id] : []), ...(lookup?.support || []), ...fields.map((field) => field.id)];
    for (const id of rowSupport) support.add(id);
    const values = fields.length === 1 ? listed(fields[0], 'value') : [];
    const observed = values.length === 1 && lookup ? typedValue(values[0], world, tick) : absent;
    const unknown = !property || !values.length || (lookup && (lookup.value === absent || observed === absent));
    const equal = !unknown && (lookup ? observed === lookup.value : values.some((value) => str(value) === text(selector, 'value')));
    const status = unknown ? 'unknown' : equal ? 'match' : 'mismatch';
    selection.push({ object, status, support: rowSupport });
    if (equal) matches.push(object);
  }
  return { matches, selection, support: [...support], ...(selector && selection.length && !mapped ? { unsupported: true } : {}),
    ...(selector && mapped && !resolved ? { reason: 'value' } : {}) };
}

function positiveEq(condition) {
  return get(condition, 'operator') === 'eq' && get(condition, 'polarity') === 'positive';
}

function parseList(input, codec) {
  let items;
  try {
    const value = JSON.parse(input);
    items = Array.isArray(value) ? value : [value];
  } catch {
    items = String(input).split(',').map((value) => value.trim());
  }
  if (codec === 'string.list') return items.every((value) => typeof value === 'string' && value) ? items : absent;
  return items.every((value) => Number.isFinite(value) ||
    (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))) ? items.map(Number) : absent;
}

function accepts(value, param, world, tick) {
  if (value === absent) return false;
  if (value === null) return flag(param, 'nullable');
  const kind = get(param, 'kind');
  const typeMatches = kind === 'array' ? Array.isArray(value)
    : kind === 'object' ? !!value && !Array.isArray(value) && typeof value === 'object'
    : kind === 'integer' ? Number.isSafeInteger(value)
    : kind === 'number' ? Number.isFinite(value) : typeof value === kind;
  return typeMatches && (!(param.attrs.enum || flag(param, 'enumClosed')) ||
    listed(param, 'enum').some((token) => typedValue(token, world, tick) === value))
    && (get(param, 'min') === undefined || value >= number(param, 'min'))
    && (get(param, 'max') === undefined || value <= number(param, 'max'));
}

function lookupValue(world, data, condition, tick) {
  const rows = data.literals.filter((row) => {
    tick();
    return text(row, 'concept') === text(condition, 'concept') && text(row, 'label') === text(condition, 'value');
  });
  const values = new Set(rows.map((row) => typedValue(get(row, 'value'), world, tick)));
  return { value: values.size === 1 ? values.values().next().value : absent, support: rows.map((row) => row.id) };
}

// The value a degree is taken from: the target's observed value when it exists, else the value the
// operation would give a new object (a declared or host-measured std.capability.base), else an argument
// already bound by the family or an initial seed, else the parameter's declared default.
function baseValue(world, data, context, operation, property, param, args, tick) {
  const name = text(param, 'name'), numeric = (value) => typeof value === 'number' && Number.isFinite(value);
  if (context.selected) {
    const fields = (data.fields.get(context.selected.id) || []).filter((field) => {
      tick();
      return get(property, 'binding') !== undefined && text(field, 'binding') === text(property, 'binding');
    });
    const values = fields.length === 1 ? listed(fields[0], 'value') : [];
    const value = values.length === 1 ? typedValue(values[0], world, tick) : absent;
    return numeric(value) ? { value, support: [fields[0].id] } : { value: absent };
  }
  const rows = data.bases.filter((row) => {
    tick();
    return text(row, 'operation') === text(operation, 'name') && text(row, 'parameter') === name &&
      (!get(row, 'kind') || get(row, 'kind') === get(context.target, 'kind'));
  });
  if (rows.length) {
    const values = new Set(rows.map((row) => typedValue(get(row, 'value'), world, tick)));
    const [value] = values;
    return values.size === 1 && numeric(value) ? { value, support: rows.map((row) => row.id) } : { value: absent };
  }
  const value = args.has(name) ? args.get(name) : typedValue(get(param, 'default'), world, tick);
  return numeric(value) ? { value, support: [] } : { value: absent };
}

// A positive degree word ("big", "smaller") scales the base by its declared std.capability.degree factor,
// or names an absolute literal when the property resolves values through the lookup table. A positive
// factor condition with baseline=before multiplies the target's observed value by its number.
function degreeValue(world, data, context, operation, condition, property, param, args, tick) {
  const operator = get(condition, 'operator');
  if (get(condition, 'polarity') !== 'positive') return { value: absent };
  if (operator === 'degree' && get(property, 'codec') === 'lookup') return lookupValue(world, data, condition, tick);
  if (!['number', 'integer'].includes(get(param, 'kind'))) return { value: absent };
  let factor, support = [];
  if (operator === 'degree') {
    const rows = data.degrees.filter((row) => {
      tick();
      return text(row, 'concept') === text(condition, 'concept') && text(row, 'label') === text(condition, 'value');
    });
    const factors = new Set(rows.map((row) => number(row, 'factor')));
    [factor] = factors;
    support = rows.map((row) => row.id);
    if (factors.size !== 1) return { value: absent, support };
  } else if (operator === 'factor' && get(condition, 'baseline') === 'before' && context.selected) {
    factor = Number(text(condition, 'value'));
  } else return { value: absent };
  if (!Number.isFinite(factor) || factor <= 0) return { value: absent, support };
  const base = baseValue(world, data, context, operation, property, param, args, tick);
  if (base.value === absent) return { value: absent, support };
  const scaled = base.value * factor;
  return { value: get(param, 'kind') === 'integer' ? Math.round(scaled) : scaled, support: [...support, ...base.support] };
}

function valueOf(world, data, condition, property, param, args, tick) {
  const value = text(condition, 'value');
  const codec = get(property, 'codec'), kind = get(param, 'kind');
  if (codec === 'lookup') return lookupValue(world, data, condition, tick);
  if (kind === 'array' && codec) {
    const found = parseList(value, codec);
    return { value: found === absent ? absent : [...(args.get(text(param, 'name')) || []), ...found] };
  }
  if (['number', 'integer'].includes(kind) && typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return { value: Number(value) };
  }
  if (kind === 'boolean' && ['true', 'false'].includes(value)) return { value: value === 'true' };
  return { value: value ?? absent };
}

function sourceValue(world, rule, context, args, parameter, tick) {
  const { target, selected, labels, kinds, scope } = context;
  const name = text(target, 'name'), id = text(selected, 'id'), label = labels[0];
  switch (get(rule, 'source')) {
    case 'value': return typedValue(get(rule, 'value'), world, tick);
    case 'target.id': return id ?? absent;
    case 'target.list': return id === undefined ? absent : [id];
    case 'fresh.id': return text(scope, 'newId') ?? absent;
    case 'target.name': return name ?? absent;
    case 'label': return labels.length === 1 ? label : absent;
    case 'kind': return get(parameter, 'kind') === 'string' && kinds.size === 1 ? kinds.values().next().value : absent;
    case 'name.or.label': return name ?? label ?? absent;
    case 'clock': return Number.isFinite(number(scope, 'clock')) ? number(scope, 'clock') : absent;
    case 'ordinal.list': {
      const source = args.get(text(rule, 'from'));
      return Array.isArray(source) && source.length ? source.map((_, i) => String(i + 1)) : absent;
    }
    default: return absent;
  }
}

function sameValue(left, right, tick) {
  tick();
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object' ||
      Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length &&
    keys.every(key => Object.hasOwn(right, key) && sameValue(left[key], right[key], tick));
}

function seedConditions(world, refs, destination, params, inputs, args, tick) {
  const confirmed = new Map();
  for (const reference of refs) {
    tick();
    const condition = world.get(reference.slice(1));
    const name = text(condition, 'name'), parameter = params.get(name);
    if (condition?.type !== family + 'arg' || !parameter || name === destination || inputs.unresolved.has(name)) return null;
    const value = inputs.args.has(name) ? inputs.args.get(name) : typedValue(get(parameter, 'default'), world, tick);
    const required = typedValue(get(condition, 'value'), world, tick);
    if (!accepts(value, parameter, world, tick) || !sameValue(value, required, tick) ||
        args.has(name) && !sameValue(args.get(name), value, tick)) return null;
    confirmed.set(name, value);
  }
  return confirmed;
}

function seedArgs(world, rules, phase, context, params, args, requested, notes, support, tick, inputs) {
  for (const rule of rules) {
    tick();
    const conditions = listed(rule, 'whenArgument');
    if (get(rule, 'phase') !== phase || Boolean(conditions.length) !== Boolean(inputs)) continue;
    const name = text(rule, 'parameter'), parameter = params.get(name);
    const inferred = inferredSeed(rule);
    if (inferred && (phase !== 'missing' || get(rule, 'source') !== 'value' || args.has(name) || requested.has(name))) continue;
    if (!parameter || flag(rule, 'parameterRequired') && !flag(parameter, 'required') ||
        params.has(text(rule, 'unlessParameter')) ||
        args.has(name) && !flag(rule, 'replace') &&
          !(get(rule, 'source') === 'ordinal.list' && args.get(name)?.length === 0)) continue;
    const confirmed = inputs && seedConditions(world, conditions, name, params, inputs, args, tick);
    if (inputs && !confirmed) continue;
    const value = sourceValue(world, rule, context, args, parameter, tick);
    if (value === absent) {
      if (!inferred && flag(rule, 'required')) return false;
      continue;
    }
    if (!accepts(value, parameter, world, tick)) {
      if (inferred) continue;
      return false;
    }
    if (confirmed) {
      for (const [key, argument] of confirmed) {
        tick();
        if (!args.has(key)) args.set(key, argument);
      }
      for (const reference of conditions) {
        tick();
        support.add(reference.slice(1));
      }
    }
    args.set(name, value);
    support.add(rule.id);
    const notice = text(rule, 'notice');
    if (notice) notes.push(notice.replace('{value}', JSON.stringify(value)));
  }
  return true;
}

function candidate(world, data, context, operation, mapping, results, tick) {
  const name = text(operation, 'name'), on = text(operation, 'on'), act = text(operation, 'act');
  const args = new Map(), requested = new Set(), unresolved = new Set(), applied = [], skipped = [], notes = [], support = new Set([operation.id]);
  let repeat;
  const params = new Map();
  for (const parameter of data.params.get(operation.id) || []) {
    tick();
    const key = text(parameter, 'name');
    if (!safeKey(key) || params.has(key)) return { name, reason: 'invalid-parameter' };
    params.set(key, parameter);
  }
  for (const reference of mapping ? listed(mapping, 'argument') : []) {
    const row = world.get(reference.slice(1));
    const key = text(row, 'name'), value = typedValue(get(row, 'value'), world, tick);
    if (value === absent || !params.has(key) || args.has(key)) return { name, reason: 'invalid-family-argument' };
    args.set(key, value);
    support.add(row.id);
  }
  const rules = data.seeds.filter((row) => {
    tick();
    return (!get(row, 'operation') || text(row, 'operation') === name) &&
      (!get(row, 'act') || text(row, 'act') === act) &&
      (!get(row, 'scope') || ref(world, row, 'scope')?.id === context.scope.id) &&
      (!get(row, 'kind') || get(row, 'kind') === get(context.target, 'kind'));
  });
  if (!seedArgs(world, rules, 'initial', context, params, args, requested, notes, support, tick)) return { name, reason: 'missing-declared-seed' };
  for (const condition of results) {
    tick();
    const property = data.properties.find((row) => {
      tick();
      return text(row, 'on') === on && text(row, 'concept') === text(condition, 'concept') && params.has(text(row, 'parameter'));
    });
    if (property) requested.add(text(property, 'parameter'));
    // A count the operation has no parameter for: the call made that many times, when the family declares it
    // repeatable for this act (std.capability.repeat on=<family> act concept max).
    const repeatable = !property && positiveEq(condition) && repeat === undefined && data.repeats.find((row) => {
      tick();
      return text(row, 'on') === on && get(row, 'act') === act && get(row, 'concept') === get(condition, 'concept');
    });
    if (repeatable) {
      const n = Number(str(get(condition, 'value')));
      if (Number.isInteger(n) && n >= 1 && n <= number(repeatable, 'max')) {
        repeat = n;
        applied.push(condition.id);
        support.add(repeatable.id);
        continue;
      }
    }
    const parameter = property && params.get(text(property, 'parameter'));
    const value = !parameter ? { value: absent }
      : positiveEq(condition) ? valueOf(world, data, condition, property, parameter, args, tick)
      : degreeValue(world, data, context, operation, condition, property, parameter, args, tick);
    if (!parameter || !accepts(value.value, parameter, world, tick)) {
      if (property) unresolved.add(text(property, 'parameter'));
      skipped.push(condition);
      continue;
    }
    args.set(text(parameter, 'name'), value.value);
    applied.push(condition.id);
    support.add(property.id);
    for (const id of value.support || []) support.add(id);
  }

  if (!seedArgs(world, rules, 'missing', context, params, args, requested, notes, support, tick)) return { name, reason: 'missing-declared-seed' };
  if (rules.some(rule => get(rule, 'whenArgument') !== undefined)) {
    // A measured default may observe admitted arguments and ABI defaults. Its output
    // cannot authorize another measurement or replace an argument already used by one.
    const inputs = { args: new Map(args), unresolved };
    seedArgs(world, rules, 'missing', context, params, args, requested, notes, support, tick, inputs);
  }
  for (const [key, param] of params) {
    tick();
    if (!args.has(key) && get(param, 'default') !== undefined) args.set(key, typedValue(get(param, 'default'), world, tick));
    if (!args.has(key)) {
      if (flag(param, 'required')) return { name, reason: 'missing-argument' };
    } else if (!accepts(args.get(key), param, world, tick)) return { name, reason: 'invalid-argument-value' };
  }
  if (flag(context.mode, 'requireResult') && !applied.length) return { name, reason: 'no-applicable-result' };
  return { name, args, applied, skipped, notes, support, repeat };
}

function refuseChosen(data, chosen, tick) {
  for (const guard of data.guards) {
    tick();
    if (text(guard, 'operation') !== chosen.name) continue;
    const when = get(guard, 'when');
    if (when === 'incomplete.coverage' && (chosen.skipped.length || listed(data.scope, 'unapplied').length) ||
        when === 'active.signal' && data.signals.some((row) => get(row, 'name') === get(guard, 'signal'))) return guard;
  }
  return null;
}

function targetInventory(world,data,target,tick) {
  const mappings = data.targets.filter((row) => {
    tick();
    return get(row, 'canonical') === get(target, 'kind');
  });
  const familyIds = new Set(mappings.map((row) => ref(world, row, 'operation')?.id));
  const related = data.operations.filter((row) => familyIds.has(row.id));
  const types = new Set(related.map((row) => text(row, 'on')));
  const labels = [...new Set(mappings.map((row) => text(row, 'label')))];
  const kinds = new Set();
  for (const row of related) {
    for (const rule of data.seeds) {
      tick();
      if (inferredSeed(rule) || get(rule, 'source') !== 'kind' ||
          get(rule, 'operation') && text(rule, 'operation') !== text(row, 'name') ||
          get(rule, 'act') && text(rule, 'act') !== text(row, 'act')) continue;
      const parameter = (data.params.get(row.id) || []).find((param) => text(param, 'name') === text(rule, 'parameter'));
      if (parameter?.attrs.enum) for (const label of labels) if (accepts(label, parameter, world, tick)) kinds.add(label);
    }
  }

  // A family mapping (family=true) names the whole source type of its operation: every member denotes it.
  const wholeType = mappings.some((row) => flag(row, 'family'));
  return {mappings,related,types,labels,kinds,wholeType};
}

function compileQuery(world,request,nodes,data,tick){
  const wires=[];
  const append=(type,attrs)=>{
    tick();
    const row={id:'observed.query.output.'+wires.length,type:family+type,attrs};
    wires.push(row);
    return '$'+row.id;
  };
  const summary={id:'observed.query.result',type:family+'query.result',attrs:{
    instance:listed(data.scope,'instance'),version:listed(data.scope,'version'),population:listed(data.scope,'population'),
  }};
  const projections=listed(request,'query').map(id=>world.get(id.slice(1)));
  const targets=nodes.filter(row=>row.type==='std.request.target');
  const selectors=new Set(targets.flatMap(row=>listed(row,'selector')));
  const supported=['std.request','std.request.source','std.request.query','std.request.target','std.request.constraint'];
  if(get(request,'mood')!=='ask'||!projections.length||nodes.some(row=>
    !supported.includes(row.type)||row.type==='std.request.constraint'&&!selectors.has('$'+row.id))){
    summary.attrs.status=['unavailable'];summary.attrs.reason=['unsupported-query-graph'];
    return serialize([summary]);
  }
  const validPopulation=!!text(data.scope,'population')&&
    new Set(data.objects.map(row=>text(row,'id'))).size===data.objects.length&&
    new Set(data.objects.map(row=>text(row,'source'))).size===data.objects.length&&
    data.objects.every(row=>text(row,'version')===text(data.scope,'version'));
  if(!validPopulation){summary.attrs.status=['unavailable'];summary.attrs.reason=['invalid-query-population'];return serialize([summary]);}
  let successful=0;
  for(const query of projections){
    tick();
    const operation=get(query,'operation'),target=ref(world,query,'target'),selector=ref(world,target,'selector');
    const attrs={query:[quote(query.id)],operation:[operation],status:['unavailable'],complete:['false'],
      kind:[quote(text(target,'kind'))],concept:listed(query,'concept')};
    let memberStart;
    const abort=reason=>{if(memberStart!==undefined)wires.length=memberStart;attrs.reason=[reason];append('query.answer',attrs);};
    const {types,labels,kinds}=targetInventory(world,data,target,tick);
    // A shared source type alone cannot prove which members denote a canonical kind.
    if(!kinds.size||labels.some(label=>!kinds.has(label))){abort('unbound-query-population');continue;}
    const matched=matchObject(world,data,types,kinds,target,selector,tick);
    if(matched.unsupported||matched.reason){abort(matched.reason?'unresolved-selector-value':'unsupported-selector');continue;}
    attrs.selection=matched.selection.map(({object,status,support})=>append('selection',{
      id:listed(object,'id'),status:[status],support:support.map(quote),
    }));
    const complete=flag(data.scope,'populationComplete')&&!matched.selection.some(row=>row.status==='unknown')&&
      (!get(target,'name')||data.objects.every(row=>!types.has(text(row,'on'))||!kinds.has(text(row,'kind'))||get(row,'name')!==undefined));
    if(!complete&&(operation!=='exists'||!matched.matches.length)){abort('incomplete-query-population');continue;}
    const members=[];
    memberStart=wires.length;
    let incompleteField=false;
    for(const object of matched.matches){
      tick();
      const member={query:attrs.query,id:listed(object,'id'),source:listed(object,'source'),kind:listed(object,'kind'),
        on:listed(object,'on'),name:listed(object,'name'),support:[quote(object.id)]};
      if(operation==='values'){
        const property=observationProperty(data,text(object,'on'),get(query,'concept'),tick);
        const fields=(data.fields.get(object.id)??[]).filter(row=>property&&get(row,'binding')===get(property,'binding'));
        if(fields.length!==1||!listed(fields[0],'value').length){incompleteField=true;break;}
        const values=listed(fields[0],'value').map(token=>typedValue(token,world,tick));
        if(values.includes(absent)){incompleteField=true;break;}
        member.value=values.map(value=>encodeValue(value,append,tick));
        member.support.push(quote(property.id),quote(fields[0].id));
      }
      members.push(append('query.member',member));
    }
    if(incompleteField){abort('unobserved-query-value');continue;}
    if(operation==='count'||operation==='exists'){
      const materialized=world.fork();
      const memberWires=wires.slice(memberStart);
      if(!materialized.tell(serialize(memberWires),{factsOnly:true}).ok){abort('invalid-query-population');continue;}
      const answer=materialized.query({type:family+'query.member',mode:operation,where:{query:attrs.query[0]}});
      if(answer.status==='budget'){abort('budget');continue;}
      attrs.value=[operation==='count'?answer.value:String(answer.value==='yes')];
    }
    attrs.status=['answered'];attrs.complete=[String(complete)];attrs.member=members;
    attrs.support=[...matched.support,...matched.matches.map(row=>row.id)].map(quote);
    append('query.answer',attrs);successful++;
  }
  summary.attrs.status=[successful===projections.length?'answered':successful?'partial':'unavailable'];
  summary.attrs.answer=wires.filter(row=>row.type===family+'query.answer').map(row=>'$'+row.id);
  return serialize([summary,...wires]);
}

function compile(world, request, nodes, context) {
  const tick = () => world._b.tick('validate');
  const scope = ref(world, context, 'scope');
  if (ref(world, context, 'request')?.id !== request.id || scope?.type !== family + 'scope') {
    return output(tick, 'unavailable', { reason: 'invalid-capability-context' });
  }
  if (request.attrs.query) return compileQuery(world,request,nodes,records(world,scope,tick),tick);
  const projection = graph(request, nodes);
  const act = get(request, 'act');
  if (!projection) return output(tick, 'not-applicable', { reason: 'unsupported-graph', act });
  const { target, selector, results } = projection;
  const data = records(world, scope, tick);
  const modes = data.modes.filter((mode) => get(mode, 'act') === act && get(mode, 'target') === get(target, 'mode'));
  if (modes.length !== 1 || selector && !flag(modes[0], 'selector')) {
    return output(tick, 'not-applicable', { reason: 'unsupported-target-mode', act });
  }
  const [mode] = modes;
  const kind = get(target, 'kind');
  const { mappings, related, types, labels, kinds, wholeType } = targetInventory(world,data,target,tick);
  if (!related.length) return output(tick, get(mode, 'target') === 'new' ? 'unavailable' : 'not-applicable', { reason: 'native-binding-gap', act, kind });

  const matched = get(target, 'mode') === 'existing'
    ? matchObject(world, data, types, kinds, target, selector, tick, wholeType ? [] : labels) : { matches: [], selection: [], support: [] };
  if (matched.unsupported) return output(tick, 'not-applicable', { reason: 'unsupported-selector', act, kind });
  const { matches, selection, support: selectorSupport } = matched;
  const selected = matches.find((row) => text(row, 'id') === text(scope, 'focus')) ?? matches.at(-1);
  const selectorDetails = selector ? { selector: selector.id, support: selectorSupport } : {};
  if (matched.reason || (get(target, 'mode') === 'existing' && (!selected || flag(scope, 'targetUnique') && matches.length !== 1 ||
      selector && flag(mode, 'selectorUnique') && (matches.length !== 1 || selection.some((row) => row.status === 'unknown'))))) {
    return output(tick, 'unavailable', { reason: matched.reason || 'target', act, kind, ...selectorDetails }, null, [], selection);
  }

  const operations = data.operations.filter((row) => flag(row, 'eligible') && get(row, 'act') === act &&
    (selected ? text(row, 'on') === text(selected, 'on') : types.has(text(row, 'on'))));
  const input = { scope, mode, target, labels, kinds, selected };
  const alternatives = operations.map((row) => {
    const item = candidate(world, data, input, row,
      mappings.find((mapping) => ref(world, mapping, 'operation')?.id === row.id), results, tick);
    if (item.reason) return item;
    item.preferences = [];
    item.score = 0;
    for (const pref of data.preferences) {
      tick();
      if (ref(world, pref, 'operation')?.id !== row.id) continue;
      item.preferences.push(pref.id);
      item.support.add(pref.id);
      item.score += number(pref, 'weight');
    }
    return item;
  });
  const viable = alternatives.filter(item=>!item.reason).sort((a,b)=>
    b.applied.length-a.applied.length || b.score-a.score);
  const preferred = viable[0];
  if (!preferred) return output(tick,'unavailable',{reason:'native-binding-gap',act,kind:labels[0],...selectorDetails},null,alternatives,selection);
  for (const item of viable) {
    tick();
    const guard=refuseChosen(data,item,tick);
    if (guard) { item.guard=guard; item.reason=get(guard,'reason'); }
  }
  // A guard on an intended effect cannot authorize an operation that drops that effect.
  const chosen=viable.find(item=>!item.reason && preferred.applied.every(id=>item.applied.includes(id)));
  const ranked=[...viable,...alternatives.filter(item=>!item.applied)];
  if (!chosen) return output(tick,'unavailable',{reason:preferred.reason,message:text(preferred.guard,'message'),
    act,kind:labels[0],...selectorDetails,support:[preferred.guard.id,...selectorSupport]},null,ranked,selection);
  const label = text(selected, 'kind') ?? kinds.values().next().value ?? labels[0];
  const skipped = [...listed(scope, 'unapplied').map(str),
    ...chosen.skipped.map((row) => `${text(row, 'concept')} ${text(row, 'value') ?? ''}`)];
  return output(tick, 'compiled', {
    act, kind: label, id: text(selected, 'id'), source: text(selected, 'source'), instance: text(scope, 'instance'),
    version: text(scope, 'version'), target: matches.map((row) => text(row, 'id')), covered: chosen.applied,
    skipped, note: chosen.notes, repeat: chosen.repeat > 1 ? chosen.repeat : undefined, ...selectorDetails, support: [...new Set([...chosen.support, ...selectorSupport, ...(selected ? [selected.id] : [])])],
  }, chosen, ranked, selection);
}

/** Compile a single-target request over the supplied trusted capability and observation facts. */
export function compileCapabilityCircuit(world, request, nodes, context) {
  return world._guard({}, () => compile(world, request, nodes, context),
    () => output(() => {}, 'unavailable', { reason: 'budget' }));
}
