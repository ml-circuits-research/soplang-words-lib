# Plausibility summary

P = plausible true, I = implausible; number = quality 0-10. Averages over all 14 cases.

| Case  | baseline | z3 | cassowary | milp |
|-------|----------|----|-----------|------|
| d1    | P 4 — boat flush in lake corner | P 9 — near-centre | P 10 — centred | P 10 — centred |
| d2    | P 7 — touching L-shape, central | P 7 — touching, up-left of centre | P 9 — gapped row, dead-centre | P 8 — touching column, centred |
| d3    | P 8 — 20-unit gap right of tree | P 9 — diagonal 40-unit gap | P 8 — 20-unit gap right of tree | P 5 — above tree, jammed to page top |
| d4    | P 3 — sun in page corner | P 6 — on strip's bottom edge | P 10 — mid-strip | P 10 — mid-strip |
| d5    | P 8 — flanks pond, 25-unit gaps | P 4 — house+tree glued together | P 9 — flanks pond tidily | P 8 — above/below pond |
| d6    | P 10 | P 10 | P 10 | P 10 |
| c1    | P 10 | P 10 | P 10 | P 10 |
| c2    | P 10 | P 10 | P 10 | P 10 |
| c3    | P 9 — back-to-back | P 9 — back-to-back | P 9 — back-to-back | P 9 — back-to-back |
| c4    | P 10 | P 10 | P 10 | P 10 |
| c5    | P 10 | P 10 | P 10 | P 10 |
| s1    | P 10 | P 10 | P 10 | P 10 |
| s2    | P 10 | P 10 | P 10 | P 10 |
| s3    | P 10 | P 10 | P 10 | P 10 |
| **avg** | **8.5** | **8.9** | **9.6** | **9.3** |

## Notes

All 56 executions satisfy their hard constraints (on-page, disjoint, in-day, within capacity); the differences are purely compositional. Cassowary looks the most decent overall: it centres the boat on the lake, centres the sun in the sky strip, spreads the circles with actual gaps, and flanks the pond tidily — the only compiler whose every draw answer looks like what a person meant. MILP is a close second (identical centring on d1/d4 and clean vertical flanking in d5) but puts the house above the tree jammed against the page's top edge in d3 and stacks the circles as a zero-gap column in d2. Z3 is hurt by the one semantically sloppy answer in the set: in d5 the house and tree end up glued edge-to-edge despite "without touching each other", and its sun sits on the sky strip's boundary. Baseline never breaks a constraint but has a taste for edges — boat flush in the lake's corner, sun dumped in the page's top-left corner. Calendar and storage cases were solved identically and ideally by all four compilers, so all differentiation comes from the draw family.
