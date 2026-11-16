// Retained definitions are independent of undoable facts. Maps are persistent:
// insertion/merge replaces a map, never mutates one shared with a fork.
export function retainedKey(owner, revision) { return JSON.stringify([owner, revision]); }
export function retainedDefinition(value, tick, depth = 0, ancestors = new Set()) {
  tick();
  if (depth > 64) throw new TypeError('retained definition exceeds 64 levels');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') { for (let i = 0; i < value.length; i++) tick(); return value; }
  if (typeof value === 'number' && Number.isFinite(value)) return Object.is(value, -0) ? 0 : value;
  if (typeof value !== 'object' || value === null || ancestors.has(value)) throw new TypeError('retained definition must be acyclic finite JSON data');
  const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
  if (!array && proto !== Object.prototype && proto !== null) throw new TypeError('retained definition requires plain objects');
  const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
  for (const key of keys) {
    tick(); const d = descriptors[key];
    if (array && key === 'length') continue;
    if (typeof key !== 'string' || !d.enumerable || !Object.hasOwn(d, 'value')) throw new TypeError('retained definition cannot have symbols, accessors or hidden properties');
    if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) throw new TypeError('retained array has extra properties');
  }
  ancestors.add(value);
  let copy;
  if (array) {
    copy = [];
    for (let i = 0; i < value.length; i++) {
      tick(); if (!Object.hasOwn(descriptors, String(i))) throw new TypeError('retained arrays cannot have holes');
      copy.push(retainedDefinition(descriptors[i].value, tick, depth + 1, ancestors));
    }
  } else {
    copy = Object.create(null);
    const names = Object.keys(descriptors).sort((a,b) => { tick(); return a < b ? -1 : a > b ? 1 : 0; });
    for (const key of names) {
      for (let i = 0; i < key.length; i++) tick();
      copy[key] = retainedDefinition(descriptors[key].value, tick, depth + 1, ancestors);
    }
  }
  ancestors.delete(value);
  return Object.freeze(copy);
}
export function mergeRetained(left, right, tick) {
  const entries = new Map();
  for (const [key, entry] of left) { tick(); entries.set(key, entry); }
  for (const [key, entry] of right) {
    tick(); const previous = entries.get(key);
    if (previous) for (let i = 0; i < Math.max(previous.canonical.length, entry.canonical.length); i++) tick();
    if (previous && previous.canonical !== entry.canonical) return { ok: false, violations: [{ kind: 'retained-revision', owner: entry.record.owner, revision: entry.record.revision, why: 'conflicting retained definition during state adoption' }] };
    entries.set(key, entry);
  }
  return { ok: true, entries };
}
