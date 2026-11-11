import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { World, format, adopt, induce } from '../tools/lib-under-test.mjs';
import { mechanics, family, garden, meetings, clinic, plant, procedure, library } from '../examples/worlds.mjs';

// state without ids of told order: sorted wires, derived ids are stable hashes
const canon = (w) => w.toSOP().split('\n').sort().join('\n');

// ------------------------------------------------------------------ incremental retraction

const scenarios = {
  family: [family, [
    '@e1 parent of=ana child=bogdan', '@e2 parent of=bogdan child=carla', '@e3 parent of=carla child=dan',
    '@e4 parent of=ana child=emil', '@n1 remark about=$e2 text="check"', '@n2 remark about=$n1',
  ]],
  mechanics: [mechanics, [
    '@b1 body mass=2', '@a1 acceleration of=$b1', '@f1 force on=$b1 magnitude=10', '@b2 body mass=5', '@f2 force on=$b2 magnitude=10',
  ]],
  garden: [garden, [
    '@r1 rain place=lawn', '@s1 sprinkler place=lawn', '@r2 rain place=street',
  ]],
  procedure: [procedure, [
    '@mix step name=mix first=true', '@bake step name=bake after=$mix', '@cool step name=cool after=$bake',
    '@d1 done step=$mix', '@d2 done step=$bake',
  ]],
  plant: [plant, [
    '@t1 tank capacity=100', '@t2 tank capacity=50', '@r1 reading of=$t1 level=95', '@r2 reading of=$t2 level=49',
  ]],
};

for (const [name, [matrix, facts]] of Object.entries(scenarios)) {
  test(`retract: incremental result equals a rebuild from scratch (${name})`, () => {
    const ids = facts.map((f) => f.match(/^@(\S+)/)[1]);
    for (const id of ids) {
      const a = new World();
      a.load(matrix);
      for (const f of facts) a.load(f);
      const ra = a.retract(id);

      const b = new World();
      b.load(matrix);
      for (const f of facts) b.load(f);
      const rb = b._retractByReplay(id);

      assert.equal(ra.ok, rb.ok, `${id}: ok`);
      if (!ra.ok) continue;
      assert.equal(canon(a), canon(b), `${id}: state`);
      assert.deepEqual([...ra.removed].sort(), [...rb.removed].sort(), `${id}: removed`);
      // and the incremental world keeps working: its log rebuilds the same state
      assert.equal(canon(World.fromJSON(a.toJSON())), canon(a), `${id}: log`);
      assert.equal(a._tx, 0);
      assert.equal(a._journal.length, 0);
    }
  });
}

test('retract: a wire with a second derivation survives', () => {
  const w = new World();
  w.load(garden);
  w.load('@r1 rain place=lawn  @s1 sprinkler place=lawn');
  assert.equal(w.ofType('wet').length, 1);
  w.retract('r1');
  assert.equal(w.ofType('wet').length, 1, 'still wet: the sprinkler explains it');
  assert.equal(w.explain(w.ofType('wet')[0].id).via, 'sprinkler_wets');
  w.retract('s1');
  assert.equal(w.ofType('wet').length, 0);
  assert.equal(w.ofType('slippery').length, 0);
});

test('retract: refused when it would break the world, and nothing changes', () => {
  const w = new World();
  w.load(procedure);
  w.load('@mix step name=mix first=true  @bake step name=bake after=$mix  @d1 done step=$mix  @d2 done step=$bake');
  const before = canon(w);
  const r = w.retract('d1'); // bake would be done without mix
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].why, 'the previous step is not done');
  assert.equal(canon(w), before);
  assert.equal(w.retract('nope').violations[0].kind, 'unknown-wire');
  assert.equal(w.retract(w.ofType('ready')[0]?.id || '_x').ok, false, 'derived wires cannot be retracted');
});

