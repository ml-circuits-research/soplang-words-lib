// Related cases of a case (abstraction round item 0, owner 14:58): a case is never single. In the
// testing literature these are perturbations along named axes (metamorphic testing; CheckList,
// Ribeiro et al. 2020; contrast sets, Gardner et al. 2020). Here a related case is made from the
// world: go up d levels of abstraction along an axis (a filler to its kind and the kind's parent; a
// key to the keys of its holder's kind), then down d levels to other members, and keep the ones that
// are valid: legal in the world (the new frame has an answer), read back to the same frame where a
// wording was made, and not a case already known. Distance 1 = the same kind, 2 = kinds that share a
// parent, and so on. docs/generalisation.md has the picture and the literature.

import { readByTypes, nearWords } from './readtypes.mjs';
import { realiseFrame, paraphrasesOf } from './say.mjs';
import { seeded } from './random.mjs';
import { memoPerWorld } from './memo.mjs';
import { valueText } from './parser.mjs';

const bare = (v) => valueText(v).replace(/^\$/, '');
const UP = ['kind', 'class', 'is', 'is_a'];
function namedIn(world) { // one pass over the wires per change of the world, not one per thing
  const by = memoPerWorld(world, 'namedIn', () => {
    const m = new Map();
    for (const x of world.wires.values()) for (const n of x.attrs.name || []) { const k = bare(n); (m.get(k) || m.set(k, []).get(k)).push(x); }
    return m;
  });
  return (n) => by.get(n) || [];
}

/** The chain of kinds of a thing, nearest first: [[level 1 kinds], [level 2], ...] (bounded by depth). */
export function kindChain(world, id, depth = 4) {
  const w = world.get(id);
  if (!w) return [];
  const named = namedIn(world);
  const parents = (names) => [...new Set(names.flatMap((n) => named(n).flatMap((x) => UP.flatMap((k) => (x.attrs[k] || []).map(bare)))))];
  const first = [...new Set(UP.flatMap((k) => (w.attrs[k] || []).map(bare)))];
  const levels = [first.length ? first : [w.type]];
  for (let d = 1; d < depth; d++) { const up = parents(levels[d - 1]).filter((p) => !levels.flat().includes(p)); if (!up.length) break; levels.push(up); } // bounded: depth
  if (first.length && !levels.flat().includes(w.type)) levels.push([w.type]); // the type is the widest kind
  return levels;
}

/**
 * The ancestors of a thing in the layered graph of abstraction (owner 15:03: several parents on
 * several dimensions): Map(name -> { level, dim }), breadth first, up to `depth` layers. The
 * edges are the keys of `edges` ({ key: dimension }; by default kind / class / is / is_a are
 * the dimension `kind`) on the thing's fact and on the facts named by its parents; a node with
 * no parent goes up to its fact's type (dimension `type`). `dim` is the dimension of the first
 * step from the thing.
 */
export function ancestorsOf(world, id, { depth = 3, edges } = {}) {
  const E = edges ?? { kind: 'kind', class: 'kind', is: 'kind', is_a: 'kind' };
  const named = namedIn(world);
  const w = world.get(id);
  const out = new Map();
  if (!w) return out;
  const up = (facts) => facts.flatMap((f) => Object.entries(E).flatMap(([k, dim]) => (f.attrs[k] || []).map((v) => ({ p: bare(v), dim }))));
  let front = up([w]).map((e) => ({ ...e, from: e.dim }));
  if (!front.length) front = [{ p: w.type, dim: 'type', from: 'type' }];
  for (let level = 1; level <= depth && front.length; level++) { // bounded: depth layers
    const next = [];
    for (const { p, from } of front) {
      if (out.has(p)) continue;
      out.set(p, { level, dim: from });
      const facts = named(p);
      const ps = up(facts);
      if (ps.length) next.push(...ps.map((e) => ({ p: e.p, from })));
      else if (facts.length && !out.has(facts[0].type)) next.push({ p: facts[0].type, from });
    }
    front = next;
  }
  if (![...out.keys()].includes(w.type)) out.set(w.type, { level: Math.max(0, ...[...out.values()].map((x) => x.level)) + 1, dim: 'type' });
  return out;
}

