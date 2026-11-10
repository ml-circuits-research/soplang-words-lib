import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format, builtins } from '../tools/lib-under-test.mjs';
import { orders } from '../examples/orders.mjs';

const world = () => { const w = new World(); w.load(orders); return w; };
const summary = (w, order = 'o1') => { const s = w.ofType('summary').find((x) => x.attrs.of[0] === '$' + order); return s ? format(s).replace(/^@\S+ /, '') : null; };

test('aggregates: count, sum, max, argmax and collect over the matches of a pattern, per group', () => {
  const w = world();
  w.load('@o1 order customer=ana  @o2 order customer=bob');
  w.load('@l1 line of=$o1 item=pen amount=3  @l2 line of=$o1 item=book amount=12  @l3 line of=$o2 item=lamp amount=40');
  assert.equal(summary(w), 'summary of=$o1 lines=2 total=15 largest=12 largest_item=book items=pen items=book');
  assert.equal(summary(w, 'o2'), 'summary of=$o2 lines=1 total=40 largest=40 largest_item=lamp items=lamp');
  assert.equal(w.ofType('summary').length, 2);
});

test('aggregates: kept up to date when wires arrive, change or leave', () => {
  const w = world();
  w.load('@o1 order customer=ana  @l1 line of=$o1 item=pen amount=3');
  assert.equal(summary(w), 'summary of=$o1 lines=1 total=3 largest=3 largest_item=pen items=pen');
  w.load('@l2 line of=$o1 item=book amount=12');
  assert.equal(summary(w), 'summary of=$o1 lines=2 total=15 largest=12 largest_item=book items=pen items=book');
  assert.equal(w.ofType('summary').length, 1, 'the old summary was withdrawn, not kept beside the new one');
  w.replace('l1', '@l1 line of=$o1 item=pen amount=30');
  assert.equal(summary(w), 'summary of=$o1 lines=2 total=42 largest=30 largest_item=pen items=book items=pen', 'collected in sequence order: l1 was told again');
  w.retract('l2');
  assert.equal(summary(w), 'summary of=$o1 lines=1 total=30 largest=30 largest_item=pen items=pen');
  assert.deepEqual(w.explain(w.ofType('summary')[0].id).via, 'summarise');
  assert.equal(World.fromJSON(JSON.parse(JSON.stringify(w))).toSOP(), w.toSOP());
});

test('aggregates: an empty group counts 0 and sums 0; max, argmax and collect have nothing to say', () => {
  const w = new World();
  w.load(`
    ?o order customer=?c
    ?l line of=$o amount=?a
    @c1 core.calc out=?n fn=count over=$l
    @c2 core.calc out=?t fn=sum over=$l args=?a
    @s1 tally of=$o lines=?n total=?t
    @r1 core.rule when=$o with=$c1 with=$c2 then=$s1
    @c3 core.calc out=?m fn=max over=$l args=?a
    @s2 peak of=$o top=?m
    @r2 core.rule when=$o with=$c3 then=$s2
  `);
  w.load('@o1 order customer=ana');
  assert.deepEqual(w.ask('?t tally lines=?n total=?x').map((x) => [x.n, x.x]), [['0', '0']]);
  assert.equal(w.ofType('peak').length, 0);
  w.load('@l1 line of=$o1 amount=2.5kg  @l2 line of=$o1 amount=1.5kg');
  assert.deepEqual(w.ask('?t tally lines=?n total=?x').map((x) => [x.n, x.x]), [['2', '4kg']], 'units are kept');
  assert.deepEqual(w.ask('?p peak top=?m').map((x) => x.m), ['2.5kg']);
});

test('aggregates: a deny can speak about a whole group, and names the wires behind it', () => {
  const w = world();
  w.load('@cu1 customer name=ana limit=50  @o1 order customer=ana  @l1 line of=$o1 item=pen amount=30');
  const before = w.toSOP();
  const r = w.tell('@l2 line of=$o1 item=desk amount=45');
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].why, "the order exceeds the customer's limit");
  assert.equal(w.toSOP(), before);
  assert.ok(w.tell('@l2 line of=$o1 item=book amount=20').ok, '50 is not over the limit');
  assert.equal(w.replace('cu1', '@cu1 customer name=ana limit=40').ok, false, 'lowering the limit below the total is refused too');
});

