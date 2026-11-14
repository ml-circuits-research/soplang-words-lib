// Cousins of a case (abstraction round item 0, owner 14:58): a case is never single. Go up k levels
// of abstraction along a dimension (a filler to its kind and the kind's parent; a key to the keys of
// its holder's kind), then down k levels to other members, and keep the ones that are valid: legal
// in the world (the new frame has an answer), read back to the same frame where a wording was made,
// and not a case already known. Degree 1 = siblings (same kind), 2 = first cousins (the kinds share
// a parent), and so on.

import { readByTypes } from './readtypes.mjs';

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const UP = ['kind', 'class', 'is', 'is_a'];

/** The chain of kinds of a thing, nearest first: [[level 1 kinds], [level 2], ...] (bounded by depth). */
export function kindChain(world, id, depth = 4) {
  const w = world.get(id);
  if (!w) return [];
  const named = (n) => [...world.wires.values()].filter((x) => (x.attrs.name || []).some((y) => bare(y) === n));
  const parents = (names) => [...new Set(names.flatMap((n) => named(n).flatMap((x) => UP.flatMap((k) => (x.attrs[k] || []).map(bare)))))];
  const first = [...new Set(UP.flatMap((k) => (w.attrs[k] || []).map(bare)))];
  const levels = [first.length ? first : [w.type]];
  for (let d = 1; d < depth; d++) { const up = parents(levels[d - 1]).filter((p) => !levels.flat().includes(p)); if (!up.length) break; levels.push(up); } // bounded: depth
  if (first.length && !levels.flat().includes(w.type)) levels.push([w.type]); // the type is the widest kind
  return levels;
}

/**
 * The cousins of a case `{ frame, text? }` (a frame of readByTypes: ask / find / act). Options:
 * `degree` (the highest, default 2), `dims` (['filler', 'key']), `known` (frames or texts already
 * cases), `read` (options for readByTypes), `n` (at most, per degree), `seed`.
 * Returns [{ frame, text?, degree, dims, valid, why? }], valid ones first.
 */
export function cousins(world, kase, { degree = 2, dims = ['filler', 'key'], known = [], read = {}, n = 50, seed = 1 } = {}) {
  const f = kase.frame, out = [];
  const knownSet = new Set(known.map((k) => (typeof k === 'string' ? k : JSON.stringify(k))));
  const answerOf = (holderId, key) => (world.get(holderId)?.attrs[key] || []).map(bare);
  const nameOf = (id) => bare(world.get(id)?.attrs.name?.[0] ?? id);
  const holderId = f.of?.id;
  if (dims.includes('filler') && holderId) {
    const chain = kindChain(world, holderId, degree + 1);
    const things = [...world.wires.values()].filter((x) => !x.type.startsWith('core.') && x.attrs.name && x.id !== holderId);
    for (const t of things) {
      // the degree: the first level at which the two chains meet
      const other = kindChain(world, t.id, degree + 1);
      let d = 0; // up i levels from the case and j from the other to a kind they share: degree max(i, j)
      for (let i = 0; i < chain.length; i++) for (let j = 0; j < other.length; j++) if (other[j].some((x) => chain[i].includes(x))) { const m = Math.max(i, j) + 1; if (!d || m < d) d = m; }
      if (!d || d > degree) continue;
      const frame = { ...f, of: { id: t.id }, answer: answerOf(t.id, f.key) };
      const c = { frame, degree: d, dims: ['filler'] };
      if (kase.text) c.text = kase.text.replace(new RegExp(`\\b${nameOf(holderId)}(s?)\\b`, 'i'), `${nameOf(t.id)}$1`);
      out.push(c);
    }
  }
  if (dims.includes('key') && f.key && holderId) {
    const h = world.get(holderId);
    for (const k of Object.keys(h.attrs).filter((x) => !x.startsWith('core.') && !['name', ...UP, 'about'].includes(x) && x !== f.key)) {
      const frame = { ...f, key: k, answer: answerOf(holderId, k) };
      const c = { frame, degree: 1, dims: ['key'] };
      if (kase.text) c.text = kase.text.replace(new RegExp(`\\b${f.key}(s?)\\b`, 'i'), `${k}$1`);
      out.push(c);
    }
  }
  for (const c of out) { // valid: legal (an answer), read back to the same frame, not known
    if (!c.frame.answer?.length) { c.valid = false; c.why = 'no answer in the world'; continue; }
    if (knownSet.has(JSON.stringify(c.frame)) || (c.text && knownSet.has(c.text))) { c.valid = false; c.why = 'already a case'; continue; }
    if (c.text) {
      if (c.text === kase.text) { c.valid = false; c.why = 'the wording did not change'; continue; }
      const back = readByTypes(world, c.text, read).best;
      if (JSON.stringify(back) !== JSON.stringify(c.frame)) { c.valid = false; c.why = `reads back as ${JSON.stringify(back)}`; continue; }
    }
    c.valid = true;
  }
  let x = seed >>> 0; const rnd = () => { x = (x * 1103515245 + 12345) >>> 0; return x / 4294967296; };
  const byDeg = new Map();
  for (const c of out.map((c) => [c, rnd()]).sort((a, b) => Number(b[0].valid) - Number(a[0].valid) || a[0].degree - b[0].degree || a[1] - b[1]).map(([c]) => c)) {
    const k = `${c.degree}`; const list = byDeg.get(k) || byDeg.set(k, []).get(k); if (list.length < n) list.push(c);
  }
  return [...byDeg.values()].flat().sort((a, b) => Number(b.valid) - Number(a.valid) || a.degree - b.degree);
}

/**
 * A fix judged both ways (owner 14:58): on the case alone and on its valid cousins by degree.
 * `answer(text, frame) -> answer` is the system with the fix; a cousin passes when its answer
 * equals the cousin's. Returns { case: bool, byDegree: { d: { pass, of } }, share }.
 */
export function judgeFix(answer, kase, list) {
  const same = (a, b) => JSON.stringify([].concat(a ?? [])) === JSON.stringify([].concat(b ?? []));
  const byDegree = {};
  let pass = 0, of = 0;
  for (const c of list.filter((x) => x.valid)) {
    const ok = same(answer(c.text, c.frame), c.frame.answer);
    const d = (byDegree[c.degree] ||= { pass: 0, of: 0 }); d.of++; of++;
    if (ok) { d.pass++; pass++; }
  }
  return { case: same(answer(kase.text, kase.frame), kase.frame.answer), byDegree, share: of ? +(pass / of).toFixed(3) : null };
}
