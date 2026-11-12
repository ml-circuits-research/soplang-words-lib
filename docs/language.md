# The language

SOP Lang as sopworld reads and writes it. This file is normative: where another document
disagrees with it, this one holds. It is written so that it can be adopted as it stands
as the definition of the language (for PSys2: SOP Lang v1.1).

One language serves for facts, for the consistency matrix and for queries. What
differs is what a wire is *used* for, never how it is written.

## 1. Grammar

```
text         = { declaration | comment } ;
declaration  = "@" id  type  { entry } ;
entry        = key "=" value ;
value        = string | reference | variable | atom ;
string       = '"' { character | escape } '"' ;
escape       = '\"' | '\\' | '\/' | '\b' | '\f' | '\n' | '\r' | '\t'
             | '\u' hex hex hex hex ;
reference    = "$" id | "$?" id ;
variable     = "?" id ;
atom         = one or more characters, none of them white space, '"' or '\',
               the first not "$", "?", "@" or "#" ;
id, type, key = identifier ;
identifier   = first { "." segment } ;
first        = ( letter | "_" ) { letter | digit | "_" | "-" } ;
segment      = ( letter | digit | "_" ) { letter | digit | "_" | "-" } ;
letter       = "A".."Z" | "a".."z" ;
comment      = "#" { any character except a line end } ;
white space  = space | tab | carriage return | line end ;
```

Tokens are separated by white space. A token is a run of characters without white
space, except that a string may contain white space between its quotes. A token that
starts with `@` starts a declaration; a token that starts with `#` starts a comment;
any other token must be an entry. The first `=` of an entry separates key and value.

1. A **declaration** starts with `@id`, continues with a type, and goes on until the
   next token that starts with `@`, or the end of the text. It may span any number of
   lines. Indentation has no meaning. An `@` anywhere else (inside a string, or inside
   an atom: `mail=ann@example.org`) is text.
2. An **identifier** is one or more segments joined by single dots: `b1`,
   `kids.arith.holding`, `pat.kids.shop.price.q.2`. Letters are the ASCII letters. The
   first segment starts with a letter or `_`; a later one may also start with a digit.
   `a..b`, `a.` and `1a` are not identifiers.
3. An **entry** is `key=value`, with nothing around the `=`. The same key may be given
   several times: the key then has several values, in the order written.
4. A **string** uses the escapes of JSON, and no others. A line end, a tab or any other
   character may also stand in a string as it is. A string is a whole value: it starts
   right after the `=` and the token ends at its closing quote.
5. An **atom** is any other value. It may contain any character except white space,
   `"` and `\`, and it may not start with `$`, `?`, `@` or `#`; so `10N/kg`, `10:40`,
   `-4`, `a=b`, `#fff` after a `=` (`colour=#fff`) and `2*?x` are atoms.
6. A **comment** starts with `#` where a token could start, and runs to the end of the
   line. A `#` inside a string or inside a token is text.
7. There is nothing else: no nesting, no lists, no operators, no escapes outside
   strings.

```js run
const [w] = parse(`
  # a wire may span lines; a key may repeat
  @b1 body mass=2kg
      label="a \\"big\\" one\\u0021"     # a comment
      tag=red tag=round mail=ann@example.org
`);
print(w.id, w.type);
print(w.attrs);
print(str(w.attrs.label[0]));
```

```output
b1 body
{"mass":["2kg"],"label":["\"a \\\"big\\\" one!\""],"tag":["red","round"],"mail":["ann@example.org"]}
a "big" one!
```

## 2. The three signs

| Sign | Meaning | Where it may stand |
| --- | --- | --- |
| `@` | declares a wire | first character of a declaration; nowhere else |
| `$` | refers to a wire, by id | first character of a value |
| `?` | is a variable | first character of a value, in the matrix and in queries |

Each sign has one meaning. In particular `?` never starts a declaration: `@p purchase
qty=?q` declares a wire named `p` whose `qty` is the variable `?q`.

Two forms combine them in value position, inside rules only:

