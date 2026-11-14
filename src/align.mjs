// Transfer by analogy between worlds (abstraction round item 5, Q54): two world schemas aligned by
// structure. A type's signature is its slots (a reference or a kind, many, required, a closed set);
// types are paired by the share of their slots that match, slots inside a pair by signature, and a
// pairing whose references map to paired types scores more (structure, not names). What one world
// has and the aligned slot of the other lacks (a default, a closed set of choices, required) is
// OFFERED with the map, never told: the host measures it before taking it.

const sigOf = (s) => [s.refs?.length ? 'ref' : (s.kinds || []).slice().sort().join('|') || 'atom', s.many ? 'many' : 'one', s.enum ? 'enum' : ''].join('/');

function slotsOf(world) {
  const c = world._compiled(), own = c.slots.own;
  const out = {};
  for (const [type] of c.types) if (!type.startsWith('core.') && !type.startsWith('std.')) out[type] = [...(own.get(type)?.values() || [])];
  return out;
}

function pairSlots(sa, sb) { // greedy by signature, then by shared reference
  const map = {}, used = new Set();
  for (const x of sa) { const y = sb.find((z) => !used.has(z.key) && sigOf(z) === sigOf(x)); if (y) { map[x.key] = y.key; used.add(y.key); } }
  return map;
}

/**
 * The alignment of world `a` to world `b`: { map: { typeA: typeB }, slots: { typeA: { keyA: keyB } },
 * score, offers: [{ to: { type, key }, what, value, from: { type, key } }] }. Options: `min` (the
 * least share of matched slots for a pair, default 0.5).
 */
export function alignWorlds(a, b, { min = 0.5 } = {}) {
  const A = slotsOf(a), B = slotsOf(b);
  const pairs = [];
  for (const [ta, sa] of Object.entries(A)) for (const [tb, sb] of Object.entries(B)) {
    if (!sa.length || !sb.length) continue;
    const m = pairSlots(sa, sb), share = Object.keys(m).length / Math.max(sa.length, sb.length);
    if (share >= min) pairs.push({ ta, tb, m, share });
  }
  const map = {}, slots = {}, taken = new Set();
  // references must agree: a pair whose ref slots point to types that pair as well is worth more
  const refScore = (p) => p.m && Object.entries(p.m).filter(([ka, kb]) => { const x = A[p.ta].find((s) => s.key === ka), y = B[p.tb].find((s) => s.key === kb); return x.refs?.length && y.refs?.length && pairs.some((q) => x.refs.includes(q.ta) && y.refs.includes(q.tb)); }).length;
  for (const p of pairs.sort((x, y) => y.share + 0.25 * refScore(y) - (x.share + 0.25 * refScore(x)) || x.ta.localeCompare(y.ta))) {
    if (map[p.ta] || taken.has(p.tb)) continue;
    map[p.ta] = p.tb; slots[p.ta] = p.m; taken.add(p.tb);
  }
  const offers = [];
  for (const [ta, tb] of Object.entries(map)) for (const [ka, kb] of Object.entries(slots[ta])) {
    const x = A[ta].find((s) => s.key === ka), y = B[tb].find((s) => s.key === kb);
    const xd = x.attrs?.default?.[0], yd = y.attrs?.default?.[0];
    if (xd !== undefined && yd === undefined) offers.push({ to: { type: tb, key: kb }, what: 'default', value: xd, from: { type: ta, key: ka } });
    if (x.enum && !y.enum) offers.push({ to: { type: tb, key: kb }, what: 'choices', value: x.enum, from: { type: ta, key: ka } });
    if (x.required && !y.required) offers.push({ to: { type: tb, key: kb }, what: 'required', value: true, from: { type: ta, key: ka } });
  }
  const score = +(Object.keys(map).length / Math.max(1, Object.keys(A).length)).toFixed(3);
  return { map, slots, score, offers };
}
