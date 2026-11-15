// The host kit (reviewer 13:15 item 5, 13:50: Q72 approved): what every application needs to run worlds, so a
// second application is a few lines, not 96 host files. `loadWorldSet` loads the worlds an application uses into
// one live world (with std.acts) and keeps each world's typed world; `readTurn` reads one message under the
// Reader contract with a language world's frames, binds the frame to a request, lets `arbitrate` choose the world
// (the open tab only as the host's criterion), and acts only on a complete reading: otherwise it asks, or says
// which words it did not understand. A turn changes only the world it addresses and the session.

import { World } from './world.mjs';
import { readFrames } from './frames.mjs';
import { moodOf } from './reader.mjs';
import { arbitrate, turn } from './turn.mjs';
import { typedWorldFor, schemaOf, fitsSlot } from './typed.mjs';
import { typedLexicon } from './readtypes.mjs';
import { valueText } from './parser.mjs';
import { memoPerWorld } from './memo.mjs';
import { morphOf, realise, articleFor, inflectBy } from './morph.mjs';

/**
 * Load the worlds an application uses. `loader(name) -> text` (a file, a fetch, a bundle). Options: `names` (the
 * world schemas: w.list, w.tasks, ...), `language` (a World holding the language world's frames, parts, phrases,
 * closed words: the reader's), `knowledge` (a World the worlds' slots join, for the typed worlds), `bindings`
 * ({ needs: { kind, thing?, place?, amount?, placeKind?, placeKey? } }: how a frame's `needs` class maps onto a
 * world's entry kind and keys, until the language world says it), `verbs` ({ lemma: act }; default from the
 * language world's k.actions.verb facts when present). Returns the set: { live, language, worlds (name -> { kinds }), typed,
 * bindings, verbs }.
 */
export function loadWorldSet(loader, { names = [], language = null, knowledge = null, bindings = {}, verbs } = {}) {
  const live = new World();
  const texts = names.map((n) => ({ name: n, text: loader(n) }));
  const missing = texts.filter((t) => t.text == null).map((t) => t.name);
  if (missing.length) throw new Error(`sopworld: loadWorldSet: no text for ${missing.join(', ')}`);
  const r = live.load(['@acts core.use world=std.acts', ...texts.map((t) => t.text)].join('\n'));
  if (r.ok === false) throw new Error(`sopworld: loadWorldSet: ${JSON.stringify(r.violations?.[0])}`);
  const typed = typedWorldFor(schemaOf(live), knowledge); // one typed world for the set: worlds import each other (w.tasks imports w.list)
  const worlds = new Map(texts.map((t) => [t.name, { name: t.name, kinds: live.ofType('std.schema.kind').filter((k) => (k.attrs.world || []).map(valueText).includes(t.name)).map((k) => valueText(k.attrs.of[0])) }]));
  const V = verbs ?? Object.fromEntries((language?.ofType('k.actions.verb') ?? []).map((v) => [valueText(v.attrs.text?.[0]).toLowerCase(), valueText(v.attrs.act?.[0])]));
  return { live, language, worlds, typed, bindings, verbs: V };
}

const SESSION = new Set(['std.', 'core.', '_std']);

/**
 * One message, one turn. `context`: { lang ('w.lang.en'), active (the open tab's world), criteria (the host's
 * std.decide criteria for kind world, with `active` among the measures), morph, dictionary (the language's
 * morphology), reply(world, request, result) }. Returns { status: 'done' | 'ask' | 'not-understood' | 'refused',
 * reading: { frame, act, roles, unread, mood, complete }, request?, owner?, reply, changed?, why? }. An
 * incomplete reading is never acted on.
 */
