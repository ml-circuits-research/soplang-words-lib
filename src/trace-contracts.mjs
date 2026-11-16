import { parse, str } from './parser.mjs';

// Snapshot tokens are data, not live references. Use the language parser rather
// than a second token grammar; retain canonical strings, multiplicity and order.
export function traceInputValidator([ref], world, { tick }) {
  const record = world.get(ref.slice(1));
  const encoded = record?.attrs.values?.[0];
  if (encoded === undefined) return false;
  for (let i = 0; i < encoded.length; i++) tick();
  let values;
  try { values = JSON.parse(str(encoded)); } catch { return false; }
  if (!Array.isArray(values)) return false;
  for (const value of values) {
    tick();
    if (typeof value !== 'string' || value.startsWith('?') || value.startsWith('$?')) return false;
    for (let i = 0; i < value.length; i++) tick();
    let wires;
    try { wires = parse('@snapshot snapshot value=' + value); } catch { return false; }
    if (wires.length !== 1 || wires[0].id !== 'snapshot' || wires[0].type !== 'snapshot' || Object.keys(wires[0].attrs).length !== 1 ||
        wires[0].attrs.value?.length !== 1 || wires[0].attrs.value[0] !== value) return false;
  }
  return true;
}

// Structural journal linkage, not an effect verifier. Dependencies may cross
// requests; replies may not attribute another request's step to their own.
export function traceGraphValidator(_args, world, { type, tick }) {
  const family = type.slice(0, -'.request'.length);
  const first = (w, k) => w?.attrs[k]?.[0];
  const get = ref => typeof ref === 'string' && ref.startsWith('$') ? world.get(ref.slice(1)) : null;
  const steps = new Map();
  for (const step of world.ofType(family + '.step')) { tick(); steps.set(step.id, step); }
  const edges = new Map();
  for (const step of steps.values()) {
    tick(); const dependencies = [];
    for (const ref of step.attrs.depends || []) {
      tick(); const dependency = get(ref);
      if (!dependency || !steps.has(dependency.id)) return false;
      dependencies.push(dependency.id);
    }
    edges.set(step.id, dependencies);
  }
  const acyclic = graph => {
    const degree = new Map();
    for (const id of graph.keys()) { tick(); degree.set(id, 0); }
    for (const children of graph.values()) for (const id of children) { tick(); degree.set(id, (degree.get(id) || 0) + 1); }
    const queue = [];
    for (const [id, n] of degree) { tick(); if (n === 0) queue.push(id); }
    let seen = 0;
    for (let i = 0; i < queue.length; i++) {
      tick(); seen++;
      for (const id of graph.get(queue[i]) || []) { tick(); degree.set(id, degree.get(id) - 1); if (degree.get(id) === 0) queue.push(id); }
    }
    return seen === degree.size;
  };
  if (!acyclic(edges)) return false;
  const observations = new Map();
  for (const observation of world.ofType(family + '.observation')) {
    tick(); const step = get(first(observation, 'step'));
    if (!step || !steps.has(step.id) || str(first(observation, 'invocation')) !== str(first(step, 'invocation'))) return false;
    observations.set(observation.id, observation);
  }
  for (const reply of world.ofType(family + '.reply')) {
    tick(); const request = get(first(reply, 'request'));
    for (const ref of reply.attrs.step || []) {
      tick(); const step = get(ref);
      if (!request || !step || get(first(step, 'request'))?.id !== request.id) return false;
    }
  }
  for (const undo of world.ofType(family + '.undo')) {
    tick(); const target = get(first(undo, 'target')), execution = get(first(undo, 'execution'));
    if (!target || !execution || target.id === execution.id) return false;
    for (const ref of undo.attrs.observation || []) {
      tick(); const observation = get(ref);
      if (!observation || !observations.has(observation.id) || get(first(observation, 'step'))?.id !== execution.id) return false;
    }
  }
  const replacements = new Map();
  for (const correction of world.ofType(family + '.correction')) {
    tick(); const target = get(first(correction, 'target')), replacement = get(first(correction, 'replacement'));
    if (!target || !replacement || target.id === replacement.id || replacements.has(target.id)) return false;
    replacements.set(target.id, [replacement.id]);
  }
  return acyclic(replacements);
}
