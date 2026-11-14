# Reference: the wire types of the matrix, and the functions

One entry per wire type that the matrix language knows, all in the same shape, then the
functions. The grammar of wires is in [language.md](language.md); how a world behaves
as a whole is in [semantics.md](semantics.md); the methods are in [api.md](api.md).

In the syntax tables, *rep.* means the attribute may be repeated. A flag is `true` or
absent. An attribute that a type does not read is not an error; it is noted in
`world.warnings` (`unknown-attribute`), because it is usually a misspelling.

Every example on this page is run by the test suite; the output shown is what it
prints.

## Declaring what may exist

### core.slot

One key of one type: what it may hold, and whether it must be there.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `of` | type | required | | the type the key belongs to |
| `key` | name | required | | the key |
| `required` | flag | false | | a wire of the type without this key has an open key |
| `many` | flag | false | | the key may hold several values |
| `id` | flag | false | | the key is an identity key of the type |
| `prefix` | flag | false | | `key` is a prefix: every key that starts with it is this slot |
| `kind` | kind | none | yes | the sort of literal accepted (below) |
| `type` | type | none | yes | the value must be a reference to a wire of this type |
| `enum` | value | none | yes | the values accepted; also the key's domain |
| `min`, `max` | number | none | | bounds, for values that are numbers or quantities |
| `step` | number | none | | with `min` and `max`: the values `min`, `min+step`, ... are the key's domain |
| `default` | value | none | | the value assumed when nobody gave one |
| `ask` | string | none | | the question to put for this key when it is open |
| `soft` | flag | false | | a value outside `min`/`max` is accepted and recorded as an issue |
| `combine` | `intersect` \| `override` | none | | how this declaration combines with another of the same type and key |
| `why` | string | none | | the reason to give when a value is refused; `?value`, `?key`, `?id`, `?type`, and filters as in [core.deny](#coredeny) |
| `to` | type | none | | with `kind=ref`: the value must refer to a wire of this type |
| `unique` | flag | false | | no two wires of the type (in one namespace) have the same value |
| `excludes` | key | none | yes | a wire with this key may not also have that one (`x_about excludes=x`: never the exact number and the approximate one) |
| `by` | key | none | | with `type=T`: the value names a `T` wire by its value for this key (`drawing=horse`, `type=k.objects.object by=name`); checked once a loaded world declares `T`, open before |

Kinds: `integer`, `number` (integer or decimal), `boolean` (`true`, `false`), `string`
(quoted), `atom` (a name), `quantity.<name>` (a number with a unit), `time.<name>`
(`time.clock` 10:40, `time.date` 2026-01-30, any other name: an atom), `any`, `ref` (a reference; with `to=T`, to a wire of type `T`, and a wire it refers to
cannot be retracted while it does), `blob` and `json` (below). With
several `kind` and `type` attributes the value must fit one of them.

**Structured values.** Under a key whose slot says `kind=json` the value is a string whose
text is JSON (an object, an array or a scalar), at most 10 levels deep and 100,000
characters long. Two values that are the same JSON are the same value, whatever the
spelling (the order of keys, spaces): they are compared and indexed in one canonical
form. A pattern reads into it with a path after the key: `center.lat=?lat`,
`center.tags.0=?first` (array items by position; at most 10 names). A number or a
boolean at the path is an atom, so `9.190` matches `9.19`; a string is a string; an
object or array is its canonical JSON as a string; a path that is not there does not
match. Templates write the whole value. *Why:* a structured value (a point, a range,
a style) is kept as one value instead of being flattened into keys and a copy as text.

```js run
const w = new World();
w.load(`
  @k core.slot of=place key=center kind=json
  @p place center.lat=?lat
  @north core.check fn=gt args=?lat args=45
  @t place core.on=$p north=yes
  @r core.rule when=$p if=$north then=$t
`);
w.tell(`@a place center=${quote('{"lat":45.46,"lng":9.19}')}  @b place center=${quote('{"lat":41.9}')}`);
print(w.get('a').attrs.north, w.get('b').attrs.north, w.ask('@x place center.lng=9.190'));
```

```output
["yes"] undefined [{"x":"a"}]
```

**Opaque values.** Under a key whose slot says `kind=blob` the value is kept exactly as
given (text given to `fill` becomes a string value, whatever it contains), it is not
put in any index, and no rule or deny can read it: a pattern that names the key is a
`schema` violation, except `core.absent=<key>`. Two values are the same only when they
are equal. It is a value like any other for marks, `rewind`, `undo`, forks, snapshots
and queries. *Why:* a large immutable result (an analysis of a document, kilobytes to
megabytes) must undo with the rest of the world without costing anything to the rules;
in a 600-wire world a 1 MB value costs 3.6 ms to fill, 5.5 ms to tell as text, and
nothing to a fork or a mark (`node bench/blob.mjs`).

**Meaning.** For every fact of type `of` or of a type that extends it: each value of
`key` fits a kind or type if any is given, is in `enum` if given, lies within `min` and
`max` if given; the key has at most one value unless `many`; if `required`, the key is
open until it has a value. Under a key whose every kind is `integer` or `number`,
values are compared as numbers (`5` is `5.0`). Two facts of the type that agree on all
identity keys are the same wire.

**When it is evaluated.** Validation, at the end of every change, for the wires the
change touched; for all wires when the matrix changes. Identity is applied when a wire
is told. `default`, `enum`, `min`/`max`/`step` and `ask` are read by completion and
search.

**Interactions.** *Inheritance:* a slot holds for subtypes; a subtype may declare the
key again, and the nearest declaration holds. *Two declarations for the same type and
key:* equal ones are one; different ones are refused unless one says `combine=`.
*Tiers:* a default is applied as tier `default`. *Soft:* see [core.issue](#coreissue).
*Closed types:* only declared keys (and keys of an open namespace) are accepted.

**Violations.** `domain` (kind, type, enum, bounds), `cardinality` (several values
without `many`), `unknown-key` (undeclared key on a closed type), `dangling-ref` (a reference to a wire that does not exist), `conflict` (a second,
different value told for a single-valued key), `schema` (bad or conflicting
declaration).

**Example**

```js run
const w = new World();
w.load(`
  @k1 core.slot of=tank key=name id=true
  @k2 core.slot of=tank key=level kind=number min=0 max=100 required=true ask="How full is it?"
`);
print(w.tell('@t1 tank name=north').ok, w.open());
print(w.tell('@t2 tank name=south level=140').violations[0].why);
print(w.tell('@again tank name=north level=40.0').merged, w.ask('tank level=40'));
```

```output
true [{"id":"t1","type":"tank","key":"level","ask":"How full is it?"}]
must be at most 100
[{"id":"again","into":"t1"}] [{}]
```

**Limits.** Bounds apply to numbers and quantities only. `enum` compares text, except
under a numeric kind. A range (`min`, `max`, `step`) is a domain only up to 2,000
values.

### core.type

A type: what it extends, whether its keys and its instances are all known.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `of` | type | required | | the type declared |
| `extends` | type | none | yes | its parent; more `extends` are slot groups (mixins): their slots and patterns apply too, after the type's own line |
| `closed` | flag | false | | wires of the type accept only declared keys |
| `complete` | flag | false | | the world knows every wire of the type |
| `transient` | flag | false | | state that is looked at, not edited (a selection, a cursor): `undo` passes over it |
| `unique` | key | none | yes | no two wires of the type have the same values for these keys together |
| `shared` | flag | false | | its wires belong to every [namespace](language.md#12-scope): matched and merged across them |

**Meaning.** A wire of a type is also a wire of every type its type extends: patterns,
slots, rules, denies, effects and queries written for an ancestor apply to it. A type
need not be declared to be used; declaring it adds the parent and the two flags.
`complete` changes one answer: asking whether a wire of the type exists is `no` when
none matches, where it would be `unknown`.

**When it is evaluated.** When the matrix is compiled; the hierarchy is then part of
every index, so matching by an ancestor type costs the same as by the type itself.

**Interactions.** *Slots:* inherited, nearest declaration wins. *Negation:* `not=` and
`core.absent=` do not need `complete`; they speak of what the world holds now.
*Changing the hierarchy* re-indexes the facts.

**Violations.** `schema` (a type that extends itself, directly or not; a type declared
twice with different parents), `unknown-key`.

**Example**

```js run
const w = new World();
w.load(`
  @t1 core.type of=vehicle complete=true
  @t2 core.type of=truck extends=vehicle closed=true
  @k  core.slot of=vehicle key=wheels kind=integer
`);
w.tell('@a truck wheels=6');
print(w.ask('@x vehicle wheels=?n'));
print(w.tell('@b truck colour=red').violations[0].kind);
print(w.query({ type: 'vehicle', where: { wheels: 2 }, mode: 'exists' }).status);
```

```output
[{"x":"a","n":"6"}]
unknown-key
no
```

**Limits.** One parent per type.

### core.namespace

A prefix of key names that is open: bookkeeping keys.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `prefix` | text ending in `.` | required | | keys that start with it belong to the namespace |
| `open` | flag | false | | the namespace is open |

**Meaning.** A key of an open namespace is accepted on every wire, also of a closed
type. Unless a slot declares that key: its values are not validated, a reference under
it need not name an existing wire and does not tie the wire to what it names, and the
key takes every value given (a wire told again does not conflict on it). `core.` is
always such a namespace.

**When it is evaluated.** Validation and merging.

**Interactions.** A slot for a key of the namespace makes that key an ordinary key.

**Violations.** None of its own.

**Example**

```js run
const w = new World();
w.load('@t core.type of=reading closed=true\n@k core.slot of=reading key=value kind=number\n@n core.namespace prefix=audit. open=true');
print(w.tell('@r1 reading value=3 audit.by=$sensor7 core.source="probe"').ok);
print(w.tell('@r2 reading value=3 note=x').violations[0].kind);
```

```output
true
unknown-key
```

**Limits.** A prefix, not a pattern.

### core.schema.map

How to read slot, type and module declarations that are written in another notation.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `from` | type | required | | the type of the foreign wires |
| `as` | `slot` \| `type` \| `module` | `slot` | | what they declare |
| one per field | where to find it | | | see below |

Fields for `as=slot`: `owner` (the type; default `id.prefix`), `key` (default
`id.suffix`), `value` (kinds and `$type` references together), `kind`, `type`, `enum`,
`many`, `required`, `id`, `prefix`, `default`, `ask`, `min`, `max`, `step`. For
`as=type`: `name`, `extends`, `closed`, `complete`, `transient`, `shared` (each true
when the field gives `true` or `yes`), `unique` (keys, repeated or comma-separated),
`root` (a type that every type without a parent extends). For `as=module`: `name`, `imports`.

A field is found by: `id` (the wire's id), `id.prefix` (its id up to the last dot),
`id.suffix` (the rest), `<attr>` (that attribute), `<attr>:<value>` (true when the
attribute has that value).

**Meaning.** Every wire of type `from` is read as the declaration it maps to, exactly
as if it had been written as a `core.slot` or `core.type` wire, and belongs to the
matrix.

**When it is evaluated.** When the matrix is compiled. The mapping must be told before,
or with, the wires it maps.

**Interactions.** Mapped wires may carry any other attributes (no `unknown-attribute`
note). Two different maps for one `from` are refused.

**Violations.** `schema`.

**Example**

```js run
const w = new World();
w.load(`
  @m1 core.schema.map from=field owner=id.prefix key=id.suffix value=is required=must:yes ask=prompt
  @m2 core.schema.map from=class as=type name=id extends=parent closed=sealed:yes
`);
w.load('@book class sealed=yes\n@book.title field is=string must=yes prompt="Which title?"');
print(w.schema('book').closed, w.schema('book').keys.title.required);
print(w.tell('@b1 book').ok, w.open().map((o) => o.ask));
```

```output
true true
true ["Which title?"]
```

**Limits.** One wire per declaration; a notation that spreads a slot over several
wires cannot be mapped.

### core.use

Load a matrix from the library.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `world` | module name | required | yes | the module, a key of `new World({ library })` |
| `prefix` | `false` | prefixed | | load the ids as written |
| `as` | name | the module name | | load the module under another name: its own prefix (`list.`) becomes this one (`tasks.`) in its ids, types and references |

**Meaning.** The text kept in the library under that name is told as part of the same
change. Unless `prefix=false`, every id it declares, and every reference among them,
gets the module name and a dot in front, so two modules cannot clash. A module is
loaded once per world, and once per `as` name: `core.use world=list as=tasks` and
`core.use world=list as=shopping` give two worlds of one module (words are told after
loading, as `core.word` wires). `world.use(name)` is the same as telling this wire.

**When it is evaluated.** When it is told.

**Interactions.** A module may contain `core.use` wires. The composition rules for
slots and types apply across modules. A module declares types and slots only under its
own name, and may limit what others read ([core.module](#coremodule)).

**Violations.** `schema` (no such module); whatever the module's own wires raise.

**Example**

```js run
const w = new World({ library: { units: '@k core.slot of=units.item key=weight kind=quantity.mass' } });
print(w.use('units').ok, [...w.matrix.keys()]);
print(w.tell('@i units.item weight=heavy').violations[0].why);
```

```output
true ["use.units","units.k"]
must be quantity.mass
```

**Limits.** A module cannot be unloaded.

### core.module

A module that names itself: what it imports and what other modules may read.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `name` | name | the wire's id | | the module, and the prefix of its types |
| `version` | text | none | | a label for the module's version, reported by `world.modules()`; nothing checks it |
| `imports` | module name | none | yes | modules of the library loaded with it, ids unchanged |
| `exports` | type | all its types | yes | the types other modules may read (`item` means `<name>.item`) |

**Meaning.** A module loaded from the library (by `core.use` or `imports`) may declare
types and slots only under its own prefix: `shop` declares `shop.item`, not `item` and
not `geo.place`. With `exports`, a rule or deny of another module may read only those
types (and their subtypes) of this module. `world.modules()` lists the modules with their `version`. After modules are joined, a short key that
two modules declare along one type's lineage is reported in `world.warnings`
(`ambiguous-key`, with both qualified names). The same can be declared through a
[core.schema.map](#coreschemamap) with `as=module` (its `exports` field).

**When it is evaluated.** When the matrix is compiled.

**Interactions.** *Modules without exports:* every type is readable, as before.
*Rules outside any module* (the host's own matrix) read everything. *Facts* are not in
modules; they may be in [namespaces](language.md#12-scope).

**Violations.** `schema` (a type or slot outside the module's prefix, naming the module
and the type; a rule that reads a type another module does not export, naming both
modules; a module declared twice with other imports; an import that is not in the
library). `duplicate-id` for a matrix id declared twice, naming both owners (the
application or a module); an import whose own declaration lost such a clash says so,
with the ids.

**Example**

```js run
const library = {
  shop: '@m core.module name=shop exports=item\n@k core.slot of=shop.item key=price kind=number\n@s core.slot of=shop.secret key=code',
  tax: '@p shop.item price=?p\n@c core.calc out=?t fn=mul args=?p args=0.2\n@t shop.item core.on=$p tax=?t\n@r core.rule when=$p with=$c then=$t',
  spy: '@p shop.secret code=?c\n@n note code=?c\n@r core.rule when=$p then=$n',
  bad: '@k core.slot of=shop.item key=colour',
};
const w = new World({ library });
print(w.use('shop').ok, w.use('tax').ok);
print(w.use('spy').violations[0].why);
print(w.use('bad').violations[0].why);
```

```output
true true
spy.r: module spy reads shop.secret, which module shop does not export (exports=shop.item)
bad.k: module bad declares the slot of type shop.item, which is not under its own prefix bad. (the prefix of module shop)
```

**Limits.** Exports name types, not keys. A `version` is a label: imports do not ask
for one.

## Saying what follows and what cannot be

### core.rule

If the patterns match, the templates hold.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `when` | `$pattern` | at least one | yes | patterns that must all match |
| `not` | `$pattern` | none | yes | patterns that must have no match |
| `with` | `$calc` | none | yes | values to compute, in order |
| `if` | `$check` | none | yes | conditions that must all hold |
| `then` | `$template` | at least one | yes | what then exists |
| `lazy` | flag | false | | made only when a question, a check or a deny needs it (below); only for structures rarely asked, since each question pays for all lazy rules |

**Meaning.** For every way of matching all `when` patterns at once (a variable has one
value throughout; `$p` in one pattern is the wire another pattern `@p` matched), such
that no `not` pattern matches under the same bindings, every `with` calc has a result
and every `if` check holds: each template, with the variables replaced, exists. A
template with `core.on=$p` adds its entries to the wire `@p` matched. Any other
template names a wire: if a fact has the same identity keys, or already has every entry
the template gives, it is that fact (and gets any entries it lacks); otherwise a new
fact is made. An entry whose variable has no value is left out.

**When it is evaluated.** In the chase, after every change, to a fixpoint: for the
wires that were added or changed, and again in full for rules with `not=`, a selector,
`core.absent=` or an aggregate when a type they read changed. What a rule concluded is
withdrawn when one of the wires it read goes or changes.

**Interactions.** *Negation* must be stratified: a rule may not negate or aggregate
what its own conclusions can produce (a `core.on=` template counts only against
patterns that name a key it sets). *Depth:* a wire derived from derived wires more than
`maxDepth` (12) deep is refused. *Tiers:* a conclusion is as weak as the weakest value
it was read from. *Provenance:* `via` is the rule, `from` the matched wires, `cells`
the values read. *Identity:* a derived wire has an id made from the rule and the
bindings.

**Violations.** `schema` (names something that is not in the matrix; no `when` or no
`then`; not stratified; a variable in a template that no pattern binds and no calc
computes; an unknown function), `depth`, `conflict` (the conclusion contradicts a value
that is there).

**Example**

```js run
const w = new World();
w.load(`
  @p parent of=?x child=?y
  @q parent of=?y child=?z
  @g grandparent of=?x child=?z
  @r core.rule when=$p when=$q then=$g
`);
w.tell('@a parent of=ann child=bob  @b parent of=bob child=cy');
print(w.ask('grandparent of=?x child=?z'));
w.retract('b');
print(w.ask('grandparent of=?x child=?z'));
```

```output
[{"z":"cy","x":"ann"}]
[]
```

**Lazy rules.** With `lazy=true` a rule is not run when the world changes. `ask`, `query`
and `check()` run the lazy rules first (to a fixpoint, in a transaction that is then
undone), so they answer as if the rules were eager; a deny that reads what lazy rules make
does the same whenever something it or those rules read has changed. What a lazy rule
makes never stays in the world (`get`, `ofType`, `toSOP` do not see it). A rule that is
not lazy may not read what a lazy rule makes (`schema`). *Why:* a structure that many
changes would re-derive but few questions read (lines of attack on a board) should cost
when it is read. The cost moves to the questions: in `node bench/lazy.mjs` (800 lines
from 200 pieces) a turn costs 0.01 ms instead of 0.9 ms, and a question 8.8 ms instead of
0.04 ms, because all lazy rules run for each question; it pays when questions are rarer
than about one in ten changes, and not when a deny reads the lazy output on every change.

**Limits.** No recursion through negation. A rule fires once per distinct set of
bindings.

### core.deny

The patterns must not match.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `when`, `not`, `with`, `if` | as in [core.rule](#corerule) | | yes | |
| `why` | string | none | | the reason; `?v` writes a variable's value, `?v:f` writes it through the registered filter `f` |
| `soft` | flag | false | | record an issue instead of refusing |
| `priority` | number | none | | when one change breaks several denies, the lower number is reported first |

**Meaning.** No change may leave the world in a state where the body matches. A change
that would is refused as a whole, with `why` (variables replaced by their values) and
the wires that matched. With `soft=true` nothing is refused: see
[core.issue](#coreissue).

**When it is evaluated.** Validation, at the end of every change, after the chase:
from the wires the change touched; in full for denies with `not=`, a selector or
`core.absent=`, and when the matrix changes.

**Interactions.** *Search:* denies without negation, selectors, aggregates or computed
values are turned into ruled-out combinations for the solvers; the others are checked
when a whole assignment is verified. *States:* a deny over a fluent is checked when an
event changes it, so the event is what is refused.

**Violations.** `deny`, with `rule`, `why`, `bindings` (every variable and matched wire,
as tokens), `vars` (the variables as data: strings as their text, plain numbers as
numbers, no wire ids), `wires`, `support`, `involved`.

**Filters.** In `why`, `?n:ordinal` writes the value of `?n` through the filter
`ordinal`, which the host registers (a variable with several values, from `collect` or
`ties=all`, reaches the filter as one list, and `vars` holds it as a list; written
without a filter, its values are joined with ", ") (`new World({ filters })` or
`world.register('filter', name, fn)`; `fn(value, { world, name })` returns the text). No
filter is built in, so the core holds no language: a host registers the ones of its
own. A filter that is not registered is a `schema` violation of the deny. A colon not
followed by a name is text (`?n: too many`).

**Example**

```js run
const w = new World();
w.load(`
  @a booking room=?r slot=?s
  @b booking room=?r slot=?s
  @differ core.check fn=neq args=$a args=$b
  @clash core.deny when=$a when=$b if=$differ why="room ?r is taken at ?s"
`);
w.tell('@b1 booking room=blue slot=9');
const r = w.tell('@b2 booking room=blue slot=9');
print(r.ok, r.violations[0].why, r.violations[0].wires);
print(w.has('b2'));
```

```output
false room blue is taken at 9 ["b2","b1"]
false
```

**Limits.** A deny says what must not be; to require that something exists, use a
required slot or a rule.

### core.calc

A value computed by a function, inside a rule, deny or action.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `out` | `?variable` | required | | the variable that gets the result |
| `fn` | function name | required | | a [function](#functions), or with `over=` an [aggregate](#aggregates) |
| `args` | value or `?variable` | none | yes | the arguments, in order |
| `over` | `$pattern` | none | yes | makes it an aggregate over the matches of these patterns |
| `pick` | `?variable` | none | | for `argmax`/`argmin`: what to return for the best match |
| `ties` | `first` \| `all` | report ties | | for `argmax`/`argmin`: `first` takes the first of equals silently; `all` gives every one of them, as several values |
| `relation` | flag | false | | for `fn=add`/`sub`: the rule also works backwards ([core.relation](#corerelation)) |

**Meaning.** After the patterns matched, `out` is bound to `fn(args)`. If a function
has no result (an argument without a value, a division by zero, units that differ) the
rule does not fire for those bindings. Calcs are computed in the order of the `with=`
attributes; a later one may use the `out` of an earlier one.

**When it is evaluated.** Each time its rule's body is evaluated.

**Interactions.** *Precision:* results are rounded as [core.precision](#coreprecision)
says. *Abduction* can run `add`, `sub`, `mul`, `div` backwards. *Queries:* a function
may say why it has no result (`world.cannot`), and the query answers `unsupported`.

**Violations.** `schema` (unknown function, no `out`).

**Example**

```js run
const w = new World();
w.load(`
  @l line qty=?q price=?p
  @c1 core.calc out=?net fn=mul args=?q args=?p
  @c2 core.calc out=?gross fn=mul args=?net args=1.2
  @t line core.on=$l net=?net gross=?gross
  @r core.rule when=$l with=$c1 with=$c2 then=$t
`);
w.tell('@l1 line qty=3 price=2.50');
print(w.get('l1').attrs.net, w.get('l1').attrs.gross);
```

```output
["7.5"] ["9"]
```

**Limits.** A function sees only its arguments and the world; it must not change the
world.

### core.aggregate

One aggregate over every match of some patterns, with no wire to anchor it: a total, a
count per kind, the longest of something.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `over` | `$pattern` | required | yes | the patterns it ranges over |
| `count`, `sum`, `min`, `max`, `argmin`, `argmax`, `collect` | `?variable` | | | the result, by the name of its [aggregate](#aggregates): `count=?c` |
| `fn` | aggregate name | | | instead: the aggregate, with `out` |
| `out` | `?variable` | | | with `fn`: the variable that gets the result |
| `args` | `?variable` | none | | the value taken from each match (for all but `count`) |
| `pick` | `?variable` | | | for `argmax`/`argmin`: what to return for the best match |
| `ties` | `first` \| `all` | report ties | | as on [core.calc](#corecalc) |
| `by` | `?variable` | none | yes | one result per value of these variables among the matches |
| `groups` | value \| `$pattern` | none | yes | with one `by` variable: groups that always have a result, members or not (a value, or every wire the pattern matches, as `$id`) |
| `default` | value | none | | the result when there is nothing to aggregate (and for a declared group with no member) |
| `then` | `$template` | | yes | what holds, with the result (and the `by` variables) |

**Meaning.** Without `by`: exactly one result exists at all times, computed over every
match of the `over` patterns; over no match, `count` and `sum` give 0 and the others
give `default` (or nothing, and then the templates do not hold). With `by`: one result
for each distinct value of the `by` variables among the matches; a value that no match
has any more has no result. With `groups=`, every declared group has a result as well:
an empty one gets `count` 0, or `default` when given; a group named by a pattern comes and
goes with the wires the pattern matches. The templates hold with the result, like the conclusion of
a [rule](#corerule).

**When it is evaluated.** In the chase, with the other aggregates: when the matrix
changes, and for the groups whose wires arrive, change or go (and, with `groups=$pattern`,
for a group wire that arrives or goes).

**Interactions.** *Distinct anchors:* `by=` is the way to compute something once per
distinct value: a rule anchored on a member computes it once per member (2,000 members in
50 groups: 238 ms against 15 ms, `node bench/distinct.mjs`). *Withdrawal:* when the result changes, the old conclusion is withdrawn
and the new one made. *Identity:* the templates of two aggregates should differ in type
or in a key, since a template that has every entry of an existing wire is that wire.
*Stratification:* an aggregate may not range over what its own templates produce.
*Namespaces:* a result is in the namespace of the wires it counts, in the default one
when they span several ([SC5a](language.md#12-scope)).
*Provenance:* `via` is the aggregate's id.

**Violations.** `schema` (no result, both `fn=` and a result name, no `over`, a `by`
variable that no `over` pattern has, a pattern that names a blob key, `groups=` without
exactly one `by` variable).

**Example**

```js run
const w = new World();
w.load(`
  @t task status=?s
  @n core.aggregate over=$t count=?c then=$all
  @all total of=tasks count=?c
  @k core.aggregate over=$t by=?s count=?c then=$per
  @per tally status=?s count=?c
`);
print(w.ofType('total').map((x) => x.attrs.count[0]));
w.tell('@t1 task status=todo  @t2 task status=done  @t3 task status=todo');
print(w.ofType('total').map((x) => x.attrs.count[0]), w.ofType('tally').map((x) => `${x.attrs.status}:${x.attrs.count}`));
const g = new World();
g.load(`
  @t task status=?s
  @k core.aggregate over=$t by=?s count=?c groups=todo groups=doing groups=done then=$per
  @per tally status=?s count=?c
`);
g.tell('@t1 task status=todo');
print(g.ofType('tally').map((x) => `${x.attrs.status}:${x.attrs.count}`).sort());
```

```output
["0"]
["3"] ["todo:2","done:1"]
["doing:0","done:0","todo:1"]
```

**Limits.** One aggregate per wire; for several results over the same patterns, write
several aggregates, or a rule with several calcs. With no anchor it ranges over every
[namespace](language.md#12-scope); to count within one, aggregate in a rule anchored
on a wire of that namespace.

### core.rank

The position of a wire among its peers, ordered by a key: "the 2nd chapter".

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `of` | `$pattern` | required | | one of the rule's `when=` patterns: the wire whose position is wanted |
| `by` | key | required | | the key that orders the peers |
| `out` | `?variable` | required | | gets the position, from 1 |
| `order` | `asc` \| `desc` | `asc` | | smallest first, or largest first |
| `within` | `?variable` | none | yes | peers share the value of these variables of the pattern |

It is named in a rule's `with=`, like a [core.calc](#corecalc).

**Meaning.** The peers of the wire `of` matched are the wires that fit the pattern's
fixed values (and, with `within`, share the values of those variables); every other
variable of the pattern is free. They are ordered by the value of `by`, as numbers when
both values are numbers, else as times or as text; equal values keep the order of the
sequence. `out` is the position of the wire among them.

**When it is evaluated.** With its rule. It is an aggregate over the peers, so when a
peer arrives, changes or goes, the positions of its group are computed again.

**Interactions.** As for aggregates: kept up to date, withdrawn and remade when the
position changes; a rule may not rank what its own conclusions produce.

**Violations.** `schema` (`of` is not a `when=` pattern of the rule, no `by`, an `order`
other than `asc` or `desc`, a `within` variable the pattern does not have).

**Example**

```js run
const w = new World();
w.load(`
  @k core.slot of=chapter key=at kind=number
  @c chapter book=?b at=?a
  @r core.rank of=$c by=at within=?b out=?pos
  @t chapter core.on=$c position=?pos
  @rule core.rule when=$c with=$r then=$t
`);
w.tell('@c1 chapter book=rain at=30  @c2 chapter book=rain at=10  @c3 chapter book=sun at=5');
print(['c1', 'c2', 'c3'].map((id) => w.get(id).attrs.position[0]));
w.tell('@c4 chapter book=rain at=20');
print(['c1', 'c2', 'c3', 'c4'].map((id) => w.get(id).attrs.position[0]));
```

```output
["2","1","1"]
["3","1","1","2"]
```

**Limits.** One key orders the peers; to order by two keys, derive a key that combines
them.

### core.check

A condition computed by a function, inside a rule, deny or action.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `fn` | function name | required | | a comparison or any function that returns true or false |
| `args` | value, `?variable` or `$pattern` | none | yes | the arguments |
| `why` | string | none | | for the guard of an action: the reason when it fails |

**Meaning.** The body holds only if `fn(args)` is true. A check whose arguments are not
all known does not hold.

**When it is evaluated.** With its rule or deny, after the calcs.

**Interactions.** `$pattern` as an argument is the id of the matched wire, for
`eq`/`neq` (two different wires) and `before`/`after`. The old name `core.test` is
still read.

**Violations.** `schema` (unknown function).

**Example**

```js run
const w = new World();
w.load(`
  @r reading value=?v limit=?l
  @high core.check fn=gt args=?v args=?l
  @al alarm for=$r
  @rule core.rule when=$r if=$high then=$al
`);
w.tell('@r1 reading value=7 limit=5  @r2 reading value=3 limit=5');
print(w.ofType('alarm').map((a) => a.attrs.for[0]));
```

```output
["$r1"]
```

**Limits.** None beyond those of the function.

### core.relation

A linear relation among values, from which whichever one is missing is computed.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `when` | `$pattern` | at least one | yes | patterns whose entries bind the variables |
| `sum` | `?v` or `<n>*?v` | | yes | a term added |
| `sub` | `?v` or `<n>*?v` | | yes | a term subtracted |
| `equals` | number | `0` | | the constant |

**Meaning.** Wherever the patterns match, the sum of the `sum` terms minus the `sub`
terms equals `equals`. Each variable stands for one value of a matched wire (a cell).
After the known cells are put in: if none is unknown and the relation does not hold,
the change is refused; if exactly one is unknown, its value is computed, exactly, and
put on its wire; if several are unknown, nothing happens yet.

**When it is evaluated.** In the chase, like a rule: it is compiled into one rule per
cell.

**Interactions.** *Tiers:* a computed value is as weak as its weakest input.
*Slots:* the computed value must fit the cell's slot (an `integer` cell does not take
a half). *Units:* all values must have one unit, which the result takes. *Search:*
relations conclude only what one relation forces; trying values against each other is
left to the search. *Abduction* goes through relations. `relation=true` on a `core.calc`
with `fn=add` or `fn=sub` makes that calc such a relation over the cells of its rule.

**Violations.** `conflict` (the relation does not hold), `domain` (the value does not
fit), `schema` (a variable that is not the value of a key in the patterns).

**Example**

```js run
const w = new World();
w.load(`
  @p payment paid=?paid total=?total change=?chg
  @r core.relation when=$p sum=?paid sub=?total sub=?chg
`);
w.tell('@a payment paid=20 total=15  @b payment total=15 change=5  @c payment paid=20');
print(w.get('a').attrs.change, w.get('b').attrs.paid, Object.keys(w.get('c').attrs));
print(w.tell('@d payment paid=20 total=15 change=4').violations[0].kind);
```

```output
["5"] ["20"] ["paid"]
conflict
```

**Limits.** Linear only. A result whose decimal does not end is written with 12
significant digits. A variable that names the same cell in two patterns is read, never
solved for.

### Patterns and templates

Three attributes are read on patterns and templates of any type and are not part of
the wire described.

| Attribute | On | Value | Meaning |
| --- | --- | --- | --- |
| `core.absent` | pattern | key, rep. | matches only a wire that has no value for that key |
| `core.select` | pattern | `latest` \| `first` | of the wires that fit the bindings made so far, only the latest (first) in the sequence |
| `core.on` | template | `$pattern` | add the template's entries to the wire that pattern matched |

**Meaning.** As in the table. What a rule concluded from an absence or a selection is
withdrawn when the key is filled, or a later wire arrives.

**Joining by reference.** A value `$p` in a pattern is the wire that pattern `p` matched:
`@rm room w=?rw` and `@pin piece in=$rm x=?x` match a room and the pieces whose `in`
refers to it (the order of `when=` gives the order of the join). There is no attribute for
the id of a matched wire: a reference is the join.

**When it is evaluated.** With the rule. A rule whose only selection is `core.absent` on
its own patterns is driven by the wires it matches, like any rule: a match that a key
coming ends is taken back there. Rules that use `core.select`, and denies with
`core.absent`, are re-evaluated in full when a type they read changes.

**Interactions.** A rule may not fill a key that it requires to be absent (`schema`).
With either of the two pattern attributes in the matrix, the search stops trying values
one at a time ([semantics](semantics.md#search)).

**Example**

```js run
const w = new World();
w.load(`
  @t task core.absent=owner
  @f flag for=$t kind=unassigned
  @r1 core.rule when=$t then=$f
  @s core.sequence key=at
  @last reading sensor=?s value=?v core.select=latest
  @now sensor name=?s
  @cur sensor core.on=$now current=?v
  @r2 core.rule when=$now when=$last then=$cur
`);
w.tell('@t1 task  @s1 sensor name=a  @x reading sensor=a value=3 at=1  @y reading sensor=a value=8 at=2');
print(w.ofType('flag').length, w.get('s1').attrs.current);
w.fill('t1', 'owner', 'bo');
print(w.ofType('flag').length);
```

```output
1 ["8"]
0
```

**Limits.** `core.select` orders by the sequence only.

### core.abducible

What may be assumed when the world is asked what would have to be true.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `of` | type | required | | wires of this type may be assumed |
| `key` | name | none | | instead: a value for this key of an existing wire may be assumed |
| `cost` | number | `1` | | how reluctant the world is to assume it |

**Meaning.** `world.abduce(goal)` returns sets of assumptions, each a wire of an
abducible type or a value of an abducible key, under which the goal holds and the
world stays consistent; smallest and cheapest first.

**When it is evaluated.** Only by `abduce` and by a query for an open abducible key.

**Interactions.** Explanations are verified forwards, so denies apply. What is adopted
(`adopt`) has tier `guessed`.

**Violations.** `schema` (no `of`).

**Example**

```js run
const w = new World();
w.load(`
  @ab core.abducible of=rain
  @r rain place=?p
  @wet wet place=?p
  @rule core.rule when=$r then=$wet
`);
print(w.abduce('@goal wet place=lawn').map((e) => e.text.replace(/@\S+/, '@...')));
```

```output
["@... rain place=lawn"]
```

**Limits.** At most 4 assumptions per explanation and 3 rule steps deep, unless the
call says otherwise.

## Time and state

### core.sequence

Which key carries the place of a wire in time.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `key` | name | required | | a key whose numeric value is the wire's place |

**Meaning.** Wires are ordered by the value of that key; a wire without it takes the
place of the last wire that had one; ties are broken by arrival. Without this
declaration the order is the order of arrival. The order is what `before`, `after`,
`core.select`, fluents and `asOf` use.

**When it is evaluated.** When a wire is told. If the key is declared later, the wires
already there are given their places again.

**Interactions.** A wire told again (same identity) moves the sequence on to the place
it declares.

**Violations.** None of its own.

**Example**

```js run
const w = new World();
w.load('@s core.sequence key=at');
w.tell('@b step at=2  @a step at=1');
print(w.compare('a', 'b') < 0, w.seqOf('b'));
```

```output
true 2
```

**Limits.** One sequence per world; of two declarations the one compiled last holds.

### core.fluent

A key whose value is a state that events change.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `of` | type | required | | the type that has the state |
| `key` | name | required | | the key that holds it |
| `delta` | name | none | | a second key that holds the known change since the last statement |
| `by` | name | none | yes | keys that identify the holder (informative) |

**Meaning.** The value of the key on a wire is: the last value stated for it (told with
the wire, or filled later), then every [effect](#coreeffect) of the events after that
statement, in sequence order. A value told for the key of an existing wire is a new
statement, not a conflict. Without any statement the state is unknown, whatever the
events; with `delta`, the sum of the `add` and `sub` effects since the last statement
is kept under that key even then.

**When it is evaluated.** In the chase, when a holder or an event that affects it is
added, changed or removed.

**Interactions.** *Slots:* the state must stay within the slot's bounds, or the event
is refused; `soft=true` on the slot keeps the event and records an issue. *Retraction*
of an event recomputes the state. *As-of* gives the state at an earlier place.
*Tiers:* the state is as weak as the weakest of its events and its statement.

**Violations.** `conflict` (an effect would break the slot's bounds, or cannot be
computed), `schema`.

**Example**

```js run
const w = new World();
w.load(`
  @k core.slot of=account key=name id=true
  @f core.fluent of=account key=balance delta=moved
  @in core.effect on=deposit fluent=$f op=add amount=n where.name=to
  @out core.effect on=withdrawal fluent=$f op=sub amount=n where.name=from
`);
w.tell('@a account name=ann balance=100');
w.tell('@d1 deposit to=ann n=50');
w.tell('@w1 withdrawal from=ann n=30');
print(w.get('a').attrs.balance, w.get('a').attrs.moved);
print(w.asOf(w.seqOf('d1'), (x) => x.get('a').attrs.balance[0]));
w.fill('a', 'balance', 10);
print(w.get('a').attrs.balance, w.get('a').attrs.moved);
```

```output
["120"] ["20"]
150
["10"] undefined
```

**Limits.** One state per key; a state is a single value.

### core.effect

How one type of event changes one fluent.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `on` | type | required | | the type of the events |
| `fluent` | `$fluent` | required | | the fluent changed |
| `op` | `set` \| `add` \| `sub` \| function name | required | | how: replace, add, subtract, or `fn(state, amount)` |
| `amount` | name | | | the key of the event that holds the amount |
| `value` | value | | | instead of `amount`: a constant |
| `where.<holder key>` | name | | yes | the holder is the wire whose `<holder key>` equals this key of the event |
| `for` | name | | | instead of `where.`: the key of the event that refers to the holder |

**Meaning.** An event of type `on` (or a subtype) changes the state of each wire it
selects: with `where.`, every wire of the fluent's type that agrees on all the listed
keys; with `for`, the wire referred to. `set` works whether or not the state is known;
the others need a known state.

**When it is evaluated.** With its fluent.

**Interactions.** An event may have several effects (a transfer debits one holder and
credits another). An event that selects no holder changes nothing.

**Violations.** `schema` (unknown fluent or function; neither `where.` nor `for`).

**Example**

```js run
const w = new World();
w.load(`
  @f core.fluent of=lamp key=state
  @e1 core.effect on=switch_on fluent=$f op=set value=on for=lamp
  @e2 core.effect on=switch_off fluent=$f op=set value=off for=lamp
`);
w.tell('@l1 lamp');
w.tell('@s1 switch_on lamp=$l1');
print(w.get('l1').attrs.state);
w.tell('@s2 switch_off lamp=$l1');
print(w.get('l1').attrs.state, w.explain('l1').fills[0].via);
```

```output
["on"]
["off"] f
```

**Limits.** The amount is one value of the event.

## Questions, answers, actions

### core.question, core.answer, core.request

The wires a host uses to ask and to act, and the wire that records an answer. They are
facts, not matrix wires; `world.query` and `world.act` read them. The type names and
key names can be changed with the `vocabulary` option.

**Syntax**

| Wire | Attribute | Meaning |
| --- | --- | --- |
| `core.question` | `type` | the type of wire asked about |
| | `about` | instead of `type`: a wire, by reference |
| | `seek` | the key whose value is wanted |
| | `where.<key>` | rep.; the wire must have this value for this key |
| | `mode` | `value` (default), `list`, `count`, `exists`, `abduce` |
| `core.request` | `action` | the name of the action |
| | `arg.<name>` | rep.; an argument |
| `core.answer` | `to` | the question |
| | `status`, `value` | what was answered |
| | `core.from`, `core.via` | the wires and the rule or producer it came from |

**Meaning.** See [semantics](semantics.md#queries) for exactly when each status is
returned. A question changes nothing; with `{ record: true }` the question and a
`core.answer` wire are told.

**Example**

```js run
const w = new World();
w.tell('@i1 item name=bolt stock=40');
print(w.query('@q core.question type=item seek=stock where.name=bolt').value);
const r = w.query({ type: 'item', seek: 'stock', where: { name: 'bolt' } }, { record: true });
print(w.ofType('core.answer').map((a) => [a.attrs.value, a.attrs.status]));
```

```output
40
[[["40"],["supported"]]]
```

### core.producer

A host function that computes a key when it is asked for.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `of` | type | required | | the type |
| `key` | name | required | | the key it can compute |
| `fn` | producer name | required | | registered under `producers` |

**Meaning.** When a query seeks `key` on a wire of the type and the wire has no value
for it, the function is called with a context (`wire`, `val`, `find`, `world`); what it
returns is the answer, with `via` the producer. Nothing is stored.

**When it is evaluated.** On query only.

**Interactions.** Rules do not see produced values.

**Violations.** `schema` (unknown producer).

**Example**

```js run
const w = new World({ producers: { area: ({ wire, val }) => Number(val(wire, 'w')) * Number(val(wire, 'h')) } });
w.load('@p core.producer of=room key=area fn=area');
w.tell('@r1 room name=hall w=4 h=5');
const q = w.query({ type: 'room', seek: 'area', where: { name: 'hall' } });
print(q.status, q.value, q.via);
```

```output
supported 20 ["p"]
```

**Limits.** Read-only.

### core.action

An operation that changes the world on request.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `name` | name | required | | what a request calls it |
| `fn` | action name | | | a function registered under `actions`; without it the action is written as wires, with the attributes below |
| `required` | name | none | yes | with `fn`: arguments that must be given |
| `input` | name | none | yes | with `fn`: arguments it accepts (informative) |
| `ask.<arg>` | string | none | yes | the question to put when that argument is missing |
| `param` | name | none | yes | a parameter; `?<name>` is bound to the argument; all are required |
| `when` | `$pattern` | | yes | what the action reads |
| `with` | `$calc` | | yes | values it computes |
| `if` | `$check` | | yes | the guard: all must hold |
| `set` | `$template` with `core.on=` | | yes | replace the value of a key of a matched wire |
| `add` | `$template` | | yes | make a new wire |
| `remove` | `$pattern` | | yes | retract the matched wire |
| `returns` | `?variable` | none | | the value of the result |
| `all` | flag | false | | act on every match (else exactly one is needed) |

**Meaning.** `world.act` runs the action in one transaction. With `fn`: the function
gets a context (`find`, `val`, `vals`, `get`, `query`, `ask`, `tell`, `flush`, `fill`,
`replace`, `retract`, `world`) and the arguments; whatever it changed is kept only if
the world accepts all of it. Its tells are checked together where it reads and at its
end ([S57](semantics.md#queries)). Written as
wires: the patterns are matched with the parameters bound; the calcs and checks are
evaluated; then all writes are applied together. Every expression is evaluated on the
state before the action.

**When it is evaluated.** On request.

**Interactions.** *Actions the host carries out* need no `core.action`: describe their
parameters as the slots of a type named like the action (`@d core.slot of=draw key=kind
enum=circle enum=square required=true`); `world.score` then judges a reading `{ action:
'draw', args }` against those slots and the denies (`judgedBy`), lists the required ones
it lacks with their `ask`, and carries nothing out; `veto` reports `action-unavailable`
only for an action with neither. A missing argument returns `missing` with the question to ask. The
changes are statements like any other: they are in the history and can be undone.

**Violations.** `guard` (a check fails, nothing matches, or several match without
`all`), and whatever the writes raise; `schema`.

**Example**

```js run
const w = new World();
w.load(`
  @it item name=?item stock=?have
  @enough core.check fn=gte args=?have args=?count why="only ?have left"
  @left core.calc out=?rest fn=sub args=?have args=?count
  @w1 item core.on=$it stock=?rest
  @take core.action name=take param=item param=count when=$it with=$left if=$enough set=$w1 returns=?rest ask.count="How many?"
`);
w.tell('@i1 item name=bolt stock=40');
print(w.act({ action: 'take', args: { item: 'bolt', count: 10 } }).value);
print(w.act({ action: 'take', args: { item: 'bolt', count: 99 } }).violations[0].why);
print(w.act({ action: 'take', args: { item: 'bolt' } }).missing);
```

```output
30
only 30 left
[{"action":"take","key":"count","ask":"How many?"}]
```

**Limits.** Written as wires: no aggregates in its calcs; a `set` writes one value per
key.

### core.word

A word and the one name of the matrix it means: an action, a type, a key (`type.key`) or
a value of a slot. The words of a world are in one language, the one its matrix is
written in; translation is the host's, outside the world. Words are facts the host tells or loads, not
matrix wires, so namespaces, `sync`, undo and snapshots apply to them. Only
`world.interpret` and `world.words` read them.

**Syntax**

| Attribute | Meaning |
| --- | --- |
| `text` | rep.; the word as the host's front end gives it (compared without case); several are forms of one word |
| `means` | an action name, a type, `type.key`, or a value |
| `of` | `type.key`: the slot the value belongs to (needed when `means` is not an enum value, or to choose one slot) |

**Meaning.** A value written another way names its canonical spelling through `means`
and `of`: `@w core.word text=football means=ball of=item.name` reads "football" as the
value `ball` of `item.name`, and `interpret` puts `ball` (not "football") in what it
returns; `text=pounds means=gbp of=price.unit` does the same for an enum value. One wire, one
meaning: a text with two meanings is two wires, and
`world.score` chooses between the readings they give. A word whose `means` names
nothing is reported in `world.warnings` (`unknown-word`) when it is told or when the
matrix changes. Words keep their declaration order (the most usual first): see
[world.words](api.md#worldwords-and-worldinterpretframe-options).

**Example**

```js run
const w = new World();
w.load('@k core.slot of=meeting key=day enum=mon enum=tue required=true');
w.tell('@w1 core.word text=monday text=mondays means=mon of=meeting.day  @w2 core.word text=meet means=meeting');
print(w.interpret({ verb: 'meet', args: ['mondays'] }).candidates[0].wires);
w.tell('@w3 core.word text=friday means=fri of=meeting.day');
print(w.warnings[0].kind);
```

```output
@new meeting day=mon
unknown-word
```

**Limits.** One language per world, and none built in: tokenizing and morphology are the host's, through `text=` forms and a registered `lemma` function (`world.register('lemma', fn)`). The `lang=` key of 0.9–0.12 is gone.

## Certainty and soft constraints

### core.tier

A tier of certainty of the host's own.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `name` | name | the wire's id | | the tier |
| `below` | tier | `told` | | it is placed right below this one |
| `cost` | number | none | | carried along for the host |

**Meaning.** The built-in tiers are, strongest first, `told`, `derived`, `forced`,
`default`, `guessed`. A declared tier is inserted in that order. A statement says its
tier with `{ tier }`.

**When it is evaluated.** Tiers are computed when asked for (`world.tier`, queries,
`explain`, `assumptions`, `describe`).

**Interactions.** See [semantics](semantics.md#certainty).

**Violations.** `schema` (declared twice; `below` is not a tier). Stating an unknown
tier throws.

**Example**

```js run
const w = new World();
w.load('@t core.tier name=measured below=told\n@g gauge level=?l\n@a alarm for=$g level=?l\n@r core.rule when=$g then=$a');
w.tell('@g1 gauge level=95', { tier: 'measured' });
print(w.tier('g1', 'level'), w.tier(w.ofType('alarm')[0].id, 'level'));
```

```output
measured derived
```

**Limits.** Tiers are an order, not numbers to compute with.

### core.issue

A violation of a soft constraint, kept in the world while it lasts. It is a fact that
the world writes; a matrix does not declare it.

**Syntax**

| Attribute | Meaning |
| --- | --- |
| `rule` | the deny or slot that is violated |
| `about` | rep.; each wire involved |
| `key` | for a slot: the key |
| `why` | the reason |

**Meaning.** A `core.deny` with `soft=true`, or a `core.slot` with `min`/`max` and
`soft=true`, refuses nothing. While its condition holds, an issue wire exists; when it
no longer holds, the wire is gone. The change that caused it returns it under `issues`.

**When it is evaluated.** A soft deny in the chase (it is a rule that concludes an
issue); a soft bound in validation.

**Interactions.** A query whose answer rests on a wire with an issue about that key (a
soft bound) answers `conflicting`, with `reason` and `issues`. An issue of a soft deny
names no key: it is advice about the combination, so an answer that rests on one of its
wires keeps its status and lists it under `advice` (`{ issue, why }`). Rules may read issue wires. `world.check()`
and `world.describe()` list them.

**Example**

```js run
const w = new World();
w.load('@k core.slot of=tank key=level kind=number max=100 soft=true');
const r = w.tell('@t1 tank level=140');
print(r.ok, r.issues.map((i) => i.why));
print(w.query({ about: 't1', seek: 'level' }).status);
w.revise('t1', 'level', 80);
print(w.ofType('core.issue').length);
```

```output
true ["level must be at most 100"]
conflicting
0
```

### core.precision

How many decimals derived numbers keep.

**Syntax**

| Attribute | Value | Default | Rep. | Meaning |
| --- | --- | --- | --- | --- |
| `decimals` | 0 to 12 | 12 significant digits | | decimals kept |

**Meaning.** Every number that a calc, an aggregate or an effect produces is rounded
to that many decimals. Whole numbers stay whole; told values are never rewritten. The
`decimals` option of the world is the same setting; the wire wins.

**Example**

```js run
const w = new World();
w.load('@p core.precision decimals=2\n@s share total=?t people=?n\n@c core.calc out=?e fn=div args=?t args=?n\n@a share core.on=$s each=?e\n@r core.rule when=$s with=$c then=$a');
w.tell('@s1 share total=10 people=3  @s2 share total=10 people=4');
print(w.get('s1').attrs.each, w.get('s2').attrs.each);
```

```output
["3.33"] ["2.5"]
```

### core.function

A host function, declared in SOP Lang: the tools a world has are in its schema. A
function is written in the host's language and registered with `world.register`; its
declaration says its name, its arguments ([core.function.arg](#corefunctionarg)) and
their kinds, what it returns and whether it is pure. No code goes inside wires.

**Syntax**

| Attribute | Meaning |
| --- | --- |
| `name` | the name a calc or check uses in `fn=` |
| `out.kind` | the kind of what it returns (`number`, `boolean`, ...) |
| `pure` | `true`: the same arguments always give the same result and nothing else happens |
| `doc` | what it does, for readers |

**Meaning.** A `core.calc fn=` or `core.check fn=` that names a declared function must
give it a number of arguments it takes; a literal argument must fit the argument's
kind; a check's function must return `boolean`. A pure function's results are kept for
the current step, and it may run where nothing is told: in lazy rules and in the
overlays of `score` and `check`. A function that is not pure is refused there, with the
reason (`impure`). `world.functions()` lists the declarations. Built-in functions need no
declaration and cannot be declared.

**When it is evaluated.** When the matrix is compiled: declarations, argument counts and
kinds, a check's boolean, purity in lazy rules. A function runs when a calc, a check or
an effect that names it is evaluated, under the budget of the call.

**Interactions.** *Compatibility:* a registered function with no declaration still works,
with an `undeclared-function` note in `world.warnings`; a declared function that is not
registered is noted too (`unregistered-function`), and a calc that calls it gets no
result. *Facts:* only matrix wires call functions: a fact that names `fn=` is refused
(`function-in-fact`), so a user's words never run code. *Readers:* the declarations are
the formal description of a world's tools (see [design/formalization](design/formalization.md)).

**Violations.** `schema` (no name, declared twice, a built-in's name, an unknown kind, a
required argument after an optional one, a wrong number of arguments, a literal of the
wrong kind, a check whose function does not return boolean, an impure function in a lazy
rule); `impure` in `score` and `check`; `function-in-fact`.

**Example**

```js run
const w = new World({ fns: { distance: ([a, b]) => String(Math.abs(Number(a) - Number(b))) } });
w.load(`
  @f.distance core.function name=distance out.kind=number pure=true doc="how far apart two positions are"
  @f.distance.a core.function.arg of=$f.distance name=a kind=number
  @f.distance.b core.function.arg of=$f.distance name=b kind=number
  @p pair a=?a b=?b
  @c core.calc out=?d fn=distance args=?a args=?b
  @t pair core.on=$p gap=?d
  @r core.rule when=$p with=$c then=$t
`);
w.tell('@x pair a=2 b=7');
print(w.get('x').attrs.gap, w.functions().map((f) => [f.name, f.args.map((a) => a.name), f.pure]));
print(w.tell('@y note fn=distance').violations[0].kind);
```

```output
["5"] [["distance",["a","b"],true]]
function-in-fact
```

**Limits.** Kinds are checked for literal arguments; a variable's value is checked when
it fits a slot, not against the function. A pure function is trusted to be pure.

### core.function.arg

One argument of a declared host function, in order: one wire per argument, repeated
wires rather than a notation inside a value.

**Syntax**

| Attribute | Meaning |
| --- | --- |
| `of` | `$<the core.function wire>` |
| `name` | the argument's name |
| `kind` | the kind its value must have |
| `optional` | `true`: it may be left out (only after the required ones) |
| `doc` | what it is |

**Meaning.** The arguments of a function are its `core.function.arg` wires in the order
they are written; a calc or check gives them in that order (`args=` repeated).

**When it is evaluated.** When the matrix is compiled, with its function.

**Interactions.** See [core.function](#corefunction).

**Violations.** `schema` (`of` is not a core.function, no name, an unknown kind, a
required argument after an optional one).

**Example**

```js run
const w = new World();
w.load('@f core.function name=clamp3 out.kind=number pure=true\n@f.x core.function.arg of=$f name=x kind=number\n@f.hi core.function.arg of=$f name=hi kind=number optional=true');
print(w.functions()[0].args.map((a) => [a.name, a.kind, a.optional]));
```

```output
[["x","number",false],["hi","number",true]]
```

**Limits.** An argument has one kind; a function taking any value leaves `kind` out.

## The standard function pack

Pure functions declared in SOP Lang (`core.function`), shipped with the library and
opt-in: a matrix that says `core.use world=std.numbers` (or `std.order`, `std.boxes`)
gets their declarations and their code (`std.fill`, below, is rules only). `world.functions()` lists them; a host's function
or a host library module of the same name wins. Every function is checked where it is
used (number of arguments, literal kinds, a check returns boolean).

| Module | Function | Arguments | Result |
| --- | --- | --- | --- |
| std.numbers | average | two to eight numbers | their mean |
| std.numbers | median | one to eight numbers | the middle one (the mean of the two middle ones for an even count) |
| std.order | rank_in | a value, then one to eight numbers | its place among them, 1 for the smallest |
| std.order | nth_smallest | n, then one to eight numbers | the n-th smallest |
| std.order | nth_largest | n, then one to eight numbers | the n-th largest |
| std.boxes | centre_x, centre_y | x and w, or y and h | the middle of a box across, or down |
| std.boxes | overlaps | two boxes (x1 y1 w1 h1 x2 y2 w2 h2) | whether they share some area (touching edges do not) |
| std.boxes | contains_box | two boxes | whether the first holds the whole of the second |
| std.boxes | box_distance | two boxes | the distance between their centres |

A box is `x y w h`, its top left corner and its size, with `y` growing downwards. What
the pack does not repeat: `min`, `max`, `add`, `abs`, `round`, `clamp`, `between`,
`sign` and the comparisons are built in (below); a minimum, maximum, sum or count over
many wires is `core.aggregate`; the place of a wire among its peers is `core.rank`. The
pack's functions take the values of one match: for many wires, aggregate first.
`examples/space.mjs` writes "the middle one", "left of" and "in a row" with the pack and
rules only.

```js run
const w = new World();
w.load(`@u core.use world=std.boxes
  @b box x=?x w=?w
  @c core.calc out=?m fn=centre_x args=?x args=?w
  @t box core.on=$b middle=?m
  @r core.rule when=$b with=$c then=$t`);
w.tell('@b1 box x=10 w=20');
print(w.get('b1').attrs.middle, w.functions().map((f) => f.name).slice(0, 2));
```

```output
["20"] ["centre_x","centre_y"]
```

## std.fill: a value for a key a request left out

A module of the standard pack written in rules only (`core.use world=std.fill`). A host
says what is missing, other modules offer values in named tiers, and std.fill chooses,
for each missing key on its own.

| Type | Keys | Who writes it |
| --- | --- | --- |
| `std.fill.need` | `for` (the request), `key`; then `value`, `tier`, `source` | the host, by a rule on its request with `core.absent=<key>`; std.fill writes the choice |
| `std.fill.offer` | `for` (the need), `value`, `tier`, `source` | each filling module, by a rule |
| `std.fill.tier` | `name`, `rank` (1 is the best) | std.fill: `user` 1, `focus` 2, `scene` 3, `knowledge` 4, `default` 5; a host adds one with one wire |

**Meaning.** Each offer takes the rank of its tier. The offer of the best rank for a need
is chosen when it is alone at that rank: its `value`, `tier` and `source` are written onto
the need, by the rule `std.fill.choose`. Two or more offers at the best rank are a soft
deny (`"2 offers of the best tier for place of $q1"`): advice, nothing chosen. An offer
arriving, changing or going later decides again (S39a). An offer whose tier is not
declared has no rank and is never chosen. `examples/fill.mjs` fills where a thing goes,
how big it is and its colour at once, with fillers written once for every key.

```js run
const w = new World();
w.load(`@u core.use world=std.fill
  @g req thing=?t core.absent=place
  @gn std.fill.need for=$g key=place
  @gr core.rule when=$g then=$gn
  @q req thing=?t
  @n std.fill.need for=$q key=?k
  @us usual thing=?t key=?k value=?v
  @o std.fill.offer for=$n value=?v tier=knowledge source=usual
  @r core.rule when=$q when=$n when=$us then=$o`);
w.tell('@u1 usual thing=cup key=place value=table  @q1 req thing=cup');
const need = w.ofType('std.fill.need')[0];
print(need.attrs.value, need.attrs.tier, need.attrs.source);
```

```output
["table"] ["knowledge"] ["usual"]
```

## std.focus: what a dialogue is about

A module of the standard pack written in rules only (`core.use world=std.focus`; it
loads std.fill). The host writes three things, each one rule: a turn for every request,
a mention for each key a request names, a need (std.fill) for each key it leaves out.

| Type | Keys | Who writes it |
| --- | --- | --- |
| `std.focus.turn` | `of` (the request), `in` (the dialogue); then `pos`, `prev` | the host; std.focus numbers the turns of a dialogue in arrival order |
| `std.focus.mention` | `of` (the request), `kind`, `value` | the host, from what a request names |
| `std.focus.state` | `turn`, `kind`, `value` | std.focus: the focus after each turn |
| `std.focus.last` | `kind`; the state `value` | std.focus: the focus now, for `thing`, `action`, `place`, `world`; a host adds a kind with one wire |
| `std.dialogue.cue` | `kind` (`why`, `correction`, `continuation`, `answer`), `text` (rep.) | std.dialogue: a cue phrase the host names; `dialogueTurn` reads it |
| `std.dialogue.modal` | `world`, `active` (default true) | std.dialogue: this world sees a turn first while active |

**Meaning.** The focus after a turn is, for each kind, what the turn mentions, else the
focus after the turn before. A std.fill need of a request for a key gets the focus of
that kind after the turn before, as an offer of tier `focus`: "a red one" after "draw a
cup" is a drawing of a cup, and it stays one when a later turn moves on. A turn taken
back (retract, undo) gives the earlier focus again. A mention is what a request says, not
what it was completed with (a value chosen through std.fill is not a mention: the rules
would read their own conclusions through a negation). Dialogues with different `in` keep
separate focus. `examples/focus.mjs` runs "draw a cup on the table", "a red one", "move
it right", "and lower".

```js run
const w = new World();
w.load(`@u core.use world=std.focus
  @any req
  @turn std.focus.turn of=$any in=main
  @r1 core.rule when=$any then=$turn
  @sd req thing=?v
  @m std.focus.mention of=$sd kind=thing value=?v
  @r2 core.rule when=$sd then=$m
  @gap req core.absent=thing
  @n std.fill.need for=$gap key=thing
  @r3 core.rule when=$gap then=$n`);
w.tell('@q1 req thing=cup');
w.tell('@q2 req colour=red');
print(w.ofType('std.fill.need')[0].attrs.value, w.ofType('std.focus.last')[0].attrs.value);
```

```output
["cup"] ["cup"]
```

## std.relations: things in a picture and the relations kept between them

A module of the standard pack (`core.use world=std.relations`), written with rules, the
built-in arithmetic, `core.rank` and declared actions; no function of its own.

| Type | Keys | Meaning |
| --- | --- | --- |
| `std.relations.box` | `kind`, `w`, `h`; then `x`, `y`, `order` | a thing; `x y` its top left corner, `y` growing downwards; `order` its place among its kind from the left |
| `std.relations.at` | `thing`, `x`, `y` | a place told |
| `std.relations.keep` | `thing`, `rel`, `ref`; then `slot` | a place kept: `rel` is `on`, `in`, `next_to`, `above` or `in_front_of` |
| `std.relations.nth` | `kind`, `n`; then `item` | "the first cup": the n-th of a kind from the left |
| `std.relations.each` | `kind`, `w`, `h`, `rel`, `over` | one new thing of `kind` kept `rel` to every thing of kind `over`, also those that come later |
| `std.relations.spread` | `kind`, `over`; derives `std.relations.pair thing= ref=` | the things of one kind paired one to one, left to right, with those of another |

**Meaning.** A kept thing's place is computed from the thing it is kept to, and computed
again when that one moves (a chain follows: a cup on a book on a table). On: centred, its
bottom on the other's top; in: centred in it; above: centred, 10 above; in front of:
centred, its bottom 5 below the other's; next to: 5 to the right, bottoms aligned. Things
kept the same way to one thing stand in a row (5 apart), in the order they were kept. A
thing has one place: a told place and a kept one together are a `conflict`. The action
`relations.put_all` (`k`, `rel`, `ref`) puts every thing of a kind that has a told place
there, kept; `relations.put_pairs` (`s`, `rel`) puts each where a `spread` pairs it. Both
retract the told places; `undo` gives them back.

**What is rules only and what is not.** Rules only: the five relations, chains, rows,
"the first", "each" (with things that come later), the pairing of "one per place", and
moving things (declared actions with `all=true`). Not without a function: a row of
things of different widths (each would need the sum of the widths before it, an
aggregate over a part of the group), a group centred as a whole, and avoiding overlaps
with what else is there; the relations are boxes, so "on" a slope or "in" a shape that is
not a box needs geometry. `examples/relations.mjs` runs a scene.

```js run
const w = new World();
w.load('@u core.use world=std.relations');
w.tell(`@t std.relations.box kind=table w=100 h=20  @ta std.relations.at thing=$t x=0 y=80
  @b std.relations.box kind=book w=20 h=10  @kb std.relations.keep thing=$b rel=on ref=$t`);
w.revise('ta', { x: 50 });
print(w.get('b').attrs.x, w.get('b').attrs.y);
```

```output
["90"] ["70"]
```

## std.schema and std.acts: worlds that do things, declared as data

`core.use world=std.acts` (it loads `std.schema`). A world that does things is a schema,
not a program: its kinds are types that extend `std.schema.thing`, their attributes are
`core.slot` (kinds, enums, ranges, steps, defaults, all checked as usual), and three wires
say the rest. The acts are the same for every world; a new schema needs no rule.

| Type | Keys | Meaning |
| --- | --- | --- |
| `std.schema.world` | `name`, `doc`, `bundle` (rep.) | a world; `bundle=<name>`: `loadBundles` tells that bundle into it once (recorded as `std.schema.bundled name=`) |
| `std.schema.kind` | `of` (a type), `world` (rep.), `acts` (rep.) | a kind of one or more worlds, and the acts that apply to it: `make`, `remove`, `change`, `place`, `connect`, `group`, `pick`, `ask`, `copy`, `send`, `save`, `load`, `undo`, `redo` |
| `std.schema.kinds` | `world`, `from` (a type), `key` (default `name`), `acts`, `stand_in` (a type) | any kind that a wire of `from` names (`k.object name=cup`): such things are `std.schema.thing` and take any attribute; see std.know for `stand_in` |
| `std.schema.limit` | `of`, `max` | at most so many things of a kind (rules: a count and a deny) |
| `std.schema.effect` | `of` (a kind), `act`, `action` (a host action) | that act on that kind is the host's, or the world's own effect of one act on one kind (what `on.make=<action>` was proposed for: this is it, nothing else is needed): for a world whose state is not wires (a drawing board, a diagram engine). The action gets `(ctx, args, { act, kind, thing })` and returns `{ ok?, why?, diff, undo?, ...result }`; its `diff` comes back as `diff.effects`; `undo()` is called when the sentence it is part of is refused |
| `std.schema.needs` | `of` (a world or a view), `type`, `from`? | what must be loaded before acting there: an act on a kind of that world (or in that view) is refused with `reason.needs` while no wire of `type` exists; `turn(..., { load })` asks the host to load each and reads again; `needsOf` lists them |
| `std.schema.capacity` | `of` (a container kind), `key` (its count key), `holds` (a kind), `via` (the key that refers to the container) | a container holds at most its own count: making or moving one more is refused ("table1 has room for 0 more guests"), and so is a count below what it holds |

Every thing has `kind` and `world`. Checked at load: an act not in the list, a kind of a
world that is not declared.

**The acts** are actions (`world.act({ action, args })`, or several as one sentence with
`act([...])`). `thing` is an id, or a kind when there is one thing of it (else `nth`, from
1, or -1 for the last; otherwise the refusal lists `which`).

| Act | Arguments | Does |
| --- | --- | --- |
| `make` | `kind`, `world`?, `id`?, `amount`?, attributes | a new thing (or `amount` of them) with the attributes given and the slot defaults at the tier `default`; a required key left open stays an open question, listed in `result.asks` (`key`, and the slot's `ask`) |
| `remove` | `thing` | takes it away, with its links |
| `change` | `thing` (or a view's state, below), `attr`, `value`, or `by` (`more`/`less`) and `amount`? | sets an attribute; more or less by the slot's `step` (else 1) |
| (sets and values) | `set`: `each`, `all`, `first`, `last` (with `thing` a kind); `value`: `random`, `different`, `same as <thing>` | `change` and `remove` act on the whole set in one undo step; `random` picks from the slot's values, `different` gives each thing another value and none the same, `same as` copies another thing's value |
| `place` | `thing`, then `at` (a thing), `x`, or `rel` and `ref` | sets where it is: into a thing (the key whose slot refers to that thing's type, as a guest `at` a table), at `x`, or `at=<rel>:<ref>` |
| `connect` | `a`, `b`, `rel`? | a `std.acts.link` |
| `group`, `ungroup` | `things`, `name`?; `group` | a `std.acts.group` with its members; takes it apart |
| `pick` | `kind`, attributes, `nth`? | the things that fit (`result.things`); changes nothing |
| `ask` | `thing` (or a view's state, or a knowledge fact by its `name`), `attr`? or `rel` and `of`?; or `kind` with `rel` + `of`, `attr` + `value`, `count`? | its attributes, or one value with `why` and its `shape`: `number` (with `unit`), `value`, `list`, `none`; with `rel`: the values (`list`) or, with `of`, whether one relates to the other either way round (`yes/no`, `answer`); with `kind`: which things (`list`, `things`, `names`, `count`) or how many (`number`) |
| `copy` | `thing` | a new thing with the same attributes |
| `send` | `thing`, `to` | to another world: the kind must be sendable from its world and makeable in `to` (a kind may belong to several worlds: `world=` repeated); one undo step |
| `save`, `load` | `name` | the told things as they are, kept in a `std.acts.saved` wire; load changes them back, makes again what went, takes away what was made since |
| `undo`, `redo` | `n`? | as `world.undo` / `redo`, with `diff`; not inside another change (a sentence, an action) |
| `show` | `thing` (or `*`), `set`?, `view` | the things in a view (below) |
| `teach`, `forget` | `fact` (SOP Lang), `by`?; `fact` (an id) | facts at the tier `taught` (below) |
| `complete` | `thing`? (or a kind with `set`) | applies what std.fill chose since the things were made (defaults learnt later), as defaults with tier and source in `result.filled`; never done silently |

**Aspects and views.** `std.schema.aspect name= keys= doc=` names a set of keys a kind
takes as a whole (a place on Earth, a size); a kind says which it has
(`std.schema.kind ... aspects=`, also on `std.schema.kinds`); `std.schema.view name=
shows=` is a view over the shared things that shows some aspects. All views read the
same wires, so an act in one is seen in the others, with one history. The act `show`
(`thing` or a kind with `set`; `thing=*` for every thing; `view`) gives each thing's
values of the view's keys and records `std.acts.shown view= thing=`; a thing that lacks an
aspect is refused with the aspect's `doc` ("a table has no place on Earth") and the
aspects it has (with `thing=*`, such things are left out and listed in `skipped`).
**Acts on the view itself:** `std.schema.view ... state=<type>` names a kind (declared
with `std.schema.kind` and its acts) whose one thing, `view_<name>`, holds the view's own
attributes (zoom, centre, the layer shown). It is made on first use, with its slot
defaults at the tier `default`. `change` and `ask` take the view's name as the `thing`,
or no thing at all when only the state of one view has the attribute ("zoom in": `change
attr=zoom by=more`). Without a thing and with no such view, the act is refused ("change
what? (colour)"). **Taught facts:** `teach` (`fact`: knowledge wires as SOP Lang, `by`)
tells them at the tier `taught` (declared by std.know, right below `told`) with
`core.source="taught by <who>"` and a `std.know.taught fact= by= at=` wire; std.know offers
them at the std.fill tier `taught` (rank 3.5: below what was just said and the scene,
above knowledge), and follows `is_a` to the other kind's place and size. `forget` (`fact`)
takes one back. Defaults are applied when a thing is made; things made before get the ones learnt later with the act `complete`, on request.
`examples/views.mjs` has three views over the same things.

**Composition.** A thing inside another is one with a key that refers to it (an eye
with `of=$face2`: declare the slot with `type=` the container's kind, and give it to
`make` as an argument, `of: '$face2'`; a rule reads the container through the reference
by naming its pattern, `@r ingredient of=$rs` with `@rs recipe serves=?n`); `in` (a thing, or a kind with `in_nth`) limits an act to the things
inside: "make the eyes of the second face green" is `change thing=eye set=each attr=colour
value=green in=a_face in_nth=2`.

**Reserved names.** On every thing the acts write `kind` and `world` (and `drawn_as` for
a stand-in); everything else the library keeps is in types under `std.` (`std.acts.link`,
`.group`, `.saved`, `.shown`, `std.know.taught`, `std.fill.*`, `std.focus.*`,
`std.schema.count`), with ids the library makes: `<kind>N` for things, `link N`, `group N`,
`saved.<name>`, `shown.<view>.<id>`, `taught.<id>`. A host keeps its own keys off these.

**What an act gives.** `result` (`act`, `thing`, ...) and, like every action that is
done, `diff`: `{ added, removed, changed }`, what it told and what rules derived from it,
with `from`, `to` and tiers. An act is one undo step; `why(id, key)` names the act
(`how: action`). **A refusal** says why and, in `reason`, what the kind allows
(`allowed`, `attrs`), which worlds allow the act (`elsewhere`), and for an attribute the
kind lacks, which kinds have it (`hasIt`: "a seat has no size; the face's eye does").
`examples/acts.mjs` drives a seating plan and a face; `node bench/acts.mjs` measures an
act on 10, 200 and 2,000 things.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @face std.schema.world name=face
  @t core.type of=eye extends=std.schema.thing closed=true
  @s core.slot of=eye key=colour enum=brown enum=blue default=brown
  @k std.schema.kind of=eye world=face acts=make acts=change`);
w.act({ action: 'make', args: { kind: 'eye' } });
const r = w.act({ action: 'change', args: { thing: 'eye', attr: 'colour', value: 'blue' } });
print(r.diff.changed, w.act({ action: 'remove', args: { thing: 'eye' } }).violations[0].reason.allowed);
```

```output
[{"id":"eye1","key":"colour","from":"brown","to":"blue","toTier":"told"}] ["make","change"]
```

## std.know: knowledge as a filler

`core.use world=std.know` (it loads std.fill). A thing of a schema (`std.schema.thing`)
that has no `place`, `size` or `colour` needs one, and the facts of a knowledge catalog
offer them at the tier `knowledge`, with the fact's `core.source` as the source: the usual
place and size (`k.commonsense.thing name= at= size=`), the colour of the body
(`k.objects.part of= name=body colour=`; a body of several colours is a tie, so advice and
no choice). Other modules may offer at better tiers (the user, the focus). The act `make`
applies what std.fill chose as defaults (tier `default`: an assumption, weaker than what
is told) and lists them in `result.filled` (`key`, `value`, `tier`, `source`); a closed
kind takes only its own attributes. `std.schema.kinds stand_in=<type>`: a kind the catalog
does not name but a stand-in wire does (`name=unicorn drawing=horse`) is made with
`drawn_as`. `examples/know.mjs` uses wires copied from sop-knowledge-worlds (CC0).

**Any catalog, any key.** `std.know.fill from=<type> match=<key> key=<key> ...` (`match`
defaults to `name`): when `make` leaves one of those keys out, the `from` wire whose
`match` names the kind gives it, at tier `knowledge` with its `core.source` (or its id).
A choice std.fill made at a better tier wins. One line replaces the rules a world would
otherwise write per key (`examples/second-app/rooms.mjs`: `w`, `d` and `price` of a piece
from `k.furniture`).

## std.turn: the request pipeline as data

`core.use world=std.turn`; run by `turnFlow`. A stage: `std.turn.stage name= after=
before= per=candidate on_empty= skip_if= only= when=exhausted`; a provider:
`std.turn.provider stage= name= tier=`. The order is the `after` chain from the stage that
follows nothing (equal places by name); a stage with `before=` goes right before that one.
Stages with `per=candidate` run for each candidate reading in turn; when one yields
nothing, `on_empty` says what follows: `next` (the next candidate), `ask` (return the
question it set), `fail`. `skip_if=<key>`: skipped when a request of the candidate has that
argument (the message named the world, say); `only=<action>`: run only for those actions.
`when=exhausted`: run when no candidate was taken (the graded fallback). Providers of one
stage are tried by tier: the first that yields wins; a reader's candidates add up.
**The default:** read (given) → dryrun → apply → reply per candidate; fallback when
exhausted. **Advice:** a stage nobody provides, or placed after or before an undeclared
stage, is a soft issue (`world.check().issues`). **Fixed:** apply is one sentence (one
undo step, all or nothing), budgets per call, the same input and state give the same path,
a trace of every stage taken.

## Functions

A function is called with its arguments as text and returns text (or true/false for a
comparison). When it has no result it returns nothing and the rule does not fire.
Host functions are added with `new World({ fns })`; a name from the tables below
cannot be taken without `override`.

A **number** is an integer or decimal, optionally followed by a unit (`5`, `2.5`,
`3kg`, `10N/kg`). Arithmetic keeps 12 significant digits.

### Arithmetic

| Function | Arguments | Result | No result when |
| --- | --- | --- | --- |
| `add` | numbers, same unit | their sum, in that unit | units differ |
| `sub` | numbers, same unit | the first minus the others | units differ |
| `mul` | numbers | the product; units are joined (`2kg` × `3m` = `6kg*m`) | |
| `div` | numbers | the first divided by the others; equal units cancel (`6m / 2m = 3`), others are joined with `/` | division by zero |
| `min`, `max` | numbers, same unit | the smallest, the largest | units differ |
| `abs` | number | its absolute value | |
| `sign` | number | `-1`, `0` or `1` | |
| `clamp` | x, lo, hi | x, or the nearer bound when outside them; x's unit | units differ |
| `round` | number, [decimals] | rounded; the unit is kept | |
| `mod` | a, b | the remainder of a / b, with the sign of b and the unit of a | b is 0 |
| `idiv` | a, b | the whole part of a / b | b is 0 |
| `linsolve` | k, c, c1, x1, c2, x2, ... | the x with c·x + c1·x1 + ... = k, exactly | c is 0; units differ |
| `concat` | values | the texts joined | |

### Comparison

| Function | Arguments | True when |
| --- | --- | --- |
| `eq`, `neq` | a, b | the two are (not) the same: as numbers when both are numbers with the same unit (`5` = `5.0`), as times when both are clock times or dates (`9:05` = `09:05`), else as text |
| `lt`, `lte`, `gt`, `gte` | a, b | a is less than (at most, more than, at least) b; numbers need the same unit or a bare number on one side; clock times and dates compare as such |
| `before`, `after` | `$a`, `$b` | wire a comes before (after) wire b in the sequence |
| `between` | x, a, b | x lies strictly between a and b, whichever is larger; numbers, clock times or dates |

A comparison of things that cannot be compared (a number with a name, different units)
is false.

### Text

A string argument is read as its text, an atom as it is. A text result is a number when
it is one (so that it compares as one), else a string.

| Function | Arguments | Result | No result when |
| --- | --- | --- | --- |
| `matches` | text, pattern, [n] | in a check: whether the pattern matches somewhere in the text; in a calc: the match, or its `n`-th group | no match; a pattern that is refused (below); a text longer than 100,000 characters |
| `contains` | text, part | whether the text contains the part | |
| `starts_with`, `ends_with` | text, part | whether the text starts (ends) with the part | |
| `lower` | text | the text in lower case | |

A pattern is a JavaScript regular expression (with the `u` flag) of at most 200
characters, without back-references, and without a repeated group that can itself
repeat or match nothing (`(a+)+`, `(a*)*`, `(a?)+`, `(|a)+`): those are the shapes whose
matching can take exponential time. The rule is conservative: `(?:x+y)*`, which is safe,
is refused too; write `(?:x+y)(?:x+y)*` or rephrase. A pattern written in the matrix is
checked when the matrix is read (`schema`); one that comes from a wire is checked when
it is used, and a query that needed it answers `unsupported` with the reason. The names
are written like the other built-ins (`time_add`), hence `starts_with`.

```js run
const w = new World();
w.load(`
  @h heading text=?t
  @m core.calc out=?n fn=matches args=?t args="^Chapter ([0-9]+)$" args=1
  @c heading core.on=$h chapter=?n
  @r core.rule when=$h with=$m then=$c
`);
w.tell('@h1 heading text="Chapter 3"  @h2 heading text="Notes"');
print(w.get('h1').attrs.chapter, w.get('h2').attrs.chapter);
print(builtins.lower(['"ÉTÉ"']), builtins.ends_with(['"notes.md"', '".md"']));
```

```output
["3"] undefined
"été" true
```

### Time

| Function | Arguments | Result |
| --- | --- | --- |
| `time_add` | clock time, duration | the later time (`10:40` + `35min` = `11:15`); a bare number is minutes |
| | date, duration | the later date (`2026-01-30` + `3d` = `2026-02-02`); a bare number is days |
| `time_diff` | later, earlier | minutes between two clock times (`35min`); days between two dates (`3d`) |
| `weekday` | date | `monday` ... `sunday` |

Durations: `s`, `min`, `h`, `d`.

### Aggregates

Used with `over=` on a `core.calc`. The calc ranges over every match of the `over`
patterns under the bindings of the rule so far; `args` gives the value taken from each
match.

| Function | Result | Over no match |
| --- | --- | --- |
| `count` | the number of matches | `0` |
| `sum` | the sum of the values | `0` |
| `min`, `max` | the smallest, the largest value | no result |
| `argmin`, `argmax` | the `pick` of the match with the smallest (largest) value; of several equal ones the first in the sequence, and a query for it answers `ambiguous`; with `ties=first` the first silently; with `ties=all` every one of them, as several values | no result |
| `collect` | all the values, as several values of the key | no result |

An aggregate is kept up to date: when a wire it ranges over arrives, changes or goes,
the groups it belongs to are computed again. A rule may not aggregate over what its own
conclusions produce.

```js run
const w = new World();
w.load(`
  @o order customer=?c
  @l line of=$o item=?item amount=?a
  @n core.calc out=?n fn=count over=$l
  @t core.calc out=?total fn=sum over=$l args=?a
  @b core.calc out=?best fn=argmax over=$l args=?a pick=?item
  @s order core.on=$o lines=?n total=?total largest=?best
  @r core.rule when=$o with=$n with=$t with=$b then=$s
`);
w.tell('@o1 order customer=ann  @l1 line of=$o1 item=pen amount=3  @l2 line of=$o1 item=book amount=12');
const o = w.get('o1').attrs;
print(o.lines, o.total, o.largest);
print(builtins.time_add(['10:40', '35min']), builtins.div(['6m', '2m']), builtins.eq(['5', '5.0']), builtins.weekday(['2026-11-10']));
```

```output
["2"] ["15"] ["book"]
11:15 3 true tuesday
```
