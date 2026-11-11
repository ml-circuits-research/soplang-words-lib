# Formalization: reading language into wires (design study, Round 8)

Status: `world.score` is built (0.8.1); `core.word` (Q17, answered (b)) and
`world.interpret` are built (Round 9, R9.1); roles stay out (Q18, answered (a)). The rest
is design.

The library already knows most of what a reader needs to choose between readings of a
sentence: the types and their slots, kinds, enums and ranges, which keys identify an
entity, which arguments an action requires and how to ask for them, and the current
state. What it lacks is (a) a description of its tools and their words that a reader can
use, and (b) a primitive that judges a candidate reading against the world. This study
proposes (a) as plain wires that reuse existing vocabulary and builds (b).

The running example is a small shop and a calendar:

```sop
@k1 core.slot of=item key=name id=true
@k2 core.slot of=order key=item kind=ref to=item required=true
@k3 core.slot of=order key=qty kind=integer min=1 default=1
@k4 core.slot of=meeting key=day enum=mon enum=tue enum=wed required=true
@k5 core.slot of=meeting key=with type=person required=true
@m meeting with=$busy day=?d
@busy person name=?n off=?d
@x core.deny when=$m when=$busy why="?n is off on ?d"
@a core.action name=reserve param=item when=$it if=$left set=$r
@it item name=?item stock=?s
@left core.check fn=gt args=?s args=0 why="?item is out of stock"
@r item core.on=$it reserved=yes
```

## 1. Tool descriptions

A "tool" is anything an utterance can ask the world to do or to tell: an action
(`core.action`), a statement of a type (telling a wire of that type), or a question
(`query` on a type and key). What a reader needs for each, and where it already lives:

