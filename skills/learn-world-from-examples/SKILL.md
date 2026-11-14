---
name: learn-world-from-examples
description: From a description and example requests or example facts, write a world schema in std.schema format that reuses knowledge worlds and published w.* schemas, with words, an example session and a catalog entry; measure it with requests written without seeing the schema. Use when an application needs a new world.
---

# Learn a world from examples

## Parameters

- `LIB`: this repository (std.schema, `induceSlots`, `readByTypes`).
- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`: reuse their kinds
  and values, never copy a value list they already have.
- `HOST`: the application that will load the world: its description and example requests.

## Steps

1. **Find what exists.** Search the catalogs for the kinds, values and published `w.*`
   schemas the description needs, and import them (`core.use`, joins by key).
2. **Propose slots** from example facts with `induceSlots`:
   - kinds and closed sets;
   - many-valued keys;
   - required keys.
   A closed set the knowledge already has is a join (`by=`), not a list.
3. **Write the schema** in std.schema format, with its kinds, acts, words, an example
   session and its catalog entry.
4. **Measure** with requests written without seeing the schema: `readByTypes` (or the
   host's reader) must read them with an answer.
5. **Hand it over** with the measure. Unread requests become failures for
   `improve-world-from-failures`.

## May change / must never do

- May add a world schema to the host or to a knowledge repository, through review.
- Never a value list knowledge already has, never code in a world, never facts of particular
  things in a schema.

## Dry run

```
node skills/learn-world-from-examples/scripts/dry-run.mjs
```

From 12 animals of the published k.animals, it proposes slots, then reads requests built
from keys and names against them.
