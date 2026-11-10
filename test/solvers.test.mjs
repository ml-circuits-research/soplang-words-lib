import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, solvers, Problem, toDimacs, toASP, induce, quantity, format } from '../tools/lib-under-test.mjs';
import { clingoProcess, dimacsProcess, available } from '../node/solvers.mjs';
import { scheduling, instance } from '../examples/scheduling.mjs';
import { meetings, plant, mechanics } from '../examples/worlds.mjs';

const canon = (w) => w.toSOP().split('\n').sort().join('\n');
const world = (solver, opts) => {
  const w = new World({ solver });
  w.load(scheduling);
  w.load(instance(opts));
  return w;
};
const hasClingo = available('python3', ['-m', 'clingo', '--version']);
const hasSat = available('python3', ['-c', 'import pysat']);
const outside = { lib: { clingo: solvers.clingo, dimacs: solvers.dimacs } };
const strategies = () => {
  const s = { backtrack: solvers.backtrack(), cdcl: solvers.cdcl() };
  if (hasClingo) s.clingo = clingoProcess({ command: 'python3', args: ['-m', 'clingo', '--outf=0', '-'], ...outside });
  if (hasSat) s.cadical = dimacsProcess({ command: 'python3', args: ['tools/satsolve.py'], name: 'cadical', ...outside });
  return s;
};

test('solvers: every strategy agrees with the reference on small instances, and answers are valid', () => {
  let sat = 0, unsat = 0;
  for (let seed = 1; seed <= 14; seed++) {
    const opts = { meetings: 3 + (seed % 4), rooms: 1 + (seed % 2), seed };
    const expected = world(solvers.backtrack(), opts).solveReport({ budget: 1e6 }).status;
    assert.notEqual(expected, 'unknown');
    expected === 'sat' ? sat++ : unsat++;
    for (const [name, solver] of Object.entries(strategies())) {
      const w = world(solver, opts);
      const r = w.solveReport(name === 'backtrack' ? { budget: 1e6 } : {});
      assert.equal(r.status, expected, `${name} seed ${seed}`);
      assert.equal(r.solver, name);
      if (r.status === 'sat') {
        assert.ok(w.apply(r.assignment).ok, `${name} seed ${seed}: the assignment is accepted`);
        assert.equal(w.open().length, 0);
      }
    }
  }
  assert.ok(sat >= 3 && unsat >= 3, `both outcomes are exercised (${sat} sat, ${unsat} unsat)`);
});

test('solvers: the cdcl solver decides an instance that exhausts the budget of backtrack', () => {
  const opts = { meetings: 16, rooms: 5, seed: 7 };
  const slow = world(solvers.backtrack(), opts).solveReport({ budget: 300 });
  assert.equal(slow.status, 'unknown');
  const w = world(solvers.cdcl(), opts);
  const fast = w.solveReport();
  assert.equal(fast.status, 'sat');
  assert.ok(fast.stats.oracle <= 2 * fast.stats.variables, `the world is consulted only to verify (${fast.stats.oracle} calls)`);
  assert.ok(slow.stats.oracle > 20 * fast.stats.oracle);
  assert.ok(w.apply(fast.assignment).ok);
});

test('solvers: the default is the cdcl solver; a solver can be given per world or per call', () => {
  assert.equal(new World().options.solver.name, 'cdcl');
  const w = world(undefined, { meetings: 6, rooms: 3 });
  assert.equal(w.solveReport().solver, 'cdcl');
  assert.equal(w.solveReport({ solver: solvers.backtrack() }).solver, 'backtrack');
  assert.equal(w.wires.get('mt0').attrs.room, undefined, 'solving changes nothing');
});

test('solvers: grounded nogoods name the values each deny rules out', () => {
  const w = new World();
  w.load(scheduling);
  w.load('@room0 room capacity=4  @a meeting people=3 with=x  @b meeting people=3 with=x');
  const p = new Problem(w);
  const show = (ng) => ng.map((l) => `${p.variables[l.v].id}.${p.variables[l.v].key}=${l.value}`).join(' & ');
  const all = p.nogoods.map(show);
  assert.ok(all.includes('a.time=t1 & b.time=t1'), 'same person, same time');
  assert.ok(all.includes('a.room=$room0 & a.time=t1 & b.room=$room0 & b.time=t1'), 'same room, same time');
  assert.equal(all.length, 8);
  assert.equal(w.solveReport().status, 'sat');
  const data = p.toJSON();
  assert.deepEqual(data.variables.map((v) => v.name), ['a.room', 'a.time', 'b.room', 'b.time']);
  assert.match(toDimacs(data).text, /^p cnf 10 /);
  assert.match(toASP(data), /^1 \{ a\(0,0\) \} 1\.\n1 \{ a\(1,0\); a\(1,1\); a\(1,2\); a\(1,3\) \} 1\./);
});

