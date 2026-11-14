// General host code taken into the library (a host's handover LIB-5..8, written here from its description):
// the genre of a document type and the topics a world can compose about; a typed world from a session's things
// and roles re-read by type; every assignment of words to the typed slots of a pattern; judging a reply and
// tabulating cousins.

import { World } from './world.mjs';
import { typedLexicon } from './readtypes.mjs';
import { interestOf } from './compose.mjs';

const bare = (v) => String(v).replace(/^"|"$/g, '').replace(/^\$/, '');
const norm = (s) => String(s).toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The k.genres genre a document type names (hyphens, underscores, spaces, and the genre's words), or null (LIB-5). */
export function genreOf(world, type) {
  const t = norm(type);
  const g = world.ofType('k.genres.genre').map((x) => bare(x.attrs.name[0])).find((n) => norm(n) === t);
  if (g) return g;
  for (const w of world.ofType('core.word')) if ((w.attrs.text || []).some((x) => norm(bare(x)) === t)) { const m = (w.attrs.means || []).map(bare).find((x) => world.ofType('k.genres.genre').some((y) => bare(y.attrs.name[0]) === x)); if (m) return m; }
  return null;
}

/**
 * The topics a world can compose about (LIB-5): names of facts of `types` (default: every type with names)
 * that at least `min` (2) other facts name (by `about` or a value), [{ topic, type, facts }] most named first.
 */
export function topicIndex(world, { types, min = 2 } = {}) {
  const names = new Map();
  for (const w of world.wires.values()) {
    if (w.type.startsWith('core.') || w.type.startsWith('std.') || w.type.startsWith('k.genres') || w.type.startsWith('k.interest') || w.type.startsWith('w.')) continue;
    if (types && !types.includes(w.type)) continue;
    for (const n of w.attrs.name || []) names.set(bare(n), { topic: bare(n), type: w.type, facts: 0 });
  }
  for (const w of world.wires.values()) {
    if (w.type.startsWith('core.')) continue;
    const seen = new Set();
    for (const [k, vs] of Object.entries(w.attrs)) if (k !== 'name' && !k.startsWith('core.')) for (const v of vs) { const b = bare(v); if (names.has(b) && !seen.has(b)) { seen.add(b); names.get(b).facts++; } }
  }
  return [...names.values()].filter((x) => x.facts >= min).sort((a, b) => b.facts - a.facts || a.topic.localeCompare(b.topic));
}

/** `count` topics drawn by interest (LIB-5): a seeded weighted draw over topicIndex, the weight the facts and their best interest. */
export function randomTopics(world, { seed = 1, count = 3, ...opts } = {}) {
  let x = seed >>> 0; const rnd = () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const idx = topicIndex(world, opts);
  const about = (n) => [...world.wires.values()].filter((w) => !w.type.startsWith('core.') && Object.entries(w.attrs).some(([k, vs]) => k !== 'name' && vs.some((v) => bare(v) === n)));
  const weighted = idx.map((t) => { const best = Math.max(0, ...about(t.topic).slice(0, 20).map((f) => interestOf(world, f, { topic: t.topic }).score)); return { t, k: Math.pow(rnd(), 1 / (t.facts * (1 + best))) }; });
  return weighted.sort((a, b) => b.k - a.k).slice(0, count).map((w) => w.t.topic);
}

/**
 * A typed world from a session's things (LIB-6): [{ id, label, kind, attrs: { key: value } }] become wires
 * (`<kind> name=<label> key=value`); `values` ({ key: [values] }) the values an attribute can take, as
 * `x.value key= value=` facts, so readByTypes and readRolesByTypes can type them.
 */
export function typedWorldOf(things, { values = {} } = {}) {
  const w = new World();
  const q = (v) => (/^[\w.-]+$/.test(String(v)) ? String(v) : JSON.stringify(String(v)));
  const lines = things.map((t) => `@${String(t.id).replace(/[^\w.-]/g, '_')} ${t.kind ?? 'thing'} name=${q(t.label ?? t.id)}${Object.entries(t.attrs ?? {}).map(([k, v]) => [].concat(v).map((x) => ` ${k}=${q(x)}`).join('')).join('')}`);
  for (const [k, vs] of Object.entries(values)) vs.forEach((v, i) => lines.push(`@x.value.${k}.${i} x.value key=${q(k)} value=${q(v)}`));
  w.tell(lines.join('\n'));
  return w;
}

/**
 * The free roles of a refused reading re-read by type (LIB-6): `roles` names what is missing ('thing', 'value',
 * 'attribute'); every content word of `text` must be placed (function words in `skip` ignored), a thing by its
 * label, an attribute by its key, a value among the values of the attribute (or of any). Returns { thing,
 * value, attribute } with the ids and words placed, or null when a word is left or a role stays empty.
 */
export function readRolesByTypes(world, text, roles, { skip = [] } = {}) {
  const lex = typedLexicon(world), S = new Set(skip.map((x) => x.toLowerCase()));
  const toks = (String(text).toLowerCase().match(/[\p{L}\p{N}_'-]+/gu) || []).filter((t) => !S.has(t));
  const valueFacts = world.ofType('x.value').map((f) => ({ key: bare(f.attrs.key[0]), value: bare(f.attrs.value[0]).toLowerCase() }));
  const out = {}, used = new Set();
  const find = (cat) => toks.findIndex((t, i) => !used.has(i) && (lex.get(t) || lex.get(t.replace(/s$/, '')) || []).some((s) => s.cat === cat));
  if (roles.includes('attribute')) { const i = find('attr'); if (i >= 0) { used.add(i); out.attribute = (lex.get(toks[i]) || lex.get(toks[i].replace(/s$/, ''))).find((s) => s.cat === 'attr').key; } }
  if (roles.includes('thing')) { const i = find('thing'); if (i >= 0) { used.add(i); out.thing = (lex.get(toks[i]) || lex.get(toks[i].replace(/s$/, ''))).find((s) => s.cat === 'thing').id; } }
  if (roles.includes('value')) {
    const i = toks.findIndex((t, j) => !used.has(j) && valueFacts.some((v) => v.value === t && (!out.attribute || v.key === out.attribute)));
    if (i >= 0) { used.add(i); out.value = toks[i]; if (!out.attribute && roles.includes('attribute')) out.attribute = valueFacts.find((v) => v.value === toks[i]).key; }
  }
  if (roles.some((r) => out[r] === undefined) || used.size !== toks.length) return null; // all or nothing
  return out;
}

/**
 * Every assignment of the content tokens to the typed slots of each pattern (LIB-7). `patterns`: [{ name,
 * slots: [{ name, type }], literals: [words], anchor?: [words] }]; `lexicons`: { type: Set(words) }. A pattern
 * reads the tokens when each token is a literal of it or fills one slot by type, every slot is filled, an anchor
 * (if any) is present, and exactly one assignment exists. Returns [{ pattern, assignment: { slot: word } }].
 */
export function assignBySlotTypes(patterns, tokens, lexicons) {
  const out = [];
  for (const p of patterns) { // bounded: the patterns
    const lit = new Set((p.literals || []).map((x) => x.toLowerCase()));
    if (p.anchor?.length && !tokens.some((t) => p.anchor.includes(t))) continue;
    const content = tokens.filter((t) => !lit.has(t));
    const found = [];
    const go = (k, left, asg) => { // bounded: the slots and the content tokens
      if (found.length > 1) return;
      if (k === p.slots.length) { if (!left.length) found.push({ ...asg }); return; }
      const s = p.slots[k];
      left.forEach((t, i) => { if (lexicons[s.type]?.has(t)) go(k + 1, left.filter((_, j) => j !== i), { ...asg, [s.name]: t }); });
    };
    go(0, content, {});
    if (found.length === 1) out.push({ pattern: p.name, assignment: found[0] });
  }
  return out;
}

/**
 * A host's reply judged against a cousin (LIB-8): every expected value appears in the reply text (a number also
 * as its word, `numberWords`), and a question changes nothing (`before` equals `after` when given).
 */
export function judgeReply(reply, expected, { numberWords = {}, before, after, question = true } = {}) {
  const text = ` ${String(reply ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const has = (v) => { const s = String(v).toLowerCase(); return text.includes(` ${s} `) || (numberWords[s] && text.includes(` ${numberWords[s]} `)); };
  if (![].concat(expected ?? []).every(has)) return false;
  if (question && before !== undefined && after !== undefined && JSON.stringify(before) !== JSON.stringify(after)) return false;
  return true;
}

/** Results [{ degree, dim, pass }] as a table { 'degree|dim': { pass, of } } (LIB-8). */
export function tabulate(results) {
  const t = {};
  for (const r of results) { const k = `${r.degree}|${r.dim ?? r.dims?.[0] ?? '-'}`; const row = (t[k] ||= { pass: 0, of: 0 }); row.of++; if (r.pass) row.pass++; }
  return t;
}

/** A table as text: one line per degree × dimension, with its share (LIB-8). */
export function tableText(table) {
  return Object.keys(table).sort().map((k) => { const [d, dim] = k.split('|'), r = table[k]; return `degree ${d}  ${dim.padEnd(10)} ${r.pass}/${r.of}  ${r.of ? Math.round((100 * r.pass) / r.of) : 0} %`; }).join('\n');
}
