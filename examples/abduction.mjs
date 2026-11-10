import { World, adopt } from '../src/index.mjs';
import { garden, clinic } from './worlds.mjs';

const w = new World();
w.load(garden);

console.log('== Abduction: why is the lawn slippery? ==');
for (const e of w.abduce('?g slippery place=lawn')) console.log(' -', e.text);

console.log('\n== The same question in winter ==');
w.tell('@now season name=winter');
for (const e of w.abduce('?g slippery place=lawn')) console.log(' -', e.text);

console.log('\n== Adopt the only explanation left, and the observation follows ==');
const [best] = w.abduce('?g slippery place=lawn');
w.tell(best.assume);
console.log('slippery lawn holds:', w.holds('?g slippery place=lawn'));

console.log('\n== Diagnosis: assuming the value of an open key ==');
const c = new World();
c.load(clinic);
c.tell('@ion patient name=ion');
console.log('cough alone:', c.abduce('?s symptom of=$ion kind=cough').map((e) => e.text));
console.log('cough and fever:', c.abduce('?a symptom of=$ion kind=cough  ?b symptom of=$ion kind=fever').map((e) => e.text));
c.fill('ion', 'season', 'winter');
console.log('cough alone, in winter:', c.abduce('?s symptom of=$ion kind=cough').map((e) => e.text));
adopt(c, c.abduce('?s symptom of=$ion kind=cough')[0]);
console.log('adopted; predicted symptoms:', c.ask('?s symptom of=$ion kind=?k').map((x) => x.k));

console.log('\n== Through a calculation: how much was paid, if the change was 5? ==');
const till = new World();
till.load(`
@k_paid core.slot of=payment key=paid kind=number
@ab_paid core.abducible of=payment key=paid
?p payment paid=?paid total=?total
@c_change core.calc out=?chg fn=sub args=?paid args=?total
@ch change of=$p amount=?chg
@give_change core.rule when=$p with=$c_change then=$ch
`);
till.tell('@p1 payment total=15');
console.log('change of 5 on a total of 15:', till.abduce('?x change amount=5').map((e) => e.text));
