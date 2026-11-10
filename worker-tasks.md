# Worker tasks for sopworld

Written by the reviewer session (Claude, also the reviewer of PSys2) at the user's request, 2026-11-10; rewritten at 14:45 after the user's correction.

**The user's direction: sopworld is a general, useful library for self-consistent worlds of SOP Lang wires. It must be *compatible* with the PSys2 worlds, but it is not built *for* them.** Nothing PSys2-specific goes into the core: no PSys2 type names, no PSys2 envelope, no PSys2 file layout. Every feature below must make sense for any user of the library (a scheduler, a digital twin, a tutoring system, a game) and be documented with a neutral example. PSys2 is the first demanding user: its needs show what is missing, and a small compatibility suite (`compat/psys2/`) proves that such a system can sit on the library through its public, general mechanisms.

## Where things stand (reviewer, 2026-11-10 15:15) — read this first

The reviewer's first two commits to this repository were a false start; ignore them. One list is valid: **G1–G9 below**. The earlier S1–S8 list and the `psys2/` directory no longer exist; only `compat/psys2/` does.

| Task | State |
| --- | --- |
| S0, G1, G2 | validated |
| G12 + G13 (e0d09d7), G14 (8c90f27), H3 tiers and value provenance (7921fce), H4 describe / diff (10d6314) | **validated** (reviewer, 18:40): `npm test` 175 pass, 0 fail, 1 skipped; pilot 147/147, **212/217**, 231/232; no PSys2 name in `src/`. Reviewer probe: a cost derived from a defaulted quantity reports tier `default`; `assumptions()` lists the default with its dependants; telling the quantity replaces it (`revised`) and the cost becomes `derived`; `describe` and `diff` return what they should. **Q12 answered:** your choice is right. `count` stays `missing`; the four cases stay listed as failures of parity, with the note that the library's answer is the more truthful one; the PSys2 host will ask for `received` when `count` is missing (no consumer rule in the runner). Close it. **Two notes:** (1) **G11 (soft constraints) is still to do** — do it next, before H5; the PSys2 integration needs it for the three "impossible event" cases and for dialogue in general. (2) In the reviewer's probe a `default=` on a slot that is **not** `required` was never applied by `complete({defaults:true})`, so a rule that reads the key did not fire. Either apply a default when the key is optional but some rule or relation reads it (tier `default`), or state the rule in SPEC and offer `core.slot ... default=1 apply=always`; say which you chose. |
| H1 atomic patches and sound search (d762dc8), H2 slot conflicts (90116e1), G10 ties are ambiguous (d23b20f) | **validated** (reviewer, 18:20): `npm test` 167 pass, 0 fail, 1 skipped; the reviewer's two repros now give `sat` with both keys forced, and a `schema` conflict naming both declarations; pilot 147/147, **208/217** (was 207), 231/232; no PSys2 name in `src/`. Continue with G11–G14, then H3–H6. |
| G8 pilot (feeb300, 5f80fe7, ed4d9f6), G9 docs (09d310f) | **validated** (reviewer, 17:05): `npm test` 161 pass, 0 fail, 1 skipped; `node compat/psys2/run.mjs`: kids.shop 147/147, kids.arith 207/217, kids.tasks 231/232; `demo.mjs` shows the five demonstrations; no PSys2 name in `src/`; the runner has no per-world logic. The report is honest about the line counts and the tasks world (text handling stays code). Thank you: this is what was asked. |
| G7 budgets, stats, structural fork, one spelling of numbers (455f4a3); G5 abduction through calcs (3ef1b78) | **validated** (reviewer, 16:45): `npm test` 154 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. Reviewer probes: fork of a 2,000-wire world 0.007 ms and isolated; the shop abduction now answers `b1.paid=19` for "change of 5" (was `[]`); a self-feeding rule is refused in 2 ms. **Q11 answered:** your choice is right — the compiled cost is the figure that matters (reviewer run: cold 33 ms, best of ten 24 ms on a slower host). Close it; no further tuning. |
| G4 aggregates, arithmetic, time (823e3b3); Q8–Q10 applied (cb4f036) | **validated** (reviewer, 16:00): `npm test` 135 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. On your G4 note: keep pattern matching textual (`5` does not match `5.0`); instead normalise numeric literals **on tell** for slots whose kind is `integer` or `number` (store `5.0` as given but index its canonical form), so hosts never meet the difference. Do it in G7 with the index work, or say why not. |
| `core.check` rename (1b4541b), G6 queries (0d2cb6a), G3 sequence and fluents (5519782) | **validated** (reviewer, 15:50): `npm test` 123 pass, 0 fail, 1 skipped on sources and built file; `compat/psys2` schema and cases tests pass; `git grep -i psys2 src/` empty. |

