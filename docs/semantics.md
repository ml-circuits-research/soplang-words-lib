# Semantics: what a world does, statement by statement

This page says how a world behaves, as numbered statements. Each statement names the
test that checks it (the name as it stands in `test/`); a test of the suite fails if a
name cited here does not exist. The language is in [language.md](language.md), the
wire types in [reference.md](reference.md), the methods in [api.md](api.md).

Words used as defined in the [glossary](glossary.md): *wire*, *fact*, *matrix*,
*pattern*, *template*, *cell* (one value of one key of one wire), *change*, *told*,
*derived*.

## Transaction

**S1.** Every change (`tell`, `fill`, `retract`, `replace`, `revise`, `applyPatch`,
`apply`, `act`, `step`) is one transaction: the statement is taken in, the rules are
applied to a fixpoint, the result is validated. If validation finds a violation,
everything the change did is undone, and the result has `ok: false` and the
violations. Nothing in between is ever visible.
*Test:* `refusal: deny constraint, and the world is left untouched`

**S2.** With `{ dry: true }` a change is evaluated and undone whatever the verdict; the
result says what would have happened.
*Test:* `dry run evaluates without changing anything`

**S3.** Listeners (`world.on`) are told of committed changes only.
*Test:* `events: listeners receive committed changes only`

**S4.** Every call has a budget of steps (and optionally of time). A change that runs
out is refused as a whole, with a violation of kind `budget` that names the place where
it stopped. *Why:* a host must be able to bound every call; a partial change would
break S1.
*Test:* `budget: tell stops in match, chase, negation, aggregate and validate, and nothing of it stays`

**S5.** A mistake in the matrix (a rule that names nothing, an unknown function) is a
violation of kind `schema` in the result of the change that told it, not an exception.
Matrix wires and facts have separate id spaces.
*Tests:* `matrix errors are reported, not thrown`; `matrix and facts have separate id spaces`

**S6.** After any accepted change the whole world is valid (`check()` finds nothing);
after a refused one the wires, the state stamp and the log are what they were.
*Test:* `semantics: an accepted change leaves a world that passes check(); a refused one leaves the world as it was`

## Identity and merging

**S7.** A fact is identified by the values of the identity keys of its type (slots with
`id=true`), when the type has any and the fact has a value for each. Two facts with the
same identity are one wire: the second id becomes another name for the first, and the
entries of the second are added to it. A different value for a single-valued key is a
`conflict`. Without identity keys a fact is identified by its id; the same id for a
different wire is `duplicate-id`. A statement that adds nothing is accepted. *Why
identity by keys:* two sources that speak about the same thing rarely agree on an id.
*Test:* `semantics: facts that agree on every identity key are one wire, whatever their ids`

**S7a.** Along one lineage the same identity is one wire, whatever the order: a fact of a
subtype and a fact of its supertype that agree on the identity the supertype declares
are one wire of the subtype (the more specific type). The wire keeps the id told first;
the other id is another name for it. Facts of two sibling types stay two wires. *Why:*
the order in which modules or sources speak must not change the world.
*Test:* `semantics: a subtype fact and a supertype fact with one identity are one wire of the subtype, in either order`

**S8.** Under a key whose slot is numeric, values are compared as numbers; elsewhere
as text. *Why:* `5` and `5.0` are one amount, but `007` and `7` are two names.
*Test:* `numbers: under a key declared integer or number, 5 and 5.0 are one value`

**S9.** A key may be written short (`name`) or qualified by its type (`city.name`);
both are the same key everywhere.
*Test:* `keys: short and qualified names are one key, in facts, fills, patterns and queries`

**S10.** Keys of an open namespace (always `core.`) are bookkeeping: they are not
validated, and a wire told again keeps the values of each statement.
*Tests:* `keys: an open namespace is always allowed and not validated unless a slot declares it`;
`bookkeeping: a wire told again keeps the bookkeeping of each statement; the sequence key may be declared late`

## Fixpoint and termination

**S11.** After a change, every rule is applied wherever its body matches, until nothing
new follows. The world reached does not depend on the order in which the statements
were told, nor on whether they came one by one or together.
*Test:* `deduction is incremental and order independent`

