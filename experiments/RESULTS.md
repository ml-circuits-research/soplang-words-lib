# Results: compiling SOP intent circuits into tool circuits

*Run of 19 November 2026. Four technologies, one corpus, one interface. The question
was not "which is fastest" but "which technology has the best chance of being the
most general elaboration engine" — across the drawing, calendar and storage domains,
and across future worlds.*

## Setup

- 14 cases (6 drawing, 5 calendar, 3 storage) in `common/corpus.mjs`; every case is a
  real SOP World and a wired intent packet (`x.*` wires with `$` links).
- Same compiler contract everywhere: intent circuits in, elementary state circuits out
  (`draw.thing` / `cal.event` / `store.put` / `x.set`).
- Two judge layers: mechanical (the output parses, a World accepts it — `tellOk`) and
  an agent judge (plausibility + quality per case rubric; `results/plausibility.json`).

## Headline matrix

| | baseline (hand-written) | z3 (SMT) | cassowary (kiwi.js) | milp (glpk.js) |
| --- | --- | --- | --- | --- |
| compiled / 14 | 14 | 14 | 14 | 14 |
| deterministic | yes | yes | yes | yes |
| median latency | 0 ms | 10 ms | 0 ms | 0 ms |
| agent-plausible | 14/14 | 14/14 | 14/14 | 14/14 |
| **agent quality (avg)** | **8.5** | **8.9** | **9.6** | **9.3** |
| encoder LOC | 158 | 191 | 405 | 250 |
| native "or" (disjunction) | hand-rolled loops | yes | **no — enumerated outside** | yes (binaries + big-M) |
| native integers | as loops | yes | **no — rounded + re-verified** | yes |
| refusal explanation | reason string | **unsat core (named conflicts)** | reason string | reason string |

Calendar and storage outcomes are identical and ideal across all four compilers — 
all differentiation showed up in drawing, where positioning quality is visible.

## What each technology taught us

**z3 — the general one.** All three domains encoded in one constraint language with no
outside orchestration; the same `solveTracked` path produced positioned objects,
disjunctive schedules and integer assignments. Unique advantage, demonstrated: when
the problem is unsat, the second-phase Solver returns a named unsat core
(`near:tree`), i.e. the refusal is an evidence-backed list of conflicting intent
constraints — exactly the `Issue` shape the library review asks for. Costs found:
the JS binding has two real quirks (documented in `z3/compiler.mjs`): `addAndTrack`
on `Optimize` leaves its tags free, so the optimizer silently switches constraints
off unless solving goes through plain `add`; and `term.add(...)` is not variadic —
a spread sum silently collapses to its first element. 40 MB of WASM and 10 ms/case.

**cassowary (kiwi.js) — the best placements, the least self-sufficiency.** Highest
quality (9.6): centred boat, mid-strip sun, evenly-gapped circle row, tidy pond
flanking. Its strength hierarchy (`required/strong/medium/weak`) is exactly the
requirement/preference/assumption ladder of intent semantics, and linear placement
uses it natively. But every "or" (which side of the anchor, before-or-after a busy
block, which shelf) had to be enumerated outside the solver, and integer assignment
fell back to a bounded DFS: the disjunction semantics left the technology. The
published API has no `Equation/addVariable`; probing came first.

**milp (glpk.js) — the solid all-rounder.** Exact integer answers for everything
(schedules hit every ideal slot), classical big-M disjunctions, 250 lines, 0 ms.
Its binding has the sharpest gap: the browser entry throws `Worker is not defined`
in Node; only `glpk.js/node` works, exposing a JSON-level `solve()` instead of the
documented C API. Debugging big-M encodings found and fixed real silent-wrong bugs
(NaN rows from a unary minus on a string variable name; a `undefined !== undefined`
check that skipped every pair-disjointness call — outputs the World happily accepted).
That failure mode — valid-looking wrong outputs caught only by reading — is the
strongest argument in this experiment for a judge layer that reads the results.

**baseline — the control.** Fewest lines and fastest, never invalid, but
context-shaped: corner-hugging placements (8.5 quality; the mechanical judge sees
nothing wrong with a boat flush against the lake's top-left). It encodes domains in
code, so each new relation family means new hand-written search; the whole point of
the other three is to subtract that maintenance shape.

## Verdict

1. **The corpus was within reach of all four** — 14/14 plausible everywhere, zero
   refusals in the final runs. The differentiation appeared as placement quality,
   encoding cost, and especially *failure style*.
2. **Generality ranking: z3 > milp > cassowary > baseline.** z3 is the only one that
   kept all of the semantics (disjunction, integers, explanation) inside one
   constraint language; milp is a close second with a verbose encoding and no
   evidence-backed refusals; cassowary is a superb linear placement provider whose
   "or" must live somewhere else; baseline is the bespoke-code path the library is
   trying to leave.
3. **For the library this argues for problem-IR + pluggable providers**, not a
   monogamous choice: the elaboration contract from these experiments (open
   parameters → variables, relations → hard constraints, preferences → objective)
   is the same across all four; the technologies are interchangeable *behind that
   contract*. Realistic assignment: kiwi-style Cassowary as the browser placement
   provider (205 KB, instant), glpk-style MILP if calendar packing becomes hard,
   z3 as the CI oracle — its unsat cores turn "compiler refused" into a checkable
   claim (`unsat: near tree + gap <= 20`), and as a training-noise filter for the
   reader. None of this needs new semantics per sentence; that was the hypothesis,
   and it survived contact with all four technologies.
4. **The judge layer matters as much as the solver.** The mechanical judge accepted
   every silently-wrong intermediate output in this experiment (overlapping circles,
   a house on a tree, five items on one shelf). Only reading the state caught them.
   For the library's gates this means: a plausibility pass (ours was an agent reading
   before/after state) belongs next to `tellOk`, not instead of it — and the corpus
   needs a next round with genuinely conflicting intents (unsat-built-in) to expose
   refusal quality, where z3's cores are the technology to beat.

Raw data: `results/*.json` (status/timing/determinism), `results/*.cases.jsonl`
(states judged), `results/plausibility.json` + `results/plausibility-summary.md`
(agent verdicts). Per-technology notes: `baseline/README.md`, `z3/compiler.mjs`
(binding quirks in the header comment), `cassowary/README.md`, `milp/README.md`.
