// A second application written from the documentation alone (Round 24, B7): a recipe
// planner. Recipes and ingredients as a schema (std.schema / std.acts), ingredient amounts
// scaled by a rule when the servings change, a shopping view, the usual unit of an
// ingredient from a knowledge catalog by lookup, and requests through `turn`.
// Built from docs/quickstart.md, docs/capabilities.md, docs/reference.md and docs/api.md;
// where they were not enough is listed in worker-log.md (R24 B7). `node examples/second-app/recipes.mjs`
import { World, turn, createCatalog, bundleReader } from '../../src/index.mjs';

export const RECIPES = String.raw`
@acts core.use world=std.acts
@know core.use world=std.know
@kitchen std.schema.world name=kitchen doc="recipes and what they need"
@t.recipe core.type of=recipe extends=std.schema.thing closed=true
@s.recipe.name core.slot of=recipe key=name required=true
@s.recipe.serves core.slot of=recipe key=serves kind=number min=1 max=20 step=1 default=2
@t.ing core.type of=ingredient extends=std.schema.thing closed=true
@s.ing.name core.slot of=ingredient key=name required=true
@s.ing.of core.slot of=ingredient key=of type=recipe required=true
@s.ing.per core.slot of=ingredient key=per kind=number min=0
@s.ing.amount core.slot of=ingredient key=amount kind=number min=0
@s.ing.unit core.slot of=ingredient key=unit
@a.list std.schema.aspect name=list keys=name keys=amount keys=unit doc="an amount to buy"
@k.recipe std.schema.kind of=recipe world=kitchen acts=make acts=change acts=ask acts=remove
@k.ing std.schema.kind of=ingredient world=kitchen acts=make acts=change acts=remove acts=show acts=pick aspects=list
@v.shopping std.schema.view name=shopping shows=list

# the amount of an ingredient is its amount per serving times the servings of its recipe
@rs recipe serves=?n
@r ingredient of=$rs per=?p
@x core.calc out=?a fn=mul args=?p args=?n
@amt ingredient core.on=$r amount=?a
@scale core.rule when=$rs when=$r with=$x then=$amt
`;

// the usual unit of an ingredient: a tiny catalog in the knowledge layout (a bundle)
const files = {
  'k.food/schema.sop': '@k1 core.slot of=k.food.item key=name id=true\n@k2 core.slot of=k.food.item key=unit',
  'k.food/shards/basics.sop': '@flour k.food.item name=flour unit=g\n@milk k.food.item name=milk unit=ml\n@egg k.food.item name=egg unit=piece',
};
export const catalog = createCatalog({ index: { worlds: [{ id: 'k.food', schema: 'k.food/schema.sop', shards: [{ id: 'k.food/shards/basics', path: 'k.food/shards/basics.sop' }] }] }, vocab: { flour: ['k.food/shards/basics'], milk: ['k.food/shards/basics'], egg: ['k.food/shards/basics'] }, read: bundleReader({ files }) });

export function makeApp() { const w = new World(); w.load(RECIPES); return w; }

/** Add an ingredient to a recipe, its unit from the catalog. */
export function addIngredient(w, recipe, name, per) {
  catalog.intoSync(w, name);
  const unit = w.ofType('k.food.item').find((x) => x.attrs.name[0] === name)?.attrs.unit?.[0];
  return turn(w, [{ action: 'make', args: { kind: 'ingredient', name, of: '$' + recipe, per, ...(unit ? { unit } : {}) } }]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeApp();
  console.log(turn(w, [{ action: 'make', args: { kind: 'recipe', name: 'pancakes' } }]).replies.join(' '));
  for (const [n, per] of [['flour', 60], ['milk', 100], ['egg', 1]]) console.log(addIngredient(w, 'recipe1', n, per).replies.join(' '));
  const list = () => w.act({ action: 'show', args: { thing: 'ingredient', set: 'each', view: 'shopping' } }).result.things.map((t) => `${t.values.amount} ${t.values.unit} ${t.values.name}`).join(', ');
  console.log('shopping for 2:', list());
  console.log(turn(w, [{ action: 'change', args: { thing: 'recipe', attr: 'serves', value: 6 } }]).replies.join(' '));
  console.log('shopping for 6:', list());
  console.log(turn(w, [{ action: 'change', args: { thing: 'recipe', attr: 'colour', value: 'red' } }]).replies?.join(' ') ?? '');
}
