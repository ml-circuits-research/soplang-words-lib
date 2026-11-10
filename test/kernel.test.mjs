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
  const ready = () => w.ask('?r ready step=?s').map((x) => x.s);
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
  assert.ok(w.schema.has('garden.rain_wets') && w.schema.has('geo.rain_over_region'));
  w.load('@pl1 place name=lawn in=north  @pl2 place name=street in=south  @f1 forecast region=north kind=rain');
  assert.deepEqual(w.ask('?s slippery place=?p').map((x) => x.p), ['lawn']);
  assert.ok(w.use('garden').ok, 'using a module twice is harmless');
  assert.equal(w.tell('@u9 core.use world=nowhere').violations[0].kind, 'schema');
  // abduction works across modules
  assert.deepEqual(w.abduce('?s slippery place=street').map((e) => e.assume[0].type).sort(), ['rain', 'sprinkler']);
});

test('persistence: a world is rebuilt from its JSON snapshot', () => {
  const w = new World({ library });
  w.load('@u1 core.use world=garden');
  w.load('@r1 rain place=lawn  @r2 rain place=street');
  w.retract('r2');
  const copy = World.fromJSON(JSON.parse(JSON.stringify(w)), { library });
  assert.equal(canon(copy), canon(w));
  assert.ok(copy.holds('?s slippery place=lawn'));
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
  assert.throws(() => w.load('?p a k=$typo\n@t b k=1\n@r core.rule when=$p then=$t'), /unknown wire \$typo/);
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
  assert.deepEqual(g.abduce('?g wet place=lawn').map((e) => e.assume[0].type), ['sprinkler', 'rain']);
});

// ------------------------------------------------------------------ abduction on open keys

test('abduction: the value of an open key can be the explanation', () => {
  const w = new World();
  w.load(clinic);
  w.load('@ion patient name=ion');
  assert.deepEqual(w.abduce('?s symptom of=$ion kind=cough').map((e) => e.text).sort(), ['ion.condition=allergy', 'ion.condition=flu']);
  const both = w.abduce('?a symptom of=$ion kind=cough  ?b symptom of=$ion kind=fever');
  assert.deepEqual(both.map((e) => e.fills), [[{ id: 'ion', key: 'condition', value: 'flu' }]]);
  assert.equal(w.get('ion').attrs.condition, undefined);

  w.fill('ion', 'season', 'winter');
  assert.deepEqual(w.abduce('?s symptom of=$ion kind=cough').map((e) => e.text), ['ion.condition=flu']);
  assert.ok(adopt(w, w.abduce('?s symptom of=$ion kind=cough')[0]).ok);
  assert.deepEqual(w.ask('?s symptom of=$ion kind=?k').map((x) => x.k).sort(), ['cough', 'fever']);
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
  assert.equal(w.ask('?t total amount=?a')[0].a, '100');
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
  assert.equal(JSON.parse(cli('ask', matrix, facts, '--query', '?a acceleration magnitude=?v', '--json')).matches[0].v, '5');
  assert.throws(() => cli('check', matrix, bad), (e) => e.status === 1 && /mass must be positive/.test(e.stdout));
});
