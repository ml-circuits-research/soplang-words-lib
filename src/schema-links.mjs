// Schema annotations resolve against the final transactional world, never the
// compilation-time snapshot (which may precede forward-declared facts).
import { fitsKind } from './matrix.mjs';
export function schemaLinks(world, tick = () => {}) {
  const c = world._compiled(), links = [], violations = [];
  if (!c.schemaLinks.length) return { ok: true, links, violations };
  const groups = new Map();
  for (const d of c.schemaLinks) {
    const key = `${d.on}\0${d.key}`;
    (groups.get(key) || groups.set(key, []).get(key)).push(d);
  }
  for (const wire of world.matrix.values()) for (const defs of groups.values()) {
    tick();
    const { on, key } = defs[0];
    if (wire.type !== on || !wire.attrs[key]) continue;
    const values = wire.attrs[key];
    const fail = (why) => violations.push({ kind: 'schema-link', id: wire.id, key, why });
    if (values.length !== 1) { fail('schema link must have exactly one value'); continue; }
    const value = values[0], targets = new Map();
    if (value.startsWith('$')) {
      const target = world.get(value.slice(1));
      if (target && defs.some(d => c.isA(target.type, d.target))) targets.set(target.id, target);
    } else if (fitsKind('atom', value) && !value.startsWith('?')) {
      for (const d of defs) for (const target of world.ofType(d.target)) {
        tick();
        if (target.attrs[d.by]?.includes(value)) targets.set(target.id, target);
      }
    } else { fail('schema link must be a declaration reference or an unquoted public name'); continue; }
    if (targets.size !== 1) { fail(targets.size ? 'schema link name is ambiguous; use an explicit reference' : 'schema link target is missing or has the wrong type'); continue; }
    links.push({ id: wire.id, key, value, target: targets.keys().next().value });
  }
  return { ok: violations.length === 0, links, violations };
}
