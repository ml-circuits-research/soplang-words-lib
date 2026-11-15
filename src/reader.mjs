// One Reader contract (architecture review finding 7, reviewer 10:10 R2): every reader of the library answers
// in one shape, so an ensemble, a related-case read-back or a rule learner can swap them, and completeness is
// computed from data, never claimed by a pattern (the real case "a diagram in the shape of a house": the
// words a reading did not use were taken as arguments and the reading was called complete).
//
//   readText(world, text, { reader, ... }) -> {
//     candidates: [{ frame, unread: [words], repaired: [{ from, to }], cost, specificity }],
//     best, unread, repaired, mood, complete, why }
//
// `mood` (question | wish | imperative | statement | fragment) is read before the act: a first-person declarative
// ("I have two kids", "I like cats") is a statement, not a request, and an act frame needs an imperative or a
// question. A reading is complete only when it left no word unread, needed no respelling but confident typos (then
// `named`), and its frame fits the mood. The mood words come from the language world (`<lang>.wh`, `<lang>.aux`, `<lang>.pron`,
// `<lang>.det`), with English defaults for a world that has none.

import { readByTypes, typedLexicon } from './readtypes.mjs';
import { memoPerWorld } from './memo.mjs';
import { readFrames } from './frames.mjs';
import { readCanonical } from './alternate.mjs';
import { valueText } from './parser.mjs';
import { editDistance } from './interpret.mjs';

