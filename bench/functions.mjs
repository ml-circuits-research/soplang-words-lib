// Round 15: calcs over a host function, declared pure (results kept for a step) or not
// declared (called as before). 1,000 pairs told at once, each with two calcs on the same
// arguments. `node bench/functions.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const rules = `
  @p pair a=?a b=?b
  @c1 core.calc out=?d fn=distance args=?a args=?b
  @c2 core.calc out=?e fn=distance args=?a args=?b
  @t pair core.on=$p d=?d e=?e
  @r core.rule when=$p with=$c1 with=$c2 then=$t`;
const decl = `@f core.function name=distance out.kind=number pure=true
  @f.a core.function.arg of=$f name=a kind=number
  @f.b core.function.arg of=$f name=b kind=number`;
const facts = Array.from({ length: 1000 }, (_, i) => `@x${i} pair a=${i} b=${i * 2}`).join('\n');
for (const declared of [false, true, false, true]) {
  let calls = 0;
  const w = new World({ fns: { distance: ([a, b]) => { calls++; return String(Math.abs(a - b)); } } });
  w.load(declared ? decl + rules : rules);
  const ms = time(() => w.tell(facts));
  console.log(`${declared ? 'declared pure' : 'not declared '}: 1,000 pairs ${ms.toFixed(1)} ms, ${calls} calls`);
}
