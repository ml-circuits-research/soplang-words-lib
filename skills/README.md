# Skills

Agent skills that use this library on an application and its knowledge repositories. Each is a folder with a
`SKILL.md`: when to use it, its steps, what it may change and must never do, and a dry run on real material
that needs no host. Updated for the owner's operational decisions of 2026-11-17:

> Always generic: add knowledge, planning and reasoning methods, and generic ways of composing worlds. Never
> patch so that a case passes. A case is either solved generically or it stays, honestly, on a list of cases
> looking for their generic solution ("needs <generic piece>"). The live worlds with their declared
> capabilities (kinds, slots, acts, honours) and the language and knowledge worlds constrain interpretation,
> defaults and planning. Surface patterns never execute.

**Parameters, the same for all:**
- `LIB`: this repository.
- `KNOW`: the knowledge repositories at the commits in `repos.pin` (k.*, w.lang.*, w.dialogue, std.*).
- `HOST`: the application: its live worlds, its real turns (phrase logs, the owner's sets) and its honest list.

Nothing in a skill names a particular repository, world or sentence except its dry run.

## Operational scope and evidence

The application's C2 text reader is SOP-BERT (DistilBERT). Its learned proposals feed the
formalizer and reusable world mechanisms; no generative C2 interpreter or fallback grammar reader is
introduced by these skills. Library APIs such as `readRequest`, `repairWords` and the historical dry runs
remain useful for their explicit library contracts. Their results do not demonstrate that the application's
neural reader, binding, execution or editor state works. Follow the actual host trace from input through
reader output, formalization, world resolution, declared tool invocation and resulting state.

For a plausible usable interpretation, act on the best compatible hypothesis, retain ranked alternatives,
and report the concrete effect with a short uncertainty note when needed. Preserve undo and follow-up
corrections. An assumption record is the normal uncertain result; uncertainty alone is not a reason for a
clarifying question or refusal. Knowledge/schema relevance is a prior over compatible live instances,
not a command to discard other hypotheses because another tab is active. Report a missing executor,
invalid binding or absent usable interpretation honestly; do not execute invented capabilities.

Distinguish a reusable world pattern/schema, general knowledge, and concrete world-instance facts.
Imports and composition are explicit references, not copies of every schema or knowledge fact into each
instance. Identify the actual state authority and how tools update it. A native JavaScript state encoded
as SOP for inspection remains a projection unless operational reads and writes use that World as authority.
`serializeInstanceState` persists an implementation projection alongside facts; `instanceStateWorld`
selects the semantic fact/reference closure. Neither serialization nor a capability declaration supplies
missing reasoning or an executor. Literal strings and numbers can remain direct typed slot values;
introduce separate nodes when identity, references or a declared structure require them.

Native code is appropriate for rendering, storage, model inference and declared typed primitive or custom
function boundaries. Semantic choices, defaults and composition should use reusable world knowledge and
mechanisms, with their actual implementation disclosed. Literal identifiers used to route a declared
world or tool are different from identifier-specific branches that decide a request's meaning.

## The first question

Every skill starts from the same question: **which generic piece is missing?** Look for it in this order,
cheapest and most declarative first:

| Piece | Where it lives | Example |
| --- | --- | --- |
| `declaration` | the live world | a `std.schema.kind` act, a `std.schema.honours on=`, a slot with its type, a `k.expect` fact of the world |
| `knowledge` | `KNOW`, a k.* world | a kind fact (`k.kinds`, `k.commonsense`), a value type joined by key, a sourced number |
| `language` | `KNOW`, w.lang.<lang> | a cue (`on= lead= takes=`), a skip word, a number word, an inflection, a `k.actions` verb |
| `composition` | the host, explicit | a composite world that uses two worlds by key (`core.use`, joins), never a silent merge |
| `method` | `LIB` | a step of planRequest's cycle (induce, propose, simulate, deduce, abduce), a `REASON_RULES` constraint, a source of `REQUEST_SOURCES` |
| `library` | `LIB` | a mechanism of the reader or planner (`readRequest`, `repairWords`, `factsOf`, clause splitting) |

If no piece can be named and built, the case goes on the **honest list** ([HONEST-LIST.md](HONEST-LIST.md))
with `needs <generic piece>`. It is never fixed by a rule fitted to it.

For a library request-API run, the request architecture exposes failure evidence: `readRequest` gives `unread` and `spell.asks`,
`planRequest` gives `notHonoured` with a code (`not_declared`, `no_slot`, `value`, `no_kind`, `nothing_left`),
`cannot` and `rejected`, and `reasoning` (induced, soft, derived, chosen). Triage reads that evidence
(`skills/lib/honest.mjs` `triage`), not the sentence.

## Acceptance (two phases)

1. **Transition (now).** While patches are being replaced by generic mechanisms, losing a case that was won
   only by a patch does not matter. Every other lost case is listed on the honest list with its "needs".
2. **Steady (once the patches are gone).** A regression needs very good arguments, written in the log.
   Losing a case is acceptable only for a large gain: at least 10 won per 1 lost, net and on real turns,
   each loss listed as "needs <generic piece>".

**Patch-only or generic?** Switch the patches off (the legacy path, the case-fitted rules, phrase operators)
and run the case on the generic path alone. If it fails there, no generic mechanism wins it: it is
patch-only. When that run is not possible, look at the piece that wins it: it is patch-only when it has a
patch smell ([propose-generic-method](propose-generic-method/SKILL.md#patch-smells)). `acceptance` and
`patchOnly` in `skills/lib/honest.mjs` encode both rules.

**What gates a change**, besides the acceptance rule:
- **properties over the declared worlds**, generated from the declarations (every request key × every kind
  an act honours × every world: `skills/lib/declarations.mjs`, and P1-P11 of `test/request.test.mjs`);
- **probes with new sentences**: sentences that never occurred, generated from the declarations and the
  language world, or written after the change by someone who did not see it;
- **the honest list shrinking**: rows leave because their piece landed, and the log says which.

Row counts (corpora, curves, pass/of) are **reported, never gating** on their own. Nothing is held back from
learning: overlap between training and test is fine; a contaminated test set is replaced by a fresh one
(the host's data principle). There is no held-out freezing.

## The cycle and the order

1. **Real turns arrive** (phrase logs, the owner's sets). [improve-world-from-failures](improve-world-from-failures/SKILL.md)
   triages them into honest-list rows, each with the piece it needs.
2. **Choose** from the honest list: the piece that unlocks the most real turns, then the one that touches
   the most worlds ([HONEST-LIST.md](HONEST-LIST.md#choosing-work)).
3. **Build the piece** with the skill of its class:
   - `declaration` → [author-live-world](author-live-world/SKILL.md) (a new world: [learn-world-from-examples](learn-world-from-examples/SKILL.md));
   - `language` → [learn-language-rules](learn-language-rules/SKILL.md);
   - `knowledge` → [audit-knowledge](audit-knowledge/SKILL.md) (and the knowledge repository's own review);
   - `method`, `library`, `composition`, or a piece nobody can name yet → [propose-generic-method](propose-generic-method/SKILL.md).
4. **Review** every change with the patch-smell checklist (`propose-generic-method/scripts/smells.mjs` on the diff).
5. **Probe**: [expand-and-test-case](expand-and-test-case/SKILL.md) turns a case into related cases and fresh
   probes; author-live-world generates the properties from the declarations.
6. **Accept** by the phase's rule; rows that leave the honest list are logged.

[consolidate](consolidate/SKILL.md) runs steps 1-6 once per cycle, with one combined measurement.

| Skill | Use it when | Dry run |
| --- | --- | --- |
| [improve-world-from-failures](improve-world-from-failures/SKILL.md) | failures arrive: triage each to the generic piece it needs; build it or list it | `node skills/improve-world-from-failures/scripts/dry-run.mjs` |
| [propose-generic-method](propose-generic-method/SKILL.md) | a piece is a method, a mechanism or a composition, or nobody can name it: ideas → adversarial review → proposal | `node skills/propose-generic-method/scripts/dry-run.mjs` |
| [author-live-world](author-live-world/SKILL.md) | writing or changing a live world's rules and facts: declare so the general capabilities work | `node skills/author-live-world/scripts/dry-run.mjs` |
| [learn-world-from-examples](learn-world-from-examples/SKILL.md) | an application needs a new world | `node skills/learn-world-from-examples/scripts/dry-run.mjs` |
| [learn-language-rules](learn-language-rules/SKILL.md) | the missing piece is a word or a form of the language world | `node skills/learn-language-rules/scripts/dry-run.mjs` |
| [audit-knowledge](audit-knowledge/SKILL.md) | the missing piece is a fact, or model-labelled facts need checking against sources | `node skills/audit-knowledge/scripts/dry-run.mjs` |
| [expand-and-test-case](expand-and-test-case/SKILL.md) | a case or a new piece needs related cases and fresh probes | `node tools/generalisation-test.mjs` |
| [consolidate](consolidate/SKILL.md) | the periodic cycle | `node skills/consolidate/scripts/dry-run.mjs` |

Shared code for the dry runs: `skills/lib/honest.mjs` (the honest list, triage, acceptance),
`skills/lib/smells.mjs` (patch-smell hints over a change or a diff), `skills/lib/declarations.mjs` (coverage
and generated properties of a live world), `skills/lib/pairs.mjs` (psys2's form pairs at a fixed commit).

**Never:** a rule, cue or operator fitted to one case; a literal sentence or a world id in generic code;
executable phrase lists fitted to cases; a fallback that hides an unread request; editing a test or a set to pass; restricted data;
bypassing required repository checks or review. Existing owner authorization remains valid; these skills add no approval step.
