// Statements read by type as taught facts (reviewer 09:20 L5, 10:55: a host's deleted profile tab carried 30 real
// turns: "I have two kids", "I am 40", "I like cats, dogs and horses", "my name is Ana"). A first-person statement
// (moodOf: statement) about the user is read against the keys of a person type: the key is named by one of its
// words (core.word text= means=<key>, or the key itself), the value is a number, a value of the key's closed set,
// a list of words, or the rest of the sentence; the facts go on the user's thing, at the tier the host says. A
// question about the user reads back through the same keys ("how many kids do I have"), and "what do you know
// about me" describes the thing. The person type and its words are the schema's (w.person when published).

import { moodOf } from './reader.mjs';
import { typedLexicon, readByTypes } from './readtypes.mjs';
import { valueText } from './parser.mjs';

const EN = { self: ['i', 'me', 'my', 'mine', "i'm", 'im'], copula: ['am', 'is', 'are', "'m", 'm'], have: ['have', 'has', 'got'], skip: ['a', 'an', 'the', 'and', 'also', 'too', 'really', 'very', 'called', 'named'], and: ['and', ','] };
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

function keysOf(world, type) {
  const c = world._compiled(), slots = [...(c.slots.get(type)?.values() || [])];
  const lex = typedLexicon(world), words = new Map(); // word -> key
  for (const s of slots) words.set(s.key.replace(/_/g, ' '), s.key);
  for (const [w, es] of lex) for (const e of es) if ((e.cat === 'word' || e.cat === 'attr') && slots.some((s) => s.key === (e.means ?? e.key))) words.set(w, e.means ?? e.key);
  return { slots, words };
}

/**
 * The facts a first-person statement gives about the user: { mood, facts: [{ key, value | values }], unread, why? }.
 * Options: `type` (the person type), `self`, `copula`, `have`, `skip` (the language's words; English defaults),
 * `numbers` ({ word: n }), `number` (the key a bare number after the copula sets: "I am 40" -> age), `lang`.
 */
export function readStatement(world, text, { type, self = EN.self, copula = EN.copula, have = EN.have, skip = EN.skip, numbers = NUM, number, lang = 'w.lang.en' } = {}) {
  const mood = moodOf(world, text, { lang });
  if (mood !== 'statement') return { mood, facts: [], unread: [], why: `a ${mood}, not a statement` };
  const { slots, words } = keysOf(world, type);
  const toks = (String(text).toLowerCase().replace(/[.!]+$/, '').match(/[\p{L}\p{N}'-]+|,/gu) || []).filter((t) => !self.includes(t));
  const slot = (k) => slots.find((s) => s.key === k);
  const numOf = (t) => (/^\d+(\.\d+)?$/.test(t) ? Number(t) : numbers[t]);
  // the key: the longest word sequence that names one
  let keyAt = -1, keyLen = 0, key = null;
  for (let i = 0; i < toks.length; i++) for (let n = 3; n >= 1; n--) { const p = toks.slice(i, i + n).join(' '); if (words.has(p) && n > keyLen) { keyAt = i; keyLen = n; key = words.get(p); } }
  const rest = (from) => toks.slice(from).filter((t) => !skip.includes(t) && !copula.includes(t) && !have.includes(t));
  const numAt = toks.findIndex((t) => numOf(t) !== undefined);
  if (!key && numAt >= 0 && number && toks.slice(0, numAt).some((t) => copula.includes(t))) key = number; // "I am 40"
  if (!key) return { mood, facts: [], unread: rest(0).filter((t) => t !== ','), why: 'no key of the person names it' };
  const s = slot(key);
  const isNum = s?.kinds?.some((k) => k === 'number' || k === 'integer');
  if (isNum) { // "I have two kids", "my age is 40", "I am 40"
    if (numAt < 0) return { mood, facts: [], unread: rest(0), why: `${key} takes a number` };
    return { mood, facts: [{ key, value: numOf(toks[numAt]) }], unread: rest(0).filter((t, i, a) => t !== toks[numAt] && t !== ',' && !toks.slice(keyAt, keyAt + keyLen).includes(t)) };
  }
  const after = (keyAt >= 0 ? toks.slice(keyAt + keyLen) : toks).filter((t) => !copula.includes(t) && !have.includes(t));
  if (s?.many) { // "I like cats, dogs and horses": a list
    const values = after.join(' ').split(/\s*(?:,|\band\b)\s*/).map((v) => v.split(' ').filter((t) => !skip.includes(t)).join(' ')).filter(Boolean);
    return values.length ? { mood, facts: [{ key, values }], unread: [] } : { mood, facts: [], unread: [], why: `${key} needs a value` };
  }
  const value = after.filter((t) => !skip.includes(t) && t !== ',').join(' ');
  if (!value) return { mood, facts: [], unread: [], why: `${key} needs a value` };
  if (s?.enum?.length && !s.enum.map((e) => valueText(e).toLowerCase()).includes(value)) return { mood, facts: [], unread: [value], why: `${key} is one of ${s.enum.map(valueText).join(', ')}` };
  return { mood, facts: [{ key, value: String(text).match(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))?.[0] ?? value }], unread: [] }; // the value as the user wrote it (a name keeps its capitals)
}

/**
 * Read a statement and tell its facts on the user's thing `subject` (made of `type` when missing), at `tier` when
 * given. Returns readStatement's result with `told` (the tell's result).
 */
export function tellStatement(world, text, { type, subject = 'me', tier, ...options } = {}) {
  const r = readStatement(world, text, { type, ...options });
  if (!r.facts.length) return r;
  const q = (v) => (typeof v === 'number' || /^[A-Za-z_][\w.:-]*$/.test(String(v)) ? String(v) : JSON.stringify(String(v)));
  if (!world.get(subject)) world.tell(`@${subject} ${type}`, tier ? { tier } : {});
  const have = (k) => (world.get(subject).attrs[k] || []).map(valueText);
  const sets = r.facts.filter((f) => !f.values).map((f) => ({ id: subject, key: f.key, value: q(f.value) })); // a single value is replaced
  const fills = r.facts.filter((f) => f.values).flatMap((f) => f.values.filter((v) => !have(f.key).includes(v)).map((v) => ({ id: subject, key: f.key, value: q(v) }))); // a list grows
  const told = world.applyPatch({ sets, fills }, tier ? { tier } : {});
  return { ...r, told };
}

/** What a world knows about a thing: [{ key, values }] (its own keys, core.* left out), for "what do you know about me". */
export function describeThing(world, id) {
  const w = world.get(String(id).replace(/^\$/, ''));
  if (!w) return [];
  return Object.entries(w.attrs).filter(([k]) => !k.startsWith('core.')).map(([key, vs]) => ({ key, values: vs.map(valueText) }));
}

/**
 * A question about the user read back through the person's keys: the words of `self` stand for the user's thing
 * (`subject`), then readByTypes reads it. Returns readByTypes' result. Options: `subject`, `self`, and readByTypes'.
 */
export function readAboutSelf(world, text, { subject = 'me', self = EN.self, ...read } = {}) {
  const name = valueText(world.get(subject)?.attrs.name?.[0] ?? subject);
  const said = String(text).replace(/[\p{L}'-]+/gu, (t) => (self.includes(t.toLowerCase()) ? name : t));
  return readByTypes(world, said, read);
}