**S11a.** A value given to a key that no rule, deny, relation, aggregate, rank, state
or effect reads (no pattern names it, it is not an identity key, not the sequence key)
is validated but not propagated: no conclusion can depend on it. *Why:* editing text
that no rule looks at should cost what validating it costs (200 such values in a
1,200-wire world: 6.9 → 1.5 ms, `node bench/unread.mjs`).
*Test:* `patch: values of keys that nothing reads are validated but not propagated, with the same result`

**S11b.** Facts of a type that a host provides (`facts` option) are matched by every
pattern of that type as if they were wires, are `told`, and are never stored, forked,
logged or rebuilt; the provider is asked with the values the pattern fixes, and each
fact it returns costs one step of the budget. They are taken to be static: a conclusion
drawn from them is not re-examined. *Why:* a large reference table must not cost a
world its size in memory, snapshots and forks.
*Test:* `facts: a host provider is matched by rules, denies and questions like wires, and never stored, forked or logged`

**S11c.** A lazy rule (`lazy=true`) is run only for a question (`ask`, `query`), a check
(`check()`), or a deny that reads what it makes when something that deny or the lazy
rules read has changed; the answers and refusals are those of the same rule eager, and
what it makes never stays.
*Test:* `lazy rules: made only when a question, a check or a deny needs them, with the answers of eager rules`

**S12.** Rules may be recursive; the chase stops because a conclusion that is already
there adds nothing.
*Test:* `recursive rules reach a fixpoint; cycles are refused by a deny`

**S13.** A matrix whose rules never stop adding wires is stopped: a wire derived
through more than `maxDepth` (12) derived wires is a violation of kind `depth`, and
the chase has the budget of S4. The change is refused; the world stays as it was.
*Tests:* `runaway derivations are stopped by the depth budget`;
`budget: a matrix that explodes is stopped, not waited for`

**S14.** A conclusion that contradicts a value already there is a `conflict`, and the
change that led to it is refused. Rules never overwrite.
*Test:* `refusal: conflict with a derived value (identity key)`

**S15.** A template with `core.on=` adds entries to an existing wire; any other
template stands for a wire that is found by identity or made.
*Tests:* `rules: a template with core.on= adds its keys to the wire a pattern matched`;
`deduction: a missing wire is created, with provenance`

## Negation and absence

**S16.** Negation is stratified: a matrix in which a rule negates, or aggregates over,
something its own conclusions can produce is refused (`schema`). *Why:* without this
there is no single fixpoint to speak of.
*Tests:* `negation must be stratified`;
`aggregates: a rule may not aggregate over what its own consequences produce`

**S17.** `not=$p` holds while no wire matches `p` under the bindings of the rule. It
speaks of the world as it is now: when a matching wire arrives, what the rule concluded
is withdrawn.
*Tests:* `negation: a rule fires only while nothing matches the negated pattern`;
`negation: a conclusion is withdrawn when the absence it relied on ends`

**S18.** `core.absent=<key>` on a pattern matches a wire only while it has no value for
the key, and is kept up to date in the same way.
*Test:* `patterns: core.absent= matches only a wire without that key, and is kept up to date`

**S19.** Outside rules, absence is not falsehood: a question whether something exists
answers `unknown` when nothing matches, and `no` only for a type declared
`complete=true`. *Why:* a world usually holds part of what is true.
*Test:* `query: count and exists; "no" needs a type whose instances are all known`

## Defaults, completion and revision

**S20.** An open key is a required slot without a value. `open()` lists them.
*Test:* `completion: open keys are the required slots without a value`

**S21.** `complete()` fills an open key when exactly one value is consistent (tier
`forced`), and with `{ defaults: true }` applies defaults (tier `default`), also on
optional keys. Both are assumptions, not statements. What stays undecided becomes a
question wire with the consistent options.
*Tests:* `completion: forced values propagate, defaults are assumptions, rules add wires`;
`defaults: a default on an optional key is applied by complete({ defaults }) too, as an assumption`;
`completion: what cannot be decided becomes a question wire with the consistent options`

**S22.** An assumption gives way: a later told value for the same cell replaces it and
everything that followed from it, and a change that a deny would refuse only because of
assumptions is accepted by dropping those assumptions. The result lists them under
`revised`. First the assumptions under the conflicting cell are dropped; only if that
does not help, all on the wires involved.
*Tests:* `defaults are assumptions: a later statement replaces them and what followed from them`;
`defaults give way when a deny involves them`