export function readTurn(set, text, context = {}) {
  const { lang = 'w.lang.en', active, criteria, morph, dictionary } = context;
  const L = set.language;
  const label = (type) => labelOf(set, type);
  const mood = moodOf(L, text, { lang });
  const verbOf = (lemma) => set.verbs[String(lemma).toLowerCase()];
  const r = readFrames(L, text, { lang, morph, dictionary, senses: (id) => (id && verbOf(id) ? { act: verbOf(id), en: id } : {}) });
  const tokens = r.tokens;
  if (!r.best) {
    const known = typedLexicon(set.live);
    const unread = tokens.filter((t) => !known.has(t));
    return { status: 'not-understood', reading: { frame: null, unread: unread.length ? unread : tokens, mood, complete: false }, reply: `I did not understand ${(unread.length ? unread : tokens).map((t) => `"${t}"`).join(', ')}.` };
  }
  const read0 = { mood, complete: mood !== 'statement' && mood !== 'fragment' };
  if (!read0.complete) return { status: 'not-understood', reading: { frame: r.best.frame, act: r.best.act, roles: r.best.roles, unread: [], ...read0 }, reply: mood === 'fragment' ? 'I did not understand: that is only a fragment.' : 'I took that as a statement, not a request.' };
  // every frame the reader kept, bound in turn: the first whose every filled role lands in an argument wins; a role
  // that lands nowhere is named as unread, never dropped (reviewer 14:45 item 1)
  const bound = r.frames.map((fr) => ({ fr, b: bindFrame(set, fr, { lang, text }) }));
  let win = bound.find((x) => x.b.request && !x.b.unread.length && !x.b.confirm) ?? bound.find((x) => x.b.confirm) ?? bound.find((x) => x.b.timeline && !x.b.unread.length) ?? [...bound].sort((x, y) => x.b.unread.length - y.b.unread.length)[0];
  const nRoles = (x) => Object.keys(x.fr.roles || {}).length;
  const finer = bound.find((x) => x.b.placeless && nRoles(x) > nRoles(win)); // a reading that saw a place this kind cannot take: said, not swallowed into a name by a coarser frame
  if (finer) win = finer;
  const { fr: f, b } = win;
  if (!b.request && !b.timeline && !b.confirm && !b.unread.length) b.unread = tokens; // nothing bound: every word is unread
  const reading = { frame: f.frame, act: f.act, roles: f.roles, unread: b.unread, ...read0, complete: !b.unread.length && !b.why };
  if (b.confirm) return { status: 'ask', reading, reply: `There is no ${b.confirm.args[b.confirm.key]} ${label(b.confirm.args.kind)} yet. Shall I make it?`, asks: [{ key: b.confirm.place, value: b.confirm.args[b.confirm.key], confirm: { action: 'make', args: b.confirm.args } }] };
  if (!reading.complete) return { status: 'not-understood', reading, reply: b.placeless ? `${b.placeless}.` : b.unread.length ? `I did not understand ${b.unread.map((w) => `"${w}"`).join(', ')}.` : b.why };
  if (b.timeline) { // undo / redo: a step of the live world's timeline
    const n = b.timeline.n ?? 1, res = b.timeline.act === 'undo' ? set.live.undo(n) : set.live.redo(n);
    return { status: res.ok ? 'done' : 'refused', reading, request: { action: b.timeline.act, args: { n } }, reply: sayAct(set, b.timeline.act, { ok: res.ok, n }, context) };
  }
  const request = b.request;
  // a required key the request leaves open is asked before anything is made: never a thing with a hole in it
  const asks = requiredOpen(set, request);
  if (asks.length) return { status: 'ask', reading, request, reply: asks.map((a) => a.ask ?? `What ${a.key}?`).join(' '), asks };
  return runRequest(set, request, reading, context);
}

const SAID = new Set(['make', 'remove', 'change']); // acts whose reply is a sentence of what was done; questions keep the answer

/** Run a bound request: arbitrate the world, one turn (one step), a reply with no ids. */
function runRequest(set, request, reading, context = {}) {
  const { lang = 'w.lang.en', active, criteria } = context;
  const owners = arbitrate(set.live, request, { active, criteria });
  if (!owners.owner) return { status: owners.ambiguous ? 'ask' : 'refused', reading, request, reply: owners.ambiguous ? `In which: ${owners.ambiguous.join(' or ')}?` : (owners.verdicts.find((v) => v.verdict === 'refuse')?.why ?? 'No world here takes that.'), ...(owners.ambiguous ? { asks: [{ key: 'world', values: owners.ambiguous }] } : {}) };
  const before = new Set([...set.live.wires.keys()]);
  const thingType = request.args.thing ? set.live.get(String(request.args.thing).replace(/^\$/, ''))?.type : null; // said after it may be gone
  const t = turn(set.live, [request], context.reply ? { reply: context.reply } : {});
  const changed = [...set.live.wires.values()].filter((w) => !before.has(w.id)).map((w) => w.type);
  const result = t.results?.[0]?.result;
  const reply = t.status === 'done' && SAID.has(request.action) ? sayAct(set, request.action, { request, result, thingType }, context) : labelled(set, (t.replies || []).join(' ') || t.question || '');
  return { status: t.status === 'done' ? 'done' : t.status, reading, request, owner: owners.owner, reply, changed };
}

