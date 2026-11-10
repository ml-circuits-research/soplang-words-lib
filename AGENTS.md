# Rules for every session working in this repository

1. Read `worker-tasks.md` (`git pull` first) and work in the order it gives; only the reviewer edits that file. Log each task in `worker-log.md`, put non-blocking questions in `questions.md`, and continue with the most reasonable choice.
2. Everything on disk is in English. Commit after each task as `Sn: <summary>`, directly on `main`.
3. Zero dependencies, one built file (`docs/sopworld.mjs`), Node and browsers. After any change: `npm test` green on the sources and on the built file, and `docs/` rebuilt.
4. Every number in the log comes from a command written in the log.
5. Never copy PSys2 files here (PSys2 is AGPL-3.0-only, this library is MIT). Read PSys2 from a clone given by `PSYS2_DIR`; tests that need it are skipped when it is not set.
