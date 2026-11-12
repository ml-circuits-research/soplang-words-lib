import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { World, induce, solvers } from '../tools/lib-under-test.mjs';
import { scan } from '../tools/scan-loops.mjs';
import { orders } from '../examples/orders.mjs';
import { ledger } from '../examples/ledger.mjs';
import { garden } from '../examples/worlds.mjs';
import { scheduling, instance } from '../examples/scheduling.mjs';

const snap = (w) => JSON.stringify(w.toJSON());
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const unless = `@p person name=?n\n?q banned name=?n\n@ok allowed name=?n\n@r core.rule when=$p not=$q then=$ok`;

/**
 * Run `call` on a fresh world under every budget from 1 step up to what the call needs
 * (or `samples` of them, evenly spread). Each run must stop with its budget exhausted,
 * return what `refused` accepts, and leave the world exactly as it was. Returns how many
 * runs stopped at each site.
 */
function sweep(make, call, refused, samples = 400) {
  const whole = make();
  call(whole, undefined);
  const { steps: total, exhausted } = whole.stats();
  assert.equal(exhausted, false, 'the default budget is enough for the whole call');
  const stopped = {};
  for (let n = 1; n < total; n += Math.max(1, Math.floor(total / samples))) {
    const w = make();
    const before = snap(w);
    const result = call(w, { steps: n });
    const s = w.stats();
    assert.equal(s.exhausted, true, `${n} of ${total} steps are not enough`);
    assert.equal(s.steps, n + 1, 'it stops at the first step over the budget');
    assert.ok(refused(result, s.site), `the result says so (stopped in ${s.site} after ${n} steps)`);
    assert.equal(snap(w), before, `the world is unchanged (stopped in ${s.site} after ${n} steps)`);
    stopped[s.site] = (stopped[s.site] || 0) + 1;
  }
  return stopped;
}
const refusal = (r, site) => r.ok === false && r.violations.length === 1 && r.violations[0].kind === 'budget' && r.violations[0].site === site;
const sitesOf = (stopped, ...sites) => { for (const s of sites) assert.ok(stopped[s] > 0, `some run stopped in ${s}: ${JSON.stringify(stopped)}`); };

test('budget: tell stops in match, chase, negation, aggregate and validate, and nothing of it stays', () => {
  const stopped = sweep(
    () => { const w = new World(); w.load(orders); w.load(unless); w.load('@o1 order customer=ana\n@cu customer name=ana limit=1000'); return w; },
    (w, budget) => w.tell(lines(12, (i) => `@l${i} line of=$o1 item=i${i} amount=1\n@p${i} person name=n${i}`), { budget }),
    refusal);
  sitesOf(stopped, 'match', 'chase', 'negation', 'aggregate', 'validate');
});

test('budget: a matrix that explodes is stopped, not waited for', () => {
  const w = new World();
  w.load(lines(200, (i) => `@n${i} node v=${i}`));
  // 200 x 200 x 200 candidates
  const rows = w.ask('@a node\n?b node\n?c node', { budget: { steps: 20000 } });
  assert.deepEqual([rows.length, rows.budget.kind, rows.budget.site, w.stats().steps], [0, 'budget', 'match', 20001]);
  // a rule that pairs every node with every node: 40,000 derived wires
  const before = snap(w);
  const r = w.tell('@x node v=?i\n?y node v=?j\n@pr pair a=?i b=?j\n@all_pairs core.rule when=$x when=$y then=$pr', { budget: { steps: 30000 } });
  assert.ok(refusal(r, r.violations[0].site));
  assert.equal(snap(w), before);
  assert.equal(w.holds('@a node v=3'), true, 'the world still answers');
  // a wall-clock limit works the same way
  const slow = w.ask('@a node\n?b node\n?c node\n?d node', { budget: { steps: 1e12, ms: 20 } });
  assert.equal(slow.budget.kind, 'budget');
  assert.match(slow.budget.why, /20 ms/);
});

test('budget: fluents stop in fluent', () => {
  const stopped = sweep(
    () => { const w = new World(); w.load(ledger); w.load('@acc account name=a balance=100'); return w; },
    (w, budget) => w.tell(lines(20, (i) => `@d${i} deposit account=a amount=1`), { budget }),
    refusal);
  sitesOf(stopped, 'fluent', 'chase', 'validate');
});

test('budget: retract and replace stop in withdraw', () => {
  const make = () => { const w = new World(); w.load(orders); w.load(unless); w.load('@o1 order customer=ana\n' + lines(12, (i) => `@l${i} line of=$o1 item=i${i} amount=1\n@p${i} person name=n${i}`)); return w; };
  sitesOf(sweep(make, (w, budget) => w.retract('o1', { budget }), refusal), 'withdraw');
  sitesOf(sweep(make, (w, budget) => w.replace('l3', '@l3 line of=$o1 item=i3 amount=7', { budget }), refusal), 'withdraw', 'aggregate');
});

