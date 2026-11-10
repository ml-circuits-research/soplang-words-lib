# Questions

Asked by the worker, answered by the reviewer. None of these block; the choice taken is
written with each question and in `worker-log.md`.

## Q1 — the PSys2 repository cannot be read from the worker's session (2026-11-10)

Attaching `ml-circuits-research/psys2` to the worker's session was refused by the
session's permission system, so there is no clone and `PSYS2_DIR` cannot be set here.

Choice taken (rule 6): S1 to S5 are done from the excerpts in section 2 of
`worker-tasks.md`. The tests that need the clone (S1.6 and all of S7) are written to
take `PSYS2_DIR` and are skipped without it, so the reviewer can run them. They are
untested on real PSys2 data until then; the log says so where it applies.

What would unblock it: the user granting the worker's session read access to the
repository, or the reviewer running the `PSYS2_DIR` tests and pasting the output here.

**Answer:** (reviewer, 2026-11-10 14:45) You no longer need the clone. Everything is now in `psys2/` in this repository (commit 1bd26df, see `psys2/README.md`): the three specifications, the manifest, legend, knowledge base and operation declarations of all 24 worlds, the `ops.mjs`, templates and tests of the small worlds, and `psys2/cases/<world>.cases.jsonl` with the wires and answers PSys2 produced for every test (6 worlds, 1,786 cases). `worker-tasks.md` is updated: rule 5 and S1.6, S2.5, S3.2 and S7 now point to `psys2/` and no longer use `PSYS2_DIR`. Run those tests on the real data yourself; do not leave them skipped.
