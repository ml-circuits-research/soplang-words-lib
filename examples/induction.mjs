import { World, induce, induceRule, induceSlots } from '../src/index.mjs';

console.log('== Induction: a rule from two examples ==');
const rule = induceRule([
  {
    when: '@a parent of=tom child=bob  @b parent of=bob child=ann',
    then: '@c grandparent of=tom child=ann',
  },
  {
    // the two parent wires come in the other order: alignment is searched for
    when: '@a parent of=eve child=joe  @b parent of=sue child=eve',
    then: '@c grandparent of=sue child=joe',
  },
], { name: 'grandparent' });
console.log(rule);

console.log('\n== The induced rule, used for deduction on new facts ==');
const w = new World();
console.log('rule accepted:', w.tell(rule).ok);
w.tell('@p1 parent of=ion child=maria  @p2 parent of=maria child=vlad');
console.log(w.ask('?g grandparent of=?who child=?child'));

console.log('\n== Induction: slots from observed wires ==');
console.log(induceSlots(`
@r1 room capacity=4
@r2 room capacity=12
@m1 meeting room=$r1 time=10:00 kind=standup
@m2 meeting room=$r2 time=14:00 kind=review
@m3 meeting room=$r2 time=10:00 kind=standup title="Budget"
`));

console.log('\n== Induction: a computed value is recognised ==');
const learned = induce([
  { when: '@l line qty=2 price=10', then: '@t total of=$l amount=20' },
  { when: '@l line qty=3 price=5', then: '@t total of=$l amount=15' },
  { when: '@l line qty=7 price=3', then: '@t total of=$l amount=21' },
], { name: 'line_total' });
console.log(learned.text);
const shop = new World();
shop.load(learned.text);
shop.tell('@l9 line qty=4 price=25');
console.log(shop.ask('?t total amount=?a'));

console.log('\n== Induction: a constraint from examples of forbidden states ==');
console.log(induce([
  { when: '@a booking room=r1 slot=9  @b booking room=r1 slot=9' },
  { when: '@a booking room=r7 slot=14  @b booking room=r7 slot=14' },
], { name: 'double_booking', kind: 'deny', why: 'two bookings of one room in one slot' }).text);
