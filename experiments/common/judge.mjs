// The judge's mechanical layer. It checks only what is beyond opinion:
// the output parses, and a World holding the case's schema + facts accepts it.
// Everything qualitative (is the placement decent? is the action sensible?)
// is judged by an agent that sees the compact before/after state and the rubric.
import { World, parse, applyTo, instanceOf, wires, attr, num } from './lib.mjs';
import { COMMON_INTENT } from './corpus.mjs';

/** Compact, human-readable snapshot of a world's state, by family. */
export const compact = (caseDef, outputSop) => {
  const objects = instanceOf(caseDef.world);
  const before = compactOf(caseDef.family, objects, [], [], []);
  let after = before, sets = [], puts = [];
  if (outputSop) {
    const ws = wires(outputSop);
    const created = ws.filter((w) => w.type === 'draw.thing' || w.type === 'cal.event');
    sets = ws.filter((w) => w.type === 'x.set').map((w) => ({ object: attr(w, 'object'), key: attr(w, 'key'), value: attr(w, 'value') }));
    puts = ws.filter((w) => w.type === 'store.put').map((w) => ({ item: attr(w, 'item'), shelf: attr(w, 'shelf') }));
    const merged = new Map(objects);
    for (const w of created) merged.set(w.id, { type: w.type, attrs: w.attrs });
    for (const s of sets) {
      const t = merged.get(s.object);
      if (t) t.attrs = { ...t.attrs, [s.key]: [s.value] };
    }
    after = compactOf(caseDef.family, merged, created.map((w) => w.id), sets, puts);
  }
  return { before, after, created: [...(outputSop ? wires(outputSop).map((w) => w.id + ':' + w.type) : [])], sets, puts };
};

const compactOf = (family, objects, createdIds, sets, puts) => {
  if (family === 'draw') {
    const things = [...objects.values()].filter((t) => t.type === 'draw.thing');
    return things.map((t) => ({ id: t.id || t.attrs.name?.[0], kind: t.attrs.kind?.[0], x: num(t, 'x'), y: num(t, 'y'), w: num(t, 'w'), h: num(t, 'h'), colour: t.attrs.colour?.[0] }));
  }
  if (family === 'cal') {
    const events = [...objects.values()].filter((t) => t.type === 'cal.event');
    const events2 = events.map((t) => ({ title: t.attrs.title?.[0], start: num(t, 'start'), end: num(t, 'end'), person: t.attrs.person?.[0] }));
    return events2.sort((a, b) => a.start - b.start);
  }
  if (family === 'store') {
    const items = [...objects.values()].filter((t) => t.type === 'store.item');
    return puts.length ? puts : items.map((t) => ({ item: t.attrs.name?.[0], size: num(t, 'size'), shelf: 'unassigned' }));
  }
  return [...objects.values()];
};

/** Mechanical validity: parse + a fresh World accepts the elementary wires. */
export const mechanical = (caseDef, outputSop) => {
  try {
    parse(outputSop);
  } catch (e) {
    return { tellOk: false, reason: 'parse: ' + String(e.message).split('\n')[0] };
  }
  const told = applyTo(COMMON_INTENT + caseDef.world, outputSop);
  return {
    tellOk: !!told.ok,
    reason: told.ok ? undefined : told.violations?.map((v) => v.kind + (v.key ? ':' + v.key : '')).slice(0, 4).join(', ') || 'refused',
    violations: told.ok ? [] : (told.violations ?? []).slice(0, 6),
  };
};

/** Everything the agent judge should see for one case. */
export const judged = (caseDef, outputSop) => {
  const c = compact(caseDef, outputSop);
  return {
    case: caseDef.id,
    family: caseDef.family,
    intent: wires(caseDef.intent).map((w) => '@' + w.id + ' ' + w.type + ' ' + Object.entries(w.attrs).map(([k, v]) => k + '=' + v[0]).join(' ')).join('\n'),
    rubric: caseDef.criteria,
    before: c.before,
    output: outputSop?.trim(),
    after: c.after,
  };
};
