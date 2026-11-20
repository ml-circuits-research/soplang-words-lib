// span-reading: a span of said text read against a declared space. Language-free: every word list, form, unit, code
// layout and tolerance comes from the caller's declarations (a language world's determiners and inflections, a
// knowledge world's number words and colour codes, a policy's edit tolerance). Nothing here names a word.
//
//   stripPhrase(phrase, { leading, trailing, keep })          declared words removed at the edges of a phrase
//   splitPhrase(phrase, { separators, marks })                one phrase listing several things, split at its declared separators
//   readLexicalPhrase(phrase, { entries, leading, forms, avoid, tolerance })   the declared entry a phrase names
//   readNumberSpan(text, { number, joiners, unit, forms })    the one number a span spells, scaled by a declared unit
//   decodeCode(code, layout) / nearestName(code, names, layout)  a fixed-width channel code and its nearest declared name
//
// Every loop is bounded by the length of the span or of the declared lists; `tick(site)` (optional) is called once
// per step so a caller's budget can bound the work.
import { editDistance } from './interpret.mjs';

const words = (text) => String(text ?? '').trim().split(/\s+/).filter(Boolean);
const lowerSet = (xs) => new Set([...(xs ?? [])].map((x) => String(x).toLowerCase()));
const noTick = () => {};
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The phrase without one declared leading word (a determiner: "the tree") and one declared trailing word (a place
 * deictic: "tree there"), never emptied. `leading` is tried in its order and matches a word followed by one space
 * (case-insensitive), so the rest keeps its exact text; the trailing word is the last whitespace-separated word.
 * Returns { core, leading, trailing } with the removed words (as declared) or null.
 */
export function stripPhrase(phrase, { leading = [], trailing = [] } = {}) {
  const text = typeof phrase === 'string' ? phrase : '';
  const lower = text.toLowerCase();
  const lead = [...leading].find((d) => lower.startsWith(String(d).toLowerCase() + ' ')) ?? null;
  let core = lead === null ? text : text.slice(String(lead).length + 1);
  let trail = null;
  const ends = lowerSet(trailing), parts = core.split(/\s+/);
  if (parts.length > 1 && ends.has(parts.at(-1).toLowerCase())) { trail = parts.at(-1); core = parts.slice(0, -1).join(' '); }
  return { core, leading: lead, trailing: trail };
}

/**
 * One phrase that lists several things ("Start and Bake", "the tree, the plane"): split at the declared separator
 * words (followed by whitespace) and marks; the parts trimmed, empty parts dropped. A phrase with no separator is
 * one part.
 */
export function splitPhrase(phrase, { separators = [], marks = [] } = {}) {
  const text = typeof phrase === 'string' ? phrase : '';
  const seps = [...separators].map((w) => String(w).trim()).filter(Boolean);
  const alternatives = [];
  if (seps.length) alternatives.push('\\s*(?:' + seps.map(escape).join('|') + ')\\s+');
  for (const m of marks) if (String(m)) alternatives.push('\\s*' + escape(String(m)) + '\\s*');
  if (!alternatives.length) return text.trim() ? [text.trim()] : [];
  return text.split(new RegExp(alternatives.join('|'), 'i')).map((x) => x.trim()).filter(Boolean);
}

/**
 * The declared entry a phrase names. `entries`: [[text, meaning]] (lexical entries: a kind's lemma and its canonical
 * meaning). The phrase is read, in order:
 *   - after its `leading` words (determiners; at least one word is kept, a lone leading word names nothing),
 *   - as the phrase of each word's normal form (`forms(word)` returns [word, ...normal forms], e.g. the singular),
 *   - as the first word (as said, then its forms) that is an entry not meaning `avoid` (a modifier before the
 *     family's own class word), then as the first word that is any entry,
 *   - for one word, within the declared `tolerance` ({ minLength, doubled, swapped, steps: [{ above, edits }] }):
 *     a letter typed twice, two neighbouring letters swapped (when all such entries mean one thing), else the entries
 *     within the edit distance of the longest step `above` the word's length (adjacent transpositions count one),
 *     when the word has at least `minLength` letters and they all mean one thing.
 * Returns { text, meaning, via } (`text` the entry's text as declared) or null.
 */