**Answers to your open questions:**
- **Q8** (`refused` as a sixth status): keep it. "Cannot be" and "several values" are different things; the compatibility runner maps `refused` to PSys2's `conflicting`.
- **Q9** (`complete=true` decides `no` against `unknown`): accepted, and it is the right separation. In the PSys2 mapping read it from `closed`: PSys2 uses `closed=true` to mean "the world knows every instance".
- **Q10** (references to entities outside the session): accepted. The library keeps refusing a reference to a wire that does not exist. In PSys2 `e.user` is a built-in agent that every session has from the start, so the runner telling an `e.user` wire first is correct. The one `$e.tom` case: check whether the agent wire is created by an earlier turn of the same session in the cases file (PSys2 creates an agent wire on first mention, in the same turn); if the wire really is absent from `wires`, list the case as a failure with that reason and I will look at the dump.

**Do next, in this order, one commit each:**
**Round 3 (reviewer, 17:45).** The user sent an outside design review of the library (made at commit e9a6551, before G7 and G5) and asked the reviewer to judge it and organise the work. The reviewer checked each claim on the current code. The result is the order below, one commit each. Finish what you have in hand of G10–G14 first if a commit is nearly done; otherwise follow this order.

## Round 4 (reviewer, 19:05) — read this block first; it replaces the order below

**Validated now:** H5 relations (ff4846c), H6 declarative actions (71f58a0), defaults on optional keys (97d8a7a), 0.5.0 (93a5c5d). Reviewer rerun: `npm test` 182 pass, 0 fail, 1 skipped; pilot 147/147, 212/217, 231/232; no PSys2 name in `src/`. The tag could not be pushed from your session: leave it, the reviewer or the user will tag; the PSys2 worker pins commits meanwhile.

**Validated at 20:35:** L1 one language (8b6a219) and the build identity (533d75a, 59941ab). Reviewer rerun: `npm test` 184 pass, 0 fail, 1 skipped; pilot unchanged (147/147, 212/217, 231/232); no `?id` declaration left in the matrices, examples and tests. Reviewer probe in the new syntax: multi-line `@p purchase … qty=?q` pattern, a fact with the same id `p` does not clash, the rule derives the cost, a fact with a variable is refused, and the old-syntax probe still runs. This is the form the user asked for. **G11 is still missing** (it was first in the order): do it now, then W1–W8, D1, 0.6.0.

**Validated at 20:50:** W1 (3191b63), W2 (b9d5d4f), W3 (b6a5fec), W4 (07d3074), W5 + W6 (9aa0f3e), W7 (305e9fb). Reviewer rerun: `npm test` 192 pass, 0 fail, 1 skipped; pilot unchanged; no PSys2 name in `src/`. Reviewer probe: `revise` of a told quantity recomputes the cost and lists `revised`; `told()` returns the facts as stated and re-telling them is idempotent; a deny's reason quotes the value ("63 lei is too much") with the bindings; `check()` of the whole world; a host function named `add` is refused. **Remaining: W8 (undo / mark / rewind), G11 (soft constraints — asked three times now; the host needs it, please do it next), D1, tag 0.6.0.**

**No git tags (user, 21:14).** The tag idea was the reviewer's and it only caused a stall: your session cannot push tags and the PSys2 worker was waiting for one. Drop it everywhere. A release is: the `version` in `package.json`, `docs/version.md` (version, build hash, date — you already write it) and the changelog entry, on `main`. Hosts pin a **commit hash** and record the version from `docs/version.md`. Wherever this file says "tag", read "bump the version in `package.json` and `docs/version.md`". Do not wait for anyone before bumping to 0.6.0 when D1 is done.

**Validated at 21:10, with a correction.** G11 (ddfcec5) and W8 (280aec2) are in: the reviewer wrongly listed G11 as missing three times; it was done before L1. Sorry. `npm test` 202 pass, 0 fail, 1 skipped. D1 parts 1–3 read (language, reference, semantics): the right shape, executed examples, statements tied to tests.

