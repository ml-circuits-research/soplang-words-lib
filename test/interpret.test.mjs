// core.word and world.interpret: frames read into candidates through words, the matrix and
// the state; nothing invented (Round 9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

export const shopAndCalendar = () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=item key=name id=true
    @k2 core.slot of=order key=item kind=ref to=item required=true
    @k3 core.slot of=order key=qty kind=integer min=1 default=1
    @k6 core.slot of=person key=name id=true
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
  w.tell(`
    @en1 core.word text=book means=reserve
    @en2 core.word text=book means=order
    @en3 core.word text=order means=order
    @en4 core.word text=meet means=meeting
    @en5 core.word text=with means=meeting.with
    @en6 core.word text=monday means=mon of=meeting.day
    @en7 core.word text=stock means=item.stock
    @sy1 core.word text=hold means=reserve
    @sy2 core.word text=buy means=order
    @sy3 core.word text=meeting means=meeting
    @sy4 core.word text=alongside means=meeting.with
    @sy5 core.word text=mondays means=mon of=meeting.day
    @sy6 core.word text=biro means=pen of=item.name
    @sy7 core.word text=supply means=item.stock
  `);
  return w;
};
const strip = (cands) => cands.map(({ reading, used, unused, unresolved, verb, ...c }) => c);

test('interpret: a word with two meanings gives two candidates; score chooses by the world', () => {
  const w = shopAndCalendar();
  const r = w.interpret({ verb: 'book', args: ['ink'] });
  assert.deepEqual(strip(r.candidates), [
    { action: 'reserve', args: { item: 'ink' } },
    { wires: '@new order item=$r1', refer: { r1: { type: 'item', where: { name: 'ink' } } } },
  ]);
  assert.deepEqual(r.candidates[0].reading, [{ word: 'ink', as: 'reserve.item' }]);
  // ink is out of stock: reserving it is refused, ordering it is not
  assert.deepEqual(w.score(r.candidates).order, [1, 0]);
});

test('interpret: roles, values, numbers and referents; the same frame in synonyms gives the same candidates', () => {
  const w = shopAndCalendar();
  const a = w.interpret({ verb: 'meet', args: [{ role: 'with', word: 'bob' }, 'monday'] });
  const b = w.interpret({ verb: 'meeting', args: [{ role: 'alongside', word: 'bob' }, 'mondays'] });
  assert.deepEqual(strip(a.candidates), [{ wires: '@new meeting with=$r1 day=mon', refer: { r1: { type: 'person', where: { name: 'bob' } } } }]);
  assert.deepEqual(strip(b.candidates), strip(a.candidates));
  const order = w.interpret({ verb: 'buy', args: ['biro'], numbers: [2] });
  assert.deepEqual(strip(order.candidates), [{ wires: '@new order item=$r1 qty=2', refer: { r1: { type: 'item', where: { name: 'pen' } } } }]);
  const q = w.interpret({ verb: 'supply', args: ['biro'], question: true });
  assert.deepEqual(strip(q.candidates), [{ question: { type: 'item', where: { name: 'pen' }, seek: 'stock' } }]);
  assert.equal(w.score(q.candidates).candidates[0].answer.value, '3');
});

test('interpret: unknown words stay unresolved and nothing is invented', () => {
  const w = shopAndCalendar();
  const r = w.interpret({ verb: 'order', args: ['spoon', 'pen'] });
  assert.deepEqual(r.unresolved, ['spoon']);
  assert.deepEqual(strip(r.candidates), [{ wires: '@new order item=$r1', refer: { r1: { type: 'item', where: { name: 'pen' } } } }]);
  assert.deepEqual([r.candidates[0].used, r.candidates[0].unresolved], [['pen'], ['spoon']]);
  // a value for every key the candidate holds comes from a word or a number of the frame
  const frames = [
    { verb: 'meet', args: ['ann', 'monday', 'pen'], numbers: [7] },
    { verb: 'book', args: ['pen', 'ink'], numbers: [3, 4] },
    { verb: 'buy', args: ['biro', 'mondays'], numbers: [5] },
  ];
  for (const f of frames) {
    const given = new Set([...f.args, ...f.numbers.map(String), 'mon', 'pen']); // mon and pen: what luni, monday and pix mean
    for (const c of w.interpret(f).candidates) {
      const values = [...Object.values(c.args || {}), ...Object.values(c.refer || {}).flatMap((x) => Object.values(x.where))];
      for (const m of (c.wires || '').matchAll(/ \w+=([^$\s]\S*)/g)) values.push(m[1]);
      for (const v of values) assert.ok(given.has(v), `${v} in ${JSON.stringify(c)} comes from the frame`);
    }
  }
});

