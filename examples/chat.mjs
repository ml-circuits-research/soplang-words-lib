// Logical autocompletion in a chat: the formaliser (not part of this library) turns each
// user turn into incomplete wires; the world decides what follows, what must be asked,
// what was only assumed, and what is impossible.
import { World, format } from '../src/index.mjs';
import { meetings } from './worlds.mjs';

const w = new World();
w.load(meetings);
w.tell('@m0 meeting room=$big time=10:00 people=8 duration=60 title="Planning"');
const show = (step) => step.filled.map((f) => `${f.key}=${f.value} (${f.kind || 'derived'})`);

console.log('User: "Book a meeting for 9 people."');
w.tell('@m1 meeting people=9');
console.log('open keys:', w.open('m1').map((o) => o.key));
console.log('world completes:', show(w.complete({ defaults: true })));
console.log('m1 is now:', format(w.get('m1')));
console.log('derived:', w.ask('@c confirmation for=$m1').map((x) => format(w.get(x.c))));

console.log('\nUser: "Actually, make it an hour."   (replaces the assumed 30 minutes)');
const rev = w.fill('m1', 'duration', '60');
console.log('accepted:', rev.ok, '| assumption dropped:', rev.revised);

console.log('\nUser: "And another one for 3 people."');
w.tell('@m2 meeting people=3');
let step = w.complete({ defaults: true });
console.log('world completes:', show(step), '<- the big room is taken at both times');
console.log('world asks:');
for (const q of step.questions) console.log('  ', format(q));

console.log('\nUser: "At ten."');
w.fill('m2', 'time', '10:00');
console.log('open keys left:', w.open().length);

console.log('\nUser: "A third one, for 10 people at 14:00."');
const bad = w.tell('@m3 meeting people=10 time=14:00', { strict: true });
console.log('accepted:', bad.ok, '|', bad.violations.map((v) => v.why));

console.log('\nUser: "Make it 20 people in the big room."');
console.log('refused:', w.tell('@m4 meeting people=20 room=$big').violations.map((v) => v.why));