const meetings = () => { const w = new World(); w.load(scheduling); w.load(instance({ meetings: 6, rooms: 2 })); return w; };

test('budget: suggest, next and complete stop in complete, ground and solve', () => {
  const list = (r, site) => Array.isArray(r) && r.length === 0 && r.budget.site === site;
  sitesOf(sweep(meetings, (w, budget) => w.suggest('mt0', 'room', { budget }), list), 'complete', 'ground', 'solve', 'match');
  sitesOf(sweep(meetings, (w, budget) => w.next({ budget }), (r, site) => r.fills.length === 0 && r.budget.site === site, 200), 'complete', 'solve');
  sitesOf(sweep(meetings, (w, budget) => w.complete({ choose: true, budget }), (r, site) => r.filled.length === 0 && r.budget.site === site, 60), 'complete', 'solve');
});

test('budget: the solvers answer unknown', () => {
  const unknown = (r, site) => r.status === 'unknown' && r.stats.budget.site === site;
  sitesOf(sweep(meetings, (w, limit) => w.solveReport({ limit }), unknown), 'ground', 'solve');
  sitesOf(sweep(meetings, (w, limit) => w.solveReport({ limit, solver: solvers.backtrack() }), unknown), 'solve');
  const w = meetings();
  assert.equal(w.satisfiable({ limit: { steps: 10 } }), true, 'unknown is not unsatisfiable');
  assert.deepEqual(w.solve({ limit: { steps: 10 } }), []);
});

test('budget: abduction stops in abduce', () => {
  const stopped = sweep(
    () => { const w = new World(); w.load(garden); return w; },
    (w, budget) => w.abduce('@g slippery place=lawn', { budget }),
    (r, site) => Array.isArray(r) && r.length === 0 && r.budget.site === site);
  sitesOf(stopped, 'abduce');
});

test('budget: induction stops in induce, and never builds an alignment too large to try', () => {
  const examples = [
    { when: '@a booking room=r1 slot=9  @b booking room=r1 slot=9  @c booking room=r2 slot=1', then: '@x clash a=$a b=$b' },
    { when: '@a booking room=r7 slot=14  @b booking room=r7 slot=14  @c booking room=r3 slot=2', then: '@x clash a=$a b=$b' },
  ];
  assert.ok(induce(examples).text, 'the default budget is enough');
  const r = induce(examples, { budget: { steps: 1 } });
  assert.deepEqual([r.text, r.budget.kind, r.budget.site], [null, 'budget', 'induce']);
  // twelve wires of one type: 12! alignments
  const many = (v) => lines(12, (i) => `@b${i} booking room=r${(i * v) % 5} slot=${i}`).replace(/\n/g, '  ');
  const started = Date.now();
  const big = induce([{ when: many(1) }, { when: many(3) }], { kind: 'deny' });
  assert.ok(big.text && Date.now() - started < 1000, 'the wires keep the order they were given in');
});

test('budget: query, act, fill, apply, step, trial and asOf are guarded too', () => {
  const w = new World();
  w.load(ledger);
  w.load('@acc account name=a balance=100\n' + lines(10, (i) => `@d${i} deposit account=a amount=1`));
  const before = snap(w);
  const tiny = { budget: { steps: 1 } };
  const q = w.query({ type: 'account', seek: 'balance', where: { name: 'a' } }, { at: w.seqOf('d3'), ...tiny });
  assert.deepEqual([q.status, q.kind], ['budget', 'budget']);
  assert.equal(w.asOf(w.seqOf('d3'), (x) => x.get('acc').attrs.balance[0], tiny), undefined);
  assert.equal(w.trial((x) => x.tell('@d99 deposit account=a amount=5'), tiny), undefined);
  assert.equal(snap(w), before);
  assert.equal(w.query({ type: 'account', seek: 'balance', where: { name: 'a' } }).value, '110');

  const m = meetings();
  const start = snap(m);
  assert.ok(refusal(m.fill('mt0', 'time', 't1', tiny), m.stats().site));
  assert.ok(refusal(m.apply(m.solve(), tiny), m.stats().site));
  assert.ok(refusal(m.step('@x meeting people=2 with=zed', tiny), m.stats().site));
  assert.equal(snap(m), start);
});

test('budget: stats() reports the steps of the last call, per site; world options set the default', () => {
  const w = new World({ budget: { steps: 50 } });
  w.load(lines(5, (i) => `@n${i} node v=${i}`));
  assert.equal(w.ask('@a node\n?b node').length, 25);
  const s = w.stats();
  assert.deepEqual([s.steps, s.limit, s.exhausted, s.site, s.sites.match], [30, 50, false, null, 30]);
  assert.deepEqual(Object.keys(s.sites), ['match', 'chase', 'negation', 'aggregate', 'fluent', 'withdraw', 'validate', 'complete', 'ground', 'solve', 'abduce', 'induce', 'interpret']);
  assert.equal(w.ask('@a node\n?b node\n?c node').budget.steps, 51, 'the world default applies');
  assert.equal(w.ask('@a node\n?b node\n?c node', { budget: { steps: 1000 } }).length, 125, 'a call can raise it');
  // the same call on the same world always costs the same
  const again = () => { const x = meetings(); x.complete({ choose: true }); return x.stats().steps; };
  assert.equal(again(), again());
});

