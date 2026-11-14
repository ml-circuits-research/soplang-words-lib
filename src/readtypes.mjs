import { choose } from './rank.mjs';
// Type-driven reading (abstraction round, item 1; questions.md Q54): a question or a request is read
// by the TYPES of its content words, not by one fixed word order. Each content word is typed
// through the world itself: a thing (a fact's name), a kind (a type, or a kind / class value), an
// attribute (a key that facts of some type carry), an act (a word of an action). The candidate
// frames are every relation and act whose argument types the typed words fill, each word used at
// most once; word order and function words only rank them. So "what sound does a cow make", "a
// cow makes which sound" and "cow sound?" are one frame: the attribute `sound` of the thing `cow`.

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const cache = new WeakMap();
const LANG = ['k.words.', 'w.lang.', 'k.genres.', 'k.interest.'];

/** The world's own lexicon: word -> [{ cat: thing | kind | attr | act, ... }]. Memoised per world. */
export function typedLexicon(world) {
  const hit = cache.get(world);
  if (hit && hit.size === world.wires.size) return hit.lex;
  const lex = new Map(), add = (word, e) => { const k = String(word).toLowerCase().replace(/_/g, ' '); (lex.get(k) || lex.set(k, []).get(k)).push(e); };
  const holders = new Map(); // key -> types that carry it
  for (const w of world.wires.values()) {
    if (w.type.startsWith('core.') || w.type.startsWith('std.') || LANG.some((p) => w.type.startsWith(p))) continue; // the language's own facts are not content
    for (const n of w.attrs.name || []) add(bare(n), { cat: 'thing', id: w.id, type: w.type });
    for (const k of ['kind', 'class', 'is']) for (const v of w.attrs[k] || []) add(bare(v), { cat: 'kind', kind: bare(v), key: k });
    for (const k of Object.keys(w.attrs)) if (!k.startsWith('core.') && k !== 'name') (holders.get(k) || holders.set(k, new Set()).get(k)).add(w.type);
    for (const [k, vs] of Object.entries(w.attrs)) if (!k.startsWith('core.') && !['name', 'kind', 'class', 'is', 'about'].includes(k)) for (const v of vs) if (!/^-?\d/.test(bare(v)) && v[0] !== '$') add(bare(v), { cat: 'value', key: k, id: w.id, type: w.type });
  }
  for (const [k, ts] of holders) if (!['kind', 'class', 'is', 'about'].includes(k)) add(k, { cat: 'attr', key: k, holders: [...ts] });
  // relations the knowledge declares (k.kinds.relation type= key=): a key is an attribute of its type even before any fact says it
  for (const r of world.ofType('k.kinds.relation')) { const k = bare(r.attrs.key?.[0] ?? ''), t = bare(r.attrs.type?.[0] ?? ''); if (k && !holders.has(k)) add(k, { cat: 'attr', key: k, holders: [t], declared: true }); }
  for (const t of new Set([...world.wires.values()].map((w) => w.type))) if (!t.startsWith('core.') && !t.startsWith('std.') && !LANG.some((p) => t.startsWith(p))) add(t.split('.').pop(), { cat: 'kind', type: t });
  const comp = world._compiled?.();
  for (const [type, slots] of comp?.slots?.own ?? []) for (const sl of slots.values()) for (const e of sl.enum || []) add(bare(e), { cat: 'value', key: sl.key, type, schema: true }); // a closed set's values name what they are
  const actions = comp?.actions;
  if (actions) for (const a of actions.keys()) add(bare(a), { cat: 'act', act: bare(a) });
  for (const w of world.ofType('core.word')) for (const m of w.attrs.means || []) for (const t of w.attrs.text || []) { add(bare(t), actions?.has(bare(m)) || actions?.has(m) ? { cat: 'act', act: bare(m) } : { cat: 'word', means: bare(m) }); if (holders.has(bare(m))) add(bare(t), { cat: 'attr', key: bare(m), holders: [...holders.get(bare(m))], verb: true }); } // a word the world declares: an act's, or one it knows; a verb that means a key asks for it (says: sound)
  cache.set(world, { size: world.wires.size, lex });
  return lex;
}

/**
 * Reads `text` by the types of its words. Options: `question` (words that make a question: what,
 * which, how...), `skip` (function words to pass over), `lemma(word) -> [forms]` (default: the
 * world's lemma, then the word without a final s). Returns { frames: [{ frame, score, words }],
 * best, ambiguous?, unread: [words] }. A frame: { is: 'ask', key, of: { id } | { kind } , answer }
 * or { is: 'act', act, args: { role: id } }.
 */
const senseIndex = new WeakMap();
/**
 * The near words of a word through word senses (k.words.sense: word, synonym, is_a, kind_of), as
 * [{ word, cost, via }]: synonyms 1 (both ways), the nearest kind (is_a) 2, further kinds 3.
 * `senses(word) -> [sense wires]` comes from the host (a lazy catalog); by default the world's own.
 */
