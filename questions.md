# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q30 (Round 24): the five other PSys2 hand-over packages, compared; what to port first

Read in place at PSys2 main (handover/, copies at 9e370c47). What the library already has,
what it refuses, and what is missing:
- **acts** (458 SOP + 1,117 code + 580 generators): roles, schema, executor with undo,
  diff, reply and why, graded fallback, card, examples, coverage grid — all here (std.schema,
  std.acts, turn, schemaGrid; 19 acts against its 15). Refused: the English forms, verbs and
  `splitThings` (reading), the pattern / lexicon generators. **Missing:** its hook
  `domain.<act>` (a world's own effect for one act on one kind, e.g. hangman's "make a
  word"). Proposal: `std.schema.kind ... on.make=<action name>` — the act calls that host
  action instead of the generic write; needs your yes (it is a new attribute).
- **session.things** (263 SOP + 460 code): one thing, many views, aspects, show, why not —
  here (std.schema aspects and views, `show`). Refused: `viewByWords`, `ASPECT_WORDS`, its
  English commands. Missing: `find` across views by description — `pick` with attributes
  and `*` covers most; nothing to port unless you want `find` by aspect.
- **session.dialogue** (151 SOP + 529 code): focus, fill, why from the last turn —
  std.focus, std.fill, `turn` (why, guesses). Refused: reading the kind of a turn
  (continuation, correction, complaint: English). Missing: a per-session log of turn
  records and `amend` (a correction = undo the last sentence and act again); small, on
  `turn` + `undo`.
- **common.sense** (565 SOP, 62 code): facts → sop-knowledge-worlds (not the library);
  the reader → `createCatalog` (done).
- **space** (293 SOP + 1,648 code + 28): relations — std.relations; geometry — std.boxes.
  **Missing, the largest:** selection by order / position / size ("the second one on the
  left", "the bigger one"), moves by an amount ("a little to the left": `change by` covers
  the act, not the words), layouts (row, column, grid, circle), overlap and contact
  enforcement, spatial questions, the piece model with its constraint solver.
Proposed order (as pack functions + rules, with its tests ported): 1. `on.<act>` hook (if
yes); 2. space selection and layouts (rules + std.boxes functions); 3. overlap
enforcement (a deny + a function); 4. the turn log and `amend`; 5. pieces and the solver
(largest; the library has solvers already: compare first). Not blocking: I start with 2.

## Q31 (Round 25): is the request pipeline itself a world? — design and recommendation

**Recommendation: yes for the order, the providers and the fallbacks (items 1 and 2 as
data); no for the stages' insides.** What a stage does stays a function (reading text,
scoring a world, a dry run, applying an act): rules cannot read text or fork a world.
What changes between applications is which stages run, in what order, who provides each
and what happens when one yields nothing — that is data, and cheap to make data.

- **Declared:** `std.turn.stage name= after= yields= on_empty=` (on_empty: `ask`, `next`
  = the next candidate, `fail`) with `skip_if=<yield already present>` and `only=<action>`;
  `std.turn.provider stage= fn= tier=`: several providers of one stage ranked by tier (the
  first that yields wins; a reader that yields candidates adds them in tier order). The
  order is the `after` chain, checked at load (one start, no cycle, every stage has a
  provider: a stage nobody provides is advice, not an error).
- **Worth having (I believe):** skipping a stage already answered (the request names the
  world: `skip_if`); going back to the next candidate when a later stage fails (`next`;
  `turn` does it today); a stage that asks (`ask`, e.g. a confirmation before removing many
  things); per-action stages (`only=remove`). **Not yet:** candidates carried in parallel
  and judged at the end by cost (the sequential dry run already picks the first that
  works; parallel costs a fork per candidate per stage for little gain); per-world stage
  differences beyond `only=` (no case yet).
- **Fixed, whatever the declaration:** apply is one `act([...])` (one undo step, all or
  nothing); every call within the step budget; the same input and state give the same
  path (the order is a sort of the declaration, providers by tier then name); a trace of
  every stage taken (stage, provider, what it yielded or why it yielded nothing), and
  `why` of a changed value can be preceded by the trace.
