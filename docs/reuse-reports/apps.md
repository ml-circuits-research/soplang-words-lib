# Two small applications from the docs: a room planner and a classroom timetable

The reviewer's 01:20 item 3 and the owner's 00:40 block asked for two applications, each written
from the documentation alone (quickstart, capabilities, reference, api):

- `examples/second-app/rooms.mjs`: a room planner (space + knowledge + views);
- `examples/second-app/timetable.mjs`: a classroom timetable (scheduling + people + time).

Both are tested in `test/apps.test.mjs`. This page lists what they reused, where the docs
were not enough, and what the library changed because of them.

## What each one is made of

| | room planner | timetable |
| --- | --- | --- |
| kinds | `room` (a type with slots), any piece the catalog names (`std.schema.kinds from=k.furniture`) | `lesson` (a type with slots, references to teacher, group, room, period) |
| acts | make, change, show (std.acts), a sentence of two makes | make, show, a sentence of four makes |
| space | `std.boxes`: `contains_box` (in the room) and `overlaps` (two pieces), as two `core.deny` | none |
| time | none | periods as wires (`day`, `n`); "away on a day" as a deny across teacher, period and lesson |
| knowledge | the usual `w`, `d` and `price` of a piece, offered to `std.fill` at tier `knowledge` with their source | none |
| views | `floor` (in, x, y, w, d) and `shopping` (price, colour) over the same pieces | `week` |
| words | `resolve` with a grammar of its own (8 wires) and `core.word text=couch means=sofa` | none (the requests are structured) |
| solver | none | `world.complete({ choose: true })` places the lessons left without a period and room |

Combinations that worked without any code in between:

- room planner: acts + boxes; acts + fill + a catalog; views + open kinds; resolve + core.word + acts;
- timetable: acts + denies; acts + the solver; denies + the solver (the denies prune the search).

That is 7 cooperating pairs.

## Where the docs were not enough

1. **Joining two patterns by reference.** To say "a piece in this room", the first try
   used an id attribute (`core.id=?room`), which does not exist. The idiom is `@rm room ...`
   followed by `@pin piece in=$rm`. Until now the reference showed `$p` only in templates.
   **Fixed:** a paragraph "Joining by reference" in reference.md, Patterns and templates.
2. **A kind named by `std.schema.kind` needs its own type and slots.** `make kind=room w=400`
   was refused ("a room has no w") until `room` was declared with `core.type` and slots.
   The reason is right, but the `std.schema.kind` row does not say that `of=` must be a
   declared type with its keys. Open.
3. **Knowledge as filler covers three keys only.** `std.know` offers `place`, `size` and
   `colour` from `k.commonsense.thing`. Any other key (`w`, `d`, `price`) needs nine lines of
   `std.fill` rules per key; the app generates them with a template loop. Proposed:
   `std.know.fill from=<type> match=<key> key=<key>` (rep.), so that one line per catalog
   and key does what the loop does. **Done in 0.35.0:** the room planner's 27 generated
   rules became one line.
4. **Values of open kinds are strings.** A piece made through `std.schema.kinds` has no
   slots, so `x=0` is stored as `"0"`. The boxes functions read numbers from strings, so
   nothing breaks, but `show` returns strings. A `std.schema.kinds` with slot kinds (or
   `extends=` a type) would fix it. Open.
5. **A view over every thing.** `show thing=* view=floor` was refused, because the room has
   no `plan` aspect. **Changed:** with `thing=*`, things the view does not show are left out
   and listed in `skipped`. It is refused only when nothing is left.
6. **The `complete` act is not the solver.** The act applies what `std.fill` chose. Placing
   the open lessons needs `world.complete({ choose: true })`, called by the host. The docs
   did not say that the two are different. **Fixed:** a sentence in api.md,
   `world.complete`.

## A generality to take next — it already existed

The rule "no X twice in one Y" is written three times in the timetable (teacher, group,
room per period) and three times in `examples/scheduling.mjs`. It needs no new module:
`core.type of=lesson unique=teacher,at unique=group,at unique=room,at` already says it
(reference.md, core.type `unique`). The timetable keeps its denies for their reasons
("the teacher has another lesson then"). The docs gap is that the capabilities page and
the scheduling example never show `unique=` on a type.
