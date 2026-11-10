# Rules for every session working in this repository

1. Read `worker-tasks.md` (`git pull` first) and work in the order it gives; only the reviewer edits that file. Log each task in `worker-log.md`, put non-blocking questions in `questions.md`, and continue with the most reasonable choice. The reviewer pushes to `main` too: rebase before pushing.
2. Everything on disk is in English. Commit after each task as `Gn: <summary>`, directly on `main`.
3. Zero dependencies, one built file (`docs/sopworld.mjs`), Node and browsers. After any change: `npm test` green on the sources and on the built file, and `docs/` rebuilt.
4. Every number in the log comes from a command written in the log.
5. The library is general. Nothing in `src/` names a particular consumer (`git grep -i psys2 src/` stays empty); what is specific to one goes in `compat/<consumer>/` as mapping files and test code. The library never imports from `compat/`.
