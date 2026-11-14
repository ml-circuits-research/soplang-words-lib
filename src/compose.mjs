// std.compose (reviewer 14:45 B, 15:00), first version: a composition of a genre about a
// topic, from knowledge, with no model. The genre gives the moves of a section in order
// (`k.genres.genre name= move=... `); the outline is the topic's relations across the
// knowledge worlds (each fact that names the topic, grouped by what it says); chapters and
// facts are chosen by interest (the world's k.interest: appraisals and features with shapes
// and weight ranges, over measures computed here from the facts; each score explained); every sentence cites the wire it comes from; no fact twice;
// sizes are a budget set before selection, so they are exact when the knowledge suffices
// (and said when it does not). Language-free: the output is frames (a move and a fact); the
// language world realises them (`realise(frame)`, or its templates per move).
//
// With the published k.genres (parts, steps, moves, registers) the layout follows the genre and
// its choice points are solved jointly (`solveChoices` of std.plan). Not yet: story moves from
// k.story, the composition procedures of k.procedures, w.document as the output.

import { solveChoices } from './plan.mjs';
import { readStory, storyPlan } from './story.mjs';
import { discourseRealiser } from './realise.mjs';
import { choose } from './rank.mjs';
import { narrationOf } from './say.mjs';

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const isNum = (v) => /^-?\d+(\.\d+)?[a-z%]*$/i.test(bare(v));

