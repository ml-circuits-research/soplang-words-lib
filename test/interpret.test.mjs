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
