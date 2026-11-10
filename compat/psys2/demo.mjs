// What a host gets from the matrices beyond the answers PSys2 gives today.
//   node compat/psys2/demo.mjs
import { build } from './run.mjs';

const show = (title, ...lines) => console.log(`\n== ${title} ==\n` + lines.map((l) => '  ' + (typeof l === 'string' ? l : JSON.stringify(l))).join('\n'));
const balance = (w) => w.query({ type: 'kids.shop.balance', seek: 'amount' }).value;
const at = (n) => `core.in=$kids.shop core.seq=${n}`;

// 1. a missing argument comes back as a question
const tasks = (await build('kids.tasks'))();
const r1 = tasks.act({ action: 'tasks.add', args: { list: 'shopping' } });
show('1. A missing argument is asked for', `act tasks.add without an item -> ${r1.status}`, r1.missing[0]);

// 2. a default is an assumption: a later statement withdraws it and what followed from it
const shop = (await build('kids.shop'))();
shop.tell(`@m kids.shop.money count=20 unit=leu ${at(1)}`);
const s2 = shop.step(`@b kids.shop.purchase item=ball ${at(2)}`);
const before = balance(shop);
const f2 = shop.fill('b', 'count', 3);
show('2. A default withdrawn by a later statement',
  `"I buy a ball" -> assumed ${s2.filled.filter((f) => f.id === 'b').map((f) => `${f.key}=${f.value}`).join(', ')} by default; money left ${before}`,
  `"...three of them" -> ok ${f2.ok}, count=${shop.get('b').attrs.count}; money left ${balance(shop)}`);

// 3. retract is undo: the purchase goes, and everything that followed from it
const r3 = shop.retract('b');
show('3. Retract as undo', `retract the purchase -> removed ${r3.removed.length} wires (the purchase, its part, line, cost and spending); money left ${balance(shop)}`);

// 4. an answer can be explained down to the statements it rests on
shop.tell(`@p kids.shop.price item=kite cost=4 ${at(3)}`);
const a4 = shop.query({ type: 'kids.shop.total', seek: 'total', where: { item: 'kite', count: 2, item2: 'pencil', count2: 3 } });
shop.tell(`@b2 kids.shop.purchase item=kite count=2 ${at(4)}`);
const cost = shop.ofType('shop.cost')[0];
const tree = (n, d = 0) => [`${'  '.repeat(d)}${n.wire}${n.via ? `   <- ${n.via}` : n.told ? '   (told)' : ''}`, ...(n.from || []).flatMap((x) => tree(x, d + 1))];
show('4. Explain', `2 kites and 3 pencils cost ${a4.value} (${a4.status}, via ${a4.via.join(", ")}); the cost of a purchase of 2 kites, explained:`, ...tree(shop.explain(cost.id)).slice(0, 8));

// 5. abduction: what would have to be true for this to hold?
shop.tell(`@c kids.shop.change item=book count=1 ${at(5)}`);
const e5 = shop.abduce('?x kids.shop.change amount=5');
show('5. Abduction', `"I got 5 lei back for a book. What did I pay?" -> ${e5.map((e) => e.text).join(' | ')}`);

// 6. an operation written as wires: buying is a guard and a write, no function
const shop2 = (await build('kids.shop'))();
shop2.load(`
?buy.w shop.wallet amount=?money core.in=?in
?buy.p kids.shop.price item=?item cost=?each
@buy.c core.calc out=?due fn=mul args=?each args=?count
@buy.ok core.check fn=gte args=?money args=?due why="there is not enough money for it"
@buy.new kids.shop.purchase item=?item count=?count core.in=?in core.seq=?at
@buy core.action name=shop.buy param=item param=count param=at when=$buy.w when=$buy.p with=$buy.c if=$buy.ok add=$buy.new returns=?due
`);
shop2.tell(`@m kids.shop.money count=20 unit=leu ${at(1)}`);
const b1 = shop2.act({ action: 'shop.buy', args: { item: 'book', count: 1, at: 2 } });
const b2 = shop2.act({ action: 'shop.buy', args: { item: 'book', count: 1, at: 3 } });
show('6. An action written as wires',
  `buy a book with 20 lei -> ${b1.status}, cost ${b1.value}; money left ${balance(shop2)}`,
  `buy another -> ${b2.status}: ${b2.violations[0].why}; money left ${balance(shop2)}`);
