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
// A wire may span any number of lines. `#` starts a comment.

export class SopError extends Error {}

const HEAD = /^[@?][A-Za-z_][\w.\-]*$/;
const NAME = /^[A-Za-z_][\w.\-]*$/;

export function tokenize(text) {
  const out = [];
  const n = text.length;
  let i = 0, line = 1;
  while (i < n) { // bounded: every pass consumes input
    const c = text[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; } // bounded: to the end of the line
    const start = i, startLine = line;
    let inQ = false;
    while (i < n) { // bounded: every pass consumes input
      const d = text[i];
      if (inQ) {
        if (d === '\\') { i += 2; continue; }
        if (d === '"') inQ = false;
        if (d === '\n') line++;
        i++;
        continue;
      }
      if (d === '"') { inQ = true; i++; continue; }
      if (d === ' ' || d === '\t' || d === '\r' || d === '\n') break;
      i++;
    }
    if (inQ) throw new SopError(`line ${startLine}: unterminated string`);
    out.push({ t: text.slice(start, i), line: startLine });
  }
  return out;
}

/**
 * Read wires. With `anonymous`, a declaration may leave out its `@id` (a query that
 * needs no name for what it matches): `item name=?n` is read as a wire with a made-up id.
 */
export function parse(text, { anonymous = false } = {}) {
  const wires = [];
  const toks = tokenize(text);
  let cur = null;
  for (let i = 0; i < toks.length; i++) {
    const { t, line } = toks[i];
    if (HEAD.test(t)) {
      const ty = toks[++i];
      if (!ty || !NAME.test(ty.t)) throw new SopError(`line ${line}: wire ${t} has no type`);
      cur = { id: t.slice(1), type: ty.t, attrs: {}, pattern: t[0] === '?' };
      if (t[0] === '?') cur.legacy = true;
      wires.push(cur);
      continue;
    }
    if (anonymous && NAME.test(t)) { // a type name where a declaration may start: a wire without an id
      cur = { id: `_${wires.length + 1}`, type: t, attrs: {}, pattern: false, anonymous: true };
      wires.push(cur);
      continue;
    }
    const eq = t.indexOf('=');
    if (!cur || eq <= 0 || eq === t.length - 1 || !NAME.test(t.slice(0, eq))) {
      throw new SopError(`line ${line}: expected key=value, got "${t}"`);
    }
    const key = t.slice(0, eq);
    (cur.attrs[key] ||= []).push(t.slice(eq + 1));
  }
  return wires;
}

export function format(wire, { multiline = false } = {}) {
  const head = `@${wire.id} ${wire.type}`;
  const pairs = [];
  for (const k of Object.keys(wire.attrs)) for (const v of wire.attrs[k]) pairs.push(`${k}=${v}`);
  if (!pairs.length) return head;
  return multiline ? `${head}\n    ${pairs.join('\n    ')}` : `${head} ${pairs.join(' ')}`;
}

export function cloneWire(w) {
  const attrs = {};
  for (const k of Object.keys(w.attrs)) attrs[k] = [...w.attrs[k]];
  const out = { id: w.id, type: w.type, attrs, pattern: !!w.pattern };
  if (w.legacy) out.legacy = true;
  if (w.anonymous) out.anonymous = true;
  return out;
}

/** Unquote a string value; atoms are returned unchanged. */
export function str(v) {
  if (typeof v !== 'string' || v[0] !== '"') return v;
  return v.slice(1, -1).replace(/\\(.)/g, '$1');
}

/** Quote free text as a SOP Lang string value. */
export function quote(s) {
  return `"${String(s).replace(/(["\\])/g, '\\$1')}"`;
}
