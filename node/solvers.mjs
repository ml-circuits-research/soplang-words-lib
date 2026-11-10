// Node-only wiring for external solvers. The encodings and the verification loop live in
// the library (solvers.clingo, solvers.dimacs); this file only starts the processes.
//
//   import { World } from 'sopworld';
//   import { clingoProcess } from 'sopworld/node/solvers.mjs';
//   const world = new World({ solver: clingoProcess() });

import { spawnSync } from 'node:child_process';
import { solvers } from '../src/index.mjs';
// `lib` lets a caller that loaded the single-file build pass its own `solvers` object.

function run(command, args, input) {
  const r = spawnSync(command, args, { input, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) throw new Error(`sopworld: cannot run ${command}: ${r.error.message}`);
  return r.stdout;
}

/** clingo on the PATH (or any command that reads a program on stdin and prints clingo text output). */
export function clingoProcess({ command = 'clingo', args = ['--outf=0', '-'], lib = solvers } = {}) {
  return lib.clingo({ exec: (program) => run(command, args, program) });
}

/** Any SAT solver that reads DIMACS on stdin and prints "s SATISFIABLE" / "v ..." lines. */
export function dimacsProcess({ command, args = [], name = command, lib = solvers }) {
  return lib.dimacs({ name, exec: (cnf) => run(command, args, cnf) });
}

/** True when the command can be started. */
export function available(command, args = ['--version']) {
  const r = spawnSync(command, args, { encoding: 'utf8' });
  return !r.error && r.status !== null;
}
