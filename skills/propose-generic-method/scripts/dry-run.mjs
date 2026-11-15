// Dry run of propose-generic-method: (1) an honest list made from turns over the invented example worlds, triaged by
// the evidence the request carries (unread, notHonoured codes, cannot), each row with the generic piece it needs;
// (2) the list checked and ranked by the turns a piece would unlock; (3) three proposals reviewed adversarially with
// the patch-smell hints and the acceptance rule in both phases. The turns are this dry run's material only.
// node skills/propose-generic-method/scripts/dry-run.mjs
import { SKETCH, NOTES, GARDEN, exampleWorld, requestSession, requestLanguage, requestKinds } from '../../../examples/request-app.mjs';
import { triage, checkHonest, rankNeeds, acceptance, patchOnly } from '../../lib/honest.mjs';
import { smellsOf } from '../../lib/smells.mjs';

const language = await requestLanguage();
const rows = [];
if (!language) console.log('(the published worlds cannot be read here: step 1 is skipped)');
else {
  const kinds = await requestKinds();
  const TURNS = { sketch: ['draw a sketch, not circles', 'draw 3 small red circles in the top left', 'blorp a picture', 'draw a picture about bees', 'connect the circles'], notes: ['write a short note about bees', 'write a note about frogs in red', 'write a long note in a grid'], garden: ['add a fish', 'add 9 fish in the pond', 'add a purple bird', 'plant a tree'] };
  for (const [world, text] of [['sketch', SKETCH], ['notes', NOTES], ['garden', GARDEN]]) {
    const s = requestSession(exampleWorld(text), { language, catalog: [language, kinds], revisions: language });
    for (const turn of TURNS[world]) {
      const r = s.say(turn);
      for (const t of triage(r.request, r.plan)) rows.push({ id: `${world}-${rows.length + 1}`, turn, world, ...t, real: false, seen: 1, since: '2026-11-15' });
    }
  }
}
console.log(`(1) honest list: ${rows.length} rows; problems: ${checkHonest(rows).length}`);
for (const r of rows.slice(0, 6)) console.log(`  ${JSON.stringify({ turn: r.turn, world: r.world, stage: r.stage, piece: r.piece, needs: r.needs })}`);
console.log('(2) what to work on (pieces ranked by turns unlocked; piece "none" = a correct named refusal, not work):');
for (const g of rankNeeds(rows)) console.log(`  ${String(g.real + g.synthetic).padStart(2)} turns, ${g.worlds.length} world(s)  [${g.piece}] ${g.needs}`);
console.log(`  correct refusals left out: ${rows.filter((r) => r.piece === 'none').length}`);

// (3) three proposals, as a reviewer meets them
const PROPOSALS = [
  { title: 'read "blorp" as make in the sketch world', change: { code: "if (text === 'blorp a picture') request.act = 'make';\nrequest.unread = [];" }, generic: false },
  { title: 'an alternation learnt from one pair', change: { operators: [{ from: '{x1} did {x2} leave', to: '{x1} <attr> {x2} <kind> left', support: 1 }] }, generic: false },
  { title: 'honours rows for remove/change/connect, read by the planner like make (declaration + the same mechanism)', change: { world: '@h.remove std.schema.honours world=sketch act=remove on=kind on=count of=circle of=square of=triangle' }, generic: true },
];
const turns = rows.map((r) => r.turn), worldIds = ['sketch', 'notes', 'garden'];
console.log('(3) review:');
for (const p of PROPOSALS) {
  const smells = smellsOf(p.change, { turns, worldIds });
  console.log(`  ${smells.length ? 'PATCH?' : 'clean '} ${p.title}${smells.length ? `: ${[...new Set(smells.map((s) => s.smell))].join(', ')}` : ''}`);
}
// the acceptance rule, both phases, on an illustrative before/after
const won = Array.from({ length: 9 }, (_, i) => ({ turn: `won ${i}` }));
const lost = [{ turn: 'a case won by a phrase rule', patchOnly: patchOnly({ passesWithout: false }), needs: 'needs a cue in the language world' }, { turn: 'a case the generic reader won before', patchOnly: patchOnly({ passesWithout: true }), needs: 'needs a slot for place on the kinds made' }];
console.log(`  acceptance, transition: ${acceptance('transition', { won, lost }).why}`);
const st = acceptance('steady', { won, lost: lost.filter((x) => !x.patchOnly) });
console.log(`  acceptance, steady:     ${st.accept ? 'accept' : 'reject'}: ${st.why}`);