/**
 * The related cases of a case `{ frame, text? }` (a frame of readByTypes: ask / find / act). Options:
 * `distance` (the highest, default 2), `axes` (['filler', 'key', 'wording']), `known` (frames or texts already
 * cases), `read` (options for readByTypes), `n` (at most, per distance), `seed`.
 * A case with `langFrame` (the language world's frame it was said in) and `roles` also gets the
 * rewordings the language world declares (`w.lang.en.variant`), each realised by realiseFrame with
 * those roles, as `variant:<alternation>` related cases.
 * Returns [{ frame, text?, distance, axes, valid, why? }], valid ones first.
 */
export function relatedCases(world, kase, { distance = 2, axes = ['filler', 'key', 'wording'], known = [], read = {}, n = 50, seed = 1, edges, alternations, operators, senses, variants, lang = 'w.lang.en' } = {}) {
  const f = kase.frame, out = [];
  const knownSet = new Set(known.map((k) => (typeof k === 'string' ? k : JSON.stringify(k))));
  const answerOf = (holderId, key) => (world.get(holderId)?.attrs[key] || []).map(bare);
  const nameOf = (id) => bare(world.get(id)?.attrs.name?.[0] ?? id);
  const holderId = f.of?.id;
  if (axes.includes('filler') && holderId) {
    const mine = ancestorsOf(world, holderId, { depth: distance + 1, edges });
    const seen = new Set();
    const things = [...world.wires.values()].filter((x) => !x.type.startsWith('core.') && x.attrs.name && x.id !== holderId);
    for (const t of things) { // bounded: the things, each once
      const theirs = ancestorsOf(world, t.id, { depth: distance + 1, edges });
      let best = null; // the nearest shared ancestor: distance max(up from the case, up from the other)
      for (const [a, x] of mine) { const y = theirs.get(a); if (!y) continue; const d = Math.max(x.level, y.level); if (!best || d < best.d) best = { d, dim: x.dim, via: a }; }
      if (!best || best.d > distance) continue;
      const frame = { ...f, of: { id: t.id }, answer: answerOf(t.id, f.key) };
      const k = JSON.stringify(frame); if (seen.has(k)) continue; seen.add(k); // deduplicated by frame
      const c = { frame, distance: best.d, axes: [best.dim], via: best.via };
      if (kase.text) c.text = kase.text.replace(new RegExp(`\\b${nameOf(holderId)}(s?)\\b`, 'i'), `${nameOf(t.id)}$1`);
      out.push(c);
    }
  }
  if (axes.includes('key') && f.key && holderId) {
    const h = world.get(holderId);
    for (const k of Object.keys(h.attrs).filter((x) => !x.startsWith('core.') && !['name', ...UP, 'about', ...Object.keys(edges ?? {})].includes(x) && x !== f.key)) {
      const frame = { ...f, key: k, answer: answerOf(holderId, k) };
      const c = { frame, distance: 1, axes: ['key'] };
      if (kase.text) c.text = kase.text.replace(new RegExp(`\\b${f.key}(s?)\\b`, 'i'), `${k}$1`);
      out.push(c);
    }
  }
  const forms = [...(alternations || []), ...(operators || [])];
  if (axes.includes('wording') && kase.text && forms.length) { // the same frame in other forms: each operator (alternations, noise, learnt) run backwards, tagged by its name
    const toks = String(kase.text).toLowerCase().replace(/[?!.]+\s*$/, '').match(/[\p{L}\p{N}_'-]+/gu) || [];
    const seen = new Set([toks.join(' ')]);
    for (const r of forms) {
      const env = matchPattern(r.to.split(/\s+/), toks);
      if (!env) continue;
      const text = r.from.split(/\s+/).map((t) => { const m = /^\{([a-z_0-9]+)\}$/.exec(t); if (m) return (env[m[1]] || []).join(' '); const a = /^\[(.*)\]$/.exec(t); return a ? a[1].split('|')[0] : t; }).join(' ');
      if (!text || seen.has(text)) continue;
      seen.add(text);
      out.push({ frame: { ...f }, text, distance: 1, axes: [`form:${r.name}`], via: r.name });
    }
    for (let i = 0; i < toks.length; i++) for (const nw of nearWords(world, toks[i], { senses }).filter((x) => x.cost === 1 && !x.word.includes(' '))) { // lexical: a word for its synonym
      const text = [...toks.slice(0, i), nw.word, ...toks.slice(i + 1)].join(' ');
      if (seen.has(text)) continue; seen.add(text);
      out.push({ frame: { ...f }, text, distance: 1, axes: ['form:synonym'], via: `${toks[i]} → ${nw.word}` });
    }
  }
  if (axes.includes('wording') && kase.langFrame && kase.roles) { // the language world's rewordings of the case's frame (w.lang.en.variant): realised with the case's roles
    const V = variants ?? paraphrasesOf(world, { lang });
    const mine = V.get(kase.langFrame);
    const related = [...V].filter(([, v]) => v.canonical.includes(kase.langFrame)).map(([fr, v]) => [fr, v.alternation])
      .concat((mine?.canonical || []).map((fr) => [fr, mine.alternation]))
      .concat(mine ? [...V].filter(([fr, v]) => fr !== kase.langFrame && v.canonical.some((c) => mine.canonical.includes(c))).map(([fr, v]) => [fr, v.alternation]) : []);
    const seen = new Set([String(kase.text ?? '').toLowerCase()]);
    for (const [fr, alt] of related) {
      const text = realiseFrame(world, fr, kase.roles, { lang });
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      out.push({ frame: { ...f }, text, distance: 1, axes: [`variant:${alt}`], via: fr });
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
  const rnd = seeded(seed);
  const byDist = new Map();
  for (const c of out.map((c) => [c, rnd()]).sort((a, b) => Number(b[0].valid) - Number(a[0].valid) || a[0].distance - b[0].distance || a[1] - b[1]).map(([c]) => c)) {
    const k = `${c.distance}|${c.axes[0]}`; const list = byDist.get(k) || byDist.set(k, []).get(k); if (list.length < n) list.push(c); // stratified per distance and axis
  }
  return [...byDist.values()].flat().sort((a, b) => Number(b.valid) - Number(a.valid) || a.distance - b.distance);
}

/**
 * A fix judged both ways (owner 14:58): on the case alone and on its valid related cases by distance.
 * `answer(text, frame) -> answer` is the system with the fix; a related case passes when its answer
 * equals the world's. Returns { case: bool, byDistance: { d: { pass, of } }, share }.
 */
export function judgeOnRelated(answer, kase, list) {
  const same = (a, b) => JSON.stringify([].concat(a ?? [])) === JSON.stringify([].concat(b ?? []));
  const byDistance = {};
  let pass = 0, of = 0;
  for (const c of list.filter((x) => x.valid)) {
    const ok = same(answer(c.text, c.frame), c.frame.answer);
    const d = (byDistance[c.distance] ||= { pass: 0, of: 0 }); d.of++; of++;
    if (ok) { d.pass++; pass++; }
  }
  return { case: same(answer(kase.text, kase.frame), kase.frame.answer), byDistance, share: of ? +(pass / of).toFixed(3) : null };
}

function matchPattern(pat, toks, i = 0, env = {}, k = 0) { // bounded: the pattern and the tokens
  if (k === pat.length) return i === toks.length ? env : null;
  const sp = /^\{([a-z_0-9]+)(?::base)?\}$/.exec(pat[k]);
  if (sp) { for (let j = i + 1; j <= toks.length; j++) { const r = matchPattern(pat, toks, j, { ...env, [sp[1]]: toks.slice(i, j) }, k + 1); if (r) return r; } return null; }
  const alts = /^\[(.*)\]$/.exec(pat[k]) ? pat[k].slice(1, -1).split('|') : [pat[k]];
  return i < toks.length && alts.includes(toks[i]) ? matchPattern(pat, toks, i + 1, env, k + 1) : null;
}
