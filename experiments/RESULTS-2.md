# Results round 2: world-carried knowledge, real data, scale limits

*Run of 19 November 2026, corpus2 (12 harder cases). The v1 question was "which
technology compiles intents well?". The v2 question, on top of it:*

1. *Can the knowledge that a real compiler needs — rules for specific forms,
   persisted session preferences, word tables, tool capability declarations,
   real composition data — live in the WORLD as fact wires, and be executed by a
   pipeline that does not hardcode any of it?*
2. *What happens at realistic scale, and what does a typed refusal look like when
   the request is impossible?*

`z3world/` is the only compiler that reads all of that from the world
(`lr.rule`, `lr.pref`, `lr.grade`, `dc.operation`/`dc.parameter`, `demo.part`);
the four v1 compilers were run unchanged as controls (`CASES=` subsets where noted).

## A. World-carried knowledge, executed (pairs that differ by exactly one world fact)

| case | the one world fact | z3world (reads it) | v1 baseline/z3/cassowary (don't) |
| --- | --- | --- | --- |
| w1a→w1b | `lr.pref person=Ana value=late` | meeting moved **0-60 → 270-330**, zero new code | every one keeps **0-60**, contradicting the world's persisted preference |
| w2a→w2b | `lr.rule for=boat relation=in anchor-kind=lake` | boat **inside the lake** (370,285) | boat **beside the lake** (x≈370, y=220), contradicting the rule |
| w3 | `lr.grade small=0.5` + houses-avoid-lake rule | house **halved to 100×80**, near the tree, off the lake | house stays 200×160 (table ignored), some ignore the avoid-rule |
| w4 | real `k.objects` Noto sailboat parts | **two real part wires** (grey mast 5.8×83.4, red sail 48.7×77.5), one rigid group, both inside the lake | a single opaque `kind=sailboat` box (not in the schema → mechanically invalid) |
| w5 | — | `inspect` answered **"2" without the solver** (read path: match) | all three: "unknown-family" / no path for questions |
| w6 | — | existing boat **moved** via `x.set object=boat key=x value=520`, same row, right of the house, disjoint | change isn't their act: refused ("nothing matches (boat)") |
| w7 | impossible by construction (3×size-4 on a capacity-5 shelf) | **refused, core: `dom:x1 + dom:x2 + dom:x3 + cap:only`** (208 ms incl. proof) | all four refused correctly; reasons vary in quality (milp "capacity (4,4,4)", cassowary "capacity (x1:4…)", baseline "capacity (x2)" — item it happened to fail on, not the conflict) |

The core finding, precisely: **a valid circuit that contradicts the world's own
facts is what you get when the compiler doesn't read the world.** Schema tells you
`tellOk` — plausibility against the world's facts is a knowledge question, and it
must be read from facts (constraints, objectives), not written into code.

## B. Scale, all measured (same node, all determinism checks green)

| scale case | baseline | z3 v1 | z3world | milp (glpk) | cassowary (kiwi) |
| --- | --- | --- | --- | --- | --- |
| s-cal (14 busy + 4 new meetings) | ~0 ms | 16 ms | ~15 ms | **1 ms** | **crashed (OOM)** |
| s-draw (6 circles among 40 objects) | ~0 ms | 55 ms (one run) / 8 s budget-exhausted (another) | **37 s** | **>10 min, killed** | **crashed (OOM)** |
| s-store (45 items / 12 shelves, minimize-shelves + pair) | ~0 ms (FFD, valid) | 8 s budget-exhausted | **>9 min, killed** | **>8 min, killed** | **>4 min, killed** |
| s-store feasible, no-optimize shape (12-item runs) | ~0 ms | <60 ms | <60 ms | refused the *infeasible* variant correctly in 12.5 ms | — |


Three lessons, in the order they bit us:
1. **First-acceptable vs best is a real cost axis, not a taste.** s-draw answered
   in 55 ms once and 37 s another time on the same shape; the 8 s budget variant
   ended as budget-exhaustion ("unknown"), not as impossibility — exactly the
   distinction cap. 6.8 demands. Budgets must be declared; they already exist in
   the library (`std.request` has budgets; z3world must set `timeout` — it
   currently doesn't, a real TODO found by this run).
2. **Combinatorial objectives are expensive on every general engine.** Bin-packing
   with "use fewest shelves" did not finish in 9+ minutes (z3 Optimize) or 8+
   minutes (glpk MILP). The pragmatic answer measured: drop the objective
   (first-acceptable) and the problem collapses to milliseconds — baseline's FFD
   produced a valid, suboptimal packing instantly. The objective is a per-request
   preference, not a compiler habit (this is `depth` in the proposal document).
3. **Enumeration technologies fall off a cliff, not a slope.** cassowary (kiwi)
   handles every small corpus case beautifully and then dies with OOM at s-cal AND
   s-draw — the disjunction enumeration explodes combinatorially. Its place is the
   small, browser-size placement provider, nothing bigger.

## C. The silent-wrong failure mode, round 2 (the experiment keeps paying rent)

Building z3world re-introduced the non-variadic `term.add(...spread)` bug from
round 1 — capacities silently counted one item, everything landed on one shelf,
`tellOk` green. It was exposed only because the corpus deliberately contained an
**infeasible** case (w7): a supposedly-satisfying model for an unsatisfiable
problem is a contradiction an honest gate can catch. The unsat core also caught
two encoder conflicts during development by name (`inside:lake + gdisj0:lake`,
`near:tree + disj…`). Refusal-with-proof is not a UX nicety; in this experiment it
was the only instrument that debugged the encoder.


Round 2 also confirmed the review's Issue-taxonomy prediction: the z3 v1 refusal
template prints `unsat: ... conflicting: unknown` for a **budget timeout** —
mislabeling exhaustion as impossibility. `unknown` and `unsat` must carry different
Issue codes; this measured bug is the concrete case for versioned, tested refusal
codes (repo reviews, `mistral-review/02` §6).

## D. Verdicts

- **The world-as-knowledge-source works, measured end to end**: one added SOP line
  (`lr.pref`/`lr.rule`/`lr.grade`) changes behavior with zero code, and real
  k.objects parts compose as rigid groups. This is the w.inventory acceptance test
  from the reviews, passed in miniature.
- **z3 as the search slot, not the compiler**: questions (w5) answered on the read
  path without the solver; moves (w6) went `match → two variables → x.set`.
- **Providers by size, measured**: browser placement = kiwi (fast, small, no
  disjunctions at scale); node/CI = z3 (explanations, cores, generality);
  quick/fallback = internal bounded search; and **declared per-request depth and
  budget** to keep every one of them interactive (quick/alternatives/pareto).
- Documents: the full proposal built on this evidence is
  [../books/propunere-compilator-smt.md](../books/propunere-compilator-smt.md).

Raw data: `results2/*.json` (status/timing/determinism), `results2/*.cases.jsonl`
(judged records), `results2/plausibility*.json|md` (agent verdicts).

## E. Agent-verdict table (plausibility per record, results2/plausibility.json)

| case | z3world | baseline | z3 v1 |
| --- | --- | --- | --- |
| w1a | P 10 | P 10 | P 10 |
| w1b | **P 9** (270-330, pref honored) | I 3 (0-60) | I 3 (0-60) |
| w2a | P 8 | P 8 | P 8 |
| w2b | **P 10** (boat inside the lake) | I 3 (beside the lake) | I 3 (beside the lake) |
| w3 | **P 8** (halved 100×80) | I 4 (200×160) | I 3 (lake-glued) |
| w4 | P 9 (real mast+sail group) | invalid | invalid |
| w5 | P 10 (`x.answer` "2") | refused | refused |
| w6 | P 9 (one `x.set`) | refused | refused |
| s-cal | P 9 | P 9 | P 9 |
| s-draw | P 7 (37 s) | P 7 (3.9 ms) | refused (mislabeled "unsat") |
| s-store | killed >9 min (not scored) | P 10 (FFD) | refused (mislabeled "unsat") |
| w7 | refused, core `dom:x1+x2+x3+cap:only` | refused, "capacity (x2)" | refused, core `cap:only + dom:…` |
| average | **8.9** (10 scored) | 6.75 (8) | 6.0 (6) |