// a constraint that no deny states: it follows from a rule and an identity key
const occupancy = `
@k_room core.slot of=meeting key=room required=true type=room
@k_time core.slot of=meeting key=time required=true enum=t1 enum=t2
@k_occ1 core.slot of=occupancy key=room id=true
@k_occ2 core.slot of=occupancy key=time id=true
?m meeting room=?r time=?t
@o occupancy room=?r time=?t by=$m
@occupy core.rule when=$m then=$o
@r1 room name=one
`;

test('solvers: conflicts that arise through rules are learned from the world', () => {
  for (const [name, solver] of Object.entries(strategies())) {
    const w = new World({ solver });
    w.load(occupancy);
    w.load('@a meeting topic=x  @b meeting topic=y');
    const p = new Problem(w);
    assert.equal(p.nogoods.length, 0, 'nothing to ground: there is no deny');
    const r = w.solveReport();
    assert.equal(r.status, 'sat', name);
    assert.notEqual(r.assignment.find((f) => f.id === 'a' && f.key === 'time').value, r.assignment.find((f) => f.id === 'b' && f.key === 'time').value);
    w.load('@c meeting topic=z');
    assert.equal(w.solveReport().status, 'unsat', `${name}: three meetings, one room, two times`);
  }
});

test('solvers: an asynchronous outside solver is used through solveAsync', async () => {
  const calls = [];
  const remote = solvers.external({
    name: 'remote',
    run: async (data) => { // stands in for a WebAssembly or network solver
      calls.push(data.nogoods.length);
      const local = new World({ solver: solvers.cdcl() });
      local.load(scheduling); local.load(instance({ meetings: 6, rooms: 3 }));
      const r = local.solveReport();
      return r.status === 'sat' ? data.variables.map((v) => r.assignment.find((f) => `${f.id}.${f.key}` === v.name).value) : null;
    },
  });
  const w = world(remote, { meetings: 6, rooms: 3 });
  assert.throws(() => w.solveReport(), /asynchronous/);
  calls.length = 0;
  const r = await w.solveAsync();
  assert.equal(r.status, 'sat');
  assert.equal(r.solver, 'remote');
  assert.ok(w.apply(r.assignment).ok);
  assert.equal(calls.length, 1);
});

test('solvers: an outside solver that proposes a wrong answer is corrected by the world', () => {
  let round = 0;
  const sloppy = solvers.external({
    name: 'sloppy',
    run: (data) => { // ignores the nogoods on the first rounds: always the first value
      round++;
      const banned = (values) => data.nogoods.some((ng) => ng.every((l) => values[l.v] === l.value));
      const pick = (i, values) => {
        if (i === data.variables.length) return banned(values) ? null : values;
        for (const value of data.variables[i].domain) { const r = pick(i + 1, [...values, value]); if (r) return r; }
        return null;
      };
      return round === 1 ? data.variables.map((v) => v.domain[0]) : pick(0, []);
    },
  });
  const w = new World({ solver: sloppy });
  w.load(occupancy);
  w.load('@a meeting topic=x  @b meeting topic=y');
  const r = w.solveReport();
  assert.equal(r.status, 'sat');
  assert.ok(r.stats.rounds > 1, 'the first proposal was refused and came back as a nogood');
  assert.ok(w.apply(r.assignment).ok);
});

test('completion: suggestions and strict mode give the same answers with every solver', () => {
  const answers = [];
  for (const solver of [solvers.backtrack(), solvers.cdcl()]) {
    const w = new World({ solver });
    w.load(meetings);
    w.load('@m0 meeting room=$big time=10:00 people=8 duration=60  @m1 meeting people=9');
    const a = [w.suggest('m1', 'time').map((c) => c.value), w.complete().filled.map((f) => `${f.key}=${f.value}`)];
    w.load('@m2 meeting people=3');
    a.push(w.suggest('m2', 'room').map((c) => c.value));
    a.push(w.tell('@m3 meeting people=10 time=14:00', { strict: true }).violations.map((v) => v.kind));
    answers.push(a);
  }
  assert.deepEqual(answers[0], answers[1]);
  assert.deepEqual(answers[0], [['14:00'], ['room=$big', 'time=14:00'], ['$small'], ['dead-end']]);
});