**S23.** A told value does not give way by itself; `revise` replaces it in one
transaction, with everything that followed.
*Test:* `revise: a told value is replaced in one step, with everything that followed from it`

**S24.** `undo(n)` takes back the last n statements by rebuilding the world from the
ones that remain. A statement that only told or changed wires of a type declared
`transient=true` does not count and is told again afterwards where it still fits.
`redo(n)` tells again what undo took back, until a new statement that is not transient.
`mark()` and `rewind(mark)` return to an exact earlier world, also across retractions.
*Why transient:* moving a cursor or a selection is not an edit; undo should take back
the edit and leave the user where they are.
Marks may carry a label and are listed by `marks()`; `rewind(mark, { only })` returns one
type or id prefix to the mark and keeps the rest; `toJSON({ timeline: true })` carries the
open marks and the redo stack across a restart.
*Tests:* `undo, mark and rewind: taking statements back, and returning to an exact earlier world`;
`undo passes over transient state (a cursor, a selection); redo tells again what undo took back`;
`marks: labelled, listed, rewound for one unit only, and saved with the timeline`

## Certainty

**S25.** Every cell has a tier: `told` > `derived` > `forced` > `default` > `guessed`,
and any tier the matrix declares in between. The tier of a derived cell is the weakest
tier among the cells it was derived from. *Why the weakest:* a conclusion is no more
certain than its least certain premise.
*Test:* `tiers: every value knows how it got there, and a derived value is as weak as its weakest input`

**S26.** `assumptions()` lists every cell weaker than `derived`, weakest first, each
with the cells that rest on it.
*Test:* `tiers: assumptions() lists what is only assumed, weakest first, with what rests on each`

**S27.** A told value replaces any weaker value of the same cell (S22 for every tier
below `told`).
*Test:* `tiers: a told value replaces any weaker one, and what followed from it`

**S28.** A statement may carry its own tier, for all it says or for some keys
(`{ tier: { kind: 'default' } }`: those keys are assumed, the rest told); an adopted
explanation is `guessed`. A told value replaces such an assumption as any other (S27),
and the statement in the log then no longer says it. *Why per key:* a host that fills in
what the user did not say ("I assumed a bar chart") must be able to say which part was
assumed.
*Tests:* `tiers: a host states its own tier, declares its own, and an adopted explanation stays a guess`;
`tiers: a statement may tell some of its keys as assumptions; assumptions() lists them and a told value replaces them`

## Provenance and retraction

**S29.** Every derived wire and every filled value records the rule (`via`) and the
wires (`from`) it came from. A refusal names the told wires it rests on, and can be
explained after the change has been undone.
*Tests:* `deduction: a missing wire is created, with provenance`;
`refusals name the told wires they rest on`;
`violations: explainable after the change is undone; a reason may quote the values`

**S30.** Retracting a wire removes the wires that refer to it, withdraws what was
derived from them, and then derives again
what still follows from the rest; a conclusion with a second derivation survives.
*Tests:* `history: retract removes dependants and derived wires; fork is independent`;
`retract: a wire with a second derivation survives`

**S31.** A retraction is a change like any other: if the world without the wire is not
valid, it is refused.
*Test:* `retract: refused when it would break the world, and nothing changes`

**S32.** `replace` is retract and tell in one transaction; wires that refer to the
replaced one keep referring to it.
*Tests:* `replace: a state change is one transaction`;
`replace keeps the wires that refer to the replaced one`

## Sequence, states and as-of

**S33.** Wires are ordered by the sequence key if one is declared, else by arrival;
the order does not depend on the order of telling.
*Tests:* `sequence: a declared key orders wires whatever the order they are told in`;
`sequence: before, after, and the selectors latest and first`

**S34.** The value of a fluent is the last statement of it plus the effects of the
events after that statement, in sequence order. Without a statement it is unknown; a
declared `delta` key holds the known change even then.
*Tests:* `fluent: the value is the last statement plus the effects of later events, with provenance`;
`fluent: an unknown start stays unknown until something states it`;
`fluents: delta= exposes the known change since the last statement, also when the start is unknown`

