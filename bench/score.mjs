// Round 8: world.score(candidates). A shop of 300 items and 40 people; candidate readings mix
// statements with a described referent (some ambiguous), actions and questions. Nothing is told.
// `node bench/score.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const w = new World();
w.load(`
  @k1 core.slot of=item key=name id=true
  @k2 core.slot of=order key=item kind=ref to=item required=true
  @k3 core.slot of=order key=qty kind=integer min=1 default=1
  @k5 core.slot of=meeting key=with type=person required=true
  @k4 core.slot of=meeting key=day enum=mon enum=tue enum=wed required=true
  @m meeting with=$busy day=?d
  @busy person name=?n off=?d
  @x core.deny when=$m when=$busy why="?n is off on ?d"
  @a core.action name=reserve param=item when=$it if=$left set=$r
  @it item name=?item stock=?s
  @left core.check fn=gt args=?s args=0 why="?item is out of stock"
  @r item core.on=$it reserved=yes
`);
w.tell(lines(300, (i) => `@i${i} item name=n${i} stock=${i % 7}`));
w.tell(lines(40, (i) => `@p${i} person name=q${i % 20}${i % 3 ? '' : ' off=mon'}`));
const kinds = [
  (i) => ({ wires: '@o order item=$it qty=2', refer: { it: { type: 'item', where: { name: `n${i % 300}` } } } }),
  (i) => ({ wires: '@m meeting with=$who day=mon', refer: { who: { type: 'person', where: { name: `q${i % 20}` } } } }),
  (i) => ({ action: 'reserve', args: { item: `n${i % 300}` } }),
  (i) => ({ question: { type: 'item', where: { name: `n${i % 300}` }, seek: 'stock' } }),
];
const cands = (n) => Array.from({ length: n }, (_, i) => kinds[i % 4](i));
for (const n of [1, 10, 100]) {
  const cs = cands(n);
  w.score(cs);
  const ts = Array.from({ length: 15 }, () => time(() => w.score(cs)));
  const m = med(ts);
  console.log(`${String(n).padStart(3)} candidates: ${m.toFixed(2)} ms (${(m / n).toFixed(3)} ms a candidate)`);
}
// R12.2: readings of an action the matrix does not declare, judged by the fallback
w.load('@k8 core.slot of=line key=qty kind=integer min=1');
for (const n of [1, 10, 100]) {
  const cs = Array.from({ length: n }, (_, i) => ({ action: 'buy', args: { item: `$i${i % 300}`, qty: String(1 + (i % 5)) }, of: 'line' }));
  w.score(cs);
  const m = med(Array.from({ length: 15 }, () => time(() => w.score(cs))));
  console.log(`${String(n).padStart(3)} undeclared-action readings (fallback): ${m.toFixed(2)} ms (${(m / n).toFixed(3)} ms a reading)`);
}
