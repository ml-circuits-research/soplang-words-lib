# Semantic frames: one role set for every area

A reader that labels requests with the parameters of particular tools (`chart.colour`, `node.colour`, `part.colour`)
learns the same concept once per tool, needs new labels and data for every new tool, and fails as a whole when one of
hundreds of heads disagrees. A semantic frame labels what was said in a fixed, domain-general role set; the area is
context, not part of a label. The capability compiler, not the reader, decides which tool and which parameter a role
becomes, from declared rows (`std.capability.property concept on parameter`). A role no declaration takes is disclosed;
the rest of the request still compiles.

The frame is plain JSON (`sop.semantic-frame/1`) so a neural or grammar reader can produce it. It compiles to ordinary
`std.request` graphs, one per clause and theme, as the input of `prepareRequestBatch`. The optional `std.request`
slots listed below carry the frame roles that had no slot; a graph without them reads as before.

## The roles

A frame has `text`, optional `area`, optional `previous` (`{text, frame}` of the previous message), `clauses` and
`structure`. Each clause has these roles. Closed banks are in `FRAME_ROLES`.

| Role | Contents | Example |
| --- | --- | --- |
| `action` | `act` from a small generic bank (make, change, place, remove, connect, arrange, swap, copy, group, ungroup, merge, split, reverse, select, answer, undo, redo, compose, converse, show), `predicate` (the verb as said, open), `trigger` span, `mood` (do, ask, check, propose), `polarity` | "thicken the line": act change, predicate "thicken" |
| `mentions` | entity mentions, referred to by index from the other roles. Each has `head` (the noun as said), optional canonical `kind`, `span`, `determiner`, `quantity` (`{number}`, `{vague:"some"}` or `{all:true}`), `modifiers` (spans: "old", "hot air"), `possessor` (index of the whole or owner: "the roof of the house"), `reference` (new, name, description, anaphora, population, ordinal, code, context), `name`, `code` ("e1"), `ordinal` (first, last, 2), `antecedent` (`{clause, mention}` for an anaphor), `role` (theme, landmark, goal, possessor, member) | "the first and last node": head node, ordinal first and last |
| `attributes` | `theme` (mention index), `concept` (colour, size, label, shape, layout, …), `property_span`, `value_span`, `value`, `value_type`, `operator` (eq, degree, delta, factor, region), `step` (more, much_more, less, much_less), `unit`, `phase` (result or selector), `polarity` | "make the bars blue": colour = blue on "bars" |
| `spatial` | `theme`, `relation` (left_of, near, on, …), `landmark` (mention index), `region` (top, background, corner, …), `side`, `distance` (`{value, unit, span}`) | "1 inch to the right of his knee" |
| `motion` | `theme`, `direction` (up, down, left, right, closer, apart, forward, backward, in, out), `amount` (`{number, unit}` or `{degree}`) | "move problems higher" |
| `goal` | `theme`, the target state: `concept` and `value`, or a `mention` ("into a bar chart", "as a hexagon") | "arrange them as a circle": layout = circle |
| `time` | `role` (start, end, day, duration, recurrence), `span`, `value` | "next tuesday at noon" |
| `manner` | `objective` ("better", "readable", "natural"), `degree` (bit, much) | "improve the layout a bit" |
| `question` | `type` (count, exists, list, what, which, where, when, who, describe, why, how, how_much, compare, total, average, max, min, difference, percent), optional `concept` and `theme` | "how many dogs are there" |
| `fragment` | how a fragment completes the previous request: adds, replaces, repeats, more, less, confirms, rejects | "and higher still": more |
| `discourse` | thanks, greeting, complaint, correction, repetition, confirmation, rejection | "good work thanks" |

`structure.relations` lists `{type: sequence | condition | instead, from, to}` between clauses. Without relations,
clauses run in source order, each after the previous one. Coordination needs no relation: several theme mentions in one
clause share its action ("draw a cat and 2 dogs").

That is about 25 role heads, and the inventory does not grow when an area gains a tool.

## Compound requests and fragments