function rng(seed) {
  let x = seed >>> 0;
  return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---- interest: the k.interest arithmetic (appraisals, features with shapes and weight ranges) over
// measures this library computes from facts. score = novelty x coping x relevance - penalty.

const num = (v) => Number(String(v).replace(/^"|"$/g, '').replace(/[a-z%]+$/i, ''));
const one = (f, k) => (f.attrs[k] ? bare(f.attrs[k][0]) : undefined);
/** The share of a feature's shape at a measured value (the reference arithmetic of k.interest). */
export function shapeShare(f, x) {
  const s = f.start_at ?? 0, p = f.peak_at, e = f.full_at;
  if (f.shape === 'step') return x >= e ? 1 : 0;
  if (f.shape === 'rising') return x <= s ? 0 : x >= e ? 1 : (x - s) / (e - s);
  if (f.shape === 'falling') return x <= s ? 1 : x >= e ? 0 : 1 - (x - s) / (e - s);
  if (f.shape === 'peak') return x <= s || x >= e ? 0 : x <= p ? (x - s) / (p - s) : (e - x) / (e - p);
  return 0;
}
const modelCache = new WeakMap();
/** The interest model a world holds (k.interest.appraisal and k.interest.feature), or null. */
export function interestModel(world) {
  if (modelCache.has(world)) return modelCache.get(world);
  const appraisals = world.ofType('k.interest.appraisal').map((a) => ({ name: one(a, 'name'), combine: one(a, 'combine'), base: Number(one(a, 'base') ?? 0) }));
  const features = world.ofType('k.interest.feature').map((f) => ({
    name: one(f, 'name'), appraisal: one(f, 'appraisal'), measure: one(f, 'measure'), shape: one(f, 'shape'),
    start_at: f.attrs.start_at ? Number(one(f, 'start_at')) : undefined, peak_at: f.attrs.peak_at ? Number(one(f, 'peak_at')) : undefined, full_at: Number(one(f, 'full_at')),
    weight_min: Number(one(f, 'weight_min')), weight_max: Number(one(f, 'weight_max')),
  }));
  const m = appraisals.length && features.length ? { appraisals, features } : null;
  modelCache.set(world, m);
  return m;
}

const SKIP = new Set(['name', 'about', 'kind', 'class', 'is', 'source', 'own', 'cite', 'derived']);
const keysOf = (f) => Object.keys(f.attrs).filter((k) => !k.startsWith('core.') && !SKIP.has(k));
/** What a fact is about: its `about`, else its `name`. */
export const subjectOf = (f) => one(f, 'about') ?? one(f, 'name');
const worldOf = (type) => type.split('.').slice(0, 2).join('.');
const graphCache = new WeakMap();
function graph(world) { // names -> facts that name them, and the names a fact links
  let g = graphCache.get(world);
  if (g) return g;
  const byName = new Map(), links = new Map();
  for (const w of world.wires.values()) {
    if (w.type.startsWith('core.') || w.type.startsWith('k.interest') || w.type.startsWith('k.genres')) continue;
    const n = one(w, 'name'); if (n) (byName.get(n) || byName.set(n, []).get(n)).push(w);
  }
  for (const w of world.wires.values()) {
    if (w.type.startsWith('core.') || w.type.startsWith('k.interest') || w.type.startsWith('k.genres')) continue;
    const out = new Set(); for (const k of Object.keys(w.attrs)) if (!k.startsWith('core.')) for (const v of w.attrs[k]) { const b = bare(v); if (byName.has(b)) out.add(b); }
    const s = subjectOf(w); if (s) out.add(s);
    links.set(w.id, out);
  }
  const adj = new Map(); // name graph: a fact joins its subject to every name it gives
  for (const w of world.wires.values()) { const ns = [...(links.get(w.id) || [])]; for (const x of ns) for (const y of ns) if (x !== y) (adj.get(x) || adj.set(x, new Set()).get(x)).add(y); }
  g = { byName, links, adj }; graphCache.set(world, g);
  return g;
}
function joins(world, from, to, max = 6) { // the fewest joins between two names (bounded)
  if (from === to) return 0;
  const { adj } = graph(world);
  let seen = new Set([from]), front = [from];
  for (let d = 1; d <= max && front.length; d++) {
    const next = [];
    for (const x of front) for (const y of adj.get(x) || []) { if (y === to) return d; if (!seen.has(y)) { seen.add(y); next.push(y); } }
    front = next;
  }
  return max + 1;
}
function siblingsOf(world, f) { // facts of the same type and the same kind or class
  const kk = ['kind', 'class', 'is'].find((k) => f.attrs[k]);
  return world.ofType(f.type).filter((x) => x !== f && (!kk || one(x, kk) === one(f, kk)));
}
const quart = (xs, q) => { const s = [...xs].sort((a, b) => a - b), i = (s.length - 1) * q, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };

/**
 * The measures of k.interest this library computes from facts and from the text being written
 * (`state`: { topic, said: Set of fact ids, moves: [{ move, type }], since: facts since the last
 * point, session: Set of names }). The rest (word_band, concreteness, rule_exception, known_share,
 * share_beyond_band, words_over_max, example_after_claim, ends_without_point) come from the host
 * in `state.measures`, which also overrides any measure here.
 */
export function measuresOf(world, f, state = {}) {
  const m = {}, subj = subjectOf(f), sib = siblingsOf(world, f), { links, byName } = graph(world);
  const named = [...(links.get(f.id) || [])].flatMap((n) => byName.get(n) || []).filter((x) => x !== f);
  m.world_distance = new Set(named.map((x) => worldOf(x.type)).filter((x) => x !== worldOf(f.type))).size;
  if (state.topic && subj) m.topic_distance = Math.min(...[subj, ...(links.get(f.id) || [])].map((n) => joins(world, n, state.topic)));
  let contrast = 0, range = 0, rank = 0, obvious = /^(true|yes)$/.test(one(f, 'derived') ?? '') ? 1 : 0;
  for (const k of keysOf(f)) {
    const said = sib.filter((x) => x.attrs[k]); const v = bare(f.attrs[k][0]);
    if (said.length >= 3 && !isNum(v)) { // what most siblings say, against what this one says
      const count = new Map(); for (const x of said) { const y = bare(x.attrs[k][0]); count.set(y, (count.get(y) || 0) + 1); }
      const [top, n] = [...count].sort((a, b) => b[1] - a[1])[0];
      if (top !== v) contrast = Math.max(contrast, n / said.length);
      else if ((n + 1) / (said.length + 1) >= 0.9) obvious = 1;
    }
    if (isNum(v)) {
      const xs = said.map((x) => num(x.attrs[k][0])).filter(Number.isFinite), x = num(v);
      if (xs.length >= 4) { const q1 = quart(xs, 0.25), q3 = quart(xs, 0.75), wd = (q3 - q1) || 1; range = Math.max(range, x > q3 ? (x - q3) / wd : x < q1 ? (q1 - x) / wd : 0); }
      if (xs.length >= 5 && (x > Math.max(...xs) || x < Math.min(...xs))) rank = 1;
    }
  }
  Object.assign(m, { sibling_contrast: +contrast.toFixed(3), range_distance: +range.toFixed(3), sibling_rank: rank, obviousness: obvious });
  m.number_with_unit = keysOf(f).some((k) => f.attrs[k].some((v) => /^-?\d+(\.\d+)?[a-z%]+$/i.test(bare(v)))) || (f.attrs.unit && keysOf(f).some((k) => isNum(f.attrs[k][0]))) ? 1 : 0;
  m.animacy = [f, ...(byName.get(subj) || [])].some((x) => /animal|person|people/.test(x.type)) ? 1 : 0;
  m.said_before = state.said?.has(f.id) ? 1 : 0;
  m.seen_in_session = subj && state.session?.has(subj) ? 1 : 0;
  if (state.moves) { let run = 1; for (let i = state.moves.length - 1; i >= 0 && state.moves[i].move === state.move && state.moves[i].type === f.type; i--) run++; m.same_move_run = run; }
  if (state.since !== undefined) m.items_without_point = state.since + 1;
  return { ...m, ...(state.measures || {}) };
}

/**
 * The interest of a fact: { score, value (per appraisal), by (feature -> contribution), measured }.
 * The model is the world's k.interest (or `options.model`); a weight is the middle of its range,
 * or drawn inside it with `options.draw` (a seed). Without a model: { score: 0, why }.
 */
export function interestOf(world, fact, options = {}) {
  const model = options.model ?? interestModel(world);
  if (!model) return { score: 0, value: {}, by: {}, measured: {}, why: 'the world holds no k.interest model' };
  const measured = measuresOf(world, fact, options);
  const r = options.draw !== undefined ? rng(options.draw) : null;
  const value = Object.fromEntries(model.appraisals.map((a) => [a.name, a.base])), by = {};
  for (const f of model.features) {
    if (!(f.measure in measured)) continue;
    const wgt = r ? f.weight_min + (f.weight_max - f.weight_min) * r() : (f.weight_min + f.weight_max) / 2;
    const c = +(wgt * shapeShare(f, measured[f.measure])).toFixed(4);
    if (c) { value[f.appraisal] += c; by[f.name] = c; }
  }
  for (const k of Object.keys(value)) value[k] = +Math.min(1, Math.max(0, value[k])).toFixed(4);
  const product = model.appraisals.filter((a) => a.combine === 'multiply').reduce((p, a) => p * value[a.name], 1);
  const minus = model.appraisals.filter((a) => a.combine === 'subtract').reduce((p, a) => p + value[a.name], 0);
  return { score: +(product - minus).toFixed(4), value, by, measured };
}

/**
 * A composition: { genre, topic, chapters: [{ title, interest, sections: [{ interest, sentences:
 * [{ move, fact, about, cites, text? }] }] }], short?: [what the knowledge lacked] }.
 * Options: `genre` (a k.genres.genre name; default: introduce, fact, fact, conclude), `size`
 * { chapters, sections, sentences } (sentences per section), `seed`, `realise(frame) -> text`.
 */
const memo = new WeakMap(); // world -> Map(key -> { at, result }): a host that dry-runs twice gets the same composition
export function compose(world, topic, options = {}) {
  const { realise, measures, story } = options;
  if (realise || measures || story || options.memo === false) return composeOnce(world, topic, options);
  const key = JSON.stringify([topic, options.genre ?? null, options.size ?? null, options.seed ?? 1, options.quiet ?? null]), at = `${world.stamp ?? ''}|${world.wires.size}`;
  const m = memo.get(world) || memo.set(world, new Map()).get(world), hit = m.get(key);
  if (hit && hit.at === at) return hit.result;
  const result = composeOnce(world, topic, options);
  m.set(key, { at, result });
  return result;
}
function composeOnce(world, topic, { genre, size, seed = 1, realise, measures, story, quiet } = {}) {
  const rand = rng(seed);
  const g = genre ? world.ofType('k.genres.genre').find((x) => bare(x.attrs.name[0]) === genre) : null;
  if (genre && !g) return { why: `there is no genre ${genre}` };
  if (g && world.ofType('k.genres.part').some((p) => one(p, 'genre') === genre)) return composeGenre(world, topic, g, { size: size ?? {}, seed, realise, measures, story, quiet });
  size ??= { chapters: 2, sections: 1, sentences: 3 };
  const moves = g ? g.attrs.move.map(bare) : ['introduce', 'fact', 'fact', 'conclude'];
  const subject = [...world.wires.values()].find((w) => !w.type.startsWith('core.') && (w.attrs.name || []).some((n) => bare(n) === topic));
  // the topic's relations: every fact that names it, and its own facts, grouped by type (what they say)
  const about = [...world.wires.values()].filter((w) => !w.type.startsWith('core.') && !w.type.startsWith('k.genres') && !w.type.startsWith('k.interest') && w !== subject
    && Object.values(w.attrs).some((vs) => vs.some((v) => bare(v) === topic)));
  const groups = new Map();
  for (const f of about) (groups.get(f.type) || groups.set(f.type, []).get(f.type)).push(f);
  if (!groups.size && subject) groups.set(subject.type, [subject]); // nothing names it: its own fact alone
  const used = new Set(), short = [];
  const moveLog = [];
  const score = (f, move) => interestOf(world, f, { topic, said: used, moves: moveLog, move, measures: measures?.(f) }).score + rand() * 0.001; // chance breaks ties only
  const need = size.sections * size.sentences; // the content budget of a chapter, set before selection
  const ranked = [...groups].map(([type, facts]) => ({ type, facts, interest: facts.reduce((s, f) => s + score(f), 0) / facts.length }))
    .sort((a, b) => Number(b.facts.length + 1 >= need) - Number(a.facts.length + 1 >= need) || b.interest - a.interest || a.type.localeCompare(b.type)); // relations that can fill a chapter first, then by interest
  const chapters = [];
  for (let c = 0; c < size.chapters; c++) { // bounded: the size asked
    const group = ranked[c];
    if (!group) { short.push(`chapter ${c + 1}: no more relations of ${topic}`); break; }
    const sections = [];
    for (let s = 0; s < size.sections; s++) {
      const sentences = [];
      for (let k = 0; k < size.sentences; k++) {
        // the genre's moves: the first opens, the last closes, the middle ones in turn between
        const move = k === 0 ? moves[0] : k === size.sentences - 1 ? moves[moves.length - 1] : moves[1 + ((k - 1) % Math.max(1, moves.length - 2))] ?? moves[0];
        const pick = (move === 'introduce' && subject && !used.has(subject.id) ? [subject] : group.facts).filter((f) => !used.has(f.id)).map((f) => [f, score(f, move)]).filter(([, x]) => x > -0.5).sort((a, b) => b[1] - a[1])[0]?.[0]; // never a fact said before (penalty 1)
        if (!pick) { short.push(`chapter ${c + 1}, section ${s + 1}: ${size.sentences - k} sentences short`); break; }
        used.add(pick.id); moveLog.push({ move, type: pick.type });
        const frame = { move, fact: { type: pick.type, attrs: Object.fromEntries(Object.entries(pick.attrs).filter(([key]) => !key.startsWith('core.')).map(([key, vs]) => [key, vs.map(bare)])) }, about: topic, cites: pick.id };
        if (realise) frame.text = realise(frame);
        sentences.push(frame);
      }
      sections.push({ interest: +(sentences.reduce((x, f) => x + interestOf(world, world.get(f.cites), { topic, measures: measures?.(world.get(f.cites)) }).score, 0) / Math.max(1, sentences.length)).toFixed(3), sentences });
    }
    chapters.push({ title: group.type, interest: +group.interest.toFixed(3), sections });
  }
  return { genre: genre ?? null, topic, chapters, ...(short.length ? { short } : {}) };
}

// ---- a composition by the published k.genres: parts in order (repeated min..max), steps in order
// with alternatives, sentences per step, the register's tense and sentence lengths. The repeats,
// the relation of each repeated part and the move at each place with alternatives are choice
// points solved jointly (solveChoices): no relation twice, each move fillable from what is left,
// weighted by interest; then the sentences are filled by interest, never a fact twice.
const TAKES_FACT = new Set(['fact', 'facts', 'question']);
function composeGenre(world, topic, g, { size = {}, seed = 1, realise, measures, story, quiet = [] } = {}) {
  // keys never narrated (codes, ids): the host's `quiet`, and the knowledge's own marks (`k.attributes.key name= narrate=no`)
  const QUIET = new Set([...quiet, ...world.ofType('k.attributes.key').filter((k) => /^(no|false)$/.test(String(k.attrs.narrate?.[0] ?? ''))).map((k) => bare(k.attrs.name[0]))]);
  const META_KEYS = new Set(['name', 'about', 'kind', 'class', 'is', 'source', 'own', 'cite', 'derived']);
  const NARR = narrationOf(world), quietFor = (type, k) => QUIET.has(k) || NARR.get(`${type}|${k}`)?.narrate === false; // keys the knowledge does not narrate (k.attributes.narration narrate=no, Q63)
  const genre = one(g, 'name');
  let plan = story, storyKb = null, storyWhy = null, storyNote = null;
  // the sentences: the host's realiser, else the language world's discourse templates when it has them
  const R = realise ?? (world.ofType('w.lang.en.discourse').length ? discourseRealiser(world, { seed }) : null);
  const say = (frame, ctx) => { if (!R) return; const r = R(frame, register, ctx); if (typeof r === 'string') frame.text = r; else if (r) { frame.text = r.text; frame.template = r.template; } }; // a story plan (k.story), made when a story move needs one
  const storyFrames = (part, move) => {
    if (!storyKb) storyKb = readStory(world);
    if (!plan && !storyWhy) {
      const fixed = storyKb.domains.protagonist?.includes(topic) ? { protagonist: topic } : {}; // the topic, when it can be the hero
      let r = storyPlan(storyKb, { seed, fixed });
      if (r.why && fixed.protagonist) { storyNote = `no story has ${topic} as the protagonist (${r.why}, at ${r.at}): another hero`; r = storyPlan(storyKb, { seed }); }
      if (r.why) storyWhy = r.why; else plan = r;
    }
    if (!plan) return null;
    return storyKb.elements.filter((e) => e.part === part && e.move === move).flatMap((e) => [].concat(plan.plan[e.name] ?? []).map((v) => ({ element: e.name, value: v })));
  };
  const reg = world.ofType('k.genres.register').find((r) => one(r, 'name') === one(g, 'register'));
  const register = reg ? { name: one(reg, 'name'), tense: one(reg, 'tense'), person: one(reg, 'person'), words: ['sentence_min', 'sentence_typical', 'sentence_max'].map((k) => Number(one(reg, k))) } : null;
  const takes = Object.fromEntries(world.ofType('k.genres.move').map((m) => [one(m, 'name'), one(m, 'takes') ?? 'fact']));
  const parts = world.ofType('k.genres.part').filter((p) => one(p, 'genre') === genre).sort((a, b) => Number(one(a, 'n')) - Number(one(b, 'n')));
  const stepsOf = (p) => world.ofType('k.genres.step').filter((st) => one(st, 'genre') === genre && one(st, 'part') === one(p, 'name'));
  const subject = [...world.wires.values()].find((w) => !w.type.startsWith('core.') && !w.type.startsWith('k.genres') && !w.type.startsWith('k.interest') && one(w, 'name') === topic);
  const about = [...world.wires.values()].filter((w) => !w.type.startsWith('core.') && !w.type.startsWith('k.genres') && !w.type.startsWith('k.interest') && w !== subject
    && Object.values(w.attrs).some((vs) => vs.some((v) => bare(v) === topic))
    && Object.keys(w.attrs).some((k) => !k.startsWith('core.') && !META_KEYS.has(k) && !quietFor(w.type, k) && !(w.attrs[k] || []).some((v) => bare(v) === topic))); // a fact with something to say beyond quiet keys
  const groups = new Map();
  for (const f of about) (groups.get(f.type) || groups.set(f.type, []).get(f.type)).push(f);
  const said = new Set(), interest = (f) => interestOf(world, f, { topic, said, measures: measures?.(f) }).score;
  const groupNames = [...groups.keys()];
  // the places: each part instance, each step place; repeated parts take one relation each
  const repeat = parts.filter((p) => Number(one(p, 'max')) > 1);
  const vars = [], dom = {}, meta = {};
  for (const p of repeat) { const v = `times:${one(p, 'name')}`; vars.push(v); const lo = Number(one(p, 'min')), hi = Math.min(Number(one(p, 'max')), size.repeats ?? Infinity); dom[v] = []; for (let k = hi; k >= lo; k--) dom[v].push(k); }
  const maxTimes = (p) => (Number(one(p, 'max')) > 1 ? Math.min(Number(one(p, 'max')), size.repeats ?? Infinity) : Number(one(p, 'max')));
  for (const p of parts) for (let t = 0; t < maxTimes(p); t++) {
    const pname = one(p, 'name'), inst = `${pname}#${t}`;
    if (Number(one(p, 'max')) > 1) { const v = `rel:${inst}`; vars.push(v); dom[v] = [...groupNames, null]; meta[v] = { part: pname, t }; }
    const steps = stepsOf(p), places = [...new Set(steps.map((st) => Number(one(st, 'n'))))].sort((a, b) => a - b);
    for (const n of places) { const alts = steps.filter((st) => Number(one(st, 'n')) === n); if (alts.length > 1) { const v = `move:${inst}:${n}`; vars.push(v); dom[v] = alts.map((st) => one(st, 'move')); meta[v] = { part: pname, t }; } }
  }
  const active = (partial, part, t) => { const v = `times:${part}`; return !(v in partial) || t < partial[v]; };
  const fillable = (move, facts) => { const k = takes[move]; return k === 'facts' || move === 'compare' ? facts.length >= 2 : TAKES_FACT.has(k) ? facts.length >= 1 : true; };
  let strict = true;
  const minNeed = (p) => { let need = 0; const steps = stepsOf(p); for (const n of new Set(steps.map((st) => Number(one(st, 'n'))))) need += Math.min(...steps.filter((st) => Number(one(st, 'n')) === n).map((st) => (TAKES_FACT.has(takes[one(st, 'move')]) ? Number(one(st, 'min')) : 0))); return need; };
  const fitting = Object.fromEntries(repeat.map((p) => [one(p, 'name'), groupNames.filter((gname) => groups.get(gname).length >= minNeed(p)).length]));
  const ok = (partial) => {
    if (strict) for (const p of repeat) { const t = partial[`times:${one(p, 'name')}`]; if (t !== undefined && t > Math.max(Number(one(p, 'min')), fitting[one(p, 'name')])) return false; } // no more repeats than relations that can fill them
    const used = Object.entries(partial).filter(([k, v]) => k.startsWith('rel:') && v !== null && active(partial, meta[k].part, meta[k].t)).map(([, v]) => v);
    if (new Set(used).size !== used.length) return false; // no relation twice
    for (const [k, v] of Object.entries(partial)) {
      if (!k.startsWith('rel:')) continue;
      if (active(partial, meta[k].part, meta[k].t) && v === null && groupNames.length > used.length) return false; // a repeated part takes a relation while any is left
      if (!active(partial, meta[k].part, meta[k].t) && v !== null) return false; // a part not made takes none
    }
    for (const [k, v] of Object.entries(partial)) {
      if (!k.startsWith('move:')) continue;
      const rel = partial[`rel:${meta[k].part}#${meta[k].t}`];
      if (rel !== undefined && active(partial, meta[k].part, meta[k].t) && !fillable(v, rel ? groups.get(rel) : about)) return false;
    }
    if (strict) for (const [k, rel] of Object.entries(partial)) { // a part's relation holds the facts all its steps need at their minimum
      if (!k.startsWith('rel:') || !rel || !active(partial, meta[k].part, meta[k].t)) continue;
      const p = parts.find((x) => one(x, 'name') === meta[k].part), steps = stepsOf(p);
      let need = 0;
      for (const n of new Set(steps.map((st) => Number(one(st, 'n'))))) {
        const alts = steps.filter((st) => Number(one(st, 'n')) === n), mv = partial[`move:${meta[k].part}#${meta[k].t}:${n}`];
        const st = alts.length > 1 ? (mv === undefined ? null : alts.find((x) => one(x, 'move') === mv)) : alts[0];
        if (st && TAKES_FACT.has(takes[one(st, 'move')])) need += Number(one(st, 'min'));
      }
      if (need > groups.get(rel).length) return false;
    }
    return true;
  };
  const weight = (v, c, partial) => {
    if (v.startsWith('times:')) return groupNames.length >= c ? 2 : 1; // as many repeats as there are relations
    if (v.startsWith('rel:')) return c === null ? 0.01 : (groups.get(c).some((f) => bare(f.attrs.about?.[0] ?? f.attrs.name?.[0] ?? '') === topic) ? 10 : 1) * (1 + Math.max(0, ...groups.get(c).map(interest))); // relations about the topic itself first
    const rel = partial[`rel:${meta[v].part}#${meta[v].t}`], facts = rel ? groups.get(rel) : about;
    const best = Math.max(0, ...facts.map((f) => interestOf(world, f, { topic, measures: measures?.(f) }).by[c === 'surprising fact' ? 'sibling_contrast' : 'on_topic'] ?? 0));
    return 1 + best;
  };
  let sol = solveChoices(vars, { domain: (v) => dom[v], ok, weight, seed, limit: 100000 }), relaxed = null;
  if (sol.why) { relaxed = `no layout gives every step its minimum facts (${sol.why}, at ${sol.deepest}): steps may go short`; strict = false; sol = solveChoices(vars, { domain: (v) => dom[v], ok, weight, seed }); }
  if (sol.why) { // no layout within the search: the plainest one (each repeated part its minimum, relations by interest, the first alternative), said
    relaxed = `no layout found (${sol.why}, at ${sol.deepest}): the plainest one is used`;
    const values = {}; let gi = 0;
    for (const v of vars) values[v] = v.startsWith('times:') ? dom[v][dom[v].length - 1] : v.startsWith('rel:') ? (groupNames[gi++] ?? null) : dom[v][0];
    sol = { values, nodes: sol.nodes };
  }
  const choice = Object.fromEntries(Object.entries(sol.values).filter(([k, v]) => !(k in meta) || active(sol.values, meta[k].part, meta[k].t)));
  const relations = parts.filter((x) => Number(one(x, 'max')) > 1).flatMap((x) => Array.from({ length: choice[`times:${one(x, 'name')}`] }, (_, i) => choice[`rel:${one(x, 'name')}#${i}`])).filter(Boolean);
  const aboutTopic = (f) => (bare(f.attrs.about?.[0] ?? f.attrs.name?.[0] ?? '') === topic ? 1 : 0); // the topic is the fact's subject, not only one of its values (an essay about Peru claimed facts about Lima)
  const pickFact = (pool) => choose(world, 'fact', pool.filter((f) => !said.has(f.id)).map((f) => ({ f, said: 0, aboutTopic: aboutTopic(f), interest: interest(f) })).filter((x) => x.interest > -0.5), { seed }).best?.f; // one way to choose (std.decide, kind fact): unsaid, about the topic, then interest
  const fill = (extra) => { // the steps' minimum sentences; `extra` more go to steps in order, up to their maximum, while facts last
    said.clear();
    const short = [], out = [], claims = [], toldEls = new Set();
    for (const p of parts) {
      const pname = one(p, 'name'), times = Number(one(p, 'max')) > 1 ? choice[`times:${pname}`] : Number(one(p, 'min')) || 1;
      for (let t = 0; t < times; t++) {
        const inst = `${pname}#${t}`, rel = choice[`rel:${inst}`], pool = rel ? groups.get(rel) : about;
        const steps = stepsOf(p), places = [...new Set(steps.map((st) => Number(one(st, 'n'))))].sort((a, b) => a - b), moves = [];
        for (const n of places) {
          const alts = steps.filter((st) => Number(one(st, 'n')) === n), st = alts.length > 1 ? alts.find((x) => one(x, 'move') === choice[`move:${inst}:${n}`]) : alts[0];
          const move = one(st, 'move'), k = takes[move], lo = Number(one(st, 'min')), hi = Number(one(st, 'max'));
          const tense = one(st, 'tense') ?? one(p, 'tense') ?? register?.tense;
          const recall = k === 'facts' && !rel && (claims.length > 0 || !pickFact(about)); // after the repeated parts, or with nothing new: it restates their claims (a summary)
          const told = k === 'story' ? storyFrames(pname, move) : null; // the story's elements this move tells
          let count = told ? told.length : recall ? Math.min(hi, Math.max(lo, claims.length && lo ? Math.min(hi, claims.length) : lo)) : lo;
          while (extra > 0 && count < hi && !recall && (k === 'fact' || k === 'facts') && pool.filter((f) => !said.has(f.id)).length > count) { count++; extra--; } // bounded: up to the step's maximum
          for (let c = 0; c < count; c++) {
            const frame = { part: pname, move, takes: k, tense };
            if (k === 'topic') { frame.about = topic; if (subject && !said.has(subject.id)) { frame.cites = subject.id; said.add(subject.id); } }
            else if (k === 'outline') frame.outline = relations;
            else if (recall) { if (!claims[c]) break; frame.recalls = claims[c]; }
            else if (TAKES_FACT.has(k)) {
              const CONTRAST = /counter|rebut/.test(move); // a counterargument needs a real contrast (reviewer 00:05): a fact that differs from what its siblings say
            const ownLeft = (xs) => xs.some((x) => !said.has(x.id) && aboutTopic(x)); // a claim is about the topic: when the relation has none left, a fact about the topic from elsewhere
            const from = ownLeft(pool) ? pool : pool.concat(about.filter((x) => aboutTopic(x)));
            const f = CONTRAST ? (pool.concat(rel ? [] : about)).filter((x) => !said.has(x.id)).find((x) => (interestOf(world, x, { topic }).measured.sibling_contrast ?? 0) > 0) : pickFact(from) ?? (rel ? undefined : pickFact(about));
            if (!f && CONTRAST) { short.push(`${inst} ${move}: no fact contrasts with the rest, the move is left out`); break; }
              if (!f) { if (lo > 0) short.push(`${inst} ${move}: no fact left`); break; }
              said.add(f.id); frame.cites = f.id; frame.subject = bare(f.attrs.about?.[0] ?? f.attrs.name?.[0] ?? ''); frame.fact = { type: f.type, attrs: Object.fromEntries(Object.entries(f.attrs).filter(([key]) => !key.startsWith('core.') && !quietFor(f.type, key)).map(([key, vs]) => [key, vs.map(bare)])) };
              if (rel && !moves.some((m) => m.cites)) claims.push(f.id); // the first fact of a repeated part: its claim
            } else if (k === 'story') { if (told) Object.assign(frame, told[c]); else short.push(`${inst} ${move}: ${storyWhy ?? 'story moves are filled by k.story'}`); }
            say(frame, { topic, story: plan, outline: relations, told: toldEls, claims, goalAct: (g) => storyKb?.goals.find((x) => x.name === g)?.act });
            if (frame.element) toldEls.add(frame.element);
            moves.push(frame);
          }
        }
        out.push({ part: pname, ...(one(p, 'heading') ? { heading: one(p, 'heading') } : {}), ...(one(p, 'layout') ? { layout: one(p, 'layout') } : {}), ...(rel ? { relation: rel } : {}), moves });
      }
    }
    return { out, short, sentences: out.reduce((x, p) => x + p.moves.length, 0) };
  };
  let r = fill(0);
  if (size.sentences > r.sentences) r = fill(size.sentences - r.sentences);
  const out = r.out, short = [...(relaxed ? [relaxed] : []), ...(storyNote ? [storyNote] : []), ...new Set(r.short)];
  { const seenText = new Set(); let dropped = 0; for (const p of out) p.moves = p.moves.filter((m) => { if (!m.text) return true; const k = m.text.toLowerCase(); if (seenText.has(k)) { dropped++; return false; } seenText.add(k); return true; }); if (dropped) short.push(`${dropped} sentences said twice were left out`); } // no sentence twice in a document
  const silent = R ? out.flatMap((p) => p.moves.filter((m) => !m.text).map((m) => m.move)) : [];
  if (silent.length) short.push(`${silent.length} sentences have no template that fits: ${[...new Set(silent)].join(', ')}`);
  if (size.sentences && r.sentences !== size.sentences) short.push(r.sentences < size.sentences ? `${r.sentences} of ${size.sentences} sentences: the knowledge has no more` : `${r.sentences} sentences: the genre's minimum is above ${size.sentences}`);
  return { genre, register, topic, seed, parts: out, ...(plan ? { story: plan } : {}), choices: choice, nodes: sol.nodes, ...(short.length ? { short } : {}) };
}