test('core.word: a word whose means= names nothing is a load warning; words are facts', () => {
  const w = shopAndCalendar();
  w.tell('@bad core.word text=frob means=frobnicate  @bad2 core.word text=fri means=fri of=meeting.day');
  assert.deepEqual(w.warnings.filter((x) => x.kind === 'unknown-word').map((x) => x.id), ['bad', 'bad2']);
  assert.deepEqual(w.words().get('biro')[0].meanings, [{ kind: 'value', type: 'item', key: 'name', value: 'pen' }]);
  w.undo();
  assert.equal(w.words().get('frob'), undefined, 'undone like any fact');
});

test('interpret: alternative splits of one message are scored as wholes; later parts see earlier ones', () => {
  const w = shopAndCalendar();
  w.tell('@en8 core.word text=reserve means=reserve  @en9 core.word text=add means=item');
  const before = [w.version, w.log.length];
  // "reserve the pen and order ink": two frames, or one frame with both nouns
  const r = w.interpret([
    [{ verb: 'reserve', args: ['pen'] }, { verb: 'order', args: ['ink'] }],
    [{ verb: 'reserve', args: ['pen', 'ink'] }],
  ]);
  assert.deepEqual(r.candidates.map((c) => [c.split, c.parts.length]), [[0, 2], [1, 1]]);
  assert.equal(r.candidates[0].parts[1].wires, '@new2 order item=$r1');
  const s = w.score(r.candidates);
  assert.deepEqual(s.order, [0, 1]);
  assert.deepEqual([s.candidates[1].on, s.candidates[1].why], ['words', 'leaves out ink; #0: uses every word']);
  assert.deepEqual(s.candidates[0].assumes, [{ id: 'new2', key: 'qty', value: '1', part: 1 }]);
  // "add a cup and order it": the second part's referent is the wire the first part makes
  const two = w.score([{ parts: [{ wires: '@cup item name=cup stock=2' }, { wires: '@o order item=$it', refer: { it: { type: 'item', where: { name: 'cup' } } } }] }]);
  assert.deepEqual([two.candidates[0].ok, two.candidates[0].referents], [true, [{ name: 'it', ids: ['cup'], unique: true, part: 1 }]]);
  assert.deepEqual([w.version, w.log.length, w.has('cup')], [...before, false], 'nothing was told');
});

test('examples: sentences from the tools, slots and words with the host\'s templates; each reads back to what it expects', () => {
  const w = shopAndCalendar();
  w.tell('@sy8 core.word text=tuesdays means=tue of=meeting.day');
  const ex = w.examples({ question: 'how much {verb} has {args}?' });
  assert.deepEqual(ex.map((e) => e.text), [
    'book biro', 'book ink', 'hold biro', 'hold ink', 'book biro', 'book ink', 'order biro', 'order ink',
    'meet with ann monday', 'meet with ann mondays', 'meet with ann tuesdays',
    'buy biro', 'buy ink',
    'meeting with ann monday', 'meeting with ann mondays', 'meeting with ann tuesdays',
    'how much stock has biro?', 'how much stock has ink?', 'how much supply has biro?', 'how much supply has ink?',
  ]);
  assert.deepEqual(ex.find((e) => e.text === 'meeting with ann mondays').frame, { verb: 'meeting', args: [{ role: 'with', word: 'ann' }, 'mondays'] });
  // the round trip: interpret gives the reading each example expects
  const matches = (c, e) => {
    if (e.expect.action) return c.action === e.expect.action && JSON.stringify(c.args) === JSON.stringify(e.expect.args);
    if (e.expect.question) return JSON.stringify(c.question) === JSON.stringify(e.expect.question);
    const wire = c.wires && c.wires.split(' ');
    if (!wire || wire[1] !== e.expect.type) return false;
    const attrs = Object.fromEntries(wire.slice(2).map((kv) => kv.split('=')));
    return Object.entries(e.expect.attrs).every(([k, v]) => attrs[k] === v)
      && Object.entries(e.expect.refer).every(([k, d]) => JSON.stringify(c.refer?.[attrs[k]?.slice(1)]) === JSON.stringify(d));
  };
  for (const e of ex) assert.ok(w.interpret(e.frame).candidates.some((c) => matches(c, e)), `${e.text} reads back`);
  // a function template, every slot with fillers, and fewer per tool
  const en = w.examples({ statement: ({ verb, args }) => `please ${verb} ${args.map((a) => a.text).join(' and ')}` }, { all: true, per: 1 });
  assert.ok(en.some((e) => e.text === 'please order biro and 1' && e.frame.numbers[0] === '1'));
});

