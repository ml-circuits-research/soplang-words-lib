# cassowary — kiwi.js (Cassowary constraint hierarchy)

Same contract as baseline/z3: `compile(caseDef)` -> `{ ok, sop }` of elementary
state wires. Solver: `kiwi.js@1.1.3` (the JavaScript Cassowary). Probed API note:
the package exposes `Solver, Variable, Expression, Operator, Strength` only (no
`Equation`, no `addVariable`); constraints go in via
`solver.createConstraint(lhs, Operator.Le|Ge|Eq, rhs, strength)` and values come
out via `solver.updateVariables()` + `v.value()`.

## The intent -> solver mapping

- Hard intent facts (page bounds, containment, non-overlap, day bounds,
  capacities) become **required** constraints.
- Preferences (centre inside the anchor / page, sit at half the allowed gap,
  pull every meeting start to the earliest allowed minute) become
  **medium/weak** equality constraints, which Cassowary trades off inside one
  solve — this is genuinely its home turf.
- Disjunctions do not exist in Cassowary, so the discrete structure is
  enumerated outside: which side of the `near` anchor (4), which relative side
  for each disjointness pair (4^pairs), before/after each busy block and each
  other event (2^k), which shelf per item (shelves^items).
  **kiwi judges each enumeration branch**: adding a required constraint that
  conflicts with the ones already in the solver throws `unsatisfiable
  constraint`; that throw is the branch's feasibility oracle.
- No integers in kiwi: solved coordinates/times are rounded, then **every hard
  predicate is re-verified on the rounded integers**; a branch whose rounding
  broke one is discarded like any other infeasible branch.

## What kiwi did well

One solver problem per branch; required vs medium/weak separation exactly
matches "constraints vs preferences", including `start-min` soft (a non-required
constraint can never make the model infeasible). Drawing is solved **jointly**
(all new objects in one problem per branch), so e.g. the three circles of d2
come out as a symmetric row centred on (400, 300) with equal 8-unit gaps —
better than a sequential place-and-avoid scan. Cassowary never oscillates and
the whole thing is deterministic (14/14 rows `det=true`, median 0-8 ms).

## Where it bent / failed

- *Disjunctions*: entirely enumerated outside; fine at corpus scale (64 draw
  branches, 2 calendar orderings) but exponential in general.
- *Integers*: shelf assignment is integral and kiwi has none — it is found by
  complete DFS over the (tiny) item x shelf product with kiwi as the per-leaf
  capacity oracle; kiwi's throw is the prune and a fixed ranking (fewest shelves,
  lowest peak load, lexicographic) picks the layout. Overkill-as-is for more
  items; that's the honest limit of the pure-Cassowary story.
- *d6 recolour*: a single unambiguous lookup — no linear arithmetic anywhere,
  so Cassowary is honestly not involved.

Encoding size: ~405 LOC (z3: 191, baseline: 158) — the enumeration scaffolding
and the integer verification layer cost roughly 150 lines over the z3 version.

## Per-case notes (final run: 14/14 compiled, 0 refused/invalid/error, tellOk all)

- d1 boat (370,310) centred inside the lake; d4 sun (375,50) centred in the sky
  strip. d3 house right of the tree, gap 20.
- d2 circles (438|370|302, 270): pairwise 8-unit gaps, row centred on the page
  centre. d5 house (685,390) right / tree (415,380) left of the pond, both gap
  25, overlapping the pond band, disjoint from each other and everything else.
- c1 0-30, c2 120-165, c3 0-60 & 60-120, c4 90-180, c5 240-300: the weak
  earliest-start pull lands every case on its ideal slot (c4 cannot use 0-90 —
  kiwi throws for that ordering, so 90 wins as it should).
- s1 3+2, s2 3+2 / 3+2, s3 pair i1+i2 together on `a`, shelves all exactly at
  capacity 4 — the fewest-shelves-then-balance ranking keeps all three tidy.
- No case finished tellOk=true-but-semantically-wrong that we know of; every
  output above was checked against the rubric by hand.
