// Cost of aggregates kept up to date: node tools/bench-aggregate.mjs
import { World } from '../src/index.mjs';
import { orders } from '../examples/orders.mjs';
for (const n of [100, 400, 1000]) {
  const w = new World();
  w.load(orders);
  const t = performance.now();
  for (let i = 0; i < n; i++) {
    w.tell(`@o${i} order customer=c${i % 20}`);
    for (let j = 0; j < 4; j++) w.tell(`@l${i}_${j} line of=$o${i} item=i${j} amount=${1 + ((i * 7 + j) % 9)}`);
  }
  const ms = performance.now() - t;
  console.log(`${n} orders with 4 lines each, ${n * 5} tells`.padEnd(48), `${ms.toFixed(0).padStart(6)} ms`, `${(ms / (n * 5)).toFixed(2)} ms per tell`, `${w.ofType('summary').length} summaries`);
}