test('near words: an unknown word is read as the nearest known one, as an assumption; known words are never corrected', () => {
  const w = shopAndCalendar();
  w.tell('@en8 core.word text=reserve means=reserve');
  const typo = w.interpret({ verb: 'resreve', args: ['pne'] });
  assert.deepEqual(strip(typo.candidates), [{ action: 'reserve', args: { item: 'pen' }, assumes: [{ word: 'resreve', read: 'reserve' }, { word: 'pne', read: 'pen' }] }]);
  assert.deepEqual(typo.unresolved, []);
  const meet = w.score(w.interpret({ verb: 'meet', args: [{ role: 'with', word: 'bbo' }, 'mondya'] }).candidates);
  assert.equal(meet.candidates[0].why, 'consistent with the world; every referent settled; lacks nothing; uses every word; assumes bbo is bob, mondya is monday');
  // exact readings rank first
  const both = w.score([...w.interpret({ verb: 'order', args: ['inc'] }).candidates, ...w.interpret({ verb: 'order', args: ['ink'] }).candidates]);
  assert.deepEqual([both.order, both.candidates[0].on], [[1, 0], 'assumes']);
  // bounds: 1 edit for words of 4 letters or fewer, 2 for longer; nothing near stays unresolved
  assert.deepEqual(w.interpret({ verb: 'order', args: ['oxk'] }).unresolved, ['oxk']);
  assert.deepEqual(w.interpret({ verb: 'ordxx', args: [] }).candidates.map((c) => c.assumes), [[{ word: 'ordxx', read: 'order' }]]);
  // no wrong reading where there was none before: frames of known words read the same with or without near words
  const frames = [
    { verb: 'book', args: ['ink'] }, { verb: 'meet', args: ['ann', 'monday'] },
    { verb: 'buy', args: ['biro'], numbers: [2] }, { verb: 'supply', args: ['biro'], question: true },
    { verb: 'order', args: ['pen', 'ink'] },
  ];
  for (const f of frames) assert.deepEqual(w.interpret(f).candidates, w.interpret(f, { near: false }).candidates, JSON.stringify(f));
});

test('follow-ups: corrections, ellipsis, "the other one", and a change to the last statement', () => {
  const w = shopAndCalendar();
  w.load('@k7 core.slot of=order key=color enum=red enum=blue  @k8 core.slot of=order key=note many=true enum=gift enum=urgent');
  w.tell('@en10 core.word text=price means=item.price  @en11 core.word text=tuesday means=tue of=meeting.day');
  w.revise('i1', 'price', '2');
  const pick = (r) => r.candidates.map(({ reading, used, unused, unresolved, verb, ...c }) => c);
  // "no, red": replaces the colour of the previous frame, keeps the item and the verb
  const prev = { verb: 'order', args: ['pen', 'blue'] };
  assert.deepEqual(pick(w.interpret({ args: ['red'], correction: true }, { previous: prev })), [
    { wires: '@new order color=red item=$r1', refer: { r1: { type: 'item', where: { name: 'pen' } } }, inherited: { words: ['pen'], verb: 'order' }, replaced: ['blue'] },
  ]);
  // in a many slot a follow-up adds and a correction replaces
  const gift = { verb: 'order', args: ['pen', 'gift'] };
  assert.match(w.interpret({ args: ['urgent'], anaphor: true }, { previous: gift }).candidates[0].wires, /note=urgent item=\$r1 note=gift/);
  assert.deepEqual(w.interpret({ args: ['urgent'], correction: true }, { previous: gift }).candidates[0].replaced, ['gift']);
  // "and the price?": the question keeps its subject
  const q = w.interpret({ verb: 'price', question: true }, { previous: { verb: 'stock', args: ['pen'], question: true } });
  assert.deepEqual(pick(q)[0].question, { type: 'item', where: { name: 'pen' }, seek: 'price' });
  assert.equal(w.score(q.candidates).candidates[0].answer.value, '2');
  // "the other one": another wire of the same type than the one the previous reading resolved to
  const other = w.score(w.interpret({ other: true }, { previous: { frame: { verb: 'meet', args: ['bob', 'tuesday'] }, ids: ['p2'] } }).candidates);
  assert.deepEqual(other.candidates[0].referents.map((x) => x.ids), [['p1']]);
  // "tuesday" after a told meeting: revise it
  w.tell('@mt meeting with=$p2 day=mon');
  const told = w.interpret({ args: ['tuesday'] }, { previous: 'told' });
  assert.deepEqual(pick(told), [{ revise: { id: 'mt', values: { day: 'tue' } }, inherited: { words: [], wire: 'mt' }, replaced: [] }]);
  assert.deepEqual([w.score(told.candidates).candidates[0].ok, w.get('mt').attrs.day], [true, ['mon']], 'scored, not told');
  // no wrong reading where there was none: a full frame is not a follow-up
  const full = { verb: 'meet', args: ['ann', 'monday'] };
  assert.deepEqual(w.interpret(full, { previous: prev }).candidates, w.interpret(full).candidates);
});

