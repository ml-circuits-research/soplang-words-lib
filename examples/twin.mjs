// A digital twin: the world mirrors a device, derives its alarms, refuses impossible
// states, and reports every committed change to a listener.
import { World, format } from '../src/index.mjs';
import { plant } from './worlds.mjs';

const w = new World();
w.load(plant);
w.tell('@t1 tank capacity=100  @p1 pump of=$t1 state=off  @v1 valve of=$t1 state=open');
w.on((events) => {
  for (const e of events) if (e.op === 'derive' || e.op === 'remove') console.log(`   [event] ${e.op} ${e.wire || e.id}`);
});

console.log('sensor: level 95');
w.tell('@r1 reading of=$t1 level=95');
console.log('alarms:', w.ofType('alarm').map((a) => format(a)));

console.log('sensor: level 40   (the reading is replaced, what rested on it goes)');
w.replace('r1', '@r1 reading of=$t1 level=40');
console.log('alarms:', w.ofType('alarm').map((a) => format(a)));

console.log('sensor: level 120');
console.log('refused:', w.replace('r1', '@r1 reading of=$t1 level=120').violations.map((v) => v.why));
console.log('twin still says:', format(w.get('r1')));

console.log('operator: close the valve, then start the pump');
console.log('valve closed:', w.replace('v1', '@v1 valve of=$t1 state=closed').ok);
console.log('pump on refused:', w.replace('p1', '@p1 pump of=$t1 state=on').violations.map((v) => v.why));

console.log('save and restore the twin');
const copy = World.fromJSON(JSON.parse(JSON.stringify(w)));
console.log('same state:', copy.toSOP() === w.toSOP());
