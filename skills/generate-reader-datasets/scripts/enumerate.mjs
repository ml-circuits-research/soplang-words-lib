// enumerate.mjs — systematic seed enumeration from a declared native inventory and
// (optional) the catalog's own request vocabulary. Two vocabulary layers:
//   1. wire-level: every non-legacy operation × its required parameters × optional
//      subsets (pairwise + a few triples, capped by --max-subsets), kind-like enum
//      parameters expanded EXHAUSTIVELY (every button value the UI offers);
//   2. value-level: the knowledge worlds' declared vocabulary (--vocabulary, built
//      by vocabulary.mjs from core.word wires): catalog object kinds become seeds
//      of their own ("add a beach umbrella"), so the reader trains on the words the
//      worlds KNOW, not only on wire-type enums. Capped at --max-catalog-kinds per
//      operation so the inventory stays a file, not a spaceship.
// Numbers use a documented deterministic grid (coordinates are infinite; the grid
// is the choice, stated in the dataset README). Order is deterministic.
//
// Usage:
//   node enumerate.mjs --inventory <coverage.json> [--max-subsets 8]
//                     [--vocabulary vocabulary.json] [--max-catalog-kinds 120]
//                     [--select 120] [--areas drawing,calendar] [--out seeds.jsonl]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const inventoryPath = arg('inventory');
if (!inventoryPath) { console.error('usage: enumerate.mjs --inventory <coverage.json> --vocabulary <vocabulary.json>'); process.exit(1); }
const MAX_SUBSETS = Number(arg('max-subsets', 8));
const VOCAB_PATH = arg('vocabulary', '');
const MAX_CATALOG = Number(arg('max-catalog-kinds', 120));
const SELECT = Number(arg('select', 0));
const AREAS = (arg('areas', 'all') || 'all').split(',');
const OUT = arg('out', 'seeds.jsonl');

const native = JSON.parse(readFileSync(inventoryPath, 'utf8')).nativeInventory;
const vocab = VOCAB_PATH ? JSON.parse(readFileSync(VOCAB_PATH, 'utf8')) : null;

