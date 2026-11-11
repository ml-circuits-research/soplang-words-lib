// P2: the first change after fork() or mark() should not copy the world.
// For bases of 60, 600 and 6,000 wires: a one-wire tell on a world that shares nothing,
// fork + first tell, mark + first tell, and a second tell in the fork.
// `node bench/fork.mjs` (add `bundle` to measure docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };

const matrix = `
  @k1 core.slot of=person key=name id=true
  @k2 core.slot of=visit key=who type=person required=true
  @v visit who=$p
  @p person name=?n
  @seen person core.on=$p visited=yes
  @r core.rule when=$v when=$p then=$seen
`;
const base = (n) => {
  const w = new World();
  w.load(matrix);
  w.load(lines(n / 2, (i) => `@p${i} person name=n${i}\n@v${i} visit who=$p${i}`)); // n/2 people and n/2 visits; the rule marks each person
  return w;
};

console.log('wires | tell, nothing shared | fork + first tell | mark + first tell | the same, after a rewind | second tell in the fork | fork + tell / tell');
for (const n of [60, 600, 6000]) {
  const w = base(n);
  const R = 201;
  let k = 0;
  const plain = [], forked = [], marked = [], second = [], rewound = [];
  // a world that shares nothing: tell and take it back each time, so the base stays the same size
  for (let i = 0; i < R; i++) { plain.push(time(() => w.tell(`@a${k} person name=a${k}`))); w.retract(`a${k++}`); }
  for (let i = 0; i < R; i++) {
    let f;
    forked.push(time(() => { f = w.fork(); f.tell(`@b${k} person name=b${k}`); }));
    second.push(time(() => f.tell(`@c${k} person name=c${k++}`)));
  }
  // mark, then a tell on the world itself (the mark keeps the state as it was); the turn
  // is not taken back, so the world grows by one wire per round
  const v = w.fork();
  for (let i = 0; i < R; i++) {
    marked.push(time(() => { v.mark(); v.tell(`@d${k} person name=d${k}`); }));
    k++;
  }
  // the same followed by rewind(mark), which costs a diff of the two worlds (not timed)
  const u = w.fork();
  for (let i = 0; i < 51; i++) {
    let m;
    rewound.push(time(() => { m = u.mark(); u.tell(`@e${k} person name=e${k}`); }));
    u.rewind(m);
    k++;
  }
  const p = med(plain), f = med(forked);
  console.log(`${String(w.wires.size).padStart(5)} | ${p.toFixed(4)} ms | ${f.toFixed(4)} ms | ${med(marked).toFixed(4)} ms | ${med(rewound).toFixed(4)} ms | ${med(second).toFixed(4)} ms | ${(f / p).toFixed(2)}`);
}
