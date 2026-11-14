---
name: learn-language-rules
description: From reading-stage failures and aligned pairs (a sentence and a variant with the same meaning), propose facts for the language world (alternations, fillers, splitters, words) and verbs or synonyms for the knowledge worlds, each checked on held-out pairs. Use when requests fail at the reading stage because of their form, not their content.
---

# Learn language rules

## Parameters

- `LIB`: this repository (sopworld).
- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`. The language world
  (`w.lang.*`) and `k.words` live there.
- `HOST`: the application. It gives the failures (ledger rows at stage `reading`) and the
  aligned pairs (canonical ↔ variant, judged same meaning).

## Steps

1. **Collect pairs.** Take the reading-stage failures and pair each with the sentence it
   should have been: the user's correction, or the case it is a cousin of. Keep only pairs
   judged same meaning.
2. **Freeze a held-out half** before looking at the operators.
3. **Learn typed operators.** Run `learnFormOperators(train, { heldOut, world })` with the
   catalog world as `world`, so content words are lifted to their types. Also run
   `learnFormEdits(pairs, { world })` to see the families (filler, extra clause,
   substitution, insertion, deletion, inflection).
4. **Map each family to where it belongs:**
   - filler → a filler word of the language world;
   - extra clause → a splitter;
   - alternation → `w.lang.en.alternation name= n= family= from= to= mode=`;
   - substitution of a content word → a synonym in `k.words`;
   - inflection → the morphology rules.
5. **Propose** only operators with `admitted: true`, at least 80 % of their held-out
   applications passing, and at most 3 literal words. An operator with more literals is a
   phrase: split it into its edits (`formEdits`) instead.
   Propose them as facts in those formats. Check that `normalise` or `canonicalise` brings their
   held-out variants back to the canonical sentences.
6. **Gate in the host.** Rerun the host's curve: the held-out half must not drop, and no
   right answer may turn wrong.

## May change / must never do

- May add facts to the language world and to `k.words` in `KNOW`, through that repository's
  own review.
- Never a phrase list (one fact per sentence), never a rule without held-out support, never
  editing tests to pass.

## Dry run

```
node skills/learn-language-rules/scripts/dry-run.mjs
```

It reads psys2's form pairs in place, learns typed operators, prints the admitted ones as
proposed `w.lang.en.alternation` facts, and prints the edit families.
