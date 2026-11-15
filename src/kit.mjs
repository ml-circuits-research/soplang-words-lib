// The host kit (reviewer 13:15 item 5, 13:50: Q72 approved): what every application needs to run worlds, so a
// second application is a few lines, not 96 host files. `loadWorldSet` loads each world an application uses into
// its own World (with std.acts and the worlds it imports) and keeps one typed world; `readTurn` reads one message under the
// Reader contract with a language world's frames, binds the frame to a request, chooses the world that owns the kind
// (the open tab only as the host's criterion), and acts only on a complete reading: otherwise it asks, or says
// which words it did not understand. A turn changes only the world it addresses and the session.

import { World } from './world.mjs';
import { readFrames, senseOf } from './frames.mjs';
import { clauses, cutPoints } from './clauses.mjs';
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
  const verbActs = {};
  for (const v of language?.ofType('k.actions.verb') ?? []) (verbActs[valueText(v.attrs.text?.[0]).toLowerCase()] ||= []).push(valueText(v.attrs.act?.[0])); // bounded: the verbs; a verb may say several acts (make: make, change)
  const V = verbs ?? Object.fromEntries(Object.entries(verbActs).map(([t, acts]) => [t, acts.includes(t) ? t : acts[0]]));
  return { worlds, schema, language, typed, bindings, verbs: V, verbActs, session: new Set(session), steps: [], redo: [] };
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
  const touched = [];
  for (; k < n; k++) { // bounded: n
    const from = act === 'undo' ? set.steps : set.redo, to = act === 'undo' ? set.redo : set.steps;
    const step = from[from.length - 1];
    if (!step) break;
    const w = set.worlds.get(step.world)?.world;
    const r = act === 'undo' ? w.undo(1) : w.redo(1);
    if (r.ok === false) break;
    to.push(from.pop());
    touched.push(step.world);
  }
  return { ok: k > 0, n: k, worlds: touched };
}

/**
 * One message, one turn. `context`: { lang ('w.lang.en'), active (the open tab's world), criteria (the host's
 * std.decide criteria for kind world, with `active` among the measures), morph, dictionary (the language's
 * morphology), reply(world, request, result) }. Returns { status: 'done' | 'ask' | 'not-understood' | 'refused',
 * reading: { frame, act, roles, unread, mood, complete }, request?, owner?, reply, changed?, why? }. An
 * incomplete reading is never acted on.
 */
export function readTurn(set, text, context = {}) {
  const started = Date.now(), lang = context.lang ?? 'w.lang.en';
  const over = () => context.budget?.ms && Date.now() - started > context.budget.ms;
  // the message cut into clauses (one splitter, the language world's cut points): a cutting whose every clause has a
  // complete plan wins; else the whole message is one clause, read and reported as it is
  const plans = new Map();
  const planOf = (t) => { if (!plans.has(t)) plans.set(t, planClause(set, t, context)); return plans.get(t); };
  const cut = set.language ? clauses(set.language, text, { lang, read: (t) => { const p = planOf(t); return p.plan ? { literal: p.literal } : null; } }) : null;
  const parts = cut && cut.length > 1 ? cut.map((c) => c.text) : [text];
  const planned = parts.map(planOf);
  const stop = planned.find((p) => !p.plan); // the first clause that cannot run: said, and nothing of the message runs
  if (stop) return parts.length > 1 ? { ...stop, clauses: parts } : stop;
  if (over()) return { status: 'too-complex', reading: planned[0].reading, reply: 'That took too long; nothing was changed.' };
  const outs = [];
  for (const p of planned) { // bounded: the clauses, one step each
    if (over()) { outs.push({ status: 'too-complex', reading: p.reading, reply: 'That took too long; the rest was not done.' }); break; }
    const r = runPlan(set, p, context);
    outs.push(r);
    if (r.status !== 'done') break;
  }
  if (outs.length === 1) return outs[0];
  const last = outs[outs.length - 1];
  return { ...last, status: outs.every((o) => o.status === 'done') ? 'done' : last.status, clauses: parts, results: outs, reply: outs.map((o) => o.reply).filter(Boolean).join(' '), changed: outs.flatMap((o) => o.changed || []), effects: outs.flatMap((o) => o.effects || []) };
}

