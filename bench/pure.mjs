// R7.6: what an action costs beyond what it tells. An action that reads no cell and tells
// one wire, against the same tell made directly; in a world of 600 wires.
// `node bench/pure.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const w = new World({ actions: { add: (ctx, { n }) => { ctx.tell(`@x${n} note n=${n}`); return 'ok'; } } });
w.load('@k core.slot of=note key=n id=true\n@a core.action name=add fn=add required=n\n@p para doc=?d\n@t para core.on=$p seen=yes\n@r core.rule when=$p then=$t');
w.load(lines(600, (i) => `@p${i} para doc=d${i % 20}`));
let k = 0;
for (let round = 0; round < 2; round++) {
  const acts = [], tells = [];
  for (let i = 0; i < 301; i++) {
    acts.push(time(() => w.act({ action: 'add', args: { n: k++ } })));
    tells.push(time(() => w.tell(`@x${k} note n=${k++}`)));
  }
  if (round) console.log(`an action that tells one wire ${med(acts).toFixed(4)} ms; the same tell ${med(tells).toFixed(4)} ms; the action's own cost ${(med(acts) - med(tells)).toFixed(4)} ms`);
}