export function readLexicalPhrase(phrase, { entries = [], leading = [], forms = (w) => [w], avoid, tolerance = null, tick = noTick } = {}) {
  const table = new Map();
  for (const [text, meaning] of entries) { const key = String(text).toLowerCase(); if (!table.has(key)) table.set(key, { text, meaning }); }
  const found = (key, via) => ({ text: table.get(key).text, meaning: table.get(key).meaning, via });
  const dets = lowerSet(leading);
  const ws = words(String(phrase ?? '').toLowerCase());
  while (ws.length > 1 && dets.has(ws[0])) { tick('lexical.leading'); ws.shift(); } // bounded: the words of the phrase
  if (!ws.length || (ws.length === 1 && dets.has(ws[0]))) return null;
  const formed = ws.map((w) => { const f = forms(w); return Array.isArray(f) && f.length ? f.map(String) : [w]; });
  const normal = formed.map((f) => f.at(-1)).join(' ');
  if (table.has(normal)) return found(normal, 'phrase');
  for (const f of formed) { tick('lexical.word'); const hit = f.find((x) => table.has(x) && table.get(x).meaning !== avoid); if (hit) return found(hit, 'word'); }
  for (const f of formed) { tick('lexical.word'); const hit = f.find((x) => table.has(x)); if (hit) return found(hit, 'word'); }
  if (ws.length !== 1 || !tolerance) return null;
  const w = ws[0];
  if (tolerance.doubled) for (let i = 1; i < w.length; i++) {
    tick('lexical.doubled');
    if (w[i] === w[i - 1]) { const once = w.slice(0, i) + w.slice(i + 1); if (table.has(once)) return found(once, 'doubled'); }
  }
  if (tolerance.swapped) {
    const swaps = [];
    for (let i = 1; i < w.length; i++) { tick('lexical.swapped'); const t = w.slice(0, i - 1) + w[i] + w[i - 1] + w.slice(i + 1); if (t !== w && table.has(t)) swaps.push(t); }
    if (swaps.length && new Set(swaps.map((t) => table.get(t).meaning)).size === 1) return found(swaps[0], 'swapped');
  }
  if (w.length < (tolerance.minLength ?? Infinity)) return null;
  const step = [...(tolerance.steps ?? [])].filter((s) => w.length > (s.above ?? 0)).sort((a, b) => (b.above ?? 0) - (a.above ?? 0))[0];
  const max = step?.edits ?? 0;
  if (!(max > 0)) return null;
  const near = [];
  for (const key of table.keys()) { tick('lexical.edit'); if (!key.includes(' ') && Math.abs(key.length - w.length) <= max && editDistance(w, key, max) <= max) near.push(key); }
  return near.length && new Set(near.map((k) => table.get(k).meaning)).size === 1 ? found(near[0], 'edit') : null;
}

// The place of a declared number word in a run (the decimal place-value grammar): its value's class.
const classOf = (v) => (v < 10 ? 'unit' : v < 20 ? 'teen' : v < 100 ? (v % 10 ? 'tensunit' : 'tens') : v === 100 ? 'hundred' : 'scale');
function numberRun(ws, i, number, joiners, tick) {
  let last = 'start', used = 0;
  for (let j = i; j < ws.length; j++) {
    tick('number.run');
    const w = ws[j];
    if (joiners.has(w) && (last === 'hundred' || last === 'scale') && j + 1 < ws.length) {
      const v = number(ws[j + 1]);
      if (v !== null && v !== undefined && v !== 100 && v < 1000) continue;
    }
    const v = number(w);
    if (v === null || v === undefined || !Number.isInteger(v)) break;
    const cls = classOf(v), fresh = last === 'start' || last === 'hundred' || last === 'scale';
    let next = null;
    if (cls === 'unit') { if (last === 'tens' && v > 0) next = 'tensunit'; else if (fresh) next = 'unit'; }
    else if (cls === 'teen' || cls === 'tens' || cls === 'tensunit') { if (fresh) next = cls; }
    else if (cls === 'hundred') { if (last !== 'hundred' && last !== 'scale') next = 'hundred'; }
    else if (last !== 'scale') next = 'scale';
    if (!next) break;
    last = next; used = j - i + 1;
  }
  if (!used) return null;
  let total = 0, cur = 0;
  for (const w of ws.slice(i, i + used)) {
    if (joiners.has(w)) continue;
    const v = number(w), cls = classOf(v);
    if (cls === 'hundred') cur = (cur || 1) * 100;
    else if (cls === 'scale') { total += (cur || 1) * v; cur = 0; }
    else cur += v;
  }
  return { value: total + cur, length: used };
}