**S35.** An event whose effect would break a bound or a deny is refused when it is
told; the state stays.
*Tests:* `fluent: an event that would break a bound is a conflict that names the event; nothing changes`;
`a deny over a state refuses the event that would break it, when the event is told`

**S36.** The state is a function of the wires, not of how they arrived: events applied
one by one, a replay of the log, and a retraction of an event give the state that the
remaining events define.
*Tests:* `fluent: events applied one by one give the same state and provenance as a full replay`;
`fluent: retracting or replacing an event recomputes; the log rebuilds the same state`

**S37.** `asOf(at, fn)` and the `at` option answer from the world as it was at that
place of the sequence, without changing the world.
*Test:* `as-of: ask and query see the world at an earlier point of the sequence`

## Aggregates

**S38.** An aggregate ranges over all matches of its `over` patterns under the
bindings of the rule (a group). Over an empty group `count` and `sum` are 0 and the
others have no result. A `core.aggregate` has no rule patterns: without `by` it has
exactly one result at all times (`default` where the aggregate has none), with `by` one
per value of the `by` variables among the matches. *Why:* a total or a count per kind
should not need a wire to hang on, nor one rule per kind.
*Tests:* `aggregates: count, sum, max, argmax and collect over the matches of a pattern, per group`;
`aggregates: an empty group counts 0 and sums 0; max, argmax and collect have nothing to say`;
`core.aggregate: one result even over nothing, one per group with by=, kept up to date, with no anchor wire`;
`core.rank: the position of a wire among its peers ordered by a key, kept up to date`

**S39.** Aggregates are kept up to date when wires arrive, change or go, and
recomputing only the groups that changed gives the same world as recomputing all.
*Tests:* `aggregates: kept up to date when wires arrive, change or leave`;
`aggregates: looking only at changed groups gives the same world as evaluating everything`

**S40.** A deny may speak about a group, and is checked also when a wire leaves it.
*Tests:* `aggregates: a deny can speak about a whole group, and names the wires behind it`;
`aggregates: a deny over a group is also checked when a wire leaves the group`;
`aggregates: a deny over a group is checked when a member arrives, also in a matrix with no rule at all`

**S41.** When several matches are equally best for `argmax` or `argmin`, the first in
the sequence is taken and the answer says `ambiguous` with the alternatives, unless
the calc says `ties=first` (the first, silently) or `ties=all` (every one of them, as
several values of the key the rule writes, in sequence order). *Why:* a host must not
present an arbitrary pick as the answer; a rule that wants all the leaders says so.
*Tests:* `aggregates: a tie for argmax or argmin is ambiguous, with the alternatives; ties=first picks one`;
`aggregates: ties=all gives a rule every tied pick of argmax or argmin, as several values`

## Relations

**S42.** A relation concludes a value only when it is the single unknown of that
relation; with all values known it is a constraint; with several unknown it waits.
Results are exact.
*Tests:* `relation: paid - total - change = 0 is solved for whichever of the three is missing`;
`relation: satisfied, conflicting, waiting; exact decimals; a kind the value does not fit`

**S43.** Relations are propagated to a fixpoint, one relation at a time. What follows
only from several relations taken together (two equations in two unknowns) is not
concluded; it is left to the search. *Why:* propagation is cheap and certain; solving
systems is neither, and belongs with the other search.
*Tests:* `relation: a chain of relations is propagated to a fixpoint; units must agree`;
`relation: propagation is local; what needs search is left to the search`

## Functions

**S43a.** A function runs only when a matrix wire that names it is evaluated: a calc or a
check in a rule, a deny or an action, an effect. A fact never calls one (a fact with
`fn=` is refused, `function-in-fact`). A function's work counts against the budget of the
call that evaluates it, like the rest of that call; the library does not stop a function
that loops. *Why:* a user's words are data; code runs only where the matrix says.
*Test:* `core.function: facts never call functions`

**S43b.** A function declared `pure=true` gives the same result for the same arguments
within one step, so the library calls it once per step for those arguments. Only pure
functions run where nothing is told: in lazy rules (refused when the matrix is compiled)
and in the overlays of `score` and `check` (the reading or the change is refused,
`impure`). A function that is not declared is called as before, with a note.
*Tests:* `core.function: pure results are kept for a step; impure functions are refused in lazy rules and in score and check overlays`;
`core.function: undeclared and unregistered functions are notes, not errors; a call to an unregistered one gives no result`

