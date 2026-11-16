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
