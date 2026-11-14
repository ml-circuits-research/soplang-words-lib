// Typed worlds from schemas and knowledge (reviewer 06:55, a host's Q16: runtime worlds made of patterns
// and a matrix have no typed facts, so readByTypes, completeness, arbitration by coverage, resolveEllipsis
// and readEnsemble have nothing to type words with). `typedWorldFor` builds the typed world a host's
// world needs: its kinds and the words for them, its keys (declared relations, so a key is an attribute
// before any fact carries it) and their words, the values of closed sets, the things of the knowledge
// its slots join (names, kinds), and a type for every free-text slot (a name, a title, a text), so a
// slot can refuse what does not fit it ("makes a cow" is not an instrument). The input is either a
// World with core.type / core.slot / core.word, or a plain description (`schemaOf` gives one), so a host
// with a format of its own maps it once.

import { World } from './world.mjs';
import { typedLexicon } from './readtypes.mjs';
import { valueText } from './parser.mjs';

const bare = (v) => valueText(v).replace(/^\$/, '');
const atom = (v) => (typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v)) || /^[A-Za-z_][\w.:-]*$/.test(String(v)) ? String(v) : JSON.stringify(String(v)));
const TITLE = /^(title|aka|name|label|called|nickname|caption|heading)$/, TEXT = /^(text|note|notes|message|content|body|description|blurb|comment|doc|summary)$/;

/**
 * The description of a world's schema: { kinds: [{ type, words, keys: [{ key, value, many, enum, join: {
 * type, by }, text, words }] }], words: [{ text, means }] }, from its core.type, core.slot and core.word
 * facts (types under core. and std. left out).
 */
export function schemaOf(world) {
  const c = world._compiled(), kinds = [];
  for (const [type] of c.types) {
    if (type.startsWith('core.') || type.startsWith('std.')) continue;
    const keys = [...(c.slots.own.get(type)?.values() || [])].map((s) => ({ key: s.key, value: s.kinds?.[0] ?? null, many: !!s.many, enum: (s.enum || []).map(bare), join: s.type && s.by ? { type: s.type, by: s.by } : s.refs?.length ? { type: s.refs[0], by: null } : null }));
    kinds.push({ type, words: [], keys });
  }
  const words = world.ofType('core.word').flatMap((w) => (w.attrs.means || []).flatMap((m) => (w.attrs.text || []).map((t) => ({ text: bare(t), means: bare(m) }))));
  return { kinds, words };
}

/** The type a free-text key gets: `title` (a name a thing is called by), `text` (any words), or `name`. */
export const freeTextType = (key, given) => given ?? (TITLE.test(key) ? 'title' : TEXT.test(key) ? 'text' : 'name');

/**
 * A typed world for a schema and the knowledge it joins. `schema`: a World or a description (schemaOf).
 * `knowledge`: a World holding the joined types (a catalog), or null. Options: `max` (things per joined
 * type, 5000), `text` ({ key: 'name' | 'title' | 'text' } for free-text keys), `words` (more { text, means }),
 * `things` (the session's things, [{ id, label, kind, attrs }], at runtime).
 * Returns { world, slots: Map('type|key' -> { expects: 'thing' | 'value' | 'number' | 'name' | 'title' |
 * 'text', of?, values? }), lexicon, counts: { kinds, keys, things, values, words } }.
 */
export function typedWorldFor(schema, knowledge = null, { max = 5000, text = {}, words = [], things = [] } = {}) {
  const d = schema instanceof World ? schemaOf(schema) : schema;
  const lines = [], slots = new Map(), joined = new Map();
  const counts = { kinds: 0, keys: 0, things: 0, values: 0, words: 0 };
  let n = 0;
  for (const k of d.kinds || []) {
    counts.kinds++;
    lines.push(`@typed.${++n} core.type of=${k.type}`);
    for (const w of k.words || []) { lines.push(`@typed.${++n} core.word text=${atom(w)} means=${k.type}`); counts.words++; }
    for (const s of k.keys || []) {
      counts.keys++;
      const kind = s.value === 'number' || s.value === 'integer' ? s.value : null;
      const parts = [`@typed.${++n} core.slot of=${k.type} key=${s.key}`];
      if (s.many) parts.push('many=true');
      if (kind) parts.push(`kind=${kind}`);
      for (const e of s.enum || []) parts.push(`enum=${atom(e)}`);
      lines.push(parts.join(' '));
      lines.push(`@typed.${++n} k.kinds.relation type=${k.type} key=${s.key}${s.join ? ` object_type=${s.join.type}` : ''}`); // a key is an attribute of its kind before any fact carries it
      for (const w of s.words || []) { lines.push(`@typed.${++n} core.word text=${atom(w)} means=${s.key}`); counts.words++; }
      let sig;
      if (s.join) { sig = { expects: 'thing', of: s.join.type, by: s.join.by ?? 'name' }; joined.set(s.join.type, s.join.by ?? 'name'); }
      else if (s.enum?.length) { sig = { expects: 'value', values: s.enum.map(String) }; counts.values += s.enum.length; }
      else if (kind || s.value === 'boolean') sig = { expects: kind ? 'number' : 'value', ...(kind ? {} : { values: ['yes', 'no', 'true', 'false'] }) };
      else sig = { expects: freeTextType(s.key, text[s.key]) };
      slots.set(`${k.type}|${s.key}`, sig);
    }
  }
  // a kind whose name joins a knowledge type: the knowledge's things are things of this kind, so they carry its keys
  for (const k of d.kinds || []) { const nj = (k.keys || []).find((x) => x.key === 'name' && x.join); if (nj) for (const s of k.keys) if (s.key !== 'name') lines.push(`@typed.${++n} k.kinds.relation type=${nj.join.type} key=${s.key}`); }
  for (const w of [...(d.words || []), ...words]) { lines.push(`@typed.${++n} core.word text=${atom(w.text)} means=${atom(w.means)}`); counts.words++; }
  if (knowledge) for (const [type, by] of joined) { // the things of each joined type, by the key the join names them by
    let i = 0;
    for (const f of knowledge.ofType(type)) { // bounded: max per type
      if (i >= max) break;
      const names = (f.attrs[by] || f.attrs.name || []).map(bare);
      if (!names.length) continue;
      const kinds = ['kind', 'class', 'is'].flatMap((k) => (f.attrs[k] || []).map((v) => ` ${k}=${atom(bare(v))}`)).join('');
      for (const nm of names) { lines.push(`@typed.${++n} ${type} name=${atom(nm)}${kinds}`); counts.things++; }
      i++;
    }
  }
  for (const t of things) { lines.push(`@${String(t.id).replace(/[^\w.-]/g, '_')} ${t.kind} name=${atom(t.label ?? t.id)}${Object.entries(t.attrs ?? {}).map(([k, v]) => [].concat(v).map((x) => ` ${k}=${atom(x)}`).join('')).join('')}`); counts.things++; } // the session's own things
  const world = new World();
  const told = world.load(lines.join('\n'));
  if (told.ok === false) throw new Error(`sopworld: typedWorldFor: ${JSON.stringify(told.violations?.[0] ?? told)}`);
  return { world, slots, lexicon: typedLexicon(world), counts };
}

