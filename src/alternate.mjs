import { readByTypes } from './readtypes.mjs';
// Alternations as general rules, once (abstraction round item 2, Q54): passive, wrappers ("could
// you", "I want you to", "please"), wh-fronting, question vs command, dative shift. A language world
// writes each frame once in canonical form; these rules bring a variant back to it at read time.
// The rules are facts of the language world (`<type> name= from= to= mode=`), applied in order to a
// fixpoint (bounded). A pattern is words, `[a|b]` alternatives and `{x}` spans (one word or more,
// the shortest first); `{x:base}` in `to` gives a word's base form (the world's lemma, else the word
// without -ed / -s).

const bare = (v) => String(v).replace(/^"|"$/g, '');

/** The alternation rules a world holds: [{ name, from, to, mode? }]. */
export function alternationsOf(world, type = 'w.lang.en.alternation') {
  return world.ofType(type).map((w, i) => ({ name: bare(w.attrs.name?.[0] ?? w.id), n: Number(bare(w.attrs.n?.[0] ?? i + 1)), ...(w.attrs.family ? { family: bare(w.attrs.family[0]) } : {}), from: bare(w.attrs.from[0]), to: bare(w.attrs.to[0]), ...(w.attrs.mode ? { mode: bare(w.attrs.mode[0]) } : {}) }))
    .sort((a, b) => a.n - b.n); // tried in the order the language world tells (n), not the order the facts were loaded (Q58)
}

/** The word classes a world holds for patterns (`{x:wh}`): Map(class -> Set(words)), from `<type> name= word=...`. */
export function wordClassesOf(world, type = 'w.lang.en.word_class') {
  return new Map(world.ofType(type).map((w) => [bare(w.attrs.name[0]), new Set((w.attrs.word || []).map((x) => bare(x).toLowerCase()))]));
}

function match(pat, toks, i, env, k, classes) { // bounded: the pattern and the tokens
  if (k === pat.length) return i === toks.length ? env : null;
  const p = pat[k];
  const cls = /^\{([a-z_0-9]+):([a-z_]+)\}$/.exec(p); // a word of a class (Q58: {x:wh} for one fact per alternative)
  if (cls && cls[2] !== 'base') return i < toks.length && classes?.get(cls[2])?.has(toks[i]) ? match(pat, toks, i + 1, { ...env, [cls[1]]: [toks[i]] }, k + 1, classes) : null;
  const span = /^\{([a-z_0-9]+)\}$/.exec(p);
  if (span) {
    for (let j = i + 1; j <= toks.length; j++) { const r = match(pat, toks, j, { ...env, [span[1]]: toks.slice(i, j) }, k + 1, classes); if (r) return r; }
    return null;
  }
  const alts = /^\[(.*)\]$/.exec(p) ? p.slice(1, -1).split('|') : [p];
  return i < toks.length && alts.includes(toks[i]) ? match(pat, toks, i + 1, env, k + 1, classes) : null;
}

/**
 * The canonical form of `text` by the alternation rules: { text, applied: [names], mode? }.
 * Options: `rules` (default: the world's), `type`, `lemma(word) -> [forms]`, `max` (applications).
 */
export function normalise(world, text, { rules, type, lemma, max = 6, classes } = {}) {
  const R = rules ?? alternationsOf(world, type);
  const C = classes ?? wordClassesOf(world, type ? `${type.split('.').slice(0, -1).join('.')}.word_class` : undefined);
  const base = (w) => (lemma ?? world.lemma)?.(w)?.[0] ?? w.replace(/ied$/, 'y').replace(/(?<=[^aeiou][aeiou]?[^aeiou])ed$/, '').replace(/ed$/, 'e').replace(/s$/, '');
  let toks = String(text).toLowerCase().replace(/[?!.]+\s*$/, '').match(/[\p{L}\p{N}_'-]+/gu) || [];
  const applied = [];
  let mode;
  for (let n = 0; n < max; n++) { // bounded: max applications
    let hit = null;
    for (const r of R) { const env = match(r.from.split(/\s+/), toks, 0, {}, 0, C); if (env) { hit = { r, env }; break; } }
    if (!hit) break;
    const out = [];
    for (const t of hit.r.to.split(/\s+/)) {
      const m = /^\{([a-z_0-9]+)(?::([a-z_]+))?\}$/.exec(t);
      if (m) out.push(...(m[2] === 'base' ? [base(hit.env[m[1]][0]), ...hit.env[m[1]].slice(1)] : hit.env[m[1]] ?? [])); else out.push(t);
    }
    if (out.join(' ') === toks.join(' ')) break;
    toks = out; applied.push(hit.r.name); if (hit.r.mode) mode = hit.r.mode; // the innermost rule's mode wins: "can you tell me where …" is a question (Q58)
  }
  return { text: toks.join(' '), applied, ...(mode ? { mode } : {}) };
}

/**
 * The inverse of the form operators at read time (reviewer 00:40), as one pipeline step: a text cut into its
 * clauses at the `splitters` (an extra clause becomes a clause of its own), the `fillers` dropped at the start
 * and end of each, then each brought to its canonical form by the alternation rules. Substitutions are read
 * later by word senses (readByTypes `near`). Returns { clauses: [{ text, applied, mode? }], dropped }.
 * `fillers` and `splitters` are data: the host's, or learnt (`fillersFrom` of learnFormEdits).
 */
export function canonicalise(world, text, { fillers = [], splitters = [], ...opts } = {}) {
  const F = new Set(fillers.map((x) => x.toLowerCase()));
  let toks = String(text).toLowerCase().replace(/[?!.,]+/g, ' ').match(/[\p{L}\p{N}_'-]+/gu) || [];
  const S = splitters.map((x) => x.toLowerCase().split(/\s+/)).sort((a, b) => b.length - a.length);
  const parts = [], dropped = [];
  let cur = [];
  for (let i = 0; i < toks.length; i++) { // bounded: the tokens
    const sp = S.find((s) => s.every((w, k) => toks[i + k] === w));
    if (sp && cur.length) { parts.push(cur); cur = []; i += sp.length - 1; continue; }
    cur.push(toks[i]);
  }
  if (cur.length) parts.push(cur);
  const clauses = parts.map((p) => {
    while (p.length && F.has(p[0])) dropped.push(p.shift()); // bounded: the clause
    while (p.length && F.has(p[p.length - 1])) dropped.push(p.pop()); // bounded: the clause
    return normalise(world, p.join(' '), opts);
  }).filter((c) => c.text);
  return { clauses, dropped };
}

/** The filler words of learnt edits (learnFormEdits): the deleted words of its `filler` family. */
export function fillersFrom(edits) {
  return [...new Set((edits.operators || []).filter((o) => o.family === 'filler').map((o) => /"(.*)" ->/.exec(o.edit)?.[1]).filter(Boolean).flatMap((x) => x.split(' ')))];
}

/**
 * The reading pipeline with the inverse operators in front (reviewer 00:40): canonicalise, then read each
 * clause by types. Returns [{ text, mode?, applied, frame, unread, near? }], one per clause.
 * Options: { fillers, splitters, rules, classes } for canonicalise, `read` for readByTypes.
 */
export function readCanonical(world, text, { read = {}, ...opts } = {}) {
  const { clauses } = canonicalise(world, text, opts);
  return clauses.map((c) => { const r = readByTypes(world, c.text, read); return { text: c.text, applied: c.applied, ...(c.mode ? { mode: c.mode } : {}), frame: r.best, unread: r.unread, ...(r.near ? { near: r.near } : {}) }; });
}