export function nearWords(world, word, { senses } = {}) {
  let get = senses;
  if (!get) {
    let ix = senseIndex.get(world);
    if (!ix || ix.n !== world.wires.size) {
      ix = { n: world.wires.size, by: new Map() };
      for (const w of world.ofType('k.words.sense')) for (const k of ['word', 'synonym']) for (const v of w.attrs[k] || []) { const t = bare(v).toLowerCase(); (ix.by.get(t) || ix.by.set(t, []).get(t)).push(w); }
      senseIndex.set(world, ix);
    }
    get = (t) => ix.by.get(t) || [];
  }
  const out = new Map(), put = (w, cost, via) => { const t = bare(w).toLowerCase(); if (t !== word && (!out.has(t) || out.get(t).cost > cost)) out.set(t, { word: t, cost, via }); };
  for (const s of get(word)) {
    const own = (s.attrs.word || []).map((x) => bare(x).toLowerCase()).includes(word);
    for (const v of [...(s.attrs.word || []), ...(s.attrs.synonym || [])]) put(v, 1, own ? 'synonym' : 'synonym of');
    if (own) { for (const v of s.attrs.is_a || []) put(v, 2, 'kind'); (s.attrs.kind_of || []).forEach((v, i) => put(v, 3 + i * 0.1, 'kind')); }
  }
  return [...out.values()].sort((a, b) => a.cost - b.cost);
}

