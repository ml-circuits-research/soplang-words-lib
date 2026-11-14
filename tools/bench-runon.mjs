// Run-on requests split into clauses (reviewer 02:50) on psys2's form pairs against k.animals: a variant is
// right when every frame its canonical sentence reads to is among the frames read from it. Before: one reading
// of the whole variant (readByTypes); after: splitRunOn, clause by clause. node tools/bench-runon.mjs
import { pairs, world, READ } from '../skills/lib/pairs.mjs';
import { readByTypes, splitRunOn } from '../src/index.mjs';
const P = pairs(), w = await world();
const O = { openers: ['what', 'how', 'is', 'are', 'where', 'who', 'which', 'whatever', 'does', 'do'], splitters: ['and then', 'also', 'and'], fillers: ['um', 'hey', 'so', 'too', 'please'], read: READ };
const key = (f) => JSON.stringify({ is: f.is, key: f.key, of: f.of });
const framesOf = (t) => splitRunOn(w, t, O).filter((c) => c.frame).map((c) => key(c.frame));
let n = 0, before = 0, after = 0, compound = 0, cBefore = 0, cAfter = 0;
for (const p of P) {
  const gold = framesOf(p.canonical);
  if (!gold.length) continue;
  n++;
  const one = readByTypes(w, p.variant, READ).best, b = one ? [key(one)] : [], a = framesOf(p.variant);
  const okB = gold.every((g) => b.includes(g)), okA = gold.every((g) => a.includes(g));
  before += okB; after += okA;
  if (gold.length > 1 || a.length + splitRunOn(w, p.variant, O).filter((c) => !c.frame).length > 1) { compound++; cBefore += okB; cAfter += okA; }
}
console.log(`${n} pairs with a gold reading: whole-sentence reading ${before}/${n} (${(100 * before / n).toFixed(1)} %), clause by clause ${after}/${n} (${(100 * after / n).toFixed(1)} %)`);
console.log(`compound or noisy (more than one clause): ${compound}: whole ${cBefore}, clauses ${cAfter}`);
