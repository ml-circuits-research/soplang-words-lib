// A contextual spell repair (owner 2026-11-15, psys2 Q39): generic, deterministic, no world ids, no per-app code.
//
//   repairWords(tokens, { worlds, dialogue, lang, language, lexicon, dictionary, protect }) -> { tokens, repairs, asks }
//
// Candidates come from, in order of trust (SPELL_SOURCES, data): the open (first) world, the other live worlds, the
// dialogue's recent words, the language dictionary. A world's words are read from `factsOf` (thing names, labels,
// string values, kinds) and from its declarations (kinds, words, actions). A token is repaired only when one candidate
// is clearly the best within the threshold (SPELL); close candidates give an ask. Known words, numbers, capitalized
// names, quoted text and any word of a world are never changed.
import { factsOf } from './reason.mjs';
import { memoPerWorld } from './memo.mjs';

/** The source prior, as data: added to the edit cost when candidates are ranked (not to the threshold). */
export const SPELL_SOURCES = Object.freeze([{ source: 'world', prior: 0 }, { source: 'worlds', prior: 0.1 }, { source: 'dialogue', prior: 0.2 }, { source: 'dictionary', prior: 0.3 }]);
/** The bounds: shortest repaired word, the edit cost allowed (short / long word), the margin to the runner-up, asks listed. */
export const SPELL = Object.freeze({ minLength: 4, maxCostShort: 1.0, maxCostLong: 1.2, margin: 0.25, top: 3, maxWords: 200000, recent: 200 });
/** The edit costs: adjacent key, missing diacritic, doubled or dropped letter, swapped neighbours, any other edit. */
export const SPELL_COSTS = Object.freeze({ near: 0.4, accent: 0.1, doubled: 0.5, swap: 0.6, other: 1 });

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const POS = new Map();
ROWS.forEach((r, y) => [...r].forEach((c, x) => POS.set(c, [x + y * 0.5, y])));
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');
const adjacent = (a, b) => { const p = POS.get(a), q = POS.get(b); return !!p && !!q && Math.abs(p[0] - q[0]) <= 1 && Math.abs(p[1] - q[1]) <= 1; };
const sub = (a, b) => (a === b ? 0 : fold(a) === fold(b) ? SPELL_COSTS.accent : adjacent(fold(a), fold(b)) ? SPELL_COSTS.near : SPELL_COSTS.other);

/** Keyboard-aware weighted Damerau-Levenshtein distance between two lower-case words, cut off above `max` (then Infinity). */
export function editCost(a, b, max = Infinity) {
  const n = a.length, m = b.length;
  if (Math.abs(n - m) * SPELL_COSTS.doubled > max) return Infinity;
  const gap = (s, i) => (i > 0 && s[i] === s[i - 1] ? SPELL_COSTS.doubled : (i + 1 < s.length && s[i] === s[i + 1] ? SPELL_COSTS.doubled : SPELL_COSTS.other));
  let prev2 = null, prev = Array.from({ length: m + 1 }, (_, j) => j === 0 ? 0 : prev0(b, j, gap));
  for (let i = 1; i <= n; i++) { // bounded: the two words' letters
    const row = [prev[0] + gap(a, i - 1)];
    let low = row[0];
    for (let j = 1; j <= m; j++) { // bounded: the two words' letters
      let v = Math.min(prev[j - 1] + sub(a[i - 1], b[j - 1]), prev[j] + gap(a, i - 1), row[j - 1] + gap(b, j - 1));
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + SPELL_COSTS.swap);
      row.push(v); if (v < low) low = v;
    }
    if (low > max) return Infinity;
    prev2 = prev; prev = row;
  }
  return prev[m] <= max ? prev[m] : Infinity;
}
function prev0(b, j, gap) { let s = 0; for (let k = 0; k < j; k++) s += gap(b, k); return s; } // bounded: the word's letters

const wordsIn = (text) => String(text ?? '').toLowerCase().match(/[\p{L}][\p{L}'-]*/gu)?.map((w) => w.replace(/['-]+$/, '')).filter((w) => w.length >= 2) ?? [];
const plain = (t) => String(t).replace(/^\$/, '').split('.').pop().replace(/_/g, ' ');

/** The words a world offers: thing names, labels, string values, kinds, and its declared kinds, words and actions. */
export function worldWords(world) {
  if (!world || typeof world.version === 'undefined') return new Set();
  return memoPerWorld(world, 'spell|words', () => {
    const out = new Set();
    const add = (t) => { for (const w of wordsIn(plain(t))) out.add(w); };
    let view = null;
    try { view = factsOf(world); } catch { /* a world without facts offers its declarations only */ }
    if (view) for (const id of view.ids()) {
      const r = view.thing(id);
      add(id.split('.').pop());
      for (const k of r.kinds) if (!String(k).startsWith('std.')) add(k);
      for (const vs of r.attrs.values()) for (const v of vs) if (typeof v === 'string') add(v);
    }
    const c = world._compiled?.();
    if (c) {
      for (const a of c.actions?.keys?.() ?? []) add(a);
      for (const t of c.slots?.keys?.() ?? []) add(t);
    }
    for (const f of world.ofType?.('std.schema.kind') ?? []) for (const v of f.attrs.of ?? []) add(v);
    for (const f of world.ofType?.('core.word') ?? []) for (const v of [...(f.attrs.text ?? []), ...(f.attrs.means ?? [])]) add(v);
    return out;
  });
}

