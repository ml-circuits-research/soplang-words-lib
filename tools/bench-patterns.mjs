// The owner's hypothesis (02:15): few sentence patterns over type signatures. Mined from psys2's form pairs
// (canonical sentences and variants, read in place) against k.animals, at three signature levels.
// node tools/bench-patterns.mjs
import { pairs, world } from '../skills/lib/pairs.mjs';
import { minePatterns } from '../src/index.mjs';
const P = pairs(), w = await world();
const closed = ['a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'what', 'which', 'who', 'where', 'how', 'many', 'much', 'does', 'do', 'is', 'are', 'was', 'can', 'could', 'you', 'me', 'it', 'they', 'he', 'she', 'i', 'please', 'hey', 'um', 'also', 'then', 'too', 'whatever'];
for (const [name, sents] of [['canonical', [...new Set(P.map((p) => p.canonical))]], ['variants', [...new Set(P.map((p) => p.variant))]]]) {
  for (const level of [0, 1, 2]) {
    const r = minePatterns(w, sents, { level, closed });
    console.log(`${name.padEnd(9)} level ${level}: ${r.sentences} sentences, ${r.patterns.length} patterns; 80 % by ${r.at80}, 95 % by ${r.at95}; top: ${r.patterns.slice(0, 2).map((p) => `${p.count}× ${p.pattern}`).join(' | ')}`);
  }
}
// the same variants after the inverse operators (clauses split at splitters, fillers dropped): patterns per clause
const { canonicalise } = await import('../src/index.mjs');
const clauses = [...new Set(P.map((p) => p.variant))].flatMap((s) => canonicalise(w, s, { fillers: ['um', 'hey', 'so'], splitters: ['and then', 'also', 'whatever', 'too'] }).clauses.map((c) => c.text));
for (const level of [1, 2]) { const r = minePatterns(w, clauses, { level, closed }); console.log(`clauses   level ${level}: ${r.sentences} clauses, ${r.patterns.length} patterns; 80 % by ${r.at80}, 95 % by ${r.at95}; top: ${r.patterns.slice(0, 3).map((p) => `${p.count}× ${p.pattern}`).join(' | ')}`); }