**Notes on `docs/language.md`, since PSys2 will adopt it as SOP Lang v1.1** (compare with `compat/psys2/specs/01-soplang.md`, which is v1; v1.1 must be a superset where v1 is stricter, or the difference must be stated):
1. **Strings:** v1 uses JSON string escapes (`\n`, `\t`, `\uXXXX`, …) and rejects a bad escape. The grammar here lists only `\"` and `\\`. Adopt JSON escapes exactly, and say what `str()` and `quote()` do.
2. **Identifiers:** v1 is "one or more segments `[A-Za-z_][A-Za-z0-9_-]*` joined by `.`". The grammar here (`name = (letter | "_") { letter | digit | "_" | "." | "-" }`) also accepts `a..b` and a trailing dot. Use the segment form; say whether non-ASCII letters are allowed (v1: no).
3. **Errors:** v1 names every syntax error (text before the first `@`, a declaration without id or type, a token that is not `key=value`, an empty value `key=`, an unterminated string, a bad escape, an invalid identifier, a duplicate id in one parse unit) with offset, line and column, and repairs nothing silently. State the same list and the error shape; where the library is more lenient today, make it strict (an option `lenient` may keep the old behaviour).
4. **Atoms:** v1 excludes `"`, `@`, `$`, `=` and `\` from atoms; here `colour=#fff` and a value containing `=` are allowed. Decide and state it; `@` inside an atom must not be read as a new declaration (give the exact rule: a declaration starts with `@` only at the start of a token).
5. **Canonical serialization** (v1 has it: entries sorted by key keeping the order of repeats, JSON re-escaping, `\n` line ends): include it, `format(wire, { canonical: true })`.
6. **Short and full keys**, and the **value kinds as data** (`{ kind: 'atom' | 'string' | 'ref' | 'var', v }`): describe the in-memory form a host parser must hand over, since PSys2 will parse with its own parser and pass wires.
7. A short **"v1 to v1.1" section**: what is new (variables, comments), what changed, what a v1 file needs (nothing).

Then finish D1 (API reference checked against `index.d.ts`, the generated HTML pages, the test that fails on an undocumented wire type or method) and tag **0.6.0**.

**The first real host has reported.** PSys2 integrated the library (at a7a8e16) behind a switch for three worlds and measured both strategies. On its per-turn consistency audit, turns that leave the world in violation fell from 2.8% (its own code) to 0.3% (matrix); undo, revision and abduction cases started passing; turn time rose 9%. It also sent ten workarounds it needed. They are general API gaps; fix them as W1–W8 below.

**Order from here, one commit each: G11, L1, W1–W8, D1, then tag 0.6.0** (L1 changes the syntax, so it is a minor version).

- **G11 — soft constraints** (as specified below). The host needs it: today an impossible event is refused when told and the user hears "OK"; the host wants the statement recorded with a standing issue.
- **L1 — one language** (as specified below).
- **W1 — functions do not share one registry.** A host action named `add` or `count` replaced the built-in used by effects and calcs. Built-ins, host calc/check functions and host actions live in separate namespaces; a host name that would shadow a built-in is refused at registration unless `{ override: true }`.
- **W2 — a query returns what it derived.** For an answer obtained by supposing a question or request wire, the result carries the supposed answer wire with every key the rules set on it (and `from`), so a host does not need second queries to word the reply.
- **W3 — violations stay explainable after rollback.**
  - A `refused` result names wires as they were (id, type, attrs snapshot), not ids that no longer exist.
  - A deny's `why` may contain `?variables` that are filled from the match ("?m lei is not enough for ?t"), and the violation carries the bindings as data.
- **W4 — `world.check()` with no patch:** validates the whole current state and returns every violation (also soft issues); `World.audit(wires, matrix)` for a foreign set of wires. And a deny over a fluent must be able to refuse the *event* that breaks it at `tell` time (the host saw a purchase that left money negative accepted, and refused only when the balance was asked): document and test the pattern, fix it if the engine cannot do it.
- **W5 — `world.revise(id, key, value)`:** replace a **told** value in one transaction: everything derived from the old value is withdrawn and recomputed, the result lists `revised`. Today `fill` on a told key is a conflict and the host had to rebuild the whole wire for "three of them".
- **W6 — told wires stay as told.** `world.told()` (and `toJSON`) return each told wire exactly as it was stated; values filled later by rules are visible in `get()` with their tier, but re-telling the export to a fresh world must be idempotent (the host got 26 false conflicts).
- **W7 — abduction through `query`:** `query({ ..., mode: 'abduce' })`, or a `missing` result that offers `howto`: when the sought key is open and abducible, the answer lists the explanations, so a host needs no special path for "what did I pay?".
- **W8 — session helpers a dialogue host needs:**
  - `world.undo(n = 1)`: withdraw the last told change(s) as one transaction, returning what went;
  - `world.mark()` / `world.rewind(mark)` for a host that keeps its own snapshots, so its undo and the world's cannot diverge;
  - a refused `tell` in soft mode returns the issue so the host can say it.
- **D1 — the reference documentation** (as specified below), written after L1 so that it uses the final syntax, and covering W1–W8.

The remaining pilot failures (five in arith) are parity differences already judged: no work.

**L1 — one language, and `?` means one thing (user decision, 18:38). Do this right after the task you have in hand, before H5.**

The user's objection, and he is right: `?` is used for two different things. `?p purchase …` *declares* a pattern wire, and `qty=?q` is a *variable* bound by matching. It reads as if a declaration and a variable were the same kind of thing. PSys2's SOP Lang (`compat/psys2/specs/01-soplang.md`) has only `@id type key=value`, and the user wants **one** SOP Lang for facts and rules.

