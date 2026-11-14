// std.compose (reviewer 14:45 B, 15:00), first version: a composition of a genre about a
// topic, from knowledge, with no model. The genre gives the moves of a section in order
// (`k.genres.genre name= move=... `); the outline is the topic's relations across the
// knowledge worlds (each fact that names the topic, grouped by what it says); chapters and
// facts are chosen by interest (features as data: `k.interest.feature name= weight=`, scored
// on each fact and explained); every sentence cites the wire it comes from; no fact twice;
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

/**
 * The interest of a fact, by feature: `number` (it gives a number), `link` (a value names
 * another fact: a link between worlds), `distance` (the fact's type is far from the topic's:
 * another world), `rare` (few facts of its type), `new` (not yet used in this text). Weights
 * from `k.interest.feature` facts (default 1 each). Returns { score, by }.
 */
export function interestOf(world, fact, { topicType, topic, used = new Set(), weights } = {}) {
  const W = weights ?? Object.fromEntries(world.ofType('k.interest.feature').map((f) => [bare(f.attrs.name[0]), Number(bare(f.attrs.weight?.[0] ?? 1))]));
  const w = (k) => (W[k] ?? 1);
  const values = Object.entries(fact.attrs).filter(([k]) => !k.startsWith('core.') && k !== 'name').flatMap(([, vs]) => vs.map(bare));
  const by = {
    number: values.some(isNum) ? w('number') : 0,
    link: values.some((v) => !isNum(v) && v !== bare(fact.attrs.name?.[0] ?? '') && v !== topic && hasName(world, v)) ? w('link') : 0, // a link to something other than the topic
    distance: topicType && fact.type.split('.').slice(0, 2).join('.') !== topicType.split('.').slice(0, 2).join('.') ? w('distance') : 0,
    rare: world.ofType(fact.type).length <= 3 ? w('rare') : 0,
    new: used.has(fact.id) ? -10 : w('new') * 0.1,
  };
  return { score: +Object.values(by).reduce((s, x) => s + x, 0).toFixed(3), by };
}
const nameIndex = new WeakMap();
function hasName(world, v) {
  let ix = nameIndex.get(world);
  if (!ix) { ix = new Set(); for (const w of world.wires.values()) for (const n of w.attrs?.name || []) ix.add(bare(n)); nameIndex.set(world, ix); }
  return ix.has(v);
}

/**
 * A composition: { genre, topic, chapters: [{ title, interest, sections: [{ interest, sentences:
 * [{ move, fact, about, cites, text? }] }] }], short?: [what the knowledge lacked] }.
 * Options: `genre` (a k.genres.genre name; default: introduce, fact, fact, conclude), `size`
 * { chapters, sections, sentences } (sentences per section), `seed`, `realise(frame) -> text`.
 */
export function compose(world, topic, { genre, size = { chapters: 2, sections: 1, sentences: 3 }, seed = 1, realise } = {}) {
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
  const used = new Set(), short = [];
  const score = (f) => interestOf(world, f, { topicType: subject?.type, topic, used }).score + rand() * 0.01; // chance breaks ties only
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
        const pick = (move === 'introduce' && subject && !used.has(subject.id) ? [subject] : group.facts).filter((f) => !used.has(f.id)).sort((a, b) => score(b) - score(a))[0];
        if (!pick) { short.push(`chapter ${c + 1}, section ${s + 1}: ${size.sentences - k} sentences short`); break; }
        used.add(pick.id);
        const frame = { move, fact: { type: pick.type, attrs: Object.fromEntries(Object.entries(pick.attrs).filter(([key]) => !key.startsWith('core.')).map(([key, vs]) => [key, vs.map(bare)])) }, about: topic, cites: pick.id };
        if (realise) frame.text = realise(frame);
        sentences.push(frame);
      }
      sections.push({ interest: +(sentences.reduce((x, f) => x + interestOf(world, world.get(f.cites), { topicType: subject?.type, topic }).score, 0) / Math.max(1, sentences.length)).toFixed(3), sentences });
    }
    chapters.push({ title: group.type, interest: +group.interest.toFixed(3), sections });
  }
  return { genre: genre ?? null, topic, chapters, ...(short.length ? { short } : {}) };
}
