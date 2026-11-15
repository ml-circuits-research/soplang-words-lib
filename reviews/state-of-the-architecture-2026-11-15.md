# State of the architecture, 0.141 (2026-11-15, night), against the review's 49 findings

The review: `reviews/architecture-review-2026-11-15-reviewer.md` (0.117). Status: **fixed** (with the release),
**partly** (what is left), **open** (not started; where it is planned), **refused** (with the reason). Numbers come
from commands: `npm test` 524 pass / 0 fail (the compat suite now runs apart: `npm run test:compat` 11 pass);
`npm run test:full` at 0.140: 537 + 537 + 533 pass, the one failure a timing test under the copy-on-write check, now
skipped in that mode (its time measures the copying, not the lookups).

## A. Serious (6): all fixed in R1 (0.119)
1 caches on `world.version` (`memoPerWorld`) · 2 one seeded generator (`src/random.mjs`) · 3 one `valueText` · 4
`choose`'s criteria as data · 5 one tier order (`FILL_TIERS`) · 6 independent ensemble voices. Each has the test that
would have caught it (test/architecture-r1.test.mjs).

## B1. One way per job (7–20)
| # | finding | status |
|---|---|---|
| 7 | nine readers, no contract | **fixed** 0.120: `readText` / `READERS`, unread · repaired (confident, 0.137) · mood |
| 8 | two story planners | **open**, R3: one planner on a World-backed fact store with the catalog shapes; story.mjs still here |
| 9 | two motion schedulers | **fixed** 0.122 (`motionRun`; motion.mjs deleted) |
| 10 | two pipelines, two choosers | **fixed** 0.124 (`turn` on `turnFlow`; `arbitrate`; `route` gone); the kit chooses by owned kinds |
| 11 | two typed-world builders | **fixed** 0.121 (`typedWorldFor`) |
| 12 | three matchers | **fixed** 0.123 (`matchPattern` / `matchAll`) |
| 13 | four kind walkers | **fixed** 0.123 (`kindChain`) |
| 14 | rankers | **fixed** 0.125 (every choice through `choose`) |
| 15 | five splitters | **partly**: one `clauses` / `cutPoints` (0.135) on the language world's joiners and wh words, passing the knowledge repository's real shop rows; `canonicalise`, `splitRunOn`, `segment`, `sentencesOf` and storyState's split are not yet rewritten on it |
| 16 | realisation helpers | **partly**: `replyFrom` (0.134) is the one template filler for replies (articles, plurals, CLDR class, agreement); `clauseOf` / `actSentence` / `realiseFrame` remain |
| 17 | two composition algorithms | **open** (R5 candidate: the default as a built-in genre) |
| 18 | similarity / alignment twice | **partly**: one `editDistance` (0.123); `formOperator` not yet on `formEdits` |
| 19 | three lexicons | **open** |
| 20 | twelve RNGs | **fixed** 0.119 |

## B2–B3. Knowledge and the application in src/ (21–29), R3
| # | finding | status |
|---|---|---|
| 21 | English morphology in ~11 places | **partly**: the kit reads singulars from `w.lang.en.inflect` (0.141), plurals and articles from the language world (`inflectBy`, `articleFor`, registers 0.139); final-s fallbacks remain as defaults in alternate (3), signature (2), say (3), learn, dialogue, story-focus, typed — each takes a `lemma` option or will |
| 22 | default namespaces | **open**: `'w.lang.en'` is the default of 30 options (kit 15, say 5, reader 3, clauses 2, dialogue 2, related-cases, statements, space) — a parameter everywhere, a default nowhere is the R3 goal |
| 23 | English word lists | **partly**: moodOf reads `<lang>.fn` (wish, politeness, fillers) and `.wh/.aux/.pron/.det`; English fallbacks remain in reader.mjs `EN`, statements.mjs `EN`, fitsSlot `skip`/`self` |
| 24 | catalog shapes in src | **open** with 8 (compose.mjs and story.mjs name k.story / k.people / k.animals) |
| 25 | English prose for users | **partly**: the kit's replies are the language world's (`w.lang.en/ro.reply`, 0.134); English remains in schema-words `actReply` (10 sentences), statements (8), the kit's fallbacks when a reply fact is missing (asked: Q80) |
| 26 | handover / say are one host's | **open** |
| 27 | open tab as a library criterion | **fixed** 0.124 (a host criterion) |
| 28 | storyState is kids arithmetic | **partly**: money as story events (knowledge Q71) not yet; storyState kept as the word-problem reader |
| 29 | the compat suite in `npm test` | **fixed** 0.141: `npm test` runs test/ only; `npm run test:compat` and `test:full` run compat/ |

## B4–B7. Layering, API, dead code, docs and tests (30–39)
30 std one 1098-line file: **open** · 31 modules with several jobs: **open** (kit.mjs is now the largest new one) ·
32 three act-frame shapes, 33 five failure conventions, 34 option drift: **open**, R4 · 35 seventeen unused exports:
**open**, R5 (grep on PSys2 first) · 36 two criteria that never discriminate: **open** · 37 d.ts vs code: **partly**
(names checked by the docs test; a shape contract test is R4) · 38 slow files: **open**, R5 · 39 property tests:
**partly** (kit: 441 frame examples use every role word; turn scope over three worlds; lookup budget at 20,000 facts).

## B8. Generalisation (40–43)
40 one content-type predicate: **open** · 41 one Reader contract: **fixed** (7) · 42 `solveChoices` as the CSP
sampler: **open** (with 8) · 43 one pattern engine: **fixed** (12).

## C. Cosmetic (44–49)
44 relaxed retry limit: **fixed** 0.141 · 45 four META key sets: **open** (they differ per module; one set with a
per-module addition) · 46 non-public exports: **fixed** 0.141 for `fallbackOf` and `subjectOf`; `editDistance` and
`vetoOf` stay module exports used across modules, not in index.mjs · 47 headers: **open** · 48 literature gaps:
**open**, R5 · 49 modules.md and housekeeping: **open**, R5.

## Count
Fixed 22 (1–7, 9–14, 20, 27, 29, 41, 43, 44, 46) · partly 11 (15, 16, 18, 21, 23, 25, 28, 37, 39 and the kit-side
halves of 22, 24 counted open) · open 16 · refused 0. Next, in order: R3 (8 with 24 and 42; 22; the English fallbacks
of 21/23/25 as parameters), R4 (32–34, 37), R5 (35, 38, 48, 49, 17, 19, 45, 47).
