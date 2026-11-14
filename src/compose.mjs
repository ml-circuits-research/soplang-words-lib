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
// Not yet (waiting for the knowledge repository's worlds): the genre's procedure as a std.plan
// method with choice points solved jointly, story constraints (k.story), register.

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
export function compose(world, topic, { genre, size = { chapters: 2, sections: 1, sentences: 3 }, seed = 1, realise, measures } = {}) {
  const rand = rng(seed);
  const g = genre ? world.ofType('k.genres.genre').find((x) => bare(x.attrs.name[0]) === genre) : null;
  if (genre && !g) return { why: `there is no genre ${genre}` };
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
