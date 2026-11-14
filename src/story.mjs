// std.compose, story plans (reviewer 20:05 item 1): the elements of a story as choice points solved
// jointly (solveChoices) under the constraints of the knowledge repository's k.story, read as facts.
// Each element is a variable; its domain is the names of the facts of the types it is filled from
// (`fills`); each hard constraint (`element relation other`) prunes, each soft one weights the draw.
// The meaning of a relation over the catalog's facts is a table (STORY_RELATIONS): the one part of
// this module that knows the catalog's shapes (k.actions who / object / tool, k.people holds / uses /
// works_at, k.scenes has, k.story.goal and k.story.obstacle). A host may replace or add relations.

import { solveChoices } from './plan.mjs';

const tok = (v) => String(v).replace(/^"|"$/g, '');
const vals = (w, k) => (w.attrs[k] || []).map(tok);
const one = (w, k) => vals(w, k)[0];

/** The facts a story plan reads, from a world holding k.story and the catalog worlds it names. */
export function readStory(world) {
  const of = (t) => world.ofType(t);
  const goals = of('k.story.goal').map((w) => ({ name: one(w, 'name'), act: one(w, 'act'), target: one(w, 'target'), place_kind: one(w, 'place_kind') }));
  const obstacles = of('k.story.obstacle').map((w) => ({ id: `${one(w, 'thing')}|${one(w, 'blocks')}`, thing: one(w, 'thing'), blocks: one(w, 'blocks'), overcome_by: vals(w, 'overcome_by'), means: vals(w, 'means'), tried_by: vals(w, 'tried_by') }));
  const elements = of('k.story.element').map((w) => ({ name: one(w, 'name'), n: Number(one(w, 'n')), min: Number(one(w, 'min')), max: Number(one(w, 'max')), part: one(w, 'part'), move: one(w, 'move'), fills: vals(w, 'fills') })).sort((a, b) => a.n - b.n);
  const constraints = of('k.story.constraint').map((w) => ({ name: one(w, 'name'), element: one(w, 'element'), relation: one(w, 'relation'), other: one(w, 'other'), strength: one(w, 'strength') }));
  const scenes = new Map(of('k.scenes.scene').map((w) => [one(w, 'name'), one(w, 'kind')]));
  const has = new Map();
  for (const w of of('k.scenes.has')) { const s = one(w, 'scene'); (has.get(s) || has.set(s, new Set()).get(s)).add(one(w, 'thing')); }
  const actions = new Map(of('k.actions.action').map((w) => [one(w, 'name'), { who: vals(w, 'who'), object: vals(w, 'object'), tool: vals(w, 'tool') }]));
  const chars = new Map();
  for (const w of of('k.people.role')) if (w.attrs.group) chars.set(one(w, 'name'), { type: 'k.people.role', up: [...vals(w, 'is'), ...vals(w, 'is_a')], holds: vals(w, 'holds'), uses: vals(w, 'uses'), works_at: vals(w, 'works_at') });
  for (const w of of('k.people.kind')) chars.set(one(w, 'name'), { type: 'k.people.kind', up: vals(w, 'is_a'), holds: [], uses: [], works_at: [] });
  for (const w of of('k.animals.animal')) chars.set(one(w, 'name'), { type: 'k.animals.animal', up: [one(w, 'class'), 'animal'].filter(Boolean), holds: [], uses: [], works_at: [] });
  const objects = new Set(of('k.objects.object').map((w) => one(w, 'name')));
  const kb = { goals, obstacles, elements, constraints, scenes, has, actions, chars, objects, chains: new Map() };
  kb.domains = {}; // the names each element is filled from
  for (const e of elements) {
    const d = new Set();
    for (const t of e.fills) {
      if (t === 'k.story.goal') goals.forEach((g) => d.add(g.name)); else if (t === 'k.story.obstacle') obstacles.forEach((o) => d.add(o.id));
      else if (t === 'k.scenes.scene') scenes.forEach((_, n) => d.add(n)); else if (t === 'k.objects.object') objects.forEach((n) => d.add(n));
      else if (t === 'k.actions.action') actions.forEach((_, n) => d.add(n)); else chars.forEach((c, n) => { if (c.type === t) d.add(n); });
    }
    kb.domains[e.name] = [...d];
  }
  return kb;
}