test('replace: a state change is one transaction', () => {
  const w = new World();
  w.load(plant);
  w.load('@t1 tank capacity=100  @r1 reading of=$t1 level=95');
  assert.equal(w.ofType('alarm').length, 1);
  assert.ok(w.replace('r1', '@r1 reading of=$t1 level=40').ok);
  assert.equal(w.ofType('alarm').length, 0);
  const before = canon(w);
  const r = w.replace('r1', '@r1 reading of=$t1 level=120');
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].why, 'level above capacity: sensor fault');
  assert.equal(canon(w), before, 'the old reading is back');
  assert.equal(w.get('r1').attrs.level[0], '40');
});

// ------------------------------------------------------------------ negation is maintained

test('negation: a conclusion is withdrawn when the absence it relied on ends', () => {
  const w = new World();
  w.load(procedure);
  w.load('@mix step name=mix first=true  @bake step name=bake after=$mix  @cool step name=cool after=$bake');
  const ready = () => w.ask('@r ready step=?s').map((x) => x.s);
  assert.deepEqual(ready(), ['$mix']);
  w.load('@d1 done step=$mix');
  assert.deepEqual(ready(), ['$bake']);
  assert.equal(w.tell('@d9 done step=$cool').ok, false);
  w.load('@d2 done step=$bake');
  assert.deepEqual(ready(), ['$cool']);
  w.retract('d2');
  assert.deepEqual(ready(), ['$bake']);
});

// ------------------------------------------------------------------ composition, persistence, events

test('composition: modules from a library, prefixed ids, a bridge rule between them', () => {
  const w = new World({ library });
  w.load('@u1 core.use world=garden  @u2 core.use world=geo');
  assert.ok(w.matrix.has('garden.rain_wets') && w.matrix.has('geo.rain_over_region'));
  w.load('@pl1 place name=lawn in=north  @pl2 place name=street in=south  @f1 forecast region=north kind=rain');
  assert.deepEqual(w.ask('@s slippery place=?p').map((x) => x.p), ['lawn']);
  assert.ok(w.use('garden').ok, 'using a module twice is harmless');
  assert.equal(w.tell('@u9 core.use world=nowhere').violations[0].kind, 'schema');
  // abduction works across modules
  assert.deepEqual(w.abduce('@s slippery place=street').map((e) => e.assume[0].type).sort(), ['rain', 'sprinkler']);
});

test('persistence: a world is rebuilt from its JSON snapshot', () => {
  const w = new World({ library });
  w.load('@u1 core.use world=garden');
  w.load('@r1 rain place=lawn  @r2 rain place=street');
  w.retract('r2');
  const copy = World.fromJSON(JSON.parse(JSON.stringify(w)), { library });
  assert.equal(canon(copy), canon(w));
  assert.ok(copy.holds('@s slippery place=lawn'));
  assert.throws(() => World.fromJSON({}), /not a sopworld snapshot/);
  const f = w.fork();
  f.load('@r3 rain place=roof');
  assert.equal(w.has('r3'), false);
});

test('events: listeners receive committed changes only', () => {
  const w = new World();
  w.load(mechanics);
  const seen = [];
  const off = w.on((events) => seen.push(...events.map((e) => e.op)));
  w.tell('@b1 body mass=0');                       // refused
  w.tell('@b1 body mass=2', { dry: true });        // dry
  assert.deepEqual(seen, []);
  w.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10');
  assert.deepEqual(seen, ['tell', 'tell', 'derive']);
  off();
  w.tell('@b2 body mass=3');
  assert.equal(seen.length, 3);
});

test('load throws on refusal; toSOP is in order of arrival', () => {
  const w = new World();
  assert.throws(() => w.load('@p a k=$typo\n@t b k=1\n@r core.rule when=$p then=$t'), /unknown wire \$typo/);
  w.load('@z thing n=1  @a thing n=2');
  assert.equal(w.toSOP(), '@z thing n=1\n@a thing n=2');
});

// ------------------------------------------------------------------ dialogue helpers