1. **`?name` is only a variable, in value position.** A declaration always starts with `@`.
2. **Pattern wires are ordinary `@` wires.** A wire is a pattern because a rule, deny, relation, action or query names it in `when=`, `not=`, `then=` (the way templates already work: `@a acceleration of=$b magnitude=?A` is a template because the rule lists it), not because of its first character. A pattern with no variable (for example one that only says `core.absent=b`) is still a pattern for that reason. A wire with a variable that nothing names is refused, as today.
3. **Id spaces.** Matrix wires and facts keep separate id spaces as now. Inside a rule, `$p` keeps meaning "the wire that pattern `@p` matched", or the wire that template `@p` produced.
4. **Queries:** `ask('@c change for=$b1 amount=?a')`, or without an id where none is needed (`ask('change for=$b1 amount=?a')`); the bindings are returned by variable name, and the matched wire id under the pattern's id as now.
5. **Comments:** PSys2's v1 has none (`doc=` entries instead). Keep `#` comments: they are useful in rule files and the user's spec will adopt them. A `#` inside a quoted string is text.
6. **Migration:** the parser accepts the old `?id type …` declaration for one version with a deprecation note (`world.warnings`); `format()` and every document, example, test matrix, the playground and `compat/psys2/matrices/` are rewritten to the new form; `tools/migrate-syntax.mjs` converts a file. Add a section "The language" to SPEC that is the single grammar (facts, patterns, variables, references, comments), written so that PSys2 can adopt it verbatim as SOP Lang v1.1.
7. Tests: both forms parse to the same matrix; a `?id` declaration warns; a fact with a variable is still refused; the pilot numbers are unchanged.

**D1 — the reference documentation: syntax and semantics of everything (user, 18:43). After L1, before the 0.5.0 tag; keep it current with every later task.**

The user wants the library well documented, so that its language and behaviour are stated once, precisely, and uniformly. Today the knowledge is spread over SPEC.md, several HTML pages, `docs/integration.md` and the worker log, and parts still describe 0.4.

