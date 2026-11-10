// A standard operating procedure as a world: what is ready next is derived,
// doing a step out of order is refused, undoing a step moves the procedure back.
import { World } from '../src/index.mjs';
import { procedure } from './worlds.mjs';

const w = new World();
w.load(procedure);
w.tell(`
@mix  step name=mix first=true
@bake step name=bake after=$mix
@cool step name=cool after=$bake
`);
const ready = () => w.ask('@r ready step=?s').map((x) => x.s);

console.log('ready:', ready());
console.log('skip to cool ->', w.tell('@d9 done step=$cool').violations.map((v) => v.why));
w.tell('@d1 done step=$mix');
console.log('mix done, ready:', ready());
w.tell('@d2 done step=$bake');
console.log('bake done, ready:', ready());
w.retract('d2');
console.log('bake undone, ready:', ready());
