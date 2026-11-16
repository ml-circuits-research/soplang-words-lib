// Declarative semantics over parseText trees. No language, ontology or request
// schema is built in. A mapping is an author's interpretation, not its proof.
const own = (value, key) => value !== null && typeof value === 'object' && Object.hasOwn(value, key);
const plain = value => value !== null && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value));

/**
 * Compose each parse independently using rules[tree.rule] and lexical[tree.cat].
 * Templates are JSON values, objects and arrays. {$get: path} copies an own-property
 * path from {node, children}; {$literal: value} quotes JSON containing reserved keys.
 * Every child needs a mapping; {$literal:null} explicitly acknowledges syntax-only
 * material. guards[rule] lists {left, right} template pairs that must be structurally
 * equal before the parent is accepted. Missing bindings reject that parse. No candidates are merged or ranked.
 * Returned candidates carry their parse index; failures and budget limits remain
 * explicit. This mechanism does not claim exhaustive parsing or semantic validity.
 */
export function composeParses(parses, { rules = {}, lexical = {}, guards = {}, budget = 20000, maxDepth = 64 } = {}) {
  const candidates = [], failures = [];
  let steps = 0, exhausted = false;
  const fail = reason => { throw { composition: true, reason }; };
  if (!Number.isSafeInteger(budget) || budget < 0 || !Number.isSafeInteger(maxDepth) || maxDepth < 1 || maxDepth > 256)
    return { candidates, failures: [{ reason: 'invalid-limits' }], truncated: true };
  const tick = depth => {
    if (++steps > budget) { exhausted = true; fail('budget'); }
    if (depth > maxDepth) fail('depth');
  };
  const read = (value, key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) fail('missing-binding');
    if (!own(descriptor, 'value')) fail('accessor-property');
    return descriptor.value;
  };
  const entries = (value, depth) => {
    const keys = Reflect.ownKeys(value);
    const array = Array.isArray(value);
    if (array && Object.getPrototypeOf(value) !== Array.prototype) fail('non-json-array');
    if (array && keys.length !== value.length + 1) fail('non-json-array');
    const out = [];
    for (const key of keys) { // bounded: each own property is charged
      tick(depth);
      if (typeof key !== 'string') fail('symbol-property');
      if (array && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!own(descriptor, 'value')) fail('accessor-property');
      if (!descriptor.enumerable) fail('non-json-property');
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) fail('non-json-array');
      out.push([key, descriptor.value]);
    }
    return out;
  };
  const copy = (value, depth) => { // bounded: tick charges every recursive copy and caps depth
    tick(depth);
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
    if (Array.isArray(value)) return entries(value, depth).map(([, v]) => copy(v, depth + 1));
    if (plain(value)) return Object.fromEntries(entries(value, depth).map(([k, v]) => [k, copy(v, depth + 1)]));
    fail('non-json-value');
  };
  const evaluate = (template, context, depth) => { // bounded: tick charges every template node and caps depth
    tick(depth);
    if (plain(template)) {
      const fields = entries(template, depth);
      if (own(template, '$get')) {
        const path = read(template, '$get');
        if (fields.length !== 1 || !Array.isArray(path) || !path.length) fail('invalid-path');
        let value = context;
        for (const [, key] of entries(path, depth)) {
          tick(depth);
          if (!(typeof key === 'string' || (Number.isSafeInteger(key) && key >= 0))) fail('invalid-path');
          if (context !== null) {
            if (!own(value, key)) fail('missing-binding');
            value = read(value, key);
          }
        }
        return context === null ? null : copy(value, depth + 1);
      }
      if (own(template, '$literal')) {
        if (fields.length !== 1) fail('invalid-literal');
        return copy(read(template, '$literal'), depth + 1);
      }
      return Object.fromEntries(fields.map(([k, v]) => [k, evaluate(v, context, depth + 1)]));
    }
    if (Array.isArray(template)) return entries(template, depth).map(([, v]) => evaluate(v, context, depth + 1));
    return copy(template, depth + 1);
  };
  // Both operands have already been copied as valid JSON. Object insertion order
  // is not semantic; arrays remain ordered and primitive types never coerce.
  const equal = (left, right, depth) => { // bounded: tick charges every recursive comparison and entries charges keys
    tick(depth);
    if (left === right) return true;
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
    if (Array.isArray(left) !== Array.isArray(right)) return false;
    const a = entries(left, depth), b = entries(right, depth);
    if (a.length !== b.length) return false;
    for (const [key, value] of a) { // bounded: entries charged each key; recursive comparisons charge their values
      if (!own(right, key) || !equal(value, read(right, key), depth + 1)) return false;
    }
    return true;
  };
  const compose = (node, depth) => { // bounded: tick charges every tree node and caps depth
    tick(depth);
    if (!plain(node)) fail('invalid-node');
    if (own(node, 'coord')) fail('unmapped-coordination');
    const children = own(node, 'children') ? read(node, 'children') : [];
    if (!Array.isArray(children)) fail('invalid-children');
    const hasRule = own(node, 'rule');
    const map = hasRule ? rules : lexical;
    const key = read(node, hasRule ? 'rule' : 'cat');
    if (!own(map, key)) fail('missing-mapping');
    const values = entries(children, depth).map(([, child]) => compose(child, depth + 1));
    const context = { node, children: values };
    if (hasRule && own(guards, key)) {
      const checks = read(guards, key);
      if (!Array.isArray(checks)) fail('invalid-guard');
      for (const [, guard] of entries(checks, depth)) { // bounded: each guard and operand shares the composition budget
        tick(depth);
        if (!plain(guard) || entries(guard, depth).length !== 2 || !own(guard, 'left') || !own(guard, 'right')) fail('invalid-guard');
        const left = evaluate(read(guard, 'left'), context, depth + 1);
        const right = evaluate(read(guard, 'right'), context, depth + 1);
        if (!equal(left, right, depth + 1)) fail('guard-rejected');
      }
    }
    return evaluate(read(map, key), context, depth + 1);
  };
  // Validate all guard declarations before any candidate can escape. A null
  // evaluation context checks template syntax/JSON without resolving bindings.
  try {
    if (!plain(guards)) fail('invalid-guard');
    for (const [rule, checks] of entries(guards, 0)) { // bounded: all declaration nodes share the same budget
      if (!own(rules, rule) || !Array.isArray(checks)) fail('invalid-guard');
      for (const [, guard] of entries(checks, 0)) {
        if (!plain(guard) || entries(guard, 0).length !== 2 || !own(guard, 'left') || !own(guard, 'right')) fail('invalid-guard');
        evaluate(read(guard, 'left'), null, 0);
        evaluate(read(guard, 'right'), null, 0);
      }
    }
  } catch (error) {
    if (!error?.composition) throw error;
    return { candidates, failures: [{ reason: error.reason }], ...(exhausted ? { truncated: true } : {}) };
  }
  for (let index = 0; index < parses.length; index++) {
    try { candidates.push({ index, value: compose(parses[index].tree, 0) }); }
    catch (error) {
      if (!error?.composition) throw error;
      failures.push({ index, reason: error.reason });
      if (exhausted) break;
    }
  }
  return { candidates, failures, ...(exhausted || parses.truncated ? { truncated: true } : {}) };
}
