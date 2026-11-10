// Composition: matrices are modules in a library, loaded with core.use. Their wires get
// the module name as an id prefix; a bridge rule connects one module's types to another's.
import { World } from '../src/index.mjs';
import { library } from './worlds.mjs';

const w = new World({ library });
w.tell('@u1 core.use world=garden  @u2 core.use world=geo');
w.tell('@pl1 place name=lawn in=north  @pl2 place name=street in=south');

console.log('forecast: rain in the north');
w.tell('@f1 forecast region=north kind=rain');
console.log('slippery:', w.ask('?s slippery place=?p').map((x) => x.p));
const [s] = w.ask('?s slippery place=lawn');
const chain = [];
for (let n = w.explain(s.s); n; n = n.from?.[0]) chain.push(n.via || 'told');
console.log('derivation across modules:', chain.join(' <- '));
