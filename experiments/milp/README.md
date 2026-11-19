# MILP experiment — glpk.js 5.0.0 (GLPK 5.0 compiled to WASM)

Same corpus, same `compile(caseDef)` contract as the baseline. Every decision the
baseline reaches by bounded grid search or first-fit, this compiler hands to a
mixed-integer linear program and reads the solution back out.

## Intent → MILP mapping

A thin `Model` class (~30 lines) builds the JSON LP that glpk.js expects — one
objective, integer columns (`generals`), binary columns (`binaries`), and rows as
`sum(coef·var) ≤ / = rhs`. The API note: glpk.js@5.0 does **not** expose the raw
C API (`glp_load_matrix` etc.) to Node; `import glpkFactory from 'glpk.js/node'`
returns a sync `solve(lp: LPJSON)` that wraps exactly those C calls. The browser
entry (`glpk.js`) throws `Worker is not defined` under Node.

- **draw placement** — `x`, `y` integer variables; page bounds as column bounds.
  `on`/`in` = four inequality rows (inside the anchor rect). `near` = four binary
  side-choice columns (left/right/above/below, sum = 1); the chosen side's
  separation is trapped in `[gap/2, gap]` by two big-M rows per side (8 rows);
  unchosen sides are relaxed. Pairwise `disjoint` = four binaries per object
  pair, `sum ≥ 1`, each side a big-M row with a visible 1-unit gap.
  "Cluster near the middle" = auxiliary variables for `|2x+w−2targetX|` +
  `|2y+h−2targetY|` (integer via ×2), minimised.
- **calendar** — start minutes as integer variables; "before-or-after" vs each
  busy block (and between the new meetings) is one binary + two big-M rows;
  "earliest" is the *objective itself* (minimise Σ start), so a single solve
  yields the earliest schedule. `start-min` hard options are column bounds.
- **storage** — textbook assignment MILP: `y[item][shelf]` binaries, one
  `Σ = 1` row per item, one `Σ size·y ≤ capacity` row per shelf, and the
  `with-pair` option as `y[a][s] = y[b][s]` rows. Trivial objective (prefer
  lower shelf indices) to keep output canonical.
- **recolour (d6)** is object selection, not optimisation: same filter as the
  baseline, no MILP involved.

Size: compiler.mjs is 250 lines / 235 non-blank; of that ~170 lines are the
solver encoding (Model + the three family encoders), the rest is intent/world
reading shared verbatim in shape with the baseline.

## What MILP did well

Everything discrete fell out with zero search code: the two-meeting ordering
(c3), earliest-slot-with-blocks (c4 → 90-180), capacities and the same-shelf
pair (s3), and near-side choices (d3/d5 picked concrete sides with concrete
gaps). No enumeration, no discretisation grids — the baseline's 5-unit scan and
first-fit decreasing are replaced by a single `solve()` call (~0-2 ms/case).
Deterministic across repeated calls (14/14 identical on the runner's double
call).

## Where it bent / honest notes

- glpk.js has *no* disjunction primitive either: before-or-after and
  near-this-side are hand-rolled big-M encodings — the same trick Cassowary
  users must pull, just with exact integers. Integer variables made the
  positions naturally snap (no rounding needed; starts/coords come out whole).
- Big-M is a fixed 1000; fine at page/day scale, but unbounded relaxation
  slack is known to slow branch-and-bound at larger sizes — not visible here.
- Three bugs found while debugging (worth recording): unary minus on a *string*
  variable name (`-m.s`) silently became a NaN coefficient (refusals c2-c4);
  `undefined !== undefined` skipped all new-vs-new disjointness (d2/d5 overlap);
  a big-M sign flip deactivated the chosen-side minimum gap (d3/d5 gap 1).
  All fixed; the mechanical judge only checks schema acceptance, so these were
  caught by inspecting outputs — silent-wrong answers are MILP's real risk here.
- The cosmetic objective for storage (prefer shelf `a`, then `b`, ...) is a
  determinism tie-break, not part of the intent.
- Per-case: d1 boat centred on the lake; d2 three disjoint circles stacked
  vertically through the centre with 1-unit gaps; d3 house centred 20 above the
  tree; d4 sun centred in the sky; d5 house (25 below) and tree (25 above) the
  pond, disjoint; d6 exactly c2→green; c1/c2/c4/c5 start 0/120/90/240 (the
  rubric's ideal slots); c3 0-60 and 60-120; s1 3+2, s2 3+2 and 3+2,
  s3 i1+i2 together on b, 2+2/2+2/1+3.