function chainOf(kb, name) { // the character and its kinds up through is / is_a
  if (kb.chains.has(name)) return kb.chains.get(name);
  const out = new Set([name]), todo = [...(kb.chars.get(name)?.up || [])];
  while (todo.length) { const n = todo.pop(); if (out.has(n)) continue; out.add(n); todo.push(...(kb.chars.get(n)?.up || [])); } // bounded: each name once
  kb.chains.set(name, out);
  return out;
}
const actOf = (kb, el, v) => (el === 'goal' || el === 'ending' ? kb.goals.find((g) => g.name === v)?.act : v);
const canDo = (kb, who, act) => { const a = kb.actions.get(act); if (!a) return false; const c = chainOf(kb, who); return a.who.some((w) => c.has(w)); };
const hasThing = (kb, who, t) => { const c = kb.chars.get(who); return !!c && (c.holds.includes(t) || c.uses.includes(t)); };
const obstacle = (kb, id) => kb.obstacles.find((o) => o.id === id);
const isBeing = (kb, n) => kb.chars.has(n);

/**
 * What each relation of k.story means over the facts: (kb, a, b, plan) -> boolean, where a is the
 * value of the constraint's element and b of its other element (plan: the whole partial plan).
 */
export const STORY_RELATIONS = {
  can: (kb, a, b, p, { other }) => canDo(kb, a, actOf(kb, other, b)),
  fits: (kb, a, b) => { const g = kb.goals.find((x) => x.name === b); if (!g) return false; return g.target === 'place' ? kb.scenes.get(a) === g.place_kind : kb.actions.get(g.act)?.object.includes(a) && (g.target === 'thing' ? kb.objects.has(a) : isBeing(kb, a)); },
  differs: (kb, a, b) => a !== b,
  blocks: (kb, a, b) => obstacle(kb, a)?.blocks === b,
  in: (kb, a, b) => kb.has.get(b)?.has(obstacle(kb, a)?.thing ?? a) ?? false,
  overcomes: (kb, a, b) => obstacle(kb, b)?.means.includes(a) ?? false,
  lacks: (kb, a, b) => !hasThing(kb, a, b),
  has: (kb, a, b) => kb.chars.get(a)?.type === 'k.people.role' && hasThing(kb, a, b),
  fails: (kb, a, b) => { const o = obstacle(kb, b); return !!o && o.tried_by.includes(a) && !o.overcome_by.includes(a); },
  uses: (kb, a, b, p) => !!kb.actions.get(a)?.tool.includes(b) && (p.obstacle === undefined || obstacle(kb, p.obstacle)?.overcome_by.includes(a)),
  gives: (kb, a) => a === 'give' && kb.actions.has('give'),
  before: (kb, a, b, p, { element, other }) => { const n = (e) => kb.elements.find((x) => x.name === e)?.n ?? 0; return n(element) < n(other); },
  reaches: (kb, a, b) => a === b,
  belongs: (kb, a, b) => (kb.chars.get(a)?.works_at.includes(b) ?? false) || (kb.has.get(b)?.has(a) ?? false),
};

/**
 * A story plan: { plan: { element: value or [values] }, soft: [names held], nodes } or { why }.
 * Elements that occur more than once (attempt: 0 to 3) are variables `attempt#1..#max`, made in
 * order (an unmade one ends the run) and different. Options: `seed`, `soft` (the weight of each soft
 * constraint held, default 30), `fixed` ({ element: value }: the host's own choices), `relations`
 * (added to or replacing STORY_RELATIONS), `limit` (nodes).
 */