const EN = {
  wh: ['what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'],
  aux: ['is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'have', 'has'],
  self: ['i', 'we', 'my', 'our'],
  articles: ['a', 'an', 'the'],
  polite: ['please', 'pls', 'plz', 'kindly'],
};

function moodWords(world, lang) {
  return memoPerWorld(world ?? NOWORLD, `mood-words|${lang}`, () => {
    const texts = (type, pred = () => true) => (world?.ofType?.(type) ?? []).filter(pred).flatMap((w) => [...(w.attrs.text || []), ...(w.attrs.form || []), ...(w.attrs.word || [])].map((v) => valueText(v).toLowerCase()));
    const pick = (got, dflt) => (got.length ? got : dflt);
    const fn = (view, at) => texts(`${lang}.fn`, (w) => (w.attrs.view || []).map(valueText).includes(view) && (!at || at.includes(valueText(w.attrs.at?.[0])))).map((t) => t.replace(/['’]/g, ''));
    const polite = pick(fn('politeness'), EN.polite);
    return {
      wh: pick(texts(`${lang}.wh`), EN.wh),
      aux: pick(texts(`${lang}.aux`), EN.aux),
      self: pick(texts(`${lang}.pron`, (w) => valueText(w.attrs.person?.[0]) === '1'), EN.self),
      articles: pick(texts(`${lang}.det`), EN.articles),
      polite, // politeness of the language world (w.lang.en.fn view=politeness): "please", "could you", "thanks"
      politeLead: polite.filter((p) => p.includes(' ')), // "could you", "can you": a request, not a question
      fill: [...fn('filler', ['lead']), ...fn('hesitation')], // passed over at the start: "so", "um", "ok"
      wishLead: fn('wish', ['lead']), // "i want", "id like", "give me", "lets": a wish is a request
      wishAny: fn('wish', ['any']), // "want", "need", "would like" after the speaker: "I really want a circle"
    };
  });
}
const NOWORLD = { version: 0 };

/**
 * The mood of a text: `question` (a final ?, or a question word or auxiliary first), `wish` (a wish of the language
 * world first, `w.lang.en.fn view=wish`: "I want a red circle", "I'd like 2 tables": a request), `statement` (a
 * first-person subject first: "I have two kids", "my name is Ana"; or a name then an auxiliary: "Tom has 5 apples",
 * unless the name is a thing of the world: "Berlin is the capital"), `fragment` (nothing, only articles and single
 * letters, or the speaker alone: "my", "an a"), else `imperative` (also after a polite lead: "could you add a table").
 * Hesitations, lead fillers and politeness of the language world are passed over. Options: `lang` ('w.lang.en'),
 * `acts(word) -> boolean` (a word of an act), `things(word) -> boolean` (a name of the world; default: a thing word of
 * the world's typed lexicon), `detail` (return { mood, by }: by = empty | article | self | name | mark | wh | aux |
 * wish | polite | verb).
 */
export function moodOf(world, text, { lang = 'w.lang.en', acts, things, detail = false } = {}) {
  const W = moodWords(world, lang);
  const out = (mood, by) => (detail ? { mood, by } : mood);
  const raw = String(text ?? '').trim();
  let toks = raw.toLowerCase().replace(/['’]/g, '').match(/[\p{L}\p{N}-]+/gu) || [];
  const lead = (list) => { for (const p of [...list].sort((a, b) => b.length - a.length)) { const ps = p.split(/\s+/); if (ps.every((x, i) => toks[i] === x)) return ps.length; } return 0; }; // bounded: the list
  for (let n = lead(W.fill); n && toks.length; n = lead(W.fill)) toks = toks.slice(n); // bounded: each pass drops words
  const pl = lead(W.politeLead), wl = lead(W.wishLead);
  if (pl) return out(toks.length > pl ? 'imperative' : 'fragment', 'polite');
  if (wl) return out(toks.length > wl ? 'wish' : 'fragment', 'wish');
  toks = toks.filter((t) => !W.polite.includes(t));
  if (!toks.length) return out('fragment', 'empty');
  if (toks.length === 1 && W.self.includes(toks[0])) return out('fragment', 'self'); // "my": a subject alone
  if (toks.every((t) => W.articles.includes(t) || /^\p{L}$/u.test(t))) return out('fragment', 'article'); // "a", "an a", "x
  if (raw.endsWith('?')) return out('question', 'mark');
  if (W.wh.includes(toks[0])) return out('question', 'wh');
  if (W.aux.includes(toks[0]) && toks.length > 1 && !acts?.(toks[0])) return out('question', 'aux');
  const near = toks.slice(1, 4).join(' ');
  if (W.self.includes(toks[0]) && W.wishAny.some((w) => ` ${near} `.includes(` ${w} `))) return out('wish', 'wish'); // "I really want", "we would like"
  if (W.self.includes(toks[0]) || toks[0] === 'im') return out('statement', 'self');
  const first = (raw.match(/[\p{L}\p{N}'-]+/gu) || [])[0] ?? '';
  const isThing = things ?? ((w) => (world?.ofType ? typedLexicon(world).get(w.toLowerCase()) || [] : []).some((e) => e.cat === 'thing'));
  if (/^\p{Lu}/u.test(first) && toks.length > 2 && !acts?.(toks[0]) && W.aux.includes(toks[1]) && !isThing(first)) return out('statement', 'name'); // a name, then is / has: "Tom has 5 apples"
  return out('imperative', 'verb');
}

const asWords = (u) => (Array.isArray(u) ? u.map(String) : typeof u === 'number' ? Array.from({ length: u }, () => '?') : []);
// a word read through its senses (a synonym, a kind) is a generalisation with a cost; a respelling (via a
// speller: `via: 'spelling'`) is a repair, and a repaired reading is not a full one
const respelt = (near) => (near || []).filter((x) => x.via === 'spelling').map((x) => ({ from: x.word, to: x.as, confident: confidentTypo(x.word, x.as) }));
/**
 * A respelling the reader may take without asking (a host's Q22 L1, real r0296): the typed word is unknown (a speller only
 * respells those), both are whole words of 4 letters or more, within the spelling budget (1 edit, 2 from 8 letters),
 * and the first letter is kept or the first two are swapped.
 */
export function confidentTypo(from, to) {
  const a = String(from ?? '').toLowerCase(), b = String(to ?? '').toLowerCase();
  if (a.length < 4 || b.length < 4 || a === b) return false;
  const budget = Math.max(a.length, b.length) >= 8 ? 2 : 1;
  if (editDistance(a, b, budget) > budget) return false;
  return a[0] === b[0] || (a[0] === b[1] && a[1] === b[0]);
}
const isAct = (f) => !!f && (f.is === 'act' || f.act !== undefined) && f.is !== 'ask' && f.is !== 'find';

/** The library's readers under the contract: (world, text, opts) -> [{ frame, unread, repaired, cost, specificity }]. */
export const READERS = {
  types: (world, text, o = {}) => {
    const r = readByTypes(world, text, o.read ?? o);
    return r.frames.map((f) => ({ frame: f.frame, unread: [...r.unread, ...(f.frame === r.best ? r.left || [] : [])], repaired: respelt(r.near), cost: f.cost ?? 0, specificity: f.words?.length ?? 0 }));
  },
  frames: (world, text, o = {}) => readFrames(world, text, o).frames.map((f) => ({ frame: { is: 'act', act: f.act, en: f.en, frame: f.frame, mode: f.mode, roles: f.roles }, unread: [], repaired: [], cost: 0, specificity: Object.keys(f.roles).length })),
  canonical: (world, text, o = {}) => readCanonical(world, text, o).filter((c) => c.frame).map((c) => ({ frame: c.frame, unread: asWords(c.unread), repaired: respelt(c.near), cost: (c.near || []).length + c.applied.length * 0.5, specificity: 0 })),
};

/**
 * Read `text` with a reader under the one contract. `reader`: a name of READERS ('types', 'frames',
 * 'canonical') or a function (world, text, opts) -> candidates (any of the library's voices, a host's
 * pattern reader). Candidates are ranked: fewer words unread, then fewer repairs, then lower cost, then more
 * specific. The result: { candidates, best, unread, repaired, mood, complete, why }.
 */
export function readText(world, text, { reader = 'types', lang = 'w.lang.en', ...opts } = {}) {
  const fn = typeof reader === 'function' ? reader : READERS[reader];
  if (!fn) throw new Error(`sopworld: readText: no reader ${reader}`);
  const actWord = (t) => (opts.actWords ?? []).includes(t);
  const mood = moodOf(world, text, { lang, acts: opts.actWords ? actWord : undefined });
  const candidates = (fn(world, text, opts) || []).map((c) => ({ frame: c.frame ?? null, unread: asWords(c.unread), repaired: c.repaired ?? [], cost: c.cost ?? 0, specificity: c.specificity ?? 0 }))
    .filter((c) => c.frame)
    .sort((a, b) => a.unread.length - b.unread.length || a.repaired.length - b.repaired.length || a.cost - b.cost || b.specificity - a.specificity);
  const best = candidates[0] ?? null;
  const unsure = (best?.repaired || []).filter((r) => !r.confident);
  const why = !best ? 'no reading' : best.unread.length ? `words not read: ${best.unread.join(' ')}` : unsure.length ? `read after respelling ${unsure.map((r) => r.from).join(', ')}` : mood === 'fragment' ? 'a fragment' : mood === 'statement' && isAct(best.frame) ? 'a statement, not a request' : null;
  const named = !why && best?.repaired.length ? best.repaired : null; // complete after confident typos only: the reply names them
  return { candidates, best: best?.frame ?? null, unread: best?.unread ?? [], repaired: best?.repaired ?? [], mood, complete: !!best && !why, ...(named ? { named } : {}), ...(why ? { why } : {}) };
}
