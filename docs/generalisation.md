# Related cases and generalisation

A case is never single. A fix that makes one failing sentence pass may be general, or may fit
only that sentence. The library tells the two apart by deriving **related cases** from the case
and judging the fix on them.

## The picture

The owner's picture: go **up** the graph of abstraction from the case, then **down** to other
members. "What sound does a cow make" goes up from *cow* to *bovine*, then down to *yak*
(distance 1: the same kind). It goes up again to *ruminant*, then down through *ovine* to
*sheep* (distance 2: kinds that share a parent). The same walk works on other **axes**:
- `filler`: the thing asked about, along kind, class, is and is_a, or any `edges` a host names
  (a role, a habitat);
- `key`: another key of the same holder (its legs instead of its sound);
- `wording`: the same frame said another way: an alternation of the language world run
  backwards, a learnt or noise operator, a synonym, or a paraphrase the language world declares
  (`w.lang.en.variant`).

A related case is kept only when it is valid: the world has an answer for it (so the world is
the oracle), its text reads back to the same frame, and it is not already a known case.
`relatedCases(world, case, { distance, axes })` gives them, each tagged with its `distance`
and the `axes` it changed.

## The measure

`judgeOnRelated(answer, case, related)` judges a fix on the case alone and on its valid related
cases, per distance. A point fix passes the case and shows a share of 0 on its related cases. A
general fix passes both. `tools/generalisation-test.mjs` turns this into a table per distance ×
axis and names the pattern ("passes when kind changes, fails when role changes"). `learnRules`
admits an induced rule only when its held-out cases and related cases pass. The related cases
used to judge are never the ones the fix was made from.

## The literature

- **Metamorphic testing** (Chen, Cheung and Yiu, 1998): when no oracle gives the expected
  output of each input, test relations between outputs of related inputs instead.
- **CheckList** (Ribeiro, Wu, Guestrin and Singh, ACL 2020): behavioural tests of NLP models:
  minimum functionality tests, invariance tests (a perturbation must not change the output)
  and directional tests (it must change it in a known way). A `wording` related case is an
  invariance test. A `filler` or `key` related case is a directional one: the expected answer
  changes, and the world computes it.
- **Contrast sets** (Gardner et al., Findings of EMNLP 2020): small, meaningful perturbations of
  test instances that change the gold label, to probe a model's local decision boundary.

How this differs: the perturbations are not written by hand or by templates. They come from the
world's own graph of kinds and from the language world, so they stay valid when the knowledge
changes. The expected answer of each is computed by the world, not labelled. The distance along
the graph of abstraction orders them, from near to far.
