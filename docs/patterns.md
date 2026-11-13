# Patterns: how worlds combine

A catalogue (Round 23): ways one world can reuse another instead of restating it. Each has
when it applies, how it is said today in SOP Lang, a minimal example, and what is missing.
Some come from the owner's list, some from what `tools/reuse.mjs` found in PSys2's worlds,
in the examples and in the knowledge repo ([reports](reuse-reports/)). It is a study:
where something is uncertain it says so.

## 1. Shared things, several views

**When.** The same things are shown or edited by several worlds (a picture, a chart, a
list of the same objects).
**Today.** One module declares the things (`std.schema.thing` kinds and their slots);
each world imports it and reads the attributes it needs. An act in one world changes the
shared wire, so every other world sees it; there is one history.
**Example.** `examples/acts.mjs`: one face, any number of readers of `eye.colour`.
**Missing.** Declaring which attributes (aspects) a view shows, and refusing to show a
thing that lacks them ("a table has no place on Earth"): Round 22.

## 2. Filling by delegation

**When.** A request leaves out a value that another module knows (the place of a cup).
**Today.** `std.fill`: a need per key, offers in named tiers, the best tier chosen, the
source kept; `std.focus` and `std.know` offer. `examples/fill.mjs`, `examples/know.mjs`.
**Missing.** Nothing for the pattern itself; each catalog needs its adapter rule.

## 3. Defaults by tier

**When.** A value can come from several places of different strength (what was just
said, what was taught, the scene, knowledge, a default).
**Today.** std.fill's tiers (`user`, `focus`, `scene`, `knowledge`, `default`; a host adds
one with one wire) and the library's own tiers of a cell (`told`, `default`, ...).
**Missing.** A taught tier (above knowledge, below what was just said): Round 22 item 3.

## 4. Specialisation

**When.** A world is a kind of another with overrides (a seating plan for a wedding).
**Today.** `core.type extends=` for kinds (slots, rules and denies are inherited; the
nearest slot wins); a module imports another and adds slots and rules.
**Example.** `@t core.type of=wedding_table extends=table` with its own `default=`.
**Missing.** Overriding a parent's rule or deny by name (today a child can only add);
uncertain whether it is needed: none of the reports found a case.

## 5. Composition

**When.** A thing of one world is itself a world of another schema (a face in a picture,
a chart in a document).
**Today.** A reference slot (`type=`) from the outer thing to the inner world's things;
acts reach the inner things by id.
**Done:** acts reach inside with `in` and `in_nth` ("the eyes of the second face"),
reference std.acts. **Missing:** a world nested as a whole (a chart *document* inside a
document, with its own undo) — uncertain whether it is needed beyond `in`.

## 6. The parameterised world

**When.** One module, several instances with other names and words (a list as tasks,
shopping, playlist; a board game as chess, tic-tac-toe).
**Today.** `core.use world=<module> prefix=` loads a module under a prefix; words are
data. **Found:** chess and tic-tac-toe declare the same game keys (`user level seed`) and
the same move keys (`by n`), and the same "no move after the game is over" deny (PSys2
report, candidates 10, 14, 15).
**Example.** `examples/reuse.mjs`: one `board` module as tic-tac-toe and chess, one
`list` module as tasks, shopping and playlist, instantiated by renaming the module's
prefix in its text (`instance`).
**Done:** `core.use world=list as=tasks` loads a library module under another name, as many times as wanted (words are told after loading).

## 7. Rule lifting

**When.** A rule is about a kind, not a world: it holds wherever the kind is.
**Today.** Write the rule in the module that owns the kind; a world that imports it gets
the rule. **Found:** a selection or a reference must name something that exists (the same
deny in art.draw, diagram.sketch, docs.editor, docs.reader, data.charts, media.music,
ui.shell); no two things of a kind with the same name (`core.type unique=` says it in one
line); an exclusive pair ("not both") in k.space and k.values.
**Missing.** Nothing in the language; the rules are restated by hand. The detector's
"liftable" kind finds many false positives (two different types with one name).

## 8. Pipeline

**When.** The result of one world is the content of another (a sum becomes a chart; the
session's acts become a list).
**Today.** A rule in the second world reads the first's derived wires; with std.acts, the
`diff` of an act is the data to pass on.
**Missing.** The session as facts (Round 21 item 6, merged into Round 22).

## 9. Analogy

**When.** The structure of one world maps onto another's (seats ↔ slots, a row ↔ a queue,
a face's slots ↔ a layout's slots).
**Today.** `core.schema.map` maps a foreign shape onto the library's; types with the same
shape can extend one parent. **Found:** k.faces.point and k.objects.point are the same
type; a face part is an object part with a slot; a face slot is a layout slot (knowledge
report 1, 6, 8).
**Missing.** A declared mapping between two worlds' kinds and keys that acts follow
(uncertain: the found cases are better served by one shared type).

## 10. Shared words

**When.** Several worlds say the same thing with the same words (colour, size, remove).
**Today.** `core.word` in one module, imported. **Found:** colour words in k.faces and
k.values (they should come from k.colours).
**Missing.** Nothing; the detector's word overlap measures it.

## 11. The last thing (focus)

**When.** "It", "the last one", "again": a world needs what was made or named last.
**Found:** art.draw and diagram.sketch each keep their own `last` type (PSys2 report 19).
**Today.** `std.focus` (per turn, per kind). **Missing:** nothing; the worlds can use it.

## 12. A box aspect

**When.** Many kinds have a place and a size on a plane (layout slots, wearable places,
object parts, face parts). **Found:** knowledge report 9, 10.
**Today.** Each declares x, y, w, h. `std.boxes` has the functions, `std.relations` the
relations. **Missing:** an aspect (a set of keys a kind takes as a whole), which is also
what views need (Round 22).