test('step and answer: one call per turn', () => {
  const w = new World();
  w.load(meetings);
  w.load('@m0 meeting room=$big time=10:00 people=8 duration=60');
  const s = w.step('@m1 meeting people=3');
  assert.ok(s.ok);
  assert.deepEqual(s.filled.map((f) => f.key), ['duration']);
  assert.deepEqual(s.questions.map((q) => q.attrs.seek[0]), ['room', 'time']);
  assert.ok(w.answer(s.questions[0], '$small').ok);
  assert.equal(w.get('m1').attrs.room[0], '$small');
  assert.equal(w.step('@m2 meeting people=99').ok, true);
  assert.equal(w.step('@m3 meeting people=99', { strict: true }).ok, false);
  assert.throws(() => w.answer({}, 'x'));
});

test('rank: the caller can reorder suggestions and explanations', () => {
  const rank = (items, ctx) => (ctx.kind === 'value' ? [...items].sort((a, b) => a.value.localeCompare(b.value)) : [...items].reverse());
  const w = new World({ rank });
  w.load(meetings);
  w.load('@m0 meeting room=$big time=14:00 people=8 duration=60  @m1 meeting people=3');
  assert.deepEqual(w.suggest('m1', 'time').map((c) => c.value), ['10:00', '14:00']);
  const g = new World({ rank });
  g.load(garden);
  assert.deepEqual(g.abduce('@g wet place=lawn').map((e) => e.assume[0].type), ['sprinkler', 'rain']);
});

// ------------------------------------------------------------------ abduction on open keys

test('abduction: the value of an open key can be the explanation', () => {
  const w = new World();
  w.load(clinic);
  w.load('@ion patient name=ion');
  assert.deepEqual(w.abduce('@s symptom of=$ion kind=cough').map((e) => e.text).sort(), ['ion.condition=allergy', 'ion.condition=flu']);
  const both = w.abduce('@a symptom of=$ion kind=cough  @b symptom of=$ion kind=fever');
  assert.deepEqual(both.map((e) => e.fills), [[{ id: 'ion', key: 'condition', value: 'flu' }]]);
  assert.equal(w.get('ion').attrs.condition, undefined);

  w.fill('ion', 'season', 'winter');
  assert.deepEqual(w.abduce('@s symptom of=$ion kind=cough').map((e) => e.text), ['ion.condition=flu']);
  assert.ok(adopt(w, w.abduce('@s symptom of=$ion kind=cough')[0]).ok);
  assert.deepEqual(w.ask('@s symptom of=$ion kind=?k').map((x) => x.k).sort(), ['cough', 'fever']);
});

// ------------------------------------------------------------------ induction extensions

test('induction: a computed value becomes a core.calc', () => {
  const r = induce([
    { when: '@l line qty=2 price=10', then: '@t total of=$l amount=20' },
    { when: '@l line qty=3 price=5', then: '@t total of=$l amount=15' },
    { when: '@l line qty=7 price=3', then: '@t total of=$l amount=21' },
  ], { name: 'lt' });
  assert.equal(r.calcs[0].fn, 'mul');
  const w = new World();
  w.load(r.text);
  w.load('@l9 line qty=4 price=25');
  assert.equal(w.ask('@t total amount=?a')[0].a, '100');
});

test('induction: difference and ratio are told apart from sum and product', () => {
  const diff = induce([
    { when: '@a acct balance=100  @w withdrawal from=$a amount=30', then: '@r result of=$a balance=70' },
    { when: '@a acct balance=50  @w withdrawal from=$a amount=5', then: '@r result of=$a balance=45' },
  ], { name: 'wd' });
  assert.equal(diff.calcs[0].fn, 'sub');
  const none = induce([
    { when: '@x in v=1', then: '@y out v=7' },
    { when: '@x in v=2', then: '@y out v=3' },
  ]);
  assert.equal(none.calcs.length, 0, 'no relation: the value stays an open key');
});

test('induction: a deny from examples of forbidden states; tolerant mode skips odd examples', () => {
  const r = induce([
    { when: '@a booking room=r1 slot=9  @b booking room=r1 slot=9' },
    { when: '@a booking room=r7 slot=14  @b booking room=r7 slot=14' },
    { when: '@a booking room=r7 slot=14' },
  ], { name: 'dbl', kind: 'deny', why: 'double booking', tolerant: true });
  assert.deepEqual(r.skipped.map((s) => s.index), [2]);
  assert.equal(r.examples, 2);
  const w = new World();
  w.load(r.text); // "two different wires" is part of what was learned
  assert.ok(w.tell('@b1 booking room=r2 slot=9  @b2 booking room=r2 slot=10').ok);
  assert.equal(w.tell('@b3 booking room=r2 slot=9').violations[0].why, 'double booking');
});

