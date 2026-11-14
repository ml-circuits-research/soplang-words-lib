---
name: expand-and-test-case
description: Turn one failing example (a sentence and its expected frame, or a ledger row) into its cousins, test a host on them per degree and dimension, and hand the failures to learnRules for a rule at the common ancestor. Use before fixing any case, so the fix is judged on cousins, never on the case alone.
---

# Expand and test a case

A case is never single. It has siblings (the same structure with other fillers, degree 1) and
cousins (up k layers of abstraction, then down k, degree k) along several dimensions: kind,
role, key, and, as the knowledge repository publishes them, act family, alternation and world
structure. A fix is general when its cousins pass, not when its case passes.

## Parameters

- `LIB`: this repository (sopworld). Its `tools/cousins-test.mjs` and `src/` are used.
- `KNOW`: the knowledge repository at the commit pinned in `LIB/repos.pin`. Its kinds,
  aspects and act families are the edges of the graph. Read it in place, never copy it.
- `HOST`: the application under test. It provides `host(text, frame) -> answer` (the
  adapter) and the world the case lives in.

## Steps

1. **State the example.** Give `{ text, frame }`, where `frame` is what the world computes
   (`readByTypes(world, text).best`, or the ledger row's expected act). Check that the
   world answers it. If it does not, the example is wrong, not the host.
2. **Expand.** `cousinsTest(world, example, host, { degree: 3, edges, read })` from
   `LIB/tools/cousins-test.mjs`.
   - `edges` names the dimensions: `{ kind: 'kind', is_a: 'kind', role: 'role', ... }`,
     from the keys the knowledge uses.
   - Only valid cousins are kept: each has an answer in the world, reads back to the same
     frame, and is not a known case. The world and its schemas filter the absurd ones.
3. **Read the table.** One row per degree × dimension, with pass/of and failing texts. The
   pattern line names the gap:
   - "passes when kind changes, fails when role changes": a gap along role;
   - fails at every dimension: the host fits only the example (a point fix).
4. **Force the generalisation.** Collect the failing cousins of the broken dimension as
   cases `[{ text, frame }]`. Run `learnRules(world, cases, { heldOut, cousins })`.
   - It anti-unifies them with `induce`, lifts the filler to its kind, and judges the rule
     on held-out cases and cousins on a fork.
   - Admit only a rule with `admitted: true`.
5. **Rerun step 2** with the rule in the host. Keep the rule only if the cousins at degree
   1–2 now pass and the host's held-out curve does not drop.
6. **Write it down.** Write the table before and after, the rule and its support in the
   host's log. Every number comes from a command.

## Dry run (no host needed)

```
node LIB/tools/cousins-test.mjs
```

On its toy farm world, a host that knows only cows breaks along kind, role and key
(share 0). `readByTypes` as the host passes every cousin (share 1).

## Do not

- Fix the case alone and call it done.
- Write cousins by hand: they come from the world, so they stay valid when the world
  changes.
- Copy knowledge from `KNOW` into `HOST` or `LIB`; read it at the pinned commit.
