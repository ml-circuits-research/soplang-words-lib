---
name: expand-and-test-case
description: Turn one case (a turn and what its world computes) into its related cases along the axes knowledge and declarations publish (kind, role, key, act family, world), and into fresh probes. Use the table per distance × axis to name the missing generic piece, and use the related cases as probes once the piece lands. It is a probe generator, not a rule fitter. learnRules output is only a proposal for propose-generic-method's review. Use before building a piece for a case, and after, as its probes.
---

# Expand and test a case

A case is never single. Its related cases are perturbations of it along named axes (metamorphic testing; see
`LIB/docs/generalisation.md`): go up d layers of abstraction, then down d (distance d), along kind, role, key
and, as knowledge publishes them, act family, alternation and world structure. A piece is generic when its
related cases pass on the generic path, not when its case passes.

## Parameters

- `LIB`: this repository (`tools/generalisation-test.mjs`, `relatedCases`, `src/`).
- `KNOW`: the knowledge repository at the commit pinned in `LIB/repos.pin`. Its kinds, aspects and act families
  are the edges of the graph. Read it in place.
- `HOST`: the application: `host(text, frame) -> answer` and the live world the case lives in.

## Steps

1. **State the case.** Give `{ text, frame }`. For a request world the frame is what the generic path computes:
   the `readRequest` constraints and the `planRequest` roles. For a question it is the world's answer. If the
   world itself cannot answer it, the case is wrong, not the host.
2. **Expand.** `generalisationTest(world, example, host, { distance: 3, edges, read })`. `edges` names the axes
   from the keys knowledge uses. Only valid related cases are kept: each has an answer in the world, reads back
   to the same frame, and is not a known case. For a request world, add the properties the declarations
   generate (author-live-world, `generatedProperties`: every request key × kind × world). Those are related
   cases along the declared axes.
3. **Read the table and name the piece.** One row per distance × axis:
   - fails when kind changes → knowledge (the kind's facts, its words) or a declaration (`std.schema.kind`);
   - fails when role or key changes → a declaration (honours, a slot) or a reader mechanism;
   - fails along every axis → the host fits only the example: what wins it is a patch. In the transition
     phase, losing it does not matter (README, Acceptance);
   - passes on every axis but the case fails → look for a patch that overrides the generic path.
   Write the piece as `needs <generic piece>`. If none can be named, the case goes on the honest list.
4. **Build the piece** with the skill of its class. A rule from `learnRules(world, cases)` is at most a
   *proposal*. It goes through [propose-generic-method](../propose-generic-method/SKILL.md)'s review
   (support, literals, does it name the case?). If it is kept, it lands as a fact or declaration in the world
   it belongs to, never as a rule in the host.
5. **Probe.** Rerun step 2 with the piece in place, plus fresh probes (new sentences generated from the
   declarations and the language world). Accept by the phase's rule:
   - transition: related cases that passed only by a patch may turn; the rest are listed;
   - steady: at least 10 won per 1 lost, net, on real turns, each loss listed.
   The table is reported; it does not gate alone.
6. **Write it down**: the table before and after, the piece, the honest-list rows it moved. Every number comes
   from a command.

## Dry run (no host needed)

```
node LIB/tools/generalisation-test.mjs
```

On its toy farm world, a host that knows only cows breaks along kind, role and key (share 0). `readByTypes`
as the host passes every related case (share 1). Last run: share 1, distance 1 kind 1/1, role 2/2. For the
declared-axis properties of request worlds, see `node skills/author-live-world/scripts/dry-run.mjs`.

## Do not

- Fit a rule to the case or its family and call it done.
- Write related cases by hand. They come from the world and its declarations, so they stay valid when the
  world changes.
- Copy knowledge from `KNOW` into `HOST` or `LIB`. Read it at the pinned commit.
