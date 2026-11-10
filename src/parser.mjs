// SOP Lang reader and writer.
//
//   @id type key=value key=value ...     a wire (fact, template or schema wire)
//   ?id type key=?x key=$other ...       a pattern wire (to be matched)
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

export function parse(text) {
  const wires = [];
  const toks = tokenize(text);
  let cur = null;
  for (let i = 0; i < toks.length; i++) {
    const { t, line } = toks[i];
    if (HEAD.test(t)) {
      const ty = toks[++i];
      if (!ty || !NAME.test(ty.t)) throw new SopError(`line ${line}: wire ${t} has no type`);
      cur = { id: t.slice(1), type: ty.t, attrs: {}, pattern: t[0] === '?' };
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
  const head = `${wire.pattern ? '?' : '@'}${wire.id} ${wire.type}`;
  const pairs = [];
  for (const k of Object.keys(wire.attrs)) for (const v of wire.attrs[k]) pairs.push(`${k}=${v}`);
  if (!pairs.length) return head;
  return multiline ? `${head}\n    ${pairs.join('\n    ')}` : `${head} ${pairs.join(' ')}`;
}

export function cloneWire(w) {
  const attrs = {};
  for (const k of Object.keys(w.attrs)) attrs[k] = [...w.attrs[k]];
  return { id: w.id, type: w.type, attrs, pattern: !!w.pattern };
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