**S43c.** A declared function is checked where it is used: the number of arguments, the
kind of a literal argument, and that a check's function returns `boolean`.
*Test:* `core.function: declarations are listed and checked at load (count, kinds, a check returns boolean)`

## Search

**S44.** `solve`, `solveReport`, `satisfiable`, `suggest` and `next` look for values
of the open keys that the world accepts together. They do not change the world.
*Tests:* `solve and satisfiable: joint assignment of the open keys, without changing the world`;
`trial: what-if questions leave the world and its state stamp untouched`

**S45.** Every assignment a solver proposes is verified by the world itself before it
is returned; a solver can be wrong only by being slow.
*Tests:* `solvers: an outside solver that proposes a wrong answer is corrected by the world`;
`solvers: every strategy agrees with the reference on small instances, and answers are valid`

**S46.** The verdict is `sat` with an assignment, `unsat` only when the search covered
every combination and each was ruled out for a reason that holds in every completion,
and `unknown` otherwise (with `reason`): when the budget ran out, or when the matrix
has rules whose conclusions can be withdrawn (negation, absence, selectors), so that
trying values one at a time proves nothing.
*Tests:* `patch: three keys that need each other; no way out is unsat, a way out from outside is unknown`;
`patch: the solvers agree with brute force over check, on random problems with absence`;
`budget: the solvers answer unknown`

**S47.** With lookahead (the default), `suggest` offers a value only if some complete
assignment contains it; values that are valid only together are found, offered and
applied together.
*Tests:* `lookahead: a value with no joint completion is not offered, and the rest is forced`;
`patch: values that are only valid together are found, suggested and applied together`

**S48.** `abduce` returns sets of assumptions under which a goal holds, each verified
by applying it to a copy of the world; an explanation that a deny excludes is not
returned.
*Tests:* `abduction: a deny constraint eliminates an explanation`;
`abduction: nothing to assume when the goal already holds; nothing found when impossible`

## Queries

A query asks for the value of a key (`seek`) on the wires of a type that fit `where`,
or on one wire (`about`). It changes nothing. The status is decided in this order:

**S49.** `supported`: exactly one distinct value. The answer has `value`, the wires it
came `from`, the rule or producer `via`, and the `tier`.
*Tests:* `query: one value is supported, with the wires it came from`;
`query: a derived value names its rule; a producer computes what no wire has`

**S50.** The same value found on several wires is one answer: `supported`, with every
wire in `from`. `conflicting`: several distinct values of a single-valued key (listed under
`alternatives`), or one value that rests on a wire with a standing issue about that key
(a soft bound: `reason`, `issues`). The issue of a soft deny names no key: it is advice
about a combination of wires, and the answers that rest on those wires keep their status
and list it under `advice`. Several values of a key declared `many=true`, and several values with
`mode=list`, are `supported` and returned as `values`. *Why:* a key that may hold
several values (habitats, tags) is answered by all of them; two values where one is
expected are a contradiction to report.
*Tests:* `query: several distinct values are conflicting, with the alternatives; mode=list returns them all`;
`query: a key that may hold several values answers with all of them in value mode; a single-valued key still conflicts`;
`soft constraints: the change is accepted, the problem stays on record, answers that rest on it say so`;
`a soft deny is advice: the knowledge wires it read keep their status; a soft bound on the value still conflicts`;
`query: the same value on several wires is supported, with all of them; different values conflict`

**S51.** `ambiguous`: one value that is the pick of a tie (S41), or several values that
could be assumed for an open abducible key (`howto`).
*Tests:* `aggregates: a tie for argmax or argmin is ambiguous, with the alternatives; ties=first picks one`;
`abduction through query: a missing key that may be assumed comes with the values that would do`

**S52.** `missing`: no value. The answer names the open keys that would give one, with
their questions.
*Test:* `query: no value is missing, and names the open key with its question`

**S53.** When no wire fits, the world supposes one with the `where` values, lets the
rules run on it in a transaction that is undone, and answers from that; the answer
carries the supposed wire. If the supposed wire is refused the status is `refused`,
with the violations.
*Tests:* `query: with no matching wire the world supposes one and lets the rules answer`;
`query: an answer found by supposing carries the supposed wire as the rules left it`

