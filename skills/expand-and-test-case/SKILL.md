---
name: expand-and-test-case
description: Turn one failing example (a sentence and its expected frame, or a ledger row) into its related cases, test a host on them per distance and axis, and hand the failures to learnRules for a rule at the common ancestor. Use before fixing any case, so the fix is judged on related cases, never on the case alone.
---

# Expand and test a case

A case is never single. Its related cases are perturbations of it along named axes
(metamorphic testing; see `LIB/docs/generalisation.md`): go up d layers of abstraction, then
down d (distance d), along kind, role, key, and, as the knowledge repository publishes them,
act family, alternation and world structure. A fix is general when its related cases pass,
not when its case passes.

## Parameters

- `LIB`: this repository (sopworld). Its `tools/generalisation-test.mjs` and `src/` are used.
- `KNOW`: the knowledge repository at the commit pinned in `LIB/repos.pin`. Its kinds,
  aspects and act families are the edges of the graph. Read it in place, never copy it.
- `HOST`: the application under test. It provides `host(text, frame) -> answer` (the
  adapter) and the world the case lives in.

## Steps

1. **State the example.** Give `{ text, frame }`, where `frame` is what the world computes
   (`readByTypes(world, text).best`, or the ledger row's expected act). Check that the
   world answers it. If it does not, the example is wrong, not the host.
2. **Expand.** `generalisationTest(world, example, host, { distance: 3, edges, read })` from
   `LIB/tools/generalisation-test.mjs`.
   - `edges` names the axes: `{ kind: 'kind', is_a: 'kind', role: 'role', ... }`,
     from the keys the knowledge uses.
   - Only valid related cases are kept: each has an answer in the world, reads back to the
     same frame, and is not a known case. The world and its schemas filter the absurd ones.
3. **Read the table.** One row per distance × axis, with pass/of and failing texts. The
   pattern line names the gap:
   - "passes when kind changes, fails when role changes": a gap along role;
   - fails along every axis: the host fits only the example (a point fix).
4. **Force the generalisation.** Collect the failing related cases of the broken axis as
   cases `[{ text, frame }]`. Run `learnRules(world, cases, { heldOut, related })`.
   - It anti-unifies them with `induce`, lifts the filler to its kind, and judges the rule
     on held-out cases and related cases on a fork.
   - Admit only a rule with `admitted: true`.
5. **Rerun step 2** with the rule in the host. Keep the rule only if the related cases at
   distance 1–2 now pass and the host's held-out curve does not drop.
6. **Write it down.** Write the table before and after, the rule and its support in the
   host's log. Every number comes from a command.

## Dry run (no host needed)

```
node LIB/tools/generalisation-test.mjs
```

On its toy farm world, a host that knows only cows breaks along kind, role and key
(share 0). `readByTypes` as the host passes every related case (share 1).

## Do not

- Fix the case alone and call it done.
- Write related cases by hand: they come from the world, so they stay valid when the world
  changes.
- Copy knowledge from `KNOW` into `HOST` or `LIB`; read it at the pinned commit.
