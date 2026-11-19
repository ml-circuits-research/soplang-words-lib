# External reviews, checked against the code (2026-11-19)

The owner added two external reviews (`agy-review/`, `mistral-review/`, in Romanian). Each claim was checked against the three repositories: the library (L), the catalog (K) and PSys2 (P). Only the verified points go into plans.

## Confirmed and planned

| Claim | Evidence | Planned action | Repo |
| --- | --- | --- | --- |
| The catalog is validated with sopworld 0.144 while the app runs 0.225, so catalog tests prove nothing about the engine in use | `K/tools/sopworld/VERSION` | Validate the catalog with the current release, and have P refuse a catalog built with an older engine | K, P |
| Drawing and Diagram keep their state and undo history in JavaScript | `P/worlds/art.draw/board.mjs`, `engine.mjs` 2,088 lines | Move each tab onto the generic SOP area (done for Avatar on 2026-11-19); delete the JS history | P |
| Kind words are tables in JavaScript | `P/worlds/art.draw/engine.mjs:44` `KIND_WORDS`, `diagram.sketch/refs.mjs:17` | Ground kind words through the catalog with `std.ground`; delete the tables | P |
| Placement takes one relation and two targets and does not use the solver | `placement-method.mjs:59,62`; `solve.mjs` unused by the methods | N relations as constraints over candidate positions, searched through `solve.mjs` | L |
| No typed data flow between tool calls (calendar → chart → document) | `request-batch.mjs` has only `after` ordering | `std.capability.operation` declares `returns`; batch entries reference earlier results by type | L, K |
| Quantifier and ordinal selectors are declared but not executed | `request-contracts.mjs:64,90`; `capability-method.mjs:466` stops with `unsupported-selector` | Expand a resolved selector into one call per member | L |
| Failures carry only a reason code | `std.compile.result reason=…` | Add `stage`, `candidate` and `missing` to `std.compile.result` | L |
| Domain knowledge embedded in the library | `contracts.mjs:240` (`w.legend` text), `reason.mjs:44` `REASON_RULES` | Move them into catalog worlds the library loads | L, K |
| Locale-dependent ordering | 15 `localeCompare` calls in `src/` | Code-point ordering; a test under another `TZ`/`LANG` | L |
| A results API made of strings (and a Promise only when options are passed) | `request-compiler.mjs:16` | A typed result object beside the SOP text | L |

## Partly true

- The compiler accepts one root, but a message with several acts is already cut into ordered requests (`prepareRequestBatch`, used by `P/src/dialog/declared-candidate-plan.mjs`). The missing piece is result references, listed above.
- `P/src/formalizer` (2,724 lines) and `P/src/translate` (8,472 lines) are still imported. Remove them file by file from their last importer, not wholesale.
- The library's grammar modules are still used by P (`dialogue.mjs`, `describe.mjs`). Keep them until those uses move.
- Ranked readings: `std.choice` and `std.ground` already return alternatives and ties. Every method should, and the turn journal should keep them for "no, the other one" (Review 29).

## Wrong or already done

- "The HTN planner is unused": P builds `lib.planner` over `k.procedures` in `src/plan/host.mjs`. Making `plan` a route of declared execution is still useful.
- "A fixed edit-cost limit drops man → person": replaced by `std.ground` in 0.225 and used by P. A leftover limit remains in `P/src/translate/index.mjs:198`.

## Not verified

Export counts, bundle-size savings from tree shaking, the cost of `world.fork` ("80% less allocation") and the test counts quoted by the reviews. Measure before acting on them.
