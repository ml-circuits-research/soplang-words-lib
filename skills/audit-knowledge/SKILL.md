---
name: audit-knowledge
description: Check and add knowledge facts generically. Sample model-labelled facts (named=model), first those the planner reasons with (the kind facts deduceState reads: k.commonsense, k.scenes, k.kinds) and those honest-list rows need. Check them against sourced facts and sources, then fix, flag or add them in the knowledge repository, by kind and key, never to make one turn pass. Use when the missing piece is a fact, or when model-labelled facts need checking.
---

# Audit knowledge

Knowledge is a generic piece: one fact about a kind serves every world that has things of that kind
(`kindFactsOf` → `deduceState` in planRequest's cycle; value types joined by key in `readRequest`). So a fact
is checked by what it claims about the kind, not by the turn that needed it.

## Parameters

- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`, read in place.
- `LIB`: this repository, for its readers (`catalogWorld`, `measuresOf`, `kindFactsOf`, `KIND_FACTS`).
- `HOST`: honest-list rows with `piece: knowledge` (optional).

## Steps

1. **Choose what to audit**, most used first:
   - the facts the planner reasons with (`KIND_FACTS`: `at`, `place`, `made_of`, `is_a` ...), because a wrong
     one ranks every plan wrong in every world;
   - facts that honest-list rows need;
   - model-labelled facts (`named=model`) a host's answers depend on.
2. **Compare** each with what is sourced: the typical ranges (`k.attributes.range basis=source`), sourced
   numbers of the same thing, and the joins knowledge already checks. Sizes and weights spread over orders of
   magnitude, so compare on a log scale.
3. **List the farthest** for a check against a source. A far value is not wrong by itself: an elephant is far
   from the median animal.
4. **Fix, flag or add** in the knowledge repository, with the source cited. A missing fact is added for the
   kind (or its parent, so that `is_a` chaining carries it), in the type `kindFactsOf` reads. It is never added
   to the host. A value with no source stays model-labelled.
5. **Probe**: the generated properties of the live worlds that use the kind (author-live-world), and the
   honest-list rows the fact should move. Accept by the phase's rule (README, Acceptance).

## May change / must never do

- May propose fixes and additions to the knowledge repository, each with its source.
- Never replace a model value by another model value, never copy restricted data, never drop the
  `named=model` mark without a source, never add a fact about one particular thing to make one turn pass.

## Dry run

```
node skills/audit-knowledge/scripts/dry-run.mjs 10
```

It checks the model-labelled animal numbers of k.attributes against the sourced animal ranges and lists the
farthest to check.
