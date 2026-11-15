// The host kit (reviewer 13:15 item 5, 13:50: Q72 approved): what every application needs to run worlds, so a
// second application is a few lines, not 96 host files. `loadWorldSet` loads each world an application uses into
// its own World (with std.acts and the worlds it imports) and keeps one typed world; `readTurn` reads one message under the
// Reader contract with a language world's frames, binds the frame to a request, chooses the world that owns the kind
// (the open tab only as the host's criterion), and acts only on a complete reading: otherwise it asks, or says
// which words it did not understand. A turn changes only the world it addresses and the session.

import { World } from './world.mjs';
import { readFrames } from './frames.mjs';
import { moodOf } from './reader.mjs';
import { turn } from './turn.mjs';
import { choose } from './rank.mjs';
import { typedWorldFor, schemaOf, fitsSlot } from './typed.mjs';
import { typedLexicon } from './readtypes.mjs';
import { valueText } from './parser.mjs';
import { memoPerWorld } from './memo.mjs';
import { morphOf, realise, articleFor, inflectBy } from './morph.mjs';

/**
 * Load the worlds an application uses, one World per world (reviewer 14:45 item 3; the owner's isolation decision):
 * `loader(name) -> text` (a file, a fetch, a bundle). Options: `names` (the world schemas: w.list, w.tasks, ...);
 * `language` (a World holding the language world's frames, parts, phrases, closed words: the reader's); `knowledge` (a
 * World the worlds' slots join, for the typed world); `bindings` ({ needs: { kind, thing?, place?, amount?,
 * placeKind?, placeKey? } }: how a frame's `needs` class maps onto a world's entry kind and keys, until the language
 * world says it); `verbs` ({ lemma: act }; default from the language world's k.actions.verb facts); `session` (the
 * names of the worlds any turn may change, the host's). A world reads the worlds it imports (`core.module imports=`:
 * their types, explicitly), and owns only the kinds it declares. A world that declares no kind of its own, or holds a
 * wire of a type nothing declares, is refused (item 4). Returns the set: { worlds (name -> { name, kinds, imports,
 * world }), schema (every schema in one read-only World: words and slots), language, typed, bindings, verbs, session,
 * steps }.
 */
export function loadWorldSet(loader, { names = [], language = null, knowledge = null, bindings = {}, verbs, session = [] } = {}) {
  const texts = new Map();
  const textOf = (n) => { if (!texts.has(n)) texts.set(n, loader(n) ?? null); return texts.get(n); };
  const missing = names.filter((n) => textOf(n) == null);
  if (missing.length) throw new Error(`sopworld: loadWorldSet: no text for ${missing.join(', ')}`);
  const importsOf = (n) => { const m = String(textOf(n) ?? '').match(/^@\S+\s+core\.module\b([^\n]*)/m); return m ? [...m[1].matchAll(/\bimports=(\S+)/g)].map((x) => x[1]) : []; };
  const closure = (n, seen = []) => { // bounded: each world once; a cycle is refused
    if (seen.includes(n)) throw new Error(`sopworld: loadWorldSet: imports go round: ${[...seen, n].join(' -> ')}`);
    return [...new Set([...importsOf(n).flatMap((d) => (textOf(d) == null ? [] : closure(d, [...seen, n]))), n])];
  };
  const worlds = new Map();
  for (const name of names) { // bounded: the worlds named
    const order = closure(name);
    const world = new World();
    const r = world.load(['@acts core.use world=std.acts', ...order.map(textOf)].join('\n'));
    if (r.ok === false) throw new Error(`sopworld: loadWorldSet: ${name}: ${JSON.stringify(r.violations?.[0])}`);
    const types = world._compiled().types;
    const unknown = [...new Set([...world.wires.values()].map((w) => w.type).filter((t) => !types.has(t) && !/^(core|std)\./.test(t)))];
    if (unknown.length) throw new Error(`sopworld: loadWorldSet: ${name} holds wires of types nothing declares: ${unknown.slice(0, 5).join(', ')}`);
    const kinds = world.ofType('std.schema.kind').filter((k) => (k.attrs.world || []).map(valueText).includes(name)).map((k) => valueText(k.attrs.of[0]));
    if (!kinds.length) throw new Error(`sopworld: loadWorldSet: ${name} declares no kind of its own (std.schema.kind world=${name})`);
    worlds.set(name, { name, kinds, imports: order.filter((x) => x !== name), world });
  }
  const schema = new World(); // the schemas in one World, read only: the words, the slots, the typed world
  const all = [...new Set(names.flatMap((n) => closure(n)))];
  const rs = schema.load(['@acts core.use world=std.acts', ...all.map(textOf)].join('\n'));
  if (rs.ok === false) throw new Error(`sopworld: loadWorldSet: ${JSON.stringify(rs.violations?.[0])}`);
  const typed = typedWorldFor(schemaOf(schema), knowledge);
  const V = verbs ?? Object.fromEntries((language?.ofType('k.actions.verb') ?? []).map((v) => [valueText(v.attrs.text?.[0]).toLowerCase(), valueText(v.attrs.act?.[0])]));
  return { worlds, schema, language, typed, bindings, verbs: V, session: new Set(session), steps: [], redo: [] };
}

