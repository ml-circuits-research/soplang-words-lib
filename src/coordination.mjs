// Coordinated noun phrases of one request ("draw a cat and 2 dogs", "a sun, three clouds and a bird"): the request is
// split at the coordinators between its noun phrases, and each phrase, with its own determiner, count and modifiers,
// becomes a request text of its own with the shared head (the words up to the act's trigger) and the shared tail (a
// relation or place after the last noun, when no earlier phrase has words after its noun). Language-free: the
// coordinators, pronouns, determiners and prepositions are the caller's (facts of a language world); the noun mentions
// are the reader's. Positions are code-point offsets of `text`.

const TOKENS = /[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu;
const tokensOf = (s) => [...s.matchAll(TOKENS)];

/**
 * The conjunct texts of a coordinated request, or null when it is not one.
 *   text      the whole message
 *   cut       [start, end] the request's span in `text`
 *   trigger   [start, end] the act's trigger
 *   mentions  [[start, end], ...] the noun mentions the reading could not hold for one target (two or more), or null
 *   kind      [start, end] the one noun the reading held (used when `mentions` is null: a list after it, unread)
 *   words     { separators, pronouns, determiners, prepositions } Sets of lower-case words of the language
 * Answers [{ said, text, range }]: what the person said for each phrase, the request text to read for it, its range.
 * A later conjunct holding a pronoun that is not governed by a preposition ("and call it Tom") is a clause about what
 * an earlier phrase made, not a further phrase: null.
 */
export function coordinationParts(text, { cut, trigger, mentions = null, kind = null, words = {} } = {}) {
  const chars = Array.from(String(text ?? '')), slice = (a, b) => chars.slice(a, b).join('');
  const separators = words.separators ?? new Set();
  if (!trigger || !cut) return null;
  const kinds = mentions?.length > 1 ? [...mentions].sort((a, b) => a[0] - b[0]) : listAfter(kind, separators, slice, cut);
  if (!kinds || trigger[1] > kinds[0][0]) return null;
  const parts = splitParts(kinds, slice, cut, trigger, separators);
  return parts && parts.slice(1).some((part) => refersBack(slice(...part.range), words)) ? null : parts;
}

// A pronoun (not also a determiner) not governed by a preposition.
function refersBack(phrase, { pronouns = new Set(), determiners = new Set(), prepositions = new Set() }) {
  const ws = [...phrase.toLowerCase().matchAll(/[\p{L}]+/gu)].map((m) => m[0]);
  return ws.some((w, i) => pronouns.has(w) && !determiners.has(w) && !prepositions.has(ws[i - 1]));
}

function splitParts(kinds, slice, cut, trigger, separators) {
  if (kinds.list) return kinds.list.map(([a, b], i) => { const own = slice(a, b).trim(); return { said: i === 0 ? slice(trigger[1], b).trim() : own, text: (i === 0 ? own : slice(cut[0], trigger[1]).trim() + ' ' + own).replace(/\s+/g, ' ').trim(), range: [a, b] }; });
  // In each gap between two mentions, the last coordinator token separates the phrases.
  const cuts = [];
  for (let i = 1; i < kinds.length; i++) { // bounded: the mentions
    const gap = slice(kinds[i - 1][1], kinds[i][0]);
    const tokens = tokensOf(gap).filter((m) => separators.has(m[0].toLowerCase()));
    if (!tokens.length) return null;
    // "a cat, and a dog": the coordinators run together; the phrase starts after the last, the previous ends at the first.
    let first = tokens.at(-1);
    for (let k = tokens.length - 2; k >= 0; k--) { if (gap.slice(tokens[k].index + tokens[k][0].length, first.index).trim()) break; first = tokens[k]; } // bounded: the gap's tokens
    const last = tokens.at(-1);
    cuts.push([kinds[i - 1][1] + first.index, kinds[i - 1][1] + last.index + last[0].length]);
  }
  const segments = kinds.map((_, i) => [i ? cuts[i - 1][1] : cut[0], i < cuts.length ? cuts[i][0] : cut[1]]);
  // The tail after the last noun is shared when no earlier phrase has words after its noun.
  const shared = kinds.slice(0, -1).every((k, i) => !slice(k[1], segments[i][1]).trim());
  const tail = shared ? slice(kinds.at(-1)[1], cut[1]) : '';
  const head = slice(cut[0], trigger[1]);
  return segments.map(([a, b], i) => {
    const own = slice(a, b).trim(), phrase = i === kinds.length - 1 && shared ? slice(a, kinds.at(-1)[1]).trim() : own;
    const reading = (i === 0 ? phrase : head.trim() + ' ' + phrase) + (shared ? tail.replace(/\s+$/, '') : '');
    return { said: i === 0 ? slice(trigger[1], b).trim() : phrase, text: reading.replace(/\s+/g, ' ').trim(), range: [a, b] };
  });
}

// One noun held and a list left after it ("a boy and a girl" read as the boy): when the words right after the noun are
// a coordinator, the rest of the request is cut at its coordinators into the further phrases.
function listAfter(kind, separators, slice, cut) {
  if (!kind) return null;
  const tokens = tokensOf(slice(kind[1], cut[1]));
  if (!tokens.length || !separators.has(tokens[0][0].toLowerCase())) return null;
  const bounds = []; let open = null;
  for (const t of tokens) { // bounded: the request's tokens
    const at = kind[1] + t.index, end = at + t[0].length;
    if (separators.has(t[0].toLowerCase())) { if (open && !open.sep) bounds.push([open.start, at]); open = { sep: true, after: end }; continue; }
    if (open?.sep) open = { start: open.after };
  }
  if (open && !open.sep) bounds.push([open.start, cut[1]]);
  const list = [[cut[0], kind[1] + tokens[0].index], ...bounds].filter(([a, b]) => slice(a, b).trim());
  return list.length > 1 ? Object.assign([kind], { list }) : null;
}
