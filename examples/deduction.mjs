import { World } from '../src/index.mjs';
import { mechanics, family } from './worlds.mjs';

console.log('== Deduction: mechanics ==');
const w = new World();
w.load(mechanics);

// a1 has no magnitude: an open key. The world fills it.
const r = w.tell(`
@b1 body mass=2
@f1 force on=$b1 magnitude=10
@a1 acceleration of=$b1
`);
console.log('filled:', r.filled);
console.log(w.toSOP());
console.log('why a1?', JSON.stringify(w.explain('a1'), null, 1));

// states the world refuses
console.log('mass=0      ->', w.tell('@b2 body mass=0').violations);
console.log('a=7 for b1  ->', w.tell('@a9 acceleration of=$b1 magnitude=7').violations);

console.log('\n== Deduction: family (recursive rule) ==');
const f = new World();
f.load(family);
f.tell(`
@e1 parent of=ana child=bogdan
@e2 parent of=bogdan child=carla
@e3 parent of=carla child=dan
`);
console.log('ancestors of dan:', f.ask('?a ancestor of=?who desc=dan').map((x) => x.who));
console.log('carla parent of ana ->', f.tell('@e4 parent of=carla child=ana').violations.map((v) => v.why));

// retract a fact: everything derived from it goes too
f.retract('e2');
console.log('after retracting e2:', f.ask('?a ancestor of=?who desc=dan').map((x) => x.who));
