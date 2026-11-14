// One per-world cache (architecture review finding 1): a value built from a world is kept until the world
// changes, keyed on `world.version` (new after any change: a tell, a revise, a fill, an undo), never on the
// number of wires, which a change of a value leaves the same.

const caches = new WeakMap();

/** The value `build()` gives for `world` under `key`, built again only when the world's version changed. */
export function memoPerWorld(world, key, build) {
  if (!world || typeof world !== 'object') return build();
  let m = caches.get(world);
  if (!m) caches.set(world, (m = new Map()));
  const v = world.version, hit = m.get(key);
  if (hit && hit.v === v) return hit.value;
  const value = build();
  m.set(key, { v, value });
  return value;
}
