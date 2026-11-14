---
name: consolidate
description: The periodic learning cycle: ingest new failures, freeze held-out rows, run improve-world-from-failures and learn-language-rules, rerun the measures and the learning curve, and open the changes for review in each repository with the before / after table; stop when the held-out curve does not rise. Use on a schedule, or when enough new failures have arrived.
---

# Consolidate

## Parameters

- `LIB`, `KNOW` (the commits in `LIB/repos.pin`), `HOST`, as in the other skills.
- A batch of new failures, and the host's measures: its case corpus, held-out set and
  learning curve.

## Steps

1. **Ingest** the new failures into the host's ledger (`ledgerAppend`: append only).
2. **Freeze** a held-out share of the new rows before anything is learnt.
3. **Learn.** Run `improve-world-from-failures` and `learn-language-rules` on the rest. Each
   proposes changes with their support.
4. **Measure before and after** with `ablation(cells, run, { before, after })` on the
   held-out rows. Also rerun the host's corpus and learning curve.
5. **Keep a change only when the held-out share rises and nothing right turns wrong**
   (`buys.after.losses` is empty).
6. **Open the changes for review** in each repository they belong to, with the before /
   after table.
7. **Stop** when a cycle does not raise the held-out curve, and write what was tried.

## May change / must never do

- May open changes in each repository for review.
- Never merge its own changes unreviewed, never move rows between training and held-out
  after the freeze, never tune on held-out rows.

## Dry run

```
node skills/consolidate/scripts/dry-run.mjs
```

On psys2's form pairs (read against k.animals): the held-out half is frozen and fillers are
learnt from the other half. The held-out variants are then read before and after the
canonicalise step, and the run says keep or do not keep.