test('loose words: a bag with no verb order is read with each verb word and each implied tool; ranked by words used; bounded', () => {
  const w = shopAndCalendar();
  const read = (f) => { const r = w.interpret(f); const s = w.score(r.candidates); return s.order.map((i) => [r.candidates[i].action || r.candidates[i].wires, r.candidates[i].verbWord || `implied ${r.candidates[i].implied}`, s.candidates[i].on || 'first']); };
  assert.deepEqual(read({ words: ['pen', 'order'], numbers: [2] }), [
    ['@new order item=$r1 qty=2', 'order', 'first'],
    ['reserve', 'implied reserve', 'words'],
  ]);
  assert.deepEqual(read({ words: ['bob', 'monday', 'meet'] }), [['@new meeting with=$r1 day=mon', 'meet', 'first']]);
  assert.deepEqual(read({ words: ['monday', 'bob'] }), [['@new meeting day=mon with=$r1', 'implied meeting', 'first']]);
  assert.deepEqual(read({ words: ['pen'] }), [['reserve', 'implied reserve', 'first'], ['@new order item=$r1', 'implied order', 'assumes']]);
  const q = w.interpret({ words: ['pen', 'stock'], question: true });
  assert.deepEqual(q.candidates.map((c) => c.question), [{ type: 'item', where: { name: 'pen' }, seek: 'stock' }]);
  // charged to the budget, and a frame with a verb is read as before
  const out = w.interpret({ words: ['pen', 'ink', 'bob', 'ann', 'monday'] }, { budget: { steps: 20 } });
  assert.deepEqual([out.candidates.length, out.budget.kind], [0, 'budget']);
  const f = { verb: 'book', args: ['ink'] };
  assert.deepEqual(w.interpret(f).candidates.map((c) => c.verbWord ?? c.implied), [undefined, undefined]);
});

test('word forms: several text= forms on one word, and a host lemma function used before lookup', () => {
  const w = shopAndCalendar();
  w.tell('@sy9 core.word text=notebook text=notebooks text=pad means=notebook of=item.name  @nb item name=notebook stock=4');
  const read = (verb, arg) => w.interpret({ verb, args: [arg] }).candidates.map((c) => c.refer?.r1?.where.name ?? c.unresolved);
  assert.deepEqual(read('buy', 'notebooks'), ['notebook']);
  assert.deepEqual(read('buy', 'pad'), ['notebook']);
  // "biro's" is no form of biro: without a lemma function it is read as the near word biro
  assert.deepEqual(w.interpret({ verb: 'buy', args: ["biro's"] }).candidates[0].assumes, [{ word: "biro's", read: 'biro' }]);
  // a host lemma function (here: drop a possessive 's) makes it exact
  w.register('lemma', (t) => (t.endsWith("'s") ? [t.slice(0, -2)] : t));
  const exact = w.interpret({ verb: 'buy', args: ["biro's"] }).candidates[0];
  assert.deepEqual([exact.refer.r1.where.name, exact.assumes], ['pen', undefined]);
  // a known word is never lemmatized
  w.tell("@sy10 core.word text=\"biro's\" means=ink of=item.name");
  assert.deepEqual(read('buy', "biro's"), ['ink']);
  // examples write a word in its first form
  assert.ok(w.examples().some((e) => e.text === 'buy notebook'));
  assert.ok(!w.examples().some((e) => e.text === 'buy notebooks'));
});

