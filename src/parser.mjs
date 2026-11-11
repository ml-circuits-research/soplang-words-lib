// SOP Lang reader and writer.
//
//   @id type key=value key=value ...     a wire
//
// The three signs each mean one thing: `@` declares a wire, `$` refers to one, `?` is a
// variable (in value position only). A wire is a pattern or a template because a rule,
// deny, relation, action or query names it, not because of how it is written.
// (`?id type ...` as a declaration is the old way to write a pattern; it is still read,
// marked `legacy`, and will be removed.)
//
// Values are kept as their source token:
//   atom      water, 10, 9.81, phys.mech.body
//   string    "free text"            (quotes are kept; use str() to unquote)
//   reference $id
//   variable  ?x
// A wire may span any number of lines. `#` starts a comment. docs/language.md is the
// definition; this file implements it.

/**
 * A text that is not SOP Lang. `line` and `column` count from 1, `offset` from 0; they
 * are those of the first error. `errors` lists every error found in the text, each as
 * { message, offset, line, column }. Nothing is repaired silently.
 */
export class SopError extends Error {
  constructor(message, at = {}, errors) {
    super(at.line ? `line ${at.line}, column ${at.column}: ${message}` : message);
    this.name = 'SopError';
    this.line = at.line;
    this.column = at.column;
    this.offset = at.offset;
    this.errors = errors || [{ message, offset: at.offset, line: at.line, column: at.column }];
  }
}

