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

**Answer:**