export function storyPlan(kb, { seed = 1, soft = 30, fixed = {}, relations = {}, limit = 200000 } = {}) {
  if (!kb.elements.length) return { why: 'the world holds no k.story elements' };
  const R = { ...STORY_RELATIONS, ...relations };
  const unknown = kb.constraints.find((c) => !R[c.relation]);
  if (unknown) return { why: `no meaning for the relation ${unknown.relation} (${unknown.name})` };
  const slots = []; // [{ v, el, i }]
  for (const e of kb.elements) for (let i = 1; i <= Math.max(1, e.max); i++) slots.push({ v: e.max > 1 ? `${e.name}#${i}` : e.name, el: e.name, i, multi: e.max > 1, optional: i > e.min });
  const slotOf = Object.fromEntries(slots.map((s) => [s.v, s]));
  const about = (el) => kb.constraints.filter((c) => c.element === el || c.other === el);
  // decide first what most constrains the rest: greedy by links to the decided, then smaller domains
  const size = (v) => (fixed[slotOf[v].el] !== undefined ? 1 : kb.domains[slotOf[v].el]?.length ?? 0); // the host's choices first
  const order = [], left = new Set(slots.map((s) => s.v));
  while (left.size) { // bounded: one slot per pass
    const decided = new Set(order.map((v) => slotOf[v].el));
    const links = (v, strength) => about(slotOf[v].el).filter((c) => c.strength === strength && (decided.has(c.element) || decided.has(c.other))).length;
    const nOf = (v) => kb.elements.find((e) => e.name === slotOf[v].el)?.n ?? 0;
    const pick = [...left].sort((x, y) => links(y, 'hard') - links(x, 'hard') || links(y, 'soft') - links(x, 'soft') || slotOf[x].i - slotOf[y].i
      || size(x) - size(y) || nOf(x) - nOf(y))[0];
    order.push(pick); left.delete(pick);
  }
  const valuesOf = (p, el) => { const s = slots.filter((x) => x.el === el && p[x.v] !== undefined && p[x.v] !== null); return s.map((x) => p[x.v]); };
  const plain = (p) => { const q = {}; for (const s of slots) if (!s.multi && p[s.v] !== undefined) q[s.el] = p[s.v]; return q; };
  const holds = (c, p) => { // a constraint on what is decided; undecided sides hold for now
    const as = valuesOf(p, c.element), bs = valuesOf(p, c.other);
    const decidedA = slots.some((s) => s.el === c.element && p[s.v] !== undefined), decidedB = slots.some((s) => s.el === c.other && p[s.v] !== undefined);
    if (!decidedA || !decidedB) return true;
    const single = (el) => !kb.elements.find((e) => e.name === el)?.max || kb.elements.find((e) => e.name === el).max <= 1;
    if ((single(c.element) && !as.length) || (single(c.other) && !bs.length)) return false; // an element a constraint names is made (a run of attempts may be empty)
    if (c.relation === 'before') return R.before(kb, null, null, plain(p), c);
    return as.every((a) => bs.every((b) => R[c.relation](kb, a, b, plain(p), c)));
  };
  const hard = kb.constraints.filter((c) => c.strength === 'hard'), softs = kb.constraints.filter((c) => c.strength === 'soft');
  const ok = (p, v) => {
    const s = slotOf[v];
    if (s.multi) { // made in order, each different
      const prev = slots.filter((x) => x.el === s.el && x.i < s.i);
      if (p[v] !== null && prev.some((x) => p[x.v] === null)) return false;
      if (p[v] !== null && prev.some((x) => p[x.v] === p[v])) return false;
    }
    return hard.filter((c) => c.element === s.el || c.other === s.el).every((c) => holds(c, p));
  };
  const domain = (v) => {
    const s = slotOf[v];
    if (fixed[s.el] !== undefined) return [].concat(fixed[s.el])[s.i - 1] !== undefined ? [[].concat(fixed[s.el])[s.i - 1]] : [null];
    return [...(kb.domains[s.el] || []), ...(s.optional ? [null] : [])];
  };
  const weight = (v, c, p) => {
    const s = slotOf[v];
    if (c === null) return s.multi ? 0.05 : 0.2; // an optional element is made unless the constraints forbid it (Olrik: three tries)
    const q = { ...p, [v]: c };
    return softs.filter((x) => x.element === s.el || x.other === s.el).reduce((w, x) => (holds(x, q) && valuesOf(q, x.element).length && valuesOf(q, x.other).length ? w * soft : w), 1);
  };
  const r = solveChoices(order, { domain, ok, weight, seed, limit });
  if (r.why) return { why: r.why, at: r.deepest, nodes: r.nodes };
  const plan = {};
  for (const s of slots) { const x = r.values[s.v]; if (s.multi) { if (x !== null) (plan[s.el] ||= []).push(x); } else if (x !== null) plan[s.el] = x; }
  const heldSoft = softs.filter((c) => holds(c, r.values)).map((c) => c.name);
  return { plan, soft: heldSoft, nodes: r.nodes };
}
