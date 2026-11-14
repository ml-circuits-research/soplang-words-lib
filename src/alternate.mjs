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
  return world.ofType(type).map((w) => ({ name: bare(w.attrs.name?.[0] ?? w.id), from: bare(w.attrs.from[0]), to: bare(w.attrs.to[0]), ...(w.attrs.mode ? { mode: bare(w.attrs.mode[0]) } : {}) }));
}

function match(pat, toks, i, env, k) { // bounded: the pattern and the tokens
  if (k === pat.length) return i === toks.length ? env : null;
  const p = pat[k];
  const span = /^\{([a-z_0-9]+)\}$/.exec(p);
  if (span) {
    for (let j = i + 1; j <= toks.length; j++) { const r = match(pat, toks, j, { ...env, [span[1]]: toks.slice(i, j) }, k + 1); if (r) return r; }
    return null;
  }
  const alts = /^\[(.*)\]$/.exec(p) ? p.slice(1, -1).split('|') : [p];
  return i < toks.length && alts.includes(toks[i]) ? match(pat, toks, i + 1, env, k + 1) : null;
}

/**
 * The canonical form of `text` by the alternation rules: { text, applied: [names], mode? }.
 * Options: `rules` (default: the world's), `type`, `lemma(word) -> [forms]`, `max` (applications).
 */
export function normalise(world, text, { rules, type, lemma, max = 6 } = {}) {
  const R = rules ?? alternationsOf(world, type);
  const base = (w) => (lemma ?? world.lemma)?.(w)?.[0] ?? w.replace(/ied$/, 'y').replace(/(?<=[^aeiou][aeiou]?[^aeiou])ed$/, '').replace(/ed$/, 'e').replace(/s$/, '');
  let toks = String(text).toLowerCase().replace(/[?!.]+\s*$/, '').match(/[\p{L}\p{N}_'-]+/gu) || [];
  const applied = [];
  let mode;
  for (let n = 0; n < max; n++) { // bounded: max applications
    let hit = null;
    for (const r of R) { const env = match(r.from.split(/\s+/), toks, 0, {}, 0); if (env) { hit = { r, env }; break; } }
    if (!hit) break;
    const out = [];
    for (const t of hit.r.to.split(/\s+/)) {
      const m = /^\{([a-z_0-9]+)(?::(base))?\}$/.exec(t);
      if (m) out.push(...(m[2] ? [base(hit.env[m[1]][0]), ...hit.env[m[1]].slice(1)] : hit.env[m[1]])); else out.push(t);
    }
    if (out.join(' ') === toks.join(' ')) break;
    toks = out; applied.push(hit.r.name); if (hit.r.mode) mode ??= hit.r.mode;
  }
  return { text: toks.join(' '), applied, ...(mode ? { mode } : {}) };
}
