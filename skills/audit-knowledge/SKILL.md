---
name: audit-knowledge
description: Sample model-labelled facts of the knowledge repositories (named=model), check them against sourced facts (typical ranges, sourced numbers) and the cited sources, then fix or flag them in the knowledge repository. Use when a knowledge world has many model-labelled facts, or when a host's answer depends on one.
---

# Audit knowledge

## Parameters

- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`, read in place.
- `LIB`: this repository, for its readers (`catalogWorld`, `measuresOf`).

## Steps

1. **Sample** model-labelled facts (`named=model`), most first where a host's answers
   depend on them.
2. **Compare** each with what is sourced: the typical ranges (`k.attributes.range
   basis=source`), sourced numbers of the same thing, and the joins the knowledge already
   checks. Sizes and weights spread over orders of magnitude, so compare on a log scale.
3. **List the farthest** for a check against a source. A far value is not wrong by itself:
   an elephant is far from the median animal.
4. **Fix or flag** in the knowledge repository, with the source cited. A value with no
   source stays model-labelled.

## May change / must never do

- May propose fixes to the knowledge repository, each with its source.
- Never replace a model value by another model value, never copy restricted data, never
  drop the `named=model` mark without a source.

## Dry run

```
node skills/audit-knowledge/scripts/dry-run.mjs 10
```

It checks the model-labelled animal numbers of k.attributes against the sourced animal
ranges, and lists the farthest to check.