/** The required keys of the kind a make request names that it does not give (and no default fills). */
function requiredOpen(set, request) {
  if (request.action !== 'make' || !request.args.kind) return [];
  const slots = set.live._compiled().slots.get(request.args.kind);
  if (!slots) return [];
  return [...slots.values()].filter((sl) => sl.required && sl.default === undefined && request.args[sl.key] === undefined && sl.key !== 'kind').map((sl) => ({ key: sl.key, ...(sl.ask ? { ask: valueText(sl.ask) } : {}), request }));
}

/**
 * A thing of the set named by words (a referent): "table 1" (a kind's word and a name or number of one of its
 * things, else the n-th made), "Ann" (a thing whose name it is). Returns { thing, type } or null.
 */
export function referentOf(set, words) {
  const toks = String(words).toLowerCase().split(/\s+/).filter(Boolean);
  const lex = typedLexicon(set.live);
  let kind = null, rest = toks;
  for (let i = 0; i < toks.length && !kind; i++) { // bounded: the words
    const k = [toks[i], toks[i].replace(/s$/, '')].flatMap((w) => lex.get(w) || []).find((e) => e.cat === 'kind')?.type;
    if (k) { kind = k; rest = toks.filter((_, j) => j !== i); }
  }
  const name = rest.join(' ');
  const things = kind ? set.live.ofType(kind) : [...set.worlds.values()].flatMap((w) => w.kinds).flatMap((t) => set.live.ofType(t));
  if (!name) return kind && things.length ? { thing: things[things.length - 1], type: kind } : null;
  const hit = things.find((x) => Object.entries(x.attrs).some(([k, vs]) => !k.startsWith('core.') && k !== 'kind' && k !== 'world' && vs.some((v) => valueText(v).toLowerCase() === name)));
  if (hit) return { thing: hit, type: hit.type };
  if (kind && /^\d+$/.test(name) && things[Number(name) - 1]) return { thing: things[Number(name) - 1], type: kind };
  return null;
}

/**
 * One frame reading bound to a request of the set: { request?, unread: [words], why?, confirm?, timeline? }. Every role
 * the frame filled lands in an argument or its words are in `unread`.
 */
