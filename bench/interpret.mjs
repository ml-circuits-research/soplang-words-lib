// R9.1: world.interpret on a shop of 300 items and 40 people with EN words; then score.
// `node bench/interpret.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const w = new World();
w.load(`
  @k1 core.slot of=item key=name id=true
  @k2 core.slot of=order key=item kind=ref to=item required=true
  @k3 core.slot of=order key=qty kind=integer min=1 default=1
  @k6 core.slot of=person key=name id=true
  @k5 core.slot of=meeting key=with type=person required=true
  @k4 core.slot of=meeting key=day enum=mon enum=tue enum=wed required=true
  @a core.action name=reserve param=item when=$it set=$r
  @it item name=?item stock=?s
  @r item core.on=$it reserved=yes
`);
w.tell(lines(300, (i) => `@i${i} item name=n${i} stock=${i % 7}`));
w.tell(lines(40, (i) => `@p${i} person name=q${i}`));
w.tell(`@w1 core.word lang=en text=book means=reserve  @w2 core.word lang=en text=book means=order
  @w3 core.word lang=en text=meet means=meeting  @w4 core.word lang=en text=with means=meeting.with
  @w5 core.word lang=en text=monday means=mon of=meeting.day  @w6 core.word lang=en text=stock means=item.stock`);
const frames = [
  { lang: 'en', verb: 'book', args: ['n17'], numbers: [2] },
  { lang: 'en', verb: 'meet', args: [{ role: 'with', word: 'q3' }, 'monday'] },
  { lang: 'en', verb: 'stock', args: ['n5'], question: true },
];
for (const f of frames) {
  w.interpret(f);
  const a = med(Array.from({ length: 21 }, () => time(() => w.interpret(f))));
  const r = w.interpret(f);
  const b = med(Array.from({ length: 21 }, () => time(() => w.score(r.candidates))));
  console.log(`${f.verb.padEnd(6)} ${r.candidates.length} candidates: interpret ${a.toFixed(3)} ms, score ${b.toFixed(3)} ms`);
}
// splits: "book n17 and meet q3 on monday", two ways
const split = [
  [{ lang: 'en', verb: 'book', args: ['n17'] }, { lang: 'en', verb: 'meet', args: [{ role: 'with', word: 'q3' }, 'monday'] }],
  [{ lang: 'en', verb: 'book', args: ['n17', 'q3', 'monday'] }],
];
const a = med(Array.from({ length: 21 }, () => time(() => w.interpret(split))));
const rs = w.interpret(split);
const b = med(Array.from({ length: 21 }, () => time(() => w.score(rs.candidates))));
console.log(`splits ${rs.candidates.length} candidates: interpret ${a.toFixed(3)} ms, score ${b.toFixed(3)} ms; order ${w.score(rs.candidates).order}`);
