// One Reader contract (architecture review finding 7, reviewer 10:10 R2): every reader of the library answers
// in one shape, so an ensemble, a related-case read-back or a rule learner can swap them, and completeness is
// computed from data, never claimed by a pattern (the real case "a diagram in the shape of a house": the
// words a reading did not use were taken as arguments and the reading was called complete).
//
//   readText(world, text, { reader, ... }) -> {
//     candidates: [{ frame, unread: [words], repaired: [{ from, to }], cost, specificity }],
//     best, unread, repaired, mood, complete, why }
//
// `mood` (question | imperative | statement | fragment) is read before the act: a first-person declarative
// ("I have two kids", "I like cats") is a statement, not a request, and an act frame needs an imperative or a
// question. A reading is complete only when it left no word unread, needed no respelling, and its frame fits
// the mood. The mood words come from the language world (`<lang>.wh`, `<lang>.aux`, `<lang>.pron`,
// `<lang>.det`), with English defaults for a world that has none.

import { readByTypes } from './readtypes.mjs';
import { readFrames } from './frames.mjs';
import { readCanonical } from './alternate.mjs';
import { valueText } from './parser.mjs';

const EN = {
  wh: ['what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'],
  aux: ['is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'have', 'has'],
  self: ['i', 'we', 'my', 'our'],
  articles: ['a', 'an', 'the'],
  polite: ['please', 'pls', 'plz', 'kindly'],
};

function moodWords(world, lang) {
  const texts = (type, pred = () => true) => (world?.ofType?.(type) ?? []).filter(pred).flatMap((w) => [...(w.attrs.text || []), ...(w.attrs.form || []), ...(w.attrs.word || [])].map((v) => valueText(v).toLowerCase()));
  const pick = (got, dflt) => (got.length ? got : dflt);
  return {
    wh: pick(texts(`${lang}.wh`), EN.wh),
    aux: pick(texts(`${lang}.aux`), EN.aux),
    self: pick(texts(`${lang}.pron`, (w) => valueText(w.attrs.person?.[0]) === '1'), EN.self),
    articles: pick(texts(`${lang}.det`), EN.articles),
    polite: EN.polite,
  };
}

/**
 * The mood of a text: `question` (a final ?, or a question word or auxiliary first), `statement` (a
 * first-person subject first: "I have two kids", "my name is Ana"; or a name then an auxiliary: "Tom has 5
 * apples"), `fragment` (one word that is an article or a single letter, or nothing), else
 * `imperative`. Options: `lang` ('w.lang.en'), `acts(word) -> boolean` (a word of an act).
 */
export function moodOf(world, text, { lang = 'w.lang.en', acts } = {}) {
  const W = moodWords(world, lang);
  const raw = String(text ?? '').trim();
  const toks = (raw.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) || []).filter((t) => !W.polite.includes(t));
  if (!toks.length) return 'fragment';
  if (toks.length === 1 && (W.articles.includes(toks[0]) || /^\p{L}$/u.test(toks[0]))) return 'fragment';
  if (raw.endsWith('?') || W.wh.includes(toks[0]) || (W.aux.includes(toks[0]) && toks.length > 1 && !acts?.(toks[0]))) return 'question';
  if (W.self.includes(toks[0]) || toks[0] === "i'm" || toks[0] === 'im') return 'statement';
  const first = (raw.match(/[\p{L}\p{N}'-]+/gu) || [])[0] ?? '';
  if (/^\p{Lu}/u.test(first) && toks.length > 2 && !acts?.(toks[0]) && W.aux.includes(toks[1])) return 'statement'; // a name, then is / has: "Tom has 5 apples"
  return 'imperative';
}

const asWords = (u) => (Array.isArray(u) ? u.map(String) : typeof u === 'number' ? Array.from({ length: u }, () => '?') : []);
// a word read through its senses (a synonym, a kind) is a generalisation with a cost; a respelling (via a
// speller: `via: 'spelling'`) is a repair, and a repaired reading is not a full one
const respelt = (near) => (near || []).filter((x) => x.via === 'spelling').map((x) => ({ from: x.word, to: x.as }));
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
  const why = !best ? 'no reading' : best.unread.length ? `words not read: ${best.unread.join(' ')}` : best.repaired.length ? `read after respelling ${best.repaired.map((r) => r.from).join(', ')}` : mood === 'fragment' ? 'a fragment' : mood === 'statement' && isAct(best.frame) ? 'a statement, not a request' : null;
  return { candidates, best: best?.frame ?? null, unread: best?.unread ?? [], repaired: best?.repaired ?? [], mood, complete: !!best && !why, ...(why ? { why } : {}) };
}