export function readByTypes(world, text, { question = [], skip = [], lemma, senses, near = 3 } = {}) {
  const lex = typedLexicon(world);
  const Q = new Set(question.map((x) => x.toLowerCase())), S = new Set(skip.map((x) => x.toLowerCase()));
  const toks = String(text).toLowerCase().match(/[\p{L}\p{N}_'-]+/gu) || [];
  const forms = (t) => [t, ...((lemma ?? world.lemma)?.(t) || []), ...(t.endsWith('s') && t.length > 3 ? [t.slice(0, -1)] : []), ...(t.endsWith('es') && t.length > 4 ? [t.slice(0, -2)] : [])];
  // typed words: a multiword entry first (the longest), else each token
  const words = [], unread = [], nearUsed = [];
  let isQuestion = /\?\s*$/.test(text);
  for (let i = 0; i < toks.length; i++) { // bounded: the tokens
    let done = false;
    for (let n = Math.min(4, toks.length - i); n > 1 && !done; n--) { const p = toks.slice(i, i + n).join(' '); if (lex.has(p)) { words.push({ at: i, text: p, senses: lex.get(p) }); i += n - 1; done = true; } }
    if (done) continue;
    const t = toks[i];
    if (Q.has(t)) { isQuestion = true; continue; }
    if (S.has(t)) continue;
    const f = forms(t).find((x) => lex.has(x));
    if (f) { words.push({ at: i, text: t, senses: lex.get(f) }); continue; }
    // lexical generalisation: an unknown word read as its nearest known word through word senses, with a cost
    let alt = near > 0 ? choose(world, 'word', forms(t).flatMap((x) => nearWords(world, x, { senses })).filter((x) => x.cost <= near).map((x) => ({ ...x, misfit: !lex.has(x.word) }))).best : null; // one way to choose (std.decide, kind word)
    if (alt && alt.misfit) alt = null;
    if (alt) { words.push({ at: i, text: alt.word, senses: lex.get(alt.word), near: { word: t, as: alt.word, cost: alt.cost, via: alt.via } }); nearUsed.push({ word: t, as: alt.word, cost: alt.cost, via: alt.via }); } else unread.push(t);
  }
  const frames = [];
  const things = words.flatMap((w) => w.senses.filter((s) => s.cat === 'thing' || s.cat === 'kind').map((s) => ({ w, s })));
  const attrs = words.flatMap((w) => w.senses.filter((s) => s.cat === 'attr').map((s) => ({ w, s })));
  const acts = words.flatMap((w) => w.senses.filter((s) => s.cat === 'act').map((s) => ({ w, s })));
  // relations: an attribute and a holder whose type carries it (or whose facts carry it)
  for (const a of attrs) for (const h of things) {
    if (a.w === h.w) continue;
    const holderFacts = h.s.cat === 'thing' ? [world.get(h.s.id)] : [...world.wires.values()].filter((x) => (h.s.type && x.type === h.s.type) || (h.s.kind && (x.attrs[h.s.key] || []).some((v) => bare(v) === h.s.kind)));
    const carry = holderFacts.filter((x) => x?.attrs[a.s.key]);
    const declared = !carry.length && a.s.declared && holderFacts.some((x) => a.s.holders.includes(x?.type)); // a relation the knowledge declares for this kind, with no value yet
    if (!carry.length && !declared) continue;
    const used = new Set([a.w, h.w]);
    const left = words.filter((w) => !used.has(w) && !w.senses.some((s) => s.cat === 'act' || s.cat === 'word')).length; // words the frame leaves unread (a verb like "make" or "have" is the relation's)
    const near = 1 / (1 + Math.abs(a.w.at - h.w.at)); // order only ranks
    frames.push({ frame: { is: 'ask', key: a.s.key, of: h.s.cat === 'thing' ? { id: h.s.id } : { kind: h.s.kind ?? h.s.type }, answer: carry.flatMap((x) => (x.attrs[a.s.key] || []).map(bare)), ...(declared ? { known: false } : {}) },
      score: +(2 + (isQuestion ? 1 : 0) + (h.s.cat === 'thing' ? 0.5 : 0) - left + near * 0.1).toFixed(3), left, words: [h.w.text, a.w.text] });
  }
  // the inverse: a value and a kind of holder (which animal says moo): the holders of that kind with it
  const values = words.flatMap((w) => w.senses.filter((s) => s.cat === 'value').map((s) => ({ w, s })));
  const kinds = things.filter(({ s }) => s.cat === 'kind');
  for (const v of values) {
    const ks = kinds.filter((k) => k.w !== v.w);
    for (const k of ks.length ? ks : [null]) {
      const holders = [...world.wires.values()].filter((x) => (x.attrs[v.s.key] || []).some((y) => bare(y).toLowerCase() === v.w.text) && (!k || (k.s.type && x.type === k.s.type) || (k.s.kind && (x.attrs[k.s.key] || []).some((y) => bare(y) === k.s.kind))));
      if (!holders.length) continue;
      const used = new Set([v.w, k?.w].filter(Boolean)), left = words.filter((w) => !used.has(w) && !w.senses.some((s) => s.cat === 'act' || s.cat === 'word')).length;
      frames.push({ frame: { is: 'find', key: v.s.key, value: v.w.text, ...(k ? { kind: k.s.kind ?? k.s.type } : {}), answer: holders.map((x) => x.id) }, score: +(2 + (isQuestion ? 1 : 0) + (k ? 0.5 : 0) - left).toFixed(3), left, words: [...used].map((w) => w.text) });
    }
  }
  // acts: an act word with typed arguments (act frames, reviewer 23:05): the kind to make (a type), the thing
  // to act on (a name), and the values of the kind's or thing's slots (a value of a closed set, by its key)
  for (const a of acts) {
    const args = {}, used = new Set([a.w]);
    const kind = things.find(({ w, s }) => !used.has(w) && s.cat === 'kind' && s.type);
    const thing = things.find(({ w, s }) => !used.has(w) && s.cat === 'thing');
    if (a.s.act === 'make' || !thing) { if (kind) { args.kind = kind.s.type; used.add(kind.w); } }
    if (a.s.act !== 'make' && thing) { args.thing = thing.s.id; used.add(thing.w); }
    const holder = args.kind ?? (args.thing && world.get(args.thing)?.type);
    for (const v of words.flatMap((w) => w.senses.filter((s) => s.cat === 'value' && s.schema).map((s) => ({ w, s })))) {
      if (used.has(v.w) || (holder && v.s.type !== holder && !(world._compiled?.().isA?.(holder, v.s.type)))) continue;
      args[v.s.key] = v.w.text; used.add(v.w);
    }
    const left = words.filter((w) => !used.has(w) && !w.senses.some((s) => s.cat === 'word')).length;
    frames.push({ frame: { is: 'act', act: a.s.act, args }, score: +(1 + Object.keys(args).length + (isQuestion ? 0 : 1) - left).toFixed(3), left, words: [...used].map((w) => w.text) });
  }
  for (const fr of frames) { fr.cost = words.filter((w) => w.near && fr.words.includes(w.text)).reduce((x, w) => x + w.near.cost, 0); fr.score = +(fr.score - fr.cost * 0.2).toFixed(3); } // a near word costs
  // one way to choose (std.decide, kind reading): coverage (words left unread), the cost of near words, specificity, then the score as prior
  const ordered = choose(world, 'reading', frames.map((f) => ({ f, violations: 0, unread: f.left ?? 0, missing: 0, cost: f.cost, specificity: f.words.length, prior: f.score }))).order.map((x) => x.f);
  frames.splice(0, frames.length, ...ordered);
  for (const f of frames) delete f.left;
  const best = frames[0] ?? null;
  const ambiguous = frames.length > 1 && frames[1].score === best.score && JSON.stringify(frames[1].frame) !== JSON.stringify(best.frame);
  // completeness (reviewer 03:20): a reading that leaves content words unconsumed is not final
  const usedWords = new Set(best?.words ?? []);
  const left = words.filter((w) => !usedWords.has(w.text) && !w.senses.some((s) => s.cat === 'word' || s.cat === 'act')).map((w) => w.near?.word ?? w.text);
  const complete = !!best && !unread.length && !left.length;
  return { frames, best: best?.frame ?? null, ...(ambiguous ? { ambiguous: true } : {}), unread, left, complete, ...(nearUsed.length ? { near: nearUsed } : {}) };
}
