// Micro-benchmarks. `node tools/bench.mjs [path-to-library]` (default: the sources).
const lib = await import(process.argv[2] ? new URL(process.argv[2], `file://${process.cwd()}/`).href : '../src/index.mjs');
const { World, solvers } = lib;
const { family, meetings, plant } = await import('../examples/worlds.mjs');
const { scheduling, instance } = await import('../examples/scheduling.mjs');

// The first figure is one cold run, as before. With `again`, the run is repeated and the
// best time is printed too: what the call costs once the engine has compiled it.
const time = (label, fn, note = () => '', again = 0) => {
  const t = performance.now();
  const out = fn();
  const cold = performance.now() - t;
  let best = Infinity;
  for (let i = 0; i < again; i++) { const t1 = performance.now(); fn(); best = Math.min(best, performance.now() - t1); }
  console.log(`${label.padEnd(46)} ${cold.toFixed(0).padStart(6)} ms  ${note(out)}${again ? `  (best of ${again} more: ${best.toFixed(0)} ms)` : ''}`);
  return out;
};

time('join: 3000 parents -> grandparents', () => {
  const w = new World();
  w.load('?p1 parent of=?x child=?y\n?p2 parent of=?y child=?z\n@g grandparent of=?x child=?z\n@gp core.rule when=$p1 when=$p2 then=$g');
  let s = '';
  for (let i = 0; i < 3000; i++) s += `@e${i} parent of=n${i} child=n${i + 1}\n`;
  w.load(s);
  return w;
}, (w) => `${w.wires.size} wires`);

const fam = time('recursion: 40 chains x 25, ancestors', () => {
  const w = new World({ maxDepth: 60 });
  w.load(family);
  let s = '';
  for (let c = 0; c < 40; c++) for (let i = 0; i < 25; i++) s += `@e${c}_${i} parent of=n${c}_${i} child=n${c}_${i + 1}\n`;
  w.load(s);
  return w;
}, (w) => `${w.wires.size} wires`);

time('retract one fact in that world', () => fam.retract('e7_12'), (r) => `${r.removed.length} removed`);

time('2000 separate tells, three denies checked', () => {
  const w = new World();
  w.load(plant);
  for (let i = 0; i < 1000; i++) {
    w.tell(`@t${i} tank capacity=100`);
    w.tell(`@r${i} reading of=$t${i} level=${i % 100}`);
  }
  return w;
}, (w) => `${w.wires.size} wires`, 10);

time('1000 state changes with replace', () => {
  const w = new World();
  w.load(plant);
  w.load('@t1 tank capacity=100  @r1 reading of=$t1 level=10');
  for (let i = 0; i < 1000; i++) w.replace('r1', `@r1 reading of=$t1 level=${i % 100}`);
  return w;
}, (w) => `${w.wires.size} wires`, 10);

time('chat: 6 meetings, step() each', () => {
  const w = new World();
  w.load(meetings.replace('enum=10:00 enum=14:00', 'enum=09:00 enum=10:00 enum=11:00 enum=14:00'));
  for (let i = 0; i < 6; i++) w.step(`@m${i} meeting people=${3 + i}`);
  return w;
}, (w) => `${w.open().length} open`);

for (const [name, make] of [['backtrack', solvers.backtrack], ['cdcl', solvers.cdcl]]) {
  time(`solve 12 meetings / 5 rooms with ${name}`, () => {
    const w = new World({ solver: make() });
    w.load(scheduling);
    w.load(instance({ meetings: 12, rooms: 5 }));
    return w.solveReport();
  }, (r) => `${r.status}, ${r.stats.oracle} oracle calls`);
}