// ------------------------------------------------------------------ command line

test('cli: check, run and ask', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sopworld-'));
  const matrix = join(dir, 'matrix.sop'), facts = join(dir, 'facts.sop'), bad = join(dir, 'bad.sop');
  writeFileSync(matrix, mechanics);
  writeFileSync(facts, '@b1 body mass=2\n@f1 force on=$b1 magnitude=10\n');
  writeFileSync(bad, '@b2 body mass=0\n');
  const cli = (...args) => execFileSync(process.execPath, ['bin/sopworld.mjs', ...args], { encoding: 'utf8' });
  assert.match(cli('check', matrix, facts), /^OK: 3 wires/);
  assert.match(cli('run', matrix, facts, '--provenance'), /acceleration of=\$b1 magnitude=5 core\.via=\$newton2/);
  assert.equal(JSON.parse(cli('ask', matrix, facts, '--query', '@a acceleration magnitude=?v', '--json')).matches[0].v, '5');
  assert.throws(() => cli('check', matrix, bad), (e) => e.status === 1 && /mass must be positive/.test(e.stdout));
});

test('rules: a template with core.on= adds its keys to the wire a pattern matched', () => {
  const w = new World();
  w.load(`
    @l line qty=?q price=?p
    @c core.calc out=?t fn=mul args=?q args=?p
    @f line core.on=$l total=?t
    @r core.rule when=$l with=$c then=$f
  `);
  // two wires that look the same each get their own value; no third wire is made
  w.load('@a line qty=2 price=5  @b line qty=2 price=5  @c1 line qty=3 price=1');
  assert.deepEqual(['a', 'b', 'c1'].map((id) => w.get(id).attrs.total[0]), ['10', '10', '3']);
  assert.equal(w.ofType('line').length, 3);
  assert.equal(w.explain('a').fills[0].via, 'r');
  // the value follows the wire it was computed from
  w.replace('a', '@a line qty=4 price=5');
  assert.equal(w.get('a').attrs.total[0], '20');
  // core.on must name a when= pattern
  assert.throws(() => new World().load('@x item\n@t item core.on=$nope v=1\n@bad core.rule when=$x then=$t'), /nope|core\.on/);
});

test('rules: a rule may aggregate over a type and add a key to a wire of that type', () => {
  // not a cycle: adding `share` wakes no pattern that reads `amount`
  const w = new World();
  w.load(`
    @g group
    @m part of=$g amount=?a
    @c_sum core.calc out=?sum fn=sum over=$m args=?a
    @tot group core.on=$g total=?sum
    @r_tot core.rule when=$g with=$c_sum then=$tot
    @g2 group total=?t
    @m2 part of=$g2 amount=?a2
    @c_share core.calc out=?s fn=div args=?a2 args=?t
    @sh part core.on=$m2 share=?s
    @r_share core.rule when=$g2 when=$m2 with=$c_share then=$sh
  `);
  w.load('@g1 group  @p1 part of=$g1 amount=30  @p2 part of=$g1 amount=10');
  assert.deepEqual([w.get('g1').attrs.total[0], w.get('p1').attrs.share[0], w.get('p2').attrs.share[0]], ['40', '0.75', '0.25']);
  // a template that could make a new wire of the aggregated type is still refused
  const bad = new World().tell(`
    @g group
    @m part of=$g amount=?a
    @c core.calc out=?n fn=count over=$m
    @extra part of=$g amount=?n
    @r core.rule when=$g with=$c then=$extra
  `);
  assert.match(bad.violations[0].why, /not stratified/);
});

