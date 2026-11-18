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

function output(tick, status, data = {}, call, alternatives = []) {
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
    const write = ['reason', 'act'].includes(key) ? String : quote;
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
    preferences: scoped('preference'), seeds: all('seed').sort(byOrder), guards: all('guard'), signals: scoped('signal'),
    fields: byRef('field', 'object'), params: byRef('parameter', 'operation'),
  };
}

function matchObject(properties, fields, facts, types, kinds, target, selector, tick) {
  const targetName = text(target, 'name');
  const concept = text(selector, 'concept');
  const binding = selector && properties.find((row) => text(row, 'concept') === concept && get(row, 'binding'));
  if (selector && (!binding || !positiveEq(selector))) return null;
  return facts.filter((object) => {
    tick();
    if (!types.has(text(object, 'on')) || (kinds.size && !kinds.has(text(object, 'kind'))) ||
        (targetName !== undefined && text(object, 'name') !== targetName)) return false;
    return !selector || (fields.get(object.id) || []).some((field) => {
      tick();
      return text(field, 'binding') === text(binding, 'binding') &&
        listed(field, 'value').some((value) => str(value) === text(selector, 'value'));
    });
  });
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

function valueOf(world, data, condition, property, param, args, tick) {
  const value = text(condition, 'value');
  const codec = get(property, 'codec'), kind = get(param, 'kind');
  if (codec === 'lookup') {
    const rows = data.literals.filter((row) => {
      tick();
      return text(row, 'concept') === text(condition, 'concept') && text(row, 'label') === value;
    });
    const values = new Set(rows.map((row) => typedValue(get(row, 'value'), world, tick)));
    return values.size === 1 ? { value: values.values().next().value, support: rows.map((row) => row.id) } : { value: absent };
  }
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

function seedArgs(world, rules, phase, context, params, args, notes, support, tick) {
  for (const rule of rules) {
    tick();
    if (get(rule, 'phase') !== phase) continue;
    const name = text(rule, 'parameter'), parameter = params.get(name);
    if (!parameter || flag(rule, 'parameterRequired') && !flag(parameter, 'required') ||
        params.has(text(rule, 'unlessParameter')) ||
        args.has(name) && !flag(rule, 'replace') &&
          !(get(rule, 'source') === 'ordinal.list' && args.get(name)?.length === 0)) continue;
    const value = sourceValue(world, rule, context, args, parameter, tick);
    if (value === absent) {
      if (flag(rule, 'required')) return false;
      continue;
    }
    if (!accepts(value, parameter, world, tick)) return false;
    args.set(name, value);
    support.add(rule.id);
    const notice = text(rule, 'notice');
    if (notice) notes.push(notice.replace('{value}', JSON.stringify(value)));
  }
  return true;
}

function candidate(world, data, context, operation, mapping, results, tick) {
  const name = text(operation, 'name'), on = text(operation, 'on'), act = text(operation, 'act');
  const args = new Map(), applied = [], skipped = [], notes = [], support = new Set([operation.id]);
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
    return (!get(row, 'operation') || text(row, 'operation') === name) && (!get(row, 'act') || text(row, 'act') === act);
  });
  if (!seedArgs(world, rules, 'initial', context, params, args, notes, support, tick)) return { name, reason: 'missing-declared-seed' };
  for (const condition of results) {
    tick();
    const property = positiveEq(condition) && data.properties.find((row) => {
      tick();
      return text(row, 'on') === on && text(row, 'concept') === text(condition, 'concept') && params.has(text(row, 'parameter'));
    });
    const parameter = property && params.get(text(property, 'parameter'));
    const value = parameter ? valueOf(world, data, condition, property, parameter, args, tick) : { value: absent };
    if (!parameter || !accepts(value.value, parameter, world, tick)) {
      skipped.push(condition);
      continue;
    }
    args.set(text(parameter, 'name'), value.value);
    applied.push(condition.id);
    support.add(property.id);
    for (const id of value.support || []) support.add(id);
  }

  if (!seedArgs(world, rules, 'missing', context, params, args, notes, support, tick)) return { name, reason: 'missing-declared-seed' };
  for (const [key, param] of params) {
    tick();
    if (!args.has(key) && get(param, 'default') !== undefined) args.set(key, typedValue(get(param, 'default'), world, tick));
    if (!args.has(key)) {
      if (flag(param, 'required')) return { name, reason: 'missing-argument' };
    } else if (!accepts(args.get(key), param, world, tick)) return { name, reason: 'invalid-argument-value' };
  }
  if (flag(context.mode, 'requireResult') && !applied.length) return { name, reason: 'no-applicable-result' };
  return { name, args, applied, skipped, notes, support };
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

function compile(world, request, nodes, context) {
  const tick = () => world._b.tick('validate');
  const scope = ref(world, context, 'scope');
  if (ref(world, context, 'request')?.id !== request.id || scope?.type !== family + 'scope') {
    return output(tick, 'unavailable', { reason: 'invalid-capability-context' });
  }
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
  const mappings = data.targets.filter((row) => {
    tick();
    return get(row, 'canonical') === get(target, 'kind');
  });
  const familyIds = new Set(mappings.map((row) => ref(world, row, 'operation')?.id));
  const related = data.operations.filter((row) => familyIds.has(row.id));
  const kind = get(target, 'kind');
  if (!related.length) return output(tick, get(mode, 'target') === 'new' ? 'unavailable' : 'not-applicable', { reason: 'native-binding-gap', act, kind });
  const types = new Set(related.map((row) => text(row, 'on')));
  const labels = [...new Set(mappings.map((row) => text(row, 'label')))];
  const kinds = new Set();
  for (const row of related) {
    for (const rule of data.seeds) {
      tick();
      if (get(rule, 'source') !== 'kind' ||
          get(rule, 'operation') && text(rule, 'operation') !== text(row, 'name') ||
          get(rule, 'act') && text(rule, 'act') !== text(row, 'act')) continue;
      const parameter = (data.params.get(row.id) || []).find((param) => text(param, 'name') === text(rule, 'parameter'));
      if (parameter?.attrs.enum) for (const label of labels) if (accepts(label, parameter, world, tick)) kinds.add(label);
    }
  }

  const matches = get(target, 'mode') === 'existing'
    ? matchObject(data.properties, data.fields, data.objects, types, kinds, target, selector, tick) : [];
  if (!matches) return output(tick, 'not-applicable', { reason: 'unsupported-selector', act, kind });
  const selected = matches.find((row) => text(row, 'id') === text(scope, 'focus')) ?? matches.at(-1);
  if (get(target, 'mode') === 'existing' && !selected) return output(tick, 'unavailable', { reason: 'target', act, kind });

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
  if (!preferred) return output(tick,'unavailable',{reason:'native-binding-gap',act,kind:labels[0]},null,alternatives);
  for (const item of viable) {
    tick();
    const guard=refuseChosen(data,item,tick);
    if (guard) { item.guard=guard; item.reason=get(guard,'reason'); }
  }
  // A guard on an intended effect cannot authorize an operation that drops that effect.
  const chosen=viable.find(item=>!item.reason && preferred.applied.every(id=>item.applied.includes(id)));
  const ranked=[...viable,...alternatives.filter(item=>!item.applied)];
  if (!chosen) return output(tick,'unavailable',{reason:preferred.reason,message:text(preferred.guard,'message'),
    act,kind:labels[0],support:[preferred.guard.id]},null,ranked);
  const label = text(selected, 'kind') ?? kinds.values().next().value ?? labels[0];
  const skipped = [...listed(scope, 'unapplied').map(str),
    ...chosen.skipped.map((row) => `${text(row, 'concept')} ${text(row, 'value') ?? ''}`)];
  return output(tick, 'compiled', {
    act, kind: label, id: text(selected, 'id'), source: text(selected, 'source'), instance: text(scope, 'instance'),
    version: text(scope, 'version'), target: matches.map((row) => text(row, 'id')), covered: chosen.applied,
    skipped, note: chosen.notes, support: [...chosen.support, ...(selected ? [selected.id] : [])],
  }, chosen, ranked);
}

/** Compile a single-target request over the supplied trusted capability and observation facts. */
export function compileCapabilityCircuit(world, request, nodes, context) {
  return world._guard({}, () => compile(world, request, nodes, context),
    () => output(() => {}, 'unavailable', { reason: 'budget' }));
}
