// R25: the declared pipeline (turnFlow over std.turn) against the coded one (turn), on the
// same 30 requests (test/flow.test.mjs), steps counted by the library and time.
// `node bench/flow.mjs`
const { World, turn, turnFlow } = await import('../src/index.mjs');
const { seating, face } = await import('../examples/acts.mjs');
const make = () => { const w = new World(); w.load(['@acts core.use world=std.acts', '@t core.use world=std.turn', seating, face].join('\n')); return w; };
const R = (action, args) => ({ action, args });
const reqs = [];
for (let i = 0; i < 30; i++) reqs.push(i % 3 === 0 ? [R('make', { kind: 'seat' })] : i % 3 === 1 ? [R('change', { thing: 'seat', set: 'each', attr: 'colour', value: i % 2 ? 'red' : 'blue' })] : [R('change', { thing: 'seat1', attr: 'size', value: 3 }), R('make', { kind: 'guest', name: `g${i}` })]);
for (const [name, f] of [['turn (coded)', turn], ['turnFlow (declared)', turnFlow], ['turn (coded)', turn], ['turnFlow (declared)', turnFlow]]) {
  const w = make();
  let steps = 0;
  const t = process.hrtime.bigint();
  for (const r of reqs) { f(w, r); steps += w.stats().steps; }
  console.log(`${name.padEnd(20)} 30 requests: ${(Number(process.hrtime.bigint() - t) / 1e6).toFixed(1)} ms; steps of the last call each, summed: ${steps}`);
}
