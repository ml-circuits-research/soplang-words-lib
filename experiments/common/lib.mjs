// Shared library access — the experiments are not part of the library.
// They import the library sources exactly like an application would.
import { World, parse } from '../../src/index.mjs';

export { World, parse };

/** One parsed wire: { id, type, attrs: { key: [values...] } }. */
export const wires = (sop) => parse(sop);

/** First value of a key as a string, or undefined. */
export const attr = (w, key) => w.attrs[key]?.[0];

/** First value of a key as a number, or undefined. */
export const num = (w, key) => {
  const v = attr(w, key);
  const n = v === undefined ? undefined : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** All parsed wires of a type. */
export const of = (ws, type) => ws.filter((w) => w.type === type);

/** The intent wires of a packet: root, targets, relations, options. */
export const read = (ws) => {
  const intents = of(ws, 'x.intent');
  const targets = of(ws, 'x.target');
  const rels = of(ws, 'x.rel');
  const options = of(ws, 'x.option');
  return { intents, targets, rels, options };
};

/** Fork a SOP world and tell the elementary output circuit, returning { ok, violations }.
 *  Telling is the honest validation: closed schemas, kinds, enums, number ranges. */
export const applyTo = (worldSop, outputSop) => {
  const w = new World();
  w.load(worldSop);
  return w.tell(outputSop);
};

/** A world's instance facts as { id -> { type, attrs } }. */
export const instanceOf = (worldSop) => {
  const ws = wires(worldSop);
  const objects = new Map();
  for (const w of ws) {
    if (w.type.startsWith('x.') || w.type.startsWith('core.') || w.type.endsWith('.module')) continue;
    objects.set(w.id, { id: w.id, type: w.type, attrs: w.attrs });
  }
  return objects;
};
