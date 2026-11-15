// Dry run of consolidate (one cycle, industrial: nothing is held back from learning). The piece built this cycle is
// a language piece: filler words learnt from ALL the pairs (formEdits families), read through canonicalise. It is
// measured three ways: (a) on all the pairs, reported (training overlaps, which is fine); (b) on fresh probes,
// sentences that never occurred, generated from the canonical sentences and the published language world's own
// skip words and joins; (c) by the honest list: variants that leave it and come onto it. The acceptance rule of the
// transition phase decides; counts are reported, never a gate alone. node skills/consolidate/scripts/dry-run.mjs
import { pairs, world, reading, READ } from '../../lib/pairs.mjs';
import { learnFormEdits, fillersFrom, canonicalise, readByTypes, typedLexicon } from '../../../src/index.mjs';
import { catalogWorld } from '../../../tools/worlds.mjs';
import { honestDelta, acceptance } from '../../lib/honest.mjs';

const P = pairs(), w = await world();
const usable = P.filter((p) => reading(w, p.canonical)); // cases the world reads in their canonical form
const proposed = fillersFrom(learnFormEdits(usable, { world: w })); // learnt from everything
// review: a filler is a word that carries no content; one the knowledge knows as a verb, a value or a kind is not a filler
const know = await catalogWorld({ 'k.actions': ['k.actions.verb'], 'k.colours': ['k.colours.basic', 'k.colours.colour'] });
const content = new Set([...know.ofType('k.actions.verb').flatMap((x) => x.attrs.text ?? []), ...know.ofType('k.colours.basic').flatMap((x) => x.attrs.name ?? []), ...know.ofType('k.colours.colour').flatMap((x) => x.attrs.name ?? [])].map((t) => String(t).replace(/^"|"$/g, '')));
for (const t of typedLexicon(w).keys?.() ?? []) content.add(t);
const fillers = proposed.filter((f) => !content.has(f)), refused = proposed.filter((f) => content.has(f));
const splitters = ['and then', 'also', 'whatever', 'too'];
const run = (text, after) => {
  if (!after) return reading(w, text);
  for (const c of canonicalise(w, text, { fillers, splitters }).clauses) { const r = readByTypes(w, c.text, READ); if (r.best && r.best.is === 'ask') return JSON.stringify({ is: r.best.is, key: r.best.key, of: r.best.of }); }
  return reading(w, text);
};
// fresh probes: the language world's one-word skip words before a canonical sentence, and two canonical sentences joined
const lang = await catalogWorld({ 'w.lang.en': ['w.lang.en.skip'] });
const skip = [...new Set(lang.ofType('w.lang.en.skip').flatMap((x) => x.attrs.text ?? []).map((t) => String(t).replace(/^"|"$/g, '')).filter((t) => !t.includes(' ')))];
const canon = [...new Set(usable.map((p) => p.canonical))], seen = new Set(P.map((p) => p.variant));
const probes = [];
canon.forEach((c, i) => {
  const a = `${skip[i % skip.length]}, ${c.charAt(0).toLowerCase()}${c.slice(1)}`, b = `${c.replace(/[?.!]$/, '')} and then ${canon[(i * 7 + 3) % canon.length]}`;
  for (const t of [a, b]) if (!seen.has(t)) probes.push({ text: t, expect: reading(w, c) });
});
const score = (cells, after) => cells.filter((x) => run(x.text, after) === x.expect).length;
const all = usable.map((p) => ({ text: p.variant, expect: reading(w, p.canonical) }));
const honest = (after) => all.filter((x) => run(x.text, after) !== x.expect).map((x) => ({ turn: x.text, needs: 'needs a reading of this form (language piece)' }));
const before = honest(false), afterRows = honest(true), d = honestDelta(before, afterRows);
console.log(`${usable.length} usable pairs, all learnt from; fillers proposed: ${proposed.join(', ')}; refused by review (content words of the knowledge): ${refused.join(', ') || 'none'}; kept: ${fillers.join(', ')}`);
console.log(`(a) all pairs, reported:  before ${score(all, false)}/${all.length}   after ${score(all, true)}/${all.length}`);
console.log(`(b) fresh probes (${probes.length}, from ${skip.length} published skip words and joins): before ${score(probes, false)}/${probes.length}   after ${score(probes, true)}/${probes.length}`);
console.log(`(c) honest list: ${d.before} -> ${d.after} rows (${d.left.length} left, ${d.came.length} came)`);
const verdict = acceptance('transition', { won: d.left.map((r) => ({ turn: r.turn, real: false })), lost: d.came.map((r) => ({ turn: r.turn, real: false, needs: r.needs })) });
console.log(`acceptance (transition phase): ${verdict.accept ? 'accept' : 'reject'}: ${verdict.why}`);
const steady = acceptance('steady', { won: d.left.map((r) => ({ turn: r.turn, real: false })), lost: d.came.map((r) => ({ turn: r.turn, real: false, needs: r.needs })) });
console.log(`acceptance (steady phase, for reference): ${steady.accept ? 'accept' : 'reject'}: ${steady.why}`);
