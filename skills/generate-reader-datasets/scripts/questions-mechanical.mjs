// questions-mechanical.mjs — the read-path question batch: questions the reader
// must answer without any tool call (count / exists / values / colour over the
// observed world). Seeds are minted mechanically from the UI kind inventories
// (per area, per queryable kind, per query operation); variants are deterministic
// question shapes that CLAIM their own operative phrase as the constraint
// surface, so labels ride the same assembler as everything else.
//
// Usage: node questions-mechanical.mjs --inventory <coverage.json>
//                     [--out-seeds question-seeds.jsonl]
//                     [--out-variants variants/questions.jsonl]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const inventoryPath = arg('inventory');
if (!inventoryPath) { console.error('usage: questions-mechanical.mjs --inventory <coverage.json>'); process.exit(1); }
const OUT_SEEDS = arg('out-seeds', 'question-seeds.jsonl');
const OUT_VARIANTS = arg('out-variants', 'variants/questions.jsonl');
const native = JSON.parse(readFileSync(inventoryPath, 'utf8')).nativeInventory;

const KINDS_BY_AREA = {
  drawing: ['circle', 'square', 'rectangle', 'triangle', 'star', 'heart', 'line', 'arrow', 'lake', 'house', 'tree', 'sun', 'cloud', 'car', 'flower', 'cat', 'dog', 'fish', 'bird', 'boat', 'person', 'balloon', 'rocket', 'moon'],
  diagram: ['circle', 'rectangle', 'square', 'diamond', 'ellipse', 'triangle', 'hexagon', 'star', 'text'],
  document: ['paragraph', 'heading', 'quote', 'section', 'table'],
  calendar: ['meeting', 'calendar', 'person', 'room'],
  avatar: ['face', 'part', 'preset'],
};
const OPERATIONS = {
  count: { phrase: 'how many', shapes: (k) => [
    { text: `How many ${k}s are there?`, surface: 'How many' },
    { text: `Tell me the number of ${k}s.`, surface: 'number' },
    { text: `Count the ${k}s for me.`, surface: 'Count' },
    { text: `Of the things on display, how many are ${k}s?`, surface: 'how many' },
  ] },
  exists: { phrase: 'is there', shapes: (k) => [
    { text: `Is there ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k}?`, surface: 'Is there' },
    { text: `Do we have ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k} anywhere?`, surface: 'Do we have' },
    { text: `Any ${k} at all?`, surface: 'Any' },
    { text: `Does ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${k} exist?`, surface: 'exist' },
  ] },
  values: { phrase: 'which', shapes: (k) => [
    { text: `What ${k}s are there?`, surface: 'What' },
    { text: `Which ${k}s do we have?`, surface: 'Which' },
    { text: `List the ${k}s.`, surface: 'List' },
    { text: `Show me every ${k}.`, surface: 'Show' },
  ] },
  colour: { phrase: 'what colour', shapes: (k) => [
    { text: `What colour is the ${k}?`, surface: 'What colour' },
    { text: `What colour are the ${k}s?`, surface: 'What colour' },
    { text: `The ${k} — what colour is it?`, surface: 'what colour' },
    { text: `Colour of the ${k}, please.`, surface: 'Colour' },
  ] },
};

const seeds = [];
const variants = [];
let seq = 0;
for (const area of Object.keys(KINDS_BY_AREA).sort()) {
  const prefix = { drawing: 'drawn', diagram: 'node', document: 'block', calendar: 'meeting', avatar: 'part' }[area];
  for (const kind of KINDS_BY_AREA[area]) {
    for (const [op, def] of Object.entries(OPERATIONS)) {
      if (op === 'colour' && !['drawing', 'diagram'].includes(area)) continue;
      const seedId = `q-${String(++seq).padStart(4, '0')}`;
      seeds.push({
        format: 'sopskill.seed/1', seedId, area,
        operation: `${prefix}.observe`, act: 'ask', nativeAct: 'ask', on: `${prefix}`,
        target: { kind, kindValue: kind, mode: 'existing' },
        constraints: [{ n: 0, key: `${prefix}.operation`, value: op, surface: def.phrase, phase: 'result', optional: false, operator: 'eq', polarity: 'positive', character: 'requirement' }],
        canonicalText: def.shapes(kind)[0].text, executed: false, tier: 'question',
      });
      for (const shape of def.shapes(kind)) {
        variants.push({ seedId, tier: 'mechanical-question', text: shape.text, surfaces: { kind, '0': shape.surface } });
      }
    }
  }
}
mkdirSync(dirname(OUT_SEEDS), { recursive: true });
mkdirSync(dirname(OUT_VARIANTS), { recursive: true });
writeFileSync(OUT_SEEDS, seeds.map((s) => JSON.stringify(s)).join('\n') + '\n');
writeFileSync(OUT_VARIANTS, variants.map((v) => JSON.stringify(v)).join('\n') + '\n');
console.log(`question seeds: ${seeds.length}, question variants: ${variants.length}`);
