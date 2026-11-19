# Skill: generate-reader-datasets

Use this skill to generate training datasets that map **natural language to wire-level UI
requests** for a SOP-Worlds application (reader + cutter training: splitting long
sentences into clear intents and formalizing requests as wires). It is the reusable
source of truth for corpus expansion: the seeds come **systematically from the
application's declared native operations** (the inventory of tool wires the UI can
trigger), not from someone remembering sentences.

## When to use

- Preparing a new SOP-BERT training round and the existing corpus lacks coverage,
  naturalness diversity or register variety.
- A new editor/world shipped: its operations must enter the dataset without new
  hand-collected examples.
- You need a diversity matrix (operation × parameter × tier × register) rather than
  "we wrote some sentences".

## Inputs

1. **Native inventory** — a JSON file, `nativeInventory` layout (as published by the
   psys2 coverage tooling; the shape any application can emit):
   `{"<area>": [ { id, act, on, params: { <name>: {type, required, enum?, min?/max?, default?} }, requires, scope } ]}`.
   This file IS the systematic wire source: nothing may be generated outside it.
2. **Phrasing table** (optional) — per area: canonical templates by act and per-area
   noun phrasing. Sensible defaults exist for drawing/diagram/document/calendar/avatar;
   a new world supplies its own table when its nouns differ.

## Steps

1. **Enumerate seeds** (`scripts/enumerate.mjs`): for every operation, emit seeds —
   one per meaningful parameter combination (required set + pairwise optional
   subsets × a value grid over enums/ranges), deterministic order, capped by
   `--max-per-op`. Each seed carries: canonical text, the target (kind/mode), the
   constraint wires (`key`, canonical `value`, `surface`, `phase` selector|result,
   `optional`), the executed-tool reference it will claim, and a stable `seedId`.
   Seeds are INPUT EXAMPLES' skeletons: labels derive from them, never from the
   paraphraser.
2. **Select an authoring subset** (deterministic: round-robin by area, calendar and
   thin ops boosted) — `--select N`.
3. **Author variants** — agents write, for every selected seed, **12–24 human
   variants** in three tiers (equivalent / complex / simplified), as small JSON
   records: the variant text plus, per constraint, the surface actually used (or
   `null` for a dropped optional, `{"vague": "..."}` for a blurred one). The
   assembler recomputes spans and labels; the authors never write label positions.
4. **Assemble and validate** (`scripts/assemble.mjs`): span = first verbatim
   occurrence of each claimed surface (more than one occurrence → the example is
   quarantined, not silently labeled); mandatory constraints and the act/target kind
   are immutable — a variant that breaks them is rejected with a reason; duplicates
   (within the set and against `--reject-from` corpora) are dropped; output format is
   the `ui-human-example` schema (same fields), `format` string marks this generator.
5. **Report the matrix** (`scripts/matrix.mjs`): rows per operation and area × tier
   × registers actually reached; the report is the diversity measure — first-word
   counts are reported, never used as the measure.

## Must never

- **No prescribed filler lists.** The known failure of the first human-paraphrase
  corpus was prescribed fillers ("um, actually, ok…") — agents executed the list and
  the corpus carried `um` once per seed. Vary registers by instructing *variation*,
  not by enumerating words; the assembler's report surfaces any word that dominates.
- **No invented values.** Constraint values come from the seed and the declaring
  operation's enums/ranges. A paraphrase may drop or blur an optional value
  (recorded as `completion.requirements`, never as gold), never invent one.
- **Mandatory constraints (required:true params, selectors, act, target kind) are
  never dropped, blurred or swapped.**
- **Seed skeletons are copied, never re-authenticated by the label pipeline.** If a
  recipe's execution is claimed, the claim must come from a tool-recorded source
  (the inventory's executed recipes); synthetic seeds are marked `executed: false`
  and their `nativeTool` stays null — the README must say which subsets were
  execution-verified and which were only structurally validated.
- **Cohort hygiene:** variant splits by seed (one seed's variants never straddle
  train/dev partitions). The assembler writes `cohort` fields for this.

## Dry run (no host needed)

On the psys2 coverage inventory (124 native operations), the enumerator emits the
full seed inventory deterministically; a `--max-per-op 6 --select 120 --area all`
run produces a balanced authoring subset with calendar boosted from 14% to ~25% of
seeds. The assembler, fed hand-made variants for three sample seeds (including one
deliberate duplicate and one blurred optional), rejects the duplicate, quarantines
the double-occurrence surface, and emits the rest with spans recomputed — verified
in the psys2 dataset build of 2026-11-19.
