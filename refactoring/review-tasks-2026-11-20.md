# Tasks from the external reviews (2026-11-20)

Sources: `mistral-review/` (third reading at 0.230.0, plus the uncommitted additions of 20.11: "price of migrations" and `05-datele-antrenament.md`) and `agy-review/` (Google, written against 0.225.1 and older). Both folders are deleted in the commit that adds this file; `git show 3dba853` and its parent keep the text. Every point was checked against today's code: library 0.234.0 (`c6f4a7d`), knowledge `668fc36a`, PSys2 `d3aa2095`. The agy review is old, so it was treated as low confidence: a point stays only if today's code still shows the defect. This file supersedes `review-synthesis-2026-11-19.md`. Every open item there is merged below.

Repos: L = soplang-words-lib, K = sop-knowledge-worlds, P = psys2. Sizes: XS < 30 min, S < 2 h, M half a day, L more than a day.

## Classification counts

| Review | Already fixed | Valid, open | Partially valid | Invalid | Out of scope / rejected |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mistral (47 points) | 2 | 14 | 14 | 5 | 12 |
| agy (22 points) | 6 (outdated or fixed) | 2 (duplicates of Mistral) | 7 (merged) | 1 | 6 |

## Order for the next hours

1. T1 version contract (catalog validated six releases behind)
2. T5 typed compile result with stage and candidates
3. T2 refuse mixed request packets
4. T7 move `w.legend` and `KIND_FACTS` out of `src/`
5. T9 code-point ordering
6. T3 empty-string and sync/async result fixes
7. T11 quantifier/group/selector execution matrix
8. T14 PSys2 dataset rows for refused operations, and the activation guard
9. T6 typed result references between batch entries
10. T8 boundary test and deprecation of the unused reasoning exports

## Correctness

**T1. Machine-checked version contract between L, K and P** (L, K, P; M). Sources: Mistral 01 §5, 03 "P0 versionare", README #5; agy 01 §5; synthesis row 1. Defect: K validates with `tools/sopworld/VERSION` 0.225.1 (`747b51e`) while L and the P vendor are at 0.234.0. `docs/worlds/index.json` records `"sopworld": "747b51e"`, but `createCatalog` (`src/knowledge.mjs:20`) never reads it. `repos.pin` pins K `a0e8538` and P `45ac4bf`, days behind both checkouts. Work: (a) K refreshes `tools/sopworld/` to the current build and records the version in `index.json` (`sopworldVersion`). (b) `createCatalog` exposes `catalog.engine` and accepts `minEngine`. An older catalog is refused with a stable reason (`catalog-engine-too-old`). (c) P passes its vendored release as `minEngine`. (d) L updates `repos.pin` to the current heads after the test run. Acceptance: a test in L builds a catalog index with an older `sopworldVersion` and gets the typed refusal. K `npm test` passes on the current build. P boots against the current catalog and refuses a doctored older index.

**T2. Refuse mixed request packets instead of letting branch order decide** (L; S). Sources: Mistral 01 §1 ("order is semantic"), 03 P0 IR step 4. Defect: `compilePacket` (`src/request-compiler.mjs:29-34`) returns on the first wire type it finds. A packet that holds both `std.ground.request` and `std.problem.request` silently drops the problem. Work: count the request families in the packet. If there is more than one, return `status=unavailable reason=mixed-request`, naming the families found. Keep the dispatch order declared as one table of `[wire type, method]` instead of a chain of `if`s, so a new family is one row. Acceptance: one test per pair of families gets `mixed-request`. All existing compiler tests keep their results.

