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
    say: (r) => (r.assumes?.length ? `assumes ${r.assumes.map((a) => (a.word !== undefined ? `${a.word} is ${a.read}` : `${a.key}=${a.value}`)).join(', ')}` : 'assumes nothing') },
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

/**
 * Should a host answer with the top reading, or say "not understood" / ask? `result` is
 * what world.score returned (or its candidates, ranked by `rank`). Returns { answer,
 * index, reasons, ask, read }: `answer` is false when any reason is given. Reasons, each
 * { reason, why }:
 *   nothing            no reading at all
 *   inconsistent       the top reading breaks the world (its violations)
 *   no-referent        something it refers to matches nothing
 *   ambiguous          a referent is still open between several wires
 *   action-unavailable its action is not one the world can do (unsupported); a guard
 *                      that refuses is reported as inconsistent
 *   words-left-out     it leaves words of the message out (more than `leftOut`, default 0)
 *   too-few-words      it uses fewer than `minWords` words (default 1, for frames with words)
 *   tie                the next reading is as good on every criterion: ask which
 * `ask` lists what the reading lacks with its question (`ask`), for a host that asks
 * instead of answering; `read` lists words read as near known words ("I read X as Y").
 */
export function vetoOf(result, { minWords = 1, leftOut = 0, criteria = RANKING } = {}) {
  const list = Array.isArray(result) ? result : result?.candidates || [];
  const order = Array.isArray(result) ? rank(list, criteria).order : result.order || rank(list, criteria).order;
  const byIndex = new Map(list.map((r, i) => [r.index ?? i, r]));
  const top = byIndex.get(order[0]);
  if (!top) return { answer: false, index: null, reasons: [{ reason: 'nothing', why: 'no reading of the message' }], ask: [], read: [] };
  const reasons = [];
  if (!top.ok) reasons.push({ reason: 'inconsistent', why: (top.violations || []).map((v) => v.why || v.kind).join('; ') || 'refused', violations: top.violations || [] });
  const none = (top.referents || []).filter((x) => !x.ids.length);
  if (none.length) reasons.push({ reason: 'no-referent', why: `nothing matches ${none.map((x) => x.name).join(', ')}`, referents: none.map((x) => x.name) });
  const open = (top.referents || []).filter((x) => x.ids.length > 1 && !(x.fits?.length === 1));
  if (open.length) reasons.push({ reason: 'ambiguous', why: open.map((x) => `${x.name} could be ${(x.fits?.length ? x.fits : x.ids).join(' or ')}`).join('; '), referents: open.map((x) => x.name) });
  if (top.ok && top.action && !top.action.available && top.action.status !== 'missing') reasons.push({ reason: 'action-unavailable', why: `the action is ${top.action.status}`, status: top.action.status });
  if (top.words) {
    const out = [...top.words.unused, ...top.words.unresolved];
    if (out.length > leftOut) reasons.push({ reason: 'words-left-out', why: `leaves out ${out.join(', ')}`, words: out });
    if (top.words.used.length < minWords && (top.words.used.length + out.length) > 0) reasons.push({ reason: 'too-few-words', why: `uses ${top.words.used.length} word(s), fewer than ${minWords}` });
  }
  const next = byIndex.get(order[1]);
  if (next && criteria.every((c) => c.measure(next) === c.measure(top))) reasons.push({ reason: 'tie', why: `#${top.index} and #${next.index} are as good on every criterion`, between: [top.index, next.index] });
  const ask = (top.lacks || []).filter((l) => !l.referent).map((l) => ({ ...l }));
  const read = (top.assumes || []).filter((a) => a.word !== undefined).map((a) => ({ word: a.word, read: a.read }));
  return { answer: reasons.length === 0, index: top.index ?? order[0], reasons, ask, read };
}

/** The same as world.veto, for a host that has scored readings in hand. */
export function veto(result, options) { return vetoOf(result, options); }