test('core.word: a value written in another spelling names its canonical value (means= with of=); interpret returns the canonical one', () => {
  const w = shopAndCalendar();
  w.load('@k9 core.slot of=price key=unit enum=gbp enum=eur  @k10 core.slot of=price key=amount kind=number');
  w.tell('@b1 item name=ball stock=2');
  w.tell('@m1 core.word text=football text=footballs means=ball of=item.name  @m2 core.word text=pounds text=pound means=gbp of=price.unit  @m3 core.word text=cost means=price');
  assert.deepEqual(w.interpret({ verb: 'buy', args: ['footballs'] }).candidates.map((c) => c.refer), [{ r1: { type: 'item', where: { name: 'ball' } } }]);
  assert.deepEqual(w.interpret({ verb: 'cost', args: ['pounds'], numbers: [5] }).candidates.map((c) => c.wires), ['@new price unit=gbp amount=5']);
  assert.deepEqual(w.words().get('football')[0].meanings, [{ kind: 'value', type: 'item', key: 'name', value: 'ball' }]);
});

test('words keep their declaration order: words(), readings, examples; across forks, undo and snapshots', () => {
  const w = shopAndCalendar();
  w.tell('@b1 item name=ball stock=2');
  // the most usual first: "football", then "orb", then "globe" (not alphabetical)
  w.tell('@m1 core.word text=football means=ball of=item.name  @m2 core.word text=orb means=ball of=item.name  @m3 core.word text=globe means=ball of=item.name');
  const ballWords = (x) => [...x.words().entries()].filter(([, es]) => es.some((e) => e.means === 'ball')).map(([t]) => t);
  const orders = (x) => x.examples({}, { per: 9 }).filter((e) => e.tool.kind === 'type' && e.tool.type === 'order').map((e) => e.text);
  assert.deepEqual(ballWords(w), ['football', 'orb', 'globe']);
  assert.deepEqual(orders(w).filter((t) => t.startsWith('buy ')), ['buy biro', 'buy football', 'buy orb', 'buy globe', 'buy ink']);
  // a text with several meanings: readings in the order of its wires (book: reserve, then order)
  assert.deepEqual(w.interpret({ verb: 'book', args: ['pen'] }).candidates.map((c) => c.action ? 'action' : 'wires'), ['action', 'wires']);
  // the same order after a fork, a snapshot, an undo
  const f = w.fork(); f.tell('@x item name=x');
  const s = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  const u = w.fork(); u.tell('@m4 core.word text=bauble means=ball of=item.name'); u.undo();
  for (const x of [f, s, u]) assert.deepEqual([ballWords(x), orders(x)], [ballWords(w), orders(w)]);
  // retracted and told again: last
  w.retract('m1'); w.tell('@m1b core.word text=football means=ball of=item.name');
  assert.deepEqual(ballWords(w), ['orb', 'globe', 'football']);
});

test('R14.1: a split keeps a frame it cannot read as an unresolved part, so veto sees the words left out', () => {
  const w = new World();
  w.load('@k core.slot of=city key=name id=true\n@m core.slot of=mark key=at type=city required=true');
  w.tell('@paris city name=Paris  @w1 core.word text=mark means=mark  @w2 core.word text=undo means=mark.at');
  // "mark Paris then undo": "undo" is a known word that gives no reading as a verb here; "redo" is not a word at all
  for (const second of [{ verb: 'undo' }, { verb: 'redo', args: ['it'] }]) {
    const r = w.interpret([[{ verb: 'mark', args: ['Paris'] }, second]]);
    const c = r.candidates[0];
    assert.deepEqual([c.parts.length, c.parts[1].unread, c.unresolved], [2, true, [second.verb, ...(second.args || [])]]);
    const v = w.veto(w.score(r.candidates));
    assert.deepEqual([v.answer, v.reasons.map((x) => x.reason)], [false, ['words-left-out']]);
  }
  // a split that reads every frame it was given ranks above one with an unread part
  const s = w.score(w.interpret([
    [{ verb: 'mark', args: ['Paris'] }, { verb: 'undo' }],
    [{ verb: 'mark', args: ['Paris'] }],
  ]).candidates);
  assert.deepEqual([s.order, s.candidates[0].on], [[1, 0], 'words']);
});