test('budget: every loop and recursion in src/ ticks the budget or says why it is bounded', () => {
  assert.deepEqual(scan(new URL('../src', import.meta.url).pathname), []);
  // and the scan does see what it should
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  writeFileSync(join(dir, 'a.mjs'), [
    'function spin(x) {', '  while (x) x = next(x);', '}',
    'function walk(n) {', '  return n.kids.map((k) => walk(k));', '}',
    'function fine(q) {', '  for (;;) { this._b.tick("match"); if (!q.pop()) return; }', '}',
    '// bounded: by the depth of the tree', 'function depth(n) {', '  return 1 + depth(n.up);', '}',
    'function drain(q) {', '  while (q.length) q.pop(); // bounded: the queue', '}',
  ].join('\n'));
  assert.deepEqual(scan(dir), ['a.mjs:2 loop: while (x) x = next(x);', 'a.mjs:4 recursion: walk']);
});

test('fork: structural, independent in both directions, and cheap', () => {
  const w = new World();
  w.load(orders);
  w.load(lines(100, (o) => `@o${o} order customer=c${o}\n` + lines(19, (i) => `@l${o}_${i} line of=$o${o} item=i${i} amount=${i + 1}`)));
  assert.ok(w.wires.size >= 2000, `${w.wires.size} wires`);
  const before = snap(w);
  const total = (x, o) => x.ofType('summary').find((s) => s.attrs.of[0] === '$' + o).attrs.total[0];

  const f = w.fork();
  assert.equal(snap(f), before);
  assert.ok(f.tell('@extra line of=$o1 item=more amount=1000').ok);
  assert.deepEqual([total(f, 'o1'), total(w, 'o1')], ['1190', '190'], 'a change in the fork is not seen by the original');
  assert.equal(snap(w), before);
  assert.ok(w.retract('l2_0').ok);
  assert.deepEqual([total(w, 'o2'), total(f, 'o2')], ['189', '190'], 'nor the other way round');
  const g = f.fork(), h = f.fork();
  g.tell('@only_g order customer=g');
  assert.deepEqual([g.has('only_g'), h.has('only_g'), f.has('only_g')], [true, false, false], 'forks of forks');
  assert.equal(f.explain('extra').told, true);

  // the time of a fork does not depend on the size of the world: best of 200, in ms
  const time = (fn) => { let best = Infinity; for (let i = 0; i < 200; i++) { const t = process.hrtime.bigint(); fn(); best = Math.min(best, Number(process.hrtime.bigint() - t) / 1e6); } return best; };
  const ms = time(() => w.fork());
  assert.ok(ms < 1, `fork() of ${w.wires.size} wires took ${ms} ms`);
});

test('complete: with nothing to fill it is cheap, and its answer is the one a full run gives', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=visit key=who type=person required=true ask="Who came?"
    @k2 core.slot of=visit key=mood enum=calm enum=busy
    @k3 core.slot of=person key=name id=true
  `);
  assert.equal(w.canComplete(), false);
  w.tell('@p1 person name=ana  @v1 visit');
  assert.equal(w.canComplete(), true, 'a required reference with a wire of its type');
  assert.equal(w.canComplete('p1'), false);
  const first = w.complete();
  assert.deepEqual(first.filled.map((f) => [f.id, f.key, f.value]), [['v1', 'who', '$p1']]);
  assert.equal(w.canComplete(), false);
  // nothing changed: the same answer, without the work, and a copy the caller may change
  const a = w.complete();
  w.stats();
  const b = w.complete();
  assert.equal(w.stats().steps, 0, 'the second call does no work');
  assert.deepEqual(a, b);
  a.questions.push('x');
  assert.deepEqual(w.complete(), b);
  // it is the answer a world built from scratch gives
  const fresh = World.fromJSON(w.toJSON());
  assert.deepEqual(fresh.complete(), b);
  // other options, a change, a rollback, a fork, a registered function: each is looked at again
  w.load('@k4 core.slot of=visit key=day enum=mon enum=tue required=true');
  assert.equal(w.canComplete(), true);
  assert.deepEqual(w.complete({ defaults: true }).filled, []);
  assert.equal(w.complete().pending.length, 0);
  assert.deepEqual(w.complete({ choose: true }).filled.map((f) => f.key), ['day']);
  // review only on request
  assert.equal('review' in w.next(), false);
  assert.ok(w.next({ review: true }).review.length >= 1);
  const f = w.fork();
  f.tell('@v2 visit');
  assert.deepEqual(f.complete().filled.map((x) => [x.id, x.key]), [['v2', 'who']]);
  assert.equal(w.has('v2'), false);
});