**T3. Remove the two ambiguous result shapes** (L, P; S). Sources: Mistral 01 §4, README #4. Defects: (a) `src/knowledge-projection.mjs:78` returns `''` when no selection binds, so a caller cannot tell "not applicable" from "nothing found". (b) `compileRequest` returns `string`, or `Promise<string>` when any options object is passed (`src/request-compiler.mjs:16-18`). Work: (a) return `std.compile.result status=not-applicable reason=no-bound-selection`. (b) Add `compileRequestAsync(world, sop, options)`, which always returns a Promise. Document `compileRequest` with options as deprecated in `docs/api.md` and `index.d.ts`. Move the P callers (`composition-knowledge.mjs:35` is the async one). Acceptance: no `return ''` in the projection. The docs test lists the new export. The P gate passes after the call-site change.

**T4. Recheck the PSys2 grounding plan bullet against today's adapter** (P, L-doc; XS). Sources: agy 01 §1 (outdated), synthesis "Wrong or already done". The `refactoring/request-to-executable-circuits.md` bullet still says the query adapter drops `person` for "man" through a fixed edit cost. P `src/dialog/project-query-action.mjs:108` now calls `groundMention` (library `std.ground`), and `d3aa2095` says grounding follows only kind parents. Work: rerun the "man" and "cap" probes through the real Drawing route. Then rewrite or delete the bullet. Acceptance: the plan states the measured candidate list for both words.

## Generality and no hardcoding

**T5. One typed compile result, with stage, candidates and missing values** (L; M). Sources: Mistral 01 §4, 02 §4, 03 P1 "Diagnostic structurat", 04 §7; agy 01 §2 (single root), 03 §3; synthesis rows "Failures carry only a reason code" and "results API made of strings". Defect: `std.compile.result` has only `status`, `reason`, `call` and `evidence` (`src/rule-circuit-contract.mjs:17-21`). `fail('request-root')` does not name the roots. The statuses differ by branch (`compiled`, `unavailable`, `not-applicable`, and `solved|unsatisfiable|exhausted|budget` only in `std.problem.result`). Work: add the optional slots `stage` (`input|contract|admission|search|emit`), `candidate` (ref, many, each with its losing reason) and `missing` (key names). Use `std.problem.result` as the model. Add `readCompileResult(sop)`, which returns a frozen `{status, reason, stage, calls, candidates, missing, evidence}`. `request-root` names every root it found. Acceptance: each `fail(...)` site sets a stage. One test per stage. P's `readPlan` (`capability-plan-adapter.mjs`) uses `readCompileResult` instead of its own parse.

**T6. Typed result references between batch entries** (L, K; L). Sources: Mistral 02 §1, 04 §3, README #8; agy 02 §4, 04 §4; synthesis row "No typed data flow". Already planned in `request-to-executable-circuits.md` ("Connect declared data dependencies across editor tools"). Defect: `prepareRequestBatch` has only `after` (`src/request-batch.mjs:15-17`). `docs/reference.md:2122` states that no cross-entry binding exists. Work: `std.capability.operation returns=<type>` in the contract. A batch entry may carry `from=<entry>.<port>`, checked against the declared type. The emitted call references the earlier result. Acceptance: the calendar → group → chart → document case from the plan compiles to four calls with typed references. A type mismatch is refused before dispatch.

**T7. Move published domain schemas and kind sources out of `src/`** (L, K; M). Sources: Mistral 01 §3, 03 P0 "graniță", 04 §5, README #3; synthesis row "Domain knowledge embedded". Defect: `src/contracts.mjs:242` carries the whole `w.legend` module (`version=0.186.0`), and K has no `w.legend` world. `src/reason.mjs:30` `KIND_FACTS` names `k.commonsense`, `k.scenes` and `k.kinds`. Work: publish `w.legend` in K (`docs/worlds/w.legend/`). The library tests read it at the pin. `point-space.mjs` takes the schema from the loaded world. `KIND_FACTS` becomes a parameter, and its default is declared by the catalog (one `std.reason.kind.source` row per type) rather than hard-coded. Acceptance: `git grep "'w.legend\|'k.commonsense\|'k.scenes" src/` is empty. The legend and point-space tests pass with K at the pin.

