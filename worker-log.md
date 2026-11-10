# Worker log

One entry per task of `worker-tasks.md`. Every number comes from a command written here.
The worker's machine: Node v22.23.4, Linux; clingo 5.8.3 and PySAT (CaDiCaL) installed
through pip, so "without solvers" is simulated as described in S0.

## S0 — housekeeping — done

**1. Solver tests are skipped when the solver is missing.**

Cause: `available()` in `node/solvers.mjs` returned true whenever the command could be
started. `python3 -m clingo --version` and `python3 -c 'import pysat'` start and exit with
status 1 when the module is missing, so the tests ran and failed. It now requires exit
status 0.

Reproduction of the reviewer's result and the check after the fix, with a `python3` that
has no solver modules first on the PATH:

```
mkdir -p /tmp/fakebin
printf '#!/bin/sh\necho "No module named clingo" >&2\nexit 1\n' > /tmp/fakebin/python3
chmod +x /tmp/fakebin/python3
NODEDIR=$(dirname $(which node))
PATH=/tmp/fakebin:$NODEDIR:/usr/bin:/bin node --test                      # sources
SOPWORLD_BUNDLE=1 PATH=/tmp/fakebin:$NODEDIR:/usr/bin:/bin node --test    # built file
```

| State | tests | pass | fail | skipped |
| --- | --- | --- | --- | --- |
| before the fix (df55e3c), sources | 81 | 78 | 3 | 0 |
| after the fix, sources | 81 | 80 | 0 | 1 |
| after the fix, built file | 81 | 80 | 0 | 1 |

The one skipped test is the comparison with CaDiCaL on 40 instances. The two other tests
that failed before loop over the solvers that are available, so they now run with the two
built-in solvers only.

With the solvers installed (`npm test`): 81 pass on the sources, 81 pass on the built file.

**2. `AGENTS.md`** added: the rules of section 0 in five lines.

Deviations: none.
