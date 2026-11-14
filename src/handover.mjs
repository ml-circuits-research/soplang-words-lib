// General host code taken into the library (a host's handover LIB-5..8, written here from its description):
// the genre of a document type and the topics a world can compose about; a typed world from a session's things
// and roles re-read by type; every assignment of words to the typed slots of a pattern; judging a reply and
// tabulating related cases.

import { World } from './world.mjs';
import { typedLexicon } from './readtypes.mjs';
import { interestOf } from './compose.mjs';
import { seeded } from './random.mjs';
import { valueText } from './parser.mjs';

const bare = (v) => valueText(v).replace(/^\$/, '');
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
  const rnd = seeded(seed);
  const idx = topicIndex(world, opts);
  const about = (n) => [...world.wires.values()].filter((w) => !w.type.startsWith('core.') && Object.entries(w.attrs).some(([k, vs]) => k !== 'name' && vs.some((v) => bare(v) === n)));
  const weighted = idx.map((t) => { const best = Math.max(0, ...about(t.topic).slice(0, 20).map((f) => interestOf(world, f, { topic: t.topic }).score)); return { t, k: Math.pow(rnd(), 1 / (t.facts * (1 + best))) }; });
  return weighted.sort((a, b) => b.k - a.k).slice(0, count).map((w) => w.t.topic);
}

/**
 * A host's reply judged against a related case (LIB-8): every expected value appears in the reply text (a number also
 * as its word, `numberWords`), and a question changes nothing (`before` equals `after` when given).
 */
export function judgeReply(reply, expected, { numberWords = {}, before, after, question = true } = {}) {
  const text = ` ${String(reply ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const has = (v) => { const s = String(v).toLowerCase(); return text.includes(` ${s} `) || (numberWords[s] && text.includes(` ${numberWords[s]} `)); };
  if (![].concat(expected ?? []).every(has)) return false;
  if (question && before !== undefined && after !== undefined && JSON.stringify(before) !== JSON.stringify(after)) return false;
  return true;
}

/** Results [{ distance, axis, pass }] as a table { 'distance|axis': { pass, of } } (LIB-8). */
export function tabulate(results) {
  const t = {};
  for (const r of results) { const k = `${r.distance}|${r.axis ?? r.axes?.[0] ?? '-'}`; const row = (t[k] ||= { pass: 0, of: 0 }); row.of++; if (r.pass) row.pass++; }
  return t;
}

/** A table as text: one line per distance × axis, with its share (LIB-8). */
export function tableText(table) {
  return Object.keys(table).sort().map((k) => { const [d, axis] = k.split('|'), r = table[k]; return `distance ${d}  ${axis.padEnd(10)} ${r.pass}/${r.of}  ${r.of ? Math.round((100 * r.pass) / r.of) : 0} %`; }).join('\n');
}
