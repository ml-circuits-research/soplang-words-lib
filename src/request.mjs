// What was asked is a world (owner GO 2026-11-15; gap filling is one mechanism of every live world).
//
//   readRequest(world, text, ctx)            -> a live w.request: act, target, constraints, reactions, unread
//   reviseRequest(dialogue, request, opts)   -> a new request, or the last one revised by w.dialogue.revision data
//   planRequest(live, request, opts)         -> the acts with their roles filled, what was assumed, what is not honoured
//   runWorldPlan(live, plan, opts)           -> the acts run through `act` (the last result replaced when asked);
//                                               runPlan (tool.mjs) runs a plan through a world's own acts or its tool binding
//   sayRequest(request, outcome, opts)       -> reply facts (made, assumed, not_honoured, unread) and their text
//
// Everything a world can do is read from its declarations: `std.schema.honours act= on= of=` (the constraints an act
// honours), `std.schema.kind` (what can be made), the slots of its kinds (where a role goes), and expectation facts of the
// k.expect shapes (`k.expect.make`, `k.expect.part`, `k.expect.amount`, `k.expect.scale`) in the world itself or in the
// catalog. The words come from the language world (`<lang>.cue`, determiners, prepositions, number words, inflection).
// Nothing here names a world, a kind or an application.
import { valueText } from './parser.mjs';
import { inflectBy, articleFor } from './morph.mjs';
import { replyFrom } from './kit.mjs';
import { memoPerWorld } from './memo.mjs';
import { seeded, below } from './random.mjs';
import { choose } from './rank.mjs';
import { repairWords } from './spell.mjs';
import { factsOf, kindFactsOf, deduceState, induceStyle, induceCorrections, REASONING } from './reason.mjs';
import { rowsOf, kindLineage, expectedValue, cutToCount, fillToCount, notAllOneKind } from './expect.mjs';

/**
 * The order in which a gap is filled: what the user said, the dialogue state, what is induced from this world's state
 * (the common pattern of its things of a kind, the session's corrections), the world's own facts, the catalog's
 * expectations, a sampled value. A value's place in this list is also its cost as an assumption (said 0).
 */
export const REQUEST_SOURCES = Object.freeze(['said', 'dialogue', 'induced', 'world', 'expect', 'sampled']);
/** The constraint keys of w.request. */
/**
 * The sources of an assumption the reply says (data: `sayRequest` opts.say, or the language world's
 * `<lang>.reply name=assumed say=<source>` values when it has them). Left out: `default`, a tool parameter's declared
 * default, the weakest expectation a person takes for granted. One rule for every key.
 */
/** At most this many assumptions are said in one reply (the strongest by their place in the sources said; `sayRequest` opts.sayMax, or the language's `<lang>.reply name=assumed max=`). */
export const ASSUMED_MAX = 2;
export const ASSUMED_SAY = Object.freeze(['dialogue', 'induced', 'world', 'expect', 'sampled', 'translated', 'custom', 'revised']);
export const REQUEST_KEYS = Object.freeze(['kind', 'count', 'size', 'extent', 'attribute', 'place', 'manner', 'layout', 'with', 'about', 'length']);

/** The catalog types whose names are values of an attribute (read so that a value the world lacks is named, not dropped). */
export const VALUE_TYPES = Object.freeze({ colour: ['k.colours.basic', 'k.colours.colour'] });
const STEPS = ['tiny', 'small', 'default', 'big', 'huge']; // the enum of k.expect.scale step (its order= decides when the facts are given)

// ---- facts from any source: a World, a factStore, an array of either --------------------------------------------
const V = (v) => (typeof v === 'string' ? valueText(v) : v);
const first = (o, k) => o?.[k]?.[0];
const num = (x) => (x === undefined || x === null || x === '' ? undefined : Number(x));
const plain = (t) => String(t).replace(/^\$/, '').split('.').pop().replace(/_/g, ' ');