function bindFrame(set, f, { lang, text = '' }) {
  const L = set.language, roles = f.roles || {}, unread = [];
  const words = (role) => roles[role]?.en ?? roles[role]?.text;
  const all = (role) => String(roles[role]?.text ?? words(role) ?? '').split(/\s+/).filter(Boolean);
  if (f.act === 'undo' || f.act === 'redo') {
    const left = Object.keys(roles).filter((k) => k !== 'amount');
    return { timeline: { act: f.act, n: roles.amount?.value }, unread: left.flatMap(all) };
  }
  const frameFact = L.ofType(`${lang}.frame`).find((x) => valueText(x.attrs.name[0]) === f.frame);
  const needs = frameFact?.attrs.needs ? valueText(frameFact.attrs.needs[0]) : null;
  const b = needs ? set.bindings[needs] : null;
  const attrOf = L.ofType(`${lang}.template`).find((t) => (t.attrs.frame || []).map(valueText).includes(f.frame) && t.attrs.attribute); // the language world says which key a value role fills
  const used = new Set();
  const args = {};
  let kind = null, placeless = null;
  if (b) {
    kind = b.kind;
    if (b.thing && words('thing')) { args[b.thing] = words('thing'); used.add('thing'); }
    if (b.amount && roles.amount?.value !== undefined) { args[b.amount] = roles.amount.value; used.add('amount'); }
    if (b.place && !words('place') && b.placeKind) { const ps = set.live.ofType(b.placeKind); if (ps.length) args[b.place] = `$${ps[ps.length - 1].id}`; } // no place said: the one made last
    if (b.place && words('place')) {
      const name = words('place').toLowerCase(), key = [].concat(b.placeKey ?? ['name'])[0];
      const target = set.live.ofType(b.placeKind).find((x) => [].concat(b.placeKey ?? ['name']).some((k) => valueText(x.attrs[k]?.[0]).toLowerCase() === name));
      used.add('place'); used.add('rel');
      if (!target) return { confirm: { place: b.place, key, args: { kind: b.placeKind, [key]: name } }, unread: [] };
      args[b.place] = `$${target.id}`;
    }
  } else {
    const kindWords = all('thing');
    if (!kindWords.length) return { unread: Object.keys(roles).flatMap(all) };
    const lex = typedLexicon(set.live);
    const head = kindWords[kindWords.length - 1];
    kind = [kindWords.join(' '), head, head.replace(/s$/, '')].flatMap((w) => lex.get(w) || []).find((e) => e.cat === 'kind')?.type ?? null;
    if (!kind && f.act !== 'make') { // a thing of the world, not a kind: remove Ann, remove table 1
      const ref = referentOf(set, kindWords.join(' '));
      if (!ref) return { unread: kindWords.filter((w) => !lex.has(w)).length ? kindWords.filter((w) => !lex.has(w)) : kindWords };
      used.add('thing');
      const left = Object.keys(roles).filter((k) => !used.has(k));
      return { request: { action: f.act, args: { thing: `$${ref.thing.id}` } }, unread: left.flatMap(all) };
    }
    if (!kind) { const un = kindWords.filter((w) => !lex.has(w)); return { unread: un.length ? un : kindWords, why: un.length ? undefined : `There is no ${kindWords.join(' ')} here.` }; }
    used.add('thing');
    const slots = set.live._compiled().slots.get(kind) || new Map();
    for (const w of kindWords.slice(0, -1)) { // words before the kind's word that are values of its closed sets: "a round table" -> shape=round
      const hit = [...slots].find(([, sl]) => (sl.enum || []).map((e) => valueText(e).toLowerCase()).includes(w));
      if (hit) args[hit[0]] = w; else unread.push(w);
    }
    if (roles.amount?.value !== undefined) { args.amount = roles.amount.value; used.add('amount'); }
    if (words('value') !== undefined) {
      const v = String(words('value')), key = attrOf ? valueText(attrOf.attrs.attribute[0]) : null;
      const enumKey = [...slots].find(([, sl]) => (sl.enum || []).map((e) => valueText(e).toLowerCase()).includes(v.toLowerCase()))?.[0];
      const k = key && slots.has(key) ? key : enumKey;
      if (k) { const at = text.toLowerCase().indexOf(v.toLowerCase()); args[k] = at >= 0 && !enumKey ? text.slice(at, at + v.length) : v; used.add('value'); } // a name as the user wrote it
    }
    if (words('place') !== undefined) { // a place: a thing of the world that a slot of this kind takes
      const ref = referentOf(set, words('place'));
      const key = ref && [...slots].find(([, sl]) => sl.type && (sl.type === ref.type))?.[0];
      if (key) { args[key] = `$${ref.thing.id}`; used.add('place'); used.add('rel'); }
      else placeless = ref ? `${articleFor(L, labelOf(set, kind), { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? 'a'} ${labelOf(set, kind)} has no place ${words('rel') ?? 'at'} ${articleFor(L, labelOf(set, ref.type), { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? 'a'} ${labelOf(set, ref.type)}`.replace(/^./, (c) => c.toUpperCase()) : `There is no ${words('place')} here`;
    }
  }
  for (const k of Object.keys(roles)) if (!used.has(k)) unread.push(...(k === 'rel' ? all('rel') : all(k)));
  return { request: { action: f.act, args: { kind, ...args } }, unread, ...(placeless ? { placeless } : {}) };
}

/**
 * The reply of a done act, with no ids: the language world's reply fact for the act when it has one (replyFrom),
 * else a short sentence with the kind said by its word, its article and its plural by the language world.
 */
function sayAct(set, act, { request, result, ok = true, n, thingType } = {}, context = {}) {
  const lang = context.lang ?? 'w.lang.en', L = set.language;
  const kindType = request?.args?.kind ?? thingType ?? (result?.thing ? set.live.get(result.thing)?.type : null) ?? (request?.args?.thing ? set.live.get(String(request.args.thing).replace(/^\$/, ''))?.type : null);
  const count = Array.isArray(result?.things) ? result.things.length : Number(request?.args?.amount ?? 1);
  const word = kindType ? labelOf(set, kindType) : null;
  const roles = { kind: word, amount: count > 1 ? count : undefined, n: n > 1 ? n : undefined };
  const composed = replyFrom(L, act, roles, { lang, type: context.replies, dictionary: context.replyDictionary });
  if (composed) return composed;
  const plural = (w) => inflectBy(L, w, 'plural', { types: { rule: `${lang}.inflect`, irregular: `${lang}.irregular` } });
  const np = !word ? 'that' : count > 1 ? `${count} ${word.split(' ').map((x, i, a) => (i === a.length - 1 ? plural(x) : x)).join(' ')}` : `${articleFor(L, word, { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? 'a'} ${word}`;
  if (act === 'undo') return ok ? 'I took the last step back.' : 'There is nothing to undo.';
  if (act === 'redo') return ok ? 'I put it back.' : 'There is nothing to redo.';
  if (act === 'make') return `I made ${np}.`;
  if (act === 'remove') return `I removed the ${word ?? 'thing'}.`;
  if (act === 'change') return `I changed the ${word ?? 'thing'}.`;
  return `I did that: ${act} ${np}.`;
}

