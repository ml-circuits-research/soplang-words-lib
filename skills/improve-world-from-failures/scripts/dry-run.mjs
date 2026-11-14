// Dry run of improve-world-from-failures: failures (a variant read differently from its canonical sentence)
// grouped by cause (the family of the edits between them) and by where a fix belongs.
// node skills/improve-world-from-failures/scripts/dry-run.mjs
import { pairs, world, reading } from '../../lib/pairs.mjs';
import { formEdits, familyOf, ledgerGroups } from '../../../src/index.mjs';
const P = pairs(), w = await world();
const PLACE = { filler: 'language world: a filler word', 'extra clause': 'language world: a splitter (the clause read on its own)', substitution: 'k.words: a synonym, or an alternation (do-support)', insertion: 'language world: an alternation', deletion: 'language world: an alternation (ellipsis)', inflection: 'library: std.morph lemma', other: 'look at it by hand' };
const rows = [];
for (const p of P) {
  const want = reading(w, p.canonical), got = reading(w, p.variant);
  if (!want || got === want) continue; // only cases the world reads canonically and the variant breaks
  const fams = [...new Set(formEdits(p.canonical, p.variant, { world: w }).map((e) => familyOf(`${e.at}: "${e.del}" -> "${e.ins}"`)))];
  rows.push({ source: p.source, text: p.variant, stage: 'reading', class: fams.length > 1 ? 'combined' : fams[0], families: fams });
}
const groups = ledgerGroups(rows, { signals: Object.keys(PLACE).map((f) => [f, (r) => r.families.includes(f)]) });
console.log(`${P.length} pairs; the world reads ${P.filter((p) => reading(w, p.canonical)).length} canonical sentences; ${rows.length} variants read differently (failures)`);
for (const g of groups.slice(0, 8)) console.log(`${String(g.count).padStart(4)}  ${g.key}  →  fix in ${PLACE[g.cause] ?? PLACE.other}   e.g. "${g.examples[0].text}"`);
