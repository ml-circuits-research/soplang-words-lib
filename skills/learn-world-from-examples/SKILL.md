---
name: learn-world-from-examples
description: From a description and example requests or facts, write a new live world in std.schema format that declares its capabilities (kinds with acts, slots with types and joins, std.schema.honours, k.expect facts), reuses knowledge worlds by key, and keeps words in the language world. Check it with author-live-world (coverage, generated properties) and with fresh probe requests read by readRequest. Use when an application needs a new world.
---

# Learn a world from examples

## Parameters

- `LIB`: this repository (std.schema, `induceSlots`, `readRequest`, `planRequest`, `capabilitiesOf`).
- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`. Reuse their kinds and values. Never
  copy a value list they already have.
- `HOST`: the application that will load the world: its description, its example requests, and the real
  turns that showed the need (honest-list rows with `piece: declaration` or `composition`).

## Steps

1. **Find what exists.** Search the catalogs for the kinds, values and published `w.*` schemas the description
   needs. Import them (`core.use`, joins by key). If another live world already has the kinds, an explicit
   composite world may be the piece instead of a new world.
2. **Propose slots** from example facts with `induceSlots`: kinds and closed sets, many-valued keys, required
   keys. A closed set the knowledge already has is a join (`type= by=`), not an enum.
3. **Declare the capabilities** ([author-live-world](../author-live-world/SKILL.md)): `std.schema.kind of=
   acts=`, `std.schema.honours act= on= of=` for every act, the wholes and parts (`k.expect.make`,
   `k.expect.part`), capacities, and the world's own `std.decide.criterion` if it ranks plans differently.
4. **Check it**: `node skills/author-live-world/scripts/dry-run.mjs`, or the same functions on the new world.
   It should have no errors, and every gap should be explained. The generated properties should hold. The
   P-properties it enables are listed.
5. **Probe** with requests written without seeing the schema, read through `readRequest` + `planRequest`. Each
   unread or unnamed turn becomes an honest-list row with its piece.
6. **Hand it over** with the coverage report, the properties and the probe results.

## May change / must never do

- May add a world schema to the host or a `w.*` schema to a knowledge repository, through review.
- Never a value list knowledge already has, never code in a world, never facts of particular things in a
  schema, never sentences or phrase patterns in the world.

## Dry run

```
node skills/learn-world-from-examples/scripts/dry-run.mjs
```

It proposes slots from 12 animals of the published k.animals and reads requests built from keys and names
against them (8/8). It then reviews the proposed slots for patch smells (none) and points to author-live-world
for the declarations.