/** Types in a library sentence said by their words. */
const labelled = (set, text) => text.replace(/\b([a-z]+(?:\.[a-z_]+)+)\b/g, (m) => (set.live._compiled().types.has(m) ? labelOf(set, m) : m));

/** A type said by its word (core.word means=): "w.list.list" -> "list". */
function labelOf(set, type) {
  return valueText(set.live.ofType('core.word').find((w) => (w.attrs.means || []).map(valueText).includes(type))?.attrs.text?.[0] ?? String(type).split('.').pop());
}

/**
 * A reply in the user's language from the language world's reply facts (`type`, default `${lang}.reply`: act=,
 * text= with {role} slots, realised by std.morph): the fact for the act whose slots are all given, the most
 * slots first; `dictionary` (std.morph's) gives the lemmas' classes and genders for the cells and agreement. Null
 * when the language world has none: the caller keeps the library's sentence.
 */
export function replyFrom(language, act, roles, { lang = 'w.lang.en', type, dictionary } = {}) {
  if (!language) return null;
  const T = type ?? `${lang}.reply`;
  const given = Object.keys(roles).filter((k) => roles[k] != null && roles[k] !== '');
  const slotsOf = (text) => [...new Set([...text.matchAll(/\{([\w.]+)(?::[^}@]*)?(?:@\w+)?\}/g)].map((m) => m[1]))]; // realise's syntax: {role}, {role:cells}, {role@agrees_with}
  const fit = language.ofType(T).map((f) => ({ act: valueText(f.attrs.act?.[0]), text: valueText(f.attrs.text?.[0] ?? '') }))
    .filter((f) => f.act === act && slotsOf(f.text).every((x) => given.includes(x)))
    .sort((x, y) => slotsOf(y.text).length - slotsOf(x.text).length)[0];
  if (!fit) return null;
  const m = memoPerWorld(language, `morph|${lang}|reply`, () => morphOf(language, { types: Object.fromEntries([['cls', 'class'], ['ending', 'ending'], ['irregular', 'irregular'], ['fold', 'fold'], ['split', 'split'], ['vowel', 'vowel']].map(([k, v]) => [k, `${lang}.${v}`]).concat([['template', T]])) }));
  const out = realise(m, fit.text, Object.fromEntries(given.map((k) => [k, String(roles[k])])), { dictionary });
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : null;
}

/** The types a world owns (its kinds) and the session's: a turn that addressed `owner` may change only these. */
export function turnScope(set, owner) {
  const own = new Set(set.worlds.get(owner)?.kinds ?? []);
  return (type) => own.has(type) || [...SESSION].some((p) => type.startsWith(p));
}

/**
 * A session over a world set (Q72 part 3): the pending question and the slot its answer fills, and the timeline.
 * `openSession(set, context)` returns { set, context, pending, turns, say(text) }. `say(text)`:
 * - a timeline phrase of the language world (`${lang}.phrase name=undo|redo item=`) undoes or redoes the last
 *   step of the live world (one turn is one step);
 * - with a pending question, an answer that fits the slot (`fitsSlot` on the set's typed world: a value of a
 *   closed set, a number, a name that is not a fragment) fills it; a yes or no (`${lang}.answer polarity=`)
 *   answers a confirmation (yes: make what was missing, then the message it was asked for runs again); a message
 *   that is neither drops the question and is read as a new turn;
 * - otherwise `readTurn`, and a required key the act left open becomes the pending question.
 * Every result is readTurn's shape, with `pending` (the question now open, or null).
 */