**T8. Boundary test and deprecation of unused parallel engines** (L; S). Sources: Mistral 01 §2, 03 P1 "Unifică motoarele", 03 P2 API, README #2 and #7; agy 04 §1 (partly done by `std.problem`). Facts: P never calls `deduceState`, `kindFactsOf`, `induceStyle`, `induceCorrections`, `REASON_RULES`, `KIND_FACTS`, `readMotion` or `runWorldPlan` (grep over P `src worlds scripts docs/webchat`: 0 files). P does call `planRequest` (9 files), `planner` (7) and `runPlan` (5), so those stay until P's door moves to `compileRequest`. Work: (a) mark the unused exports deprecated in `docs/api.md` and `index.d.ts`, naming the replacement (`std.problem` for choice and deduction). (b) Add a boundary test: the compiler-path modules (`request-compiler`, `capability-method`, `placement-method`, `choice-method`, `ground-method`, `problem`, `rule-circuit`, `interpretation-method`, `knowledge-projection`, `request-contracts`, `request-batch`) contain no quoted `w.*`/`k.*` names. They have none today. (c) Ratchet the remaining quoted names (about 150, in 25 files, mostly `story`, `compose`, `kit`, `request` and `document`) with a per-file count that may only fall. (d) Drop "psys2 Q39" from the comment at `src/spell.mjs:1` (Mistral 01 §3), so `git grep -i psys2 src/` is empty, as AGENTS rule 5 requires. Acceptance: the test fails on a new quoted name. `api.md` has a deprecation section. The grep is empty.

**T9. Code-point ordering in decisions** (L; XS). Sources: Mistral 01 §8, 03 P2 determinism, README #10; synthesis row "Locale-dependent ordering". Defect: 15 `localeCompare` calls in `src/`. They break ties by the host's ICU collation, including in `ground-method.mjs:124,134,137` (which candidate wins) and in `turn.mjs:122-128` (stage order). Work: one `byCodePoint` comparator in `src/internal/`, used at all 15 sites. Acceptance: `git grep localeCompare src/` is empty. One test runs `ground` under `LANG=tr_TR.UTF-8 TZ=Pacific/Kiritimati` and gets the same result as under C/UTC.

## Tests

**T10. Generality probe: a new invented world needs no `src/` change** (L; S). Source: Mistral 04, "Testul final de generalitate". Work: write an example world of at most 60 lines, `example.inventory` (rule 6), with its schema, operations and `std.capability.operation` rows. Load it through `toolSession` and compile add, remove and count requests. Acceptance: the test passes without touching `src/`. Any `src/` change it forces becomes a separate defect.

**T11. Quantifier, group and selector execution matrix** (L; M). Sources: Mistral 02 §2, README #9; agy 02 §5 (partly outdated: `ordinal.list` and population expansion exist); synthesis row "Quantifier and ordinal selectors". Defect: `capability-method.mjs:105` requires `targets.length === 1` for `do`. The query path (`:529-534`) accepts only `std.request.constraint` selectors, so `std.request.quant`, `std.request.group` and `std.request.not` fall into `unsupported-query-graph`. Work: expand a resolved `quant`/`group`/`not` selector into one call per member. Add a test that enumerates each of these selector shapes × `do`/`ask` and asserts either calls or a typed refusal (with T5's stage). Acceptance: no combination returns `''`, throws, or returns an untyped reason.

**T12. Golden end-to-end replay from the PSys2 phrase log** (P; M). Sources: Mistral 02 §7, 03 P2; agy 03 §4. `d3aa2095` records asked, read, compiled and happened for each turn. Work: freeze 50–100 owner turns as a replay (text → request → calls → observed effect). Run it in the P gate with the library and catalog commits recorded. Acceptance: a change in the compiled call or the observed effect fails the replay.

## PSys2 and training data

