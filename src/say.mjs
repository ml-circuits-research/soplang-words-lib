// Saying things from facts (a host's handover LIB-1..4, written here from its description): a list joined,
// a fact as one clause, the sentence of an act from the language world's act templates, and the frames of a
// log summary as one sentence. The words of the language (prepositions, auxiliaries, articles, plurals, the
// templates) come from the language world's facts; the few glue words are options with English defaults.

import { inflectBy, articleFor, morphOf, realise } from './morph.mjs';

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const spaced = (s) => String(s).replace(/_/g, ' ');
const META = new Set(['name', 'about', 'thing', 'source', 'own', 'cite', 'derived', 'named', 'drawing', 'sense']);
const TYPE_KEYS = new Set(['class', 'kind', 'is', 'is_a']);

/** "a, b and c" (LIB-1): `and` and `sep` are the language's (English by default). */
export function joinList(items, { and = 'and', sep = ', ' } = {}) {
  const a = [...items];
  return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(sep)} ${and} ${a.at(-1)}`;
}

/**
 * A fact `{ type, attrs }` as one clause (LIB-2), or null when it has no subject (`name`, else `about`):
 * verb-like keys first (an auxiliary of the language world, a k.actions act), then a preposition ("is on the
 * table"), a type key ("is a bird"), a yes/no ("is landlocked"), a count ("has 2 legs"), any other key as a
 * noun ("has a habitat of sea and ice"); at most `parts` (3). Keys that join another world (a slot with a
 * `type`) and quiet keys are left out. `names`: words said without "the" (places, people).
 */
export function clauseOf(world, fact, { parts = 3, lang = 'w.lang.en', names, quiet = [], words = {} } = {}) {
  const W = { is: 'is', not: 'not', has: 'has', of: 'of', the: 'the', ...words };
  const a = fact?.attrs ?? {};
  const subject = a.name?.[0] ?? a.about?.[0];
  if (subject === undefined) return null;
  const preps = new Set(world.ofType(`${lang}.prep`).map((w) => bare(w.attrs.text?.[0])));
  const aux = new Set(world.ofType(`${lang}.aux`).map((w) => bare(w.attrs.text?.[0])));
  const acts = new Set(world.ofType('k.actions.action').map((w) => bare(w.attrs.name?.[0])));
  const joins = new Set(world.ofType('core.slot').filter((w) => w.attrs.type && w.attrs.key).map((w) => `${bare(w.attrs.of?.[0])}:${bare(w.attrs.key[0])}`));
  const named = names ?? new Set();
  const np = (n) => (named.has(bare(n)) ? spaced(bare(n)) : `${W.the} ${spaced(bare(n))}`);
  const art = (w) => articleFor(world, w, { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? 'a';
  const verbLike = (k) => aux.has(k) || (k.endsWith('not') && aux.has(k.slice(0, -3))) || acts.has(k) || acts.has(k.replace(/es$/, '')) || acts.has(k.replace(/s$/, ''));
  const keys = Object.keys(a).filter((k) => !META.has(k) && !k.startsWith('core.') && !quiet.includes(k) && !joins.has(`${fact.type}:${k}`) && a[k]?.length);
  const say = (k) => {
    const vs = a[k].map((v) => spaced(bare(v)));
    if (verbLike(k)) return `${spaced(k)} ${joinList(vs)}`;
    if (preps.has(k)) return `${W.is} ${k} ${joinList(vs.map(np))}`;
    if (TYPE_KEYS.has(k)) return `${W.is} ${art(vs[0])} ${vs[0]}`;
    if (vs.length === 1 && /^(true|false|yes|no)$/.test(vs[0])) return `${W.is} ${/^(true|yes)$/.test(vs[0]) ? '' : `${W.not} `}${spaced(k)}`;
    if (vs.length === 1 && /^\d+$/.test(vs[0]) && /s$/.test(k)) return `${W.has} ${vs[0]} ${vs[0] === '1' ? spaced(k.replace(/s$/, '')) : spaced(k)}`;
    return `${W.has} ${art(k)} ${spaced(k)} ${W.of} ${joinList(vs)}`;
  };
  const said = [...keys.filter(verbLike), ...keys.filter((k) => !verbLike(k))].slice(0, parts).map(say);
  return said.length ? `${np(subject)} ${said.join(', ')}` : null;
}

const morphCache = new WeakMap();
/**
 * The sentence of an act (LIB-3): the language world's act template whose slots are exactly the roles given
 * (`${lang}.template act= text=`, the most specific first), filled by std.morph `realise`, `{role:num=pl}` in
 * the plural (`inflectBy`), a/an in the form of the next word (`articleFor`), capitalised; null when none fits.
 */
export function actSentence(world, act, roles, { mode = null, lang = 'w.lang.en' } = {}) {
  const given = Object.keys(roles).filter((k) => roles[k] != null && roles[k] !== '');
  const slotsOf = (text) => [...new Set([...text.matchAll(/\{(\w+)(?::[^}]*)?\}/g)].map((m) => m[1]))];
  const ts = world.ofType(`${lang}.template`).map((t) => ({ act: bare(t.attrs.act?.[0]), mode: t.attrs.mode ? bare(t.attrs.mode[0]) : null, text: bare(t.attrs.text?.[0] ?? '') }))
    .filter((t) => t.act === act && (mode == null || t.mode == null || t.mode === mode)).filter((t) => { const s = slotsOf(t.text); return s.length === given.length && s.every((x) => given.includes(x)); });
  const t = ts.sort((x, y) => slotsOf(y.text).length - slotsOf(x.text).length)[0];
  if (!t) return null;
  let m = morphCache.get(world);
  if (!m) { m = morphOf(world, { types: { template: `${lang}.template` } }); morphCache.set(world, m); }
  const r = Object.fromEntries(given.map((k) => [k, spaced(String(roles[k]))]));
  for (const x of t.text.matchAll(/\{(\w+):num=pl\}/g)) r[x[1]] = r[x[1]].split(' ').map((w, i, all) => (i === all.length - 1 ? inflectBy(world, w, 'plural', { types: { rule: `${lang}.inflect`, irregular: `${lang}.irregular` } }) : w)).join(' ');
  const text = t.text.replace(/\{(\w+):num=pl\}/g, '{$1}');
  let out = realise(m, text, r);
  if (!out) return null;
  out = out.replace(/\b(a|an) ([A-Za-z][\w-]*)/g, (_, _a, w) => `${articleFor(world, w, { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? _a} ${w}`);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * The frames of summarizeLog as one sentence (LIB-4): "You asked me to add 3 trees and remove a house, plus 2
 * other changes; 1 request was not understood." `say(frame) -> phrase` names an act ("add 3 trees"; default:
 * the act, the count and the kind, plural by the world's rules); `failed` (a number, or summarizeLog's
 * separate list); `max` frames named. The glue words are `words` (English defaults).
 */
export function renderFrames(frames, { world, say, failed, max = 3, words = {} } = {}) {
  const W = { lead: 'You asked me to', plus: 'plus', other: 'other change', others: 'other changes', failedOne: 'request was not understood', failedMany: 'requests were not understood', nothing: 'Nothing was changed', ...words };
  const pl = (w) => (world ? inflectBy(world, w, 'plural') : `${w}s`);
  const phrase = say ?? ((f) => { const kinds = f.kinds?.length ? f.kind : f.kind; if (!kinds) return f.act; return f.count > 1 ? `${f.act} ${f.count} ${pl(spaced(kinds))}` : `${f.act} ${world ? articleFor(world, spaced(kinds)) ?? 'a' : 'a'} ${spaced(kinds)}`; });
  const ok = frames.filter((f) => !f.failed), named = ok.slice(0, max).map(phrase), rest = ok.slice(max).reduce((s, f) => s + (f.count ?? 1), 0);
  const nFailed = typeof failed === 'number' ? failed : Array.isArray(failed) ? failed.reduce((s, f) => s + (f.count ?? 1), 0) : frames.filter((f) => f.failed).reduce((s, f) => s + (f.count ?? 1), 0);
  let s = named.length ? `${W.lead} ${joinList(named)}` : W.nothing;
  if (rest) s += `, ${W.plus} ${rest} ${rest === 1 ? W.other : W.others}`;
  if (nFailed) s += `; ${nFailed} ${nFailed === 1 ? W.failedOne : W.failedMany}`;
  return `${s}.`;
}
