// R19: std.focus over a long dialogue: n turns told one at a time, then one more. `node bench/focus.mjs`
import { makeWorld } from '../examples/focus.mjs';
for (const n of [100, 200, 400]) {
  const w = makeWorld(); const t0 = performance.now();
  for (let i = 0; i < n; i++) w.tell(i % 3 ? `@q${i} draw.request colour=c${i}` : `@q${i} draw.request action=draw thing=t${i}`);
  const t1 = performance.now(); w.tell(`@z draw.request colour=last`); const t2 = performance.now();
  console.log(n, (t1-t0).toFixed(0)+' ms', 'one more '+(t2-t1).toFixed(1)+' ms', w.size ?? '');
}