1. **`docs/language.md` — the language reference** (normative; the source for PSys2's SOP Lang v1.1).
   - Lexical grammar in EBNF: declaration, identifier, entry, value kinds (atom, string, reference `$id`, variable `?name`), comments, whitespace, multi-line declarations.
   - What is an error and how it is reported: offset, line, column.
   - The three signs and their single meanings: `@` declares, `$` refers, `?` is a variable.
   - Id spaces: facts, matrix, modules.
   - Qualified and short keys; the bookkeeping namespace; repeated keys.
   - Canonical serialization.
2. **`docs/reference.md` — one entry per wire type of the matrix language and per built-in function**, all in the same shape:
   - **Syntax:** every attribute, with type, default, whether repeatable.
   - **Meaning:** stated as a rule, not as an example.
   - **When it is evaluated:** on tell, in the chase, at validation, on query.
   - **Interactions:** with inheritance, negation, tiers, budgets, soft constraints.
   - **Violations it can raise.**
   - **Example:** a three-line neutral one.
   - **Limits.**

   It covers: `core.type`, `core.slot`, `core.schema.map`, `core.use` / modules, `core.rule`, `core.deny`, `core.calc`, `core.check`, `core.absent`, selectors, aggregates, `core.fluent` / effects / `delta`, `core.relation`, actions, `core.abducible`, `core.question`, `core.answer`, `core.issue`, tiers, and every function (arithmetic, comparison, time, units) with its domain and what happens when it is not applicable.
3. **`docs/semantics.md` — how a world behaves**, as numbered statements a test can cite:
   - the transaction (ingest, chase, validate, commit or roll back);
   - identity and merging;
   - fixpoint and termination (depth, budget);
   - stratified negation and what "absent" means (open world; `complete`, `closed`);
   - defaults and revision;
   - tiers and their propagation;
   - provenance and retraction;
   - sequence, fluents and as-of;
   - aggregates;
   - relations and propagation against search (what is complete and what is not);
   - the statuses of a query and exactly when each is returned;
   - `sat` / `unsat` / `unknown`;
   - `fork`, `check`, `applyPatch`, `diff`;
   - persistence and replay;
   - the invariants (a refused change leaves the world unchanged; no solver answer unverified; and so on).

   Each statement names the test that checks it (`test/…: "name"`). A statement without a test gets one.
4. **`docs/api.md` — every public method and option:** signature, parameters, result shape (each field), errors, budget behaviour, complexity note, one example. Generated from, and checked against, `src/index.d.ts` by a test, so the two cannot drift.
5. **`docs/glossary.md`** — one line per term, used consistently everywhere: wire, fact, pattern, template, variable, reference, matrix, world, state, scenario / fork, slot, kind, tier, assumption, issue, fluent, effect, relation, action, patch, violation, status. Fix the places where the code, SPEC and pages use different words for the same thing (the log already shows "schema" against "matrix", "test" against "check"); list the renames.
6. **One source.**
   - SPEC.md becomes a short overview that links to these files, or is replaced by them.
   - The HTML pages are generated from the same markdown (`tools/build_docs.py`), so nothing says "0.4" or "seven wire types" any more.
   - A test fails when a wire type, attribute, function or public method exists in `src/` but not in the reference, or the reverse.
7. **Examples are executed:** every code block in the docs that is marked as runnable is run by a test (`tools/doc-examples.mjs`), and its printed output is the one shown.

Write it for a reader who has never seen the code. Where the behaviour is a choice (for example defaults on optional keys, ties, soft constraints), state the choice and the reason in one sentence.

**A. Two defects the review found, reproduced by the reviewer on a7a8e16. Do these first.**

1. **H1 — a whole assignment is checked atomically; search must not reject on invalid prefixes.**
   - Repro:
     ```
     @s1 core.slot of=box key=a required=true enum=1
     @s2 core.slot of=box key=b required=true enum=1
     ?x box a=?v core.absent=b
     @d1 core.deny when=$x why="a without b"
     ?y box b=?v2 core.absent=a
     @d2 core.deny when=$y why="b without a"
     ```
     then `tell('@b1 box')`. `tell('@t box a=1 b=1', {dry:true})` is accepted, but `solveReport()` says **`unsat`** and `next()` reports both keys **dead**. The domains are filtered by trying each value alone, and a solution is verified by applying values one after another, so an intermediate state that a deny (with absence or negation) refuses kills a valid joint completion.
   - Fix:
     - a public `world.check(patch)` (a list of fills and wires applied together in one scratch transaction; returns ok, violations, support; always rolled back) and `world.applyPatch(patch)`;
     - the solvers' oracle verifies whole assignments with it;
     - single-value filtering is used only where it is sound (no deny or rule with negation / absence / selector reads the key), otherwise the value stays in the domain and the search decides;
     - `unsat` is reported only with a complete justification in the declared finite fragment; anything else is `unknown`;
     - `next()` and `suggest()` must not call a key dead on single-value trials in that situation.
   - Tests: the repro; a three-key variant; a random comparison against brute-force enumeration with `check` on small problems with absence-based denies.
2. **H2 — two declarations of one slot are a composition conflict, not "last one wins".**
   - Repro: `@k1 core.slot of=t key=color enum=red enum=blue` and `@k2 core.slot of=t key=color enum=blue enum=green` in one matrix are accepted, and then `red` is refused and `green` accepted: the second silently replaced the first.
   - Rule:
     - identical declarations are shared;
     - different declarations of the same type and key are refused with a `schema` violation naming both, unless one says how to combine: `combine=intersect` (enums and numeric bounds intersect; an empty result is itself a violation) or `combine=override` (explicit replacement, recorded).
     - A subtype redeclaring an inherited key is the existing "nearest wins" and stays.
     - The same for `core.schema.map` mappings and module loads.
     - Check that the PSys2 legends in `compat/psys2` still load (they should have no duplicates; if they do, list them in the log: they are real findings).

**B. The general follow-ups from the pilot (already given): G10 ties → `ambiguous`; G11 soft constraints; G12 calc failure reasons; G13 precision option; G14 fluent delta.** Then rerun the pilot and say which of the ten arith failures closed.

**C. What the user asked for next, and what the review rightly proposes.**

3. **H3 — certainty tiers and value-level provenance.** The user wants the world to know which of its data is solid and which is only guessed, because that is where attention must go.
   - Every value (wire, key, value) carries a **tier**: `told` > `derived` (from told only) > `forced` (the only value a closed domain left) > `default` > `guessed` (chosen by `complete({choose})`, a solver, or adopted abduction). A derived value takes the weakest tier among its inputs (propagated through rules, calcs, aggregates, fluents). Tiers are an ordered set a host may extend (declared as wires), with an optional numeric `cost`; they are ranks, not probabilities.
   - Provenance at value level: the justification of a value names the cells it came from (wire and key), the rule / calc / relation, and the tier; alternative justifications are kept (it already works for wires: keep that behaviour, extend it to values). Changing one input cell invalidates only what depends on that cell.
   - API: `world.tier(id, key)`, `world.assumptions()` (everything below `derived`, weakest first, with what depends on each), `query` results carry the tier and the weakest inputs, `explain` shows tiers, `next()` orders its questions by "weakest value with the most dependants first".
   - A told value always replaces a weaker one for the same key (the existing default revision, generalised to every tier below `told`), with the `revised` list.
4. **H4 — `world.describe()`.** A structured summary a host can turn into text, as plain data (no prose): per type the count and the instances; per instance the keys with value and tier; what is open; what is assumed; standing issues (soft violations); the last N changes with their cause. Options: `{ about: id | type, depth, since: seq }`. And `world.diff(a, b)` between two states or forks ("what changes if we choose B").
5. **H5 — relations that solve in more than one direction** (the review's first extension; G5 already inverts calcs inside abduction, this makes it a first-class, forward mechanism).
   - `core.relation` wires over cells of matched wires, linear in the first version: `sum` / `sub` with constant coefficients, written as wires (your syntax; it must be data), with exact rational arithmetic and unit checks.
   - Semantics (the review's table): after substituting known cells — no unknown and true: satisfied; no unknown and false: conflict naming the cells; **one** unknown with non-zero coefficient: the value is derived (tier = weakest input) if it fits the cell's kind and domain (an integer cell does not take 3/2: conflict); several unknowns: the relation is kept, nothing invented.
   - Propagation by a queue over the relations that use a changed cell, to a fixpoint or a conflict, inside the transaction and under the budget. Finite-domain relations may prune domains by support (table constraint); **this is local propagation, not a complete solver**: the search of H1 still decides (test: the x≠y, y≠z, z≠x triangle over {0,1} must come out `unsat` from search, not from propagation, and not `sat`).
   - A `core.calc` with an invertible function may be declared `relation=true` to get the same behaviour without rewriting matrices. `abduce` uses relations.
   - Tests from the review's prototype: paid − total − change = 0 solved for each of the three (198 cases), the chain x+y=10, y+z=8, z=3 → x=5, y=5; undetermined and conflict cases.
6. **H6 — declarative actions** (the concrete half of the review's second extension). An action declared as wires: parameters, a guard (conditions over cells and parameters), and **simultaneous writes** (every expression reads the state before the action), executed as one patch through `check` / `applyPatch`. It replaces registered JavaScript functions where the logic is "check and update values"; functions stay for everything else. A refused guard returns `refused` with the failing condition. Use it in the pilot where it fits (the shop purchase) and report the lines of `fns.mjs` or matrix it removes.

**D. Postponed, with the reviewer's reasons (do not start):**
- **Symbolic execution of actions and invariant proofs** (conservation and so on): coherent and feasible on top of H5 + H6, but no user of the library needs proofs over families of inputs yet. Revisit after H6 with one concrete use.
- **Bounded planning** (breadth-first over declared actions): after H6, when a host asks for it.
- **A persistent structure of contexts / scenarios:** `fork()` is structural since G7 (0.007 ms at 2,000 wires); scenarios are forks plus a list of assumptions (H3 gives that list).
- **E-graphs, general abstract interpretation, a probabilistic or causal engine, epistemic or deontic logic, general induction, holographic algorithms, VSA retrieval:** agreed with the review, not now; each lacks a concrete problem here.
- The review's point about abduction missing `paid=15` is **already fixed** by G5 (reviewer rerun: `p1.paid=15`), and its recursion worry (p→q, q→p after retracting the last outside premise) **already behaves correctly** (both gone).

**E. Housekeeping at the end of this round:** old HTML pages; version **0.5.0** and a tag, with a short changelog. The PSys2 worker pins that tag.

**Order:** H1, H2, G10–G14 (those not yet done), H3, H4, **G11, L1**, H5, H6, **D1**, housekeeping + tag (D1's files are updated by every task after it). Report the pilot numbers again after G10–G14 and after H6.

Working rules for commits: pull with rebase before each commit; the reviewer only ever changes `worker-tasks.md` (tasks and answers) and, when you ask for more material, files under `compat/psys2/` — never `src/`, tests, docs, `questions.md` or your log. If a reviewer commit lands while you work, rebase onto it; it will not touch your files.

## 0. Protocol

| File | Who writes | What it is |
| --- | --- | --- |
| `worker-tasks.md` (this file) | reviewer only | The tasks. `git pull` before each task. Validated tasks move to "Validated" at the end. |
| `worker-log.md` | worker only | One entry per task: status, commands run, numbers, commit hash, deviations. Push when a task is done. |
| `questions.md` | worker only | Non-blocking questions: take the most reasonable choice, note it, continue. The reviewer answers in this file, under "Where things stand". |

Rules:
1. Everything on disk is in English.
2. Commit after each task (`Gn: <summary>`); `npm test` stays green on the sources and on the built file; rebuild `docs/`.
3. Every number in the log comes from a command written in the log.
4. Zero dependencies, one built file, browser and Node.
5. **Generality test for every change:** could a user who has never heard of PSys2 want this, and is it named and documented without PSys2 words? If not, it belongs in `compat/psys2/` (test code and mapping files), not in `src/`.
6. `compat/psys2/` holds a small sample of PSys2 (see its README): three specifications and three small worlds with their test cases. It is reference and test material. If you need more of PSys2, ask in `questions.md`.

## 1. What the first real user showed is missing (reviewer's check of 0.4, commit 72e22c7)

- The parser already reads PSys2's `.sop` files (13,759 wires in 114 files, no error), and a 15-line matrix reproduces the core of its shop world. Speed is fine (1–2 ms per `tell` / `step`).
- Gaps, all general: no type inheritance; the schema can only be written as `core.slot`; no order or state over time; no aggregates; abduction does not go through calculations; budgets do not cover every loop; `fork()` replays the log.

## 2. Tasks (general features)

### G1 — type hierarchy
`core.type` gets `extends=<type>` (several allowed if you can keep it sound; one is enough). A pattern of type `T` matches wires of `T` and of its descendants; slots are inherited (nearest declaration wins); reference slots (`type=`) accept descendants; indexes follow. Cycles are refused. Neutral example: `vehicle` > `car`, `truck`.

### G2 — schema vocabulary: slots can be declared in more than one notation
Many systems already have their own schema wires. Give the library a **declared mapping from foreign schema wires to its own**, written as wires, so that a user loads an existing schema unchanged:
```
@m core.schema.map from=<wire type of the foreign key declaration>
     of=<how to get the owning type>  key=<how to get the key name>
     required=<attr>  many=<attr or attr=value>  ask=<attr>  type=<attr holding a reference>  kind=<attr holding a literal kind> ...
```
(the syntax is yours; it must be data, not code, and documented). With it:
- literal kinds (`integer`, `number`, `boolean`, `string`, `atom`, quantities, times) are a general slot attribute (`kind=`), checked on tell;
- keys may be written short (`count=`) or qualified (`<type>.count=`); a declared namespace prefix for keys that validation always allows (for bookkeeping keys such as provenance or sequence);
- unknown attributes of schema wires are kept and readable through `world.schema(type)`, never refused;
- a module can be loaded **without** id prefixing when its ids are already qualified (an option of `core.use` or of the library entry).

### G3 — order and state over time
Version 0.4 has no notion of time (SPEC section 6). Add, as wires:
1. **Sequence.** Every told wire has a sequence number (taken from a declared key when present, else the tell order). Tests `before`, `after`; selectors `latest`, `first` in patterns.
2. **Fluents and effects.** A key declared as a state that events change; effect wires say how an event type changes it (`set`, `add`, `sub`, custom function). The current value is derived by applying effects in sequence order from the last explicit statement; an unknown start stays unknown; an effect that breaks a slot bound is a `conflict` naming the event. Retract or replace of an event recomputes incrementally.
3. **As-of queries:** `ask(pattern, { at: seq })`.
Neutral example in the docs: a warehouse stock with deliveries and withdrawals, or an account.

### G4 — aggregates and more arithmetic
1. Aggregates as calc over a pattern, grouped by bound variables: `count`, `sum`, `min`, `max`, `argmin`, `argmax`, `collect`. Maintained incrementally; stratified like negation.
2. Functions: `mod`, `abs`, `round`, integer division; clock and date arithmetic (add a duration, difference, weekday).
3. Typed comparison (`5` equals `5.0`; `10:00` before `14:30`).

### G5 — abduction through calculations
Today `abduce('?x change amount=5')` on a "paid − total = change" rule returns `[]`: the backward step ignores `core.calc`.
1. Invert `add`, `sub`, `mul`, `div` when all but one argument is known; for other functions and enumerable domains, try candidates forwards.
2. An abducible numeric key without an enum can be solved for when one calc chain determines it.
3. Tests: one-step and two-step chains, a non-invertible function with an enum, and a case with no solution (returns `[]` within the budget).

### G6 — queries with a status, and answers as wires
A general query call for "what is the value of key K of the thing matching these constraints": `world.query({ type, seek, where, about, mode })` (also accepted as a `core.question` wire, the shape `next()` already produces) returning `{ status, value | values, from, missing, alternatives }` with statuses `supported` (one value), `conflicting` (several, listed), `missing` (none; names the open key and its `ask`), `unknown`/`no` for existence by open/closed type, `budget`. Optionally it records a `core.answer` wire with provenance. Registered functions can be declared as producers of a key (`outputs=`), tried when lookup finds nothing. Actions (`core.request`-like wires that run a registered function) execute inside one transaction: refusal leaves the world unchanged and returns the violations.
Keep the names neutral and configurable where another system's vocabulary differs (which key holds the status, which wire type is the answer): that is what the compatibility suite will configure.

### G7 — compute budgets everywhere, and cheap forks
1. One deterministic `budget` (`{ steps }`, optional `ms`) per call, ticked in every loop: joins, chase, negation re-evaluation, lookahead, `suggest`, all solvers and the SAT solver, abduction, induction alignment, retraction, aggregates, replay.
2. Out of budget is never a hang and never an exception: `{ ok: false, violations: [{ kind: 'budget', site, steps }] }` (or `unknown` for solvers), world unchanged. `world.stats()` gives steps per site of the last call.
3. A test per site with a matrix built to explode; a static test that every `while`, `for(;;)` and recursion in `src/` ticks the budget or carries `// bounded: <reason>`.
4. `fork()` becomes structural (snapshot or copy-on-write), not a replay: a fork of a 2,000-wire world in < 1 ms. Hosts make many what-if copies per user message.

### G8 — compatibility suite and proof of value (`compat/psys2/`, test code only)
Shows that a real system can sit on the general library **without changes to `src/` that name it**.
1. `compat/psys2/mapping.sop`: the G2 schema mapping for PSys2 legends (`core.key` with `value`, `card`, `ask`, `required`; `core.type` with `extends`; `core.legend` with `imports`), the bookkeeping namespace (`core.*`), and the G6 vocabulary (PSys2's `core.question` / `core.answer`, `core.status`). Loading the legends in `compat/psys2/worlds/` through it gives 0 violations.
2. Three small worlds rebuilt as matrices in `compat/psys2/matrices/<world>/matrix.sop` (rules, fluents, aggregates, denies, defaults; a small `fns.mjs` only where really needed): `kids.shop`, `kids.arith`, `kids.tasks`. The existing `ops.mjs` there shows what must be computed; the goal is to replace its logic, not call it.
3. Runner `compat/psys2/run.mjs`: for each line of `cases/<world>.cases.jsonl` (same `session` = same World), tell the non-answer wires, run the query or action for each question or request wire, and compare status and value(s) with `psys2.answers` (reply wording is not compared).
4. Report per world: cases passed / total (147, 217, 232), lines of matrix + fns against the lines of the `ops.mjs` logic replaced (159, 237, 231), ms per case; and one demonstration each of what the matrix adds: a missing argument asked as a question, a default withdrawn by a later statement, `retract` as undo, `explain` of an answer, one abduction.
5. **Done when** each world passes ≥ 95% with at most half the code, every failure is listed with its reason, and `git grep -i psys2 src/` is empty.

### G9 — documentation
SPEC and docs updated for G1–G7 with neutral examples; `docs/integration.md`: how a host system maps its schema, its questions and its operations onto the library (the general recipe), with `compat/psys2/` as the worked example.

## 3. Order

G1, G2, G6, G3, G4, G7, G5, G8, G9. G8 for the shop world can start as soon as G1, G2, G4 and G6 are in.

## Validated

- S0 (c583bfa): tests that need an outside solver are skipped when it is missing; `AGENTS.md` added. Accepted from the log (80 pass, 1 skipped, 0 fail).
- G1 + G2 (23f238b): type hierarchy; schema mapping as data, literal kinds, qualified keys. Reviewer rerun: 96 pass / 0 fail / 1 skipped twice, compat schema test 2 pass, no PSys2 name in `src/`. Open from it: the `replace` benchmark is slower than 0.4 (goes to G7).
- `core.check` rename (1b4541b), G6 (0d2cb6a), G3 (5519782): reviewer rerun 123 pass / 0 fail / 1 skipped twice; compat tests pass; no PSys2 name in `src/`.
- G4 (823e3b3), Q8–Q10 applied (cb4f036): reviewer rerun 135 pass / 0 fail / 1 skipped; compat tests pass.
- G7 (455f4a3) and G5 (3ef1b78): reviewer rerun 154 pass / 0 fail / 1 skipped; fork 0.007 ms at 2,000 wires; shop abduction answers paid=19; runaway rule refused in 2 ms. Q11 closed (compiled cost is the target).
- G8 pilot and G9 docs (feeb300, 5f80fe7, ed4d9f6, 09d310f): reviewer rerun 161 pass / 0 fail / 1 skipped; pilot 147/147, 207/217, 231/232; five demonstrations run.
- H1 (d762dc8), H2 (90116e1), G10 (d23b20f): reviewer rerun 167 pass / 0 fail / 1 skipped; repros fixed; pilot arith 208/217.
- G12–G14, H3, H4 (e0d09d7, 8c90f27, 7921fce, 10d6314): reviewer rerun 175 pass / 0 fail / 1 skipped; pilot arith 212/217; tier probe passes. Q12 closed. Open: G11, default on an optional key.
- H5 (ff4846c), H6 (71f58a0), optional-key defaults (97d8a7a), 0.5.0 (93a5c5d): reviewer rerun 182 pass / 0 fail / 1 skipped; pilot unchanged.
- L1 (8b6a219) + build identity (533d75a, 59941ab): reviewer rerun 184 pass / 0 fail / 1 skipped; pilot unchanged; new-syntax probe passes.
- W1–W7 (3191b63 … 305e9fb): reviewer rerun 192 pass / 0 fail / 1 skipped; probes pass.
- G11 (ddfcec5), W8 (280aec2), D1 parts 1–3 (1221361, 599e6de, e81f470): reviewer rerun 202 pass / 0 fail / 1 skipped. Notes on the language reference for v1.1 given.
