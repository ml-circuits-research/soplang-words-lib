// Compatibility check: the PSys2 legends and knowledge bases in this directory load
// through mapping.sop, unchanged, with no violation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { World, parse } from '../../tools/lib-under-test.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const dir = join(here, 'worlds');

/** A world with mapping.sop and every legend of compat/psys2/worlds, loaded in import order. */
export function loadLegends(options = {}) {
  const texts = new Map(); // namespace -> { text, imports, world }
  for (const name of readdirSync(dir)) {
    const file = join(dir, name, 'legend.sop');
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const head = parse(text).find((x) => x.type === 'core.legend');
    texts.set(head?.attrs.namespace?.[0] || name, { text, imports: head?.attrs.imports || [], world: name });
  }
  const order = [];
  const visit = (ns, trail = []) => {
    if (order.includes(ns) || !texts.has(ns) || trail.includes(ns)) return;
    for (const i of texts.get(ns).imports) visit(i, [...trail, ns]);
    order.push(ns);
  };
  for (const ns of texts.keys()) visit(ns);
  const w = new World(options);
  w.load(readFileSync(join(here, 'mapping.sop'), 'utf8'));
  const refused = [];
  for (const ns of order) {
    const r = w.tell(texts.get(ns).text);
    if (!r.ok) refused.push({ legend: ns, violations: r.violations.slice(0, 5) });
  }
  return { world: w, order, refused, texts };
}

test('psys2 compat: every legend loads through the mapping with 0 violations', () => {
  const { world: w, order, refused } = loadLegends();
  console.log(`# legends loaded in this order: ${order.join(', ')}`);
  console.log(`# ${w._compiled().types.size} types, ${[...w.matrix.values()].filter((x) => x.type === 'core.key').length} keys, ${refused.length} legends refused`);
  assert.deepEqual(refused, []);
  assert.ok(order.indexOf('core') === 0, 'core is loaded first');
  assert.ok(w.schema('kids.arith.holding'), 'a PSys2 type is known');
  assert.ok(w.schema('kids.arith.holding').lineage.includes('core.thing'), 'and it descends from core.thing');
});

test('psys2 compat: the knowledge bases load; violations are reported per world', () => {
  const { world: w, order, texts } = loadLegends();
  const c = w._compiled();
  let wires = 0, violations = 0, values = 0, checked = 0;
  for (const ns of order) {
    const file = join(dir, texts.get(ns).world, 'kb.sop');
    if (!existsSync(file)) continue;
    const r = w.tell(readFileSync(file, 'utf8'));
    wires += r.added.length;
    violations += r.violations.length;
    console.log(`# kb ${ns}: ${r.ok ? `ok, ${r.added.length} wires` : `${r.violations.length} violations`}`);
    for (const v of r.violations.slice(0, 20)) console.log(`#   ${v.kind} ${v.id || ''} ${v.key || ''} ${v.value || ''} ${v.why || ''}`);
  }
  for (const x of w.wires.values()) for (const k of Object.keys(x.attrs)) { values += x.attrs[k].length; if (c.slots.get(x.type)?.get(k)) checked += x.attrs[k].length; }
  console.log(`# kb total: ${wires} wires, ${violations} violations; ${checked} of ${values} key values fall under a declared key`);
  assert.equal(violations, 0);
});
