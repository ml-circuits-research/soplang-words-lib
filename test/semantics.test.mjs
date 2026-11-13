// Statements of docs/semantics.md that no other test checked. Each test is named in the
// statement it belongs to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const CITY = '@k core.slot of=city key=name id=true\n@k2 core.slot of=city key=pop kind=integer';

test('semantics: facts that agree on every identity key are one wire, whatever their ids', () => {
  const w = new World();
  w.load(CITY);
  w.tell('@a city name=rome');
  const r = w.tell('@b city name=rome pop=3');
  assert.deepEqual([r.ok, r.merged, r.added], [true, [{ id: 'b', into: 'a' }], []]);
  assert.equal(w.ofType('city').length, 1);
  assert.equal(w.resolve('b'), 'a');                       // the second id is a name of the first wire
  assert.deepEqual(w.get('a').attrs.pop, ['3']);           // and what it added is on that wire
  const c = w.tell('@c city name=rome pop=4');             // a different value for a single-valued key
  assert.deepEqual([c.ok, c.violations[0].kind, c.violations[0].have, c.violations[0].want], [false, 'conflict', '3', '4']);
  assert.equal(w.tell('@a city name=rome').ok, true);      // the same statement again: nothing new, accepted
  assert.equal(w.tell('@a city name=milan').violations[0].kind, 'duplicate-id'); // the same id for another wire
  assert.equal(w.tell('@d city name=oslo').added[0], 'd'); // another identity: another wire
});

test('semantics: an accepted change leaves a world that passes check(); a refused one leaves the world as it was', () => {
  const w = new World();
  w.load(`${CITY}
    @c city name=?n pop=?p
    @big core.check fn=gt args=?p args=100
    @no core.deny when=$c if=$big why="?n is too big"
    @m mark for=$c
    @r core.rule when=$c then=$m`);
  const changes = [
    (x) => x.tell('@a city name=rome pop=3'),
    (x) => x.tell('@b city name=oslo pop=500'),            // refused: deny
    (x) => x.fill('a', 'pop', 4),                          // refused: conflict
    (x) => x.tell('@b city name=oslo'),
    (x) => x.fill('b', 'pop', 'many'),                     // refused: domain
    (x) => x.applyPatch({ wires: '@e city name=bern', fills: [{ id: 'e', key: 'pop', value: 900 }] }), // refused as a whole
    (x) => x.revise('a', 'pop', 9),
    (x) => x.retract('b'),
    (x) => x.retract('nobody'),                            // refused: unknown wire
  ];
  let refused = 0;
  for (const change of changes) {
    const before = [w.toSOP({ derived: true }), w.stamp, w.log.length];
    const r = change(w);
    if (r.ok) {
      assert.deepEqual(w.check().violations, []);
    } else {
      refused++;
      assert.ok(r.violations.length > 0);
      assert.deepEqual([w.toSOP({ derived: true }), w.stamp, w.log.length], before);
    }
  }
  assert.equal(refused, 5);
  assert.equal(w.ofType('mark').length, 1);                // one city left, one conclusion
});

test('semantics: check(patch) changes nothing; applyPatch gives the world a fork that applied it has', () => {
  const w = new World();
  w.load(CITY);
  w.tell('@a city name=rome');
  const patch = { wires: '@d city name=oslo', fills: [{ id: 'a', key: 'pop', value: 7 }] };
  const before = [w.toSOP({ derived: true }), w.log.length];
  const verdict = w.check(patch);
  assert.equal(verdict.ok, true);
  assert.deepEqual([w.toSOP({ derived: true }), w.log.length], before);
  const fork = w.fork();
  fork.applyPatch(patch);
  const d = w.diff(fork);
  assert.deepEqual([d.same, d.added.map((x) => x.id), d.changed.map((x) => [x.id, x.key, x.to])], [false, ['d'], [['a', 'pop', '7']]]);
  assert.deepEqual(w.applyPatch(patch).added, verdict.added);  // what check announced is what happens
  assert.equal(w.diff(fork).same, true);
  const rebuilt = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.equal(w.diff(rebuilt).same, true);                     // and the log rebuilds the same world
});

test('semantics: a subtype fact and a supertype fact with one identity are one wire of the subtype, in either order', () => {
  const mk = () => { const w = new World(); w.load('@animal core.type\n@bird core.type extends=animal\n@fish core.type extends=animal\n@k core.slot of=animal key=name id=true'); return w; };
  const shape = (w) => [...w.wires.values()].filter((x) => !x.id.startsWith('_')).map((x) => `${x.type}:${x.attrs.name}:${[x.attrs.wings, x.attrs.legs].flat().filter(Boolean).join(',')}`).sort();
  const a = mk(); a.tell('@b1 bird name=tweety wings=2'); a.tell('@a1 animal name=tweety legs=2');
  const b = mk(); b.tell('@a1 animal name=tweety legs=2'); b.tell('@b1 bird name=tweety wings=2');
  const c = mk(); c.tell('@a1 animal name=tweety legs=2  @b1 bird name=tweety wings=2');
  assert.deepEqual(shape(a), ['bird:tweety:2,2']);
  assert.deepEqual(shape(b), shape(a));
  assert.deepEqual(shape(c), shape(a));
  assert.deepEqual([b.resolve('b1'), b.ofType('bird').length, b.ofType('animal').length], ['a1', 1, 1]);
  // undone, the supertype wire is what it was
  b.undo();
  assert.deepEqual([b.get('a1').type, b.has('b1')], ['animal', false]);
  // siblings stay apart
  const s = mk(); s.tell('@b1 bird name=nemo'); s.tell('@f1 fish name=nemo');
  assert.equal(s.ofType('animal').length, 2);
});
