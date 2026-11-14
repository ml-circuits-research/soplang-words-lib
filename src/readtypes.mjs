// Type-driven reading (abstraction round, item 1; questions.md Q54): a question or a request is read
// by the TYPES of its content words, not by one fixed word order. Each content word is typed
// through the world itself: a thing (a fact's name), a kind (a type, or a kind / class value), an
// attribute (a key that facts of some type carry), an act (a word of an action). The candidate
// frames are every relation and act whose argument types the typed words fill, each word used at
// most once; word order and function words only rank them. So "what sound does a cow make", "a
// cow makes which sound" and "cow sound?" are one frame: the attribute `sound` of the thing `cow`.

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const cache = new WeakMap();

/** The world's own lexicon: word -> [{ cat: thing | kind | attr | act, ... }]. Memoised per world. */
export function typedLexicon(world) {
  const hit = cache.get(world);
  if (hit && hit.size === world.wires.size) return hit.lex;
  const lex = new Map(), add = (word, e) => { const k = String(word).toLowerCase().replace(/_/g, ' '); (lex.get(k) || lex.set(k, []).get(k)).push(e); };
  const holders = new Map(); // key -> types that carry it
  for (const w of world.wires.values()) {
    if (w.type.startsWith('core.') || w.type.startsWith('std.')) continue;
    for (const n of w.attrs.name || []) add(bare(n), { cat: 'thing', id: w.id, type: w.type });
    for (const k of ['kind', 'class', 'is']) for (const v of w.attrs[k] || []) add(bare(v), { cat: 'kind', kind: bare(v), key: k });
    for (const k of Object.keys(w.attrs)) if (!k.startsWith('core.') && k !== 'name') (holders.get(k) || holders.set(k, new Set()).get(k)).add(w.type);
    for (const [k, vs] of Object.entries(w.attrs)) if (!k.startsWith('core.') && !['name', 'kind', 'class', 'is', 'about'].includes(k)) for (const v of vs) if (!/^-?\d/.test(bare(v)) && v[0] !== '$') add(bare(v), { cat: 'value', key: k, id: w.id, type: w.type });
  }
  for (const [k, ts] of holders) if (!['kind', 'class', 'is', 'about'].includes(k)) add(k, { cat: 'attr', key: k, holders: [...ts] });
  for (const t of new Set([...world.wires.values()].map((w) => w.type))) if (!t.startsWith('core.') && !t.startsWith('std.')) add(t.split('.').pop(), { cat: 'kind', type: t });
  const actions = world._compiled?.().actions;
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
export function readByTypes(world, text, { question = [], skip = [], lemma } = {}) {
  const lex = typedLexicon(world);
  const Q = new Set(question.map((x) => x.toLowerCase())), S = new Set(skip.map((x) => x.toLowerCase()));
  const toks = String(text).toLowerCase().match(/[\p{L}\p{N}_'-]+/gu) || [];
  const forms = (t) => [t, ...((lemma ?? world.lemma)?.(t) || []), ...(t.endsWith('s') && t.length > 3 ? [t.slice(0, -1)] : []), ...(t.endsWith('es') && t.length > 4 ? [t.slice(0, -2)] : [])];
  // typed words: a multiword entry first (the longest), else each token
  const words = [], unread = [];
  let isQuestion = /\?\s*$/.test(text);
  for (let i = 0; i < toks.length; i++) { // bounded: the tokens
    let done = false;
    for (let n = Math.min(4, toks.length - i); n > 1 && !done; n--) { const p = toks.slice(i, i + n).join(' '); if (lex.has(p)) { words.push({ at: i, text: p, senses: lex.get(p) }); i += n - 1; done = true; } }
    if (done) continue;
    const t = toks[i];
    if (Q.has(t)) { isQuestion = true; continue; }
    if (S.has(t)) continue;
    const f = forms(t).find((x) => lex.has(x));
    if (f) words.push({ at: i, text: t, senses: lex.get(f) }); else unread.push(t);
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
    if (!carry.length) continue;
    const used = new Set([a.w, h.w]);
    const left = words.filter((w) => !used.has(w) && !w.senses.some((s) => s.cat === 'act' || s.cat === 'word')).length; // words the frame leaves unread (a verb like "make" or "have" is the relation's)
    const near = 1 / (1 + Math.abs(a.w.at - h.w.at)); // order only ranks
    frames.push({ frame: { is: 'ask', key: a.s.key, of: h.s.cat === 'thing' ? { id: h.s.id } : { kind: h.s.kind ?? h.s.type }, answer: carry.flatMap((x) => (x.attrs[a.s.key] || []).map(bare)) },
      score: +(2 + (isQuestion ? 1 : 0) + (h.s.cat === 'thing' ? 0.5 : 0) - left + near * 0.1).toFixed(3), words: [h.w.text, a.w.text] });
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
      frames.push({ frame: { is: 'find', key: v.s.key, value: v.w.text, ...(k ? { kind: k.s.kind ?? k.s.type } : {}), answer: holders.map((x) => x.id) }, score: +(2 + (isQuestion ? 1 : 0) + (k ? 0.5 : 0) - left).toFixed(3), words: [...used].map((w) => w.text) });
    }
  }
  // acts: an act word and the things whose types fit its arguments
  for (const a of acts) {
    const spec = world._compiled?.().actions.get(a.s.act) ?? world._compiled?.().actions.get(`"${a.s.act}"`);
    const roles = spec?.args ? Object.entries(spec.args) : [];
    const args = {}, used = new Set([a.w]);
    for (const [role, r] of roles) { // bounded: the roles of the act
      const fit = things.find(({ w, s }) => !used.has(w) && s.cat === 'thing' && (!r?.type || r.type === s.type || (r.refs || []).includes(s.type)));
      if (fit) { args[role] = fit.s.id; used.add(fit.w); }
    }
    const left = words.filter((w) => !used.has(w)).length;
    frames.push({ frame: { is: 'act', act: a.s.act, args }, score: +(1 + Object.keys(args).length + (isQuestion ? 0 : 0.5) - left).toFixed(3), words: [...used].map((w) => w.text) });
  }
  frames.sort((x, y) => y.score - x.score);
  const best = frames[0] ?? null;
  const ambiguous = frames.length > 1 && frames[1].score === best.score && JSON.stringify(frames[1].frame) !== JSON.stringify(best.frame);
  return { frames, best: best?.frame ?? null, ...(ambiguous ? { ambiguous: true } : {}), unread };
}