test('bookkeeping: a wire told again keeps the bookkeeping of each statement; the sequence key may be declared late', () => {
  const w = new World();
  w.load('@k core.slot of=price key=item id=true\n@f core.fluent of=price key=cost');
  w.load('@list1 price item=kite cost=10 core.source="list"');
  w.load('@s core.sequence key=core.seq'); // declared after the first wire arrived
  const r = w.tell('@said price item=kite cost=4 core.source="dialog" core.seq=7');
  assert.deepEqual([r.ok, r.merged], [true, [{ id: 'said', into: 'list1' }]]);
  assert.deepEqual(w.get('list1').attrs['core.source'], ['"list"', '"dialog"'], 'no conflict on a key that no slot declares');
  assert.equal(w.get('list1').attrs.cost[0], '4', 'the later statement holds');
  assert.equal(w.tell('@x thing a=1  @y thing a=2').ok, true);
  // a declared key still conflicts
  w.load('@k2 core.slot of=price key=core.owner');
  w.load('@p2 price item=ball cost=1 core.owner=ana');
  assert.equal(w.tell('@p3 price item=ball core.owner=bob').violations[0].kind, 'conflict');
});

test('patterns: core.absent= matches only a wire without that key, and is kept up to date', () => {
  const w = new World();
  w.load(`
    @t task core.absent=owner
    @f flag for=$t kind=unassigned
    @r core.rule when=$t then=$f
  `);
  w.load('@t1 task title=a  @t2 task title=b owner=ana');
  assert.deepEqual(w.ofType('flag').map((x) => x.attrs.for[0]), ['$t1']);
  assert.deepEqual(w.ask('@x task core.absent=owner').map((r) => r.x), ['t1']);
  assert.ok(w.fill('t1', 'owner', 'bob').ok);
  assert.equal(w.ofType('flag').length, 0, 'the flag goes when the key is filled');
  assert.ok(w.replace('t2', '@t2 task title=b').ok);
  assert.deepEqual(w.ofType('flag').map((x) => x.attrs.for[0]), ['$t2'], 'and comes when it is taken away');
  // a rule may not fill the key it requires to be absent
  const bad = new World().tell('@t task core.absent=owner\n@d task core.on=$t owner=nobody\n@r core.rule when=$t then=$d');
  assert.match(bad.violations[0].why, /requires to be absent/);
});

