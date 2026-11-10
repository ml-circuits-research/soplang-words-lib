// Aggregates and time functions: node examples/aggregates.mjs
import { World, format, builtins } from '../src/index.mjs';
import { orders } from './orders.mjs';

const w = new World();
w.load(orders);
const summary = () => w.ofType('summary').map((s) => format(s).replace(/^@\S+ /, '')).join('\n  ');
w.load('@cu1 customer name=ana limit=50  @o1 order customer=ana');
w.load('@l1 line of=$o1 item=pen amount=3  @l2 line of=$o1 item=book amount=12');
console.log('two lines:\n ', summary());
w.load('@l3 line of=$o1 item=lamp amount=30');
console.log('a third line arrives:\n ', summary());
console.log('a fourth that breaks the limit ->', w.tell('@l4 line of=$o1 item=desk amount=45').violations[0].why);
w.retract('l3');
console.log('the lamp is taken off:\n ', summary());

console.log('\ntime_add(10:40, 35min) =', builtins.time_add(['10:40', '35min']));
console.log('time_add(2026-01-30, 3d) =', builtins.time_add(['2026-01-30', '3d']));
console.log('time_diff(14:30, 10:00) =', builtins.time_diff(['14:30', '10:00']));
console.log('weekday(2026-11-10) =', builtins.weekday(['2026-11-10']));
console.log('eq(5, 5.0) =', builtins.eq(['5', '5.0']), '  lt(9:05, 10:00) =', builtins.lt(['9:05', '10:00']));
