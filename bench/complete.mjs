// P1: complete() and next() in a world where nothing can be filled, and in one where
// something can. `node bench/complete.mjs` (add `bundle` to measure docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const ms = (fn, n = 200) => { for (let i = 0; i < 20; i++) fn(); const t = process.hrtime.bigint(); for (let i = 0; i < n; i++) fn(); return Number(process.hrtime.bigint() - t) / 1e6 / n; };

// about 300 wires; slots that validate but offer nothing to fill (no default, no domain)
const matrix = `
  @k1 core.slot of=person key=name id=true
  @k2 core.slot of=person key=age kind=integer
  @k3 core.slot of=visit key=who type=person required=true
  @k4 core.slot of=visit key=note kind=string
  @v visit who=$p
  @p person name=?n
  @seen person core.on=$p visited=yes
  @r core.rule when=$v when=$p then=$seen
`;
const facts = lines(150, (i) => `@p${i} person name=n${i} age=${20 + (i % 50)}\n@v${i} visit who=$p${i}`);
const w = new World();
w.load(matrix);
w.load(facts);
const plain = ms(() => w.complete());
const unchanged = plain;
const next = ms(() => w.next());
const withReview = ms(() => w.next({ review: true }));
let i = 0;
const afterTell = ms(() => { w.tell(`@x${i++} person name=x${i}`); w.complete(); }, 100);
const tellOnly = (() => { const v = new World(); v.load(matrix); v.load(facts); let j = 0; return ms(() => v.tell(`@y${j++} person name=y${j}`), 100); })();
const can = typeof w.canComplete === 'function' ? ms(() => w.canComplete()) : NaN;

// a world where defaults can be filled: the loop must still do its work
const d = new World();
d.load(`${matrix}\n@k5 core.slot of=visit key=mood enum=calm enum=busy default=calm`);
d.load(facts);
const t0 = process.hrtime.bigint();
const filled = d.complete({ defaults: true }).filled.length;
const fillMs = Number(process.hrtime.bigint() - t0) / 1e6;

console.log(`wires ${w.wires.size}`);
console.log(`complete(), nothing changed      ${unchanged.toFixed(4)} ms`);
console.log(`next()                           ${next.toFixed(4)} ms`);
console.log(`next({ review: true })           ${withReview.toFixed(4)} ms`);
console.log(`tell + complete()                ${afterTell.toFixed(4)} ms   (tell alone ${tellOnly.toFixed(4)} ms)`);
console.log(`canComplete()                    ${Number.isNaN(can) ? 'absent' : can.toFixed(4) + ' ms'}`);
console.log(`complete({ defaults }) filling ${filled} defaults: ${fillMs.toFixed(1)} ms`);
