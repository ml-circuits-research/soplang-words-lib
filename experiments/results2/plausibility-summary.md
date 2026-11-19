# Plausibility summary (round 2)

P = plausible, I = implausible; number = quality 0-10. `refused`/`invalid`/`killed` cells are not judged — statuses come from `results2/<exp>.json`. Averages are over the scored (judged) records only.

| Case | z3world | baseline | z3 |
|-------|----------|-----------|-----|
| w1a | P 10 — earliest slot 0-60 | P 10 — earliest slot 0-60 | P 10 — earliest slot 0-60 |
| w1b | P 9 — lr.pref honored: 270-330, late band | I 3 — identical 0-60 to w1a, preference ignored | I 3 — identical 0-60 to w1a, preference ignored |
| w2a | P 8 — mid-page boat | P 8 — mid-page boat | P 8 — mid-page boat |
| w2b | P 10 — lr.rule honored: boat inside the lake | I 3 — boat beside the lake, rule ignored | I 3 — boat beside the lake, rule ignored |
| w3 | P 8 — lr.grade honored: house halved 100x80, shore-hugging | I 4 — house stays 200x160, table ignored | I 3 — house 200x160, glued to the lake |
| w4 | P 9 — real two-part sailboat (grey mast + red sail, inside lake) | invalid — single opaque sailboat box (kind not in schema) | invalid — single opaque sailboat box (kind not in schema) |
| w5 | P 10 — one x.answer "2" | refused — unknown-family | refused — unknown-family |
| w6 | P 9 — existing boat moved via x.set | refused — change: nothing matches (boat) | refused — change: nothing matches (boat) |
| s-cal | P 9 — 246-366, all disjoint (17.6ms) | P 9 — 250-370, all disjoint (0.2ms) | P 9 — 246-366, all disjoint (16.2ms) |
| s-draw | P 7 — zero-gap circle cluster (37.0s) | P 7 — zero-gap circle cluster (3.9ms) | refused — 8s budget, mislabeled "unsat" |
| s-store | killed — optimize run >9min, no row | P 10 — optimal 9-shelf packing, q0+q1 together (0.4ms) | refused — 8s budget, mislabeled "unsat" |
| w7 | refused — typed core: dom:x1+x2+x3 + cap:only (17ms) | refused — "capacity (x2)", arbitrary item (0.1ms) | refused — core: cap:only + dom:x1+x2+x3 (12.3ms) |
| **avg (scored)** | **8.9** (10 judged, 10 P / 0 I) | **6.75** (8 judged, 5 P / 3 I) | **6.0** (6 judged, 3 P / 3 I) |

## Notes

The v1 compilers contradicted the world's facts exactly where round 2 predicted: in `w1b` both `baseline` and `z3` schedule the meeting at 0-60 — identical to their own no-preference answers — ignoring the persisted `lr.pref` (Ana=late); in `w2b` both park the boat at (360-370, 220), just north of the lake, violating the hard in-lake rule; in `w3` both emit a full-size 200x160 house (the `lr.grade` halving invisible), `z3`'s glued edge-to-edge to the lake the world says houses avoid. Every one of those outputs is mechanically valid — `tellOk` green — which is the round's core finding: a circuit that passes the schema can still contradict the world's own facts, so plausibility is a knowledge question, not a schema one.

`z3world` honored all of them from the world alone: the meeting moved to 270-330 in `w1b`, the boat inside the lake in `w2b`, the house halved to 100x80 in `w3`, the real two-part Noto sailboat in `w4` (grey mast + red sail wires, rigidly shifted, both inside the lake), the inspect question answered "2" on the read path in `w5`, and the existing boat moved with a single `x.set` in `w6`. What it lost points on was geometry, not knowledge: boundary-tight 40 gaps, a shore-hugging house (w3), a corner-flush sailboat (w4), a 0-gap right-of-house move (w6) and a zero-gap circle cluster in s-draw — the difference between its 7-10s and clean 10s.

Scale flipped the picture: `baseline`'s bounded search is instant everywhere it compiles — including a provably minimal 9-shelf packing of s-store in 0.4ms — while `z3world` needed 37 seconds for s-draw and produced no s-store answer at all (the Optimize bin-packing run was killed at >9 minutes with no row written). `z3` refused both satisfiable scale cases after exhausting its 8s budget, and its reason strings (`unsat ... conflicting: unknown`) mislabel a search cutoff as impossibility — an honesty defect in the refusal itself.

The impossible case `w7` separated typed refusal from silence the way it was designed to: all three compilers refused — nobody silently overloaded the capacity-5 shelf — and both z3-based compilers name the real conflicting core (`dom:x1 + dom:x2 + dom:x3 + cap:only`), while `baseline` names an arbitrary item it happened to fail on ("capacity (x2)"). z3world also answered the one question case and the one move case the v1 compilers structurally cannot (w5, w6, both refused by both v1 controls), which is why its judged set is nearly twice the size.
