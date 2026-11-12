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
    @en1 core.word lang=en text=book means=reserve
    @en2 core.word lang=en text=book means=order
    @en3 core.word lang=en text=order means=order
    @en4 core.word lang=en text=meet means=meeting
    @en5 core.word lang=en text=with means=meeting.with
    @en6 core.word lang=en text=monday means=mon of=meeting.day
    @en7 core.word lang=en text=stock means=item.stock
    @ro1 core.word lang=ro text=rezervă means=reserve
    @ro2 core.word lang=ro text=comandă means=order
    @ro3 core.word lang=ro text=întâlnire means=meeting
    @ro4 core.word lang=ro text=cu means=meeting.with
    @ro5 core.word lang=ro text=luni means=mon of=meeting.day
    @ro6 core.word lang=ro text=pix means=pen of=item.name
    @ro7 core.word lang=ro text=stoc means=item.stock
  `);
  return w;
};
const strip = (cands) => cands.map(({ reading, used, unused, unresolved, verb, ...c }) => c);

test('interpret: a word with two meanings gives two candidates; score chooses by the world', () => {
  const w = shopAndCalendar();
  const r = w.interpret({ lang: 'en', verb: 'book', args: ['ink'] });
  assert.deepEqual(strip(r.candidates), [
    { action: 'reserve', args: { item: 'ink' } },
    { wires: '@new order item=$r1', refer: { r1: { type: 'item', where: { name: 'ink' } } } },
  ]);
  assert.deepEqual(r.candidates[0].reading, [{ word: 'ink', as: 'reserve.item' }]);
  // ink is out of stock: reserving it is refused, ordering it is not
  assert.deepEqual(w.score(r.candidates).order, [1, 0]);
});

test('interpret: roles, values, numbers and referents; the same frame in two languages gives the same candidates', () => {
  const w = shopAndCalendar();
  const en = w.interpret({ lang: 'en', verb: 'meet', args: [{ role: 'with', word: 'bob' }, 'monday'] });
  const ro = w.interpret({ lang: 'ro', verb: 'întâlnire', args: [{ role: 'cu', word: 'bob' }, 'luni'] });
  assert.deepEqual(strip(en.candidates), [{ wires: '@new meeting with=$r1 day=mon', refer: { r1: { type: 'person', where: { name: 'bob' } } } }]);
  assert.deepEqual(strip(ro.candidates), strip(en.candidates));
  const order = w.interpret({ lang: 'ro', verb: 'comandă', args: ['pix'], numbers: [2] });
  assert.deepEqual(strip(order.candidates), [{ wires: '@new order item=$r1 qty=2', refer: { r1: { type: 'item', where: { name: 'pen' } } } }]);
  const q = w.interpret({ lang: 'ro', verb: 'stoc', args: ['pix'], question: true });
  assert.deepEqual(strip(q.candidates), [{ question: { type: 'item', where: { name: 'pen' }, seek: 'stock' } }]);
  assert.equal(w.score(q.candidates).candidates[0].answer.value, '3');
});

test('interpret: unknown words stay unresolved and nothing is invented', () => {
  const w = shopAndCalendar();
  const r = w.interpret({ lang: 'en', verb: 'order', args: ['spoon', 'pen'] });
  assert.deepEqual(r.unresolved, ['spoon']);
  assert.deepEqual(strip(r.candidates), [{ wires: '@new order item=$r1', refer: { r1: { type: 'item', where: { name: 'pen' } } } }]);
  assert.deepEqual([r.candidates[0].used, r.candidates[0].unresolved], [['pen'], ['spoon']]);
  // a value for every key the candidate holds comes from a word or a number of the frame
  const frames = [
    { lang: 'en', verb: 'meet', args: ['ann', 'monday', 'pen'], numbers: [7] },
    { lang: 'en', verb: 'book', args: ['pen', 'ink'], numbers: [3, 4] },
    { lang: 'ro', verb: 'comandă', args: ['pix', 'luni'], numbers: [5] },
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
  w.tell('@bad core.word lang=en text=frob means=frobnicate  @bad2 core.word lang=en text=fri means=fri of=meeting.day');
  assert.deepEqual(w.warnings.filter((x) => x.kind === 'unknown-word').map((x) => x.id), ['bad', 'bad2']);
  assert.deepEqual(w.words('ro').get('pix')[0].meanings, [{ kind: 'value', type: 'item', key: 'name', value: 'pen' }]);
  w.undo();
  assert.equal(w.words('en').get('frob'), undefined, 'undone like any fact');
});

test('interpret: alternative splits of one message are scored as wholes; later parts see earlier ones', () => {
  const w = shopAndCalendar();
  w.tell('@en8 core.word lang=en text=reserve means=reserve  @en9 core.word lang=en text=add means=item');
  const before = [w.version, w.log.length];
  // "reserve the pen and order ink": two frames, or one frame with both nouns
  const r = w.interpret([
    [{ lang: 'en', verb: 'reserve', args: ['pen'] }, { lang: 'en', verb: 'order', args: ['ink'] }],
    [{ lang: 'en', verb: 'reserve', args: ['pen', 'ink'] }],
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
  w.tell('@ro8 core.word lang=ro text=marți means=tue of=meeting.day');
  const ex = w.examples('ro', { question: 'cât {verb} are {args}?' });
  assert.deepEqual(ex.map((e) => e.text), [
    'rezervă pix', 'rezervă ink',
    'comandă pix', 'comandă ink',
    'întâlnire cu ann luni', 'întâlnire cu ann marți', 'întâlnire cu bob luni',
    'cât stoc are pix?', 'cât stoc are ink?',
  ]);
  assert.deepEqual(ex[4].frame, { lang: 'ro', verb: 'întâlnire', args: [{ role: 'cu', word: 'ann' }, 'luni'] });
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
  const en = w.examples('en', { statement: ({ verb, args }) => `please ${verb} ${args.map((a) => a.text).join(' and ')}` }, { all: true, per: 1 });
  assert.ok(en.some((e) => e.text === 'please order pen and 1' && e.frame.numbers[0] === '1'));
});

test('near words: an unknown word is read as the nearest known one, as an assumption; known words are never corrected', () => {
  const w = shopAndCalendar();
  w.tell('@en8 core.word lang=en text=reserve means=reserve');
  const typo = w.interpret({ lang: 'en', verb: 'resreve', args: ['pne'] });
  assert.deepEqual(strip(typo.candidates), [{ action: 'reserve', args: { item: 'pen' }, assumes: [{ word: 'resreve', read: 'reserve' }, { word: 'pne', read: 'pen' }] }]);
  assert.deepEqual(typo.unresolved, []);
  const meet = w.score(w.interpret({ lang: 'en', verb: 'meet', args: [{ role: 'with', word: 'bbo' }, 'mondya'] }).candidates);
  assert.equal(meet.candidates[0].why, 'consistent with the world; every referent settled; lacks nothing; uses every word; assumes bbo is bob, mondya is monday');
  // exact readings rank first
  const both = w.score([...w.interpret({ lang: 'en', verb: 'order', args: ['inc'] }).candidates, ...w.interpret({ lang: 'en', verb: 'order', args: ['ink'] }).candidates]);
  assert.deepEqual([both.order, both.candidates[0].on], [[1, 0], 'assumes']);
  // bounds: 1 edit for words of 4 letters or fewer, 2 for longer; nothing near stays unresolved
  assert.deepEqual(w.interpret({ lang: 'en', verb: 'order', args: ['oxk'] }).unresolved, ['oxk']);
  assert.deepEqual(w.interpret({ lang: 'en', verb: 'ordxx', args: [] }).candidates.map((c) => c.assumes), [[{ word: 'ordxx', read: 'order' }]]);
  // no wrong reading where there was none before: frames of known words read the same with or without near words
  const frames = [
    { lang: 'en', verb: 'book', args: ['ink'] }, { lang: 'en', verb: 'meet', args: ['ann', 'monday'] },
    { lang: 'ro', verb: 'comandă', args: ['pix'], numbers: [2] }, { lang: 'ro', verb: 'stoc', args: ['pix'], question: true },
    { lang: 'en', verb: 'order', args: ['pen', 'ink'] },
  ];
  for (const f of frames) assert.deepEqual(w.interpret(f).candidates, w.interpret(f, { near: false }).candidates, JSON.stringify(f));
});

test('follow-ups: corrections, ellipsis, "the other one", and a change to the last statement', () => {
  const w = shopAndCalendar();
  w.load('@k7 core.slot of=order key=color enum=red enum=blue  @k8 core.slot of=order key=note many=true enum=gift enum=urgent');
  w.tell('@en10 core.word lang=en text=price means=item.price  @en11 core.word lang=en text=tuesday means=tue of=meeting.day');
  w.revise('i1', 'price', '2');
  const pick = (r) => r.candidates.map(({ reading, used, unused, unresolved, verb, ...c }) => c);
  // "no, red": replaces the colour of the previous frame, keeps the item and the verb
  const prev = { lang: 'en', verb: 'order', args: ['pen', 'blue'] };
  assert.deepEqual(pick(w.interpret({ lang: 'en', args: ['red'], correction: true }, { previous: prev })), [
    { wires: '@new order color=red item=$r1', refer: { r1: { type: 'item', where: { name: 'pen' } } }, inherited: { words: ['pen'], verb: 'order' }, replaced: ['blue'] },
  ]);
  // in a many slot a follow-up adds and a correction replaces
  const gift = { lang: 'en', verb: 'order', args: ['pen', 'gift'] };
  assert.match(w.interpret({ lang: 'en', args: ['urgent'], anaphor: true }, { previous: gift }).candidates[0].wires, /note=urgent item=\$r1 note=gift/);
  assert.deepEqual(w.interpret({ lang: 'en', args: ['urgent'], correction: true }, { previous: gift }).candidates[0].replaced, ['gift']);
  // "and the price?": the question keeps its subject
  const q = w.interpret({ lang: 'en', verb: 'price', question: true }, { previous: { lang: 'en', verb: 'stock', args: ['pen'], question: true } });
  assert.deepEqual(pick(q)[0].question, { type: 'item', where: { name: 'pen' }, seek: 'price' });
  assert.equal(w.score(q.candidates).candidates[0].answer.value, '2');
  // "the other one": another wire of the same type than the one the previous reading resolved to
  const other = w.score(w.interpret({ lang: 'en', other: true }, { previous: { frame: { lang: 'en', verb: 'meet', args: ['bob', 'tuesday'] }, ids: ['p2'] } }).candidates);
  assert.deepEqual(other.candidates[0].referents.map((x) => x.ids), [['p1']]);
  // "tuesday" after a told meeting: revise it
  w.tell('@mt meeting with=$p2 day=mon');
  const told = w.interpret({ lang: 'en', args: ['tuesday'] }, { previous: 'told' });
  assert.deepEqual(pick(told), [{ revise: { id: 'mt', values: { day: 'tue' } }, inherited: { words: [], wire: 'mt' }, replaced: [] }]);
  assert.deepEqual([w.score(told.candidates).candidates[0].ok, w.get('mt').attrs.day], [true, ['mon']], 'scored, not told');
  // no wrong reading where there was none: a full frame is not a follow-up
  const full = { lang: 'en', verb: 'meet', args: ['ann', 'monday'] };
  assert.deepEqual(w.interpret(full, { previous: prev }).candidates, w.interpret(full).candidates);
});

test('loose words: a bag with no verb order is read with each verb word and each implied tool; ranked by words used; bounded', () => {
  const w = shopAndCalendar();
  const read = (f) => { const r = w.interpret(f); const s = w.score(r.candidates); return s.order.map((i) => [r.candidates[i].action || r.candidates[i].wires, r.candidates[i].verbWord || `implied ${r.candidates[i].implied}`, s.candidates[i].on || 'first']); };
  assert.deepEqual(read({ lang: 'en', words: ['pen', 'order'], numbers: [2] }), [
    ['@new order item=$r1 qty=2', 'order', 'first'],
    ['reserve', 'implied reserve', 'words'],
  ]);
  assert.deepEqual(read({ lang: 'en', words: ['bob', 'monday', 'meet'] }), [['@new meeting with=$r1 day=mon', 'meet', 'first']]);
  assert.deepEqual(read({ lang: 'en', words: ['monday', 'bob'] }), [['@new meeting day=mon with=$r1', 'implied meeting', 'first']]);
  assert.deepEqual(read({ lang: 'en', words: ['pen'] }), [['reserve', 'implied reserve', 'first'], ['@new order item=$r1', 'implied order', 'assumes']]);
  const q = w.interpret({ lang: 'en', words: ['pen', 'stock'], question: true });
  assert.deepEqual(q.candidates.map((c) => c.question), [{ type: 'item', where: { name: 'pen' }, seek: 'stock' }]);
  // charged to the budget, and a frame with a verb is read as before
  const out = w.interpret({ lang: 'en', words: ['pen', 'ink', 'bob', 'ann', 'monday'] }, { budget: { steps: 20 } });
  assert.deepEqual([out.candidates.length, out.budget.kind], [0, 'budget']);
  const f = { lang: 'en', verb: 'book', args: ['ink'] };
  assert.deepEqual(w.interpret(f).candidates.map((c) => c.verbWord ?? c.implied), [undefined, undefined]);
});

test('word forms: several text= forms on one word, and a host lemma function used before lookup', () => {
  const w = shopAndCalendar();
  w.tell('@ro9 core.word lang=ro text=caiet text=caietul text=caiete means=notebook of=item.name  @nb item name=notebook stock=4');
  const read = (verb, arg) => w.interpret({ lang: 'ro', verb, args: [arg] }).candidates.map((c) => c.refer?.r1?.where.name ?? c.unresolved);
  assert.deepEqual(read('comandă', 'caietul'), ['notebook']);
  assert.deepEqual(read('comandă', 'caiete'), ['notebook']);
  // "pixul" (the pen) is no form of pix: without a lemma function it is read as the near word pix
  assert.deepEqual(w.interpret({ lang: 'ro', verb: 'comandă', args: ['pixul'] }).candidates[0].assumes, [{ word: 'pixul', read: 'pix' }]);
  // a host lemma function (here: drop a definite article -ul) makes it exact
  w.register('lemma', 'ro', (t) => (t.endsWith('ul') ? [t.slice(0, -2)] : t));
  const exact = w.interpret({ lang: 'ro', verb: 'comandă', args: ['pixul'] }).candidates[0];
  assert.deepEqual([exact.refer.r1.where.name, exact.assumes], ['pen', undefined]);
  // a known word is never lemmatized, and other languages are untouched
  w.tell('@ro10 core.word lang=ro text=pixul means=ink of=item.name');
  assert.deepEqual(read('comandă', 'pixul'), ['ink']);
  assert.deepEqual(w.interpret({ lang: 'en', verb: 'order', args: ['penul'] }).candidates[0].assumes, [{ word: 'penul', read: 'pen' }], 'no lemma for en: only a near word');
  // examples write a word in its first form
  assert.ok(w.examples('ro').some((e) => e.text === 'comandă caiet'));
  assert.ok(!w.examples('ro').some((e) => e.text === 'comandă caietul'));
});

test('core.word: a value in another language names its canonical value (means= with of=); interpret returns the canonical one', () => {
  const w = shopAndCalendar();
  w.load('@k9 core.slot of=price key=unit enum=leu enum=euro  @k10 core.slot of=price key=amount kind=number');
  w.tell('@b1 item name=ball stock=2');
  w.tell('@m1 core.word lang=ro text=minge text=mingea means=ball of=item.name  @m2 core.word lang=ro text=lei text=leu means=leu of=price.unit  @m3 core.word lang=ro text=preț means=price');
  assert.deepEqual(w.interpret({ lang: 'ro', verb: 'comandă', args: ['mingea'] }).candidates.map((c) => c.refer), [{ r1: { type: 'item', where: { name: 'ball' } } }]);
  assert.deepEqual(w.interpret({ lang: 'ro', verb: 'preț', args: ['lei'], numbers: [5] }).candidates.map((c) => c.wires), ['@new price unit=leu amount=5']);
  assert.deepEqual(w.words('ro').get('minge')[0].meanings, [{ kind: 'value', type: 'item', key: 'name', value: 'ball' }]);
});

test('words keep their declaration order: words(), readings, examples; across forks, undo and snapshots', () => {
  const w = shopAndCalendar();
  w.tell('@b1 item name=ball stock=2');
  // the most usual first: "minge", then "zar", then "bilă" (not alphabetical)
  w.tell('@m1 core.word lang=ro text=minge means=ball of=item.name  @m2 core.word lang=ro text=zar means=ball of=item.name  @m3 core.word lang=ro text=bilă means=ball of=item.name');
  const ballWords = (x) => [...x.words('ro').entries()].filter(([, es]) => es.some((e) => e.means === 'ball')).map(([t]) => t);
  const orders = (x) => x.examples('ro', {}, { per: 9 }).filter((e) => e.tool.kind === 'type' && e.tool.type === 'order').map((e) => e.text);
  assert.deepEqual(ballWords(w), ['minge', 'zar', 'bilă']);
  assert.deepEqual(orders(w), ['comandă pix', 'comandă minge', 'comandă zar', 'comandă bilă', 'comandă ink']);
  // a text with several meanings: readings in the order of its wires (book: reserve, then order)
  assert.deepEqual(w.interpret({ lang: 'en', verb: 'book', args: ['pen'] }).candidates.map((c) => c.action ? 'action' : 'wires'), ['action', 'wires']);
  // the same order after a fork, a snapshot, an undo
  const f = w.fork(); f.tell('@x item name=x');
  const s = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  const u = w.fork(); u.tell('@m4 core.word lang=ro text=sferă means=ball of=item.name'); u.undo();
  for (const x of [f, s, u]) assert.deepEqual([ballWords(x), orders(x)], [ballWords(w), orders(w)]);
  // retracted and told again: last
  w.retract('m1'); w.tell('@m1b core.word lang=ro text=minge means=ball of=item.name');
  assert.deepEqual(ballWords(w), ['zar', 'bilă', 'minge']);
});
