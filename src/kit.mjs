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
import { typedWorldFor, schemaOf } from './typed.mjs';
import { typedLexicon } from './readtypes.mjs';
import { valueText } from './parser.mjs';

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
      if (!target) return { status: 'ask', reading, reply: `There is no ${name} ${b.placeKind.split('.').pop()} yet. Shall I make it?`, asks: [{ key: b.place, value: name }] };
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
  const label = (type) => valueText(set.live.ofType('core.word').find((w) => (w.attrs.means || []).map(valueText).includes(type))?.attrs.text?.[0] ?? type.split('.').pop()); // a kind said by its word
  const said = ((t.replies || []).join(' ') || t.question || '').replace(/\b([a-z]+(?:\.[a-z_]+)+)\b/g, (m) => (set.live._compiled().types.has(m) ? label(m) : m));
  return { status: t.status === 'done' ? 'done' : t.status, reading, request, owner: owners.owner, reply: said, changed };
}

/** The types a world owns (its kinds) and the session's: a turn that addressed `owner` may change only these. */
export function turnScope(set, owner) {
  const own = new Set(set.worlds.get(owner)?.kinds ?? []);
  return (type) => own.has(type) || [...SESSION].some((p) => type.startsWith(p));
}
