// Ranking scored readings (Round 9). The default order is data, so a host can call it,
// reorder it or add its own criteria, and every place in the ranking is explained: a
// reading that lost says on which criterion, and against which reading.

const settled = (r) => (r.referents || []).filter((x) => !(x.unique || x.fits?.length === 1));
const leftOver = (r) => (r.words ? r.words.unused.length + r.words.unresolved.length : 0);

/**
 * The default criteria, in order. Words left out come before assumptions: a reading that
 * ignores part of what was said is worse than one resting on a default the matrix
 * declares (this decides between splits of one message; Q19). Each has a name, a measure (lower is better) and a way
 * to say what the measure means for one reading.
 */
export const RANKING = [
  { name: 'consistent', measure: (r) => (r.ok ? 0 : 1),
    say: (r) => (r.ok ? 'consistent with the world' : `inconsistent: ${(r.violations || []).map((v) => v.why || v.kind).join('; ') || 'refused'}`) },
  { name: 'referents', measure: (r) => settled(r).length,
    say: (r) => { const open = settled(r); return open.length ? `ambiguous: ${open.map((x) => `${x.name} could be ${(x.fits?.length ? x.fits : x.ids).join(' or ')}`).join('; ')}` : 'every referent settled'; } },
  { name: 'lacks', measure: (r) => (r.lacks || []).length,
    say: (r) => (r.lacks?.length ? `lacks ${r.lacks.map((l) => l.referent || l.key).join(', ')}` : 'lacks nothing') },
  { name: 'words', measure: leftOver,
    say: (r) => (leftOver(r) ? `leaves out ${[...r.words.unused, ...r.words.unresolved].join(', ')}` : 'uses every word') },
  { name: 'assumes', measure: (r) => (r.assumes || []).length,
    say: (r) => (r.assumes?.length ? `assumes ${r.assumes.map((a) => `${a.key}=${a.value}`).join(', ')}` : 'assumes nothing') },
];

/**
 * Order scored readings (the `candidates` of world.score) by criteria, best first; ties
 * keep the given order. Returns { order, ranked }: `ranked[i]` is { index, place, why,
 * lostTo?, on? } for the i-th reading, where `why` explains its place: for the first,
 * what it satisfies; for any other, why not it: the first criterion on which the winner
 * is better (`on`), what each is on that criterion, and the winner (`lostTo`); for a tie,
 * that it equals the winner on every criterion.
 */
export function rank(scored, criteria = RANKING) {
  const list = [].concat(scored || []);
  const m = list.map((r) => criteria.map((c) => c.measure(r)));
  const cmp = (a, b) => { for (let i = 0; i < criteria.length; i++) if (m[a][i] !== m[b][i]) return m[a][i] - m[b][i]; return a - b; };
  const order = list.map((_, i) => i).sort(cmp);
  const ranked = new Array(list.length);
  order.forEach((i, place) => {
    const r = list[i];
    const index = r.index ?? i;
    if (place === 0) {
      ranked[i] = { index, place, why: criteria.map((c) => c.say(r)).join('; ') };
      return;
    }
    const prev = order[0]; // why not this one: against the reading that won
    const k = criteria.findIndex((_, j) => m[prev][j] !== m[i][j]);
    const other = list[prev].index ?? prev;
    if (k < 0) ranked[i] = { index, place, lostTo: other, why: `tied with #${other} on every criterion; kept in the given order` };
    else ranked[i] = { index, place, lostTo: other, on: criteria[k].name, why: `${criteria[k].say(r)}; #${other}: ${criteria[k].say(list[prev])}` };
  });
  return { order: order.map((i) => list[i].index ?? i), ranked };
}