/** The things of a type in every world of the set (a type's things live in the world that owns its kind). */
function thingsOf(set, type) {
  return [...set.worlds.values()].flatMap((w) => w.world.ofType(type));
}
/** A thing by id and the world that holds it. */
function findThing(set, id) {
  const bare = String(id).replace(/^\$/, '');
  for (const w of set.worlds.values()) { const x = w.world.get(bare); if (x) return { thing: x, world: w.name }; } // bounded: the worlds
  return null;
}
/** One step of the set's timeline back or forward: the world the last step touched undoes it. */
function stepTimeline(set, act, n = 1) {
  let k = 0;
  for (; k < n; k++) { // bounded: n
    const from = act === 'undo' ? set.steps : set.redo, to = act === 'undo' ? set.redo : set.steps;
    const step = from[from.length - 1];
    if (!step) break;
    const w = set.worlds.get(step.world)?.world;
    const r = act === 'undo' ? w.undo(1) : w.redo(1);
    if (r.ok === false) break;
    to.push(from.pop());
  }
  return { ok: k > 0, n: k };
}

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
    const known = typedLexicon(set.schema);
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
    const n = b.timeline.n ?? 1, res = stepTimeline(set, b.timeline.act, n);
    return { status: res.ok ? 'done' : 'refused', reading, request: { action: b.timeline.act, args: { n } }, reply: sayAct(set, b.timeline.act, { ok: res.ok, n }, context) };
  }
  const request = b.request;
  // a required key the request leaves open is asked before anything is made: never a thing with a hole in it
  const asks = requiredOpen(set, request);
  if (asks.length) return { status: 'ask', reading, request, reply: asks.map((a) => a.ask ?? `What ${a.key}?`).join(' '), asks };
  return runRequest(set, request, reading, context);
}

const SAID = new Set(['make', 'remove', 'change']); // acts whose reply is a sentence of what was done; questions keep the answer

/** Run a bound request: the world that owns the kind (or holds the thing), one turn (one step), a reply with no ids. */
function runRequest(set, request, reading, context = {}) {
  const { lang = 'w.lang.en', active, criteria } = context;
  const held = request.args.thing ? findThing(set, request.args.thing) : null;
  const owners = held ? [held.world] : [...set.worlds.values()].filter((w) => w.kinds.includes(request.args.kind)).map((w) => w.name);
  const pick = owners.length === 1 ? owners[0] : owners.includes(active) ? active : (criteria && owners.length > 1 ? choose(null, 'world', owners.map((o) => ({ world: o, active: o === active })), { seed: null, criteria }).best?.world : null); // the host's criteria (the open tab a measure)
  if (!pick) return { status: owners.length ? 'ask' : 'refused', reading, request, reply: owners.length ? `In which: ${owners.join(' or ')}?` : 'No world here takes that.', ...(owners.length ? { asks: [{ key: 'world', values: owners }] } : {}) };
  const owner = { owner: pick };
  const before = new Map([...set.worlds.values()].map((w) => [w.name, new Set(w.world.wires.keys())]));
  const thingType = held?.thing.type ?? null; // said after it may be gone
  const target = set.worlds.get(pick).world;
  const t = turn(target, [request], context.reply ? { reply: context.reply } : {});
  const changed = [...set.worlds.values()].flatMap((w) => { const was = before.get(w.name); return [...w.world.wires.values()].filter((x) => !was.has(x.id)).map((x) => ({ world: w.name, type: x.type })).concat([...was].filter((id) => !w.world.wires.has(id)).map((id) => ({ world: w.name, type: 'removed', id }))); }); // every world: a stray change to another world is seen
  if (t.status === 'done') { set.steps.push({ world: pick }); set.redo.length = 0; }
  const result = t.results?.[0]?.result;
  const reply = t.status === 'done' && SAID.has(request.action) ? sayAct(set, request.action, { request, result, thingType }, context) : labelled(set, (t.replies || []).join(' ') || t.question || '');
  const owners_ = owner;
  return { status: t.status === 'done' ? 'done' : t.status, reading, request, owner: owners_.owner, reply, changed };
}

