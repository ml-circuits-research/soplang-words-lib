import { str } from './parser.mjs';

// Publication captures meaning; it does not bind a mutable native slot to it.
export function retainPointSpace(world, id, options = {}) {
  return world._guard(options, () => {
    const tick = () => world._b.tick('validate');
    const family = options.family || 'w.legend', c = world._compiled();
    const fail = why => ({ ok: false, created: false, violations: [{ kind: 'point-space', id: String(id), why }] });
    const first = (wire, key) => wire?.attrs[key]?.[0];
    const get = ref => typeof ref === 'string' && ref.startsWith('$') ? world.get(ref.slice(1)) : null;
    const space = world.get(String(id).replace(/^\$/, ''));
    if (!space || !c.isA(space.type, family + '.space') || !world.schema(family + '.space')?.closed || !world.schema(family + '.frame')?.closed) return fail('legend space and root frame contracts must be loaded');
    const checked = world.check();
    if (!checked.ok) return { ok: false, created: false, violations: checked.violations || checked.issues };
    if (first(space, 'form') !== 'axes') return fail('point publication requires an axes space');
    const frame = get(first(space, 'frame'));
    if (!frame || !c.isA(frame.type, family + '.frame')) return fail('point publication requires an explicit root frame');
    const revision = str(first(space, 'version')), frameVersion = str(first(frame, 'version'));
    if (!revision || !frameVersion) return fail('space and frame revisions must be nonempty');
    const axes = [], units = new Map();
    for (const wire of world.wires.values()) {
      tick();
      if (c.isA(wire.type, family + '.axis') && first(wire, 'of') === '$' + space.id) axes.push(wire);
      if (c.isA(wire.type, family + '.unit')) {
        const owner = first(wire, 'of');
        if (!units.has(owner)) units.set(owner, []);
        units.get(owner).push(wire);
      }
    }
    if (!axes.length) return fail('point publication requires at least one axis');
    axes.sort((a, b) => { tick(); return Number(first(a, 'order')) - Number(first(b, 'order')); });
    const captured = axes.map(axis => {
      tick();
      const entry = { id: axis.id, name: str(first(axis, 'name')), order: Number(first(axis, 'order')), kind: first(axis, 'kind'), unit: get(first(axis, 'unit')).id };
      for (const key of ['min', 'max', 'weight', 'normalisation', 'period', 'step']) {
        tick(); const token = first(axis, key); if (token !== undefined) entry[key] = Number(token);
      }
      if (first(axis, 'scale') !== undefined) entry.scale = first(axis, 'scale');
      const alternatives = units.get('$' + axis.id) || [];
      alternatives.sort((a, b) => { tick(); return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
      entry.units = alternatives.map(unit => {
        tick(); return { id: unit.id, name: str(first(unit, 'name')), factor: Number(first(unit, 'factor')), offset: Number(first(unit, 'offset')) };
      });
      return entry;
    });
    return world.retainRevision('point.space:' + space.id, revision, {
      format: 'sop.point.space', schemaVersion: 1,
      space: { id: space.id, name: str(first(space, 'name')), version: revision },
      frame: { id: frame.id, name: str(first(frame, 'name')), version: frameVersion },
      axes: captured,
    }, { dry: options.dry });
  }, issue => ({ ok: false, created: false, violations: [issue] }));
}
