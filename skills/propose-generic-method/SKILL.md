---
name: propose-generic-method
description: Turn an honest-list group whose piece is a method, a mechanism or a composition (or not yet named) into a reviewed proposal. Generate ideas from the literature (planning, reasoning, composition of worlds, knowledge representation, language), review them adversarially (is it generic? does it name a world, a sentence or a test? would it survive a new world and a new language?) with the patch-smell checklist, and propose the method with its properties, probes and acceptance. Use when the missing piece is not a declaration, a word or a fact, when nobody can name it, and to review any change for patch smells.
---

# Propose a generic method

Ideas → adversarial review → proposal. The output is a written proposal (in the worker log, or a question to
the reviewer) and, once accepted, a change in the library or the knowledge repository. It is never a fix for a
case.

## Parameters

- `LIB`, `KNOW`, `HOST` as in [README.md](../README.md).
- A group of honest-list rows with the same `needs` (`rankNeeds`), or a `piece: unknown` group.

## 1. Generate ideas

Write at least three candidate methods for the group, each from a named source. Prefer well-known methods to
new inventions. Where to look:

- **Planning**: STRIPS / PDDL actions with preconditions and effects (an act's declared preconditions);
  HTN decomposition (a whole made of parts: `k.expect.part`); partial-order planning; plan repair and
  replanning; goal-oriented action planning; constraint satisfaction and constraint optimisation
  (`solveChoices`, `choose`); generate-and-test with simulation on a fork (planRequest's cycle).
- **Reasoning**: Datalog forward chaining (`deduceState`); default and non-monotonic reasoning (defaults that
  give way: the sources order said > dialogue > induced > world > expect > sampled); weighted abduction
  (Hobbs et al. 1993: assumptions cost by source); anti-unification / least general generalisation (Plotkin
  1970: `induceStyle`); case-based reasoning (adapt the nearest past plan); belief revision (AGM: what a
  correction retracts); qualitative spatial and temporal reasoning (RCC-8, Allen intervals); answer-set
  programming for choices with exceptions.
- **Composition of worlds**: module systems and imports (`core.use`); joins by key (relational views, foreign
  keys); ontology alignment (`alignWorlds`); blackboard architectures (several worlds propose, one decides);
  mixins and capability interfaces (a world declares what it honours); delegation between worlds.
- **Knowledge representation**: frames and slots (Minsky; FrameNet roles); description-logic is-a with
  inheritance of defaults (`k.kinds.parent`); qualia structure (Pustejovsky: what a thing is made of, for, by);
  commonsense relations (at-location, made-of, used-for); typical ranges with sources.
- **Language**: construction grammar (a form with typed slots = a cue with `takes`); unification grammars;
  noisy-channel spelling (`repairWords`); metamorphic testing (related cases).

For each idea, write: the method, its source, which library function or knowledge world it extends, and which
rows of the group it would unlock.

## 2. Review adversarially

Try to kill each idea. Answer every question in writing:

1. **Generic?** Does it work from declarations and knowledge only, or does it need to know the case?
2. **Does it name** a world id, a sentence, a word list, a test, or a host in code? (Any yes is a patch.)
3. **Would it survive a new world?** Apply it in your head, then in a dry run, to a declared world it was not
   written for (the example worlds of `examples/request-app.mjs`, a published `w.*` schema).
4. **Would it survive a new language?** Does it depend on English word order or words outside the language
   world?
5. **What does it lose?** Which turns that pass today would change? Are they patch-only (they fail with the
   patches off)?
6. **Cost and bounds**: is it bounded (ticks, candidates, depth: see `REASONING`, `SPELL`)? Does it stay
   deterministic?
7. **Is there a simpler piece** lower in the order (a declaration, a fact, a word) that does the same?

### Patch smells

A checklist, with hints from `skills/lib/smells.mjs`. Run it on every change, not only on proposals:
`node skills/propose-generic-method/scripts/smells.mjs <git range> [honest.jsonl] [world ids...]`.

- [ ] a literal sentence, or three words of a known turn, in code, a world or a pattern (`sentence`);
- [ ] a world id in generic code (`world_id`);
- [ ] a special case on one literal value: `if (x === "...")` with a phrase or a turn's word (`special_case`);
- [ ] a rule or operator with one support (`one_support`); an operator that is a phrase (`literal_operator`),
      invents content (`invents_content`), fuses a filler (`fused_filler`), or has no anchor (`no_anchor`);
- [ ] a fallback that hides an unread request: `unread` cleared, a default act, a catch-all that executes
      (`hides_unread`);
- [ ] a test or a set edited to pass: assertions removed or expectations changed (`test_edited`);
- [ ] a value list the knowledge already has, instead of a join by key (`value_list`);
- [ ] (by hand) a threshold tuned until one case passes; a new source or rule that only one world uses; a
      change that cannot say which honest-list rows it moves.

A hint is answered, not obeyed blindly: "generic because ..." or "a patch: list the case instead".

## 3. Propose

Write the proposal with these headings:
- **Piece**: its class and its `needs` text, exactly as on the honest list.
- **Rows**: the honest-list rows it unlocks (real and synthetic counts, worlds).
- **Method**: what it does, its source in the literature, where it lives (function or world), its bounds.
- **Never**: what it does not do (no world ids, no sentences, no catch-all).
- **Properties**: the generated properties it adds or must keep (over every declared world).
- **Probes**: the new sentences it is checked on, and how they were generated.
- **Acceptance**: the phase (transition or steady), the expected wins and losses, and how patch-only losses
  were told apart (patches off).
- **Review**: the answers to the seven questions and the smell checklist.

Proposals that change the library go to the reviewer (questions.md and the worker log). Knowledge goes to the
knowledge repository's review. The owner decides what a world should declare.

## Dry run

```
node skills/propose-generic-method/scripts/dry-run.mjs
```

(1) It builds an honest list from turns over the three invented example worlds, triaged by their request
evidence. (2) It checks the list and ranks it by the turns a piece unlocks. (3) It reviews three proposals
with the smell hints and applies the acceptance rule in both phases. Last run: 8 rows, 0 problems. The top
piece was the act word (language, 2 turns in 2 worlds); 5 rows were correct refusals. The review flagged
"read blorp as make" (sentence, special_case, hides_unread) and a one-support alternation (one_support); the
honours declaration was clean. Acceptance: transition accepted (1 patch-only loss ignored); steady rejected (9
won, 1 lost: fewer than 10 per loss).
