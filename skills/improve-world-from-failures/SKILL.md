---
name: improve-world-from-failures
description: Take failures (ledger or case-corpus rows with the user's expectation), group them by cause and pipeline stage, decide where each fix belongs (knowledge world, world schema, language world, library mechanism, application), and make the smallest general change, gated on held-out rows and cousins. Use when a batch of failures arrives.
---

# Improve a world from failures

## Parameters

- `LIB`: this repository.
- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`.
- `HOST`: the application, with its failures (ledger rows: text, world, stage, the user's
  expectation) and its held-out rows.

## Steps

1. **Load the failures** as ledger rows. Freeze the held-out rows first.
2. **Group by stage and cause** with `ledgerGroups(rows, { signals })`:
   - a stage: reading, routing, filling, acting, replying (`stageOf`);
   - a cause: a named signal, such as the family of the form edits between a failing variant
     and its canonical sentence (`formEdits` + `familyOf`).
3. **Decide where each group's fix belongs.** Take the largest group first.
   - a filler or an extra clause → the language world (a filler word, a splitter);
   - an alternation → the language world;
   - a content word → `k.words`;
   - a value or a fact → the knowledge world;
   - a kind or a slot → the world schema;
   - a missing mechanism → the library;
   - a host's own wiring → the application.
4. **Expand one example of the group into its cousins** first (skill
   `expand-and-test-case`), so the fix is judged on cousins, not on the case.
5. **Make the smallest general change**: a rule at the common ancestor (`learnRules`), an
   operator (`learnFormOperators`), a fact. Never a phrase-specific rule.
6. **Gate it.**
   - On the case corpus, no right answer turns wrong.
   - The held-out rows are untouched and do not drop.
   - The cousins at degree 1–2 pass.
   - The invariants hold.
   - What it buys is measured with `ablation` (before / after).
7. **Write the lesson** in the repository the change went to (`docs/lessons.md`).

## May change / must never do

- May change the repository the fix belongs to, through its own review.
- Never phrase lists, never editing tests or held-out rows to pass, never restricted data.

## Dry run

```
node skills/improve-world-from-failures/scripts/dry-run.mjs
```

Read against k.animals, the variants of psys2's form pairs that the world reads differently
from their canonical sentences are the failures. They are grouped by the family of their
edits, each group with the place its fix belongs.
