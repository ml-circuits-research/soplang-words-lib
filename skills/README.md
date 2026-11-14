# Skills

Agent skills that use this library on an application and one or several knowledge
repositories (Round 27). Each is a folder with a `SKILL.md`: when to use it, its parameters,
its steps, and what it may change and must never do. Each has a dry run on real material
(the pinned knowledge repository, psys2's data read in place) that needs no host.

**Parameters, the same for all:**
- `LIB`: this repository.
- `KNOW`: the knowledge repositories at the commits in `repos.pin`.
- `HOST`: the application, with its ledger, cases and held-out rows.

Nothing in a skill names a particular repository except its dry run.

| Skill | Use it when | Dry run |
| --- | --- | --- |
| [learn-world-from-examples](learn-world-from-examples/SKILL.md) | an application needs a new world | `node skills/learn-world-from-examples/scripts/dry-run.mjs` |
| [improve-world-from-failures](improve-world-from-failures/SKILL.md) | a batch of failures arrives: group, place the fix, smallest general change, gate | `node skills/improve-world-from-failures/scripts/dry-run.mjs` |
| [learn-language-rules](learn-language-rules/SKILL.md) | requests fail at reading because of their form | `node skills/learn-language-rules/scripts/dry-run.mjs` |
| [consolidate](consolidate/SKILL.md) | the periodic cycle: freeze, learn, measure, keep only what raises held-out | `node skills/consolidate/scripts/dry-run.mjs` |
| [audit-knowledge](audit-knowledge/SKILL.md) | model-labelled facts need checking against sources | `node skills/audit-knowledge/scripts/dry-run.mjs` |
| [expand-and-test-case](expand-and-test-case/SKILL.md) | before fixing any case: its cousins, a table per degree × dimension, a forced rule | `node tools/cousins-test.mjs` |

**The cycle.** `consolidate` runs `improve-world-from-failures` and `learn-language-rules`.
Each fix goes through `expand-and-test-case`: it is judged on cousins, never on the case
alone. `audit-knowledge` and `learn-world-from-examples` feed the knowledge and the worlds
the cycle reads. What a change buys is measured with `ablation`.

**Never:** phrase lists, editing tests or held-out rows to pass, restricted data, or
merging one's own change unreviewed.
