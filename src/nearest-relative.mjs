// The closest acceptable relative of a name in a taxonomy of weighted traits: what stands in for a kind the
// application cannot realise itself (a kind with no drawing drawn as its closest drawable relative). The caller reads
// the taxonomy rows; this ranks them. Nothing here names a taxonomy, a dimension or an application.
//
// own       [{key, parent, dimension}] the name's own traits (key tells apart traits of one parent by their qualifiers).
// members   Map key -> Set of the other names that have that trait.
// seen      how many names the rows read held (specificity of a trait: ln(seen / members with it)).
// near      dimensions along which a parent itself may stand in (the name is one), the most specific first.
// weights   dimension -> weight of a shared trait of that dimension (absent 0).
// accept    async name -> boolean: whether the application can realise that name.
// limit     how many ranked names are tried at most (default 64).

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The closest acceptable relative: first an acceptable parent along a near dimension, the most specific first; else the
 * acceptable name sharing the most traits, each shared trait counting its dimension's weight times its specificity,
 * ties by name. Returns {name, via: 'parent'|'shared', score?} or null.
 */
export async function nearestRelative({ own = [], members = new Map(), seen = 0, near = [], weights = {}, accept, limit = 64 } = {}) {
  if (!own.length || typeof accept !== 'function') return null;
  const nearSet = new Set(near);
  const specificity = (key) => Math.log(Math.max(seen, 2) / Math.max(members.get(key)?.size ?? 0, 1));
  const parents = own.filter(({ dimension }) => nearSet.has(dimension)).sort((a, b) => specificity(b.key) - specificity(a.key) || byName(a.parent, b.parent));
  for (const { parent } of parents) if (await accept(parent)) return { name: parent, via: 'parent' };
  const dimensionOf = new Map(own.map(({ key, dimension }) => [key, dimension]));
  const score = new Map();
  for (const [key, set] of members) {
    const w = Number(weights[dimensionOf.get(key)] ?? 0) * specificity(key);
    if (w > 0) for (const member of set) score.set(member, (score.get(member) ?? 0) + w);
  }
  const ranked = [...score].sort((a, b) => b[1] - a[1] || byName(a[0], b[0]));
  let checked = 0;
  for (const [name, value] of ranked) { if (++checked > limit) break; if (await accept(name)) return { name, via: 'shared', score: value }; }
  return null;
}
