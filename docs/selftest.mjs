// Self-test of the single-file build. Runs in a browser (selftest.html) and in Node:
//   node docs/selftest.mjs
import { World, solvers, induce, adopt, version } from './sopworld.mjs';
import { mechanics, family, garden, meetings, clinic, plant, procedure, library } from './worlds.mjs';
import { scheduling, instance } from './scheduling.mjs';

const check = (cond, message) => { if (!cond) throw new Error(message); };
const same = (a, b, message) => check(JSON.stringify(a) === JSON.stringify(b), `${message}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`);
const world = (matrix, options) => { const w = new World(options); w.load(matrix); return w; };

export const checks = [
  ['deduction fills an open key and explains it', () => {
    const w = world(mechanics);
    w.load('@b1 body mass=2kg  @f1 force on=$b1 magnitude=10N  @a1 acceleration of=$b1');
    same(w.get('a1').attrs.magnitude, ['5N/kg'], 'magnitude');
    same(w.explain('a1').fills[0].via, 'newton2', 'via');
  }],
  ['refused changes leave the world untouched and say why', () => {
    const w = world(mechanics);
    const before = w.toSOP();
    const r = w.tell('@b2 body mass=0kg');
    same([r.ok, r.violations[0].why, r.violations[0].support], [false, 'mass must be positive', ['b2']], 'refusal');
    same(w.toSOP(), before, 'state');
  }],
  ['recursive rules reach a fixpoint', () => {
    const w = world(family);
    w.load('@e1 parent of=ana child=bogdan  @e2 parent of=bogdan child=carla  @e3 parent of=carla child=dan');
    same(w.ask('?a ancestor of=?who desc=dan').map((x) => x.who).sort(), ['ana', 'bogdan', 'carla'], 'ancestors');
  }],
  ['completion forces what has one consistent value', () => {
    const w = world(meetings);
    w.load('@m0 meeting room=$big time=10:00 people=8 duration=60  @m1 meeting people=9');
    same(w.complete({ defaults: true }).filled.map((f) => `${f.key}=${f.value}`), ['room=$big', 'time=14:00', 'duration=30'], 'filled');
    same(w.fill('m1', 'duration', '60').revised, [{ id: 'm1', key: 'duration', value: '30' }], 'revised default');
  }],
  ['questions carry the options that are still consistent', () => {
    const w = world(meetings);
    w.load('@m0 meeting room=$big time=10:00 people=8 duration=60');
    const s = w.step('@m1 meeting people=3');
    same(s.questions.map((q) => q.attrs.seek[0]), ['room', 'time'], 'questions');
    check(w.answer(s.questions[0], '$small').ok, 'answer accepted');
  }],
  ['abduction finds causes and a deny removes one', () => {
    const w = world(garden);
    same(w.abduce('?g slippery place=lawn').map((e) => e.assume[0].type).sort(), ['rain', 'sprinkler'], 'two causes');
    w.load('@now season name=winter');
    same(w.abduce('?g slippery place=lawn').map((e) => e.assume[0].type), ['rain'], 'one cause in winter');
  }],
  ['abduction can assume the value of an open key', () => {
    const w = world(clinic);
    w.load('@ion patient name=ion');
    const [e] = w.abduce('?a symptom of=$ion kind=cough  ?b symptom of=$ion kind=fever');
    same(e.fills, [{ id: 'ion', key: 'condition', value: 'flu' }], 'diagnosis');
    check(adopt(w, e).ok, 'adopted');
  }],
  ['induction learns a rule with a computed value', () => {
    const r = induce([
      { when: '@l line qty=2 price=10', then: '@t total of=$l amount=20' },
      { when: '@l line qty=3 price=5', then: '@t total of=$l amount=15' },
    ], { name: 'lt' });
    const w = world(r.text);
    w.load('@l9 line qty=4 price=25');
    same(w.ask('?t total amount=?a')[0].a, '100', 'learned total');
  }],
  ['retraction removes what rested on a fact and keeps what has other support', () => {
    const w = world(garden);
    w.load('@r1 rain place=lawn  @s1 sprinkler place=lawn');
    w.retract('r1');
    same(w.ofType('wet').length, 1, 'still wet');
    w.retract('s1');
    same(w.ofType('slippery').length, 0, 'dry');
  }],
  ['a state change is one transaction', () => {
    const w = world(plant);
    w.load('@t1 tank capacity=100  @r1 reading of=$t1 level=95');
    same(w.ofType('alarm').length, 1, 'alarm');
    check(w.replace('r1', '@r1 reading of=$t1 level=40').ok, 'replaced');
    same(w.ofType('alarm').length, 0, 'alarm gone');
    same(w.replace('r1', '@r1 reading of=$t1 level=120').ok, false, 'impossible reading refused');
  }],
  ['negation is maintained', () => {
    const w = world(procedure);
    w.load('@mix step name=mix first=true  @bake step name=bake after=$mix');
    same(w.ask('?r ready step=?s').map((x) => x.s), ['$mix'], 'first');
    w.load('@d1 done step=$mix');
    same(w.ask('?r ready step=?s').map((x) => x.s), ['$bake'], 'next');
  }],
  ['matrices compose and a world survives a JSON round trip', () => {
    const w = new World({ library });
    w.load('@u1 core.use world=garden  @u2 core.use world=geo');
    w.load('@pl1 place name=lawn in=north  @f1 forecast region=north kind=rain');
    const copy = World.fromJSON(JSON.parse(JSON.stringify(w)), { library });
    same(copy.ask('?s slippery place=?p').map((x) => x.p), ['lawn'], 'restored');
  }],
  ['both built-in solvers find a valid schedule', () => {
    for (const solver of [solvers.backtrack(), solvers.cdcl()]) {
      const w = world(scheduling, { solver });
      w.load(instance({ meetings: 8, rooms: 3 }));
      const r = w.solveReport();
      same(r.status, 'sat', solver.name);
      check(w.apply(r.assignment).ok && w.open().length === 0, `${solver.name}: assignment accepted`);
    }
  }],
  ['an asynchronous outside solver is verified by the world', async () => {
    const outside = solvers.external({
      name: 'outside',
      run: (data) => new Promise((done) => setTimeout(() => {
        // a deliberately simple stand-in: first combination that breaks no nogood
        const pick = (i, values) => {
          if (data.nogoods.some((ng) => ng.every((l) => l.v < i && values[l.v] === l.value))) return null;
          if (i === data.variables.length) return values;
          for (const value of data.variables[i].domain) { const r = pick(i + 1, [...values, value]); if (r) return r; }
          return null;
        };
        done(pick(0, []));
      }, 0)),
    });
    const w = world(scheduling, { solver: outside });
    w.load(instance({ meetings: 5, rooms: 2 }));
    const r = await w.solveAsync();
    same(r.status, 'sat', 'status');
    check(w.apply(r.assignment).ok, 'assignment accepted');
  }],
];

export async function run() {
  const results = [];
  for (const [name, fn] of checks) {
    const t = Date.now();
    try { await fn(); results.push({ name, ok: true, ms: Date.now() - t }); }
    catch (e) { results.push({ name, ok: false, ms: Date.now() - t, error: e.message }); }
  }
  return { version, results, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
}

if (typeof document === 'undefined') {
  const report = await run();
  for (const r of report.results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok ? '' : ` - ${r.error}`}`);
  console.log(`sopworld ${report.version}: ${report.passed} passed, ${report.failed} failed`);
  if (report.failed) process.exitCode = 1;
}
