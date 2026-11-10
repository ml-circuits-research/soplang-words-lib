// The search strategy is given when the world is created. This compares the two built-in
// solvers with clingo and a SAT solver started as processes, when those are installed.
//
//   node examples/solvers.mjs
import { World, solvers } from '../src/index.mjs';
import { clingoProcess, dimacsProcess, available } from '../node/solvers.mjs';
import { scheduling, instance } from './scheduling.mjs';

const strategies = { backtrack: solvers.backtrack(), cdcl: solvers.cdcl() };
if (available('clingo')) strategies.clingo = clingoProcess();
else if (available('python3', ['-m', 'clingo', '--version'])) strategies.clingo = clingoProcess({ command: 'python3', args: ['-m', 'clingo', '--outf=0', '-'] });
if (available('python3', ['-c', 'import pysat'])) strategies.cadical = dimacsProcess({ command: 'python3', args: ['tools/satsolve.py'], name: 'cadical' });
console.log('solvers available:', Object.keys(strategies).join(', '));

const cases = [
  { meetings: 12, rooms: 4 },
  { meetings: 16, rooms: 5, seed: 7 },
  { meetings: 24, rooms: 8 },
  { meetings: 40, rooms: 12 },
];
for (const opts of cases) {
  console.log(`\n${opts.meetings} meetings, ${opts.rooms} rooms, 4 times: ${opts.meetings * 2} open keys`);
  for (const [name, solver] of Object.entries(strategies)) {
    if (name === 'backtrack' && opts.meetings > 16) { console.log(`  ${name.padEnd(10)} skipped`); continue; }
    const w = new World({ solver });
    w.load(scheduling);
    w.load(instance(opts));
    const t = performance.now();
    const r = w.solveReport();
    const ms = (performance.now() - t).toFixed(0);
    const valid = r.status === 'sat' ? (w.apply(r.assignment).ok && !w.open().length ? 'accepted by the world' : 'REFUSED') : '';
    console.log(`  ${name.padEnd(10)} ${r.status.padEnd(8)} ${ms.padStart(5)} ms  ${String(r.stats.oracle).padStart(6)} world checks  ${valid}`);
  }
}

console.log('\nThe default world uses', new World().options.solver.name);
const w = new World();
w.load(scheduling);
w.load(instance({ meetings: 6, rooms: 3 }));
const done = w.complete({ choose: true });
console.log('complete({ choose: true }) filled', done.filled.length, 'keys; open now:', w.open().length);