/**
 * Does `text` fit the slot `type|key` of a typed world (typedWorldFor's result)? A joined slot takes the
 * name of one of its things; a closed set one of its values; a number a number; a name or a title takes
 * words that are not a question, an act, an attribute or a relation word of the world (so a relation read as a value is
 * refused), a title any words; a text takes anything but nothing. An empty value, an article alone or a single
 * letter is never a name, a title or a thing. Returns { ok, as, id?, value?, why? }. `skip`: words to pass over
 * (articles); `lemma(word) -> [forms]`.
 */
export function fitsSlot(typed, type, key, text, { skip = ['a', 'an', 'the'], lemma } = {}) {
  const sig = typed.slots.get(`${type}|${key}`);
  if (!sig) return { ok: false, why: `${type} has no slot ${key}` };
  const raw = String(text ?? '').trim(), low = raw.toLowerCase();
  const toks = (low.match(/[\p{L}\p{N}_'-]+/gu) || []).filter((t) => !skip.includes(t));
  const forms = (t) => [t, ...(lemma ? lemma(t) : []), t.replace(/s$/, '')];
  const lex = typed.lexicon;
  if (!raw) return { ok: false, as: sig.expects, why: `${key} needs a value` }; // an empty slot value is never a value
  if (sig.expects !== 'number' && sig.expects !== 'text' && toks.length === 0) return { ok: false, as: sig.expects, why: `"${raw}" is a fragment, not a ${sig.expects === 'thing' ? sig.of.split('.').pop() : sig.expects}` }; // only an article
  if ((sig.expects === 'name' || sig.expects === 'title') && toks.length === 1 && /^\p{L}$/u.test(toks[0])) return { ok: false, as: sig.expects, why: `"${raw}" is a single letter, a fragment` };
  if (sig.expects === 'text') return { ok: true, as: 'text', value: raw };
  if (sig.expects === 'number') return /^-?\d+(\.\d+)?$/.test(toks.join('')) ? { ok: true, as: 'number', value: Number(toks.join('')) } : { ok: false, as: 'number', why: `${key} takes a number, not "${raw}"` };
  if (sig.expects === 'value') { const v = sig.values.find((x) => x.toLowerCase() === toks.join(' ') || x.toLowerCase().replace(/_/g, ' ') === toks.join(' ')); return v ? { ok: true, as: 'value', value: v } : { ok: false, as: 'value', why: `${key} is one of ${sig.values.slice(0, 6).join(', ')}${sig.values.length > 6 ? ', ...' : ''}, not "${raw}"` }; }
  if (sig.expects === 'thing') {
    const phrase = toks.join(' ');
    const hit = (lex.get(phrase) || []).find((e) => e.cat === 'thing' && e.type === sig.of) ?? forms(phrase).flatMap((f) => lex.get(f) || []).find((e) => e.cat === 'thing' && e.type === sig.of);
    return hit ? { ok: true, as: 'thing', id: hit.id, value: phrase } : { ok: false, as: 'thing', why: `there is no ${sig.of.split('.').pop()} called "${raw}"` };
  }
  // a name or a title: any words, but not a question, an act or an attribute of the world
  const QUESTION = new Set(['what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how']);
  for (const t of toks) {
    if (QUESTION.has(t) && sig.expects === 'name') return { ok: false, as: sig.expects, why: `"${raw}" asks something; a ${sig.expects} does not` };
    const e = forms(t).flatMap((f) => lex.get(f) || []).find((x) => x.cat === 'act' || (x.cat === 'attr' && x.verb) || x.cat === 'word'); // a word the world reads as an act, a key or a relation
    if (e && sig.expects === 'name') return { ok: false, as: 'name', why: `"${t}" in "${raw}" is ${e.cat === 'act' ? `the act ${e.act}` : e.cat === 'attr' ? `the ${e.key} of a thing` : `a word for ${e.means}`}, not part of a name` };
  }
  return toks.length ? { ok: true, as: sig.expects, value: raw } : { ok: false, as: sig.expects, why: `${key} needs words` };
}