- **Cost:** a declared run adds a lookup of the declaration per turn (cached per world
  version) and one call per stage; measured against `turn` on the same requests (bench).

Building now: `std.turn` (the default stages as SOP Lang), `turnFlow(world, readings, {
providers })`, two variants by facts only (a confirmation stage before `remove` with a
set; a second reader at the reading stage), and the test that 30 requests give the same
diffs through `turn` and the declared default.

## Closed

- Q1 (no access to the PSys2 repository): answered, the material needed is in `compat/psys2/`.
- Q2 (`imports=core` without a `core` module): withdrawn after the task list was rewritten.
- Q3 (`core.test` name clash): answered, renamed to `core.check` with `core.test` kept as an alias when linked.
- Q4 (`world.schema` is now `world.matrix`): accepted; listed under Changes in SPEC.
- Q5 (strictness of literal kinds): accepted as chosen; unknown kinds are reported by `world.schema(type).unknownKinds`.
- Q6 (no default parent in the library; `root=` in a type map): accepted.
- Q7 (one commit for G1 and G2): accepted; one commit per task from here on.
- Q8 (a sixth status, `refused`): kept; the compatibility runner maps it to PSys2's `conflicting`.
- Q9 (`complete=true` decides `no` against `unknown`): accepted; `compat/psys2/mapping.sop` reads it from `closed`.
- Q10 (entities outside the session): accepted; the runner tells an `e.user` wire first, and the one `$e.tom` case is to be checked in G8 and listed as a failure if the wire really is absent.

- Q11 (which replace figure is the target): answered, the cost once compiled; no further tuning of the cold run.
- Q12 (the four "received" cases): answered, `count` stays `missing` and the cases stay listed; the host asks for `received` itself.
- Q13 (what a host action sees between batched tells): answered, lazy propagation accepted with three conditions (every involved tell named, `ctx.flush()` and `{ now: true }`, two tests); done in P3.
- Q14 (namespace separator): answered by the user, `::` (the only sign with no other meaning); used in R7.9.
- Q15 (name of a deny's priority): answered, `priority=` kept.
- Q16 (`expr=`): answered, not in v1.2; revisit only with a rule that still needs more than about 8 calc/check wires after the built-ins.
- Q17 (words): answered, (b) `core.word lang= text= means= of=`; built in R9.1.
- Q18 (roles): answered, (a) no `role=`; `means=type.key` carries it.
- Q19 (words left out before assumptions): answered, (b) kept.
- Q20 (`groups=` spelling): accepted, `groups=<value>` or `groups=$<pattern>`.
- Q21 (`value=` on core.word): accepted, no `value=`; `means=<value> of=<type.key>` stands.
- Q22 (one of in a pattern): answered (a); a repeated key stays "all of", "one of" is two denies, no `one_of` built-in.
- Q23 (absent key): answered (b); `absent: [keys]` in the object form and `core.absent=` on question wires, built.
- Q24 (ordered sequences): report accepted; one wire per point stays (no notation inside values).
- Q25 (delegation): answered (a); the pattern becomes `std.fill`, ranks as named tiers.
- Q26 (PSys2's pattern set): answered (a); PSys2 copies patterns.sop and spec 03 into compat/psys2, then the index is measured on them.
- Q27 (ACTS × SCHEMAS): accepted as recommended; shipped in 0.18.0.
- Q-H8 (PSys2 hand-over, knowledge-loader): (a) done in 0.23: `createCatalog` (index, vocabulary, host reader, cache, host lemma, schemas first) and `tools/build-bundle.mjs` writing bundles in the shard format, read by `bundleReader`; refused: English lemma rules, k.objects drawing decode, faces, the evaluation-set generator.
- Q28 (shared store): (a) one value per key, a view restyles in its renderer; (b) the act `complete`, done in 0.24.
- Q29 (instances): (a) `core.use ... as=`, done in 0.24; words told after loading.
