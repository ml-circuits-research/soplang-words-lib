// One clause splitter (reviewer 12:30 Q71, R2 finding 15; the knowledge repository's reference clauseReader): a
// message cut into clauses at the language world's cut points, the cutting whose clauses all read winning. Sentences
// end at . ? ! ; the cut points inside one are a comma and the joiners that cut (`${lang}.joiner cut=yes`: and, then,
// also, but; two joiners in a row are one: "and then"), and the place before a question word (`${lang}.wh`). A clause
// is read by `read(text) -> { literal, captured? } | null` (a host's reader, or readFrames' best); among the cuttings
// whose every clause reads, the one with the most literal words wins, then the fewest captured, then the fewest
// clauses. Returns [{ text, reading }] or null when some sentence has no cutting that reads.
// A thing of several words is never cut (Q35 of an application): no cut point inside a phrase of `whole` (the
// host's names of things, "salt and pepper", "water lily"), and a joiner before a determiner or a number joins two
// noun phrases, not two clauses ("remove the fourth grass and the third water lily" is one clause).
import { valueText } from './parser.mjs';
import { memoPerWorld } from './memo.mjs';

/** The cut points of a language world: { joiners: Set, wh: Set }. */
export function cutPoints(world, { lang = 'w.lang.en' } = {}) {
  return memoPerWorld(world, `cut-points|${lang}`, () => ({
    joiners: new Set(world.ofType(`${lang}.joiner`).filter((j) => valueText(j.attrs.cut?.[0]) === 'yes' && /^\p{L}+$/u.test(valueText(j.attrs.text?.[0]))).map((j) => valueText(j.attrs.text[0]).toLowerCase())),
    wh: new Set(world.ofType(`${lang}.wh`).flatMap((w) => [...(w.attrs.text || []), ...(w.attrs.form || [])]).map((v) => valueText(v).toLowerCase())),
    nounStart: new Set([`${lang}.det`, `${lang}.numeral`].flatMap((t) => world.ofType(t)).flatMap((w) => [...(w.attrs.text || []), ...(w.attrs.form || [])]).map((v) => valueText(v).toLowerCase()).filter((v) => /^\p{L}+$/u.test(v))),
  }));
}

export function clauses(world, text, { lang = 'w.lang.en', read, whole = [] } = {}) {
  const { joiners, wh, nounStart } = cutPoints(world, { lang });
  const wholes = [...new Set([].concat(whole).map((p) => String(p).toLowerCase().replace(/['’]/g, '').split(/\s+/).filter(Boolean)).filter((p) => p.length > 1).map((p) => p.join(' ')))].map((p) => p.split(' '));
  const better = (a, b) => !b || a.literal > b.literal || (a.literal === b.literal && (a.captured < b.captured || (a.captured === b.captured && a.clauses.length < b.clauses.length)));
  const sentence = (s) => {
    const ws = s.replace(/,/g, ' , ').trim().split(/\s+/).filter(Boolean);
    const low = ws.map((w) => w.toLowerCase().replace(/['’]/g, ''));
    const inside = new Array(low.length).fill(false); // a word inside a thing of several words (not its first)
    for (const p of wholes) for (let i = 0; i + p.length <= low.length; i++) if (p.every((x, k) => low[i + k] === x)) for (let k = 1; k < p.length; k++) inside[i + k] = true; // bounded: the phrases x the words
    const cuts = []; // [end of a clause, start of the next]
    for (let i = 1; i < low.length; i++) { // bounded: the words
      if (inside[i]) continue;
      if (low[i] === ',' || joiners.has(low[i])) {
        let j = i + 1;
        while (j < low.length && joiners.has(low[j])) j++; // bounded: the words after it ("and then": one joiner)
        if (low[i] !== ',' && j === i + 1 && j < low.length && (nounStart.has(low[j]) || /^\d/.test(low[j]))) continue; // "... and the third water lily": a list of things
        cuts.push([i, j]);
        i = j - 1;
      }
      else if (wh.has(low[i])) cuts.push([i, i]);
    }
    const memo = new Map();
    const from = (st) => { // bounded: memoised per start
      if (st >= ws.length) return { literal: 0, captured: 0, clauses: [] };
      if (memo.has(st)) return memo.get(st);
      let best = null;
      for (const [end, next] of [...cuts.filter(([e]) => e > st), [ws.length, ws.length]]) { // bounded: the cut points
        const t = ws.slice(st, end).filter((w) => w !== ',').join(' ');
        if (!t) continue;
        const r = read(t);
        if (!r) continue;
        const rest = from(next);
        if (!rest) continue;
        const c = { literal: (r.literal ?? 0) + rest.literal, captured: (r.captured ?? 0) + rest.captured, clauses: [{ text: t, reading: r }, ...rest.clauses] };
        if (better(c, best)) best = c;
      }
      memo.set(st, best);
      return best;
    };
    return from(0);
  };
  const out = [];
  for (const s of String(text).split(/[.?!;]+/).map((x) => x.trim()).filter(Boolean)) { // bounded: the sentences
    const r = sentence(s);
    if (!r) return null;
    out.push(...r.clauses);
  }
  return out;
}