- **Compound**: one clause per request cut, with `structure.relations`; an anaphor across clauses names its antecedent
  ("Create a triangle. Move it to the right side": clause 1's mention has `reference: anaphora, antecedent: {clause: 0,
  mention: 0}`), and the compiled request of clause 1 runs after clause 0 and targets the same kind.
- **Coordination**: each theme mention of a clause becomes its own request with the clause's action and the roles that
  name it (`theme` index).
- **Fragments**: `completeFragment(frame)` completes a fragment from `frame.previous.frame`. A fragment with a theme
  of its own ("and a dog") keeps the previous action; one without ("on the lake", "bigger") applies its roles to the
  previous theme; `replaces` drops the previous role of the same concept; `more` and `less` repeat the previous
  attributes and motions one step further; `repeats` repeats the previous clause.

## Mapping to std.request

| Frame | std.request |
| --- | --- |
| clause × theme | one graph: `std.request act mood source`, its `std.request.target` (mode `new` for reference new, else `existing`), one batch entry with `after` from the structure |
| `action.predicate`, `polarity`, `fragment`, `discourse`, `question.type`, `manner` | optional slots `predicate`, `polarity`, `fragment`, `discourse`, `question`, `manner` (many), `degree` of `std.request` |
| mention | `std.request.target` with `kind`, `name`, `determiner` and optional `head`, `reference`, `code`, `ordinal` (many), `count`, `quantity`, `modifier` (many), `role`, `of` (the possessor's target) |
| quantity | a `concept=count operator=eq` result constraint (a vague amount takes the `typical` of its declared amount) |
| attribute | `std.request.constraint concept operator value` (+ `unit`, optional `step`, `valueType`); a selector attribute becomes the target's `selector` |
| spatial relation | `operator=relation relation goal=$landmark` (+ optional `landmark`, `side`; a measured distance with `measure unit from to`) |
| region | `operator=region value=<region>` (+ optional `region`) |
| motion | `concept=position operator=delta value direction` (`direction` is an optional slot) |
| goal, time | `operator=eq` constraints of their concept |
| question | `std.request.query` (count, exists, members, or values of a concept) with mood ask |

## API

- `inspectFrame(frame, {budget?})` checks shape, banks and indices.
- `completeFragment(frame)` completes fragments from the previous frame.
- `capabilityTable(world, scope)` reads the `std.capability` declarations of one scope as a plain table.
- `bindFrame(frame, table, {budget?})` binds every role against a table: `operations`, `kinds` (declared kind labels
  with their canonical kind and source type), `properties`, `repeats`, `objects`, and, from the host, `relations`
  (source types with a placement method for relations, with `relationValues` mapping frame relations to the names it
  declares; `regionPlacement` and `distancePlacement` for placement methods
  that also take regions or measured distances), `amounts` (named amounts with their typical count), `comparatives`
  (`{concept, step, factor}` or `{concept, step, ordinal}`), `actForms` and `concepts` (concept aliases). A property
  row may carry `canonical`, the spelling of the concept in its source type's declarations; the request uses it. A role binds only through a declared row. The result lists each role as `bound`
  (operation and parameter, placement, repeat or selector) or `unbound` with a reason.
- `frameToRequests(frame, {binding?, extended?, prefix?})` writes the graphs as batch entries. With a binding only bound
  roles are written and every other role is in `disclosed` with its span and reason; vague amounts are in `notes`.
  `extended: false` writes only the slots of the contract before version 0.237.0 and discloses the roles that need the
  new slots.

```js
import { World, FRAME_FORMAT, capabilityTable, bindFrame, frameToRequests } from 'sopworld';
const w = new World(); w.use('std.capability');
w.load(`@scope std.capability.scope instance="board" version="1"
@m std.capability.mode act=make target=new
@op std.capability.operation scope=$scope name="tile.make" act=make on="tile" order=0 eligible=true
@op.hue std.capability.parameter operation=$op name="hue" kind=string
@sq std.capability.target scope=$scope canonical=board.square label="square" operation=$op
@hue std.capability.property scope=$scope concept=colour on="tile" parameter="hue" order=0`);
const frame = { format: FRAME_FORMAT, text: 'add an irregular blue square', clauses: [{ action: { act: 'make' },
  mentions: [{ head: 'square', reference: 'new', modifiers: ['irregular'] }],
  attributes: [{ theme: 0, concept: 'colour', value: 'blue' }] }] };
const { entries, disclosed } = frameToRequests(frame, { binding: bindFrame(frame, capabilityTable(w, 'scope')) });
// one entry that makes a blue square; disclosed: the modifier "irregular" (no attribute concept takes it)
```

## Limits

- The binder decides availability from declarations; it does not execute, and a bound role can still fail at
  execution (a value outside a parameter's enum, a target that is not unique).
- Modifiers stay disclosed until a reader or a kind's declared enum slots turn them into attribute concepts.
- Motion binds only where a source type declares a `position` property; otherwise it is disclosed.
- Names and codes are matched exactly against observed objects; anaphora without an antecedent takes the most recent
  observed object only when the frame says `reference: context` or `anaphora`.
