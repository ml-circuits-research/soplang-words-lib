---
name: consolidate
description: The periodic cycle on the honest list. Bring in new real turns (nothing held back from learning), triage them, choose the generic piece that unlocks the most real turns, build and review it, then measure once. The gates are properties generated from the declared worlds, fresh probes with new sentences, and the honest list shrinking; acceptance follows the two-phase rule (transition, then steady with 10 won per lost). Row counts are reported, never gating. Use on a schedule, or when enough new turns have arrived.
---

# Consolidate

## Parameters

- `LIB`, `KNOW` (the commits in `LIB/repos.pin`), `HOST`, as in [README.md](../README.md).
- The new real turns since the last cycle (phrase logs, the owner's sets), and the honest list.

## Steps

1. **Bring in** the new turns, all of them. Learning uses every turn. Overlap between what is learnt from and
   what is measured is acceptable: a contaminated probe set is replaced by a fresh one, and nothing is frozen
   or held back (the host's data principle).
2. **Triage** them with [improve-world-from-failures](../improve-world-from-failures/SKILL.md): new rows on
   the honest list, each with its `needs`.
3. **Choose one piece**: the top group of `rankNeeds` whose piece can be built (most real turns, then most
   worlds). If the top piece is `unknown`, the cycle's work is to name it with
   [propose-generic-method](../propose-generic-method/SKILL.md).
4. **Build it** with the skill of its class. Pending changes to rules, data or the runtime land first, so that
   one combined measurement follows (no compute spent on results that pending work will invalidate).
5. **Review** it: the patch-smell checklist on the diff, and the adversarial questions of
   propose-generic-method (is it generic? does it name a world, a sentence or a test? would it survive a new
   world or a new language?).
6. **Measure once**:
   - the **properties** generated from the declarations of every live world (author-live-world's
     `generatedProperties`, P1-P11);
   - **fresh probes**: new sentences generated from the declarations and the language world, or written after
     the change by someone who did not see it;
   - the **honest list**: rows that left by the piece, rows that came (`honestDelta`);
   - the corpora and curves, **reported**.
7. **Accept** by the phase's rule ([README.md](../README.md#acceptance-two-phases)):
   - transition (now): a lost case that passed only by a patch does not count. To tell, run it with the
     patches off: if it fails there, it is patch-only (`patchOnly`). Every other loss is listed;
   - steady (patches gone): a regression needs very good arguments; a loss is acceptable only for at least 10
     real turns won per 1 lost, net, each loss listed as "needs <generic piece>".
8. **Open the change for review** in its repository, with the measurement and the rows moved.
9. **Write** what was tried, including pieces that did not land and why.

## May change / must never do

- May open changes in each repository for review; may add and remove honest-list rows by the rules of
  [HONEST-LIST.md](../HONEST-LIST.md).
- Never merge its own changes unreviewed, never hold data back from learning to keep a measure pure, never
  gate on a row count alone, never edit a probe or a test to pass.

## Dry run

```
node skills/consolidate/scripts/dry-run.mjs
```

One cycle on psys2's form pairs (read in place, against k.animals). The piece is a language piece: filler
words learnt from all the pairs. The review refuses the proposals that the knowledge knows as content words (a
verb, a colour). It is measured (a) on all pairs (reported), (b) on fresh probes built from the published
`w.lang.en.skip` words and joins of canonical sentences, and (c) by the honest list. The acceptance rule is
applied in both phases. Last run: proposed um, hey, you, blue, add, of, it, too; refused you, blue, add, of.
(a) 253 → 286 / 500; (b) 84 → 89 / 96; (c) 247 → 214 rows (33 left, 0 came); accepted in both phases.