**T13. Capability parity after the SOP-area migrations** (P; S). Source: Mistral README "Prețul migrațiilor". Partly fixed: `d3aa2095` restores the original tab UIs over the SOP areas, and `avatar.part.feature` is declared again (`worlds/ui.avatar/act-rules.sop:211`, K `668fc36a`). Still open: `document.compose`/`document.rewrite` are refused (`worlds/docs.editor/act-rules.sop:967-973`), and blink/talk do not use the published `std.motion`. Work: one table per tab listing operations before and after, with the owner decision for each loss recorded in `questions.md`. Acceptance: no refused operation without a recorded decision.

**T14. Training rows for refused operations, and the activation guard** (P; S). Source: Mistral `05-datele-antrenament.md` §4 and its fixes 1 and 3. Defect: about 108 `document.compose`/`document.rewrite` rows in `official-dataset` (from `ui-coverage-v2`) train the reader on operations the Documents area refuses. Work: relabel them as conscious refusals (the refusal is the gold label) or keep them out until a rule exists. Add a check in `official-dataset/build.py`, or before activating the reader, that compares the inventory with the operations each area refuses. Acceptance: the build fails on a refused operation that still has positive labels.

**T15. Remove the legacy PSys2 modules from their last importers** (P; M). Sources: agy 02 §6; synthesis "Partly true". `src/formalizer` and `src/translate` (11,196 lines) are still imported by 10 files (`cli.mjs`, `dialog/dialogue.mjs`, `discourse.mjs`, `index.mjs`, …). Work: one importer at a time. Acceptance: `git grep -l "formalizer/\|translate/" src` lists only the two folders, then they go.

**T16. Keep ranked readings in the turn journal** (P, L; M). Sources: synthesis "Partly true" (Review29); agy 01 §6. `std.choice` and `std.ground` return alternatives and ties. Work: the turn journal stores them, and "no, the other one" moves to alternative 2 without a new reading. Acceptance: a probe with three circles and "no, the other one" selects the second-ranked circle.

## Performance (measure first)

**T17. Lazy vocabulary lookup** (L, K, P; M, only if measured). Sources: Mistral 02 §5, 03 P1 step 4; agy 03 §2. Fact: `createCatalog` takes the whole `vocab` object (`src/knowledge.mjs:20`), and K ships `vocab.json` 3.5 MB, `vocab-kinds.json` 4.9 MB and `index.json` 1.8 MB. Work: first measure the bytes and time of the first word in P's browser start. If vocabulary is a significant share, `vocab` may be a function `(word) => shards | Promise`, and K publishes prefix shards. Acceptance: the measured bytes for one word before and after, in the log.

## Rejected or not acted on

