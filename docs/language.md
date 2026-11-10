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
string       = '"' { character | '\"' | '\\' } '"' ;
reference    = "$" id ;
variable     = "?" name ;
atom         = one or more characters that are not white space, not starting with
               '"', "$" or "?" ;
id           = name ;
type         = name ;
key          = name ;
name         = ( letter | "_" ) { letter | digit | "_" | "." | "-" } ;
comment      = "#" { any character except a line end } ;
white space  = space | tab | carriage return | line end ;
```

Tokens are separated by white space. A token is a run of characters without white
space, except that a string may contain white space, including line ends, between its
quotes. The first `=` of an entry token separates key and value; the value is the rest,
and may itself contain `=`.

1. A **declaration** starts with `@id`, continues with a type, and goes on until the
   next `@id` token or the end of the text. It may span any number of lines.
   Indentation has no meaning.
2. An **entry** is `key=value`. The same key may be given several times: the key then
   has several values, in the order written.
3. A **comment** starts with `#` where a token could start, and runs to the end of the
   line. A `#` inside a string, or inside a token (`colour=#fff`), is text.
4. There is nothing else: no nesting, no lists, no operators, no escapes outside
   strings.

```js run
const [w] = parse(`
  # a wire may span lines; a key may repeat
  @b1 body mass=2kg
      label="a \\"big\\" one"     # a comment
      tag=red tag=round
`);
print(w.id, w.type);
print(w.attrs);
print(str(w.attrs.label[0]));
```

```output
b1 body
{"mass":["2kg"],"label":["\"a \\\"big\\\" one\""],"tag":["red","round"]}
a "big" one
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

| Kind | Written | In memory | Notes |
| --- | --- | --- | --- |
| atom | `water`, `10`, `9.81`, `10:00`, `5kg`, `phys.mech.body` | the token | numbers, quantities, times and names are all atoms; what an atom *means* is decided by the slot's kind ([reference](reference.md#coreslot)) |
| string | `"free text"` | the token with its quotes | `\"` and `\\` are the only escapes; `str(v)` unquotes, `quote(text)` quotes |
| reference | `$id` | the token | to a fact, or inside a rule to a pattern or template |
| variable | `?name` | the token | bound by matching; only in matrix wires and queries |

A value is never interpreted when it is read. `5` and `5.0` are different tokens; they
are the same *value* only under a key whose slot is declared `integer` or `number`.

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
   do not clash.
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

## 8. Canonical form

`format(wire)` writes a wire on one line: `@id type` and then each entry as
`key=value`, keys in the order they were first given, the values of a repeated key in
order, single spaces between tokens. `format(wire, { multiline: true })` puts each entry
on its own line, indented by four spaces. `parse(format(w))` gives `w` again.

```js run
const [w] = parse('@a   t  k=v\n   s="x y"   k=w');
print(format(w));
print(format(w, { multiline: true }));
```

```output
@a t k=v k=w s="x y"
@a t
    k=v
    k=w
    s="x y"
```

## 9. Errors

A text that does not follow the grammar throws `SopError`. The error has `line` and
`column` (counted from 1) and `offset` (counted from 0) of the token where reading
stopped, and its message starts with the line and column.

| Message | Cause |
| --- | --- |
| `unterminated string` | a `"` without its closing `"` |
| `wire @x has no type` | `@x` at the end of the text, or followed by something that is not a name |
| `expected key=value, got "..."` | a token that is not an entry: no `=`, nothing before or after it, or a key that is not a name; also an entry before any declaration |

```js run
for (const text of ['@a t k=v\n  @b', '@a t\n   oops', '@a t s="open']) {
  try { parse(text); } catch (e) { print(e.message, [e.line, e.column, e.offset]); }
}
```

```output
line 2, column 3: wire @b has no type [2,3,11]
line 2, column 4: expected key=value, got "oops" [2,4,8]
line 1, column 6: unterminated string [1,6,5]
```

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
