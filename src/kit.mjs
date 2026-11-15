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
import { morphOf, realise, articleFor } from './morph.mjs';

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
  const needsOf = (fr) => { const x = L.ofType(`${lang}.frame`).find((y) => valueText(y.attrs.name[0]) === fr.frame); return x?.attrs.needs ? valueText(x.attrs.needs[0]) : null; };
  const f = r.frames.find((fr) => set.bindings[needsOf(fr)]) ?? r.best, roles = f.roles; // a frame whose needs this set binds wins over a general one
  const reading = { frame: f.frame, act: f.act, roles, unread: [], mood, complete: mood !== 'statement' && mood !== 'fragment' };
  if (!reading.complete) return { status: 'not-understood', reading, reply: mood === 'fragment' ? 'I did not understand: that is only a fragment.' : 'I took that as a statement, not a request.' };
  // the frame bound to a request: the needs class through the host's bindings, else the role names as act roles
  const frameFact = L.ofType(`${lang}.frame`).find((x) => valueText(x.attrs.name[0]) === f.frame);
  const needs = frameFact?.attrs.needs ? valueText(frameFact.attrs.needs[0]) : null;
  const b = needs ? set.bindings[needs] : null;
  const words = (role) => roles[role]?.en ?? roles[role]?.text;
  let request;
  if (b) {
    const args = { kind: b.kind };
    if (b.thing && words('thing')) args[b.thing] = words('thing');
    if (b.amount && roles.amount?.value !== undefined) args[b.amount] = roles.amount.value;
    if (b.place && !words('place') && b.placeKind) { const all = set.live.ofType(b.placeKind); if (all.length) args[b.place] = `$${all[all.length - 1].id}`; } // no place said: the one made last
    if (b.place && words('place')) { // the place names a thing of the world: a list by its name
      const name = words('place').toLowerCase(), target = set.live.ofType(b.placeKind).find((x) => [].concat(b.placeKey ?? ['name']).some((k) => valueText(x.attrs[k]?.[0]).toLowerCase() === name));
      if (!target) return { status: 'ask', reading, reply: `There is no ${name} ${label(b.placeKind)} yet. Shall I make it?`, asks: [{ key: b.place, value: name, confirm: { action: 'make', args: { kind: b.placeKind, [[].concat(b.placeKey ?? ['name'])[0]]: name } } }] };
      args[b.place] = `$${target.id}`;
    }
    request = { action: f.act, args };
  } else {
    const kindWords = words('thing');
    const lex = typedLexicon(set.live);
    const kind = kindWords && [kindWords, kindWords.split(' ').pop(), kindWords.split(' ').pop().replace(/s$/, '')].flatMap((w) => lex.get(w) || []).find((e) => e.cat === 'kind')?.type;
    if (!kind) { const unread = (kindWords ? kindWords.split(' ') : tokens).filter((w) => !lex.has(w)); return { status: 'not-understood', reading: { ...reading, complete: false, unread: unread.length ? unread : tokens }, reply: kindWords && !unread.length ? `There is no ${kindWords} here.` : `I did not understand ${(unread.length ? unread : tokens).map((w) => `"${w}"`).join(', ')}.` }; }
    const values = {}; // words before the kind's word that are values of its closed sets: "a shopping list" -> sort=shopping
    for (const w of kindWords.split(' ').slice(0, -1)) for (const [key, sl] of set.live._compiled().slots.get(kind) || []) if ((sl.enum || []).map((e) => valueText(e).toLowerCase()).includes(w)) values[key] = w;
    const left = kindWords.split(' ').slice(0, -1).filter((w) => !Object.values(values).includes(w));
    if (left.length) return { status: 'not-understood', reading: { ...reading, complete: false, unread: left }, reply: `I did not understand ${left.map((w) => `"${w}"`).join(', ')}.` }; // a word left is never dropped
    request = { action: f.act, args: { kind, ...values, ...(roles.amount?.value !== undefined ? { amount: roles.amount.value } : {}) } };
  }
  const owners = arbitrate(set.live, request, { active, criteria });
  if (!owners.owner) return { status: owners.ambiguous ? 'ask' : 'refused', reading, request, reply: owners.ambiguous ? `In which: ${owners.ambiguous.join(' or ')}?` : (owners.verdicts.find((v) => v.verdict === 'refuse')?.why ?? 'No world here takes that.'), ...(owners.ambiguous ? { asks: [{ key: 'world', values: owners.ambiguous }] } : {}) };
  const before = new Set([...set.live.wires.keys()]);
  const t = turn(set.live, [request], context.reply ? { reply: context.reply } : {});
  const changed = [...set.live.wires.values()].filter((w) => !before.has(w.id)).map((w) => w.type);
  const library = ((t.replies || []).join(' ') || t.question || '').replace(/\b([a-z]+(?:\.[a-z_]+)+)\b/g, (m) => (set.live._compiled().types.has(m) ? label(m) : m)).replace(/\b(a|an) ([A-Za-z][\w-]*)/g, (all, _a, w) => `${articleFor(L, w, { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? _a} ${w}`); // a/an by the language world, after a type became its word
  // a required key the act left open: one question each, answered by the next message (openSession)
  const asks = (t.results || []).flatMap((x) => (x.result?.asks || []).map((a) => ({ ...a, thing: x.result.thing, type: set.live.get(x.result.thing)?.type })));
  const roles2 = { kind: request.args.kind ? label(request.args.kind) : undefined, thing: b?.thing ? request.args[b.thing] : undefined, amount: b?.amount ? request.args[b.amount] : undefined };
  const composed = t.status === 'done' ? replyFrom(L, request.action, roles2, { lang, type: context.replies, dictionary: context.replyDictionary }) : null; // the language world's reply, when it has one
  const said = [composed ?? library, ...asks.map((a) => a.ask ?? `What ${a.key}?`)].filter(Boolean).join(' ');
  return { status: t.status === 'done' ? 'done' : t.status, reading, request, owner: owners.owner, reply: said, changed, ...(asks.length ? { asks } : {}), ...(composed ? { composed: true } : {}) };
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
        return done({ ...again, text: p.text, reply: `${labelled(set, (made.replies || []).join(' '))} ${again.reply}`.trim() });
      }
    } else if (p?.thing && p.type) {
      const fit = fitsSlot(set.typed, p.type, p.key, text);
      const framed = readFrames(L, text, { lang, morph: context.morph, dictionary: context.dictionary }).best; // a message with a verb, or a question, is a new turn, not an answer
      const verbal = t.split(' ').some((w) => set.verbs[w]);
      const answer = !framed?.verb && !verbal && moodOf(L, text, { lang }) !== 'question';
      if (answer && !fit.ok) return done({ status: 'ask', text: p.text, reading: { act: 'answer', unread: [], complete: false }, reply: `${fit.why[0].toUpperCase()}${fit.why.slice(1)}. ${p.ask ?? `What ${p.key}?`}`, asks: [p] }); // not a value of the slot: said, and asked again
      if (answer) {
        const r = turn(set.live, [{ action: 'change', args: { thing: p.thing, attr: p.key, value: fit.value } }]);
        const ok = r.status === 'done';
        return done({ status: r.status, text, reading: { act: 'answer', unread: [], mood: 'fragment', complete: true }, request: { action: 'change', args: { thing: p.thing, attr: p.key, value: fit.value } }, reply: ok ? (replyFrom(L, 'change', { thing: labelOf(set, p.type), value: fit.value }, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? `The ${labelOf(set, p.type)} ${p.key} is now ${fit.value}.`) : (r.replies || []).join(' ') });
      }
    }
    return done({ ...readTurn(set, text, context), text });
  };
  return s;
}
