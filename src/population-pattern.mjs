// Several calls from one request whose reference names several observed objects: the pairs of a declared pattern
// over a population, in a declared order. A line "between the circles" is one call per pair of the pattern; nothing
// here names a kind, a word or an application.
//
// Patterns (graph shapes over the ordered members):
//  chain  consecutive members (a path);
//  cycle  consecutive members and the last back to the first;
//  all    every unordered pair (a complete graph);
//  star   every member with one hub (the hub at the end the request said it at).
export const POPULATION_PATTERNS = Object.freeze(['chain', 'cycle', 'all', 'star']);

/**
 * Reading order of observed objects with a centre and a height ({x, y, height}, missing numbers allowed): rows top to
 * bottom (a row is within half the taller height), then left to right, then by id.
 */
export function readingOrder(objects, place = (o) => o) {
  const at = (o) => { const p = place(o) ?? {}; return { x: Number(p.x), y: Number(p.y), h: Number(p.height) || 0 }; };
  return [...objects].sort((a, b) => {
    const p = at(a), q = at(b), band = Math.max(p.h, q.h, 1) / 2;
    if (Number.isFinite(p.y) && Number.isFinite(q.y) && Math.abs(p.y - q.y) > band) return p.y - q.y;
    return (p.x || 0) - (q.x || 0) || String(a.id).localeCompare(String(b.id));
  });
}

/**
 * The pairs of ids a pattern makes over ordered members ({id}). For `star`, `hub` is the hub's id and `hubFirst` whether
 * the hub is the first end of each pair. Returns null for an unknown pattern, a star without a hub, or more than `max` pairs.
 */
export function populationPairs(members, pattern, { hub, hubFirst = false, max = Infinity, tick = () => {} } = {}) {
  const ids = members.map((m) => m.id), pairs = [];
  if (pattern === 'chain' || pattern === 'cycle') {
    for (let i = 1; i < ids.length; i++) { tick(); pairs.push([ids[i - 1], ids[i]]); }
    if (pattern === 'cycle' && ids.length > 1) pairs.push([ids.at(-1), ids[0]]);
  } else if (pattern === 'all') {
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { tick(); pairs.push([ids[i], ids[j]]); }
  } else if (pattern === 'star') {
    if (hub === undefined) return null;
    for (const id of ids) { if (id === hub) continue; tick(); pairs.push(hubFirst ? [hub, id] : [id, hub]); }
  } else return null;
  return pairs.length > max ? null : pairs;
}
