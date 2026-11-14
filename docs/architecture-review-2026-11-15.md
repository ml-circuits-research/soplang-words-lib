# Architecture review, 2026-11-15 (worker)

The worker's own review (reviewer 09:50) next to the review agent's 49 findings
(`reviews/architecture-review-2026-11-15-reviewer.md`). Each finding is fixed in a release with the
test that would have caught it, or answered in `questions.md` with the evidence.

## R1: the serious findings (0.119.0)

| finding | fix | test |
| --- | --- | --- |
| 1. caches keyed on the wire count | `memoPerWorld` keyed on `world.version` for every per-world cache | revise, then read again |
| 2. a float LCG with collapsed low bits, 12 generators | one `seeded` generator (mulberry32) | a two-value draw gives both values over four seeds |
| 3. about 50 local quote strippers | `valueText` on `str` | escaped quotes and newlines |
| 4. `choose`'s criteria by an import side effect | std.decide's criteria are data imported by rank | `choose` imported alone ranks by them |
| 5. two tier orders | one tier list, read by std.fill and by resolve | the module's tiers, slip last |
| 6. `exact` voted as a second reader | default voices `types` and `canonical` | the default voices |

## Next

R2 (one way per job, the `Reader` contract with unread spans and mood), R3 (knowledge and
application out of src/), R4 (API conventions), R5 (docs, tests, dead code), then the 09:20 items
L3, L2, L4 on the R2 contract.
