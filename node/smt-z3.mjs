// Node-only provider for std.problem: the same problem the internal search reads, solved by Z3 through the
// optional z3-solver package (not a dependency of the library: the caller installs it and may pass the module).
//
//   import { World } from 'sopworld';
//   import { z3Provider } from 'sopworld/node/smt-z3.mjs';
//   const provider = await z3Provider();                       // or z3Provider({ module: await import('z3-solver') })
//   const result = await world.compileRequest(problemSop, { provider });
//
// The translation is browser/z3-translate.mjs, shared with the browser provider (browser/smt-z3.mjs).

import { solveWithZ3 } from '../browser/z3-translate.mjs';

export async function z3Provider({ module } = {}) {
  const z3 = module ?? await import('z3-solver');
  const { Context } = await z3.init();
  const z = new Context('sopworld');
  return (model) => solveWithZ3(z, model);
}
