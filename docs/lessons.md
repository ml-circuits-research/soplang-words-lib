# Lessons: how worlds are made and combined

What each round taught, from the library's own work, from the applications (PSys2, the
examples written from the docs) and from the case corpus. Each lesson ends with what the
library did, or will do, about it. Newest first.

## The case corpus finds what the tests did not (2026-11-14)

The first 17 language-free cases, taken from PSys2's hand-over tests, failed 7 times on a
library whose own tests were green: "make 2 tables" (no amount), "remove all the tables"
then undo (a retraction was not given back), a table that seats 2 taking a third guest (no
capacity), "white because that is the default" (a default an act wrote looked told). The
application's tests describe behaviour users ask for; the library's tests described what
the library already did. **Done:** `make` takes `amount`; a retraction is a statement in
the log, so undo gives it back; every act is one undo step however many statements it
makes; `std.schema.capacity`; defaults written by `make` are at the tier `default`. The
corpus (`cases/`, `node tools/cases.mjs`) runs in CI against a baseline that only grows.

## The path of a request is data, its stages are not (Round 25)

Which stages run, in what order, who provides each and what happens when one yields
nothing changes between applications; what a stage does (reading text, forking a world)
does not, and cannot be a rule. **Done:** `std.turn` + `turnFlow`; the declared default
gives what `turn` gives on 30 requests.

## A second application shows where the docs stop (Round 24)

Written from the docs alone, the recipe planner hit five gaps; the worst was joining two
things through a reference (`of=$rs`, not `of=?x`): the wrong rule ran without error and
scaled every ingredient by every recipe. Silent wrong answers come from what the docs do
not show, not from what they say wrong. **Done:** the join and "make into a container" are
in the docs; `turn` gives replies on every status. **Will do:** more applications from the
docs (a room planner, a timetable), each listing its gaps.

## General mechanisms hide in one application's code (Round 24)

PSys2's catalog, turn pipeline, routing and failure ledger were general but lived among its
tabs; each took 50–250 lines to move, and the moving refused what was English or about one
interface. **Done:** `createCatalog`, `turn`, `route`, the ledger; a take-over table in
capabilities. **Will do:** space selection and layouts, a per-kind act hook, a turn log.

## Reuse shows up as shape, but a name clash looks the same (Round 23)

The detector found real reuse (the board game in chess and tic-tac-toe; "a reference must
exist" in seven worlds; face parts that are object parts) and false reuse (two different
types named `item`). Shape under renaming is a good first signal and a poor judge.
**Done:** `tools/reuse.mjs` with verdicts by hand, the option `advise`, `core.use as=` for
parameterised worlds.

## One store, many views beats copying things between worlds (Round 22)

Three views over one set of things needed no synchronisation: an act in one is seen in the
others because there is only one wire. What views need is a declaration of what they show
(aspects) and a reason when a thing lacks it. **Done:** aspects, views, `show`, taught
facts at their own tier.

## Worlds as data need the acts to be generic code (Round 20)

A rule's template has a fixed type and fixed keys, so "make a <kind>" cannot be a rule;
entity-attribute-value wires would make it one but lose every slot check. Kinds stay
types, attributes stay slots, and one generic function per act does the writing.
**Done:** `std.schema`, `std.acts`; a third schema needs no rule.

## Costs come from re-running what did not change (Rounds 19–21)

Every large slowdown had one shape: a rule re-evaluated in full (core.absent, core.rank
per peer), or a withdrawal that re-matched a fact shared by thousands. **Done:** absent-only
rules driven by single wires; a rank ordered once per group; one wire requeued per
withdrawn firing, none when a wire it read is gone (a make on 2,000 things: 92,212 → 163
steps).

## A grammar world needs names of its own, and owns no noun (01:20 item 1)

PSys2's English facts did not use the library's type names. Their closed classes were
types of their own (`lang.en.det`, `lang.en.prep`), and their nouns lived elsewhere. The
parser read them only once three things became options: the fact types, which types are
closed classes, and the host's open-class lexicon. No English went into the library.
**Done:** `types`, `classes`, `lexicon`, `digits`. 11 of 11 noun-phrase examples parse
from the shards as they are.

## Resolution is separate from reading (01:20 item 2)

The grammar says which word is an ordinal or a pronoun. Which thing "the last red table"
is depends only on the world's things, `core.word` and the focus. Keeping the two apart
let one `resolve` serve a toy grammar and PSys2's English unchanged. **Done:** `resolve`,
with a tier for each answer.

## Applications show where the docs end (01:20 item 3)

The room planner and the timetable reused acts, boxes, fill, views, denies and the solver
without code in between. They also found six places where the docs or the library stopped
short (docs/reuse-reports/apps.md). Four are fixed (0.32–0.35); two are open.

## A host's resolver is the specification (03:30)

PSys2's two resolvers became one host function. Its semantics were exact sentences:
"a choice is asked, never both and never the last", and "a bare number takes the kind of
the part before". Each one became a line of `resolve` and an assertion in its test, with
the language left to the grammar, a knowledge world (which coordinator means a choice, which word
means "other"). Reading a host's tests is the fastest way to know what to build.