/**
 * The one number a value span spells ("size 45" -> 45, "two hundred sixty" -> 260, "2 cm" -> 2 x the declared
 * factor of cm): digits, or a run of declared number words (`number(word)`: its integer value or null; `joiners`:
 * words allowed inside a run after a hundred or a scale word). The other words are no number; `unit(word)` names a
 * declared unit: null for none, { factor } for a unit with a declared conversion, true for a unit without one (the
 * span is then not read). At most one converted unit; exactly one number. `forms(word)` gives the forms a unit
 * word is also tried as (its inflections). Returns { value, factor? } or null.
 */
export function readNumberSpan(text, { number = () => null, joiners = [], unit = () => null, forms = (w) => [w], tick = noTick } = {}) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const join = lowerSet(joiners);
  const ws = text.toLowerCase().replace(/[,;:!?]+/g, ' ').split(/\s+/).filter(Boolean), found = [];
  let factor = 1;
  for (let i = 0; i < ws.length; i++) {
    tick('number.word');
    const w = ws[i];
    if (/^[-+]?\d+(\.\d+)?$/.test(w)) { found.push(Number(w)); continue; }
    const run = numberRun(ws, i, number, join, tick);
    if (run) { found.push(run.value); i += run.length - 1; continue; }
    if (/\d/.test(w)) return null;
    const u = unitOf(w, unit, forms);
    if (u === true || (u && factor !== 1)) return null;
    if (u && typeof u === 'object' && Number.isFinite(u.factor)) factor = u.factor;
  }
  return found.length === 1 && Number.isFinite(found[0]) ? { value: +(found[0] * factor).toFixed(6), ...(factor !== 1 ? { factor } : {}) } : null;
}
function unitOf(word, unit, forms) {
  const tried = [word, ...(forms(word) ?? [])];
  let plain = null;
  for (const f of tried) { const u = unit(f); if (u && typeof u === 'object') return u; if (u === true) plain = true; }
  return plain;
}

/**
 * A unit word's conversion: `units` [{ words, factor }] declared for the value's own unit (factor 1) and its
 * conversions; `known(word)` says whether the word is a declared unit at all (true without a conversion).
 */
export function unitConversion(word, units = [], { forms = (w) => [w], known = () => false } = {}) {
  const tried = [word, ...(forms(word) ?? [])];
  for (const f of tried) { const u = units.find((x) => (x.words ?? []).includes(f) && Number.isFinite(x.factor)); if (u) return { factor: u.factor }; }
  return tried.some((f) => known(f)) ? true : null;
}

/**
 * A fixed-width channel code ("#ffa500" with layout { prefix: '#', channels: 3, width: 2, radix: 16 }) as its channel
 * values, or null when the code does not have that layout.
 */
export function decodeCode(code, { prefix = '', channels = 1, width = 1, radix = 10 } = {}) {
  let text = String(code ?? '').trim();
  if (prefix && text.startsWith(prefix)) text = text.slice(prefix.length);
  if (text.length !== channels * width) return null;
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, radix);
  const out = [];
  for (let i = 0; i < channels; i++) {
    const part = text.slice(i * width, (i + 1) * width).toLowerCase();
    if (![...part].every((c) => digits.includes(c))) return null;
    out.push(parseInt(part, radix));
  }
  return out;
}

/**
 * The declared name nearest a code: `names` [{ name, code }] (declared codes in the same layout), by squared distance
 * of the channel values; the first of equally near names (an exact code is distance 0). Null when the code does not
 * have the layout or no name has a code.
 */
export function nearestName(code, names = [], layout = {}) {
  const want = decodeCode(code, layout);
  if (!want) return null;
  let best = null;
  for (const n of names) {
    const got = decodeCode(n?.code, layout);
    if (!got) continue;
    const d = got.reduce((sum, v, i) => sum + (v - want[i]) ** 2, 0);
    if (!best || d < best.d) best = { name: n.name, d };
  }
  return best?.name ?? null;
}
