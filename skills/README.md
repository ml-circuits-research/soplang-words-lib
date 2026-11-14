# Skills

Agent skills that use this library on a host and a knowledge repository (Round 27). Each is a
folder with a `SKILL.md`: when to use it, its parameters (the repositories: `LIB` this one,
`KNOW` the knowledge repository at the commit in `repos.pin`, `HOST` the application), its
steps, and a dry run that needs no host.

| Skill | Use it when | Dry run |
| --- | --- | --- |
| [expand-and-test-case](expand-and-test-case/SKILL.md) | before fixing any failing case: expand it into its cousins, test the host per degree × dimension, and force a rule with `learnRules` | `node tools/cousins-test.mjs` |

The other Round 27 skills (reading a new world, wiring a knowledge world, measuring a curve,
releasing a version) follow, each calling this one where a fix is made.
