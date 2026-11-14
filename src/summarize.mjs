// std.summarize (reviewer 14:45 A): summaries from frames and from text, with no model.
// A log of acts is aggregated by act and kind, siblings are generalised up the chain of
// kinds ("a cat, a dog and a horse" -> three animals), failures and teaching are kept, and
// the result is ordered by salience (how much changed, repetition, recency). It is a list of
// frames that the language world renders. Any text: sentences scored by centrality (content
// words shared with the others), position and information (numbers, capitalised names),
// redundancy dropped, the top sentences kept in their order (extractive). Language-free:
// the words that are not content come from the host (`stop`), or are found as the words
// that most sentences share.

/** The acts of a world's history: [{ act, kind, things, world?, step }], oldest first. */
export function actsOf(world) {
  const kindOf = new Map(); // a thing's kind, from the statements that told it
  const out = [], byStep = new Map();
  for (const e of world.log) { // bounded: the log
    for (const w of e.wires || []) if (w.attrs?.kind) kindOf.set(w.id, String(w.attrs.kind[0]));
    if (!e.by) continue;
    const key = e.step ?? `${out.length}`;
    let a = byStep.get(key);
    if (!a) { a = { act: e.by, things: [], step: key }; byStep.set(key, a); out.push(a); }
    const ids = [...(e.wires || []).map((w) => w.id), ...(e.id ? [e.id] : []), ...(e.ids || [])];
    for (const id of ids) if (!a.things.includes(id)) a.things.push(id);
  }
  for (const a of out) { a.kind = a.things.map((id) => kindOf.get(id)).find(Boolean) ?? null; }
  return out;
}

/**
 * The summary of a log of acts: frames [{ act, kind, count, kinds?, failed?, salience }].
 * `entries`: [{ act, kind, failed?, changed? }] (as `actsOf` gives, or the host's turns);
 * `parentOf(kind)`: the kind above it (the chain of kinds, as std.know or a planner's isA
 * gives it); `length`: 'line' (1 frame), 'paragraph' (3), 'bullets' (all).
 */
export function summarizeLog(entries, { parentOf = () => null, length = 'paragraph' } = {}) {
  const groups = new Map();
  entries.forEach((e, i) => { // bounded: the entries
    const key = `${e.act}|${e.kind ?? ''}|${e.failed ? 'failed' : ''}`;
    const g = groups.get(key) || groups.set(key, { act: e.act, kind: e.kind ?? null, count: 0, failed: !!e.failed, changed: 0, last: 0 }).get(key);
    g.count++; g.changed += e.changed ?? 1; g.last = i;
  });
  // siblings under one parent, for the same act, become one frame about the parent
  const byParent = new Map();
  for (const g of groups.values()) { const p = g.kind ? parentOf(g.kind) : null; if (!p) continue; const k = `${g.act}|${p}|${g.failed}`; (byParent.get(k) || byParent.set(k, []).get(k)).push(g); }
  for (const [k, gs] of byParent) {
    if (gs.length < 2) continue;
    const [act, parent] = k.split('|');
    for (const g of gs) groups.delete(`${g.act}|${g.kind}|${g.failed ? 'failed' : ''}`);
    groups.set(`${act}|${parent}|g`, { act, kind: parent, kinds: gs.map((g) => g.kind).sort(), count: gs.reduce((s, g) => s + g.count, 0), failed: gs[0].failed, changed: gs.reduce((s, g) => s + g.changed, 0), last: Math.max(...gs.map((g) => g.last)) });
  }
  const n = Math.max(1, entries.length);
  const frames = [...groups.values()].map((g) => ({ act: g.act, kind: g.kind, count: g.count, ...(g.kinds ? { kinds: g.kinds } : {}), ...(g.failed ? { failed: true } : {}), salience: +(g.changed / n + g.count / n + (g.last + 1) / n / 2 + (g.failed ? 0.5 : 0)).toFixed(3) }));
  frames.sort((a, b) => b.salience - a.salience || a.act.localeCompare(b.act) || String(a.kind).localeCompare(String(b.kind)));
  return length === 'line' ? frames.slice(0, 1) : length === 'paragraph' ? frames.slice(0, 3) : frames;
}

const sentencesOf = (text) => String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [];
const wordsOf = (s) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

/**
 * An extractive summary of a text: { sentences: [{ text, score, at }], picked }. Options:
 * `n` (sentences kept; default a third, at least 1), `stop` (words that are not content;
 * default: the words more than half the sentences share), `redundancy` (the overlap above
 * which a sentence repeats a kept one, default 0.6).
 */
export function summarizeText(text, { n, stop, redundancy = 0.6 } = {}) {
  const sents = sentencesOf(text);
  if (!sents.length) return { sentences: [], picked: [] };
  const bags = sents.map((s) => new Set(wordsOf(s)));
  const df = new Map();
  for (const b of bags) for (const w of b) df.set(w, (df.get(w) || 0) + 1);
  const stops = new Set(stop ?? [...df].filter(([, c]) => sents.length > 2 && c > sents.length / 2).map(([w]) => w));
  const content = bags.map((b) => new Set([...b].filter((w) => !stops.has(w) && w.length > 2)));
  const scored = sents.map((s, i) => {
    let shared = 0;
    for (const w of content[i]) shared += (df.get(w) || 1) - 1; // centrality: content words the other sentences use too
    const info = (s.match(/\d/g) ? 1 : 0) + (s.slice(1).match(/\b\p{Lu}/gu)?.length ? 0.5 : 0); // numbers, names
    const position = i === 0 ? 1 : i === sents.length - 1 ? 0.3 : 0;
    return { text: s, at: i, score: +(shared / Math.max(1, content[i].size) + info + position).toFixed(3) };
  });
  const want = n ?? Math.max(1, Math.round(sents.length / 3));
  const picked = [];
  for (const c of [...scored].sort((a, b) => b.score - a.score || a.at - b.at)) { // bounded: the sentences
    if (picked.length >= want) break;
    const dup = picked.some((p) => { const a = content[p.at], b = content[c.at]; const inter = [...a].filter((w) => b.has(w)).length; return inter / Math.max(1, Math.min(a.size, b.size)) > redundancy; });
    if (!dup) picked.push(c);
  }
  picked.sort((a, b) => a.at - b.at);
  return { sentences: scored, picked: picked.map((p) => p.text) };
}

/** Unigram recall of a summary against a reference (ROUGE-1 recall), on content words. */
export function overlap(summary, reference, { stop = [] } = {}) {
  const s = new Set(wordsOf(summary).filter((w) => !stop.includes(w))), r = wordsOf(reference).filter((w) => !stop.includes(w));
  return r.length ? +(r.filter((w) => s.has(w)).length / r.length).toFixed(3) : 0;
}