| Form | Meaning |
| --- | --- |
| `$p` where `p` is a pattern or template of the same rule | the wire that `@p` matched, or made |
| `$?x` | a reference to the wire whose id the variable `?x` holds |

## 3. Values

| Kind | Written | In memory | As data | Notes |
| --- | --- | --- | --- | --- |
| atom | `water`, `10`, `9.81`, `10:00`, `5kg`, `phys.mech.body` | the token | `{ kind: 'atom', v: '5kg' }` | numbers, quantities, times and names are all atoms; what an atom *means* is decided by the slot's kind ([reference](reference.md#coreslot)) |
| string | `"free text"` | the token with its quotes, in the canonical spelling | `{ kind: 'string', v: 'free text' }` | `str(token)` gives the text, `quote(text)` the token |
| reference | `$id` | the token | `{ kind: 'ref', v: 'id' }` | to a fact, or inside a rule to a pattern or template |
| variable | `?name` | the token | `{ kind: 'var', v: 'name' }` | bound by matching; only in matrix wires and queries |

A value is never interpreted when it is read. `5` and `5.0` are different tokens; they
are the same *value* only under a key whose slot is declared `integer` or `number`.

**The canonical spelling of a string** is what `JSON.stringify` writes for its text:
`\"` and `\\`; `\b`, `\f`, `\n`, `\r`, `\t` and `\u00XX` for the other characters below
U+0020; every other character as it is. `parse` stores every string in this spelling,
whatever escapes the text used, so that one text is one value: `"café"` and
`"café"` are the same value, and a line end written inside a string is stored as `\n`.

**The wire in memory** is `{ id, type, attrs }`, where `attrs` maps each key to the
array of its value tokens in the order written: `{ id: 'b1', type: 'body', attrs: {
mass: ['2kg'], tag: ['red', 'round'] } }`. A host that parses with its own parser hands
over wires of this shape. `readValue(token)` gives a value as data and
`writeValue({ kind, v })` gives the token, so a parser that keeps values as
`{ kind, v }` converts with one call per value. Wires that do not come from `parse` are
not checked against the grammar; the host's parser is trusted to have done that.

```js run
const [w] = parse('@b1 body mass=2kg label="caf\\u00e9\\n" on=$t1 like=?x');
print(w);
print(Object.values(w.attrs).map(([token]) => readValue(token)));
print(writeValue({ kind: 'string', v: 'say "hi"' }), writeValue({ kind: 'ref', v: 'b1' }));
```

```output
{"id":"b1","type":"body","attrs":{"mass":["2kg"],"label":["\"café\\n\""],"on":["$t1"],"like":["?x"]},"pattern":false}
[{"kind":"atom","v":"2kg"},{"kind":"string","v":"café\n"},{"kind":"ref","v":"t1"},{"kind":"var","v":"x"}]
"say \"hi\"" $b1
```

## 4. What a wire is

A wire is either a **fact** or part of the **matrix**. The matrix is the set of wires
that say what facts may exist and what follows from them.

1. A wire is part of the matrix when
   - its type is a matrix type (`core.slot`, `core.type`, `core.rule`, `core.deny`,
     `core.calc`, `core.check`, `core.relation`, `core.abducible`, `core.sequence`,
     `core.fluent`, `core.effect`, `core.producer`, `core.action`, `core.tier`,
     `core.precision`, `core.namespace`, `core.use`, `core.schema.map`), or
   - a `core.schema.map` wire declares its type to be schema, or
   - a rule, deny, calc, relation or action **in the same text** names it, through
     `when=`, `not=`, `then=`, `with=`, `if=`, `over=`, `set=`, `add=` or `remove=`.
2. A wire named through `when=`, `not=`, `over=` or `remove=` is a **pattern**: a
   description of wires to find. A wire named through `then=`, `set=` or `add=` is a
   **template**: a description of a wire to make or to complete. It is one or the other
   because of where it is named. A pattern needs no variable.
3. Every other wire is a **fact**.
4. A fact may not contain a variable. A wire with a variable that nothing names is
   refused (`variable`).
5. A rule and the wires it names are told together, in one text. A wire that has the id
   of a pattern and is told later on its own is a fact.
