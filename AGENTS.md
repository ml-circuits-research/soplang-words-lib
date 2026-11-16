# Rules for every session working in this repository

1. Read `worker-tasks.md` (`git pull` first) and work in the order it gives. The reviewer writes only in that file: tasks, answers to questions, and it deletes a task once the work is accepted. The worker writes everything else: logs each task in `worker-log.md`, keeps non-blocking questions in `questions.md` (deleting each once satisfied with the answer), and continues with the most reasonable choice. Rebase before pushing.
2. Everything on disk is in English. Commit after each task as `Gn: <summary>`, directly on `main`.
3. Zero dependencies, one built file (`docs/sopworld.mjs`), Node and browsers. Versions are not git tags: the version is in `package.json` and `src/index.mjs`, and the build writes it, with a fingerprint of the sources, into the built files and `docs/version.md`. After any change: `npm test` green on the sources and on the built file, and `docs/` rebuilt.
4. Every number in the log comes from a command written in the log.
5. The library is general. Nothing in `src/` names a particular consumer (`git grep -i psys2 src/` stays empty); what is specific to one goes in `compat/<consumer>/` as mapping files and test code. The library never imports from `compat/`.
6. The library holds mechanisms, tests and minimal toy examples only. Particular worlds and knowledge live in sop-knowledge-worlds (or in an application); the library reads them for integration tests and benchmarks at a pinned commit (`repos.pin`: several knowledge repositories in order of precedence, and the applications, through `tools/worlds.mjs`), never keeps its own copies or look-alikes. An example world stays under about 60 lines, is clearly invented and named as an example; one that grows into something reusable is proposed to sop-knowledge-worlds as a `w.*` schema. A case in `cases/` carries only the wires it needs, and names a published world when it needs a real one.

## Way of working: bottom-up and top-down at the same time (owner, 2026-11-16)

Step-by-step delivery with a test gate per stage is a software habit and is not the method here. Work from both ends at once, in parallel lanes, each with its own agent:

- Bottom-up: train SOP-BERT now on the generated data (`psys2/training/sop-bert/data/haiku-v1`, `haiku-v2`, heads from `heads/inventory.json`); the tools of the four areas largely exist already, so bind them to the declared acts directly.
- Top-down: the library tries to bind complex commands (several requests, selectors and results, quantifiers, relations, follow-ups) end to end and publishes the general mechanisms they need.
- Simple commands (draw, add, move, recolour, remove, schedule, write) must work in all four areas from the first round, in parallel, as soon as the reader recognises them. Do not widen one construction at a time and do not wait for one area before starting another.
- Tests stay, but they accompany each lane; they are not a sequence of stages that blocks the other lanes. Where a lane needs a mechanism that is not published yet, it lands what it can and says honestly what is not yet verified.
- There is only the new system: no old path, no engine switch, no fallback to old readers.