export function openSession(set, context = {}) {
  const lang = context.lang ?? 'w.lang.en';
  const L = set.language;
  const norm = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}' -]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const phrases = (name) => new Set((L?.ofType(`${lang}.phrase`) ?? []).filter((p) => valueText(p.attrs.name?.[0]) === name).flatMap((p) => (p.attrs.item || []).map((x) => norm(valueText(x)))));
  const timeline = { undo: phrases('undo'), redo: phrases('redo') };
  const polarity = new Map((L?.ofType(`${lang}.answer`) ?? []).flatMap((a) => (a.attrs.text || []).map((x) => [norm(valueText(x)), valueText(a.attrs.polarity?.[0])])));
  const s = { set, context, pending: null, turns: [] };
  const done = (r) => { s.pending = r.asks?.[0] ? { ...r.asks[0], text: r.text } : null; const out = { ...r, pending: s.pending }; s.turns.push(out); return out; };
  s.say = (text) => {
    const t = norm(text);
    for (const act of ['undo', 'redo']) { // bounded: two timeline acts
      if (!timeline[act].has(t)) continue;
      const r = act === 'undo' ? set.live.undo(1) : set.live.redo(1);
      const reply = r.ok ? (replyFrom(L, act, {}, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? (act === 'undo' ? 'I took the last step back.' : 'I put it back.')) : (act === 'undo' ? 'There is nothing to undo.' : 'There is nothing to redo.');
      return done({ status: r.ok ? 'done' : 'refused', text, reading: { act, unread: [], mood: 'imperative', complete: true }, reply });
    }
    const p = s.pending;
    if (p?.confirm) {
      const pol = polarity.get(t);
      if (pol === 'no') return done({ status: 'done', text, reading: { act: 'answer', unread: [], complete: true }, reply: 'All right.' });
      if (pol === 'yes') {
        const made = turn(set.live, [p.confirm]);
        if (made.status !== 'done') return done({ status: made.status, text, reading: { act: 'answer', unread: [], complete: true }, reply: (made.replies || []).join(' ') });
        const again = readTurn(set, p.text, context);
        return done({ ...again, text: p.text, reply: `${sayAct(set, 'make', { request: p.confirm }, context)} ${again.reply}`.trim() });
      }
    } else if (p?.request) { // a request waiting for a required key: the answer fills it, then the request runs
      const kind = p.request.args.kind, n = Number(p.request.args.amount ?? 1);
      const framed = readFrames(L, text, { lang, morph: context.morph, dictionary: context.dictionary }).best; // a message with a verb, or a question, is a new turn, not an answer
      const verbal = t.split(' ').some((w) => set.verbs[w]);
      if (!framed?.verb && !verbal && moodOf(L, text, { lang }) !== 'question') {
        const ands = new Set((L?.ofType(`${lang}.particle`) ?? []).filter((x) => valueText(x.attrs.meaning?.[0]) === 'and').flatMap((x) => [...(x.attrs.form || []), ...(x.attrs.text || [])].map(valueText)).concat(['and']));
        const parts = n > 1 ? String(text).split(/\s*,\s*|\s+/).filter((x) => x && !ands.has(x.toLowerCase())) : [String(text).trim()]; // n things: n values
        const fits = parts.map((x) => fitsSlot(set.typed, kind, p.key, x));
        const bad = fits.find((x) => !x.ok);
        const again = (why) => done({ status: 'ask', text: p.text, reading: { act: 'answer', unread: [], complete: false }, reply: `${why} ${p.ask ?? `What ${p.key}?`}`, asks: [p] }); // said, and asked again
        if (bad) return again(`${bad.why[0].toUpperCase()}${bad.why.slice(1)}.`);
        if (parts.length !== n) return again(`That is ${parts.length}, and there ${n === 1 ? 'is 1' : `are ${n}`}.`);
        const reqs = fits.map((x) => ({ action: p.request.action, args: { ...p.request.args, amount: undefined, [p.key]: x.value } }));
        for (const q of reqs) delete q.args.amount;
        const reading = { act: p.request.action, unread: [], mood: 'fragment', complete: true };
        const open = requiredOpen(set, reqs[0]);
        if (open.length) { const q = { ...open[0], request: n > 1 ? { ...p.request, args: { ...p.request.args, [p.key]: fits.map((x) => x.value) } } : reqs[0] }; return done({ status: 'ask', text: p.text, reading, request: reqs[0], reply: q.ask ?? `What ${q.key}?`, asks: [q] }); }
        const outs = reqs.map((q) => runRequest(set, q, reading, context)); // bounded: n values
        const last = outs[outs.length - 1];
        return done({ ...last, text, reply: n > 1 ? sayAct(set, p.request.action, { request: p.request, result: { things: outs.map((o) => o.request) } }, context) : last.reply });
      }
    }
    return done({ ...readTurn(set, text, context), text });
  };
  return s;
}