6. Words (`core.word text=… means=… of=…`, see the [reference](reference.md#coreword))
   are facts. SOP Lang knows no natural languages: the words of a world are in the one
   language its matrix is written in, and translation is done by the host, outside the
   world.

```js run
const w = new World();
w.load(`
  @p purchase item=?i qty=?q            # a pattern: the rule names it in when=
  @n note about=$p text=?i              # a template: the rule names it in then=
  @r core.rule when=$p then=$n
`);
w.tell('@p1 purchase item=pen qty=3');  // a fact
print([...w.matrix.keys()]);
print(w.ofType('note').map((x) => format(x).replace(/@\S+/, '@...')));
print(w.tell('@x purchase qty=?q').violations[0].kind);
```

```output
["p","n","r"]
["@... note about=$p1 text=pen"]
variable
```

## 5. Ids

1. Facts and matrix wires have **separate id spaces**. A fact `@p` and a pattern `@p`
   do not clash. Within one text an id is declared once (section 9), so the two are
   told in different texts.
2. Within each space an id is declared once. Telling a fact whose id exists is refused
   (`duplicate-id`), unless the new declaration says nothing that the wire does not
   already say, in which case it is accepted and changes nothing.
3. A reference `$id` in a fact must name an existing fact (`dangling-ref`), except
   under a key of an open namespace that no slot declares (section 6).
4. A wire may get a second id: when a fact is told that has the same identity keys as
   an existing one, it is merged into it and its id becomes an alias
   (`world.resolve(id)`).
5. A matrix loaded as a module with a prefix has its ids, and the references among
   them, prefixed with the module name and a dot ([reference](reference.md#coreuse)).

## 6. Keys

1. A key is a name. Dots have no meaning to the parser.
2. **Short and qualified keys.** A key may be written with the type it belongs to in
   front: on a wire of type `shop.order`, `shop.order.total` and `total` are the same
   key, and so is `<ancestor type>.total`. In memory the short form is kept.
3. **Open namespaces.** Keys that start with `core.` are bookkeeping (source, sequence
   number, provenance). They are accepted on every wire, also of a closed type. Unless
   a slot declares such a key, its values are not validated, a reference under it need
   not resolve, and it takes every value it is given. `@n core.namespace prefix=audit.
   open=true` declares another such prefix.
4. **Modifiers.** Three keys of the `core.` namespace are read on patterns and
   templates and are not part of the wire described: `core.select`, `core.absent`
   (patterns) and `core.on` (templates). See the [reference](reference.md#patterns-and-templates).

## 7. Queries

A query is one or more patterns. In a query, and only there, a declaration may leave
out its `@id`.

```js run
const w = new World();
w.tell('@b1 box colour=red size=3  @b2 box colour=blue size=3  @l1 lid of=$b1');
print(w.ask('@x box colour=?c'));
print(w.ask('box colour=?c size=3'));
print(w.ask('@b box colour=?c\n@l lid of=$b'));
print(w.holds('box colour=green'));
```

```output
[{"x":"b1","c":"red"},{"x":"b2","c":"blue"}]
[{"c":"red"},{"c":"blue"}]
[{"b":"b1","l":"l1","c":"red"}]
false
```

Each match gives one object: the value of every variable under its name, and the id of
the matched wire under the id of its pattern, when the pattern has one.

## 8. Writing wires, and the canonical form

`format(wire)` writes a wire on one line: `@id type` and then each entry as
`key=value`, keys in the order they were first given, the values of a repeated key in
order, single spaces between tokens. `format(wire, { multiline: true })` puts each entry
on its own line, indented by four spaces. `parse(format(w))` gives `w` again.

The **canonical form** is for hashing and for stable diffs: the same wires give the
same bytes. `format(wire, { canonical: true })` writes `@id type`, then one entry per
line, indented by four spaces, sorted by key (by UTF-16 code unit, as JavaScript
compares strings); the values of a repeated key keep their order; strings are in the
canonical spelling; atoms, references and variables are written as they are.
`serialize(wires, { canonical: true })` writes the wires in the order given, each
followed by one line end (`\n`); so the text ends with a line end and has no blank
lines.

```js run
const ws = parse('@a   t  k=v\n   s="x\ty"   k=w  b=1\n@b t');
print(format(ws[0]));
print(serialize(ws, { canonical: true }));
print(parse(serialize(ws, { canonical: true })).map((w) => format(w)));
```

```output
@a t k=v k=w s="x\ty" b=1
@a t
    b=1
    k=v
    k=w
    s="x\ty"
@b t

["@a t b=1 k=v k=w s=\"x\\ty\"","@b t"]
```

## 9. Errors

A text that does not follow the grammar throws `SopError`. Nothing is repaired
silently. The whole text is read, so that one error reports every mistake in it:
`errors` is the list, in the order of the text, each `{ message, offset, line,
column }` with `line` and `column` counted from 1 and `offset` from 0, at the start of
the token concerned. The error's own `message`, `line`, `column` and `offset` are those
of the first.

| Message | Cause |
| --- | --- |
| `text before the first declaration: "..."` | anything but white space and comments before the first `@` |
| `a declaration without an id` | `@` alone |
| `wire @x has no type` | `@x` at the end of the text, or followed by an entry or another declaration |
| `invalid identifier "..." as the id of a wire` / `as the type of wire @x` / `as a key` | an id, type or key that is not an identifier |
| `invalid identifier in the reference $...` / `in the variable ?...` | a `$` or `?` that is not followed by an identifier |
| `expected key=value, got "..."` | a token after the type that has no `=`, or nothing before it |
| `the key "k" has an empty value` | `k=` |
| `unterminated string` | a `"` without its closing `"` |
| `a bad escape in the string of "k" (the escapes are those of JSON)` | a backslash followed by anything else, or `\u` without four hex digits |
| `text after the closing quote of a string` | `k="a"b` |
| `a quote inside an atom (a string value starts right after "=")` | `k=a"b"` |
| `a backslash outside a string` | `k=a\b` |
| `the id "x" is declared twice in this text` | two declarations with one id in one text |

```js run
try {
  parse('@a t k=v\n@b t "s"\n@c t k=\n@c t s="bad \\q"');
} catch (e) {
  print(e.message);
  print(e.errors.map((x) => [x.line, x.column, x.offset, x.message]));
}
```

```output
line 2, column 6: expected key=value, got ""s""
[[2,6,14,"expected key=value, got \"\"s\"\""],[3,6,23,"the key \"k\" has an empty value"],[4,1,26,"the id \"c\" is declared twice in this text"],[4,6,31,"a bad escape in the string of \"s\" (the escapes are those of JSON)"]]
```

`parse(text, { lenient: true })` accepts what versions before 0.6.1 accepted: the same
id twice in one text, an escape that JSON does not have (it stands for the character
after the backslash), a quote or a backslash inside an atom. It is for reading old
files; `world.tell(text)` is always strict.

Everything else that can be wrong with a text (an unknown reference, a value of the
wrong kind, a rule that names nothing) is not a syntax error: the text is read, and the
world refuses the change with a violation ([semantics](semantics.md#violations)).

## 10. The old way to declare a pattern

Before version 0.6 a pattern was declared `?id type ...`. That gave `?` two meanings.
The old form is still read; such a wire is noted once in `world.warnings`
(`{ kind: 'deprecated', id, why }`) and is written back as `@id`. It will be removed in
the next minor version. `node tools/migrate-syntax.mjs <files>` rewrites files,
including wires inside the strings of a program.

```js run
const w = new World();
w.load('?p item qty=?q\n@f flag for=$p\n@r core.rule when=$p then=$f');
print(w.warnings.map((x) => [x.kind, x.id]));
print(format(w.matrix.get('p')));
```

```output
[["deprecated","p"]]
@p item qty=?q
```

## 11. From SOP Lang v1 to v1.1

This file is v1.1. Every v1 text is a v1.1 text with the same meaning: a v1 file needs
no change.

| | v1 | v1.1 | Why |
| --- | --- | --- | --- |
| Variables | none | `?name` as a value | the matrix and queries are written in the language |
| Comments | none | `#` to the end of the line, where a token could start | matrices are written by people |
| Identifiers | every segment starts with a letter or `_` | a segment after the first may start with a digit | ids such as `pat.kids.shop.price.q.2` exist in v1 data |
| Atoms | no `"`, `@`, `$`, `=`, `\` | no `"`, `\`; not starting with `$`, `?`, `@`, `#` | `a=b`, `ann@example.org` and `10$` are plain text once the first `=` and the first character have decided what the token is |
| Strings | JSON escapes; a bad escape is an error | the same; a line end may also be written as it is | long texts stay readable; the stored spelling is canonical either way |
| Errors | all reported, with offset, line and column | the same list, plus the three about quotes and backslashes | |
| Namespaces | none | an id or a reference may name one: `shop::b1`, `$shop::b1`, `$::b1` | facts from different requests or worlds must never be joined by mistake ([section 12](#12-scope)) |
| Canonical serialization | entries sorted by key, repeats in order, JSON escapes, `\n` | the same | |

What v1.1 excludes that v1 allows: an atom that starts with `?` (it is a variable now)
or with `#` right after white space (it is a comment; after `=` it is text). Neither
occurs in the v1 corpus of PSys2 (`compat/psys2`), which the tests read with this
parser.

The parser never resolves keys or references and never looks at types: short and
qualified keys (section 6), kinds, cardinality and identity are the matrix's business.

## 12. Scope

What a name means depends on where it is written. Each statement below is checked by
the test it names.

**SC1. A rule, a deny, an action.** Its variables are its own: `?x` in one rule and `?x`
in another are two variables. Inside it, `$p` names the wire its pattern `@p` matched
(or its template `@p` made). *Test:* `scope: a variable is local to its rule or question; the same name elsewhere is another variable`

**SC2. A question.** `ask` and `query` have their own variables too; a pattern without
an id (`item n=?x`) gets one only the question sees. *Test:* `scope: a variable is local to its rule or question; the same name elsewhere is another variable`

**SC3. A statement (one `tell`, one patch).** An id is declared once in it; a statement
that adds nothing to a wire is accepted. Its wires are judged together: none of it
stays if any of it is refused. *Tests:* `parser: every syntax error is named, with its place, all in one error; nothing is repaired`;
`refusal: deny constraint, and the world is left untouched`

**SC4. Facts and the matrix.** They have separate id spaces: a fact `@p` and a pattern
`@p` do not clash. *Test:* `matrix and facts have separate id spaces`

**SC5. A namespace.** A fact told with `{ ns: 'shop' }` (or by a world made with
`new World({ ns })`) has the id `shop::<id>`. A reference without a namespace means one
in the same namespace; another is reached only when written out: `$other::x`, or
`$::x` for the default namespace (facts told without one). One match of a rule, a deny
or a question is in one namespace: wires joined by a value are of the same namespace; a
wire reached by a written reference may be in another. Two facts merge by identity only
inside one namespace. A type declared `shared=true`, and facts a host provides, belong
to every namespace. Questions with `{ ns }` see only that namespace; `sync` with
`{ ns }` works inside it. Matrix wires are in no namespace. The separator `::` has no
other meaning in the language. *Test:* `scope: facts in different namespaces are never joined by value nor merged by identity; written references and shared types cross`

**SC6. A world.** Two worlds share nothing but what was given to both (a library, a
host's providers). A fork starts with what its world had and then is its own.
*Tests:* `scope: a world given a namespace puts every statement in it; one world never sees another`;
`fork: structural, independent in both directions, and cheap`

**SC7. A module.** A module of the library gets its name as a prefix of its ids, may
declare types and slots only under that prefix, and with `exports=` lets other modules
read only the types listed ([core.module](reference.md#coremodule)). A short key that
two modules declare along one type's lineage is reported as `ambiguous-key`.
*Tests:* `composition: two different declarations of one key are a conflict unless one says how they combine`;
`modules: ownership of names, exports, and a warning for keys two modules declare`