const ACTS = { make: 'make', change: 'change', pick: 'select', remove: 'remove', move: 'place', group: 'group', ungroup: 'ungroup', clear: 'remove', show: 'change', link: 'connect', compose: 'make', toggle: 'change' };
const NOUNS = { 'ui.avatar.face': 'avatar', 'ui.avatar.part': 'part', 'art.draw.object': 'object', 'diagram.sketch.node': 'node', 'diagram.sketch.group': 'group', 'docs.editor.document': 'document', 'docs.editor.block': 'block', 'docs.editor.section': 'section', 'docs.editor.table': 'table', 'time.calendar.meeting': 'meeting', 'time.calendar.calendar': 'calendar', 'time.calendar.room': 'room', 'time.calendar.person': 'person' };
const nounFor = (on, area) => NOUNS[on] || (on ? on.split('.').pop() : area);
const KINDISH = new Set(['kind', 'base', 'preset', 'layout', 'style', 'shape', 'variant', 'characterKind', 'mode', 'type', 'grade']);
const selectorKeys = new Set(['id', 'ids', 'from', 'to', 'at', 'part', 'target', 'face']);
const VERBS = {
  drawing: { make: 'add', change: 'change', pick: 'select', remove: 'remove', move: 'move', group: 'group', ungroup: 'ungroup', clear: 'reset', show: 'toggle', observe: 'read' },
  diagram: { make: 'add', change: 'change', pick: 'select', remove: 'remove', move: 'move', group: 'group', ungroup: 'ungroup', clear: 'reset', link: 'connect', observe: 'read' },
  document: { make: 'add', change: 'change', pick: 'select', remove: 'remove', move: 'move', group: 'group', clear: 'reset', compose: 'write', observe: 'read' },
  calendar: { make: 'add', change: 'change', pick: 'select', remove: 'remove', move: 'move', group: 'group', clear: 'reset', observe: 'read' },
  avatar: { make: 'add', change: 'change', pick: 'select', remove: 'remove', move: 'move', group: 'group', clear: 'reset' },
};
const KEY_PREFIX = { drawing: { default: 'drawn' }, diagram: { default: 'node', group: 'group', page: 'diagram' }, document: { default: 'block', document: 'doc', section: 'section', title: 'doc', table: 'table' }, calendar: { default: 'meeting', calendar: 'calendar', room: 'room', person: 'person' }, avatar: { default: 'face', part: 'part', face: 'face', size: 'part', step: 'part', tint: 'part' } };
const keyFor = (area, op, name) => {
  const opPrefix = Object.keys(KEY_PREFIX[area] || {}).find((k) => op.id.includes(k)) || 'default';
  const prefix = (KEY_PREFIX[area] || {})[opPrefix] || 'item';
  if (selectorKeys.has(name)) return `${prefix}.${name === 'ids' ? 'ids' : 'id'}`;
  if (KINDISH.has(name)) return `${prefix}.kind`;
  return `${prefix}.${name}`;
};
const gridFor = (p, i) => {
  if (p.enum?.length) return p.enum[i % p.enum.length];
  if (p.type === 'number') return Math.min(p.max ?? 500, Math.max(p.min ?? 0, [30, 120, 260, 400][i % 4]));
  if (p.type === 'integer') return Math.min(p.max ?? 4, Math.max(p.min ?? 1, [1, 2, 3][i % 3]));
  // diverse label pool: real label words, deterministic order — the previous
  // ['Intro','Main','Second'] monoculture put 'intro' in 11% of all corpus tokens
  return ['Kickoff', 'Review', 'Draft', 'North Area', 'Idea', 'Roundup', 'Sketch',
    'Deep Dive', 'Status', 'Summary', 'Follow-up', 'Roadmap', 'Rough', 'Take 2',
    'Notes', 'Open Items', 'Goal', 'Proposal', 'Plan', 'Backup', 'Core', 'Hub',
    'Main Track', 'Second Pass'][i % 24];
};
const article = (n) => /^[aeiou]/i.test(n) ? 'an' : 'a';
const KINDISH_KEY = (key) => key.endsWith('.kind');

const seeds = [];
let seq = 0;
const emitSeed = ({ area, op, targetKind, kindValue, targetMode, extraConstraints, tier }) => {
  const verb = (VERBS[area] || VERBS.drawing)[op.act] || op.act;
  const rest = (extraConstraints || []).filter((c) => !KINDISH_KEY(c.key)).map((c) => c.surface);
  const canonical = [`add ${article(String(kindValue))} ${kindValue}`.replace(/\badd add\b/, 'add').replace(/\s+/g, ' ').trim() && false
    ? '' // never: kept to make canonical obvious below
    : `${verb} ${article(String(kindValue))} ${kindValue}`.trim(), ...rest].filter(Boolean).join(' ');
  seeds.push({
    format: 'sopskill.seed/1', seedId: `syn-${String(++seq).padStart(4, '0')}`,
    area, operation: op.id, act: ACTS[op.act] || op.act, nativeAct: op.act, on: op.on,
    target: { kind: targetKind, kindValue: String(kindValue), mode: targetMode },
    constraints: [{ n: 0, key: keyFor(area, op, 'kind'), value: String(kindValue), surface: String(kindValue), phase: 'result', optional: false, operator: 'eq', polarity: 'positive', character: 'requirement' }, ...(extraConstraints || []).map((c, i) => ({ ...c, n: i + 1 }))],
    canonicalText: canonical, executed: false, tier: tier || 'ui-enum',
  });
};