/** The required keys of the kind a make request names that it does not give (and no default fills). */
function requiredOpen(set, request) {
  if (request.action !== 'make' || !request.args.kind) return [];
  const slots = set.schema._compiled().slots.get(request.args.kind);
  if (!slots) return [];
  return [...slots.values()].filter((sl) => sl.required && sl.default === undefined && request.args[sl.key] === undefined && sl.key !== 'kind').map((sl) => ({ key: sl.key, ...(sl.ask ? { ask: valueText(sl.ask) } : {}), request }));
}

/**
 * A thing of the set named by words (a referent): "table 1" (a kind's word and a name or number of one of its
 * things, else the n-th made), "Ann" (a thing whose name it is). Returns { thing, type } or null.
 */
export function referentOf(set, words) {
  const toks = String(words).toLowerCase().split(/\s+/).filter(Boolean);
  const lex = typedLexicon(set.schema);
  let kind = null, rest = toks;
  for (let i = 0; i < toks.length && !kind; i++) { // bounded: the words
    const k = [toks[i], toks[i].replace(/s$/, '')].flatMap((w) => lex.get(w) || []).find((e) => e.cat === 'kind')?.type;
    if (k) { kind = k; rest = toks.filter((_, j) => j !== i); }
  }
  const name = rest.join(' ');
  const things = kind ? thingsOf(set, kind) : [...set.worlds.values()].flatMap((w) => w.kinds.flatMap((t) => w.world.ofType(t)));
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
    if (b.place && !words('place') && b.placeKind) { const ps = thingsOf(set, b.placeKind); if (ps.length) args[b.place] = `$${ps[ps.length - 1].id}`; } // no place said: the one made last
    if (b.place && words('place')) {
      const name = words('place').toLowerCase(), key = [].concat(b.placeKey ?? ['name'])[0];
      const target = thingsOf(set, b.placeKind).find((x) => [].concat(b.placeKey ?? ['name']).some((k) => valueText(x.attrs[k]?.[0]).toLowerCase() === name));
      used.add('place'); used.add('rel');
      if (!target) return { confirm: { place: b.place, key, args: { kind: b.placeKind, [key]: name } }, unread: [] };
      args[b.place] = `$${target.id}`;
    }
  } else {
    const kindWords = all('thing');
    if (!kindWords.length) return { unread: Object.keys(roles).flatMap(all) };
    const lex = typedLexicon(set.schema);
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
    const slots = set.schema._compiled().slots.get(kind) || new Map();
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
  const kindType = request?.args?.kind ?? thingType ?? (result?.thing ? findThing(set, result.thing)?.thing.type : null) ?? (request?.args?.thing ? findThing(set, request.args.thing)?.thing.type : null);
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
const labelled = (set, text) => text.replace(/\b([a-z]+(?:\.[a-z_]+)+)\b/g, (m) => (set.schema._compiled().types.has(m) ? labelOf(set, m) : m));

/** A type said by its word (core.word means=): "w.list.list" -> "list". */
function labelOf(set, type) {
  return valueText(set.schema.ofType('core.word').find((w) => (w.attrs.means || []).map(valueText).includes(type))?.attrs.text?.[0] ?? String(type).split('.').pop());
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

/** What a turn addressed to `owner` may change: that world and the session worlds the host named (`changed` entries). */
export function turnScope(set, owner) {
  return (entry) => entry.world === owner || set.session.has(entry.world);
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
      const r = stepTimeline(set, act, 1);
      const reply = r.ok ? (replyFrom(L, act, {}, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? (act === 'undo' ? 'I took the last step back.' : 'I put it back.')) : (act === 'undo' ? 'There is nothing to undo.' : 'There is nothing to redo.');
      return done({ status: r.ok ? 'done' : 'refused', text, reading: { act, unread: [], mood: 'imperative', complete: true }, reply });
    }
    const p = s.pending;
    if (p?.confirm) {
      const pol = polarity.get(t);
      if (pol === 'no') return done({ status: 'done', text, reading: { act: 'answer', unread: [], complete: true }, reply: 'All right.' });
      if (pol === 'yes') {
        const made = runRequest(set, p.confirm, { act: 'make', unread: [], complete: true }, context);
        if (made.status !== 'done') return done({ ...made, text });
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
