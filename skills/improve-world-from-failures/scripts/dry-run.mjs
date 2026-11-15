// Dry run of improve-world-from-failures: failures become honest-list rows, each with the generic piece it needs.
// (A) turns over the invented example worlds of examples/request-app.mjs, triaged by the evidence the request already
//     carries (readRequest's unread words, planRequest's notHonoured codes and cannot);
// (B) psys2's form pairs (read in place, through the older readByTypes reader on k.animals): a variant read
//     differently from its canonical sentence, grouped by the family of its edits, each family mapped to a piece.
// Nothing is fixed here: the ranked list says what to build first. node skills/improve-world-from-failures/scripts/dry-run.mjs
import { pairs, world, reading } from '../../lib/pairs.mjs';
import { formEdits, familyOf } from '../../../src/index.mjs';
import { SKETCH, NOTES, GARDEN, exampleWorld, requestSession, requestLanguage, requestKinds } from '../../../examples/request-app.mjs';
import { triage, checkHonest, rankNeeds } from '../../lib/honest.mjs';

const rows = [];
// (A)
const language = await requestLanguage();
if (language) {
  const kinds = await requestKinds();
  const TURNS = { sketch: ['draw a sketch, not circles', 'too many', 'blorp a picture', 'draw a picture about bees'], notes: ['write a short note about bees', 'write a note about frogs in red'], garden: ['add a fish', 'add 9 fish in the pond', 'add a purple bird'] };
  for (const [name, text] of [['sketch', SKETCH], ['notes', NOTES], ['garden', GARDEN]]) {
    const s = requestSession(exampleWorld(text), { language, catalog: [language, kinds], revisions: language });
    for (const turn of TURNS[name]) { const r = s.say(turn); for (const t of triage(r.request, r.plan)) rows.push({ turn, world: name, ...t, real: false }); }
  }
} else console.log('(A) skipped: the published worlds cannot be read here');
const nA = rows.length;
// (B)
const P = pairs(), w = await world();
const PIECE = {
  filler: ['language', 'needs a skip word of the language world (w.lang.<lang>.skip) read as such'],
  'extra clause': ['library', 'needs clause splitting as a candidate source of the reader (each clause read on its own)'],
  substitution: ['knowledge', 'needs the word as a synonym in k.words or an alternation of the language world'],
  insertion: ['language', 'needs an alternation of the language world'],
  deletion: ['language', 'needs an alternation of the language world (ellipsis)'],
  inflection: ['library', 'needs lemmatisation by std.morph in the reader'],
};
for (const p of P) {
  const want = reading(w, p.canonical), got = reading(w, p.variant);
  if (!want || got === want) continue; // only cases the world reads canonically and the variant breaks
  const fams = [...new Set(formEdits(p.canonical, p.variant, { world: w }).map((e) => familyOf(`${e.at}: "${e.del}" -> "${e.ins}"`)))];
  for (const f of fams) { const [piece, needs] = PIECE[f] ?? ['unknown', 'needs a generic piece (unknown): look at the edit by hand']; rows.push({ turn: p.variant, world: 'k.animals', stage: 'reading', piece, needs, real: false, source: p.source }); }
}
console.log(`(A) ${nA} rows from the example sessions; (B) ${rows.length - nA} rows from ${P.length} pairs; problems in the list: ${checkHonest(rows).length}`);
console.log('ranked by turns unlocked (piece "none" = a correct named refusal, left out):');
for (const g of rankNeeds(rows).slice(0, 9)) console.log(`${String(g.real + g.synthetic).padStart(5)}  [${g.piece}] ${g.needs}`);