| Point | Review | Reason |
| --- | --- | --- |
| Zero git tags | Mistral 01 §5 | AGENTS rule 3: versions are in `package.json`/`docs/version.md`, not tags. |
| npm package, semver ranges, lockfile, CI matrix N-2 × M-1 | Mistral 03 P0, 04 §8 | Owner rules: zero dependencies, one built file, pinned commits. T1 covers the real defect. |
| Monorepo / `@sopworld/*` packages | agy 03 §1, Mistral 04 §8 | Same rules; three repositories with separate owners. |
| Subpath exports and an API cut to 30–40 names | Mistral 01 §6, 03 P2 | One built file. Reduced to deprecation (T8). |
| `toLowerCase` 173 calls are locale-dependent | Mistral 01 §8 | Wrong. `String.prototype.toLowerCase` ignores the locale (only `toLocaleLowerCase` uses it): `"I".toLowerCase()` is `"i"` under `tr_TR` too. |
| `Date` 14 calls undermine determinism | Mistral 01 §8 | Wrong. Calendar code uses `Date.UTC`/`getUTC*` only. The rest are budget clocks (`budget.mjs`, `kit.mjs`, `problem.mjs`), which are wall time by contract. |
| `index.d.ts` kept in sync by hand, can diverge | Mistral 02 §6, 03 P2 | Wrong as stated: `test/docs.test.mjs:114` fails when `api.md`, `index.d.ts` and the exports disagree. |
| `compileRequest` parses twice before `tell` | Mistral 03 P2 step 3 | Wrong: `request-compiler.mjs:63` and `choice-method.mjs:78` pass the parsed array to `tell`. |
| Knowledge projection needs a snapshot/stamp check across `await` | Mistral 03 P1 step 3 | Wrong: the plan and bindings are computed before the `await`, and nothing reads `world` after it (`knowledge-projection.mjs:73-110`). |
| Compile cache keyed on world stamp | Mistral 02 §5, 03 P1 | No measurement shows compilation dominates (turns 0.8–1.5 s). Measure first. |
| `world.fork` allocations, "80% less" | agy 03 §5, Mistral 03 P2 step 4 | Unmeasured; Mistral itself says benchmark first. `npm run bench` exists. |
| Benchmark regression gate in CI | Mistral 03 P2 | No failing requirement; `npm run bench` exists. |
| Shard hashes, signatures, provider trust policy | Mistral 02 §8 | Catalogs are read at pinned commits from known origins. No failing requirement. |
| Z3 WASM as a network dependency | Mistral 02 §5, 01 §6 | By design: lazy load, `provider=internal` fallback without isolation. |
| No default language / LanguagePack | Mistral 04 §5 | Owner decision: only English is in the core; other languages are the application's business. |
| Time/space/quantity as separate theories | Mistral 04 §6 | They exist as `cycles`, `point-space`, `builtins` quantities. No failing case was given. |
| Full IR + six-phase pipeline (2–3 weeks) | Mistral 03 P0 | Too large for these hours. T2 and T5 are its first verifiable steps. |
| Changelog by theme with a breaking section | Mistral 03 P2 | Reduced to the deprecation section (T8). |
| Synthetic caps (82% of `main-synthetic` dropped), nuance fields removed from labels | Mistral 05 §1-2 | Editorial and by-design choices recorded in `MANIFEST.json` and `3aa05743`; the owner's call. |
| `avatar.part.feature` trained but refused | Mistral 05 §4 | Fixed: P `2fc5ad59`, `worlds/ui.avatar/act-rules.sop:211`; K `668fc36a`. |
| Placement: one relation, two targets, no solver | Mistral README; agy 01 §3, Top-10 #3/#7; synthesis | Fixed: `problemPlacement` (`src/placement-method.mjs:264-323`), 0.226–0.234. |
| Drawing/Diagram/Documents state in JS; `KIND_WORDS` | agy 02 §1, 01 §1; synthesis | Fixed: all five tabs on SOP areas (P `d4918747`, `d3aa2095`). `KIND_WORDS` only remains as display words in P `src/knowledge/time.mjs`. |
| Fixed edit cost drops "man → person" | agy 01 §1, 04 §3 | Fixed by `std.ground` (0.225), used by P's query adapter. T4 updates the plan text. |
| HTN planner unused by PSys2 | agy 02 §3 | Wrong: P `src/plan/host.mjs` builds `lib.planner`, and `planRequest` is used in 9 P files. |
| Catalog at 0.144 | agy 01 §5 | Outdated number (now 0.225.1); the drift itself is T1. |
| 28 build scripts, 3 GB RAM guard in K | agy 01 §4, 03 §2 | Out of scope here: true (30 steps, `SKW_MIN_FREE_MB` 3000), but these are source importers in K's own lane. No failing requirement. |
| SQLite/IndexedDB binary index | agy 03 §2 | Zero dependencies; T17 covers the measured part. |
| SOP-BERT single target / single anchor | agy 02 §2 | Not checked against reader v6 (official-dataset); P's training lane. |
| Gärdenfors conceptual spaces | agy 04 §2 | Partly delivered (`operator=degree` with catalog factors, 0.230; `w.legend` spaces). No current failing case. |
| `ont.*`/`host.*` namespace reorganisation | agy 04 §5 | Churn without a failing requirement; `core.schema.link` already checks references. |
| "61 baseline cases, mocked" | agy 03 §4 | Not a defect claim about today's gates (L 1047 tests). The real gap is T12. |
