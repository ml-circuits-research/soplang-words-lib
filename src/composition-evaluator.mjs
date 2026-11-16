// Shared JSON-template evaluator. Its operation accounting is part of the
// composition contract; callers share one evaluator across their complete batch.
export const own = (value, key) => value !== null && typeof value === 'object' && Object.hasOwn(value, key);
export const plain = value => value !== null && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value));

const VALIDATE = Symbol('template syntax validation');
export const validCompositionLimits = (budget, maxDepth) => Number.isSafeInteger(budget) && budget >= 0 && Number.isSafeInteger(maxDepth) && maxDepth >= 1 && maxDepth <= 256;

export function compositionEvaluator(budget, maxDepth) {
  let steps = 0, exhausted = false;
  const fail = reason => { throw { composition: true, reason }; };
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
          if (context !== VALIDATE) {
            if (!own(value, key)) fail('missing-binding');
            value = read(value, key);
          }
        }
        return context === VALIDATE ? null : copy(value, depth + 1);
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
  const checkGuards = (checks, context, depth) => {
    if (!Array.isArray(checks)) fail('invalid-guard');
    for (const [, guard] of entries(checks, depth)) { // bounded: each guard and operand shares the composition budget
      tick(depth);
      if (!plain(guard) || entries(guard, depth).length !== 2 || !own(guard, 'left') || !own(guard, 'right')) fail('invalid-guard');
      const left = evaluate(read(guard, 'left'), context, depth + 1);
      const right = evaluate(read(guard, 'right'), context, depth + 1);
      if (!equal(left, right, depth + 1)) fail('guard-rejected');
    }
  };
  const validateGuards = (templates, guards) => {
    if (!plain(guards)) fail('invalid-guard');
    for (const [rule, checks] of entries(guards, 0)) { // bounded: all declaration nodes share the same budget
      if (!own(templates, rule) || !Array.isArray(checks)) fail('invalid-guard');
      for (const [, guard] of entries(checks, 0)) {
        if (!plain(guard) || entries(guard, 0).length !== 2 || !own(guard, 'left') || !own(guard, 'right')) fail('invalid-guard');
        evaluate(read(guard, 'left'), VALIDATE, 0);
        evaluate(read(guard, 'right'), VALIDATE, 0);
      }
    }
  };
  return { tick, fail, read, entries, copy, evaluate, checkGuards, validateGuards,
    validate: (template, depth = 0) => evaluate(template, VALIDATE, depth),
    get exhausted() { return exhausted; } };
}