// ---- tokens ------------------------------------------------------------------------------------------------------
const tokensOf = (text) => (String(text ?? '').toLowerCase().replace(/[’‘]/g, "'").replace(/n't\b/g, ' not').replace(/[–—]/g, '-')
  .match(/\d+(?:\.\d+)?|[\p{L}][\p{L}'_]*|[-,]/gu) ?? []).map((t) => t.replace(/'$/, ''));
const phraseTokens = (p) => tokensOf(p);

/** The words of a language world a reader needs, built once per world version. */
function languageOf(language, lang) {
  return memoPerWorld(language, `request|lang|${lang}`, () => {
    const texts = (type) => rowsOf(language, `${lang}.${type}`).flatMap((r) => [...(r.text ?? []), ...(r.form ?? [])]).map((x) => String(x).toLowerCase());
    const stop = new Set(['det', 'pron', 'prep', 'aux', 'skip', 'closed', 'copula', 'relpron', 'joiner', 'wh', 'anaphor', 'neg'].flatMap((t) => texts(t)).flatMap((t) => (t.includes(' ') ? [] : [t])));
    for (const t of ['a', 'an', 'the', 'and', 'or', 'of', 'to', 'i', 'you', 'it', 'is', 'me', 'my', 'please', ',', '-']) stop.add(t); // the smallest closed words, when a language world has none
    const numbers = new Map();
    for (const r of rowsOf(language, `${lang}.number`)) if ((first(r, 'kind') ?? 'cardinal') === 'cardinal' && first(r, 'value') !== undefined) for (const t of r.text ?? []) numbers.set(String(t).toLowerCase(), Number(first(r, 'value')));
    const anaphors = new Set(texts('anaphor'));
    const placeRefs = new Set(rowsOf(language, `${lang}.pron`).filter((r) => first(r, 'refers') === 'place' || first(r, 'deictic') === 'place').flatMap((r) => r.text ?? []).map((t) => String(t).toLowerCase()).filter((t) => !t.includes(' ')));
    for (const t of ['there', 'here']) placeRefs.add(t);
    for (const t of ['it', 'this', 'that', 'them', 'these', 'those']) anaphors.add(t);
    const dets = new Set(texts('det'));
    for (const t of ['a', 'an', 'the', 'some', 'any', 'this', 'that']) dets.add(t);
    const preps = new Set(texts('prep').filter((t) => !t.includes(' ')));
    for (const t of ['in', 'on', 'at', 'into', 'under', 'near', 'by', 'from', 'to', 'of']) preps.add(t);
    const cues = rowsOf(language, `${lang}.cue`).map((r, n) => ({
      n, name: first(r, 'name'), on: first(r, 'on'), want: first(r, 'want'), value: first(r, 'value'), relation: first(r, 'relation'), attribute: first(r, 'attribute'),
      bound: first(r, 'bound'), amount: first(r, 'amount'), step: first(r, 'step'), unit: first(r, 'unit'), takes: first(r, 'takes') ?? 'none', priority: num(first(r, 'priority')) ?? 1,
      lead: (r.lead ?? []).map(phraseTokens), between: (r.between ?? []).map(phraseTokens), trail: (r.trail ?? []).map(phraseTokens),
    }));
    const plural = (w) => { try { return inflectBy(language, w, 'plural', { types: { rule: `${lang}.inflect`, irregular: `${lang}.irregular` } }); } catch { return null; } };
    // definite determiners (the language's `definite=yes`): a kind said with one refers to things that are there
    const definite = new Set(rowsOf(language, `${lang}.det`).filter((r) => first(r, 'definite') === 'yes').flatMap((r) => r.text ?? []).map((t) => String(t).toLowerCase()));
    if (!definite.size) for (const t of ['the', 'this', 'that', 'these', 'those']) definite.add(t);
    const indefinite = new Set(rowsOf(language, `${lang}.det`).filter((r) => first(r, 'definite') === 'no' && first(r, 'number') === 'sg').flatMap((r) => r.text ?? []).map((t) => String(t).toLowerCase()));
    if (!indefinite.size) for (const t of ['a', 'an']) indefinite.add(t);
    const joiners = new Set(texts('joiner').filter((t) => !t.includes(' ')));
    for (const t of ['and', ',']) joiners.add(t);
    // a word that alone is a noun phrase of the set of all things (the language's grammar: a rule NP -> <cat> whose
    // construction has set=all, and the words of that cat): "everything"
    const allCons = new Set(rowsOf(language, `${lang}.construction`).filter((r) => first(r, 'set') === 'all').map((r) => first(r, 'name')));
    const allCats = new Set(rowsOf(language, `${lang}.rule`).filter((r) => first(r, 'lhs') === 'NP' && (r.rhs ?? []).length === 1 && allCons.has(first(r, 'construction'))).map((r) => first(r, 'rhs')));
    const everything = new Set(rowsOf(language, `${lang}.word`).filter((r) => allCats.has(first(r, 'cat'))).flatMap((r) => r.text ?? []).map((t) => String(t).toLowerCase()).filter((t) => !t.includes(' ')));
    const wh = new Set(texts('wh').filter((t) => !t.includes(' '))); // question words: a turn that starts with one asks
    return { stop, numbers, anaphors, placeRefs, dets, definite, indefinite, joiners, everything, preps, cues, plural, wh, hasInflect: rowsOf(language, `${lang}.inflect`).length > 0 };
  });
}

/** The words of a live world and its catalog: kinds (with plurals), wholes, units, values, verbs. */
function lexiconOf(world, ctx, L, lang) {
  const build = () => {
    const kinds = new Map(); // phrase -> { kind, whole, unit, part }
    const add = (text, kind, flags = {}) => {
      const t = String(text).toLowerCase().replace(/_/g, ' ').trim();
      if (!t) return;
      const forms = [t];
      const words = t.split(' '), last = words.pop();
      const pl = L.hasInflect ? L.plural(last) : null;
      // the plural is the language world's (its inflection rules and irregular forms); the spelling rule below is only
      // for a language world that has no inflection at all. A plural equal to the singular ("fish") is no plural form.
      const plf = L.hasInflect ? (pl && pl !== last ? pl : null) : /(?:s|x|z|ch|sh)$/.test(last) ? `${last}es` : /[^aeiou]y$/.test(last) ? `${last.slice(0, -1)}ies` : `${last}s`;
      if (plf) forms.push([...words, plf].join(' '));
      for (const f of forms) { const e = kinds.get(f) ?? { kind, whole: false, unit: false, part: false, made: false, plural: f !== t }; kinds.set(f, { ...e, whole: e.whole || !!flags.whole, unit: e.unit || !!flags.unit, part: e.part || !!flags.part, made: e.made || !!flags.made }); }
    };
    const sources = [world, ...[].concat(ctx.catalog ?? [])];
    for (const k of rowsOf(world, 'std.schema.kind')) { const of = first(k, 'of'); if (of) add(plain(of), of, { made: (k.acts ?? []).includes('make') }); }
    for (const h of rowsOf(world, 'std.schema.honours')) for (const of of h.of ?? []) add(plain(of), of);
    for (const m of rowsOf(sources, 'k.expect.make')) { add(first(m, 'thing'), first(m, 'thing'), { whole: true }); if (first(m, 'unit')) add(first(m, 'unit'), first(m, 'unit'), { unit: true }); }
    for (const p of rowsOf(sources, 'k.expect.part')) { add(first(p, 'part'), first(p, 'part'), { part: true }); for (const s of p.shape ?? []) add(s, s); }
    for (const w of rowsOf(world, 'core.word')) for (const m of w.means ?? []) { const e = [...kinds.values()].find((x) => x.kind === m); if (e) for (const t of w.text ?? []) add(t, m, e); }
    for (const t of ctx.kinds ?? []) add(t, t);
    // the world itself: its name (std.schema.world name=), and the kind that name means (a core.word), is a word for the whole world
    for (const r of rowsOf(world, 'std.schema.world')) for (const name of r.name ?? []) {
      const t = String(name).toLowerCase().replace(/_/g, ' ');
      const e = kinds.get(t);
      if (!e) { kinds.set(t, { kind: String(name), whole: false, unit: false, part: false, made: false, plural: false, world: true, none: true }); continue; }
      for (const [p, x] of kinds) if (x.kind === e.kind) kinds.set(p, { ...x, world: true }); // every word of the kind the name means
    }
    // values: the enum values of the slots of the world's kinds (colour red, layout grid)
    const values = new Map(); // word -> [{ attribute, value }]
    const c = world?._compiled?.();
    if (c) for (const k of rowsOf(world, 'std.schema.kind')) for (const s of c.slots.get(first(k, 'of'))?.values() ?? []) for (const v of s.enum ?? []) {
      const t = String(V(v)).toLowerCase().replace(/_/g, ' ');
      const list = values.get(t) ?? [];
      if (!list.some((x) => x.attribute === s.key)) list.push({ attribute: s.key, value: V(v) });
      values.set(t, list);
    }
    // values of the catalog's value types (a colour the world does not have is still read, so that it can be named)
    for (const [attribute, types] of Object.entries(ctx.valueTypes ?? VALUE_TYPES)) for (const r of rowsOf([].concat(ctx.catalog ?? []), types)) for (const t of r.name ?? []) {
      const list = values.get(String(t).toLowerCase()) ?? [];
      if (!list.some((x) => x.attribute === attribute)) { list.push({ attribute, value: t, known: false }); values.set(String(t).toLowerCase(), list); }
    }
    for (const [t, v] of Object.entries(ctx.values ?? {})) values.set(t, [].concat(v));
    // verbs: the world's own words for its actions first, then k.actions verbs of the language and the catalog
    const verbs = new Map();
    const actions = c ? new Set([...c.actions.keys()].map((a) => String(a).replace(/^\$/, ''))) : new Set();
    for (const w of rowsOf(world, 'core.word')) for (const m of w.means ?? []) if (actions.has(m)) for (const t of w.text ?? []) if (!verbs.has(String(t).toLowerCase())) verbs.set(String(t).toLowerCase(), m);
    for (const [t, a] of Object.entries(ctx.verbs ?? {})) verbs.set(t, a);
    for (const a of actions) if (!verbs.has(a)) verbs.set(a, a); // the world's own action names before the catalog's senses of the same word
    for (const v of rowsOf([ctx.language ?? world, ...[].concat(ctx.catalog ?? [])], 'k.actions.verb')) { const t = String(first(v, 'text')).toLowerCase(); if (!verbs.has(t)) verbs.set(t, first(v, 'act')); }
    for (const a of actions) if (!verbs.has(a)) verbs.set(a, a);
    return { kinds, values, verbs };
  };
  return ctx.catalog || ctx.kinds || ctx.values || ctx.verbs ? build() : memoPerWorld(world, `request|lexicon|${lang}`, build);
}

/**
 * The things of a world's state (its view), never its declaration or knowledge rows: the ids of `view` whose wire is of
 * a type that is a std.schema.thing (as the acts read the things of a world). A `std.schema.drawn kind= as=` row or a
 * k.expect row has a kind but is no thing an act takes. A world with no std.schema.thing type keeps every id.
 */
export function stateIds(live, view = null, ids = null) {
  const c = live?._compiled?.();
  const v = view ?? (c ? factsOf(live) : null);
  const all = ids ?? v?.ids() ?? [];
  if (!c || !v || !c.slots.get('std.schema.thing')) return all;
  return all.filter((id) => { const t = v.thing(id)?.type; return t !== undefined && c.isA(t, 'std.schema.thing'); });
}
const stateOfKind = (live, view, kind) => stateIds(live, view, view.ofKind(kind));

/**
 * The names of the things of a state: Map(phrase -> [ids]), a thing's name being any of its free text values (a value
 * of a slot with no enum, no reference and not a number: a label, a title, a name) or its id, in the tokens of the
 * reader. Built once per state version.
 */
function namesOf(state) {
  if (!state?._compiled) return new Map();
  return memoPerWorld(state, 'request|names', () => {
    const c = state._compiled(), view = factsOf(state), out = new Map();
    const add = (text, id) => { const t = tokensOf(text).join(' '); if (!t || t.length < 2 || t.split(' ').length > 6) return; const l = out.get(t) ?? []; if (!l.includes(id)) l.push(id); out.set(t, l); };
    for (const id of stateIds(state, view)) { // bounded: the things of the state
      const rec = view.thing(id);
      add(id, id);
      for (const [key, vs] of rec.attrs) {
        if (key === 'kind' || key === 'world') continue;
        const sl = c.slotOf?.(rec.type, key) ?? c.slots.get(rec.type)?.get(key);
        if (sl && (sl.enum || sl.refs?.length || (sl.kinds ?? []).some((k) => k === 'number' || k === 'integer'))) continue;
        for (const v of vs) if (typeof v === 'string' && Number.isNaN(Number(v))) add(v, id);
      }
    }
    return out;
  });
}

// longest phrase of a map at position i: { n, entry, text }
function longestAt(ws, i, map, maxLen = 4) {
  for (let n = Math.min(maxLen, ws.length - i); n >= 1; n--) { const t = ws.slice(i, i + n).join(' '); if (map.has(t)) return { n, entry: map.get(t), text: t }; } // bounded: four lengths
  return null;
}
const at = (ws, i, p) => p.length > 0 && p.every((w, k) => ws[i + k] === w);

/**
 * Read one request. `world` is the open live world (its kinds, slots, words, honours declarations and expectation
 * facts); `ctx`: `language` (the language world with `<lang>.cue`; default `world`), `lang` (default w.lang.en),
 * `catalog` (more sources of k.expect and k.actions facts), `dialogue` ({ last }: the last request, read for "it"),
 * `kinds`, `values`, `verbs` (more words), `spell` (true or repairWords options: repair near-miss words by the words of the world, the other `worlds`, the dialogue and the language before reading; the result carries `spell`). Returns { act, target, refers, text, constraints, reactions, unread, used, facts }.
 */
export function readRequest(world, text, ctx = {}) {
  const lang = ctx.lang ?? 'w.lang.en';
  const L = languageOf(ctx.language ?? world, lang);
  const X = lexiconOf(world, ctx, L, lang);
  let ws = tokensOf(text);
  let spell = null;
  if (ctx.spell) { // one candidate source of the reader: words of the open world's lexicon, the other worlds, the dialogue, the language
    const o = ctx.spell === true ? {} : ctx.spell;
    const raw = String(text ?? '');
    const protect = new Set(); // names (capitalized, not first) and quoted text are never changed
    for (const m of raw.matchAll(/"[^"]*"|“[^”]*”/gu)) for (const w of tokensOf(m[0])) protect.add(w);
    for (const m of raw.matchAll(/[\p{L}'’]+/gu)) if (m.index > 0 && /^\p{Lu}/u.test(m[0]) && /[\p{L}]/u.test(raw.slice(0, m.index))) for (const w of tokensOf(m[0])) protect.add(w);
    const phrases = (m) => [...m.keys()].flatMap((k) => k.split(' '));
    const own = [...phrases(X.kinds), ...phrases(X.values), ...phrases(X.verbs)];
    const closed = [...L.stop, ...L.numbers.keys(), ...L.dets, ...L.preps, ...L.anaphors, ...L.placeRefs, ...L.cues.flatMap((c) => [...c.lead, ...c.trail, ...c.between].flat())];
    spell = repairWords(ws, { ...o, worlds: [world, ...[].concat(o.worlds ?? [])], dialogue: o.dialogue ?? ctx.dialogue, lang, language: ctx.language ?? world, lexicon: own, dictionary: closed, protect });
    ws = spell.tokens;
  }
  const used = new Array(ws.length).fill(false);
  const free = (i, n = 1) => { for (let k = i; k < i + n; k++) if (k >= ws.length || used[k]) return false; return true; }; // bounded: n tokens
  const take = (i, n = 1) => { for (let k = i; k < i + n; k++) used[k] = true; }; // bounded: n tokens
  const numAt = (i) => (i < 0 || i >= ws.length ? undefined : /^\d/.test(ws[i]) ? Number(ws[i]) : L.numbers.get(ws[i]));
  const constraints = [], reactions = [];
  const words = (i, n) => ws.slice(i, i + n).join(' ');

  // the act: the first verb (a phrase of the world's words or of k.actions) before any content word
  let act = null, mode = null, actAt = null;
  for (let i = 0; i < ws.length && i < 8; i++) { // bounded: the first eight tokens
    const v = longestAt(ws, i, X.verbs, 3);
    if (v) { act = v.entry; actAt = { i, n: v.n }; take(i, v.n); break; }
    if (!L.stop.has(ws[i])) break;
  }

  // operands of a cue
  const skipDets = (i) => { let k = i; while (k < ws.length && k < i + 2 && L.dets.has(ws[k]) && free(k)) k++; return k; }; // bounded: two determiners
  const kindAt = (i) => { const k = skipDets(i); const m = longestAt(ws, k, X.kinds); return m && free(k, m.n) ? { from: i, to: k + m.n, entry: m.entry, text: m.text } : null; };
  const valueAt = (i) => { const k = skipDets(i); const m = longestAt(ws, k, X.values, 3); return m && free(k, m.n) ? { from: i, to: k + m.n, entry: m.entry, text: m.text } : null; };
  const contentAt = (i, max = 3) => { // an open noun phrase: content words up to a joiner, a stop word or a cue
    const k = skipDets(i); let e = k;
    while (e < ws.length && e < k + max && free(e) && !L.stop.has(ws[e]) && numAt(e) === undefined && ws[e] !== ',' && ws[e] !== '-') e++; // bounded: max tokens
    return e > k ? { from: i, to: e, text: words(k, e - k) } : null;
  };
  const topicAt = (i) => {
    const k = skipDets(i); let e = k;
    while (e < ws.length && e < k + 6 && free(e) && ws[e] !== ',' && numAt(e) === undefined && !['with', 'and', 'but', 'in', 'not'].includes(ws[e])) e++; // bounded: six tokens
    while (e > k && L.stop.has(ws[e - 1])) e--; // bounded: the tokens taken
    return e > k ? { from: i, to: e, text: words(k, e - k) } : null;
  };

  // every place a cue's phrase stands, with its operand
  const matches = [];
  for (const c of L.cues) {
    for (let i = 0; i < ws.length; i++) { // bounded: tokens x phrases of one cue
      for (const lead of c.lead) {
        if (!at(ws, i, lead)) continue;
        const e = i + lead.length;
        if (c.takes === 'range' && c.between.length) { for (const b of c.between) if (numAt(e) !== undefined && at(ws, e + 1, b) && numAt(e + 1 + b.length) !== undefined) matches.push({ c, from: i, to: e + 2 + b.length, phrase: lead.length, lo: numAt(e), hi: numAt(e + 1 + b.length) }); continue; }
        matches.push({ c, from: i, to: e, phrase: lead.length });
      }
      if (!c.lead.length) {
        for (const tr of c.trail) if (at(ws, i, tr) && numAt(i - 1) !== undefined) matches.push({ c, from: i - 1, to: i + tr.length, phrase: tr.length, n: numAt(i - 1) });
        if (c.takes === 'range') for (const b of c.between) if (at(ws, i, b) && numAt(i - 1) !== undefined && numAt(i + b.length) !== undefined) matches.push({ c, from: i - 1, to: i + b.length + 1, phrase: b.length, lo: numAt(i - 1), hi: numAt(i + b.length) });
      } else if (c.trail.length) for (const tr of c.trail) if (at(ws, i, tr) && numAt(i - 1) !== undefined) matches.push({ c, from: i - 1, to: i + tr.length, phrase: tr.length, n: numAt(i - 1) });
    }
  }
  // a cue phrase longer than the verb it starts with is the reading ("put it back", "make it bigger")
  if (actAt && matches.some((m) => m.from === actAt.i && m.phrase > actAt.n)) { for (let k = actAt.i; k < actAt.i + actAt.n; k++) used[k] = false; act = null; actAt = null; } // bounded: the verb's tokens
  // the operand at acceptance time (what is still free)
  const operand = (m) => {
    const c = m.c;
    if (c.on === 'reaction') return { to: m.to };
    if (m.lo !== undefined || m.n !== undefined) return { to: m.to };
    switch (c.takes) {
      case 'none': return { to: m.to };
      case 'number': { const n = numAt(m.to); return n !== undefined && free(m.to) ? { to: m.to + 1, n } : null; }
      case 'kind': {
        if (c.on === 'with') { // a list: kinds or open noun phrases joined by and / commas
          const items = []; let i = m.to;
          while (i < ws.length && items.length < 6) { // bounded: six items
            const n = numAt(i) !== undefined && free(i) ? numAt(i) : undefined;
            const j = n !== undefined ? i + 1 : i;
            const kk = kindAt(j), oc = contentAt(j);
            const k = kk && (!oc || kk.to >= oc.to) ? kk : oc; // "water plants": the open phrase when it is longer than the kind it starts with
            if (!k) break;
            items.push({ ...k, n, from: i }); i = k.to;
            if (ws[i] === 'and' || ws[i] === ',') { if (kindAt(i + 1) || contentAt(i + 1)) { i++; continue; } }
            break;
          }
          return items.length ? { to: i, items } : null;
        }
        const k = kindAt(m.to);
        if (k) return { to: k.to, kind: k };
        const v = valueAt(m.to);
        return v ? { to: v.to, value: v } : null;
      }
      case 'value': { const v = valueAt(m.to); return v ? { to: v.to, value: v } : null; }
      case 'thing': { const k = kindAt(m.to); return k ? { to: k.to, kind: k } : null; }
      case 'topic': { const t = topicAt(m.to); return t ? { to: t.to, topic: t } : null; }
      case 'range': return null;
      default: return { to: m.to };
    }
  };
  for (const m of matches) { const o = operand(m); m.span = o ? o.to - m.from : 0; }
  matches.sort((a, b) => b.phrase - a.phrase || b.c.priority - a.c.priority || b.span - a.span || a.from - b.from || a.c.n - b.c.n);
  const accepted = [];
  for (const m of matches) { // bounded: the matches found
    if (m.from < 0) continue;
    const o = operand(m);
    if (!o) continue;
    const twin = accepted.find((a) => a.from === m.from && a.phraseTo === m.from + m.phrase && a.c.on !== m.c.on);
    const phraseTo = m.lo !== undefined || m.n !== undefined ? m.to : m.from + m.phrase;
    if (!twin && !free(m.from, o.to - m.from)) continue;
    if (twin && !free(phraseTo, o.to - phraseTo)) continue;
    accepted.push({ ...m, o, phraseTo });
    take(m.from, o.to - m.from);
    const c = m.c, w = words(m.from, o.to - m.from);
    if (c.on === 'reaction') { reactions.push({ value: c.value, step: c.step, cue: c.name, words: w, at: m.from }); continue; }
    const base = { on: c.on, want: c.want ?? 'yes', words: w, origin: 'said', cue: c.name, at: m.from };
    if (c.on === 'count') {
      if (m.lo !== undefined) constraints.push({ ...base, min: Math.min(m.lo, m.hi), max: Math.max(m.lo, m.hi) });
      else if (c.amount) constraints.push({ ...base, amount: c.amount });
      else constraints.push({ ...base, number: o.n ?? m.n, bound: c.bound, exclusive: /more_than|fewer_than/.test(c.name) || undefined });
    } else if (c.on === 'length') constraints.push({ ...base, ...(c.unit ? { number: m.n ?? o.n, unit: c.unit } : { value: c.value }) });
    else if (c.on === 'kind') {
      if (o.kind) constraints.push({ ...base, value: o.kind.entry.kind });
      else if (o.value) for (const v of o.value.entry.slice(0, 1)) constraints.push({ ...base, on: 'attribute', attribute: v.attribute, value: v.value });
      else constraints.push({ ...base, value: null }); // "different shapes": more than one kind, none named
    } else if (c.on === 'with') for (const it of o.items) {
      const kind = it.entry?.kind ?? it.text, w1 = words(it.from, it.to - it.from);
      if (it.n !== undefined) constraints.push({ ...base, on: 'count', number: it.n, of: kind, words: w1 }); // "with 5 shapes": a count of them
      if (it.n === undefined || (it.entry && !it.entry.unit)) constraints.push({ ...base, value: kind, words: w1 });
    }
    else if (c.on === 'attribute') { const v = o.value.entry.find((x) => !c.attribute || x.attribute === c.attribute) ?? o.value.entry[0]; constraints.push({ ...base, attribute: c.attribute ?? v.attribute, value: v.value }); }
    else if (c.on === 'layout') constraints.push({ ...base, value: c.value ?? o.value?.entry[0]?.value });
    else if (c.on === 'about') constraints.push({ ...base, value: o.topic.text });
    else if (c.on === 'place') { if (!(o.kind?.entry.world && c.value === undefined)) constraints.push({ ...base, value: c.value ?? o.kind?.entry.kind, relation: c.relation }); } // a place that names the world itself is where everything is: no constraint
    else constraints.push({ ...base, ...(c.value !== undefined ? { value: c.value } : {}), ...(c.step ? { step: c.step } : {}) });
  }

  // names of things that are there (ctx.state, else the world itself): a phrase that is a thing's name refers to it,
  // as the object of the act ("move summary to the left", "connect start to end"); never a phrase that is a value or a
  // verb of the world, or a kind this world has (declared, or with things there): a kind word that only the catalog
  // knows ("start" of a flowchart's expectation) gives way to the name of a thing that is there. Never closed words
  // alone; after a preposition a name may be where (`prep`)
  const named = [];
  { const state = ctx.state ?? world, names = namesOf(state);
    const ownKind = (e) => e.made || capabilitiesOf(world).kinds.has(e.kind) || (state?._compiled ? stateOfKind(state, factsOf(state), e.kind).length > 0 : false);
    if (names.size) for (let i = 0; i < ws.length; i++) { // bounded: the tokens x six lengths
      if (used[i] || L.stop.has(ws[i])) continue;
      const m = longestAt(ws, i, names, 6);
      if (!m || !free(i, m.n) || (X.kinds.has(m.text) && ownKind(X.kinds.get(m.text))) || X.values.has(m.text) || X.verbs.has(m.text)) continue;
      const prep = L.preps.has(ws[i - 1] ?? '') ? ws[i - 1] : L.dets.has(ws[i - 1] ?? '') && L.preps.has(ws[i - 2] ?? '') ? ws[i - 2] : null;
      take(i, m.n); named.push({ ids: [...m.entry], words: m.text, at: i, ...(prep ? { prep } : {}) });
      i += m.n - 1;
    } }

  // kinds, wholes, numbers and values left: the target, wanted kinds, bare counts and attributes
  let target = null, refers = null, refersAt = null;
  const mentions = []; // every kind word read (units and the world's own words too), for a question about the state
  const pending = []; // values waiting for the kind they describe
  for (let i = 0; i < ws.length; i++) { // bounded: the tokens
    if (used[i]) continue;
    const n = numAt(i);
    if (n !== undefined) {
      let j = i + 1; while (j < ws.length && j < i + 4 && !longestAt(ws, j, X.kinds) && (used[j] || X.values.has(ws[j]))) j++; // bounded: three modifiers (read by a cue, or values)
      const k = kindAt(j);
      if (k && free(i)) { take(i); constraints.push({ on: 'count', want: 'yes', number: n, of: k.entry.kind, words: words(i, k.to - i), origin: 'said', at: i }); }
      continue;
    }
    const k = longestAt(ws, i, X.kinds);
    if (k && free(i, k.n)) {
      mentions.push({ kind: k.entry.kind, words: k.text, at: i, ...(k.entry.unit ? { unit: true } : {}), ...(k.entry.world ? { world: true } : {}), ...(k.entry.none ? { none: true } : {}) });
      const afterPlace = L.preps.has(ws[i - 1] ?? '') || (L.dets.has(ws[i - 1] ?? '') && L.preps.has(ws[i - 2] ?? ''));
      take(i, k.n);
      if (k.entry.world && afterPlace) continue; // "on the shelf", "in the drawing": the world itself is where everything is, not a place in it
      if (k.entry.none) { if (!target) { refers = 'all'; refersAt = i; } continue; } // the world's name, a kind of none: the whole world
      const count = constraints.find((c) => c.on === 'count' && !c.of && c.at < i && c.at >= i - 4);
      if (count) count.of = k.entry.kind;
      const countOf = constraints.find((c) => c.on === 'count' && c.of === k.entry.kind);
      // a definite determiner before the kind (the language's definite=yes), over the modifiers between: it refers to things there
      let d = i - 1; while (d >= 0 && d >= i - 4 && !L.dets.has(ws[d]) && !L.joiners.has(ws[d]) && (used[d] || X.values.has(ws[d]))) d--; // bounded: four tokens
      const definite = d >= 0 && L.definite.has(ws[d]), indefinite = d >= 0 && L.indefinite.has(ws[d]);
      const kc = { on: 'kind', want: 'yes', value: k.entry.kind, words: k.text, origin: 'said', at: i, ...(k.entry.plural && !countOf ? { plural: true } : {}), ...(definite ? { definite: true } : {}), ...(indefinite ? { indefinite: true } : {}), ...(k.entry.world ? { world: true } : {}) };
      if (k.entry.whole && !target && !afterPlace) { target = k.entry.kind; refers = 'kind'; if (!constraints.some((c) => c.on === 'kind' && c.value === k.entry.kind)) constraints.push(kc); continue; } // the target keeps its kind constraint, with the place of its word
      for (const p of pending.splice(0)) p.of = k.entry.kind;
      if (k.entry.unit && !k.entry.made) continue; // "5 nodes": the unit of a whole, counted, not a kind
      if (afterPlace && !constraints.some((c) => c.on === 'place' && c.value === k.entry.kind)) { constraints.push({ on: 'place', want: 'yes', value: k.entry.kind, relation: ws[i - 1] === 'the' || ws[i - 1] === 'a' ? ws[i - 2] : ws[i - 1], words: words(i, k.n), origin: 'said', at: i }); continue; }
      // a singular indefinite determiner (the language's definite=no number=sg) says the number: one, said, not assumed
      if (indefinite && !k.entry.plural && !countOf && !constraints.some((c) => c.on === 'count' && (!c.of || c.of === k.entry.kind))) constraints.push({ on: 'count', want: 'yes', number: 1, of: k.entry.kind, words: words(d, i + k.n - d), origin: 'said', det: true, at: d });
      if (!constraints.some((c) => c.on === 'kind' && c.value === k.entry.kind)) constraints.push(kc);
      continue;
    }
    const v = longestAt(ws, i, X.values, 3);
    if (v && free(i, v.n)) { take(i, v.n); const c = { on: 'attribute', want: 'yes', attribute: v.entry[0].attribute, value: v.entry[0].value, words: v.text, origin: 'said', at: i }; constraints.push(c); pending.push(c); continue; }
    // a reference word for a place ("there", "in it"): a place constraint the planner resolves to a thing of the state
    const placed = constraints.some((c) => c.on === 'place');
    if (!placed && L.placeRefs.has(ws[i])) { take(i); constraints.push({ on: 'place', want: 'yes', value: null, ref: ws[i], words: ws[i], origin: 'said', at: i }); continue; }
    if (!placed && L.anaphors.has(ws[i]) && i > 0 && L.preps.has(ws[i - 1]) && act) { take(i); constraints.push({ on: 'place', want: 'yes', value: null, ref: ws[i], relation: ws[i - 1], words: words(i - 1, 2), origin: 'said', at: i }); continue; }
    if (L.everything.has(ws[i]) && !target && refers !== 'last') { take(i); refers = 'all'; refersAt = i; continue; } // "everything": every thing of the world
    if (L.anaphors.has(ws[i]) && !target && refers !== 'all') { take(i); target = ctx.dialogue?.last?.target ?? null; refers = 'last'; refersAt = i; }
  }
  if (named.length && !target && refers === null) { refers = 'named'; refersAt = named[0].at; }
  if (!target && act && refers !== 'all' && refers !== 'named') { const k = constraints.find((c) => c.on === 'kind' && c.want === 'yes'); if (k) { target = k.value; refers = 'kind'; } }
  // modifiers of kinds said together ("a tiny house and a big sun"): a size or a value belongs to the kind whose word
  // follows it with no joiner between, else to the one before it; only when two kinds or more are said
  const kindWords = constraints.filter((c) => c.on === 'kind' && c.want === 'yes' && c.value && c.at !== undefined);
  if (new Set(kindWords.map((c) => c.value)).size > 1) {
    const joined = (a, b) => { for (let x = Math.min(a, b) + 1; x < Math.max(a, b); x++) if (L.joiners.has(ws[x])) return true; return false; }; // bounded: the tokens between
    for (const c of constraints) {
      if (!['size', 'attribute'].includes(c.on) || c.of || (c.want ?? 'yes') !== 'yes' || c.at === undefined) continue;
      const after = kindWords.filter((x) => x.at > c.at && !joined(c.at, x.at)).sort((a, b) => a.at - b.at)[0];
      const before = kindWords.filter((x) => x.at < c.at && !joined(x.at, c.at)).sort((a, b) => b.at - a.at)[0];
      const of = (after ?? before)?.value;
      if (of) c.of = of;
    }
  }

  const unreadAt = [];
  for (let i = 0; i < ws.length; i++) if (!used[i] && !L.stop.has(ws[i]) && !/^[-,]$/.test(ws[i])) unreadAt.push({ text: ws[i], n: i + 1 }); // bounded: the tokens
  const question = /\?\s*$/.test(String(text ?? '')) || L.wh.has(ws[0]); // a turn that asks: never an act's fragment
  const req = { act, mode, target, refers, ...(refersAt !== null ? { refersAt } : {}), ...(named.length ? { named } : {}), mentions, ...(question ? { question: true } : {}), text: String(text ?? ''), constraints, reactions, unread: [...new Set(unreadAt.map((u) => u.text))], unreadAt, used: ws.filter((_, i) => used[i]), ...(spell ? { spell: { repairs: spell.repairs, asks: spell.asks } } : {}) };
  return withFacts(req);
}

/** The host's flat shape of the constraints ({ key, value, neg, all, n, min, max, unit, step }), beside the w.request one. */
function withFacts(req) {
  Object.defineProperty(req, 'facts', {
    enumerable: false, configurable: true,
    get() {
      return this.constraints.map((c) => {
        const f = { key: c.on };
        if (c.value !== undefined && c.value !== null && !['size', 'extent'].includes(c.on) && !(c.on === 'length' && !c.unit)) f.value = c.value;
        if (c.want === 'no' || c.want === 'not_all') f.neg = true;
        if (c.want === 'not_all') f.all = true;
        if (c.number !== undefined) f.n = c.number;
        if (c.min !== undefined) { f.min = c.min; f.max = c.max; }
        if (c.unit) f.unit = c.unit;
        if (c.of) f.of = c.of;
        if (c.attribute) f.attribute = c.attribute;
        const step = c.amount ?? (['size', 'extent'].includes(c.on) || (c.on === 'length' && !c.unit) ? c.value ?? (c.step === 'up' ? 'big' : c.step === 'down' ? 'small' : undefined) : undefined);
        if (step !== undefined) f.step = step;
        return f;
      });
    },
  });
  return req;
}

/** The request as w.request wires (one request, its constraints, its unread words), to tell into a live world that loads w.request. */
export function requestWires(request, { id = 'request1' } = {}) {
  const q = (s) => JSON.stringify(String(s));
  const lines = [`@${id} w.request.request act=${q(request.act ?? 'unknown')}${request.target ? ` target=${q(request.target)}` : ''}${request.refers ? ` refers=${request.refers}` : ''} text=${q(request.text ?? '')}${request.revises ? ` revises=$${request.revises}` : ''}`];
  request.constraints.forEach((c, i) => {
    const a = [`request=$${id}`, `on=${c.on}`, `want=${c.want ?? 'yes'}`];
    for (const k of ['value', 'of', 'attribute', 'relation', 'unit', 'words']) if (c[k] !== undefined && c[k] !== null) a.push(`${k}=${q(c[k])}`);
    for (const k of ['number', 'min', 'max']) if (c[k] !== undefined) a.push(`${k}=${c[k]}`);
    if (c.amount ?? c.step) a.push(`amount=${q(c.amount ?? c.step)}`);
    a.push(`origin=${c.origin ?? 'said'}`);
    lines.push(`@${id}.c${i + 1} w.request.constraint ${a.join(' ')}`);
  });
  (request.unreadAt ?? request.unread.map((t) => ({ text: t }))).forEach((u, i) => lines.push(`@${id}.u${i + 1} w.request.unread request=$${id} text=${q(u.text)}${u.n ? ` n=${u.n}` : ''}`));
  return lines.join('\n');
}

// ---- revision ----------------------------------------------------------------------------------------------------
const sameKey = (a, b) => a.on === b.on && (['kind', 'with'].includes(a.on) ? a.value === b.value : a.on === 'attribute' ? a.attribute === b.attribute : true);
function scaleOf(sources) {
  const rows = rowsOf(sources, 'k.expect.scale').map((r) => ({ step: first(r, 'step'), order: num(first(r, 'order')), count: num(first(r, 'count_factor')), size: num(first(r, 'size_factor')), extent: num(first(r, 'extent')) }));
  const seen = new Map(); for (const r of rows) if (!seen.has(r.step)) seen.set(r.step, r);
  const list = [...seen.values()].sort((a, b) => a.order - b.order);
  return list.length ? list : null;
}
const stepNext = (scale, step, dir) => {
  const order = scale ? scale.map((s) => s.step) : STEPS;
  const i = Math.max(0, order.indexOf(step ?? 'default'));
  return order[Math.min(order.length - 1, Math.max(0, i + (dir === 'up' ? 1 : -1)))];
};
const factor = (scale, step, key = 'count') => scale?.find((s) => s.step === step)?.[key] ?? null;

/**
 * A turn against the dialogue: a new request, or a revision of the last one by the w.dialogue.revision facts of its
 * reaction (flip, step, add, keep, undo, none). `dialogue`: { last, result, previous, seed } (result: { count, kinds:
 * { kind: n }, things }); `opts`: `revisions` (a source of w.dialogue.revision facts), `catalog` (k.expect.scale facts),
 * `live` (the world with its state: an act said on what is there with only new values, "make it red", is then a new
 * request in the change sense of make, not a revision).
 * Returns { sort: 'request' | 'reaction', reaction, does, request, replace, seed, reply, undo }.
 */
export function reviseRequest(dialogue, request, opts = {}) {
  const last = dialogue?.last ?? null;
  const seed = (dialogue?.seed ?? 1);
  const fresh = { sort: 'request', reaction: null, does: [], request, replace: false, seed };
  if (!last) return fresh;
  // a turn read only in part, with no reaction cue, never revises nor keeps the last result: it is a request of its own
  // (its act abduced by the planner when nothing unread stands where it would be) or honestly not understood
  if (request.unread?.length && !request.reactions.length) return fresh;
  // an act said on things named by their names ("move summary up"): a request of its own
  if (request.act && request.refers === 'named') return fresh;
  // a fragment (no verb, no reaction cue, not a question) that names a kind it wants, not by a definite reference to
  // things there ("a sun" after "draw a fish"): it continues the dialogue's focus, a new request with the last act
  // (reaction `continue` of w.dialogue.revision; when the language has no row, does=inherit on=act, nothing replaced)
  const fragmentKinds = request.constraints.filter((c) => c.on === 'kind' && (c.want ?? 'yes') === 'yes' && c.value && !c.definite);
  if (!request.act && !request.reactions.length && !request.question && !['last', 'named', 'all'].includes(request.refers) && fragmentKinds.length && last.act) {
    const rows = rowsOf(opts.revisions ?? dialogue.revisions, 'w.dialogue.revision').filter((r) => first(r, 'reaction') === 'continue');
    const does = rows.length ? rows.map((r) => ({ does: first(r, 'does'), on: first(r, 'on'), replaces: first(r, 'replaces') === 'yes', reply: first(r, 'reply') })) : [{ does: 'inherit', on: 'act', replaces: false }];
    const inherited = withFacts({ ...request, act: last.act, actFrom: 'dialogue', continues: last.id ?? last.text ?? true });
    return { sort: 'request', reaction: 'continue', does, request: inherited, replace: does.some((d) => d.replaces), seed };
  }
  // an act said on what is there with only new values ("make it red"): a request of its own (the change sense of
  // make, decided by planRequest over `opts.live`, the world with its state), not a revision of the last one
  if (request.act && opts.live && !request.reactions.length && capabilitiesOf(opts.live).honours.some((h) => h.act === 'change') && changeSense(opts.live, request, { dialogue })) return fresh;
  const rx = new Set(request.reactions.map((r) => r.value));
  const expectation = request.reactions.some((r) => /expectation/.test(r.cue ?? ''));
  const newThing = request.act && request.target && request.refers !== 'last' && !expectation;
  const said = request.constraints.length > 0;
  let reaction = null;
  if (rx.has('put_back')) reaction = 'put_back';
  else if (expectation) reaction = 'refine';
  else if (newThing && !(request.target === last.target && (rx.has('redo') || rx.has('reduce') || rx.has('enlarge')))) return fresh;
  else if (rx.has('reject')) reaction = 'reject';
  else if (rx.has('reduce')) reaction = 'reduce';
  else if (rx.has('enlarge')) reaction = 'enlarge';
  else if (rx.has('frustration')) reaction = said ? 'refine' : 'frustration';
  else if (rx.has('redo')) reaction = 'redo';
  else if (rx.has('thanks') && !said && !request.act) reaction = 'thanks';
  else if (rx.has('refine') || said || request.refers === 'last') reaction = 'refine';
  if (!reaction) return fresh;
  const rows = rowsOf(opts.revisions ?? dialogue.revisions, 'w.dialogue.revision').filter((r) => first(r, 'reaction') === reaction);
  let does = rows.length ? rows.map((r) => ({ does: first(r, 'does'), on: first(r, 'on'), direction: first(r, 'direction'), replaces: first(r, 'replaces') !== 'no', reply: first(r, 'reply') })) : [{ does: 'add', replaces: true }];
  // a reaction's steps apply on the keys the turn names ("bigger" says the size: the count stays); on all its rows
  // when the turn names none
  const saidOn = new Set(request.constraints.filter((c) => c.step).map((c) => c.on));
  if (does.some((d) => d.does === 'step' && saidOn.has(d.on))) does = does.filter((d) => d.does !== 'step' || saidOn.has(d.on));
  const reply = does.find((d) => d.reply)?.reply ?? null;
  if (does.some((d) => d.does === 'undo')) return { sort: 'reaction', reaction, does, request: dialogue.previous ?? null, replace: false, undo: true, seed: dialogue.previousSeed ?? seed, vary: !!dialogue.previousVary, reply };
  if (does.every((d) => d.does === 'none')) return { sort: 'reaction', reaction, does, request: null, replace: false, seed, reply };
  const scale = scaleOf([].concat(opts.catalog ?? []));
  let cs = last.constraints.map((c) => ({ ...c }));
  const put = (c) => { cs = cs.filter((x) => !sameKey(x, c) || (c.on === 'kind' && c.want === 'yes' && x.want !== 'yes')); if (c.on === 'kind' && c.want === 'yes') cs = cs.filter((x) => !(x.on === 'kind' && x.want === 'yes')); cs.push(c); };
  const stepped = new Set(does.filter((d) => d.does === 'step').map((d) => d.on));
  const turn = request.constraints.filter((c) => !(c.step && stepped.has(c.on)));
  if (expectation) cs = cs.filter((c) => c.on === 'kind' && c.want !== 'yes' && false); // the expectation carries the whole set
  for (const c of turn) {
    if (c.step && ['size', 'extent'].includes(c.on)) { const now = cs.find((x) => x.on === c.on && x.value)?.value ?? 'default'; const { step, ...rest } = c; put({ ...rest, value: stepNext(scale, now, step), origin: 'said' }); continue; }
    put({ ...c, origin: 'said' });
  }
  const result = dialogue.result ?? null;
  let nextSeed = seed, vary = false;
  for (const d of does) {
    if (d.does === 'flip' && d.on === 'kind' && !turn.some((c) => c.on === 'kind')) {
      const kinds = Object.entries(result?.kinds ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
      const wanted = last.constraints.filter((c) => c.on === 'kind' && c.want === 'yes').map((c) => c.value);
      for (const k of kinds.length ? kinds.map((x) => x[0]) : wanted) put({ on: 'kind', want: 'no', value: k, words: k, origin: 'reaction' }); // the kinds of the last result become not wanted
      nextSeed = seed + 1; vary = true;
    }
    if (d.does === 'step') {
      const cur = cs.find((c) => c.on === 'size' && c.value)?.value ?? 'default';
      if (d.on === 'count') {
        const c0 = cs.find((c) => c.on === 'count' && !c.of);
        const n = result?.count ?? c0?.number ?? (c0?.min !== undefined ? Math.round((c0.min + c0.max) / 2) : null);
        if (n != null) {
          const to = stepNext(scale, cur, d.direction);
          const f0 = factor(scale, cur), f1 = factor(scale, to);
          let m = f0 && f1 ? Math.round(n * f1 / f0) : n + (d.direction === 'up' ? 1 : -1);
          if (d.direction === 'up' && m <= n) m = n + 1;
          if (d.direction === 'down' && m >= n) m = n - 1;
          put({ on: 'count', want: 'yes', number: Math.max(1, m), words: request.reactions[0]?.words ?? reaction, origin: 'reaction' });
        }
      } else {
        const now = cs.find((c) => c.on === d.on && c.value)?.value ?? 'default';
        put({ on: d.on, want: 'yes', value: stepNext(scale, now, d.direction), words: request.reactions[0]?.words ?? reaction, origin: 'reaction' });
      }
    }
    if (d.does === 'keep') { nextSeed = seed + 1; vary = true; }
  }
  const revised = withFacts({ ...last, constraints: cs, reactions: request.reactions, text: request.text, unread: request.unread, unreadAt: request.unreadAt, revises: last.id ?? null, revisedFrom: last.text, used: request.used });
  if (request.target && request.refers !== 'last') revised.target = request.target;
  return { sort: 'reaction', reaction, does, request: revised, replace: does.some((d) => d.replaces), seed: nextSeed, vary, reply };
}

// ---- planning ----------------------------------------------------------------------------------------------------
/** What a live world declares it can do: { honours: [{ act, on: Set, of }], kinds: Map(kind -> Set(acts)), slots(kind) }. */
export function capabilitiesOf(live) {
  return memoPerWorld(live, 'request|capabilities', () => {
    const honours = rowsOf(live, 'std.schema.honours').map((h) => ({ act: first(h, 'act'), on: new Set(h.on ?? []), of: h.of ?? [] }));
    const kinds = new Map();
    for (const k of rowsOf(live, 'std.schema.kind')) kinds.set(first(k, 'of'), new Set(k.acts ?? []));
    return { honours, kinds };
  });
}
const slotsOf = (live, kind) => live?._compiled?.().slots.get(kind) ?? new Map();

/** A seeded integer in [lo, hi]; with `notMin`, never lo when hi > lo ("random" varies within the range, never the minimum). */
const pick = (rnd, lo, hi, notMin = false) => { const a = notMin && hi > lo ? lo + 1 : lo; return a + below(rnd, hi - a + 1); };
const shuffle = (rnd, xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = below(rnd, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }; // bounded: the items

/** One plan of a request, the gaps filled from the sources in order, with the hints of the reasoning cycle (induced values, a place). */
function planOnce(live, request, opts = {}, hints = NO_HINTS) {
  const sources = opts.sources ?? REQUEST_SOURCES;
  const has = (s) => sources.includes(s);
  const seed = opts.seed ?? 1;
  const rnd = seeded(seed);
  const cap = capabilitiesOf(live);
  // the act: said; else (nothing unread: an unread word where the act stands is never guessed over) the dialogue's,
  // else the one act this world declares for the thing named
  let act = request.act ?? null, actFrom = request.act ? request.actFrom ?? 'said' : 'said'; // a fragment's act is the dialogue's
  if (!act && !request.unread?.length) {
    const named = request.target ?? request.constraints.find((c) => c.on === 'kind' && c.want === 'yes')?.value;
    const acts = [...new Set(cap.honours.filter((h) => named && (!h.of.length || h.of.includes(named))).map((h) => h.act))];
    if (opts.dialogue?.last?.act && sources.includes('dialogue')) { act = opts.dialogue.last.act; actFrom = 'dialogue'; }
    else if (acts.length === 1) { act = acts[0]; actFrom = 'world'; }
  }
  const notHonoured = [], assumed = [];
  const out = { ok: false, act, target: null, roles: {}, steps: [], assumed, notHonoured, seed, sources: [...sources] };
  if (!act) { notHonoured.push({ on: 'act', words: request.text, why: 'no act was read', code: 'no_act' }); return out; }
  const H = cap.honours.filter((h) => h.act === act);
  if (!H.length) { notHonoured.push({ on: 'act', words: act, why: `this world does not ${act}`, code: 'act' }); return out; }
  if (actFrom !== 'said') assumed.push({ key: 'act', value: act, from: actFrom });
  // the change sense of make ("make the house red", "make it red"): its object refers to things that are there and it
  // says only their new values; decided by reference over the view, planned as the act change when the world honours it
  if (act === 'make' && changeSense(live, request, opts)) {
    const Hc = cap.honours.filter((h) => h.act === 'change');
    if (Hc.length) { out.act = 'change'; out.sense = 'change'; return referencePlan(live, request, opts, out, Hc, 'change'); }
  }
  if ((act !== 'make' && act !== 'connect') || (act === 'connect' && request.refers === 'named')) return referencePlan(live, request, opts, out, H, act);
  const random = request.constraints.some((c) => c.on === 'manner' && c.value === 'random') || !!opts.vary; // "random", or a redo: varied within the range
  const catalog = [].concat(opts.catalog ?? []);
  const from = { world: live, expect: catalog };
  const makeable = (k) => cap.kinds.get(k)?.has('make') ?? false;
  const can = (k, a) => cap.kinds.get(k)?.has(a) ?? false;

  // the target: said, the dialogue's, the world's own (the first thing it declares to make)
  let target = request.refers === 'last' ? (request.target ?? opts.dialogue?.last?.target ?? null) : request.target, targetFrom = 'said';
  if (!target) { const k = request.constraints.find((c) => c.on === 'kind' && c.want === 'yes' && makeable(c.value)); if (k) target = k.value; }
  const guessable = !request.unread?.length; // an unread word may be where the thing stands: the target is never guessed over it, like the act
  if (!target && guessable && has('dialogue') && opts.dialogue?.last?.target) { target = opts.dialogue.last.target; targetFrom = 'dialogue'; }
  if (!target && guessable && has('world')) { const t = H.flatMap((h) => h.of).find((k) => rowsOf(live, 'k.expect.make').some((m) => first(m, 'thing') === k)) ?? H.flatMap((h) => h.of)[0]; if (t) { target = t; targetFrom = 'world'; } }
  if (!target) { notHonoured.push({ on: 'target', words: request.text, why: 'nothing to make was read', code: 'no_target' }); return out; }
  out.target = target;
  if (targetFrom !== 'said') assumed.push({ key: 'target', value: target, from: targetFrom });
  const keys = new Set(H.filter((h) => !h.of.length || h.of.includes(target)).flatMap((h) => [...h.on]));

  // constraints the act does not honour here are named (those the dialogue added are dropped quietly)
  const cs = [];
  for (const c of request.constraints) {
    if (keys.has(c.on)) { cs.push(c); continue; }
    if (c.on === 'kind' && c.value === target && (c.want ?? 'yes') === 'yes') continue; // the target's own kind constraint is the target
    if ((c.origin ?? 'said') === 'said' && !c.det) notHonoured.push({ on: c.on, words: c.words ?? String(c.value ?? c.on), why: `this world does not take ${c.on} for ${act}`, code: 'not_declared', value: c.value }); // the number of a determiner is never a refusal
  }
  const C = (on) => cs.filter((c) => c.on === on);
  const nameIt0 = (c, why, code) => { if ((c.origin ?? 'said') === 'said') notHonoured.push({ on: c.on, words: c.words ?? String(c.value), why, code, value: c.value }); };

  // the expectation of the target: the world's own facts, then the catalog's
  let mk = null, mkFrom = null;
  for (const s of sources) if ((s === 'world' || s === 'expect') && !mk) { const m = rowsOf(from[s], 'k.expect.make').find((r) => first(r, 'thing') === target); if (m) { mk = m; mkFrom = s; } }
  let parts = mk ? rowsOf(from[mkFrom], 'k.expect.part').filter((p) => first(p, 'of') === target) : [];
  // a whole of the expectations whose parts this world cannot make ("a house" of walls and a roof, where the world
  // draws a house as one thing): the expectation does not apply here, the kind is made as one thing (said in `wholeAsOne`)
  let wholeAsOne = false;
  if (mk && parts.length && makeable(target) && !parts.some((p) => first(p, 'group') !== 'link' && (makeable(first(p, 'part')) || (p.shape ?? []).some(makeable)))) { mk = null; mkFrom = null; parts = []; wholeAsOne = true; }
  const scale = scaleOf([...(has('world') ? [live] : []), ...(has('expect') ? catalog : [])]);
  const amounts = (name) => rowsOf([...(has('world') ? [live] : []), ...(has('expect') ? catalog : [])], 'k.expect.amount').find((r) => first(r, 'name') === name);
  // a size or a value said of one of several kinds said ("a tiny house and a big sun": readRequest gives it `of`) goes
  // to the items of that kind only
  const kindsSaid = new Set(C('kind').filter((c) => c.want === 'yes' && c.value).map((c) => c.value));
  const perKind = (c) => kindsSaid.size > 1 && !!c.of && kindsSaid.has(c.of) && ['size', 'attribute'].includes(c.on);
  const sizeC = C('size').find((c) => !perKind(c));
  const sizeI = !sizeC && has('induced') && hints.sizeStep && keys.has('size') ? stepNext(scale, 'default', hints.sizeStep) : null; // the session's corrections, generalised
  const sizeStep = sizeC ? (sizeC.value ?? (sizeC.step === 'up' ? stepNext(scale, 'default', 'up') : sizeC.step === 'down' ? stepNext(scale, 'default', 'down') : 'default')) : sizeI ?? 'default';
  const lengthC = C('length')[0];
  const lengthStep = lengthC && !lengthC.unit ? lengthC.value : null;
  const cf = factor(scale, lengthStep ?? sizeStep) ?? 1;

  // the kinds: the shapes of a varied part, the parts of a whole, or the kind asked for
  const shaped = parts.find((p) => (p.shape ?? []).length);
  const isLink = (p) => first(p, 'group') === 'link';
  const whole = !!mk && makeable(target);
  const unit = mk ? first(mk, 'unit') : null;
  const wantK = C('kind').filter((c) => c.want === 'yes' && c.value && !(c.value === target && mk)), noK = new Set(C('kind').filter((c) => c.want === 'no').map((c) => c.value));
  const notAll = C('kind').filter((c) => c.want === 'not_all');
  const withs = C('with');
  for (const c of wantK) if (!makeable(c.value) && !parts.some((p) => first(p, 'part') === c.value) && c.value !== target) notHonoured.push({ on: 'kind', words: c.words ?? c.value, why: `there is no ${c.value} here`, code: 'no_kind', value: c.value });
  let pool, poolFrom = 'said', mode, general = false;
  if (shaped) {
    mode = 'shapes';
    pool = wantK.map((c) => c.value).filter(makeable);
    if (!pool.length) { pool = (shaped.shape ?? []).filter(makeable); poolFrom = mkFrom; }
  } else if (parts.length) {
    mode = 'parts';
    pool = parts.filter((p) => !isLink(p)).map((p) => first(p, 'part')).filter(makeable); poolFrom = mkFrom;
  } else {
    mode = 'kind';
    pool = [...new Set([...(makeable(target) ? [target] : []), ...wantK.map((c) => c.value).filter(makeable)])];
    if (!pool.length) { // a general kind ("books"): its makeable subkinds, by the world's lineage, in the order declared
      const sub = [...cap.kinds.keys()].filter((k) => makeable(k) && k !== target && kindLineage(k, { live }).includes(target));
      if (sub.length) { pool = sub; general = true; poolFrom = 'world'; }
    }
  }
  // exclusions that would leave nothing to make give way, the oldest first, and are named
  const exclusions = C('kind').filter((c) => c.want === 'no');
  const out1 = (k) => noK.has(k) || kindLineage(k, { live }).some((p) => noK.has(p)); // not wanted, itself or as a kind of a kind not wanted
  while (pool.length && !pool.some((k) => !out1(k)) && exclusions.length) { // bounded: the exclusions
    const c = exclusions.shift();
    if (pool.some((k) => k === c.value || kindLineage(k, { live }).includes(c.value)) && noK.has(c.value)) { noK.delete(c.value); nameIt0(c, 'nothing would be left to make', 'nothing_left'); }
  }
  pool = pool.filter((k) => !out1(k));
  if (!pool.length && !whole) {
    if (!notHonoured.some((n) => n.code === 'no_kind')) notHonoured.push({ on: 'kind', words: target, why: `there is no ${target} here`, code: 'no_kind', value: target });
    return out;
  }

  // the count: said (a number, a range, an amount), else the expectation scaled by the size, else one
  const wholeC = whole ? C('count').find((c) => c.of === target && c.of !== unit && c.number > 1 && !c.bound) ?? null : null; // "3 necklaces": that many wholes, each planned alike
  const countC = C('count').find((c) => c !== wholeC && (!c.of || c.of === unit || c.of === target || pool.includes(c.of))) ?? null;
  let lo, hi, typ, countFrom;
  // a plural kind said with no number: several, as the expectations say for that kind (k.expect.value on=count, given
  // plural=yes), else the amount "some" of the catalog, else two to four
  const severalOf = (kind) => {
    const e = expectedValue(kind, 'count', { ...saidKnown, plural: 'yes' }, whenCtx);
    if (e && (e.min !== undefined || e.typical !== undefined || (e.value !== undefined && !Number.isNaN(Number(e.value))))) { const t = e.typical ?? num(e.value) ?? e.min; const l = e.min ?? Math.min(t, 2); const h = Math.max(l, e.max ?? t); return { lo: l, hi: h, typ: Math.min(h, Math.max(l, t)), from: e.from }; }
    const a = amounts('some') ?? amounts('few');
    const l = num(first(a, 'min')) ?? 2, h = num(first(a, 'max')) ?? 4;
    return { lo: l, hi: h, typ: num(first(a, 'typical')) ?? l, from: a ? 'expect' : 'sampled' };
  };
  const baseMin = mk ? num(first(mk, 'min')) : 1, baseMax = mk ? num(first(mk, 'max')) : 1, baseTyp = mk ? num(first(mk, 'typical')) : 1;
  const whenCtx = { live, catalog: has('expect') ? catalog : [], sources: ['world', 'expect'].filter(has) };
  const saidKnown = { ...(sizeC || sizeI ? { size: sizeStep } : {}), ...Object.fromEntries(C('attribute').filter((c) => c.want === 'yes').map((c) => [c.attribute ?? 'colour', c.value])) };
  const countWhen = (() => { const e = expectedValue(target, 'count', saidKnown, whenCtx); return e && (e.min !== undefined || e.typical !== undefined || e.max !== undefined) ? e : null; })();
  if (lengthC?.unit && mk && lengthC.unit === unit && lengthC.number !== undefined) { lo = hi = typ = lengthC.number; countFrom = 'said'; }
  else if (countC) {
    countFrom = 'said';
    if (countC.amount) { const a = amounts(countC.amount); lo = num(first(a, 'min')) ?? 2; hi = num(first(a, 'max')) ?? lo + 2; typ = num(first(a, 'typical')) ?? lo; if (!a) countFrom = 'sampled'; }
    else if (countC.min !== undefined) { lo = countC.min; hi = countC.max; typ = Math.round((lo + hi) / 2); }
    else if (countC.bound === 'about') { const a = amounts('about'); const n = countC.number; lo = Math.max(1, Math.round(n * (num(first(a, 'min_factor')) ?? 1))); hi = Math.round(n * (num(first(a, 'max_factor')) ?? 1)); typ = n; }
    else if (countC.bound === 'min') { lo = countC.number + (countC.exclusive ? 1 : 0); hi = Math.max(lo, baseMax, lo + 2); typ = lo; }
    else if (countC.bound === 'max') { hi = countC.number - (countC.exclusive ? 1 : 0); lo = Math.min(hi, Math.max(1, baseMin)); typ = hi; }
    else lo = hi = typ = countC.number;
  } else if (wantK.some((c) => c.plural) && mode === 'kind') {
    const p = severalOf(wantK.find((c) => c.plural).value); lo = p.lo; hi = p.hi; typ = p.typ; countFrom = p.from;
  } else if (countWhen) { // a conditional expectation of the count (k.expect.when key=count min= max= typical= if.size=...)
    lo = countWhen.min ?? countWhen.typical ?? 1; hi = Math.max(lo, countWhen.max ?? lo); typ = Math.min(hi, Math.max(lo, countWhen.typical ?? lo)); countFrom = countWhen.from;
  } else {
    const cfw = mk ? cf : 1; // the size scales the count of a whole's units; one thing of a kind stays one ("a huge atlas")
    lo = Math.max(1, Math.round(baseMin * cfw)); hi = Math.max(lo, Math.round(baseMax * cfw)); typ = Math.min(hi, Math.max(lo, Math.round(baseTyp * cfw))); countFrom = mk ? mkFrom : mode === 'kind' && wantK.length && wantK.every((c) => !c.plural) ? 'said' : 'world'; // a kind said in the singular is one, as said
  }
  let n = random ? pick(rnd, lo, hi, true) : Math.min(hi, Math.max(lo, typ));
  // coordinated kinds ("two novels and a comic"): each count stays with the kind it stands before; a kind said with
  // no number is one
  // no number, or several: kinds said together outside a whole ("a sky and a sun") are each one, a plural one several
  // (severalOf); inside a whole they start from a count said
  const saidKinds = wantK.filter((c, i, a) => pool.includes(c.value) && a.findIndex((x) => x.value === c.value) === i);
  const countOfKind = (k) => C('count').find((x) => x.of === k && x.number !== undefined && !x.bound);
  const coordinated = (mode === 'shapes' || mode === 'kind') && saidKinds.length >= 2 && (C('count').some((c) => c.of && c.number !== undefined && !c.bound && pool.includes(c.of)) || (mode === 'kind' && !C('count').some((c) => !c.of)))
    ? saidKinds.map((c) => { const said = countOfKind(c.value); if (said) return { kind: c.value, n: said.number, from: 'said' }; if (c.plural) { const p = severalOf(c.value); return { kind: c.value, n: random ? pick(rnd, p.lo, p.hi, true) : p.typ, from: p.from }; } return { kind: c.value, n: 1, from: 'said' }; })
    : null;
  if (coordinated) { n = coordinated.reduce((a, x) => a + x.n, 0); lo = hi = typ = n; countFrom = 'said'; for (const x of coordinated) if (x.from !== 'said') assumed.push({ key: 'count', value: x.n, from: x.from, of: x.kind }); }
  const saidCount = countFrom === 'said' ? [lo, hi] : null;
  if (random && !countC) countFrom = 'sampled';
  if (mode === 'shapes' && notAll.length && n < 2) n = 2;

  const items = []; // { kind, part }
  let kindsFrom = poolFrom;
  if (coordinated) for (const x of coordinated) for (let i = 0; i < x.n; i++) items.push({ kind: x.kind }); // bounded: the counts said
  else if (mode === 'shapes' || mode === 'kind') {
    let k;
    const kmin = mk ? num(first(mk, 'kinds_min')) ?? 1 : 1, kmax = mk ? num(first(mk, 'kinds_max')) ?? kmin : 1;
    if (wantK.length) k = pool.length;
    else if (random) { k = pick(rnd, kmin, Math.max(kmin, kmax)); kindsFrom = 'sampled'; }
    else k = kmin;
    if (notAll.length || C('kind').some((c) => c.want === 'not_all' && !c.value)) k = Math.max(k, 2);
    if (mode === 'kind' && !wantK.length && !notAll.length) k = 1;
    if (general && !wantK.some((c) => c.value !== target)) k = pool.length; // a general kind is a mix of its subkinds
    k = Math.max(1, Math.min(k, pool.length, n));
    if (notAll.length && pool.length < 2) notHonoured.push({ on: 'kind', words: notAll[0].words, why: 'there is only one kind here', code: 'one_kind' });
    let chosen = random ? shuffle(rnd, pool).slice(0, k) : pool.slice(0, k);
    for (const c of notAll) if (c.value && pool.includes(c.value) && !chosen.includes(c.value) && chosen.length < 2) chosen = [c.value, ...chosen].slice(0, Math.max(2, k));
    const order = Array.from({ length: n }, (_, i) => chosen[i % chosen.length]);
    for (const kind of random ? shuffle(rnd, order) : order) items.push({ kind });
  } else {
    // parts: needed ones at least once, the wanted and the "with" ones at least once, the rest to the count
    const rows = parts.filter((p) => !isLink(p) && pool.includes(first(p, 'part'))).map((p) => {
      const part = first(p, 'part'), min = num(first(p, 'min')) ?? 0, max = num(first(p, 'max')) ?? min, typical = num(first(p, 'typical')) ?? min;
      const must = first(p, 'needed') === 'yes' || wantK.some((c) => c.value === part) || withs.some((c) => c.value === part);
      const fixed = C('count').find((c) => c.of === part);
      const lo1 = must ? Math.max(1, Math.round(min * Math.min(cf, 1)) || 1) : Math.round(min * Math.min(cf, 1));
      const hi1 = Math.max(lo1, Math.round(max * cf));
      const c0 = fixed ? fixed.number ?? fixed.min : random ? pick(rnd, lo1, hi1) : Math.min(hi1, Math.max(lo1, Math.round(typical * cf)));
      return { part, lo: fixed ? c0 : lo1, hi: fixed ? c0 : hi1, n: c0, must, fixed: !!fixed };
    });
    let sum = rows.reduce((a, r) => a + r.n, 0);
    const target1 = n; // the count resolved above (said, scaled, or sampled), shared out over the parts
    for (let guard = 0; sum !== target1 && guard < 1000; guard++) { // bounded: a thousand moves
      const up = sum < target1;
      const can1 = rows.filter((r) => !r.fixed && (up ? r.n < r.hi : r.n > r.lo));
      if (!can1.length) break;
      const r = random ? can1[below(rnd, can1.length)] : (up ? can1.sort((a, b) => a.n - b.n)[0] : can1.sort((a, b) => b.n - a.n)[0]);
      r.n += up ? 1 : -1; sum += up ? 1 : -1;
    }
    if (notAll.length && rows.filter((r) => r.n > 0).length < 2) { const r = rows.find((x) => x.n === 0); if (r) { r.n = 1; sum += 1; } }
    n = sum;
    for (const r of rows) for (let i = 0; i < r.n; i++) items.push({ kind: r.part, part: r.part }); // bounded: the counts planned
    kindsFrom = random ? 'sampled' : mkFrom;
  }

  // with: parts that must be there (links between the items, or a kind of the pool)
  const linkPart = parts.find(isLink);
  let links = 0;
  for (const c of withs) {
    if (linkPart && (c.value === first(linkPart, 'part'))) { links = Math.max(1, items.length - 1); continue; }
    if (items.some((it) => it.kind === c.value)) continue;
    if (makeable(c.value)) { items.push({ kind: c.value }); continue; }
    notHonoured.push({ on: 'with', words: c.words ?? c.value, why: `there is no ${c.value} here`, code: 'no_kind', value: c.value });
  }
  if (linkPart && !links && !noK.has(first(linkPart, 'part')) && (num(first(linkPart, 'typical')) ?? 0) > 0) links = items.length - 1;
  if (linkPart && noK.has(first(linkPart, 'part'))) links = 0;

  // roles on the whole and on each item: only where a slot takes them (a declared key nothing takes is named)
  const wholeSlots = whole ? slotsOf(live, target) : new Map();
  const itemSlots = (k) => slotsOf(live, k);
  const wholeArgs = {}, itemArgs = {};
  const placeRole = (key, value, { onItems = true, onWhole = true, label = key } = {}) => {
    const fits = (slots) => { const s = slots.get(key); if (!s) return undefined; if (s.enum && !s.enum.map(V).includes(value)) return null; return value; };
    let put = false, refused = false;
    if (onWhole && whole) { const v = fits(wholeSlots); if (v !== undefined && v !== null) { wholeArgs[key] = v; put = true; } else if (v === null) refused = true; }
    if (!put && onItems && items.length) { const ok = items.every((it) => fits(itemSlots(it.kind)) !== undefined); if (ok && items.every((it) => fits(itemSlots(it.kind)) !== null)) { itemArgs[key] = value; put = true; } else if (ok) refused = true; }
    return put ? 'put' : refused ? 'refused' : 'none';
  };
  const said = (c) => (c.origin ?? 'said') === 'said';
  const nameIt = (c, why, code) => { if (said(c)) notHonoured.push({ on: c.on, words: c.words ?? String(c.value), why, code, value: c.value }); };
  // size: each item's size factor, from the scale
  if (sizeI && sizeI !== 'default') { const f = factor(scale, sizeStep, 'size'); if (placeRole('size', itemSlots(items[0]?.kind).get('size')?.enum ? sizeStep : f ?? sizeStep, { onWhole: false }) === 'put' || placeRole('size', sizeStep, { onItems: false }) === 'put') assumed.push({ key: 'size', value: sizeStep, from: 'induced' }); }
  if (sizeC) { const f = factor(scale, sizeStep, 'size'); const r = placeRole('size', itemSlots(items[0]?.kind).get('size')?.enum ? sizeStep : f ?? sizeStep, { onWhole: false }); if (r !== 'put' && placeRole('size', sizeStep, { onItems: false }) !== 'put') nameIt(sizeC, 'nothing here has a size', 'no_slot'); }
  for (const c of C('extent')) { const f = factor(scale, c.value, 'extent'); const r = placeRole('extent', wholeSlots.get('extent')?.enum ? c.value : f ?? c.value, { onItems: false }); if (r !== 'put') nameIt(c, 'nothing here has an extent', 'no_slot'); }
  for (const c of C('attribute')) { if (c.want === 'no' || perKind(c)) continue; const key = c.attribute ?? 'colour'; const r = placeRole(key, c.value); if (r !== 'put') nameIt(c, r === 'refused' ? `${c.value} is not a ${key} here` : `nothing here has a ${key}`, r === 'refused' ? 'value' : 'no_slot'); }
  for (const c of C('place')) {
    if (hints.place && items.length && items.every((it) => itemSlots(it.kind).has(hints.place.key))) { itemArgs[hints.place.key] = `$${hints.place.id}`; if (c.value !== hints.place.id) assumed.push({ key: 'place', value: hints.place.id, from: hints.place.from, words: c.words, ...(hints.place.from === 'world' ? { default: true } : {}) }); continue; }
    if (c.ref) { nameIt(c, `nothing here is what ${c.ref} could be`, 'no_referent'); continue; }
    const r = placeRole('place', c.value); if (r !== 'put') nameIt(c, r === 'refused' ? `there is no place ${c.value} here` : 'nothing here has a place', r === 'refused' ? 'value' : 'no_slot'); }
  for (const c of C('about')) { const r = placeRole('about', c.value, { onItems: false }); if (r !== 'put' && placeRole('about', c.value) !== 'put') nameIt(c, 'nothing here has a topic', 'no_slot'); }
  if (lengthC) {
    if (lengthC.unit && lengthC.unit === unit) { /* the count of the units, above */ }
    else if (lengthC.unit && mk && lengthC.unit === first(mk, 'length_unit')) { if (placeRole('length', lengthC.number, { onItems: false }) !== 'put') nameIt(lengthC, 'nothing here has a length', 'no_slot'); }
    else if (!lengthC.unit && mk && first(mk, 'length')) { if (placeRole('length', Math.round(num(first(mk, 'length')) * cf), { onItems: false }) !== 'put') nameIt(lengthC, 'nothing here has a length', 'no_slot'); }
    else if (lengthC.unit) nameIt(lengthC, `the length is not counted in ${lengthC.unit}s here`, 'unit');
  } else if (mk && first(mk, 'length') && wholeSlots.has('length')) { const v = Math.round(num(first(mk, 'length')) * cf); wholeArgs.length = v; assumed.push({ key: 'length', value: v, from: mkFrom }); }
  // layout: said, the dialogue's, the world's expectation, the catalog's, the slot's default; "random" samples one
  const layoutSlot = whole ? wholeSlots.get('layout') : null;
  if ((layoutSlot || C('layout').length) && !(wholeArgs.layout !== undefined && C('attribute').some((x) => x.attribute === 'layout'))) { // a layout said as a value of the slot stands
    const enumL = layoutSlot?.enum?.map(V) ?? null;
    const lc = C('layout')[0];
    let value = null, lf = null, lDefault = false; // lDefault: the value is the world's own declared default (its make expectation or the slot's default): not news
    if (lc && (!enumL || enumL.includes(lc.value))) { value = lc.value; lf = 'said'; }
    else if (lc && enumL && ['better', undefined, null].includes(lc.value)) { const lastL = opts.dialogue?.result?.layout ?? null; value = enumL.find((x) => x !== lastL && x !== first(mk, 'layout')) ?? enumL[0]; lf = 'sampled'; }
    else if (lc) { nameIt(lc, `the layouts here are ${(enumL ?? []).join(', ')}`, 'value'); }
    if (!value) for (const s of sources) {
      if (s === 'dialogue' && opts.dialogue?.last) { const d = opts.dialogue.last.constraints?.find((c) => c.on === 'layout' && (!enumL || enumL.includes(c.value))); if (d) { value = d.value; lf = 'dialogue'; } }
      if (s === 'induced' && hints.layout && !hints.drop?.has('layout') && (!enumL || enumL.includes(hints.layout))) { value = hints.layout; lf = 'induced'; }
      if (s === 'world' && !value && mkFrom === 'world' && first(mk, 'layout') && (!enumL || enumL.includes(first(mk, 'layout')))) { value = first(mk, 'layout'); lf = 'world'; lDefault = true; }
      if (s === 'expect' && !value && mk && mkFrom === 'expect' && first(mk, 'layout') && (!enumL || enumL.includes(first(mk, 'layout')))) { value = first(mk, 'layout'); lf = 'expect'; lDefault = true; }
      if ((s === 'world' || s === 'expect') && !value) { const e = expectedValue(target, 'layout', { count: n, ...saidKnown }, { ...whenCtx, sources: [s] }); if (e?.value !== undefined && (!enumL || enumL.includes(e.value))) { value = e.value; lf = s; } } // a conditional expectation before the slot's default
      if (s === 'world' && !value && layoutSlot?.default) { value = V(layoutSlot.default); lf = 'world'; lDefault = true; }
      if (s === 'sampled' && !value && enumL && random) { value = enumL[below(rnd, enumL.length)]; lf = 'sampled'; }
      if (value) break;
    }
    if (random && !lc && enumL) { value = enumL[below(rnd, enumL.length)]; lf = 'sampled'; }
    if (value) { if (layoutSlot) { wholeArgs.layout = value; if (lf !== 'said') assumed.push({ key: 'layout', value, from: lf, ...(lDefault ? { default: true } : {}) }); } else if (lc) nameIt(lc, 'nothing here has a layout', 'no_slot'); }
  }
  if (hints.place && !C('place').length && items.length && items.every((it) => itemSlots(it.kind).has(hints.place.key))) { itemArgs[hints.place.key] = `$${hints.place.id}`; assumed.push({ key: 'place', value: hints.place.id, from: hints.place.from, ...(hints.place.from === 'world' ? { default: true } : {}) }); }
  // a manner other than random is soft: a slot takes it where there is one
  for (const c of C('manner')) if (c.value !== 'random') placeRole('manner', c.value);
  // attribute values the dialogue state gives (the last request's), for the keys this request leaves open
  if (has('dialogue') && opts.dialogue?.last) for (const c of opts.dialogue.last.constraints ?? []) if (c.on === 'attribute' && c.want === 'yes' && keys.has('attribute') && !C('attribute').some((x) => x.attribute === c.attribute) && itemArgs[c.attribute] === undefined && wholeArgs[c.attribute] === undefined) { if (placeRole(c.attribute, c.value) === 'put') assumed.push({ key: c.attribute, value: c.value, from: 'dialogue' }); }
  // the common pattern of this world's things of the kinds made (anti-unification), for the keys still open
  const inducedKeys = new Set();
  if (has('induced') && hints.attrs) for (const [key, value] of Object.entries(hints.attrs)) {
    if (hints.drop?.has(key) || itemArgs[key] !== undefined || C('attribute').some((x) => x.attribute === key)) continue;
    if (key === 'size' ? (!keys.has('size') || sizeC || sizeI) : !keys.has('attribute')) continue;
    if (placeRole(key, value, { onWhole: false }) === 'put') { assumed.push({ key, value, from: 'induced' }); inducedKeys.add(key); }
  }

  if (countFrom !== 'said') assumed.push({ key: 'count', value: n, from: countFrom });
  const kindsUsed = [...new Set(items.map((it) => it.kind))];
  if ((!wantK.length || general) && kindsUsed.length && (mode !== 'kind' || kindsUsed[0] !== target)) assumed.push({ key: 'kinds', value: kindsUsed.join(', '), from: kindsFrom });

  // the steps: the whole, its items (in it where they can be), the links
  const steps = [];
  if (whole) steps.push({ action: 'make', args: { kind: target, ...wholeArgs } });
  const inWhole = whole && items.every((it) => itemSlots(it.kind).has('in'));
  const own = new Map(); // kind -> the args said of it alone
  for (const c of cs.filter((x) => perKind(x) && (x.want ?? 'yes') === 'yes')) {
    const ks = [...new Set(items.map((it) => it.kind))].filter((k) => k === c.of || kindLineage(k, { live }).includes(c.of));
    if (!ks.length) continue;
    const key = c.on === 'size' ? 'size' : c.attribute ?? 'colour';
    for (const k of ks) {
      const sl = itemSlots(k).get(key);
      if (!sl) { nameIt(c, `nothing here has a ${key}`, 'no_slot'); continue; }
      let v = c.value;
      if (c.on === 'size') { const st = c.value ?? (c.step ? stepNext(scale, 'default', c.step) : 'default'); v = sl.enum ? st : factor(scale, st, 'size') ?? st; }
      if (sl.enum && !sl.enum.map(V).includes(v)) { nameIt(c, `${c.value} is not a ${key} here`, 'value'); continue; }
      own.set(k, { ...(own.get(k) ?? {}), [key]: v });
    }
  }
  for (const it of items) steps.push({ action: 'make', args: { kind: it.kind, ...itemArgs, ...(own.get(it.kind) ?? {}), ...(inWhole ? { in: { step: 0 } } : {}) }, item: true });
  const first0 = whole ? 1 : 0;
  const layout = wholeArgs.layout;
  if (links && items.every((it) => can(it.kind, 'connect'))) for (let i = 1; i <= links && i < items.length; i++) steps.push({ action: 'connect', args: { a: { step: first0 + (layout === 'tree' ? Math.floor((i - 1) / 2) : i - 1) }, b: { step: first0 + i } }, link: true }); // bounded: the items
  else if (links) for (const c of withs) if (linkPart && c.value === first(linkPart, 'part')) nameIt(c, `the ${kindsUsed.join(', ')} cannot be connected here`, 'not_allowed');
  // conditional expectations (k.expect.when) for the keys a slot takes and nothing filled: per item (its kind, its other
  // values, its role in the links: start, branch, leaf, middle) and on the whole; two passes, so one default can
  // condition another (an atlas is big, a big book goes at the right)
  const roleOf = new Map();
  { const lk = steps.filter((x) => x.link), into = new Map(), outOf = new Map();
    for (const l of lk) { outOf.set(l.args.a.step, (outOf.get(l.args.a.step) ?? 0) + 1); into.set(l.args.b.step, (into.get(l.args.b.step) ?? 0) + 1); }
    if (lk.length) steps.forEach((x, i) => { if (!x.item) return; const a = into.get(i) ?? 0, b = outOf.get(i) ?? 0; roleOf.set(i, !a ? 'start' : b > 1 ? 'branch' : !b ? 'leaf' : 'middle'); }); }
  const whenSeen = new Map();
  const fillWhen = (x, slots, known0, keysOpen) => {
    for (let pass = 0; pass < 2; pass++) for (const key of keysOpen) { // bounded: two passes over the slots of one kind
      const induced = inducedKeys.has(key) && x.args[key] === itemArgs[key]; // an induced value gives way to an expectation whose conditions hold here
      if (x.args[key] !== undefined && !induced) continue;
      const { [key]: _, ...others } = x.args;
      const e = expectedValue(x.args.kind, key, { ...known0, ...(induced ? others : x.args) }, whenCtx);
      if (!e || e.value === undefined || (induced && !e.because.length)) continue;
      if (induced && e.value === x.args[key]) continue;
      const s0 = slots.get(key);
      if (s0?.enum && !s0.enum.map(V).includes(e.value)) continue;
      x.args[key] = e.value;
      const k1 = `${key}=${e.value}`;
      if (!whenSeen.has(k1)) { const a = { key, value: e.value, from: e.from, ...(e.because.length ? { because: e.because.join(', ') } : {}) }; whenSeen.set(k1, a); assumed.push(a); }
    }
  };
  const skipKey = new Set(['kind', 'world', 'in', 'id']);
  steps.forEach((x, i) => {
    if (x.link) return;
    const slots = slotsOf(live, x.args.kind);
    const open = [...slots.keys()].filter((k) => !skipKey.has(k) && !slots.get(k)?.refs?.length);
    fillWhen(x, slots, { count: n, ...saidKnown, ...(roleOf.has(i) ? { role: roleOf.get(i) } : {}) }, open);
  });
  for (const key of inducedKeys) if (!steps.some((x) => x.item && x.args[key] === itemArgs[key])) { const i = assumed.findIndex((a) => a.key === key && a.from === 'induced'); if (i >= 0) assumed.splice(i, 1); } // an induced value no item kept
  if (whole) Object.assign(wholeArgs, Object.fromEntries(Object.entries(steps[0].args).filter(([k]) => k !== 'kind')));
  out.roles = { count: n, kinds: kindsUsed, size: sizeStep, ...wholeArgs, ...itemArgs, links: steps.filter((s) => s.link).length, mode };
  if (wholeAsOne) out.asOne = target; // the expectation's parts are not made here: the whole is one thing
  if (wholeC) { // the steps of one whole, again for each further whole, their step references moved along
    const one = steps.length, shift = (v, k) => (v && typeof v === 'object' && 'step' in v ? { step: v.step + k * one } : v);
    for (let k = 1; k < wholeC.number; k++) for (let i = 0; i < one; i++) steps.push({ ...steps[i], args: Object.fromEntries(Object.entries(steps[i].args).map(([a, v]) => [a, shift(v, k)])) }); // bounded: the wholes said times the steps of one
  }
  out.steps = steps;
  out.ok = items.length > 0;
  out.bounds = { count: saidCount, not: [...noK] }; // what deduction checks the made items against
  return out;
}

/**
 * An act on things that are there (remove, change, place ...): the things the request refers to, resolved on the
 * world's state (factsOf): "them" / "it" are the last result; else the things of the kind named (by lineage), those of
 * a kind not wanted left out, filtered by the values said before the kind ("the red novels"); the values said after it
 * are the new values of a change, the place said is where a place puts them. Several things for a singular kind and
 * none in focus: one question (`ask`, reply refused.which); none: refused.no_such. The steps are one per thing.
 */
function referencePlan(live, request, opts, out, H, act) {
  const view = factsOf(live);
  const kindC = request.constraints.filter((c) => c.on === 'kind' && (c.want ?? 'yes') === 'yes' && c.value);
  // the whole world: "everything" (refers all), or a word for the world itself (its name, the kind it means)
  const wholeWorld = request.refers === 'all' || kindC.some((c) => c.world && (c.value === request.target || !request.target));
  const kind = request.refers === 'last' || request.refers === 'named' || wholeWorld ? null : request.target ?? kindC[0]?.value ?? null;
  const keys = new Set(H.filter((h) => !h.of.length || !kind || h.of.includes(kind) || kindLineage(kind, { live }).some((k) => h.of.includes(k))).flatMap((h) => [...h.on]));
  for (const c of request.constraints) if (!keys.has(c.on) && (c.origin ?? 'said') === 'said' && !c.det && !(c.on === 'kind' && (c.want ?? 'yes') === 'yes' && (c.value === kind || (wholeWorld && c.world)))) out.notHonoured.push({ on: c.on, words: c.words ?? String(c.value ?? c.on), why: `this world does not take ${c.on} for ${act}`, code: 'not_declared', value: c.value });
  const reply = (r, roles) => { out.replies = [...(out.replies ?? []), { reply: r, roles }]; return out; };
  let ids, objects = null;
  if (request.refers === 'named') { // things said by their names: each name one thing (several things of one name: the question)
    const inView = (id) => stateIds(live, view, [id]).length > 0 && (!kindC.length || kindC.some((c) => view.thing(id).kinds.includes(c.value) || kindLineage(view.thing(id).kinds[0], { live }).includes(c.value)));
    const all = (request.named ?? []).map((n) => ({ ...n, ids: n.ids.map(strip).filter(inView) })).filter((n) => n.ids.length);
    objects = act === 'connect' || all.every((n) => n.prep) ? all : all.filter((n) => !n.prep); // after a preposition a name is where, unless all are
    for (const n of all.filter((x) => !objects.includes(x))) out.notHonoured.push({ on: 'place', words: n.words, why: `a thing as the place of ${act} is not read here`, code: 'not_declared' });
    const amb = objects.find((n) => n.ids.length > 1);
    if (amb) { out.ask = true; return reply('refused.which', { kind: amb.words, number: amb.ids.length }); }
    ids = objects.map((n) => n.ids[0]);
  } else if (request.refers === 'last') ids = [...(opts.dialogue?.lastRun?.made ?? opts.dialogue?.result?.things ?? [])].map(strip).filter((id) => view.thing(id));
  else if (wholeWorld) ids = worldThings(live, view, act, H);
  else if (kind) ids = stateOfKind(live, view, kind);
  else { out.notHonoured.push({ on: 'target', words: request.text, why: 'nothing named was read', code: 'no_target' }); return out; }
  const kindAt = request.refers === 'named' ? request.refersAt ?? -1 : kindC.find((c) => c.value === kind)?.at ?? kindC[0]?.at ?? (request.refers === 'last' || wholeWorld ? request.refersAt ?? -1 : Infinity);
  const noK = request.constraints.filter((c) => c.on === 'kind' && c.want === 'no' && c.value).map((c) => c.value);
  const attrs = request.constraints.filter((c) => c.on === 'attribute' && (c.want ?? 'yes') === 'yes' && keys.has('attribute'));
  const selectors = act === 'remove' ? attrs : attrs.filter((c) => (c.at ?? 0) < kindAt);
  const values = act === 'remove' ? [] : attrs.filter((c) => !selectors.includes(c));
  ids = ids.filter((id) => !(view.thing(id)?.kinds ?? []).some((k) => noK.includes(k)) && selectors.every((c) => view.values(id, c.attribute ?? 'colour').map(String).includes(String(c.value))));
  const countC = request.constraints.find((c) => c.on === 'count' && c.number !== undefined);
  if (countC) ids = ids.slice(-countC.number); // "remove 2 novels": the newest
  out.target = kind;
  if (wholeWorld) out.whole = 'world';
  if (!ids.length) return reply(wholeWorld ? 'state.empty' : 'refused.no_such', wholeWorld ? {} : { thing: plain(kind ?? request.named?.[0]?.words ?? request.text) });
  if (act === 'connect') { // things named, joined in the order said: the first to the second, the second to the third
    if (ids.length < 2) { out.notHonoured.push({ on: 'target', words: request.text, why: 'two things are needed to connect', code: 'no_target' }); return out; }
    out.steps = ids.slice(1).map((b, i) => ({ action: 'connect', args: { a: `$${ids[i]}`, b: `$${b}` } }));
    const byKind = {}; for (const id of ids) { const k = view.thing(id)?.kinds?.[0]; if (k) byKind[k] = (byKind[k] ?? 0) + 1; }
    out.roles = { count: ids.length, things: ids, byKind, links: out.steps.length };
    out.ok = true; out.reference = true;
    return out;
  }
  const several = request.refers === 'last' || request.refers === 'named' || wholeWorld || kindC[0]?.plural || countC || request.constraints.some((c) => c.on === 'count' && c.amount);
  if (ids.length > 1 && !several && kindC.find((c) => c.value === kind)?.indefinite) ids = ids.slice(-1); // "a novel": any one, the newest
  if (ids.length > 1 && !several) { out.ask = true; return reply('refused.which', { kind: plain(kind), number: ids.length }); }
  const set = {};
  for (const c of values) set[c.attribute ?? 'colour'] = c.value;
  const sizeC = request.constraints.find((c) => c.on === 'size' && (c.value || c.step) && keys.has('size'));
  if (sizeC?.value && act !== 'remove') set.size = sizeC.value;
  const placeC = request.constraints.find((c) => c.on === 'place' && c.value && keys.has('place'));
  if (act === 'place' && placeC) set.place = placeC.value;
  // a size said as a step ("smaller"): one grade of the scale from the size each thing has now
  const stepped = sizeC && !sizeC.value && sizeC.step && act !== 'remove' ? scaleOf([live, ...[].concat(opts.catalog ?? [])]) ?? true : null;
  const sizeOf = (id) => { const now = view.values(id, 'size')[0]; return stepNext(stepped === true ? null : stepped, now === undefined ? 'default' : String(now), sizeC.step); };
  if (act !== 'remove' && !Object.keys(set).length && !stepped) return reply('refused.missing_value', { key: act === 'place' ? 'place' : 'value' });
  if (act === 'remove' && ids.length > 1) { const set = new Set(ids); const held = (id) => view.inbound(id).some((x) => set.has(x.thing ?? x)); ids = [...ids.filter((id) => !held(id)), ...ids.filter(held)]; } // what other things are in goes last
  out.steps = ids.map((id) => ({ action: act, args: { thing: `$${id}`, ...set, ...(stepped ? { size: sizeOf(id) } : {}) } }));
  const byKind = {}; for (const id of ids) { const k = view.thing(id)?.kinds?.[0]; if (k) byKind[k] = (byKind[k] ?? 0) + 1; }
  out.roles = { count: ids.length, things: ids, byKind, ...set, ...(stepped ? { size: sizeOf(ids[0]) } : {}) };
  out.ok = true; out.reference = true;
  return out;
}

/** The things of the world an act takes when it is said of the whole world: the things of its state (stateIds: never a declaration row such as std.schema.drawn) of a declared kind (std.schema.kind) the act is declared for, or of a kind its honours name, along the lineage. */
function worldThings(live, view, act, H) {
  const declared = capabilitiesOf(live).kinds, of = new Set(H.flatMap((h) => h.of));
  return stateIds(live, view).filter((id) => (view.thing(id)?.kinds ?? []).some((k) => declared.has(k) && (declared.get(k).has(act) || kindLineage(k, { live }).some((x) => of.has(x)))));
}

/**
 * The change sense of make: the request's object refers to things that are there (the last result for "it", every
 * thing for "everything", or a kind said with a definite determiner of which the view has things) and the request says
 * only values after that object (an attribute or a size: "make the house red", "make the dogs smaller"), no number and
 * no other kind. A value before the object describes a new thing ("make a red house") and keeps the sense of make.
 */
function changeSense(live, request, opts) {
  const kinds = request.constraints.filter((c) => c.on === 'kind' && (c.want ?? 'yes') === 'yes' && c.value);
  if (request.constraints.some((c) => !['kind', 'attribute', 'size'].includes(c.on)) || kinds.length > 1) return false;
  const view = factsOf(live);
  let at = null;
  if (request.refers === 'last') { if ([...(opts.dialogue?.lastRun?.made ?? opts.dialogue?.result?.things ?? [])].some((id) => view.thing(strip(id)))) at = request.refersAt ?? -1; }
  else if (request.refers === 'named') { if ((request.named ?? []).some((n) => stateIds(live, view, n.ids.map(strip)).length)) at = request.refersAt ?? -1; }
  else if (request.refers === 'all' || kinds[0]?.world) { if (worldThings(live, view, 'change', capabilitiesOf(live).honours.filter((h) => h.act === 'change')).length) at = request.refersAt ?? kinds[0]?.at ?? -1; }
  else if (kinds[0]?.definite && stateOfKind(live, view, kinds[0].value).length) at = kinds[0].at;
  if (at === null) return false;
  const values = request.constraints.filter((c) => (c.on === 'attribute' || c.on === 'size') && (c.want ?? 'yes') === 'yes');
  return values.length > 0 && values.every((c) => c.at === undefined || c.at > at);
}

const NO_HINTS = Object.freeze({ attrs: null, layout: null, sizeStep: null, place: null, drop: null });
const strip = (id) => String(id).replace(/^\$/, '');

/**
 * A revision that changes only the count of the last plan (`dialogue.lastPlan`, the same target, every other honoured
 * constraint the same) keeps its structure: the last plan cut to n (cutToCount: breadth first along its links, so what
 * stays is connected) or filled up to n (fillToCount: the kinds in the proportions there are, each new item linked as
 * the plan links its items), "not all of one kind" kept (notAllOneKind). The result is checked like any candidate (run
 * on a fork, deduced); null when it does not apply or breaks a hard constraint.
 */
function keptStructure(live, request, opts) {
  const lastPlan = opts.dialogue?.lastPlan, last = opts.dialogue?.last;
  if (!lastPlan?.ok || !last || request.revisedFrom === undefined || !lastPlan.steps?.length) return null;
  const target = request.refers === 'last' ? (request.target ?? last.target) : request.target;
  if ((target ?? lastPlan.target) !== lastPlan.target) return null;
  const cap = capabilitiesOf(live);
  const keys = new Set(cap.honours.filter((h) => h.act === lastPlan.act && (!h.of.length || h.of.includes(lastPlan.target))).flatMap((h) => [...h.on]));
  const norm = (cs) => cs.filter((c) => c.on !== 'count' && keys.has(c.on)).map((c) => JSON.stringify([c.on, c.want ?? 'yes', c.value ?? null, c.attribute ?? null, c.number ?? null, c.min ?? null, c.max ?? null, c.amount ?? null])).sort();
  if (JSON.stringify(norm(request.constraints)) !== JSON.stringify(norm(last.constraints))) return null;
  const cc = request.constraints.find((c) => c.on === 'count' && !c.of), c0 = last.constraints.find((c) => c.on === 'count' && !c.of);
  if (!cc || cc.number === undefined || (c0 && c0.number === cc.number)) return null;
  const items = lastPlan.steps.map((s, i) => (s.item ? i : -1)).filter((i) => i >= 0);
  const n = cc.number;
  if (n === items.length || n < 1) return null;
  const links = lastPlan.steps.filter((s) => s.link).map((s) => ({ a: s.args.a.step, b: s.args.b.step }));
  const head = lastPlan.steps.filter((s) => !s.item && !s.link); // the whole, made first
  let itemSteps, linkPairs;
  if (n < items.length) {
    const cut = cutToCount(items, links, n);
    itemSteps = cut.keep.map((i) => lastPlan.steps[i]);
    linkPairs = cut.links.map((l) => [cut.keep.indexOf(l.a), cut.keep.indexOf(l.b)]);
  } else {
    const kinds = items.map((i) => lastPlan.steps[i].args.kind);
    const notAll = request.constraints.some((c) => c.on === 'kind' && c.want === 'not_all');
    const add = fillToCount(kinds, n, { pool: lastPlan.roles?.kinds ?? null, notAll });
    itemSteps = [...items.map((i) => lastPlan.steps[i]), ...add.map((k) => ({ ...(items.map((i) => lastPlan.steps[i]).findLast((s) => s.args.kind === k) ?? lastPlan.steps[items[0]]), args: { ...(items.map((i) => lastPlan.steps[i]).findLast((s) => s.args.kind === k) ?? lastPlan.steps[items[0]]).args, kind: k } }))];
    linkPairs = links.map((l) => [items.indexOf(l.a), items.indexOf(l.b)]);
    if (links.length) for (let i = items.length; i < n; i++) linkPairs.push([lastPlan.roles?.layout === 'tree' ? Math.floor((i - 1) / 2) : i - 1, i]); // bounded: the items added
  }
  if (request.constraints.some((c) => c.on === 'kind' && c.want === 'not_all')) {
    const ks = notAllOneKind(itemSteps.map((s) => s.args.kind), lastPlan.roles?.kinds ?? []);
    itemSteps = itemSteps.map((s, i) => (s.args.kind === ks[i] ? s : { ...s, args: { ...s.args, kind: ks[i] } }));
  }
  const h = head.length;
  const steps = [...head.map((s) => ({ ...s, args: { ...s.args } })), ...itemSteps.map((s) => ({ ...s, args: { ...s.args } })), ...linkPairs.map(([a, b]) => ({ action: 'connect', args: { a: { step: h + a }, b: { step: h + b } }, link: true }))];
  const kinds = [...new Set(itemSteps.map((s) => s.args.kind))];
  const plan = { ...lastPlan, steps, roles: { ...lastPlan.roles, count: itemSteps.length, kinds, links: linkPairs.length }, assumed: [], notHonoured: [], rejected: [], cannot: [], bounds: { ...(lastPlan.bounds ?? {}), count: [n, n] }, structure: n < items.length ? 'cut' : 'fill', seed: opts.seed ?? lastPlan.seed };
  if (typeof live?.fork === 'function' && typeof live?._compiled === 'function' && opts.reason !== false) { // the same check as any candidate
    const fork = live.fork();
    const run = runWorldPlan(fork, plan, { replace: opts.replace ?? [] });
    if (!run.ok) return null;
    const check = deduceState(factsOf(fork), run.made, { kindFacts: kindFactsOf([].concat(opts.catalog ?? [])), bounds: { ...plan.bounds, items: run.result.items } });
    if (check.hard.length) return null;
    plan.reasoning = { candidates: 1, depth: REASONING.depth, ticks: plan.steps.length + 1, exhausted: false, induced: [], soft: check.soft.map((x) => x.why), derived: check.derived.length, chosen: `kept the structure (${plan.structure} to ${n})` };
  }
  return plan;
}

/**
 * Plan a request in a live world from its declared capabilities, filling every gap from the sources in order
 * (`sources`, default REQUEST_SOURCES: said > dialogue > induced > world > expect > sampled), and reason a little on
 * the state of the world, in one bounded cycle (generate-and-test with constraints):
 *   propose  - at most REASONING.candidates ways to satisfy the request (the places a thing could go, read from a
 *              slot that refers to things; a reference word such as "there" or "in it"; a fall-back without the
 *              induced and dialogue values when a candidate breaks a hard constraint);
 *   simulate - each candidate is run on a fork of the live world (nothing changes in it);
 *   deduce   - forward chaining to depth 2 on the simulated state (factsOf, deduceState): what the world refuses
 *              (types, enums, deny rules, capacity), relations to things that are not there, the request's own
 *              bounds (kinds not wanted, the count said) are hard; what the catalog expects of the kinds present
 *              (k.commonsense, k.scenes, k.kinds: a fish is in water) and open required keys are soft;
 *   abduce   - the surviving candidates ranked by `choose` with the criteria of kind `plan` (std.decide, or the
 *              world's own): no hard violation, the fewest constraints not honoured, the fewest soft violations, the
 *              cheapest assumptions (a value's cost is the place of its source in `sources`, Hobbs et al. 1993),
 *              the fewest assumptions, the nearest referent;
 *   induce   - before all this, the common pattern of this world's things of the kinds made (anti-unification,
 *              induceStyle) and of the session's corrections (`dialogue.corrections`, induceCorrections) is a soft
 *              default of source `induced`, ranked before the world's own facts and k.expect.
 * `opts`: `catalog` (sources of k.expect and of the kind facts), `dialogue` ({ last, result, lastRun, corrections }),
 * `sources`, `seed`, `vary`, `replace` (the ids a revision will remove first), `ticks`, `candidates`, `reason: false`
 * (the plan alone). Returns { ok, act, target, roles, steps, assumed: [{ key, value, from }], notHonoured: [{ on,
 * words, why, code }], rejected: [{ place, why, hard }], cannot: [{ why }], bounds, reasoning, seed, sources }.
 * Nothing is changed.
 */
export function planRequest(live, request, opts = {}) {
  const sources = opts.sources ?? REQUEST_SOURCES;
  const kept = keptStructure(live, request, opts);
  if (kept) return kept;
  const base = planOnce(live, request, opts, NO_HINTS);
  if (!base.ok || base.reference || opts.reason === false || typeof live?.fork !== 'function' || typeof live?._compiled !== 'function') return { ...base, rejected: [], cannot: [], reasoning: null };
  const budget = { ticks: opts.ticks ?? REASONING.ticks, used: 0 };
  const max = Math.max(1, Math.min(opts.candidates ?? REASONING.candidates, REASONING.candidates));
  const c = live._compiled();
  const view = factsOf(live);
  const except = new Set((opts.replace ?? []).map(strip));
  const kindFacts = kindFactsOf([].concat(opts.catalog ?? []));
  const itemKinds = [...new Set(base.steps.filter((x) => x.item).map((x) => x.args.kind))];
  const wholeStep = base.steps.find((x) => !x.item && !x.link) ?? null;
  const own = (t) => !String(t).startsWith('std.') && !String(t).startsWith('core.');

  // induce: one step of anti-unification over the things of the kinds made, and over the session's corrections
  const hints = { ...NO_HINTS }, induced = [];
  if (sources.includes('induced')) {
    const thingKeys = new Set([...(c.slots.get('std.schema.thing')?.keys() ?? []), 'kind', 'world']);
    const keysOf = (type) => [...(c.slots.get(type)?.values() ?? [])].filter((x) => !thingKeys.has(x.key) && !x.identity && !x.refs?.length && (x.enum || x.key === 'size')).map((x) => x.key);
    if (itemKinds.length) {
      const lines = itemKinds.map((k) => c.lineage(k).filter(own));
      const common = lines[0].filter((t) => lines.every((l) => l.includes(t)));
      const st = induceStyle(view, common, { except, keys: keysOf });
      if (st && Object.keys(st.pattern).length) { hints.attrs = st.pattern; induced.push({ of: st.of, n: st.n, pattern: st.pattern }); }
    }
    if (wholeStep) {
      const st = induceStyle(view, c.lineage(wholeStep.args.kind).filter(own).slice(0, 1), { except, keys: () => ['layout'] });
      if (st?.pattern.layout !== undefined) { hints.layout = st.pattern.layout; induced.push({ of: st.of, n: st.n, pattern: st.pattern }); }
    }
    const corr = request.revisedFrom === undefined ? induceCorrections(opts.dialogue?.corrections) : null; // a new request; a revision carries its own steps
    if (corr && ['size', 'count'].includes(corr.on) && ['up', 'down'].includes(corr.step)) { hints.sizeStep = corr.step; induced.push({ of: 'corrections', n: corr.n, pattern: { [corr.on]: corr.step } }); }
  }

  // propose: where the items could go (a slot of every item kind that refers to things), when they do not go in a whole made with them
  const placeC = request.constraints.find((x) => x.on === 'place' && x.want !== 'no') ?? null;
  const inWhole = base.steps.some((x) => x.item && x.args.in && typeof x.args.in === 'object');
  let refSlot = null, places = [];
  if (itemKinds.length && !inWhole) {
    const maps = itemKinds.map((k) => c.slots.get(k) ?? new Map());
    const refs = [...maps[0].values()].filter((x) => x.refs?.length && maps.every((m) => m.get(x.key)?.refs?.length));
    refSlot = refs.find((x) => x.key === placeC?.relation) ?? refs.find((x) => x.key === 'in' || x.key === 'on') ?? refs[0] ?? null;
  }
  if (refSlot && (!placeC || placeC.ref || (placeC.value && stateOfKind(live, view, placeC.value).length))) {
    let ids = [...new Set(refSlot.refs.flatMap((t) => stateOfKind(live, view, t)))].filter((id) => !except.has(id));
    if (placeC?.value && !placeC.ref) ids = ids.filter((id) => view.thing(id).kinds.includes(placeC.value));
    const recent = [...(opts.dialogue?.lastRun?.made ?? []), ...(opts.dialogue?.result?.things ?? [])].map(strip);
    const near = new Set(recent.flatMap((id) => [id, ...view.related(id).filter(Boolean)])); // the things just made, and what they are in
    const age = new Map(ids.map((id, i) => [id, i]));
    ids.sort((a, b) => Number(near.has(b)) - Number(near.has(a)) || age.get(b) - age.get(a)); // the dialogue's first, then the newest
    places = ids.map((id, i) => ({ key: refSlot.key, id, from: near.has(id) ? 'dialogue' : 'world', distance: i }));
  }
  const specs = placeC && places.length ? places.slice(0, max).map((p) => ({ place: p })) : [{ place: null }, ...places.slice(0, max - 1).map((p) => ({ place: p }))];

  // simulate and deduce: each candidate on a fork of the live world
  const required = (t) => [...(c.slots.get(t.type)?.values() ?? [])].filter((x) => x.required).map((x) => x.key);
  const simulate = (plan) => {
    budget.used += plan.steps.length + 1;
    const fork = live.fork();
    const run = runWorldPlan(fork, plan, { replace: [...except] });
    if (!run.ok) return { hard: [{ rule: 'schema', thing: null, why: String(run.failed?.why ?? 'the world refused it') }], soft: [], derived: [] };
    const fv = factsOf(fork);
    return deduceState(fv, run.made, { kindFacts, budget, required, bounds: { ...plan.bounds, items: run.result.items }, placeable: (id) => !!refSlot && (fv.thing(id)?.kinds ?? []).some((k) => itemKinds.includes(k)) });
  };
  const tried = [];
  for (let i = 0; i < specs.length && i < max; i++) { // bounded: REASONING.candidates
    if (i > 0 && budget.used > budget.ticks) break;
    const spec = specs[i];
    const plan = i === 0 && !spec.place && !hints.attrs && !hints.layout && !hints.sizeStep ? base : planOnce(live, request, opts, { ...hints, place: spec.place, drop: spec.drop ?? null });
    const check = plan.ok ? simulate(plan) : { hard: [{ rule: 'plan', why: plan.notHonoured.at(-1)?.why ?? 'nothing to make' }], soft: [], derived: [] };
    tried.push({ spec, plan, check });
    // a hard violation with values the dialogue or induction gave: try once more without them (they are soft, never constraints)
    const soft = plan.assumed.filter((a) => (a.from === 'induced' || a.from === 'dialogue') && a.key !== 'place').map((a) => a.key); // a place is a candidate of its own
    if (check.hard.length && soft.length && !spec.drop && specs.length < max) specs.push({ place: spec.place, drop: new Set([...soft, 'layout']) });
  }

  // abduce: the cheapest surviving candidate (criteria of kind `plan`, as data)
  const weight = (from) => { const k = sources.indexOf(from); return k < 0 ? sources.length : k; };
  const scored = tried.map((t, index) => ({ index, hard: t.check.hard.length, unexplained: t.plan.notHonoured.length, soft: t.check.cost ?? t.check.soft.reduce((a, x) => a + (x.cost ?? 1), 0), cost: t.plan.assumed.reduce((a, x) => a + weight(x.from), 0), assumptions: t.plan.assumed.length, distance: t.spec.place?.distance ?? 0 }));
  const live1 = scored.filter((x) => !x.hard);
  const label = (t) => (t.spec.place ? `${t.spec.place.key} ${t.spec.place.id}` : 'as planned') + (t.spec.drop ? ' without the induced values' : '');
  const reasoning = { candidates: tried.length, depth: REASONING.depth, ticks: budget.used, exhausted: budget.used > budget.ticks, induced, soft: [], derived: 0 };
  if (!live1.length) {
    const why = [...new Set(tried.flatMap((t) => t.check.hard.map((h) => h.why)))];
    return { ...tried[0].plan, ok: false, steps: [], assumed: [], rejected: tried.map((t) => ({ place: t.spec.place?.id ?? null, label: label(t), why: t.check.hard.map((h) => h.why), hard: true })), cannot: why.map((w) => ({ why: w, words: request.text })), reasoning };
  }
  const ch = choose(live, 'plan', live1, { seed: null });
  const best = tried[ch.best.index], bs = ch.best;
  const rejected = tried.filter((t) => t !== best).map((t) => {
    const k = tried.indexOf(t), h = t.check.hard.map((x) => x.why), sc = scored[k];
    const on = ch.criteria.find((x) => Number(sc[x.measure] ?? 0) !== Number(bs[x.measure] ?? 0));
    return { place: t.spec.place?.id ?? null, label: label(t), why: h.length ? h : [on ? `${on.name}: ${+Number(sc[on.measure]).toFixed(2)} against ${+Number(bs[on.measure]).toFixed(2)}` : 'as good, later in the order'], hard: h.length > 0 };
  });
  return { ...best.plan, rejected, cannot: [], reasoning: { ...reasoning, soft: best.check.soft.map((x) => x.why), derived: best.check.derived.length, chosen: label(best) } };
}

/**
 * Run a plan's steps through the world's `act`, a step's `{ step: i }` arguments naming what step i made. With
 * `replace` (the things of the last result), those are removed first: a revision replaces, it does not pile on.
 * Returns { ok, made, failed, result: { things, count, kinds, whole, layout } }.
 */
export function runWorldPlan(live, plan, { replace = [] } = {}) {
  for (const id of replace) if (live.get(String(id).replace(/^\$/, ''))) live.act({ action: 'remove', args: { thing: `$${String(id).replace(/^\$/, '')}` } }); // bounded: the things of the last result
  const made = [], ids = [];
  const resolve = (v) => (v && typeof v === 'object' && 'step' in v ? `$${ids[v.step]}` : v);
  for (const s of plan.steps) { // bounded: the steps planned
    const args = Object.fromEntries(Object.entries(s.args).map(([k, v]) => [k, resolve(v)]));
    const r = live.act({ action: s.action, args });
    if (r.ok === false) return { ok: false, made, failed: { step: s, why: r.why ?? r.violations?.[0]?.why ?? r.result?.why }, result: summary() };
    const id = r.result?.thing ?? r.result?.link ?? null;
    ids.push(id);
    if (id) made.push(id);
  }
  return { ok: true, made, result: summary() };
  function summary() {
    const kinds = {}; let count = 0;
    plan.steps.forEach((s, i) => { if (s.item && ids[i]) { kinds[s.args.kind] = (kinds[s.args.kind] ?? 0) + 1; count++; } });
    return { things: [...made], items: plan.steps.flatMap((s, i) => (s.item && ids[i] ? [ids[i]] : [])), count, kinds, whole: plan.steps[0] && !plan.steps[0].item && !plan.steps[0].link ? ids[0] : null, layout: plan.roles?.layout ?? null, links: plan.steps.filter((s, i) => s.link && ids[i]).length };
  }
}

const pluralIn = (language, lang, w) => { if (!language) return w; try { return inflectBy(language, w, 'plural', { types: { rule: `${lang}.inflect`, irregular: `${lang}.irregular` } }) ?? w; } catch { return w; } };


/** A value a reply cannot say: nothing, a failed number, or the word of a missing value. */
const unsayable = (v) => v === undefined || v === null || (typeof v === 'number' && !Number.isFinite(v)) || /^\s*(undefined|null|NaN)?\s*$/.test(String(v));
/** The reply sentences of the revision of a whole, used when the language world has no `done.whole` of its own (English only; the language worlds say them in their language). */
const WHOLE_REPLIES = Object.freeze({ 'done.whole': [{ roles: ['whole', 'parts'], text: 'The {whole} now has {parts}.' }] });
const fallbackReply = (f, lang) => { if (lang !== 'w.lang.en') return null; const row = (WHOLE_REPLIES[f.reply] ?? []).find((r) => r.roles.every((k) => !unsayable(f.roles?.[k]))); return row ? row.text.replace(/\{(\w+)\}/g, (_, k) => f.roles[k]).replace(/^./, (c) => c.toUpperCase()) : null; };
const wordsOf = (v) => String(v ?? '').split(/,\s*/).filter(Boolean);

/**
 * The reply of a request as reply facts, each a w.lang.* reply name with its roles: done.revise, done.make (what was
 * made), assumed (each default used), not_honoured (each constraint the world did not honour), unread (the words no
 * constraint took). `outcome`: the plan (with `run`, the result of runPlan, and `revised`). `opts`: `language` (a
 * language world with `<lang>.reply` facts), `lang`, `say` (the sources of an assumption said; default ASSUMED_SAY, or
 * the language's `<lang>.reply name=assumed say=` values), or a language code ('en' -> w.lang.en). Returns { facts, text, missing }.
 */
export function sayRequest(request, outcome = {}, opts = {}) {
  const o = typeof opts === 'string' ? { lang: opts.includes('.') ? opts : `w.lang.${opts}` } : opts;
  const lang = o.lang ?? 'w.lang.en';
  const facts = [];
  if (outcome.reply) facts.push({ reply: outcome.reply, roles: {} });
  if (outcome.revised) facts.push({ reply: 'done.revise', roles: {} });
  // what this world can do (toolCapabilities): one fact per act, its kinds in the language's plural
  for (const c of outcome.capabilities ?? []) {
    facts.push({ reply: 'can', roles: { act: c.act, kinds: c.kinds.map((k) => pluralIn(o.language, lang, plain(k))).join(', ') } });
    if (c.on?.length) facts.push({ reply: 'can.say', roles: { act: c.act, keys: c.on.join(', ') } });
  }
  for (const f of outcome.answer ?? []) facts.push({ reply: f.reply, roles: { ...f.roles, ...(f.roles.kind ? { kind: plain(f.roles.kind) } : {}) } }); // facts of the live world (askWorld)
  const wholeFact = (kinds) => { // the net state of a whole: its parts by kind ("5 trees, 2 butterflies, a bird")
    const art = (w) => (o.language && articleFor(o.language, w, { types: { det: `${lang}.det`, onset: `${lang}.onset` } })) || (/^[aeiou]/i.test(w) ? 'an' : 'a');
    const text = kinds.map(([kind, n]) => (n === 1 ? `${art(plain(kind))} ${plain(kind)}` : `${n} ${pluralIn(o.language, lang, plain(kind))}`)).join(', ');
    for (let i = facts.length - 1; i >= 0; i--) if (facts[i].reply === 'done.revise') facts.splice(i, 1);
    facts.push({ reply: 'done.whole', roles: { whole: plain(outcome.target), parts: text }, kinds: kinds.map(([k]) => plain(k)), numbers: kinds.map(([, n]) => n) });
  };
  const tool = outcome.run?.diff ? outcome.run : null; // a run through a tool binding: the reply is the diff of the view
  const run = tool ? null : outcome.run?.result ?? null;
  if (tool) {
    const d = tool.diff, replaced = new Set(); // the diff has the things a revision redid alike taken out already
    const byKind = (list) => { const m = new Map(); for (const t of list) m.set(t.kind, (m.get(t.kind) ?? 0) + 1); return [...m]; };
    const dir = (request?.reactions ?? []).find((r) => (r.step === 'up' || r.step === 'down') && r.words)?.words ?? null; // a change with no value to say is said by its direction, in the request's own word
    const parts = Object.entries(tool.result?.kinds ?? {}).filter(([, n]) => n > 0);
    const wholeRevised = !!(outcome.revised && tool.ok && !tool.same && !tool.undo && !tool.redo && tool.result?.whole && outcome.target && parts.length);
    if (tool.undo || tool.redo) { if (tool.ok) facts.push({ reply: tool.undo ? 'done.undo' : 'done.redo', roles: {} }); }
    else if (wholeRevised) { // a revision of a whole says the whole's net state (the diff aggregated over its parts), not the operations that re-laid it
      wholeFact(parts);
    } else {
      for (const [kind, n] of byKind(d.added)) facts.push({ reply: 'done.add', roles: { kind: plain(kind), number: n } });
      for (const [kind, n] of byKind(d.removed.filter((t) => !replaced.has(t.id)))) facts.push({ reply: 'done.remove', roles: { thing: plain(kind), number: n } });
      const ch = new Map(); for (const x of d.changed) { const key = x.as ?? x.key, value = unsayable(x.to) ? dir : plain(String(x.to)); if (value === null || value === undefined) continue; const k = `${x.kind}|${key}|${value}`; const e = ch.get(k) ?? { kind: x.kind, key, value, n: 0 }; e.n++; ch.set(k, e); }
      for (const e of ch.values()) facts.push({ reply: 'done.change', roles: { thing: plain(e.kind), number: e.n, key: String(e.key), value: e.value } }); // the key: said by the reply done.change.<key> when the language has one; a value that is missing is said by the direction of the request, or not said
    }
    const nothing = !d.added.length && !d.removed.length && !d.changed.length;
    if (nothing && !tool.question && !outcome.ask && !(tool.ok && (tool.undo || tool.redo))) {
      facts.push({ reply: 'why.nothing', roles: {} });
      if (tool.failed?.reply && tool.failed.reply !== 'why.nothing') facts.push({ reply: tool.failed.reply, roles: tool.failed.roles ?? {}, code: tool.failed.code }); // said once
      else if (tool.same) facts.push({ reply: 'nothing.same', roles: {}, code: 'same' }); // a revision that asks for what is there
    }
  }
  for (const f of outcome.replies ?? []) facts.push({ reply: f.reply, roles: f.roles, code: 'plan' }); // what the plan says itself (refused.which, refused.no_such)
  if (run && outcome.reference && outcome.run?.ok !== false) { // an act on things that are there, run through the world's own acts: said from the plan's things
    for (const [kind, n] of Object.entries(outcome.roles?.byKind ?? {})) {
      if (outcome.act === 'remove') facts.push({ reply: 'done.remove', roles: { thing: plain(kind), number: n } });
      else for (const key of Object.keys(outcome.roles).filter((k) => !['count', 'things', 'byKind'].includes(k))) facts.push({ reply: 'done.change', roles: { thing: plain(kind), number: n, key, value: plain(String(outcome.roles[key])) } });
    }
  } else if (run) {
    if (run.whole && outcome.revised && outcome.target && Object.keys(run.kinds ?? {}).length) wholeFact(Object.entries(run.kinds));
    else if (run.whole) facts.push({ reply: 'done.make', roles: { kind: plain(outcome.target), number: 1 } });
    else if (!(run.whole && outcome.revised && Object.keys(run.kinds ?? {}).length)) for (const [kind, n] of Object.entries(run.kinds)) { const v = outcome.roles?.colour; facts.push({ reply: v ? 'done.make.value' : 'done.make', roles: { kind: plain(kind), number: n, ...(v ? { value: v } : {}) } }); }
  }
  const assumed = [...(outcome.assumed ?? [])];
  for (const a of tool?.ok ? tool.assumed ?? [] : []) if (a.from === 'translated' || !assumed.some((x) => String(x.value) === String(a.value))) assumed.push(a); // what the binding filled or translated beyond the plan
  // Which assumptions are said is data: the sources (`say`, in order of strength), a value that is only the world's declared default is
  // of the source `default`, at most `sayMax` are said (the strongest by source), and one fact is said once.
  const rule = o.language ? rowsOf(o.language, `${lang}.reply`).filter((r) => first(r, 'name') === 'assumed') : [];
  const order = o.say ?? (() => { const v = rule.flatMap((r) => r.say ?? []); return v.length ? v : ASSUMED_SAY; })();
  const sayFrom = new Set(order);
  const max = o.sayMax ?? rule.map((r) => Number(first(r, 'max'))).find((x) => Number.isFinite(x)) ?? ASSUMED_MAX;
  const sourceOf = (a) => (a.default ? 'default' : a.from);
  const stem = (k) => String(k).replace(/s$/, ''); // a list of kinds and a single kind are one fact
  const valuesOf = (a) => wordsOf(a.value).map((v) => plain(v));
  const candidates = (tool && (!tool.ok || tool.same) ? [] : assumed).filter((a) => (a.from === undefined || sayFrom.has(sourceOf(a))) && !(a.key === 'target' && run?.whole) && !unsayable(a.value));
  const stated = new Set(facts.filter((f) => /^done\./.test(f.reply)).flatMap((f) => [f.roles?.kind, f.roles?.thing, ...(f.kinds ?? [])].filter(Boolean).map((k) => plain(k)))); // what the result lines already say
  const planKinds = new Set((outcome.roles?.kinds ?? []).map((k) => plain(k)));
  const counted = facts.filter((f) => /^done\.(add|make)/.test(f.reply) && planKinds.has(f.roles?.kind)).reduce((n, f) => n + (f.roles.number ?? 0), 0) + facts.filter((f) => f.reply === 'done.whole').reduce((n, f) => n + f.numbers.reduce((x, y) => x + y, 0), 0);
  const said = candidates.filter((a, i) => {
    const vals = valuesOf(a);
    if (stem(a.key) === 'kind' && vals.every((v) => stated.has(v))) return false; // the kinds are in the result line
    if (a.key === 'count' && counted === Number(a.value)) return false; // so is their number
    return !candidates.some((b, j) => j !== i && stem(b.key) === stem(a.key) && vals.every((v) => valuesOf(b).includes(v)) && (valuesOf(b).length > vals.length || j < i)); // a fact another says in full is not said again
  });
  const rank = (a) => { const r = order.indexOf(sourceOf(a)); return r < 0 ? order.length : r; };
  const keys = new Set();
  const chosen = said.map((a, i) => ({ a, i })).sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i).filter(({ a }) => !keys.has(stem(a.key)) && keys.add(stem(a.key))).slice(0, max).sort((x, y) => x.i - y.i); // one fact per key
  for (const { a } of chosen) facts.push({ reply: 'assumed', roles: { key: a.key, value: String(a.value) }, from: a.from });
  for (const nh of outcome.notHonoured ?? []) facts.push({ reply: 'not_honoured', roles: { words: nh.words, why: nh.why }, code: nh.code });
  for (const c of outcome.cannot ?? []) facts.push({ reply: 'not_honoured', roles: { words: c.words ?? request?.text ?? '', why: c.why }, code: 'cannot' });
  if (request?.unread?.length && (run || outcome.revised || (tool && !tool.question && tool.failed?.code !== 'unread'))) facts.push({ reply: 'unread', roles: { words: request.unread.map((w) => `"${w}"`).join(', ') } });
  for (let i = facts.length - 1; i >= 0; i--) if (Object.values(facts[i].roles ?? {}).some(unsayable)) facts.splice(i, 1); // a reply is never said with a missing value or an empty slot
  const missing = [];
  const texts = o.language ? facts.map((f) => { let t = (f.roles?.key ? replyFrom(o.language, `${f.reply}.${f.roles.key}`, f.roles, { lang, dictionary: o.dictionary }) : null) ?? replyFrom(o.language, f.reply, f.roles, { lang, dictionary: o.dictionary }); if (t == null) t = fallbackReply(f, lang); if (t == null) missing.push(f.reply); return t; }).filter((t) => t && !/\b(undefined|null|NaN)\b|\{\w+\}/.test(t)) : []; // a fact with a key: the reply named for that key first (done.change.place), else the general one
  return { facts, text: texts.join(' '), missing: [...new Set(missing)] };
}
