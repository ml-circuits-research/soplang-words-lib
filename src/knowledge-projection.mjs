import { fitsKind } from './matrix.mjs';
import { parse, serialize, str } from './parser.mjs';

const prefix = 'std.knowledge.';
const first = (wire, key) => wire.attrs[key]?.[0];
const unavailable = reason => '@compile.result std.compile.result status=unavailable reason=' + reason + '\n';
const catalogCache = new WeakMap();
const MAX_MODULES = 64;
const MAX_SOURCE = 2_000_000;
const MAX_ROWS = 4096;

async function catalogWorld(World, catalog, module) {
  let cache = catalogCache.get(catalog);
  if (!cache) catalogCache.set(catalog, cache = new Map());
  if (!cache.has(module)) {
    const pending = (async () => {
      const library = Object.create(null), seen = new Set();
      let bytes = 0;
      async function load(id) {
        if (seen.has(id)) return;
        if (seen.size >= MAX_MODULES) throw Error('catalog module budget');
        seen.add(id);
        const entry = await catalog.world(id);
        if (!entry?.schema || !Array.isArray(entry.depends)) throw Error('missing catalog module');
        const [text] = await Promise.all([catalog.readText(entry.schema), ...entry.depends.map(load)]);
        if (typeof text !== 'string' || !text.length || (bytes += text.length) > MAX_SOURCE) throw Error('invalid catalog schema');
        library[id] = text;
      }
      await load(module);
      const world = new World({library});
      if (!world.use(module).ok) throw Error('invalid catalog matrix');
      return world;
    })();
    cache.set(module, pending);
    pending.catch(() => cache.delete(module));
  }
  return cache.get(module);
}

function projection(world, wires) {
  const requests = wires.filter(w => w.type === prefix + 'request');
  if (requests.length !== 1 || !world.schema(prefix + 'request')) return null;
  const [request] = requests;
  const profile = world.get(first(request, 'profile')?.slice(1));
  if (profile?.type !== prefix + 'profile') return null;
  const bindingRefs = new Set(request.attrs.binding || []);
  if (new Set(wires.map(w => w.id)).size !== wires.length || bindingRefs.size !== wires.length - 1 || wires.some(w => w.pattern || world.has(w.id) || world.matrix.has(w.id) ||
      Object.keys(w.attrs).some(key => key.startsWith('core.')) ||
      (w !== request && (w.type !== prefix + 'binding' || !bindingRefs.has('$' + w.id))))) return null;
  if (!world.fork().tell(wires,{factsOnly:true}).ok) return null;
  const steps = {};
  for (const kind of ['input','read','select']) {
    steps[kind] = (profile.attrs[kind] || []).map(ref => world.get(ref.slice(1)));
    if (steps[kind].some(step => step?.type !== prefix + kind)) return null;
  }
  if (!steps.select.length || Object.values(steps).flat().length > MAX_MODULES) return null;
  const names = new Set(Object.values(steps).flat().map(step => first(step,'param')));
  const bindings = new Map();
  for (const wire of wires) {
    if (wire === request) continue;
    const param = first(wire,'param');
    if (!names.has(param) || bindings.has(param)) return null;
    bindings.set(param, new Map(wire.attrs.value.map(value => [str(value), value])));
  }
  return { module: first(profile,'module'), steps, bindings };
}

function matches(row, step, values) {
  return row.type === first(step,'type') && (row.attrs[first(step,'key')] || []).some(value => values.has(str(value)));
}

export async function compileKnowledgeProjection(world, wires, catalog) {
  const plan = projection(world, wires);
  if (!plan || !['world','readText','wireSource'].every(key => typeof catalog?.[key] === 'function')) return unavailable('knowledge-request');
  const {module, steps, bindings} = plan;
  const termCount = [...bindings.values()].reduce((count, values) => count + values.size, 0);
  if (termCount > MAX_ROWS) return unavailable('knowledge-budget');
  if (!steps.select.some(step => bindings.has(first(step, 'param')))) return '';
  let base, sources;
  try {
    [base, sources] = await Promise.all([
      catalogWorld(world.constructor, catalog, module),
      Promise.all(steps.read.map(async step => {
        const values = bindings.get(first(step,'param'));
        return values?.size ? await catalog.wireSource(first(step,'type'),{keys:[...values.keys()]}) : '';
      })),
    ]);
    if (sources.some(source => typeof source !== 'string') || sources.reduce((sum, source) => sum + source.length, 0) > MAX_SOURCE) {
      return unavailable('knowledge-budget');
    }
  } catch (error) {
    if (error?.name === 'BudgetExceeded' || error?.name === 'TurnAborted') throw error;
    return unavailable('knowledge-catalog');
  }
  const room = base.fork();
  const facts = new Map();
  try {
    let count = 0;
    for (const [index, source] of sources.entries()) {
      for (const row of parse(source)) {
        if (++count > MAX_ROWS) return unavailable('knowledge-budget');
        const step = steps.read[index];
        if (row.pattern || row.type !== first(step,'type') || !room.schema(row.type)?.closed) return unavailable('knowledge-source');
        if (matches(row,step,bindings.get(first(step,'param')))) {
          const prior = facts.get(row.id);
          if (prior && serialize([prior]) !== serialize([row])) return unavailable('knowledge-source');
          facts.set(row.id,row);
        }
      }
    }
  } catch {
    return unavailable('knowledge-source');
  }
  const inputs = [];
  let serial = 0;
  for (const step of steps.input) {
    for (const value of bindings.get(first(step,'param'))?.values() || []) {
      if (facts.size + inputs.length >= MAX_ROWS) return unavailable('knowledge-budget');
      let id;
      do {
        if (serial >= MAX_ROWS * 2) return unavailable('knowledge-budget');
        id = 'knowledge.input.' + serial++;
      } while (facts.has(id) || room.has(id) || room.matrix.has(id)); // bounded: at most twice the row limit across all inputs
      inputs.push({id,type:first(step,'type'),attrs:{[first(step,'key')]:[value]}});
    }
  }
  for (const step of Object.values(steps).flat()) {
    const schema = room.schema(first(step,'type'));
    if (!schema || !Object.hasOwn(schema.keys, first(step,'key'))) return unavailable('knowledge-profile');
  }
  const told = room.tell([...facts.values(), ...inputs],{factsOnly:true});
  if (!told.ok) return unavailable(told.violations.some(v => v.kind === 'budget') ? 'knowledge-budget' : 'knowledge-source');

  const selected = new Map();
  for (const step of steps.select) {
    const values = bindings.get(first(step,'param'));
    if (!values?.size) continue;
    for (const row of room.ofType(first(step,'type'))) {
      if (row.meta?.via && matches(row,step,values)) selected.set(row.id,row);
    }
  }
  if (selected.size > MAX_ROWS) return unavailable('knowledge-budget');
  const evidence = new Map();
  const pending = [...selected.values()];
  for (const row of pending) {
    for (const ref of Object.values(row.attrs).flat().filter(value => fitsKind('ref',value))) {
      const target = room.get(ref.slice(1));
      if (!target) return unavailable('knowledge-evidence');
      if (selected.has(target.id) || evidence.has(target.id)) continue;
      if (pending.length >= MAX_ROWS) return unavailable('knowledge-budget');
      evidence.set(target.id,target);
      pending.push(target);
    }
  }
  return serialize([...evidence.values(), ...selected.values()]);
}