test('aggregates: a rule may not aggregate over what its own consequences produce', () => {
  const r = new World().tell(`
    ?o order customer=?c
    ?l line of=$o amount=?a
    @c core.calc out=?t fn=sum over=$l args=?a
    @extra line of=$o amount=?t
    @loop core.rule when=$o with=$c then=$extra
  `);
  assert.equal(r.ok, false);
  assert.match(r.violations[0].why, /not stratified.*"line".*aggregates/);
  assert.match(new World().tell('?o a k=?x\n?l b of=$o\n@c core.calc out=?n fn=median over=$l\n@t c n=?n\n@r core.rule when=$o with=$c then=$t').violations[0].why, /unknown aggregate function "median"/);
});

test('aggregates: argmin with the wire itself as the pick, and min over clock times', () => {
  const w = new World();
  w.load(`
    ?d day name=?n
    ?m meeting on=?n starts=?t
    @c1 core.calc out=?first fn=argmin over=$m args=?t
    @c2 core.calc out=?at fn=min over=$m args=?t
    @s opening of=$d meeting=?first at=?at
    @r core.rule when=$d with=$c1 with=$c2 then=$s
  `);
  w.load('@d1 day name=monday  @m1 meeting on=monday starts=14:30  @m2 meeting on=monday starts=9:05  @m3 meeting on=monday starts=10:00');
  assert.deepEqual(w.ask('?o opening meeting=?m at=?t').map((x) => [x.m, x.t]), [['$m2', '9:05']], '9:05 is before 10:00, not after it as text would say');
});

test('functions: abs, round, mod, idiv', () => {
  const f = builtins;
  assert.equal(f.abs(['-3.5kg']), '3.5kg');
  assert.equal(f.round(['2.5']), '3');
  assert.equal(f.round(['3.14159', '2']), '3.14');
  assert.equal(f.mod(['17', '5']), '2');
  assert.equal(f.mod(['-1', '7']), '6', 'the result has the sign of the divisor');
  assert.equal(f.idiv(['17', '5']), '3');
  assert.equal(f.idiv(['17min', '5min']), '3');
  assert.equal(f.mod(['1', '0']), undefined);
  assert.equal(f.abs(['soon']), undefined);
});

test('functions: clock and date arithmetic', () => {
  const f = builtins;
  assert.equal(f.time_add(['10:40', '35min']), '11:15');
  assert.equal(f.time_add(['10:40', '35']), '11:15', 'a bare number is minutes for a clock');
  assert.equal(f.time_add(['23:30', '2h']), '01:30', 'wraps around midnight');
  assert.equal(f.time_add(['9:05:30', '45s']), '09:06:15');
  assert.equal(f.time_add(['10:00', '-90min']), '08:30');
  assert.equal(f.time_diff(['14:30', '10:00']), '270min');
  assert.equal(f.time_add(['2026-01-30', '3d']), '2026-02-02');
  assert.equal(f.time_add(['2024-02-28', '1']), '2024-02-29', 'a bare number is days for a date; 2024 is a leap year');
  assert.equal(f.time_add(['2026-11-10', '2w']), '2026-11-24');
  assert.equal(f.time_diff(['2026-03-01', '2026-02-01']), '28d');
  assert.equal(f.weekday(['2026-11-10']), 'tuesday');
  assert.equal(f.weekday(['2026-02-30']), undefined, 'not a real date');
  assert.equal(f.time_add(['noon', '5min']), undefined);
});

