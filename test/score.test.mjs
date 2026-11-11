// world.score: candidate readings judged against the world, nothing told (Round 8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const world = () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=item key=name id=true
    @k2 core.slot of=order key=item kind=ref to=item required=true
    @k3 core.slot of=order key=qty kind=integer min=1 default=1
    @k5 core.slot of=meeting key=with type=person required=true
    @k4 core.slot of=meeting key=day enum=mon enum=tue required=true
    @m meeting with=$busy day=?d
    @busy person name=?n off=?d
    @x core.deny when=$m when=$busy why="?n is off on ?d"
    @a core.action name=reserve param=item when=$it if=$left set=$r
    @it item name=?item stock=?s
    @left core.check fn=gt args=?s args=0 why="?item is out of stock"
    @r item core.on=$it reserved=yes
  `);
  w.tell('@i1 item name=pen stock=3  @i2 item name=ink stock=0  @p1 person name=ann off=mon  @p2 person name=bob');
  return w;
};

test('score: candidates are judged against the world and ordered; nothing is told', () => {
  const w = world();
  const before = [w.toSOP({ derived: true }), w.version, w.log.length];
  const r = w.score([
    { wires: '@m meeting with=$who day=fri', refer: { who: { type: 'person', where: { name: 'bob' } } } }, // a day that is not one
    { wires: '@m meeting with=$who day=mon', refer: { who: { type: 'person' } } },                       // who? the world says bob
    { wires: '@o order item=$it', refer: { it: { type: 'item', where: { name: 'pen' } } } },             // consistent, assumes qty 1
    { wires: '@o order item=$it', refer: { it: { type: 'item', where: { name: 'cup' } } } },             // no such item: it lacks
    { action: 'reserve', args: { item: 'ink' } },                                                       // the guard says no
    { action: 'reserve' },                                                                              // an argument is missing
    { question: { type: 'item', where: { name: 'pen' }, seek: 'stock' } },
  ]);
  const c = r.candidates;
  assert.deepEqual([c[0].ok, c[0].violations[0].kind], [false, 'domain']);
  assert.deepEqual([c[1].ok, c[1].referents[0].ids, c[1].referents[0].unique, c[1].referents[0].fits], [true, ['p1', 'p2'], false, ['p2']]);
  assert.deepEqual([c[2].ok, c[2].referents[0].unique, c[2].assumes], [true, true, [{ id: 'o', key: 'qty', value: '1' }]]);
  assert.deepEqual([c[3].ok, c[3].lacks.map((l) => l.referent || l.key)], [true, ['it', 'item']]);
  assert.deepEqual([c[4].ok, c[4].action.available, c[4].violations[0].why], [false, false, 'ink is out of stock']);
  assert.deepEqual([c[5].action.status, c[5].lacks.map((l) => l.key)], ['missing', ['item']]);
  assert.deepEqual([c[6].ok, c[6].answer.value], [true, '3']);
  // consistent first, then settled referents, fewer lacks, fewer assumptions
  assert.deepEqual(r.order, [1, 6, 2, 5, 3, 0, 4]);
  assert.deepEqual([w.toSOP({ derived: true }), w.version, w.log.length], before, 'nothing was told');
});

test('rank: the default order is a function hosts can call; every place is explained', async () => {
  const { rank, RANKING } = await import('../tools/lib-under-test.mjs');
  const w = world();
  w.tell('@w1 core.word lang=en text=book means=reserve  @w2 core.word lang=en text=book means=order');
  const r = w.score(w.interpret({ lang: 'en', verb: 'book', args: ['ink', 'blue'] }).candidates);
  const [act, order] = r.candidates;
  assert.deepEqual(r.order, [1, 0]);
  assert.deepEqual([act.place, act.lostTo, act.on, act.why], [1, 1, 'consistent', 'inconsistent: ink is out of stock; #1: consistent with the world']);
  assert.deepEqual([order.place, order.why], [0, 'consistent with the world; every referent settled; lacks nothing; leaves out blue; assumes qty=1']);
  // the same order from the function, and a host's own criteria
  assert.deepEqual(rank(r.candidates).order, [1, 0]);
  assert.deepEqual(RANKING.map((c) => c.name), ['consistent', 'referents', 'lacks', 'words', 'assumes']);
  const actionsFirst = [{ name: 'action', measure: (x) => (x.action ? 0 : 1), say: (x) => (x.action ? 'an action' : 'a statement') }, ...RANKING];
  const mine = w.score(w.interpret({ lang: 'en', verb: 'book', args: ['ink'] }).candidates, { criteria: actionsFirst });
  assert.deepEqual([mine.order, mine.candidates[1].on, mine.candidates[1].why], [[0, 1], 'action', 'a statement; #0: an action']);
  // a tie is said to be one
  const tie = rank([{ index: 0, ok: true }, { index: 1, ok: true }]);
  assert.equal(tie.ranked[1].why, 'tied with #0 on every criterion; kept in the given order');
});

test('rank: fewer referents left ambiguous wins, and the loser names who they could be', () => {
  const w = world();
  w.tell('@p3 person name=cy');
  const r = w.score([
    { wires: '@m meeting with=$who day=tue', refer: { who: { type: 'person' } } },
    { wires: '@m meeting with=$who day=tue', refer: { who: { type: 'person', where: { name: 'cy' } } } },
  ]);
  assert.deepEqual([r.order, r.candidates[0].on], [[1, 0], 'referents']);
  assert.equal(r.candidates[0].why, 'ambiguous: who could be p1 or p2 or p3; #1: every referent settled');
});
