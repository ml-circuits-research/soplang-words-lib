# Rules for every session working in this repository

1. Read `worker-tasks.md` (`git pull` first) and work in the order it gives. The reviewer writes only in that file: tasks, answers to questions, and it deletes a task once the work is accepted. The worker writes everything else: logs each task in `worker-log.md`, keeps non-blocking questions in `questions.md` (deleting each once satisfied with the answer), and continues with the most reasonable choice. Rebase before pushing.
2. Everything on disk is in English. Commit after each task as `Gn: <summary>`, directly on `main`.
3. Zero dependencies, one built file (`docs/sopworld.mjs`), Node and browsers. After any change: `npm test` green on the sources and on the built file, and `docs/` rebuilt.
4. Every number in the log comes from a command written in the log.
5. The library is general. Nothing in `src/` names a particular consumer (`git grep -i psys2 src/` stays empty); what is specific to one goes in `compat/<consumer>/` as mapping files and test code. The library never imports from `compat/`.
