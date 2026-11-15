---
name: learn-language-rules
description: When the missing piece is a word or a form, add it to the language world (w.lang.<lang> cues, skip words, number words, inflection, alternations) or to the knowledge worlds (k.actions verbs, k.words synonyms), so that readRequest and repairWords read it in every world. Learn from all pairs and turns (nothing held back). Proposals from learnFormOperators pass the patch-smell review (support, literals, invented content, fused fillers, no anchor) or are split into edits. Use when turns fail at reading because of their words or form.
---

# Learn language rules

The reader (`readRequest`) has no phrases of its own. It reads the cues, closed words, number words,
inflection and replies of the language world, the verbs of `k.actions`, and the kinds and values of the
declared worlds. `repairWords` takes its dictionary from the same sources. So a reading failure caused by
form is fixed by a fact there, and every world gains it at once.

## Parameters

- `LIB`: this repository.
- `KNOW`: the knowledge repositories at the commits in `LIB/repos.pin`: `w.lang.<lang>` (cue, det, prep,
  skip, number, inflect, irregular, reply, anaphor), `k.actions`, `k.words`.
- `HOST`: the reading-stage rows of its honest list, and aligned pairs (a sentence and a same-meaning
  variant: a user's correction, a phrase-log paraphrase).

## Steps

1. **Collect** the reading-stage rows (`unread`, wrong constraints) and the pairs. Use all of them: overlap
   with later probes is fine, and nothing is frozen.
2. **Find the language piece** for each, by the evidence:
   - an unread word that names an act → a `k.actions.verb` (with its act) or a `core.word` of the action in the
     language world;
   - an unread phrase that sets a request key → a cue `w.lang.<lang>.cue name= on= lead=|between=|trail=
     takes= priority=` (one cue per form, with its operand typed by `takes`, never one per sentence);
   - a word that carries nothing → a skip word;
   - a number, an amount or a plural → number words, `k.expect.amount`, inflection or irregular forms;
   - a misspelling → nothing to add if `repairWords` repairs it; otherwise the word is missing from the world
     or dictionary (it is a piece of the world, not a typo list);
   - a content-word substitution → a synonym in `k.words`;
   - a reordering → an alternation `w.lang.<lang>.alternation from= to= family=`.
3. **Learn typed operators and edits** as proposals: `learnFormOperators(pairs, { world })` (admitted with two
   supports) and `learnFormEdits(pairs, { world })` (the families).
4. **Review every proposal** with the patch smells (`smellsOf({ operators }, { skip })`, see
   propose-generic-method):
   - `one_support`: a rule with one support;
   - `literal_operator`: more literal words than variables;
   - `invents_content`: the result has a content word the source lacks;
   - `fused_filler`: a skip word fused into a form;
   - `no_anchor`: no literal word, so it rewrites any sentence of that length.
   A proposal with a smell is split into its edits (`formEdits`) and each edit is placed as above. If it
   cannot be split, its turns go on the honest list.
5. **Propose** the clean facts in the language world's formats, through that repository's review.
6. **Probe** with new sentences: each new form combined with kinds and values of other declared worlds, and in
   a second language world when one publishes the same cue names (does it survive a new language?). Accept
   by the phase's rule (README, Acceptance): in the transition phase, cases that passed only by a phrase
   operator may be lost.

## May change / must never do

- May add facts to the language world, `k.actions` and `k.words` in `KNOW`, through that repository's review.
- Never a phrase list (one fact per sentence), never a cue or operator fitted to one turn, never a pattern in
  host code, never editing tests to pass.

## Dry run

```
node skills/learn-language-rules/scripts/dry-run.mjs
```

It reads psys2's form pairs in place and learns typed operators from all of them. It reviews each admitted
operator with the patch smells, prints the clean ones as proposed `w.lang.en.alternation` facts and the refused
ones with their smells, and prints the edit families. Last run: 565 pairs, 143 operators, 22 admitted, 1
passes the review, 21 refused (fused fillers, phrase operators, no anchor). The pairs need edit-level pieces
(clauses 548, substitutions 312, fillers 303), not operators.
