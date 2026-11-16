# English reader evaluation assets

This directory prepares the request-graph reader before grammar or repair rules are added. It is a consumer evaluation fixture, not vocabulary or a runtime sentence table. Runtime library code must never import it.

## Development evidence

`development/manifest.json` pins three existing source files to a PSys2 commit. `rows.jsonl` retains every selected row in source order and attributes its exact text, source turn/row, original Romanian text where applicable, app tab and dialogue context. It contains the complete sixteen-turn reviewed English session (including the six recorder omissions documented by its source), the twenty-eight English utterances manually identified in the later mixed-language session, and all 161 hand-glossed owner phrases. No old reader output, request key or executable check is promoted into a label.

The selected language is historical UI metadata, not a reliable language annotation. In the mixed session, English turns 14–15 and 43–51 were recorded with Romanian selected; turn 33 is Romanian despite English being selected. The manifest records the explicitly inspected English selection. Romanian-only messages without an existing reviewed English rendering are not translated by this importer.

`labels.jsonl` overlays proposed request-wire descriptions without altering source evidence. The first increment has seven proposed labels and 198 explicitly pending rows; this is not a fully annotated corpus or a reader-coverage result. Original spelling, punctuation, duplicate turns and contextual fragments are preserved. Existing-target resolution is a later stage: a request to change a circle does not claim that a circle exists. Reviewed source intent prose is annotation evidence, not an automatically generated formal oracle. `unassigned` and `outside-scope` rows stay in the inventory rather than silently disappearing from its denominator.

Each label has `gold.outcome=request` and one or more `candidates`, each containing a designated request ID and complete `std.request` wires. The field name `gold` names the evaluation interface; **these labels are proposed, not independently semantically approved**. Structural loading checks only representation consistency. Vocabulary bindings and interpretation still need review. Pending labels must never count as successful interpretations.

## Independently authored holdout

A separate agent authored `heldout/rows.jsonl` before reader rules were written. The reader author has not opened its sentence content. `heldout/manifest.json` freezes its exact SHA-256 and count. The integrity command reads it programmatically and prints only counts, structural errors and row IDs, never sentences. Do not open it during rule design, select rules from its failures, or replace its rows to improve scores.

The holdout contains twenty new sentences across drawing, diagram, documents and calendar. Its structural validity and byte freeze do **not** make it human-approved semantic gold. Independent semantic review remains pending; the primary worker records concerns privately with the reviewer. Until approval, do not use its scores as an acceptance claim. If review needs a semantic correction, retain this candidate version and publish a new explicitly versioned evaluation asset before testing; do not silently rewrite the frozen manifest.

## Commands and checks

```sh
node tools/reader-corpus.mjs check
node tools/reader-corpus.mjs verify-source /path/to/psys2
node --test test/reader-corpus.test.mjs
```

The importer reads Git objects at the pinned commit without changing the application checkout:

```sh
node tools/reader-corpus.mjs import /path/to/psys2
```

`source-digests.json` records exact source-file SHA-256 values. `verify-source` reproduces the inventory and checks both its bytes and those digests. Importing only rewrites the source inventory; it never generates gold labels or edits the holdout.

## Next implementation boundary

The existing `parseText` already composes category-level grammar and returns alternative trees. `grammarOf` can consume declared lexicon/category data, so new runtime code should not enumerate English domain words. Existing `k.words.sense` and `w.lang.en.frame` need explicit mappings to legend concepts and semantic roles; their old emitted request keys are not the new graph interface.

Two prerequisites need explicit treatment before the first complete category family:

- `parseText` tree spans are normalized token indices. The request contract uses Unicode scalar offsets in the original message. Lowercasing, multiword tokenization and optional alternation repair cannot be treated as an exact source map without preserving their correspondence.
- Selecting the green bird and making it yellow require different semantic scopes. The currently published request target has no selector graph; two simultaneous colour constraints would be wrong. These rows remain pending while the primary worker resolves that contract.

After those boundaries: start from `Message = Command | RequestFrame | Fragment`, map category-level trees to request graphs, preserve attachment/scope alternatives, and separate interpretation from instance resolution. Repair must preserve negation, numbers, quantifiers and names. The measurement interface must distinguish right description, partial, no reading and wrong description. Incorrect descriptions are a gate; successful structural loading is not an interpretation score. The learned proposer follows this baseline.
