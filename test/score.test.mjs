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

test('veto: whether a host should answer with the top reading, and why not', () => {
  const w = world();
  w.tell(`@w1 core.word lang=en text=reserve means=reserve  @w2 core.word lang=en text=meet means=meeting
    @w3 core.word lang=en text=monday means=mon of=meeting.day  @w4 core.word lang=en text=order means=order`);
  const v = (f, o) => w.veto(w.score(w.interpret(f).candidates), o);
  assert.deepEqual(v({ lang: 'en', verb: 'reserve', args: ['pen'] }), { answer: true, index: 0, reasons: [], ask: [], read: [] });
  // the only reading breaks the world
  const ink = v({ lang: 'en', verb: 'reserve', args: ['ink'] });
  assert.deepEqual([ink.answer, ink.reasons.map((r) => r.reason), ink.reasons[0].why], [false, ['inconsistent'], 'ink is out of stock']);
  // a word left out, read as a near word, a referent open, nothing at all
  assert.deepEqual(v({ lang: 'en', verb: 'reserve', args: ['pen', 'blue'] }).reasons.map((r) => [r.reason, r.why]), [['words-left-out', 'leaves out blue']]);
  assert.equal(v({ lang: 'en', verb: 'reserve', args: ['pen', 'blue'] }, { leftOut: 1 }).answer, true);
  assert.deepEqual(v({ lang: 'en', verb: 'reserve', args: ['pne'] }).read, [{ word: 'pne', read: 'pen' }]);
  w.tell('@p3 person name=cy off=mon');
  const who = w.veto(w.score([{ wires: '@m meeting with=$who day=tue', refer: { who: { type: 'person' } } }]));
  assert.deepEqual([who.answer, who.reasons[0].reason, who.reasons[0].why], [false, 'ambiguous', 'who could be p1 or p2 or p3']);
  assert.deepEqual(w.veto(w.score([])).reasons[0].reason, 'nothing');
  // what it lacks is what a host asks for; a missing argument is not a veto
  const ask = v({ lang: 'en', verb: 'meet', args: ['monday'] });
  assert.deepEqual([ask.answer, ask.ask.map((a) => a.key)], [true, ['with']]);
  // a tie at the top is a reason to ask
  const tie = w.veto(w.score([{ question: { type: 'item', where: { name: 'pen' }, seek: 'stock' } }, { question: { type: 'item', where: { name: 'ink' }, seek: 'stock' } }]));
  assert.deepEqual([tie.answer, tie.reasons[0].reason, tie.reasons[0].between], [false, 'tie', [0, 1]]);
});

test('veto: an action the world does not have', () => {
  const w = world();
  const r = w.veto(w.score([{ action: 'teleport', args: {} }]));
  assert.deepEqual([r.answer, r.reasons.map((x) => x.reason)], [false, ['action-unavailable']]);
});

test('rank and questions: the value a question asks for is not a lack, so a question is not beaten by a nonsense statement', () => {
  const w = world();
  // "what color is the pen": the pen has no color yet; the statement reading leaves out a word
  const r = w.score([
    { wires: '@n note text=what', used: ['what'], unused: ['pen'], unresolved: [] },
    { question: { type: 'item', where: { name: 'pen' }, seek: 'color' }, used: ['what', 'pen'], unused: [], unresolved: [] },
  ]);
  assert.deepEqual([r.candidates[1].lacks, r.order, r.candidates[0].on], [[], [1, 0], 'words']);
  // a question about a subject that is not there still lacks it
  const none = w.score([{ question: { type: 'item', where: { name: 'cup' }, seek: 'color' } }]);
  assert.deepEqual(none.candidates[0].lacks.map((l) => [l.type, l.key, l.id]), [['item', 'color', undefined]]);
});