| Need | Already in the matrix | Missing |
| --- | --- | --- |
| the arguments of a tool | `core.action param=`, `required=`; slots of a type | nothing |
| how to ask for a missing argument | `ask.` on actions and slots | nothing |
| what values an argument takes | `kind=`, `enum=`, `min=`/`max=`, `to=` (ref), `type=` | nothing |
| which arguments identify an entity | `id=true`, `unique=` on slots | nothing |
| the role an argument plays | — | a role per argument (optional) |
| the words for tools, roles and values, per language | — | words |
| examples of utterances | — | examples (for tests and for a host's learner) |

So two things are missing, and both are data the host registers, not built in:

**Words.** A word wire maps a surface form in one language to a name the matrix
already has: a type, a key, an action, or an enum value. Proposed shape (Q17):

```sop
@w1 core.word lang=en text=book    means=reserve
@w2 core.word lang=en text=order   means=order
@w3 core.word lang=ro text=comandă means=order
@w4 core.word lang=en text=monday  means=mon of=meeting.day
@w5 core.word lang=en text=with    means=meeting.with
```

`means=` names an action, a type, a qualified key (`type.key`) or a value; `of=` places a
value in its slot when the same text could be a value of several. A word means one thing
per language and `of=`; a word with two meanings is two wires, and choosing between
them is exactly what scoring does. Words are facts the host tells (or loads from a
module), so they get namespaces, `sync` and snapshots for free. Nothing in the kernel
reads them except `interpret`.

**Roles and examples.** A role is a short label on an argument (`agent`, `theme`,
`time`, `with`, `amount`) that a frame can use when the language marks the role (a
preposition, a case) rather than naming the key. It can be a key on the existing slot
or param wire if the reviewer accepts it (Q18: `role=` on `core.slot` and on `core.action`
params); until then a host keeps it in its own wires. Examples are ordinary facts of a
host type (`@e1 example lang=en text="book the pen" reads=...`); they need no
vocabulary of their own.

Everything else a reader needs is read from the compiled matrix, which already exposes
it through `schema(type)` and `World.audit`.

## 2. Frames to wires: `world.interpret(frame)` (built in R9.1)

A frame is language-neutral; producing it (tokenizing, morphology, a parser or a
learned model) belongs to the host. Proposed shape:

```js
{ lang: 'en', verb: 'book', args: [{ word: 'pen' }, { role: 'time', word: 'monday' }],
  numbers: [2], question: false }
```

`interpret` would:

1. Look up the verb word: an action, a type (a statement), or, with `question: true`,
   a type and key to ask about. Several meanings give several candidates.
2. For each argument word: if it means a value, place it in every slot whose enum,
   kind or range admits it (`of=` narrows this); if it means a type or names an entity
   (an identifying slot matches it), it becomes a referent `{ type, where }`.
3. Place numbers in integer or quantity slots that accept them.
4. Emit candidates in the shape `score` takes (`{ wires, refer }`, `{ action, args }`,
   `{ question }`). Unknown words stay in `unresolved` on the candidate; nothing is
   invented, and a candidate never gets a value no word or number supplied (defaults are
   reported by `score` as assumptions, not filled by `interpret`).

The number of candidates is the product of the meanings of each word, bounded by a
budget (`limit`, default 50) with the count of dropped readings reported. `interpret`
does not judge; `score` does. Keeping them apart means a host with its own reader can
call `score` alone.

## 3. Scoring candidates against the world: `world.score(candidates)` (built)

This is the "guess the intent from the state" primitive. For each candidate it reports:

- `ok` and `violations`: is the world still consistent with the reading?
- `referents`: for each description, the ids that match it, whether that is one
  (`unique`), and, when the description alone is ambiguous, the ids that keep the
  statement consistent (`fits`). In the example, "a meeting with someone on Monday" with
  two people of whom ann is off on Monday resolves to bob: `fits: ["p2"]`.
- `lacks`: referents nothing matches (the referent is left out of the statement, so the
  rest is still judged), required keys left open, and missing action arguments with
  their `ask`.
- `assumes`: the defaults the reading would rest on (`qty=1` for "order a pen").
- `action`: `{ available, status, missing }` from a trial `act`.
- `answer`: for a question, what `query` would answer.

It tells nothing: each candidate, and each choice of ambiguous referents (up to 50), runs
in a transaction that is undone; `version`, the log and the wires are unchanged
(test/score.test.mjs checks all three).

**The documented order** (`order`, best first):

1. consistent before inconsistent;
2. fewer referents left ambiguous (a referent is settled when unique by its description,
   or when exactly one fits);
3. fewer lacks;
4. fewer words of the frame left out (unused or unresolved; R9.2);
5. fewer assumptions (after words: a reading that ignores part of what was said is worse
   than one resting on a declared default; this decides between splits, Q19);
6. as given (the host's own ranking, such as a parser's confidence, breaks ties).

The order is `rank(scored, criteria)` with `RANKING` as the default criteria (R9.2), so
a host can call it, reorder it or add its own. Every scored candidate says why it has
its place: the winner what it satisfies, a loser the first criterion on which the winner
is better (`on`), what each is there (`why`), and the winner (`lostTo`). The order prefers a reading the
world can take as it is; it never prefers a reading because the world would need to
invent more.

Cost (bench/score.mjs, 300 items and 40 people, statements with referents, actions and
questions mixed): 1 candidate 0.26–0.31 ms, 10 candidates 1.2–1.6 ms, 100 candidates
5.9–6.5 ms, so about 0.06 ms a candidate in a batch.

## 4. Generating readers

From tool descriptions and words a host can generate a reader per language without
writing one by hand. What the library would own and what stays in the host:

| Library | Host |
| --- | --- |
| tool descriptions: slots, actions, asks, roles (read from the matrix) | tokenizing, morphology, lemmas |
| words as facts (`core.word`, Q17), with namespaces and sync | which words to register; a lexicon per language |
| `interpret(frame)`: words + schema + state → candidates | producing the frame (rules, a parser, or a learned model) |
| `score(candidates)` and its order | the final choice, and asking the user when `order` has ties |
| `describe()`/`schema()` as a source for prompts and grammars | prompt templates, grammars in a parser's format |
| examples checked against the matrix (`score` on each) | collecting examples; training |

A generated reader is then: for each action, a pattern `verb-word (role-word? value)*`
built from its params, their roles and words; for each type, the same with its
required slots; for questions, a question word plus a key word. Because the patterns
come from the matrix, a new slot or enum value appears in the reader as soon as the host
registers its word. A learned model can be prompted with the same descriptions and its
output checked by `score`, so a model's guess never enters the world unchecked.

## 5. Limits

What this cannot do:

- free text: it reads frames, not sentences; without a host's front end nothing works;
- metaphor, irony, idiom beyond a word-level entry;
- long discourse: referents are resolved against the state, not against what was said
  three turns ago, unless the host tells what was said as facts (which it can);
- quantifiers and negation in the utterance ("every", "not the red one") beyond what a
  `where` description can say;
- choosing between two consistent, fully settled readings: `order` then falls back on
  the host's order, and the host should ask.

Cost: each candidate is a trial statement, so it costs what a `tell` costs on this world
(rules, denies, defaults), plus one trial per ambiguous referent choice, capped at 50.
A world with heavy rules pays that per candidate; `interpret`'s budget bounds the
number.

The tests that would prove the design, beyond those written for `score`:

1. every word wire names something that exists (load warning otherwise), tested by an
   audit of a lexicon against its matrix;
2. `interpret` never invents a value: for random frames, every value in a candidate
   comes from a word or a number of the frame;
3. `interpret` + `score` on a corpus of examples per language picks the reading the
   example gives, reported as a rate per language;
4. the same frame in two languages (different words, same meanings) gives the same
   candidates;
5. `score` is read-only under checking mode (`SOPWORLD_COW_CHECK=1`) and with forks.