/** The words of a language world (the `text`, `form` and `lead` values of its `<lang>.*` wires), built once per version. */
export function languageWords(language, lang = 'w.lang.en') {
  if (!language?.wires) return new Set();
  return memoPerWorld(language, `spell|lang|${lang}`, () => {
    const out = new Set();
    for (const [, x] of language.wires) { // bounded: the wires of the language world
      if (!x.type?.startsWith(`${lang}.`) || out.size > SPELL.maxWords) continue;
      for (const k of ['text', 'form', 'lead', 'trail', 'between']) for (const v of x.attrs?.[k] ?? []) for (const w of wordsIn(typeof v === 'string' ? v.replace(/^"|"$/g, '') : v)) out.add(w); // bounded: a wire's values
    }
    return out;
  });
}

const capitalised = (t) => /^\p{Lu}/u.test(t);

/**
 * Repair the words of one message. `tokens`: strings (the case they were typed in is read: a capitalized word that does
 * not start the message is a name) or a text. `opts`: `worlds` (live worlds; the first is the open one), `dialogue`
 * ({ words, last, history }: its recent words), `lang` (default w.lang.en), `language` (the language world),
 * `lexicon` and `dictionary` (more words of the open world / of the language), `protect` (lower-case words never
 * changed), `sources` (default SPELL_SOURCES), `bounds` (default SPELL).
 * Returns { tokens, repairs: [{ from, to, source, cost, at }], asks: [{ from, candidates: [{ word, source, cost }], at }] }.
 */
export function repairWords(tokens, opts = {}) {
  const list = typeof tokens === 'string' ? (tokens.match(/"[^"]*"|\d+(?:\.\d+)?|[\p{L}][\p{L}'_]*|\S/gu) ?? []) : [...tokens];
  const B = { ...SPELL, ...(opts.bounds ?? {}) };
  const priors = new Map((opts.sources ?? SPELL_SOURCES).map((s) => [s.source, s.prior]));
  const lang = opts.lang ?? 'w.lang.en';
  const worlds = [].concat(opts.worlds ?? []).filter(Boolean);
  const pools = new Map(); // source -> Set(words)
  const into = (source, words) => { const s = pools.get(source) ?? new Set(); for (const w of words ?? []) s.add(String(w).toLowerCase()); pools.set(source, s); };
  if (worlds[0]) into('world', worldWords(worlds[0]));
  into('world', opts.lexicon);
  for (const w of worlds.slice(1)) into('worlds', worldWords(w));
  const d = opts.dialogue;
  const recent = [...(d?.words ?? []), ...wordsIn(d?.last?.text), ...[].concat(d?.history ?? []).slice(-B.recent).flatMap(wordsIn)];
  into('dialogue', recent);
  into('dictionary', languageWords(opts.language ?? worlds[0], lang));
  into('dictionary', opts.dictionary);
  const known = new Set(); for (const s of pools.values()) for (const w of s) known.add(w);
  const protect = new Set([...(opts.protect ?? [])].map((w) => String(w).toLowerCase()));
  const out = [], repairs = [], asks = [];
  let quoted = false;
  list.forEach((tok, at) => {
    const t = String(tok);
    if (t.includes('"') || t.includes('“') || t.includes('”')) { if (/^["“].*["”]$/.test(t) && t.length > 1) { out.push(tok); return; } quoted = !quoted; out.push(tok); return; }
    const lower = t.toLowerCase();
    if (quoted || !/^\p{L}[\p{L}'_]*$/u.test(t) || (capitalised(t) && at > 0) || protect.has(lower) || known.has(lower) || lower.length < B.minLength) { out.push(tok); return; }
    const maxCost = lower.length >= 5 ? B.maxCostLong : B.maxCostShort;
    const best = new Map(); // word -> { word, source, cost, score }
    for (const [source, set] of pools) {
      const prior = priors.get(source) ?? 0.3;
      for (const w of set) { // bounded: the candidate words (SPELL.maxWords for a language)
        if (Math.abs(w.length - lower.length) > 2 || w.length < B.minLength - 1) continue;
        const cost = editCost(lower, w, maxCost);
        if (cost === Infinity) continue;
        const score = cost + prior, old = best.get(w);
        if (!old || score < old.score) best.set(w, { word: w, source, cost: +cost.toFixed(3), score });
      }
    }
    const ranked = [...best.values()].sort((a, b) => a.score - b.score || a.word.localeCompare(b.word));
    if (!ranked.length) { out.push(tok); return; }
    if (ranked.length > 1 && ranked[1].score - ranked[0].score < B.margin) {
      asks.push({ from: t, at, candidates: ranked.slice(0, B.top).map(({ word, source, cost }) => ({ word, source, cost })) });
      out.push(tok); return;
    }
    const r = ranked[0];
    repairs.push({ from: t, to: r.word, source: r.source, cost: r.cost, at });
    out.push(capitalised(t) ? r.word[0].toUpperCase() + r.word.slice(1) : r.word);
  });
  return { tokens: out, repairs, asks };
}