**S54.** `unsupported`: the world supposed a wire (S53) and a function said why it has
no result for it (`reason`).
*Test:* `query: a calculation that cannot be done is unsupported, with the reason; decimals set the precision`

**S55.** `mode=count` is `supported` with the number; `mode=exists` is `supported`
with `yes`, else `no` or `unknown` (S19). A query that runs out of budget has status
`budget`.
*Tests:* `query: count and exists; "no" needs a type whose instances are all known`;
`budget: query, act, fill, apply, step, trial and asOf are guarded too`

**S55a.** `mode=check` asks whether the value given for the sought key (in `where` or as
`value`) is one the world holds or derives for the wire: `supported` with `yes`; `no`
with the values it does have (`actual`) and their `from` and `via`; `missing` when it
has none; any other status as a value query gives it. The value is compared, not
supposed. *Why:* "is a whale a fish?" must not be answered by supposing that it is.
*Test:* `query: mode=check says whether a held or derived value is the one given, and if not, what it is`

**S56.** A question may be an object, a wire or text, with the same effect; with
`{ record: true }` the question and its answer are told as wires.
*Test:* `query: a question wire has the same effect as an object; record writes the answer as a wire`

**S57.** `act` runs an action as one transaction (S1): `done` with the value,
`missing` with the arguments to ask for, `refused` with the violations and the world
unchanged. Inside a host function, an action is checked where it reads and at its end,
not after every tell, as a patch is (S59): `ctx.tell` queues the statement; the queue is
taken in (one log entry per statement), propagated and validated as one step at the
first read through the context (`find`, `val`, `vals`, `get`, `query`, `ask`, any use
of `ctx.world`), before `fill`, `replace` or `retract`, and at the end. A middle state
that a later tell of the same action repairs is therefore accepted. `ctx.flush()`
checks the queue at once, and `ctx.tell(x, { now: true })` checks that one tell as it
is told, as before. A refusal names, under `queued`, every queued tell involved in it
(`{ index, ids }`, in the order told). *Why:* propagating once costs what one change
costs, where propagating after each tell re-evaluates negations and aggregates once per
tell; an action that reads sees exactly what telling one by one gives.
*Tests:* `act: an action runs in one transaction and returns its result`;
`act: a refusal leaves the world unchanged and says why`;
`act: an action written as wires: parameters, a guard, writes that read the state before`;
`act: tells are checked where the action reads and at its end; a middle state a later tell repairs is accepted`;
`act: an action that reads after each tell gives exactly the results of telling one by one`

## Worlds side by side

**S58.** `fork()` gives an independent world with the same content, and neither sees
the other's changes. Nothing is copied at the fork; a change copies only the wires and
index entries it touches, so its cost does not depend on the size of the world. *Why:*
hosts fork or mark on every request, and a dry run in a fork must cost what the change
costs.
*Tests:* `fork: structural, independent in both directions, and cheap`;
`cow: forks of a large world are independent in both directions, after any number of forks and marks`

**S59.** `check(patch)` says what `applyPatch(patch)` would do and changes nothing;
`applyPatch` applies all of a patch or none of it; `diff` of a world and a fork that
applied the patch is the patch's effect, and is empty once both applied it.
`check(patch, { query, ask })`, `query(q, { given: patch })` and `ask(p, { given: patch })`
answer on the world as it would be with the patch, and change nothing. `sync` makes a
collection equal to a list as one such patch (tells, replacements in place,
retractions). A patch may
replace told wires in place: each keeps its id and the wires that refer to it, and gets
exactly the given keys; the replacement is a statement of its own in the log, so undo,
redo and replay treat it like the others. *Why:* an editor changes a paragraph without
renaming it, and the comments on it must stay.
*Tests:* `patch: check and applyPatch take wires and fills, all or nothing`;
`semantics: check(patch) changes nothing; applyPatch gives the world a fork that applied it has`;
`patch: replace in place keeps the id and what refers to it, changes and drops keys, and undoes as one statement`;
`patch: evaluate without telling: check(patch, { query, ask }) and query/ask with given answer on the world plus the patch`;
`sync: a collection is made equal to a list in one transaction, and the delta is returned`

**S60.** `check()` without a patch validates every wire against the whole matrix and
returns every violation and every standing issue; `describe()` and `diff()` return
plain data.
*Tests:* `check(): the whole world, every violation and every standing issue; World.audit for foreign wires`;
`describe: a summary as plain data; diff: what another world changes`

