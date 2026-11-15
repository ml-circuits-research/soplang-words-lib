// Dry run of learn-language-rules: typed form operators learnt from ALL aligned pairs (psys2's form pairs at a fixed
// commit, read in place; nothing held back), reviewed with the patch-smell hints (one support; more literal words
// than variables; a content word the source lacks; a filler fused into a form: split it into its edits), and the clean ones printed as proposed facts of the language
// world. The edit families say which language pieces the pairs need. node skills/learn-language-rules/scripts/dry-run.mjs
import { pairs as formPairs } from '../../lib/pairs.mjs';
import { catalogWorld } from '../../../tools/worlds.mjs';
import { learnFormOperators, learnFormEdits } from '../../../src/index.mjs';
import { smellsOf } from '../../lib/smells.mjs';
const pairs = formPairs();
const world = await catalogWorld({ 'k.animals': ['k.animals.animal'] });
const r = learnFormOperators(pairs, { world }); // admitted with two supports: learnt from everything
const lang = await catalogWorld({ 'w.lang.en': ['w.lang.en.skip'] });
const skip = lang.ofType('w.lang.en.skip').flatMap((x) => x.attrs.text ?? []).map((t) => String(t).replace(/^"|"$/g, ''));
const reviewed = r.operators.filter((o) => o.admitted).map((o) => ({ o, smells: smellsOf({ operators: [o] }, { skip }) }));
const clean = reviewed.filter((x) => !x.smells.length), smelly = reviewed.filter((x) => x.smells.length);
console.log(`${pairs.length} same-meaning pairs, all learnt from; ${r.operators.length} typed operators; ${reviewed.length} admitted (two supports); ${clean.length} pass the review, ${smelly.length} refused`);
console.log('proposed facts (review, then add to the language world; never a phrase list):');
for (const [i, { o }] of clean.slice(0, 8).entries()) console.log(`@w.lang.en.alternation.learnt_${i + 1} w.lang.en.alternation name=learnt_${i + 1} n=${900 + i} family=learnt from="${o.from}" to="${o.to}"   # support ${o.support.length}`);
console.log('refused by the review (split into edits with formEdits, or list the turns as "needs ..."):');
for (const { o, smells } of smelly.slice(0, 6)) console.log(`  "${o.from}" -> "${o.to}"   # support ${o.support.length}: ${[...new Set(smells.map((s) => s.smell))].join(', ')}`);
const e = learnFormEdits(pairs, { world });
console.log(`edit families (the language pieces the pairs need): ${JSON.stringify(e.families)}`);
