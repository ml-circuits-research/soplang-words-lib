// Choosing among rewrites of a clause (Q35 of an application): a host proposes other readings of what the user said
// ("make the diagram more beautiful" -> "improve the diagram"), each is read dry by the host's reader, and std.decide's
// kind `intent` chooses (data: reads, covers, slots, present, previous, cost). The clause itself is a candidate of cost
// 0; a rewrite is taken only when it reads strictly better than the clause. Deterministic: ties keep the given order.
import { choose } from './rank.mjs';

const wordsOf = (t) => String(t ?? '').toLowerCase().replace(/['’]/g, '').match(/[\p{L}\p{N}]+/gu) || [];

/**
 * chooseRewrite(text, rewrites, { read, stop, previous, world, criteria }) -> { chosen, self, changed, order, why }.
 * `rewrites`: [{ text, cost = 1, explains = [], via? }] (`explains`: words of the clause this kind of reading accounts
 * for, so they are not counted as left out). `read(text) -> { issues, unfilled?, absent? }`: the host's dry reading
 * (points of trouble; required keys left open; things named that are not there). `stop`: function words (a Set or
 * array) not counted as content. `previous`: phrases of the previous turn (a rewrite that holds every word of one gets
 * previous 1). `world` / `criteria`: the kind's criteria from a World's std.decide facts or given (choose's).
 * Every candidate: { text, via, cost, issues, uncovered, unfilled, absent, previous }.
 */
export function chooseRewrite(text, rewrites = [], { read, stop = [], previous = [], world = null, criteria } = {}) {
  if (typeof read !== 'function') throw new Error('sopworld: chooseRewrite needs read(text) -> { issues }');
  const STOP = stop instanceof Set ? stop : new Set([].concat(stop).map((w) => String(w).toLowerCase()));
  const content = wordsOf(text).filter((w) => !STOP.has(w));
  const prev = [].concat(previous).map(wordsOf).filter((p) => p.length);
  const seen = new Set();
  const measure = (c) => {
    const r = read(c.text) || {};
    const tw = new Set(wordsOf(c.text)), ex = new Set([].concat(c.explains || []).flatMap(wordsOf));
    return { text: c.text, via: c.via ?? 'rewrite', cost: Number(c.cost ?? 1), issues: Number(r.issues ?? 0), unfilled: Number(r.unfilled ?? 0), absent: Number(r.absent ?? 0),
      uncovered: content.filter((w) => !tw.has(w) && !ex.has(w)).length, previous: prev.some((p) => p.every((w) => tw.has(w))) ? 1 : 0, reading: r };
  };
  const cands = [];
  for (const c of [{ text, via: 'self', cost: 0 }, ...[].concat(rewrites)]) { // bounded: the host's rewrites
    if (!c || !String(c.text ?? '').trim() || seen.has(String(c.text))) continue;
    seen.add(String(c.text));
    cands.push(measure(c));
  }
  const self = cands[0];
  const r = choose(world, 'intent', cands, { seed: null, criteria });
  const changed = r.best !== self && r.best.issues < self.issues;
  const chosen = changed ? r.best : self;
  const why = r.criteria.map((k) => `${k.name} ${chosen[k.measure] ?? 0}`).join(', ');
  return { chosen, self, changed, order: r.order, why };
}
