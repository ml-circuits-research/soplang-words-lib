// Dry run of learn-world-from-examples: example facts of a kind (here 12 animals of the published k.animals, read
// in place) → proposed slots (induceSlots: kinds, closed sets, many) → requests written without the schema read
// by types against it. node skills/learn-world-from-examples/scripts/dry-run.mjs
import { catalogWorld } from '../../../tools/worlds.mjs';
import { induceSlots, World, readByTypes } from '../../../src/index.mjs';
const k = await catalogWorld({ 'k.animals': ['k.animals.animal'] });
const examples = k.ofType('k.animals.animal').slice(0, 12);
const slots = induceSlots(examples);
console.log(`${examples.length} example animals → proposed slots:`);
console.log(String(slots.text ?? slots).split('\n').slice(0, 12).join('\n'));
const w = new World(); w.tell(examples.map((e) => `@${e.id.replace(/[^\w.]/g, '_')} ${e.type} ${Object.entries(e.attrs).filter(([key]) => !key.startsWith('core.')).map(([key, vs]) => vs.map((v) => `${key}=${v}`).join(' ')).join(' ')}`).join('\n'));
const names = examples.map((e) => String(e.attrs.name[0]).replace(/^"|"$/g, ''));
const keys = Object.keys(examples[0].attrs).filter((x) => !x.startsWith('core.') && x !== 'name');
const requests = names.slice(0, 4).flatMap((n) => keys.slice(0, 2).map((key) => `what is the ${key} of the ${n}?`));
let read = 0;
for (const r of requests) if (readByTypes(w, r, { question: ['what', 'is'], skip: ['the', 'of'] }).best?.answer?.length) read++;
console.log(`requests written without the schema (key × name): ${read}/${requests.length} read with an answer`);
