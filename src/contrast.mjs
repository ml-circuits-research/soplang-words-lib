// How a kind differs from its siblings (reviewer 09:20 L4; real turns "how is a circle different from other
// shapes", "what makes a square special"): the facts named for the kind are merged; its siblings are the things of
// the same type that share a parent with it (a value of kind / class / is / is_a / kind_of); a key contrasts when
// the kind's value is held by few of the siblings, rarest first. Language-free: the result is data to say.

import { valueText } from './parser.mjs';
import { choose } from './rank.mjs';

const UP = ['kind', 'class', 'is', 'is_a', 'kind_of'];
const SKIP = new Set(['name', 'derived', 'thing', 'named', 'about', 'source', ...UP]);

function merged(world, type, name) {
  const attrs = {};
  for (const f of world.ofType(type)) if (valueText(f.attrs.name?.[0]).toLowerCase() === String(name).toLowerCase()) for (const [k, vs] of Object.entries(f.attrs)) if (!k.startsWith('core.')) attrs[k] = [...new Set([...(attrs[k] || []), ...vs.map(valueText)])];
  return attrs;
}

/**
 * What sets `kind` apart from its siblings: { kind, type, parents, siblings: [names], contrasts: [{ key, value, share,
 * others: { value: count } }] } (share: the part of the siblings that hold the same value; 0 = none) or { why }.
 * Options: `type` (the facts' type; else the type of the first fact named so), `up` (parent keys), `skip` (keys
 * not to compare), `max` (contrasts, 5).
 */
export function contrastOf(world, kind, { type, up = UP, skip = SKIP, max = 5 } = {}) {
  const first = [...world.wires.values()].find((f) => (!type || f.type === type) && !f.type.startsWith('core.') && valueText(f.attrs.name?.[0]).toLowerCase() === String(kind).toLowerCase());
  if (!first) return { why: `nothing is called ${kind}` };
  const T = type ?? first.type, mine = merged(world, T, kind);
  const parents = [...new Set(up.flatMap((k) => mine[k] || []))];
  if (!parents.length) return { why: `${kind} has no kind above it to compare with` };
  const names = [...new Set(world.ofType(T).filter((f) => up.some((k) => (f.attrs[k] || []).some((v) => parents.includes(valueText(v))))).map((f) => valueText(f.attrs.name?.[0])).filter((n) => n && n.toLowerCase() !== String(kind).toLowerCase()))];
  if (!names.length) return { why: `${kind} has no sibling under ${parents.join(', ')}` };
  const sibs = names.map((n) => merged(world, T, n));
  const keys = Object.keys(mine).filter((k) => !skip.has(k) && !k.startsWith('core.'));
  const contrasts = keys.map((key) => {
    const value = mine[key].join(', '), others = {};
    for (const s of sibs) { const v = (s[key] || ['none']).join(', '); others[v] = (others[v] || 0) + 1; }
    return { key, value, share: +((others[value] || 0) / sibs.length).toFixed(2), others };
  }).filter((c) => c.share < 1);
  const ranked = choose(world, 'contrast', contrasts, { seed: null }).order.slice(0, max); // one way to choose (std.decide kind contrast): the rarest first
  return { kind, type: T, parents, siblings: names, contrasts: ranked };
}