for (const area of Object.keys(native).filter((a) => AREAS.includes('all') || AREAS.includes(a)).sort()) {
  for (const op of native[area]) {
    if ((op.scope || '').includes('legacy') && op.trainingRows === 0) continue;
    const params = Object.entries(op.params || {});
    const required = params.filter(([, p]) => p.required).map(([n]) => n);
    const optional = params.filter(([, p]) => !p.required).map(([n]) => n);
    const targetMode = /remove|pick|change|move|group|ungroup|toggle|show/.test(op.act) ? 'existing' : 'new';
    const kindParam = params.find(([n, p]) => KINDISH.has(n) && p.enum?.length);
    const kindValues = kindParam?.[1].enum || [undefined];
    const subsets = subsetSpace(optional.filter((n) => n !== kindParam?.[0]), MAX_SUBSETS);
    // layer 1: UI-enum combinations (every button value × parameter subsets)
    for (const kindValue of kindValues) {
      for (const combo of subsets) {
        const use = [...new Set([...required, ...combo])];
        const extras = [];
        let i = 0;
        for (const name of use) {
          if (name === kindParam?.[0]) continue;
          const p = op.params[name];
          const value = gridFor(p, i++ + seq); // per-seed offset: the value pool rotates across seeds, not just within one
          if (value === undefined) continue;
          const surface = name === 'x' ? `${[30, 120, 260, 400][i % 4]}, ${[30, 120, 240][i % 3]}`
            : name === 'y' ? null : String(value);
          if (!surface) continue;
          extras.push({ key: keyFor(area, op, name), value, surface, phase: selectorKeys.has(name) ? 'selector' : 'result', optional: !p.required, operator: 'eq', polarity: 'positive', character: 'requirement' });
        }
        const kv = kindValue ?? nounFor(op.on, area);
        emitSeed({ area, op, targetKind: nounFor(op.on, area), kindValue: kv, targetMode, extraConstraints: extras, tier: 'ui-enum' });
      }
    }
    // layer 2: catalog-vocabulary kinds (only "make a thing" kind operations make sense)
    if (vocab && /make|add/.test(op.act) && op.act === 'make') {
      const table = area === 'drawing' ? vocab.objects : area === 'avatar' ? vocab.faces : null;
      if (table) {
        const entries = Object.entries(table).slice(0, MAX_CATALOG);
        for (const [canonical, info] of entries) {
          emitSeed({ area, op, targetKind: nounFor(op.on, area), kindValue: canonical, targetMode, extraConstraints: [], tier: 'catalog-kind' });
        }
      }
    }
  }
}

const out = SELECT ? select(seeds, SELECT) : seeds;
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.map((s) => JSON.stringify(s)).join('\n') + (out.length ? '\n' : ''));
const perArea = {};
out.forEach((s) => perArea[s.area] = (perArea[s.area] || 0) + 1);
const perTier = {};
out.forEach((s) => perTier[s.tier] = (perTier[s.tier] || 0) + 1);
console.log(`enumerated ${out.length} seeds (of ${seeds.length} total) -> ${OUT}`);
console.log('per area:', JSON.stringify(perArea), '| per tier:', JSON.stringify(perTier));

function subsetSpace(optional, cap) {
  const subsets = [[]];
  for (const a of optional) { subsets.push([a]); for (const b of optional) if (b > a) subsets.push([a, b]); }
  for (let i = 0; i + 2 < optional.length; i++) subsets.push([optional[i], optional[i + 1], optional[i + 2]]);
  const uniq = subsets.filter((s, i) => subsets.findIndex((t) => t.join() === s.join()) === i);
  const step = Math.max(1, Math.ceil(uniq.length / cap));
  return (uniq.filter((_, i) => i % step === 0).slice(0, cap).length ? uniq.filter((_, i) => i % step === 0).slice(0, cap) : [[]]);
}
function select(all, n) {
  const byTierThenArea = {};
  all.forEach((s) => ((byTierThenArea[s.tier] ||= {})[s.area] ||= []).push(s));
  const lists = [...Object.values(byTierThenArea).flatMap((t) => Object.values(t))];
  const picked = [];
  for (let i = 0; picked.length < Math.min(n, all.length); i++)
    for (const list of lists) if (list[i] && picked.length < n) picked.push(list[i]);
  return picked;
}