test('completion: choose commits one full solution as assumptions; apply is one transaction', () => {
  const w = world(undefined, { meetings: 6, rooms: 3 });
  const r = w.complete({ choose: true });
  assert.equal(w.open().length, 0);
  assert.ok(r.filled.some((f) => f.kind === 'chosen'));
  // chosen values are assumptions: telling something else replaces them
  const taken = w.get('mt0').attrs.time[0];
  const other = ['t1', 't2', 't3', 't4'].find((t) => t !== taken);
  const again = w.fill('mt0', 'time', other);
  assert.ok(again.ok || again.violations.length > 0);
  if (again.ok) assert.ok(again.revised.some((x) => x.id === 'mt0' && x.key === 'time'));

  const v = world(undefined, { meetings: 4, rooms: 2 });
  const before = v.toSOP();
  const bad = v.apply([{ id: 'mt0', key: 'time', value: 't1' }, { id: 'mt0', key: 'room', value: '$nowhere' }]);
  assert.equal(bad.ok, false);
  assert.equal(v.toSOP(), before);
});

test('numeric domains: min, max and step make a key searchable', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=order key=boxes required=true min=1 max=6 step=1
    @k2 core.slot of=order key=weight min=0 max=100
    ?o order boxes=?b items=?i
    @c core.calc out=?cap fn=mul args=?b args=10
    @t core.test fn=lt args=?cap args=?i
    @enough core.deny when=$o with=$c if=$t why="not enough boxes"
    ?o2 order boxes=?b2 budget=?bu
    @c2 core.calc out=?cost fn=mul args=?b2 args=5
    @t2 core.test fn=gt args=?cost args=?bu
    @afford core.deny when=$o2 with=$c2 if=$t2 why="over budget"
  `);
  w.load('@o1 order items=35 budget=22');
  assert.deepEqual(w.suggest('o1', 'boxes').map((c) => c.value), ['4']);
  assert.deepEqual(w.complete().filled.map((f) => `${f.key}=${f.value}`), ['boxes=4']);
  assert.equal(w.fill('o1', 'weight', '120').violations[0].why, 'must be at most 100');
  assert.equal(w.fill('o1', 'weight', 'heavy').violations[0].why, 'must be a number');
  assert.ok(w.fill('o1', 'weight', '80').ok);
});

test('units: quantities keep, combine or refuse their units', () => {
  assert.deepEqual(quantity('9.81m/s2'), { n: 9.81, unit: 'm/s2' });
  assert.equal(quantity('10:00'), null);
  const w = new World();
  w.load(mechanics);
  w.load('@b1 body mass=2kg  @f1 force on=$b1 magnitude=10N');
  assert.equal(w.ask('?a acceleration magnitude=?v')[0].v, '5N/kg');
  const f = w.fns;
  assert.equal(f.add(['2kg', '3kg']), '5kg');
  assert.equal(f.add(['2kg', '3m']), undefined);
  assert.equal(f.div(['6m', '2m']), '3');
  assert.equal(f.mul(['3', '4m']), '12m');
  assert.equal(f.add(['0.1', '0.2']), '0.3');
  assert.equal(f.lt(['90%', '100%']), true);
  assert.equal(f.lt(['09:00', '10:00']), true);
  assert.equal(w.tell('@b2 body mass=0kg').violations[0].why, 'mass must be positive');
});

test('refusals name the told wires they rest on', () => {
  const w = new World();
  w.load(meetings);
  w.load('@m0 meeting room=$big time=10:00 people=8 duration=60');
  const r = w.tell('@m1 meeting room=$big time=10:00 people=5');
  assert.equal(r.violations[0].why, 'room already booked at that time');
  assert.deepEqual([...r.violations[0].support].sort(), ['m0', 'm1']);
  assert.equal(JSON.stringify(r.violations[0]).includes('closure'), false);
});

test('replace keeps the wires that refer to the replaced one', () => {
  const w = new World();
  w.load(plant);
  w.load('@t1 tank capacity=100  @r1 reading of=$t1 level=95  @n1 note about=$r1 text="calibrated"');
  assert.equal(w.ofType('alarm').length, 1);
  const r = w.replace('r1', '@r1 reading of=$t1 level=40');
  assert.ok(r.ok);
  assert.ok(w.has('n1'), 'the note still points at r1');
  assert.equal(w.ofType('alarm').length, 0);
  assert.equal(canon(World.fromJSON(w.toJSON())), canon(w));
  // replaced by a wire with another id: the note has nothing to point at and goes
  const r2 = w.replace('r1', '@r2 reading of=$t1 level=41');
  assert.ok(r2.ok);
  assert.deepEqual(r2.removed.sort(), ['n1', 'r1']);
  assert.equal(canon(World.fromJSON(w.toJSON())), canon(w));
});

test('trial: what-if questions leave the world and its state stamp untouched', () => {
  const w = new World();
  w.load(plant);
  w.load('@t1 tank capacity=100');
  const stamp = w.stamp;
  const alarms = w.trial((x) => { x.load('@r1 reading of=$t1 level=99'); return x.ofType('alarm').length; });
  assert.equal(alarms, 1);
  assert.equal(w.has('r1'), false);
  assert.equal(w.stamp, stamp);
  w.tell('@r1 reading of=$t1 level=10');
  assert.notEqual(w.stamp, stamp);
});

test('induction: negative examples add the comparison that excludes them', () => {
  const r = induce([
    { when: '@o order qty=5 stock=9', then: '@s shipment for=$o' },
    { when: '@o order qty=2 stock=2', then: '@s shipment for=$o' },
  ], { name: 'ship', negatives: [{ when: '@o order qty=8 stock=3' }] });
  assert.deepEqual(r.tests.map((t) => `${t.fn} ${t.args.join(' ')}`), ['lte ?v0 ?v1']);
  assert.deepEqual(r.coversNegative, []);
  const w = new World();
  w.load(r.text);
  w.load('@a order qty=4 stock=10  @b order qty=11 stock=10');
  assert.deepEqual(w.ask('?s shipment for=?o').map((x) => x.o), ['$a']);

  const stuck = induce([
    { when: '@o order qty=5 stock=9', then: '@s shipment for=$o' },
    { when: '@o order qty=2 stock=2', then: '@s shipment for=$o' },
  ], { negatives: [{ when: '@o order qty=1 stock=4' }] });
  assert.deepEqual(stuck.coversNegative, [0], 'no comparison separates this one: it is reported');
});

test('solvers: the built-in SAT solver agrees with CaDiCaL on 40 instances around the feasibility threshold', { skip: !hasSat }, () => {
  const outsideSat = strategies().cadical;
  let sat = 0, unsat = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const rooms = 2 + (seed % 7), n = Math.floor(rooms * 4 * (0.6 + (seed % 5) * 0.09));
    const w = world(undefined, { meetings: n, rooms, seed });
    const p = new Problem(w);
    const a = solvers.cdcl().solve(p, {}); p.reset();
    const b = outsideSat.solve(p, {}); p.reset();
    assert.equal(a.status, b.status, `seed ${seed}`);
    if (a.status === 'sat') { sat++; assert.ok(w.apply(a.assignment).ok, `seed ${seed}: accepted`); } else unsat++;
  }
  assert.ok(sat >= 10 && unsat >= 10, `${sat} sat, ${unsat} unsat`);
});

test('solvers: Sat is a usable SAT solver on its own', async () => {
  const { Sat } = await import(process.env.SOPWORLD_BUNDLE ? '../docs/sopworld.mjs' : '../src/index.mjs');
  // pigeonhole: 5 pigeons, 4 holes -> unsatisfiable; 4 pigeons -> satisfiable
  const php = (pigeons, holes) => {
    const s = new Sat(pigeons * holes);
    const x = (p, h) => p * holes + h + 1;
    for (let p = 0; p < pigeons; p++) s.addClause(Array.from({ length: holes }, (_, h) => x(p, h)));
    for (let h = 0; h < holes; h++) for (let p = 0; p < pigeons; p++) for (let q = p + 1; q < pigeons; q++) s.addClause([-x(p, h), -x(q, h)]);
    return s;
  };
  assert.equal(php(5, 4).solve(), false);
  assert.equal(php(8, 7).solve(), false);
  const s = php(4, 4);
  assert.equal(s.solve(), true);
  const m = s.model();
  for (let h = 0; h < 4; h++) assert.ok([0, 1, 2, 3].filter((p) => m[p * 4 + h + 1]).length <= 1);
  assert.equal(php(9, 8).solve(50), null, 'a budget of 50 conflicts is not enough');
});