## Persistence and replay

**S61.** The log holds the statements as they were made, not what the wires grew
into. A world rebuilt from its snapshot (`toJSON` / `fromJSON`) equals the original.
*Tests:* `the log keeps what was told, not what the wires grew into`;
`persistence: a world is rebuilt from its JSON snapshot`

**S61a.** `world.version` is the same in a world and a fork just made from it, is left by
a statement that adds nothing, a dry run and a refused change, and is new after any
change. *Why:* a host caches by it, and must not recompute for a fork or a repeated
statement, nor reuse an answer for another state.
*Test:* `version: the same in a world and a fork just made, unchanged by a statement that adds nothing, new after any change`

**S62.** `told()` returns the facts as stated. Telling them again changes nothing;
telling them to a new world with the same matrix gives the same world.
*Test:* `told(): the facts as stated; telling them again changes nothing, telling them elsewhere gives the same world`

## Invariants

These hold between any two calls.

- **I1.** The world is valid: no hard violation exists (S6).
- **I2.** The world is at a fixpoint: no rule has an unapplied conclusion (S11).
- **I3.** Every derived wire and value has a derivation from wires that are there
  (S29, S30).
- **I4.** Every soft violation that holds has an issue wire, and no other issue wire
  exists (S50).
- **I5.** Every loop in the library is bounded by the budget or by the size of its
  input. *Test:* `budget: every loop and recursion in src/ ticks the budget or says why it is bounded`

## Violations

A violation is an object with `kind`, usually `why`, and what it is about (`id`, `key`,
`rule`, `wires`), the told wires it rests on (`support`) and those wires as they were
(`involved`). A deny's or a guard's violation also has its variables as data (`vars`),
for a host that words the message itself; `why` may write them through filters the host
registers ([reference](reference.md#coredeny)).

| Kind | Raised when | By |
| --- | --- | --- |
| `deny` | the body of a `core.deny` matches | any change |
| `conflict` | a second, different value for a single-valued key; a relation that does not hold; an effect that breaks a bound | any change |
| `domain` | a value does not fit the kind, type, enum or bounds of its slot | any change |
| `cardinality` | several values under a key that is not `many` | any change |
| `unknown-key` | a key that a closed type does not declare | any change |
| `dangling-ref` | a reference to a wire that does not exist; a retraction of a wire a `kind=ref` slot refers to | any change, `retract` |
| `unique` | a value (or a set of values) that another wire of the type already has | any change |
| `duplicate-id` | an id that another wire has | `tell` |
| `variable` | a fact contains a variable | `tell` |
| `schema` | the matrix is wrong: see the *Violations* of each type in the [reference](reference.md); also a module that the library does not have | `tell`, `load`, `use` |
| `depth` | a derivation deeper than `maxDepth` | any change |
| `budget` | the call ran out of steps or time | any call |
| `unknown-wire` | the id names no wire | `fill`, `retract`, `replace`, `revise`, patches |
| `dead-end` | in strict mode: no completion of the open keys exists | any change with `strict` |
| `guard` | an action's check failed, or its patterns matched nothing or too much | `act` |
| `refused`, `error` | an action function refused, or threw | `act` |
| `unknown-action` | no action of that name | `act` |
| `impure` | a declared function that is not `pure=true` would run on a reading or a change that is only tried | `score`, `check` |
| `function-in-fact` | a fact names `fn=`: only matrix wires call functions | any change |
| `nothing-to-undo` | no statement left | `undo` |
| `nothing-to-redo` | nothing undone since the last statement | `redo` |
| `unsupported` | the change would remove a wire that absorbed a told one | `retract`, `revise` |

Notes that refuse nothing are in `world.warnings`: `deprecated` (a pattern declared the
old way), `unknown-attribute` (an attribute a matrix wire type does not read),
`ambiguous-key` (a short key that two modules declare along one type's lineage, with
both qualified names), `unknown-word` (a `core.word` whose `means=` names nothing; words are in the world's one language, with no `lang=`), `undeclared-function` (a registered host function with no `core.function`) and `unregistered-function` (a declared function that is not registered; noted again, with `called`, when a calc or check calls it and gets no result).
