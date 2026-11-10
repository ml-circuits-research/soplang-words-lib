import { World } from '../src/index.mjs';
import { orders } from '../examples/orders.mjs';
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const w = new World(); w.load(orders);
w.load(lines(100, (o) => `@o${o} order customer=c${o}\n` + lines(19, (i) => `@l${o}_${i} line of=$o${o} item=i${i} amount=${i + 1}`)));
const ms = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
for (let i = 0; i < 50; i++) { const f = w.fork(); f.tell(`@warm${i} order customer=w`); }
const forks = [], writes = [], seconds = [], replays = [];
for (let i = 0; i < 101; i++) { let f; forks.push(ms(() => { f = w.fork(); })); writes.push(ms(() => f.tell(`@x${i} order customer=x`))); seconds.push(ms(() => f.tell(`@y${i} order customer=y`))); }
for (let i = 0; i < 11; i++) replays.push(ms(() => World.fromJSON(w.toJSON())));
console.log('wires', w.wires.size, '| fork median ms', med(forks).toFixed(4), 'max', Math.max(...forks).toFixed(3), '| first write median ms', med(writes).toFixed(3), '| second write median ms', med(seconds).toFixed(3), '| replay (fromJSON) median ms', med(replays).toFixed(1));