/**
 * One clause read and bound, nothing run: { plan: { as: 'request' | 'timeline' | 'host', ... }, reading, literal }
 * or a final result (not understood, a question). Host readers (`context.readers`: fn(set, text, context) ->
 * [{ request, unread, literal? }]) are tried before the language world's frames (`context.frames: false` skips them).
 */
function planClause(set, text, context = {}) {
  const { lang = 'w.lang.en', morph, dictionary } = context;
  const L = set.language;
  const label = (type) => labelOf(set, type);
  const mood = L ? moodOf(L, text, { lang }) : 'imperative';
  for (const reader of context.readers || []) { // bounded: the host's readers
    const cands = [].concat(reader(set, text, context) || []);
    const good = cands.find((c) => c?.request && !(c.unread || []).length);
    if (good) {
      const reading = { frame: good.frame ?? null, act: good.request.action, roles: good.roles ?? {}, unread: [], mood, complete: true, reader: reader.name || 'host' };
      const host = good.request.host || context.hostActs?.includes(good.request.action);
      if (host) return { plan: { as: 'host', request: good.request }, reading, literal: good.literal ?? 1 };
      const asks = requiredOpen(set, good.request);
      if (asks.length) return { status: 'ask', reading, request: good.request, reply: asks.map((x) => askText(set, x, context)).join(' '), asks };
      return { plan: { as: 'request', request: good.request }, reading, literal: good.literal ?? 1 };
    }
  }
  if (context.frames === false || !L) return { status: 'not-understood', reading: { frame: null, unread: String(text).split(/\s+/), mood, complete: false }, reply: notUnderstood(set, String(text).split(/\s+/), context) };
  const verbOf = (lemma) => set.verbs[String(lemma).toLowerCase()];
  const values = memoPerWorld(set.schema, 'kit-values', () => [...new Set([...set.worlds.values()].flatMap((w) => w.kinds).flatMap((k) => [...(set.schema._compiled().slots.get(k)?.values() ?? [])]).flatMap((sl) => (sl.enum || []).map(valueText)))]); // the values of the set's closed sets: the frames' value lexicon
  const r = readFrames(L, text, { lang, morph, dictionary, lexicons: { value: values, ...(context.lexicons || {}) }, senses: context.senses ?? ((id) => (id && verbOf(id) ? { act: verbOf(id), acts: set.verbActs?.[String(id).toLowerCase()], en: id } : senseOf(L, id))) }); // a lemma that is an English verb; else the dictionary's sense id (k.words.table.noun.1 -> table)
  const tokens = r.tokens;
  if (!r.best) {
    const known = typedLexicon(set.schema);
    const unread = tokens.filter((t) => !known.has(t));
    return { status: 'not-understood', reading: { frame: null, unread: unread.length ? unread : tokens, mood, complete: false }, reply: notUnderstood(set, unread.length ? unread : tokens, context) };
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
  const { joiners } = cutPoints(L, { lang });
  for (const v of Object.values(f.roles || {})) { // a role that runs over a joiner into a verb holds a second clause: not this reading's words ("called three and add a blue table")
    const ws = String(v.text ?? '').toLowerCase().split(/\s+/);
    const at = ws.findIndex((w, i) => joiners.has(w) && ws.slice(i + 1).some((x) => verbOf(x)));
    if (at >= 0) return { status: 'not-understood', reading: { ...reading, complete: false, unread: ws.slice(at) }, reply: notUnderstood(set, ws.slice(at), context) };
  }
  const literal = tokens.length - Object.values(f.roles || {}).reduce((n, v) => n + String(v.text ?? '').split(/\s+/).filter(Boolean).length, 0); // the words the frame itself matched
  if (b.confirm) return { status: 'ask', reading, reply: `There is no ${b.confirm.args[b.confirm.key]} ${label(b.confirm.args.kind)} yet. Shall I make it?`, asks: [{ key: b.confirm.place, value: b.confirm.args[b.confirm.key], confirm: { action: 'make', args: b.confirm.args } }] };
  if (!reading.complete) return { status: 'not-understood', reading, reply: b.placeless ? `${b.placeless}.` : b.unread.length ? notUnderstood(set, b.unread, context) : b.why };
  if (literal <= 0) return { status: 'not-understood', reading: { ...reading, complete: false, unread: tokens }, reply: notUnderstood(set, tokens, context) }; // a catch-all frame that matched no word of its own reads nothing
  if (b.timeline) return { plan: { as: 'timeline', act: b.timeline.act, n: b.timeline.n ?? 1 }, reading, literal };
  const request = b.request;
  // a required key the request leaves open is asked before anything is made: never a thing with a hole in it
  const asks = requiredOpen(set, request);
  if (asks.length) return { status: 'ask', reading, request, reply: asks.map((x) => askText(set, x, context)).join(' '), asks };
  return { plan: { as: 'request', request }, reading, literal };
}

/** Run one planned clause: a timeline step, a host request (its effects), or a request in the world that owns it. */
function runPlan(set, p, context = {}) {
  const lang = context.lang ?? 'w.lang.en';
  const { plan, reading } = p;
  if (plan.as === 'timeline') {
    const res = stepTimeline(set, plan.act, plan.n);
    return { status: res.ok ? 'done' : 'refused', reading, request: { action: plan.act, args: { n: plan.n } }, reply: res.ok ? (replyFrom(set.language, `done.${plan.act}`, {}, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? sayAct(set, plan.act, { ok: true, n: plan.n }, context)) : sayAct(set, plan.act, { ok: false, n: plan.n }, context), effects: [{ effect: plan.act, worlds: res.worlds ?? [] }] };
  }
  if (plan.as === 'host') { // navigation and the like: the host's, through its hook; not a step of any world
    const h = context.onHost ? context.onHost(plan.request, set) || {} : { reply: 'No host here takes that.' };
    return { status: h.status ?? 'done', reading, request: plan.request, reply: h.reply ?? '', changed: [], effects: [].concat(h.effects || []) };
  }
  return runRequest(set, plan.request, reading, context);
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
  const effects = t.status === 'done' ? [{ effect: 'changed', world: pick, things: [...new Set([result?.thing, ...(result?.things || [])].filter(Boolean).map(String))] }] : []; // for the page: what to redraw
  if (t.status === 'done') set.focus = result?.thing ?? (result?.things || []).slice(-1)[0] ?? held?.thing.id ?? set.focus; // what "it" names next
  return { status: t.status === 'done' ? 'done' : t.status, reading, request, owner: owners_.owner, reply, changed, effects };
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
 * things, else the n-th made), "the second table" (the language world's ordinals), "it" (its anaphors: the thing the
 * last turn made or touched), "Ann" (a thing whose name it is). Returns { thing, type } or null.
 */
export function referentOf(set, words, { lang = 'w.lang.en' } = {}) {
  const L = set.language;
  const text = String(words).toLowerCase().trim();
  const anaphors = new Set((L?.ofType(`${lang}.anaphor`) ?? []).map((a) => valueText(a.attrs.text?.[0]).toLowerCase()));
  if (anaphors.has(text)) { const f = set.focus && findThing(set, set.focus); return f ? { thing: f.thing, type: f.thing.type } : null; } // "it", "that one": the thing the last turn made or touched
  const dets = new Set((L?.ofType(`${lang}.det`) ?? []).flatMap((d) => [...(d.attrs.text || []), ...(d.attrs.form || [])]).map((v) => valueText(v).toLowerCase()));
  const ordinals = new Map((L?.ofType(`${lang}.ordinal`) ?? []).map((o) => [valueText(o.attrs.text?.[0]).toLowerCase(), Number(valueText(o.attrs.value?.[0]))]));
  let toks = text.split(/\s+/).filter((t) => t && !dets.has(t));
  const nth = toks.map((t) => ordinals.get(t)).find((v) => v !== undefined); // "the second table": the second made
  toks = toks.filter((t) => !ordinals.has(t));
  const lex = typedLexicon(set.schema);
  let kind = null, rest = toks;
  for (let i = 0; i < toks.length && !kind; i++) { // bounded: the words
    const k = [toks[i], toks[i].replace(/s$/, '')].flatMap((w) => lex.get(w) || []).find((e) => e.cat === 'kind')?.type;
    if (k) { kind = k; rest = toks.filter((_, j) => j !== i); }
  }
  const name = rest.join(' ');
  const things = kind ? thingsOf(set, kind) : [...set.worlds.values()].flatMap((w) => w.kinds.flatMap((t) => w.world.ofType(t)));
  if (!name && nth !== undefined) return kind && things[nth - 1] ? { thing: things[nth - 1], type: kind } : null;
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
  const gloss = (role) => (roles[role]?.words?.length ? roles[role].words.map((w) => String(w.en ?? w.lemma ?? w.form).toLowerCase()) : all(role)); // the words in the schema's language: a Romanian "masa" is the sense table
  if (f.act === 'undo' || f.act === 'redo') {
    const left = Object.keys(roles).filter((k) => k !== 'amount');
    return { timeline: { act: f.act, n: roles.amount?.value }, unread: left.flatMap(all) };
  }
  const frameFact = L.ofType(`${lang}.frame`).find((x) => valueText(x.attrs.name[0]) === f.frame);
  const needs = frameFact?.attrs.needs ? valueText(frameFact.attrs.needs[0]) : null;
  const b = needs ? set.bindings[needs] : null;
  const frameNames = [f.frame, f.en].filter(Boolean); // a frame and the pivot frame it mirrors (w.lang.ro ro.make.name en=acts.make.name)
  const attrOf = [...L.ofType(`${lang}.template`), ...(lang !== 'w.lang.en' ? L.ofType('w.lang.en.template') : [])].find((t) => (t.attrs.frame || []).map(valueText).some((x) => frameNames.includes(x)) && t.attrs.attribute); // the language world says which key a value role fills
  const used = new Set();
  const args = {};
  let kind = null, placeless = null;
  if (b) {
    kind = b.kind;
    if (b.thing && words('thing')) { args[b.thing] = roles.thing?.text ?? words('thing'); used.add('thing'); } // the entry as the user wrote it
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
    const kindWords = gloss('thing');
    if (!kindWords.length) return { unread: Object.keys(roles).flatMap(all) };
    const lex = typedLexicon(set.schema);
    const forms = all('thing'), formOf = (w) => (forms.length === kindWords.length ? forms[kindWords.indexOf(w)] ?? w : w); // unread words as the user wrote them
    const kindOf = (w) => [w, w.replace(/s$/, '')].flatMap((x) => lex.get(x) || []).find((e) => e.cat === 'kind')?.type;
    const whole = kindOf(kindWords.join(' '));
    let at = whole ? -1 : kindWords.length - 1; // the kind's word: last in English, first in Romanian ("masă rotundă"): wherever it stands
    if (!whole) { for (let i = kindWords.length - 1; i >= 0; i--) if (kindOf(kindWords[i])) { at = i; break; } } // bounded: the words
    kind = whole ?? kindOf(kindWords[at]) ?? null;
    const mods = whole ? [] : kindWords.filter((_, i) => i !== at);
    if (f.act === 'change' && words('value') !== undefined) { // make table 2 square: a thing of the world and a value of one of its closed sets (or the key the template names)
      const ref = referentOf(set, kindWords.join(' '), { lang });
      if (!ref) return { unread: kindWords.map(formOf) };
      const v = String(roles.value?.item ?? roles.value?.text ?? words('value')).toLowerCase();
      const slotsT = set.schema._compiled().slots.get(ref.type) || new Map();
      const key = attrOf && slotsT.has(valueText(attrOf.attrs.attribute[0])) ? valueText(attrOf.attrs.attribute[0]) : [...slotsT].find(([, sl]) => (sl.enum || []).map((e) => valueText(e).toLowerCase()).includes(v))?.[0];
      used.add('thing'); used.add('value');
      const left = Object.keys(roles).filter((k) => !used.has(k)).flatMap(all);
      if (!key) return { unread: [...all('value'), ...left], placeless: `${articleFor(L, labelOf(set, ref.type), { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? 'a'} ${labelOf(set, ref.type)} cannot be ${v}`.replace(/^./, (c) => c.toUpperCase()) };
      return { request: { action: 'change', args: { thing: `$${ref.thing.id}`, attr: key, value: v } }, unread: left };
    }
    if (f.act !== 'make' && referentOf(set, kindWords.join(' '), { lang })) kind = null; // a thing of the world named: remove the second table
    if (!kind && f.act !== 'make') { // a thing of the world, not a kind: remove Ann, remove table 1
      const ref = referentOf(set, kindWords.join(' '), { lang });
      if (!ref) return { unread: (kindWords.filter((w) => !lex.has(w)).length ? kindWords.filter((w) => !lex.has(w)) : kindWords).map(formOf) };
      used.add('thing');
      const left = Object.keys(roles).filter((k) => !used.has(k));
      return { request: { action: f.act, args: { thing: `$${ref.thing.id}` } }, unread: left.flatMap(all) };
    }
    if (!kind) { const un = kindWords.filter((w) => !lex.has(w)); return { unread: (un.length ? un : kindWords).map(formOf), why: un.length ? undefined : `There is no ${kindWords.join(' ')} here.` }; }
    used.add('thing');
    const slots = set.schema._compiled().slots.get(kind) || new Map();
    for (const w of mods) { // the other words of the thing that are values of its closed sets: "a round table" -> shape=round
      const hit = [...slots].find(([, sl]) => (sl.enum || []).map((e) => valueText(e).toLowerCase()).includes(w));
      if (hit) args[hit[0]] = w; else unread.push(formOf(w));
    }
    if (roles.amount?.value !== undefined) { args.amount = roles.amount.value; used.add('amount'); }
    if (words('value') !== undefined) {
      const v = String(roles.value?.text ?? words('value')), key = attrOf ? valueText(attrOf.attrs.attribute[0]) : null;
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
  const word = kindType ? (context.wordOf?.(kindType, lang) ?? wordIn(set, kindType, lang) ?? labelOf(set, kindType)) : null; // a kind in the user's language: the host's wordOf, the language world's word (core.word means=), else the schema's
  const names = { make: 'done.add', ...(context.replyNames || {}) }; // which reply fact says an act (make: "I added a list."; a drawing host names done.make)
  const roles = act === 'make' ? { kind: word } : { thing: word };
  if (count > 1) roles.number = count;
  if (act === 'change' && request?.args?.value !== undefined) roles.value = request.args.value;
  if ((act === 'undo' || act === 'redo') && !ok) return replyFrom(L, `nothing.${act}`, {}, { lang, type: context.replies }) ?? (act === 'undo' ? 'There is nothing to undo.' : 'There is nothing to redo.');
  const composed = replyFrom(L, names[act] ?? `done.${act}`, roles, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? replyFrom(L, act, roles, { lang, type: context.replies, dictionary: context.replyDictionary });
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

/**
 * The question for an open key: the slot's own `ask`, else the language world's `ask.key` reply with the key said in
 * the user's language (`context.wordOf(key)`, else the key), else "What key?".
 */
function askText(set, a, context = {}) {
  if (a.ask) return a.ask;
  const key = context.wordOf?.(a.key, context.lang ?? 'w.lang.en') ?? wordIn(set, `${a.type ?? a.request?.args?.kind}.${a.key}`, context.lang ?? 'w.lang.en') ?? a.key;
  return replyFrom(set.language, 'ask.key', { key }, { lang: context.lang ?? 'w.lang.en', type: context.replies, dictionary: context.replyDictionary }) ?? `What ${a.key}?`;
}

/** The not-understood reply naming the words: the language world's `not_understood` fact, else English. */
function notUnderstood(set, words, context = {}) {
  const list = words.map((w) => `"${w}"`).join(', ');
  return replyFrom(set.language, 'not_understood', { words: list }, { lang: context.lang ?? 'w.lang.en', type: context.replies }) ?? `I did not understand ${list}.`;
}

/** A type (or a key, type.key) said by the language world's own word for it (w.lang.ro: core.word text="masă" means=w.seating.table), or null. */
function wordIn(set, type, lang = set.lang ?? null) {
  const L = set.language;
  if (!L) return null;
  const own = (x) => !lang || x.id.startsWith(`${lang}.`); // the language world's own words, not a schema's English ones loaded beside them
  const w = L.ofType('core.word').find((x) => own(x) && (x.attrs.means || []).map(valueText).includes(type));
  return w ? valueText(w.attrs.text?.[0]) : null;
}

/** Types in a library sentence said by their words. */
const labelled = (set, text) => text.replace(/\b([a-z]+(?:\.[a-z_]+)+)\b/g, (m) => (set.schema._compiled().types.has(m) ? labelOf(set, m) : m));

/** A type said by its word (core.word means=): "w.list.list" -> "list". */
function labelOf(set, type) {
  return valueText(set.schema.ofType('core.word').find((w) => (w.attrs.means || []).map(valueText).includes(type))?.attrs.text?.[0] ?? String(type).split('.').pop());
}

/**
 * The plural class of a number by the language world's CLDR rules (`${lang}.count class= rule=`, CLDR's syntax over
 * n, i, v, f, t with `%`, `=`, `!=`, ranges `a..b`, lists, `and`, `or`); without rules: one for 1, else other.
 */
export function countClass(language, n, { lang = 'w.lang.en', type } = {}) {
  const rules = language?.ofType(type ?? `${lang}.count`) ?? [];
  const num = Number(n);
  const str = String(n), frac = str.includes('.') ? str.split('.')[1] : '';
  const ops = { n: Math.abs(num), i: Math.trunc(Math.abs(num)), v: frac.length, f: Number(frac || 0), t: Number(frac.replace(/0+$/, '') || 0) };
  const holds = (rule) => String(rule).split(/\s+or\s+/).some((alt) => alt.split(/\s+and\s+/).every((c) => { // bounded: the rule's terms
    const m = c.trim().match(/^([nivft])(?:\s*%\s*(\d+))?\s*(!?=)\s*(.+)$/);
    if (!m) return false;
    const x = m[2] ? ops[m[1]] % Number(m[2]) : ops[m[1]];
    const any = m[4].split(',').some((r) => { const [lo, hi] = r.trim().split('..').map(Number); return hi === undefined ? x === lo : x >= lo && x <= hi && Number.isInteger(x); });
    return m[3] === '=' ? any : !any;
  }));
  for (const r of rules) if (r.attrs.rule && holds(valueText(r.attrs.rule[0]))) return valueText(r.attrs.class[0]); // bounded: the rules
  return rules.length ? 'other' : num === 1 ? 'one' : 'other';
}

/**
 * A reply in the user's language from the language world's reply facts (`type`, default `${lang}.reply`: name=,
 * count=, act=, role=, text= in std.morph's template syntax; reviewer 14:45 item 2, the knowledge repository's
 * w.lang.en.reply and w.lang.ro.reply). `key` is a reply name ("done.add", "not_understood") or an act. The fact
 * whose roles are all given and whose plural class (`count`) is the class of `roles.number` (1 when none) by
 * `countClass`, the most roles first. `{art}` is the language's indefinite article (a `${lang}.det kind=article
 * def=no` lemma), agreeing by realise; a plural the dictionary cannot make is made by the language world's
 * inflection rules; a/an by its onsets. `dictionary` (std.morph's) gives classes and genders. Null when the language
 * world has none: the caller keeps its own sentence.
 */
export function replyFrom(language, key, roles, { lang = 'w.lang.en', type, dictionary, count } = {}) {
  if (!language) return null;
  const T = type ?? `${lang}.reply`;
  const given = Object.keys(roles).filter((k) => roles[k] != null && roles[k] !== '');
  const slotsOf = (text) => [...new Set([...text.matchAll(/\{([\w.]+)(?::[^}@]*)?(?:@\w+)?\}/g)].map((m) => m[1]))]; // realise's syntax: {role}, {role:cells}, {role@agrees_with}
  const cls = count ?? countClass(language, roles.number ?? 1, { lang });
  const facts = language.ofType(T).map((f) => ({ name: f.attrs.name ? valueText(f.attrs.name[0]) : null, act: f.attrs.act ? valueText(f.attrs.act[0]) : null, count: f.attrs.count ? valueText(f.attrs.count[0]) : null, text: valueText(f.attrs.text?.[0] ?? '') }));
  const named = facts.filter((f) => f.name === key), pool = named.length ? named : facts.filter((f) => f.act === key);
  const needs = (f) => slotsOf(f.text).filter((x) => x !== 'art');
  const fit = pool.filter((f) => (!f.count || f.count === cls) && needs(f).every((x) => given.includes(x)))
    .sort((x, y) => needs(y).length - needs(x).length)[0];
  if (!fit) return null;
  const m = memoPerWorld(language, `morph|${lang}|reply`, () => morphOf(language, { types: Object.fromEntries([['cls', 'class'], ['ending', 'ending'], ['irregular', 'irregular'], ['fold', 'fold'], ['split', 'split'], ['vowel', 'vowel']].map(([k, v]) => [k, `${lang}.${v}`]).filter(([k, t]) => k !== 'irregular' || language.ofType(t).every((x) => x.attrs.lemma && x.attrs.form)).concat([['template', T]])) }));
  const r = Object.fromEntries(given.map((k) => [k, String(roles[k])]));
  if (slotsOf(fit.text).includes('art') && r.art === undefined) { const a = language.ofType(`${lang}.det`).find((d) => valueText(d.attrs.kind?.[0]) === 'article' && valueText(d.attrs.def?.[0]) === 'no'); if (a) r.art = valueText(a.attrs.lemma?.[0] ?? a.attrs.form?.[0]); }
  let text = fit.text;
  for (const x of [...text.matchAll(/\{(\w+):num=pl\}/g)]) if (!dictionary?.lookup(r[x[1]])) { r[x[1]] = String(r[x[1]]).split(' ').map((w, i, all) => (i === all.length - 1 ? inflectBy(language, w, 'plural', { types: { rule: `${lang}.inflect`, irregular: `${lang}.irregular` } }) : w)).join(' '); text = text.replace(x[0], `{${x[1]}}`); } // a plural the dictionary cannot make: the language's rules
  let out = realise(m, text, r, { dictionary });
  if (!out) return null;
  out = out.replace(/\b(a|an) ([A-Za-z][\w-]*)/g, (all, _a, w) => `${articleFor(language, w, { types: { det: `${lang}.det`, onset: `${lang}.onset` } }) ?? _a} ${w}`);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** What a turn addressed to `owner` may change: that world and the session worlds the host named (`changed` entries). */
export function turnScope(set, owner) {
  return (entry) => entry.world === owner || set.session.has(entry.world);
}

/**
 * The set as data (Q72 session part: snapshot / restore): each world's log with its timeline (undo, redo), the set's
 * steps across worlds and the thing "it" names. `restoreSet(set, data)` puts a set loaded from the same schemas back
 * into that state (a host that restarts keeps undo and redo).
 */
export function snapshotSet(set) {
  return { format: 'sopworld-set', worlds: Object.fromEntries([...set.worlds.values()].map((w) => [w.name, w.world.toJSON({ timeline: true })])), steps: set.steps.map((x) => ({ ...x })), redo: set.redo.map((x) => ({ ...x })), focus: set.focus ?? null };
}
export function restoreSet(set, data) {
  if (data?.format !== 'sopworld-set') throw new Error('sopworld: restoreSet: not a set snapshot');
  for (const [name, snap] of Object.entries(data.worlds || {})) { // bounded: the worlds
    const w = set.worlds.get(name);
    if (!w) throw new Error(`sopworld: restoreSet: the set has no world ${name}`);
    w.world = World.fromJSON(snap);
  }
  set.steps = (data.steps || []).map((x) => ({ ...x }));
  set.redo = (data.redo || []).map((x) => ({ ...x }));
  set.focus = data.focus ?? undefined;
  return set;
}

/**
 * Why a turn did what it did ("why?" after a turn): for each thing it changed, each key's value with how it came (told
 * by the request, a default, knowledge, a guess) from the world's own why. Returns { said, facts: [{ thing, key, value,
 * tier, how }] }; the sentence is the language world's `why` reply facts when present (`why.told`, `why.default`), else
 * English.
 */
export function whyTurn(set, result, context = {}) {
  const lang = context.lang ?? 'w.lang.en';
  if (!result || result.status !== 'done') return { said: 'Nothing was done.', facts: [] };
  const facts = [];
  for (const e of [].concat(result.effects || []).filter((x) => x.effect === 'changed')) { // bounded: the effects
    const w = set.worlds.get(e.world)?.world;
    for (const id of e.things || []) { // bounded: the things
      const t = w?.get(id);
      if (!t) continue;
      const only = result.request?.action === 'change' ? result.request.args.attr : null; // a change: the key it changed
      for (const key of Object.keys(t.attrs).filter((k) => !k.startsWith('core.') && k !== 'kind' && k !== 'world' && (!only || k === only))) { // bounded: its keys
        const step = w.why(id, key)?.steps?.[0];
        if (step) facts.push({ thing: id, type: t.type, key, value: valueText(step.value), tier: step.tier, how: step.how });
      }
    }
  }
  const said = facts.map((f) => {
    const roles = { key: f.key, value: f.value, thing: wordIn(set, f.type, lang) ?? labelOf(set, f.type) };
    const k = f.tier === 'default' ? 'why.default' : f.tier === 'told' ? 'why.told' : `why.${f.tier}`;
    return replyFrom(set.language, k, roles, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? (f.tier === 'told' ? `The ${f.key} is ${f.value} because you said so.` : f.tier === 'default' ? `The ${f.key} is ${f.value} by default.` : `The ${f.key} is ${f.value} (${f.tier}).`);
  });
  return { said: said.length ? [result.text ? `You asked: "${result.text}".` : '', ...said].filter(Boolean).join(' ') : 'Nothing changed.', facts };
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
  const reasons = new Set((L?.ofType(`${lang}.wh`) ?? []).filter((x) => valueText(x.attrs.asks?.[0]) === 'reason').map((x) => valueText(x.attrs.text?.[0]).toLowerCase()));
  s.snapshot = () => ({ ...snapshotSet(set), pending: s.pending });
  s.restore = (data) => { restoreSet(set, data); s.pending = data.pending ?? null; return s; };
  s.say = (text) => {
    const t = norm(text);
    const toks = t.split(' ');
    const lex = typedLexicon(set.schema);
    if (reasons.has(toks[0]) && toks.length <= 5 && !toks.slice(1).some((w) => (lex.get(w) || []).some((e) => e.cat === 'kind' || e.cat === 'thing'))) { // "why?", "why did you do that": the last turn's reasons
      const last = [...s.turns].reverse().find((x) => x.status === 'done');
      const y = whyTurn(set, last, context);
      return done({ status: 'done', text, reading: { act: 'why', unread: [], mood: 'question', complete: true }, reply: y.said, facts: y.facts });
    }
    for (const act of ['undo', 'redo']) { // bounded: two timeline acts
      if (!timeline[act].has(t)) continue;
      const r = stepTimeline(set, act, 1);
      const reply = r.ok ? (replyFrom(L, `done.${act}`, {}, { lang, type: context.replies, dictionary: context.replyDictionary }) ?? (act === 'undo' ? 'I took the last step back.' : 'I put it back.')) : (act === 'undo' ? 'There is nothing to undo.' : 'There is nothing to redo.');
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
        const again = (why) => done({ status: 'ask', text: p.text, reading: { act: 'answer', unread: [], complete: false }, reply: `${why} ${askText(set, p, context)}`, asks: [p] }); // said, and asked again
        if (bad) return again(`${bad.why[0].toUpperCase()}${bad.why.slice(1)}.`);
        if (parts.length !== n) return again(`That is ${parts.length}, and there ${n === 1 ? 'is 1' : `are ${n}`}.`);
        const reqs = fits.map((x) => ({ action: p.request.action, args: { ...p.request.args, amount: undefined, [p.key]: x.value } }));
        for (const q of reqs) delete q.args.amount;
        const reading = { act: p.request.action, unread: [], mood: 'fragment', complete: true };
        const open = requiredOpen(set, reqs[0]);
        if (open.length) { const q = { ...open[0], request: n > 1 ? { ...p.request, args: { ...p.request.args, [p.key]: fits.map((x) => x.value) } } : reqs[0] }; return done({ status: 'ask', text: p.text, reading, request: reqs[0], reply: askText(set, q, context), asks: [q] }); }
        const outs = reqs.map((q) => runRequest(set, q, reading, context)); // bounded: n values
        const last = outs[outs.length - 1];
        return done({ ...last, text, reply: n > 1 ? sayAct(set, p.request.action, { request: p.request, result: { things: outs.map((o) => o.request) } }, context) : last.reply });
      }
    }
    return done({ ...readTurn(set, text, context), text });
  };
  return s;
}