test('comparison is by value for numbers, clock times and dates', () => {
  const f = builtins;
  assert.equal(f.eq(['5', '5.0']), true);
  assert.equal(f.neq(['5', '5.0']), false);
  assert.equal(f.eq(['5kg', '5']), false, 'a quantity is not a bare number');
  assert.equal(f.eq(['9:05', '09:05']), true);
  assert.equal(f.eq(['red', 'red']), true);
  assert.equal(f.lt(['10:00', '14:30']), true);
  assert.equal(f.lt(['9:05', '10:00']), true);
  assert.equal(f.gt(['2026-11-10', '2026-02-28']), true);
  assert.equal(f.lte(['abc', 'abd']), true, 'other values compare as text');
});

test('kinds: clock, date, datetime and duration are checked', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=shift key=starts kind=time.clock
    @k2 core.slot of=shift key=day kind=time.date
    @k3 core.slot of=shift key=logged kind=time.datetime
    @k4 core.slot of=shift key=length kind=time.duration
    @k5 core.slot of=shift key=season kind=time.season
  `);
  assert.ok(w.tell('@s1 shift starts=9:05 day=2026-11-10 logged=2026-11-10T09:05:00Z length=8h season=autumn').ok);
  const why = (text) => w.tell(text).violations.map((v) => `${v.key}: ${v.why}`);
  assert.deepEqual(why('@s2 shift starts=25:00'), ['starts: must be time.clock']);
  assert.deepEqual(why('@s2 shift day=2026-02-30'), ['day: must be time.date']);
  assert.deepEqual(why('@s2 shift logged=yesterday'), ['logged: must be time.datetime']);
  assert.deepEqual(why('@s2 shift length=8kg'), ['length: must be time.duration']);
  assert.deepEqual(w.schema('shift').unknownKinds, [], 'time.season is a time kind the library does not look into');
});

test('aggregates: looking only at changed groups gives the same world as evaluating everything', () => {
  const canon = (w) => w.toSOP().split('\n').sort().join('\n');
  const facts = [];
  const step = world();
  let x = 11;
  const rnd = (n) => { x = (x * 1103515245 + 12345) % 2147483648; return (x >> 9) % n; }; // the low bits of this generator repeat
  for (let i = 0; i < 12; i++) facts.push(`@o${i} order customer=c${i % 3}`);
  for (let i = 0; i < 60; i++) facts.push(`@l${i} line of=$o${rnd(12)} item=i${rnd(5)} amount=${1 + rnd(20)}`);
  for (const f of facts) assert.ok(step.tell(f).ok);
  const gone = new Set();
  for (let i = 0; i < 15; i++) { const id = `l${rnd(60)}`; if (!gone.has(id)) { gone.add(id); assert.ok(step.retract(id).ok); } }
  for (let i = 0; i < 10; i++) { const id = `l${rnd(60)}`; if (!gone.has(id)) assert.ok(step.replace(id, `@${id} line of=$o${rnd(12)} item=i9 amount=${rnd(50)}`).ok); }
  // the reference: the same facts first, the matrix afterwards, which evaluates every rule in full
  const full = new World();
  full.load(step.toSOP({ derived: false }));
  full.load(orders);
  assert.equal(canon(full), canon(step));
  const withLines = new Set(step.ofType('line').map((l) => l.attrs.of[0]));
  assert.equal(step.ofType('summary').length, withLines.size);
  assert.ok(withLines.size >= 8, `${withLines.size} orders have lines`);
});

test('aggregates: a deny over a group is also checked when a wire leaves the group', () => {
  const w = new World();
  w.load(`
    ?t team name=?n status=active
    ?m member of=?n
    @c core.calc out=?k fn=count over=$m
    @few core.check fn=lt args=?k args=2
    @d core.deny when=$t with=$c if=$few why="an active team needs two members"
  `);
  w.load('@m1 member of=red  @m2 member of=red  @m3 member of=blue  @t1 team name=red status=active');
  assert.equal(w.tell('@t2 team name=blue status=active').violations[0].why, 'an active team needs two members');
  assert.equal(w.retract('m1').violations[0].why, 'an active team needs two members');
  assert.ok(w.has('m1'));
  w.load('@m4 member of=red');
  assert.ok(w.retract('m1').ok, 'three members: one may leave');
});