// An identifier: segments of [A-Za-z0-9_-] joined by single dots; the first segment starts
// with a letter or "_", a later one with a letter, a digit or "_" (q.2). ASCII only.
const IDENT = /^[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_][A-Za-z0-9_-]*)*$/;
const QUOTED = /["\\\n]/g;
const ESCAPES = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

/**
 * The text of a string token (with its quotes), or null when an escape is not one of
 * JSON's. With `lenient`, an unknown escape stands for the character after the backslash.
 */
function decode(token, lenient) {
  if (token.indexOf('\\') < 0) return token.slice(1, -1); // no escapes: the text as it is
  if (!lenient) {
    // the escapes are JSON's: let JSON read them (a line end or a tab written as it is is allowed here, not in JSON)
    try { return JSON.parse(token.replace(/[\u0000-\u001f]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`)); } catch { return null; }
  }
  let out = '';
  for (let i = 1; i < token.length - 1; i++) { // bounded: the token
    const c = token[i];
    if (c !== '\\') { out += c; continue; }
    const e = token[++i];
    if (e === 'u') {
      const hex = token.slice(i + 1, i + 5);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) { if (!lenient) return null; out += 'u'; continue; }
      out += String.fromCharCode(parseInt(hex, 16));
      i += 4;
    } else if (Object.hasOwn(ESCAPES, e)) out += ESCAPES[e];
    else if (lenient && e !== undefined && i < token.length - 1) out += e;
    else return null;
  }
  return out;
}

/** Split a text into tokens; with `errors`, problems are collected there instead of thrown. */
function scan(text, lenient, errors) {
  const out = [];
  const n = text.length;
  let i = 0, line = 1, lineStart = 0;
  while (i < n) { // bounded: every pass consumes input
    const c = text[i];
    if (c === '\n') { line++; i++; lineStart = i; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; } // bounded: to the end of the line
    const start = i, at = { line, column: i - lineStart + 1, offset: start };
    let inQ = false, closed = -1, eq = -1, problem = null;
    while (i < n) { // bounded: every pass consumes input
      const d = text[i];
      if (inQ) {
        // jump to the next quote, backslash or line end: long strings cost one search, not a loop per character
        QUOTED.lastIndex = i;
        const m = QUOTED.exec(text);
        if (!m) { i = n; continue; }
        i = m.index;
        const e = text[i];
        if (e === '\\') { i += 2; continue; }
        if (e === '"') { inQ = false; closed = i; }
        if (e === '\n') { line++; lineStart = i + 1; }
        i++;
        continue;
      }
      if (d === ' ' || d === '\t' || d === '\r' || d === '\n') break;
      if (d === '"') {
        // a string is a whole value: it starts right after the first "=" (or stands alone)
        if (closed >= 0) problem ||= 'text after the closing quote of a string';
        else if (i !== start && i !== eq + 1) problem ||= 'a quote inside an atom (a string value starts right after "=")';
        inQ = true; i++; continue;
      }
      if (closed >= 0) problem ||= 'text after the closing quote of a string';
      if (d === '\\') problem ||= 'a backslash outside a string';
      if (d === '=' && eq < 0) eq = i;
      i++;
    }
    if (inQ) {
      const e = { message: problem && problem.startsWith('a quote') ? problem : 'unterminated string', ...at };
      if (!errors) throw new SopError(e.message, at);
      errors.push(e);
    } else if (problem && !lenient) {
      if (!errors) throw new SopError(problem, at);
      errors.push({ message: problem, ...at });
    }
    out.push({ t: text.slice(start, Math.min(i, n)), ...at });
  }
  return out;
}

export function tokenize(text, { lenient = false } = {}) {
  return scan(text, lenient, null);
}

/**
 * Read wires. Every error in the text is found and reported in one SopError.
 *   anonymous   a declaration may leave out its `@id` (a query that needs no name for
 *               what it matches): `item name=?n` is read as a wire with a made-up id
 *   lenient     accept what earlier versions accepted: the same id twice in one text,
 *               an escape that JSON does not have, a quote or a backslash inside an atom
 * A string value is kept in its canonical spelling (see quote()), so one text has one
 * spelling whatever escapes the source used.
 */
export function parse(text, { anonymous = false, lenient = false } = {}) {
  const wires = [];
  const errors = [];
  const toks = scan(text, lenient, errors);
  const flagged = new Set(errors.map((e) => e.offset));
  const seen = new Set();
  const fail = (message, at) => { if (!flagged.has(at.offset)) { flagged.add(at.offset); errors.push({ message, offset: at.offset, line: at.line, column: at.column }); } };
  let cur = null;
  for (let i = 0; i < toks.length; i++) {
    const { t } = toks[i];
    const at = toks[i];
    if (t[0] === '@' || (t[0] === '?' && !t.includes('=') && toks[i + 1] && IDENT.test(toks[i + 1].t) && IDENT.test(t.slice(1)))) {
      const id = t.slice(1);
      const ty = toks[i + 1];
      if (!id) fail('a declaration without an id', at);
      else if (!IDENT.test(id)) fail(`invalid identifier "${id}" as the id of a wire`, at);
      else if (seen.has(id) && !lenient) fail(`the id "${id}" is declared twice in this text`, at);
      seen.add(id);
      if (!ty || ty.t[0] === '@' || ty.t.includes('=')) { fail(`wire ${t} has no type`, at); cur = { id, type: '', attrs: {}, pattern: false }; continue; }
      i++;
      if (!IDENT.test(ty.t)) fail(`invalid identifier "${ty.t}" as the type of wire ${t}`, ty);
      cur = { id, type: ty.t, attrs: {}, pattern: t[0] === '?' };
      if (t[0] === '?') cur.legacy = true;
      wires.push(cur);
      continue;
    }
    if (anonymous && IDENT.test(t)) { // a type name where a declaration may start: a wire without an id
      cur = { id: `_${wires.length + 1}`, type: t, attrs: {}, pattern: false, anonymous: true };
      wires.push(cur);
      continue;
    }
    const eq = t.indexOf('=');
    if (!cur) { fail(`text before the first declaration: "${t}"`, at); continue; }
    if (eq <= 0) { fail(`expected key=value, got "${t}"`, at); continue; }
    const key = t.slice(0, eq);
    let value = t.slice(eq + 1);
    if (!IDENT.test(key)) { fail(`invalid identifier "${key}" as a key`, at); continue; }
    if (!value) { fail(`the key "${key}" has an empty value`, at); continue; }
    if (value[0] === '"') {
      if (flagged.has(at.offset)) continue; // unterminated, or followed by text: already reported
      const textOf = decode(value, lenient);
      if (textOf === null) { fail(`a bad escape in the string of "${key}" (the escapes are those of JSON)`, at); continue; }
      value = JSON.stringify(textOf);
    } else if (value[0] === '$') {
      if (!IDENT.test(value.slice(value[1] === '?' ? 2 : 1))) { fail(`invalid identifier in the reference ${value}`, at); continue; }
    } else if (value[0] === '?') {
      if (!IDENT.test(value.slice(1))) { fail(`invalid identifier in the variable ${value}`, at); continue; }
    }
    (cur.attrs[key] ||= []).push(value);
  }
  if (errors.length) {
    errors.sort((a, b) => a.offset - b.offset);
    throw new SopError(errors[0].message, errors[0], errors);
  }
  return wires;
}

/**
 * Write a wire. `multiline` puts each entry on its own line. `canonical` is the form for
 * hashing and stable diffs: entries on their own lines (4 spaces), sorted by key (by
 * code unit), the values of a repeated key in their order, strings in their canonical
 * spelling.
 */
export function format(wire, { multiline = false, canonical = false } = {}) {
  const head = `@${wire.id} ${wire.type}`;
  const pairs = [];
  const keys = Object.keys(wire.attrs);
  if (canonical) keys.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const k of keys) for (const v of wire.attrs[k]) pairs.push(`${k}=${canonical && v[0] === '"' ? quote(str(v)) : v}`);
  if (!pairs.length) return head;
  return multiline || canonical ? `${head}\n    ${pairs.join('\n    ')}` : `${head} ${pairs.join(' ')}`;
}

/**
 * Write wires as a text: in the order given, separated by a line end, with a line end
 * at the end. With `canonical`, each wire in its canonical form: the same wires give
 * the same bytes.
 */
export function serialize(wires, { canonical = false, multiline = false } = {}) {
  return wires.map((w) => format(w, { canonical, multiline }) + '\n').join('');
}

/** A value token as data: { kind: 'atom' | 'string' | 'ref' | 'var', v }. */
export function readValue(token) {
  const t = String(token);
  if (t[0] === '"') return { kind: 'string', v: str(t) };
  if (t[0] === '$') return { kind: 'ref', v: t.slice(1) };
  if (t[0] === '?') return { kind: 'var', v: t.slice(1) };
  return { kind: 'atom', v: t };
}

/** The token of a value given as data; the inverse of readValue. */
export function writeValue({ kind, v }) {
  if (kind === 'string') return quote(v);
  if (kind === 'ref') return `$${v}`;
  if (kind === 'var') return `?${v}`;
  if (kind === 'atom') return String(v);
  throw new Error(`sopworld: unknown kind of value "${kind}"`);
}

export function cloneWire(w) {
  const attrs = {};
  for (const k of Object.keys(w.attrs)) attrs[k] = [...w.attrs[k]];
  const out = { id: w.id, type: w.type, attrs, pattern: !!w.pattern };
  if (w.legacy) out.legacy = true;
  if (w.anonymous) out.anonymous = true;
  return out;
}

/** The text of a string value (its escapes decoded); any other value is returned unchanged. */
export function str(v) {
  if (typeof v !== 'string' || v[0] !== '"') return v;
  return decode(v, true) ?? v.slice(1, -1);
}

/**
 * Free text as a string value, in the canonical spelling: the escapes of JSON, used only
 * where needed (`"`, `\`, and control characters; everything else as it is).
 */
export function quote(s) {
  return JSON.stringify(String(s));
}
