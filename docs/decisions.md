# How the library decides

Every place where the library picks one of several candidates is a **choice point**. The
owner's question (17:16) was whether one method decides them all. The answer the library
works toward is yes:
- each choice point produces candidates;
- `choose(world, kind, candidates)` orders them by the criteria declared for its kind, as
  data (`std.decide.criterion of=<kind> n= name= measure= dir=hard|min|max`);
- every loss is explained by the criterion it lost on.

## The order of the criteria

The order is the same for every kind; a kind lists only the criteria that apply to it.

1. **Hard constraints.** The candidate is consistent with the world and the types fit
   (`dir=hard`: anything but 0 loses).
2. **Coverage.** Nothing said is left unread, and every role is filled.
3. **The fewest and cheapest assumptions** (weighted abduction). Each default, near word,
   form operator or guessed value has a cost. The costs are knowledge: word senses give 1 /
   2 / 3, and tiers give told < derived < forced < default < guessed.
4. **Specificity.** The more specific rule, frame or template beats the general one.
5. **Priors.** Typicality, interest (k.interest), recency and focus.
6. **A seeded order.** The same seed gives the same choice.

A world, or a knowledge world, may declare criteria for a kind of its own. For a kind
std.decide already declares, a host gives its list directly with `criteria`. Costs and priors should come from k.* facts, and
tie-break weights may be calibrated on the case corpus, admitted by held-out cases, never
tuned in code.

## The choice points

| Choice point | Candidates | Decided by | Status |
| --- | --- | --- | --- |
| A reading of a message (`world.score`, `rank`) | readings | `RANKING`: consistent, referents settled, lacks, every word used, fewest assumptions | the same order as `std.decide` kind `reading`; to read its criteria from data |
| A value of a key | values by tier | tiers: told > derived > forced > default > guessed | data (tiers are declared) |
| The world that takes a request (`arbitrate`) | worlds | own / decline / refuse, then the world's rank | own method; to move to kind `world` |
| A template of a sentence (`discourseRealiser`) | templates of the move and register whose slots fill | **`choose`**, kind `template`: fills, fresh, specificity, prior, seed | **done (0.92)** |
| A near word (`readByTypes` `near`) | words through k.words senses | **`choose`**, kind `word`: fits, cost, prior | **done (0.92)** |
| A frame of a question (`readByTypes`) | ask / find / act frames | a score: coverage, then question fit, then nearness | to move to kind `reading` |
| An alternation rule (`normalise`) | rules that match | the order told (`n`, Q58) | to move to kind `rule`: matches, specificity, order |
| A grammar parse (`parseText`) | parses | rule `priority`, then literal count, then size | to move to kind `reading` |
| A fact for a move (`compose`) | facts about the topic | interest (k.interest), never one twice | to move to kind `fact`: unsaid, interest |
| A choice point of a procedure (`std.plan`, `solveChoices`) | assignments | hard matches prune, soft matches weight a seeded draw | a weighted draw by design (variety), within hard constraints |
| A frame to sample (`sample`) | legal frames | novelty weights, seeded | a weighted draw by design (variety) |
| A story element (`storyPlan`) | catalog facts | hard constraints prune, soft ones weight a seeded draw | a weighted draw by design |

Two kinds of choice points differ on purpose:
- **Deciding** (a reading, a template, a word, a rule) takes the best candidate by the
  criteria above.
- **Drawing** (sampling, story elements, composition variety) takes a weighted random
  candidate among those that hold the hard constraints, because variety is the point.

Both use the same hard constraints, and both use the same knowledge for costs and priors.

## Explaining a choice

`choose` returns `ranked`: for each candidate its place and, for the losers, `lostTo` and
`on` (the criterion) with a one-line `why`. For example, "cost 2; #1: cost 1": this word was
a kind away, and the winner a synonym.
