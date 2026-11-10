// Cost of fluents and as-of: node tools/bench-time.mjs
import { World } from '../src/index.mjs';
import { ledger } from '../examples/ledger.mjs';
const time = (label, fn) => { const t = performance.now(); const out = fn(); console.log(`${label.padEnd(58)} ${(performance.now() - t).toFixed(0).padStart(6)} ms  ${out}`); };
for (const n of [200, 1000, 2000]) {
  const w = new World();
  w.load(ledger);
  w.load('@acc account name=ana balance=1000000');
  time(`${n} events on one account, told one by one`, () => { for (let i = 0; i < n; i++) w.tell(`@d${i} deposit account=ana amount=1`); return `balance ${w.get('acc').attrs.balance[0]}`; });
  time(`  retract one event among them`, () => w.retract(`d${n >> 1}`).ok);
  time(`  query as of the middle`, () => w.query({ about: 'acc', seek: 'balance' }, { at: w.seqOf(`d${(n >> 1) + 1}`) }).value);
}
const many = new World();
many.load(ledger);
time('1000 accounts, 2 events each, told one by one', () => {
  for (let i = 0; i < 1000; i++) { many.tell(`@a${i} account name=n${i} balance=100`); many.tell(`@d${i} deposit account=n${i} amount=5`); many.tell(`@w${i} withdrawal account=n${i} amount=3`); }
  return `${many.wires.size} wires`;
});