test('soft constraints: the change is accepted, the problem stays on record, answers that rest on it say so', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=tank key=name id=true
    @k2 core.slot of=tank key=level kind=number min=0 max=100 soft=true
    @f core.fluent of=tank key=level
    @e core.effect on=drain fluent=$f op=sub amount=amount where.name=tank
    @a pump feeds=$t
    @b pump feeds=$t
    @t tank
    @c core.check fn=neq args=$a args=$b
    @two core.deny when=$a when=$b when=$t if=$c soft=true why="two pumps on one tank"
  `);
  w.load('@t1 tank name=north level=30');
  // a soft bound: the event is accepted, the value is what it is, and an issue stands
  const r = w.tell('@d1 drain tank=north amount=50');
  assert.equal(r.ok, true);
  assert.equal(w.get('t1').attrs.level[0], '-20');
  const issue = w.ofType('core.issue')[0];
  assert.deepEqual([issue.attrs.about, issue.attrs.key, issue.attrs.why], [['$t1'], ['level'], ['"level must be at least 0"']]);
  const q = w.query({ type: 'tank', seek: 'level', where: { name: 'north' } });
  assert.deepEqual([q.status, q.reason, q.issues, q.alternatives[0].value], ['conflicting', 'level must be at least 0', [issue.id], '-20']);
  // it goes when the cause goes
  assert.ok(w.retract('d1').ok);
  assert.deepEqual([w.ofType('core.issue').length, w.query({ about: 't1', seek: 'level' }).status], [0, 'supported']);
  // a soft deny: both pumps are accepted; the issue names the wires
  assert.equal(w.tell('@p1 pump feeds=$t1  @p2 pump feeds=$t1').ok, true);
  const two = w.ofType('core.issue');
  assert.ok(two.length >= 1);
  assert.deepEqual([two[0].attrs.rule, two[0].attrs.why, [...two[0].attrs.about].sort()], [['$two'], ['"two pumps on one tank"'], ['$p1', '$p2', '$t1']]);
  assert.equal(w.query({ about: 't1', seek: 'level' }).status, 'conflicting', 'the tank is one of the wires the issue is about');
  assert.ok(w.retract('p2').ok);
  assert.deepEqual([w.ofType('core.issue').length, w.query({ about: 't1', seek: 'level' }).status], [0, 'supported']);
  // strict is the default: the same bound without soft=true refuses
  const strict = new World();
  strict.load('@k core.slot of=tank key=level kind=number min=0');
  assert.equal(strict.tell('@t tank level=-1').ok, false);
});

test('violations: explainable after the change is undone; a reason may quote the values', () => {
  const w = new World();
  w.load(`
    @pay payment paid=?m for=$it
    @it item price=?t name=?n
    @short core.check fn=lt args=?m args=?t
    @d core.deny when=$pay when=$it if=$short why="?m lei is not enough for ?n, which costs ?t."
    @big item price=?p name=?n2
    @dear core.check fn=gt args=?p args=1000
    @s core.deny when=$big if=$dear soft=true why="?n2 costs ?p: check the price"
  `);
  w.tell('@book item price=12 name=book');
  const r = w.tell('@p1 payment paid=10 for=$book note="in a hurry"');
  assert.equal(r.ok, false);
  const v = r.violations[0];
  assert.equal(v.why, '10 lei is not enough for book, which costs 12.');
  assert.deepEqual(v.bindings, { pay: 'p1', m: '10', it: 'book', t: '12', n: 'book' });
  // p1 is gone from the world, and the violation still says what it was
  assert.equal(w.has('p1'), false);
  assert.deepEqual(v.involved, [
    { id: 'p1', type: 'payment', attrs: { paid: ['10'], for: ['$book'], note: ['"in a hurry"'] } },
    { id: 'book', type: 'item', attrs: { price: ['12'], name: ['book'] } },
  ]);
  // other kinds of refusal carry the wire too
  w.load('@k core.slot of=item key=price kind=number');
  const bad = w.tell('@pen item price=cheap name=pen').violations[0];
  assert.deepEqual([bad.kind, bad.involved], ['domain', [{ id: 'pen', type: 'item', attrs: { price: ['cheap'], name: ['pen'] } }]]);
  // a soft deny writes the filled reason into its issue
  w.tell('@yacht item price=5000 name=yacht');
  assert.equal(w.ofType('core.issue')[0].attrs.why[0], '"yacht costs 5000: check the price"');
  // a variable that is not bound stays as written; text without variables is untouched
  assert.equal(w._say('ask ?nobody about ?m', { vars: ['?m'] }, null).text.startsWith('ask ?nobody'), true);
});

test('violations: a reason writes values through registered filters, and carries the variables as data', () => {
  const ordinal = (n) => `${n}${[, 'st', 'nd', 'rd'][n % 100 >> 3 ^ 1 && n % 10] || 'th'}`; // an English filter, registered by the host
  const words = (n) => ['zero', 'one', 'two', 'three'][n] ?? String(n);
  const w = new World({ filters: { ordinal } });
  w.register('filter', 'words', words);
  w.load(`
    @c chapter n=?n title=?t
    @d chapter n=?n title=?t
    @same core.check fn=neq args=$c args=$d
    @dup core.deny when=$c when=$d if=$same why="the ?n:ordinal chapter is told twice (?t, ?n:words)"
  `);
  w.tell('@c1 chapter n=2 title="Rain"');
  const v = w.tell('@c2 chapter n=2 title="Rain"').violations[0];
  assert.equal(v.why, 'the 2nd chapter is told twice (Rain, two)');
  assert.deepEqual(v.vars, { n: 2, t: 'Rain' }, 'numbers as numbers, strings as their text, no wire ids');
  assert.deepEqual(v.bindings, { c: 'c2', d: 'c1', n: '2', t: '"Rain"' });
  // a filter that is not registered is a mistake in the matrix
  const bad = new World().tell('@p item n=?n\n@x core.deny when=$p why="?n:roman items"');
  assert.match(bad.violations[0].why, /filter "roman", which is not registered/);
  // a colon that is not followed by a name is text, as before
  const t = new World();
  t.load('@p item n=?n\n@x core.deny when=$p why="count ?n: too many"');
  assert.equal(t.tell('@i item n=4').violations[0].why, 'count 4: too many');
});

test('undo passes over transient state (a cursor, a selection); redo tells again what undo took back', () => {
  const w = new World();
  w.load(`
    @t core.type of=cursor transient=true
    @k core.slot of=cursor key=name id=true
    @k2 core.slot of=line key=n id=true
  `);
  w.tell('@l1 line n=1 text="a"');
  w.tell('@cur cursor name=main at=$l1');        // looking around
  w.tell('@l2 line n=2 text="b"');
  w.fill('cur', 'col', 4);                       // moving inside the line: transient
  const u = w.undo();
  assert.deepEqual(u.undone.map((x) => x.ids || x.id), [['l2']], 'the cursor moves are not what undo takes back');
  assert.equal(w.has('l2'), false);
  assert.deepEqual([w.has('cur'), w.get('cur').attrs.col], [true, ['4']], 'and they are kept');
  // redo tells it again
  const r = w.redo();
  assert.deepEqual([r.ok, r.redone.map((x) => x.ids), w.has('l2')], [true, [['l2']], true]);
  assert.equal(w.redo().violations[0].kind, 'nothing-to-redo');
  // undo twice, redo twice
  w.undo(2);
  assert.deepEqual([w.has('l1'), w.has('l2')], [false, false]);
  assert.equal(w.has('cur'), false, 'a transient wire that refers to a line that is gone cannot be told again');
  w.redo(2);
  assert.deepEqual([w.has('l1'), w.has('l2')], [true, true]);
  // a new statement makes the undo final; a transient one does not
  w.undo();
  w.tell('@sel cursor name=selection');
  assert.equal(w.redo().ok, true, 'telling transient state keeps the redo');
  w.undo();
  w.tell('@l3 line n=3 text="c"');
  assert.equal(w.redo().violations[0].kind, 'nothing-to-redo');
});

test('marks: labelled, listed, rewound for one unit only, and saved with the timeline', () => {
  const w = new World();
  w.load('@k core.slot of=note key=n id=true\n@k2 core.slot of=page key=n id=true');
  w.tell('@n1 note n=1 text="a"  @p1 page n=1 title="one"');
  const before = w.mark('before the edit');
  w.tell('@n2 note n=2 text="b"');
  w.applyPatch({ replace: { id: 'p1', attrs: { n: 1, title: 'ONE' } } });
  w.mark('after the edit');
  assert.deepEqual(w.marks().map((m) => m.label), ['before the edit', 'after the edit']);
  // rewind the notes only: the page keeps its new title
  const r = w.rewind(before, { only: 'note' });
  assert.deepEqual([r.ok, r.removed, w.has('n2'), w.get('p1').attrs.title], [true, ['n2'], false, ['ONE']]);
  // by id prefix
  w.tell('@ui.sel cursor at=3');
  w.rewind(before, { only: { prefix: 'ui.' } });
  assert.equal(w.has('ui.sel'), false);
  // a full rewind closes the marks made after it
  w.rewind(before);
  assert.deepEqual([w.get('p1').attrs.title, w.marks().map((m) => m.label)], [['"one"'], ['before the edit']]);
  // the timeline survives a restart: marks, labels, and what redo would tell again
  w.tell('@n3 note n=3 text="c"');
  w.undo();
  const again = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON({ timeline: true }))));
  assert.deepEqual(again.marks().map((m) => m.label), ['before the edit']);
  assert.deepEqual(again.redo().redone.map((x) => x.ids), [['n3']]);
  again.tell('@n4 note n=4');
  again.rewind(again.marks()[0].mark);
  assert.deepEqual([again.has('n4'), again.has('n3'), again.has('n1')], [false, false, true]);
  assert.equal('timeline' in w.toJSON(), false, 'a plain snapshot is as before');
});

test('violations: denies say which reason leads (priority=), and slots give their own reasons with variables', () => {
  const w = new World({ filters: { quoted: (v) => `«${v}»` } });
  w.load(`
    @k1 core.slot of=move key=to enum=a1 enum=a2 enum=b1 why="?value:quoted is not a square of the board"
    @k2 core.slot of=move key=piece type=piece why="?id moves ?value, which is not a piece"
    @m move to=?t
    @busy core.check fn=eq args=?t args=a1
    @general core.deny when=$m if=$busy why="the move is not allowed"
    @specific core.deny when=$m if=$busy why="a1 is occupied" priority=1
  `);
  const r = w.tell('@m1 move to=a1');
  assert.deepEqual(r.violations.map((v) => v.why), ['a1 is occupied', 'the move is not allowed'], 'the lower priority first');
  const s = w.tell('@m2 move to=z9');
  assert.deepEqual([s.violations[0].kind, s.violations[0].why, s.violations[0].vars], ['domain', '«z9» is not a square of the board', { value: 'z9', key: 'to', id: 'm2', type: 'move' }]);
  w.tell('@p1 pawn');
  const t = w.tell('@m3 move to=a2 piece=$p1');
  assert.equal(t.violations[0].why, 'm3 moves $p1, which is not a piece');
  assert.match(new World().tell('@m x\n@d core.deny when=$m why="x" priority=high').violations[0].why, /priority= must be a number/);
});

test('violations: a variable with several values reaches a filter as one list', () => {
  const and = (xs) => (Array.isArray(xs) ? (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : String(xs[0])) : String(xs)); // a host's joiner
  const w = new World({ filters: { list: and } });
  w.load(`
    @b basket owner=?o
    @i item in=$b name=?n
    @all core.calc out=?names fn=collect over=$i args=?n
    @many core.calc out=?c fn=count over=$i
    @big core.check fn=gt args=?c args=2
    @d core.deny when=$b with=$all with=$many if=$big why="?o has too much: ?names:list (plain: ?names)"
  `);
  w.tell('@b1 basket owner=ann  @i1 item in=$b1 name=pen  @i2 item in=$b1 name=ink');
  const v = w.tell('@i3 item in=$b1 name=cap').violations[0];
  assert.equal(v.why, 'ann has too much: pen, ink and cap (plain: pen, ink, cap)');
  assert.deepEqual(v.vars.names, ['pen', 'ink', 'cap']);
});

test('version: the same in a world and a fork just made, unchanged by a statement that adds nothing, new after any change', () => {
  const w = new World();
  w.load('@k core.slot of=a key=n id=true\n@d core.slot of=a key=v default=0');
  w.tell('@x a n=1 v=2  @y a n=2');
  const v = w.version;
  const f = w.fork();
  assert.equal(f.version, v, 'a fork is born with the version of its world');
  w.tell('@x a n=1 v=2');
  assert.equal(w.version, v, 're-telling what the world holds changes nothing');
  assert.equal(w.tell('@z a n=3', { dry: true }).ok, true);
  assert.equal(w.version, v, 'nor does a dry run, nor a refused change');
  w.tell('@bad a n=1 v=9');
  assert.equal(w.version, v);
  const seen = new Set([v]);
  for (const change of [(x) => x.tell('@z a n=3'), (x) => x.fill('y', 'v', 5), (x) => x.revise('y', 'v', 6), (x) => x.retract('z'), (x) => x.undo()]) {
    change(w);
    assert.ok(!seen.has(w.version), 'every change gives a version not seen before');
    seen.add(w.version);
  }
  f.tell('@q a n=9');
  assert.ok(!seen.has(f.version), 'and a fork that changes gets its own');
  // assumptions of some wires only
  w.complete({ defaults: true });
  assert.deepEqual(w.assumptions(['x']), [], 'x was told its v');
  assert.deepEqual(w.assumptions(['y', 'x']).map((a) => [a.id, a.key]), w.assumptions().filter((a) => ['x', 'y'].includes(a.id)).map((a) => [a.id, a.key]));
});
