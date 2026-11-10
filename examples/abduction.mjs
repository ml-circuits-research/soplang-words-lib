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
