---
name: improve-world-from-failures
description: Triage failing turns (phrase logs, the owner's sets, ledger rows) by the evidence the request architecture carries (readRequest unread and spell asks; planRequest notHonoured codes, cannot, rejected) to the generic piece each needs (declaration, knowledge, language, composition, method, library). Build the piece with the skill of its class, or list the turn honestly as "needs <generic piece>". Never a rule fitted to the failing family. Use when a batch of failures arrives.
---

# Improve worlds from failures

Failures are evidence of a missing generic piece, not targets. This skill finds the piece; it does not fit a
rule to the cases.

## Parameters

- `LIB`, `KNOW` (the commits in `LIB/repos.pin`), `HOST` as in [README.md](../README.md).
- The failing turns, with the world open when each was said and, when known, what the user wanted.
- The host's honest list ([HONEST-LIST.md](../HONEST-LIST.md)).

## Steps

1. **Replay each turn on the generic path.** `readRequest(world, text, { language, catalog, dialogue, spell:
   true })`, then `reviseRequest`, then `planRequest(live, request, { catalog, dialogue })`. Patches (legacy
   readers, case-fitted rules) are off, so the replay shows what the generic path does.
2. **Triage by evidence, not by sentence** (`triage(request, plan, { expected })` in `skills/lib/honest.mjs`):
   - `unread` at the act: the act word is missing (language: a `k.actions` verb, a word of the world's action);
   - other `unread`: a cue, kind word or value word (language), or a kind or value no declared world has;
   - `spell.asks`: near words to choose between (library: a prior from the dialogue or the state);
   - `notHonoured` `not_declared`: a correct named refusal, unless the user expected it (then a declaration);
   - `no_slot`: the world honours a key nothing takes (declaration: a slot);
   - `value`: a value outside the slot's domain (knowledge: a join by key instead of an enum);
   - `no_kind`: a kind this world lacks (declaration, or an explicit composition);
   - `cannot`: a refusal with its reason; if the user expected a result, a planning method (more candidates,
     plan repair) is the piece;
   - what the evidence does not explain (a wrong reading that read everything, a wrong plan that was
     honoured): `piece: unknown`, to [propose-generic-method](../propose-generic-method/SKILL.md).
3. **Write the rows** on the honest list with `needs <generic piece>` (`checkHonest` must report no problem).
4. **Rank** with `rankNeeds`: the piece that unlocks the most real turns first, then the most worlds.
5. **Build the top piece with the skill of its class** (README, "The cycle"): author-live-world,
   learn-language-rules, audit-knowledge, or propose-generic-method. One piece per change.
6. **Review** the change with the patch-smell checklist (`node skills/propose-generic-method/scripts/smells.mjs
   <range> <honest.jsonl> <world ids>`), and answer each hint.
7. **Accept** by the phase's rule ([README.md](../README.md#acceptance-two-phases)):
   - transition: a lost case that passed only by a patch (it fails with the patches off; `patchOnly`) does not
     count; every other loss goes on the list;
   - steady: at least 10 real turns won per 1 lost, net, every loss listed; otherwise a written argument.
   The gates are the generated properties over the declared worlds, fresh probes, and the list shrinking;
   counts are reported.
8. **Log** in the repository the piece went to: the piece, the rows it removed (`honestDelta`), the rows it
   added, the commands.

## May change / must never do

- May change the repository the piece belongs to, through its own review; may add rows to the honest list.
- Never a rule learnt from the failing family and put in the host, never a phrase list, never a fallback that
  hides an unread word, never editing tests or sets to pass, never restricted data.

## Dry run

```
node skills/improve-world-from-failures/scripts/dry-run.mjs
```

(A) Turns over the three invented worlds of `examples/request-app.mjs` are triaged by their request evidence.
(B) psys2's form pairs, read through the older `readByTypes` on k.animals, are grouped by the family of their
edits, and each family is mapped to the piece it needs. The rows are checked and ranked. Last run: (A) 5 rows,
(B) 512 rows from 565 pairs, 0 problems. The top pieces were clause splitting as a reader source (190 turns),
skip words (131) and alternations (110 + 72).
