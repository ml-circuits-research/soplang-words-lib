import { valueText } from './parser.mjs';

// Fixed declaration roles; callers supply every type identity. Domain/language
// vocabulary remains in provider wires, never in this compiler.
const SHAPES = {
  binding: ['name', 'source_type', 'text_key', 'cat', 'source_id?'],
  feature: ['binding', 'key', 'from_key?', 'from_id?', 'value?'],
  filter: ['binding', 'key', 'value'],
  rule: ['name', 'lhs', 'rhs+'],
  map: ['name', 'rule?', 'cat?', 'root'],
  'node': ['name', 'kind', 'parent?', 'field?', 'index?', 'value?'],
  step: ['of', 'at', 'key?', 'index?'],
  agreement: ['rule', 'left', 'right'],
};
const has = (w, key) => Object.hasOwn(w.attrs, key);

/** Compile explicit SOP grammar/provider/template declarations; never mutate world. */
export function compileGrammarOverlay(world, { types = {}, budget = 100000, maxDepth = 64 } = {}) {
  let steps = 0;
  const fail = (reason, wire) => { throw { overlay: true, issue: { reason, ...(wire ? { id: wire.id } : {}) } }; };
  const tick = wire => { if (++steps > budget) fail('budget', wire); };
  const one = (w, key) => valueText(w.attrs[key]?.[0]);
  const integer = (w, key) => {
    const raw = w.attrs[key]?.[0];
    if (typeof raw !== 'string' || !/^(0|[1-9][0-9]*)$/.test(raw) || !Number.isSafeInteger(Number(raw))) fail('invalid-index', w);
    return Number(raw);
  };
  try {
    if (!Number.isSafeInteger(budget) || budget < 0 || !Number.isSafeInteger(maxDepth) || maxDepth < 1 || maxDepth > 256) fail('invalid-limits');
    if (!types || typeof types !== 'object' || Array.isArray(types) || Object.keys(types).length !== Object.keys(SHAPES).length || Object.keys(types).some(k => !Object.hasOwn(SHAPES, k)) || Object.keys(SHAPES).some(k => typeof types[k] !== 'string' || !types[k]) || new Set(Object.values(types)).size !== Object.keys(SHAPES).length) fail('invalid-types');
    const rows = {};
    for (const [role, shape] of Object.entries(SHAPES)) { // bounded: fixed roles and each declared record/field is charged
      rows[role] = world.ofType(types[role]);
      for (const wire of rows[role]) {
        tick(wire);
        for (const [key, values] of Object.entries(wire.attrs)) {
          tick(wire);
          if (key.startsWith('core.')) continue;
          const spec = shape.find(s => s.replace(/[?+]$/, '') === key);
          if (!spec) fail('unknown-field', wire);
          if (!Array.isArray(values) || !values.length || (!spec.endsWith('+') && values.length !== 1)) fail('field-cardinality', wire);
          for (const value of values) { tick(wire); if (typeof value !== 'string') fail('invalid-scalar', wire); }
        }
        for (const spec of shape) if (!spec.endsWith('?') && !has(wire, spec.replace(/\+$/, ''))) fail('missing-field', wire);
      }
    }
    const named = role => {
      const map = new Map();
      for (const wire of rows[role]) { // bounded: declaration count, charged here
        tick(wire); const name = one(wire, 'name');
        if (!name || map.has(name)) fail('duplicate-or-empty-name', wire);
        map.set(name, wire);
      }
      return map;
    };
    const bindings = named('binding'), rules = named('rule'), nodes = named('node');
    named('map');
    if (!bindings.size || !rules.size || !nodes.size) fail('missing-declarations');
    const related = (role, key, owners) => {
      const map = new Map();
      for (const wire of rows[role]) { // bounded: declaration count
        tick(wire); const name = one(wire, key);
        if (!owners.has(name)) fail('unknown-reference', wire);
        if (!map.has(name)) map.set(name, []);
        map.get(name).push(wire);
      }
      return map;
    };
    const features = related('feature', 'binding', bindings), filters = related('filter', 'binding', bindings);
    const paths = related('step', 'of', nodes), children = new Map(), roots = new Set();
    for (const [name, node] of nodes) { // bounded: each node charged
      tick(node);
      const kind = one(node, 'kind');
      if (!['object', 'array', 'copy', 'literal', 'null'].includes(kind)) fail('unknown-node-kind', node);
      if (has(node, 'value') !== (kind === 'literal')) fail('invalid-literal', node);
      if (has(node, 'parent')) {
        const parent = nodes.get(one(node, 'parent'));
        if (!parent) fail('unknown-parent', node);
        const parentKind = one(parent, 'kind');
        if (parentKind === 'object') {
          if (!has(node, 'field') || has(node, 'index') || !one(node, 'field') || ['$get', '$literal'].includes(one(node, 'field'))) fail('invalid-object-child', node);
        } else if (parentKind === 'array') {
          if (!has(node, 'index') || has(node, 'field')) fail('invalid-array-child', node);
          integer(node, 'index');
        } else fail('invalid-parent-kind', node);
        if (!children.has(parent)) children.set(parent, []);
        children.get(parent).push(node);
      } else if (has(node, 'field') || has(node, 'index')) fail('attachment-without-parent', node);
      if (kind !== 'copy' && paths.has(name)) fail('path-on-noncopy', node);
    }
    const active = new Set(), templates = new Map(), heights = new Map(), reached = new Set();
    const compile = (node, depth = 0) => { // bounded: each node charged, depth capped, cycles rejected
      tick(node);
      if (depth > maxDepth) fail('depth', node);
      if (active.has(node)) fail('template-cycle', node);
      if (templates.has(node)) { if (depth + heights.get(node) > maxDepth) fail('depth', node); return templates.get(node); }
      active.add(node);
      const kind = one(node, 'kind'), kids = children.get(node) || [];
      let template;
      if (kind === 'object') {
        const fields = new Set(), entries = [];
        for (const child of kids) { // bounded: each child charged by compile
          const key = one(child, 'field');
          if (fields.has(key)) fail('duplicate-field', child);
          fields.add(key); entries.push([key, compile(child, depth + 1)]);
        }
        template = Object.fromEntries(entries);
      } else if (kind === 'array') {
        const indexed = new Map();
        for (const child of kids) { tick(child); const index = integer(child, 'index'); if (indexed.has(index)) fail('duplicate-index', child); indexed.set(index, child); }
        template = [];
        for (let i = 0; i < kids.length; i++) { tick(node); if (!indexed.has(i)) fail('sparse-array', node); template.push(compile(indexed.get(i), depth + 1)); }
      } else if (kind === 'copy') {
        const steps = paths.get(one(node, 'name')) || [], indexed = new Map();
        if (!steps.length) fail('missing-path', node);
        for (const step of steps) { // bounded: each path step charged
          tick(step); const at = integer(step, 'at');
          if (has(step, 'key') === has(step, 'index') || indexed.has(at)) fail('duplicate-or-invalid-step', step);
          indexed.set(at, has(step, 'key') ? one(step, 'key') : integer(step, 'index'));
        }
        const path = [];
        for (let i = 0; i < steps.length; i++) { tick(node); if (!indexed.has(i)) fail('sparse-path', node); path.push(indexed.get(i)); }
        if (!['node', 'children'].includes(path[0])) fail('unknown-path-root', node);
        template = { $get: path };
      } else template = { $literal: kind === 'null' ? null : one(node, 'value') };
      const height = kids.length ? 1 + kids.reduce((height, child) => Math.max(height, heights.get(child)), 0) : 0;
      if (depth + height > maxDepth) fail('depth', node);
      active.delete(node); heights.set(node, height); templates.set(node, template); return template;
    };
    for (const node of nodes.values()) compile(node); // bounded: validates disconnected cycles as well
    const reference = (wire, key) => {
      const node = nodes.get(one(wire, key));
      if (!node || has(node, 'parent')) fail('invalid-root', wire);
      roots.add(node); return node;
    };
    const ruleTemplates = new Map(), lexical = new Map(), guards = new Map();
    for (const map of rows.map) { // bounded: each map charged
      tick(map);
      if (has(map, 'rule') === has(map, 'cat')) fail('invalid-map-selector', map);
      const root = reference(map, 'root'), rule = has(map, 'rule') ? rules.get(one(map, 'rule')) : null;
      if (has(map, 'rule') && !rule) fail('unknown-rule', map);
      const target = rule ? ruleTemplates : lexical, key = rule ? rule.id : one(map, 'cat');
      if (!key || target.has(key)) fail('duplicate-map', map);
      target.set(key, templates.get(root));
    }
    for (const rule of rules.values()) { tick(rule); if (!ruleTemplates.has(rule.id)) fail('missing-rule-map', rule); }
    for (const agreement of rows.agreement) { // bounded: each agreement charged
      tick(agreement); const rule = rules.get(one(agreement, 'rule'));
      if (!rule) fail('unknown-rule', agreement);
      const left = reference(agreement, 'left'), right = reference(agreement, 'right');
      if (one(left, 'kind') !== 'copy' || one(right, 'kind') !== 'copy') fail('invalid-agreement-operand', agreement);
      if (!guards.has(rule.id)) guards.set(rule.id, []);
      guards.get(rule.id).push({ left: templates.get(left), right: templates.get(right) });
    }
    const visit = node => { // bounded: one visit per node, compile already rejected cycles/depth
      tick(node); if (reached.has(node)) return; reached.add(node);
      for (const child of children.get(node) || []) visit(child);
    };
    for (const root of roots) visit(root);
    for (const node of nodes.values()) { tick(node); if (!reached.has(node)) fail('orphan-node', node); }
    const bindingCategories = new Set([...bindings.values()].map(binding => one(binding, 'cat')));
    const categories = new Set(bindingCategories);
    for (const rule of rules.values()) categories.add(one(rule, 'lhs'));
    for (const category of categories) if (!/^[A-Z][A-Za-z0-9_.-]*$/.test(category)) fail('invalid-category');
    for (const rule of rules.values()) for (const part of rule.attrs.rhs) { tick(rule); if (!categories.has(valueText(part))) fail('unknown-category', rule); }
    for (const category of lexical.keys()) if (!bindingCategories.has(category)) fail('unprovided-category');
    const lexicon = new Map(), provenance = new Map();
    for (const [name, binding] of bindings) { // bounded: binding/provider records and feature combinations are charged
      tick(binding);
      const cat = one(binding, 'cat'), sourceType = one(binding, 'source_type'), textKey = one(binding, 'text_key');
      if (!cat || !sourceType || !textKey || !lexical.has(cat)) fail('missing-lexical-map', binding);
      const defs = features.get(name) || [], checks = filters.get(name) || [], keys = new Set();
      for (const feature of defs) {
        tick(feature); const key = one(feature, 'key');
        if (!key || keys.has(key) || ['from_key', 'from_id', 'value'].filter(field => has(feature, field)).length !== 1 || (has(feature, 'from_id') && one(feature, 'from_id') !== 'true')) fail('invalid-feature', feature);
        keys.add(key);
      }
      let emitted = 0;
      for (const source of world.ofType(sourceType)) {
        tick(source);
        if (has(binding, 'source_id') && source.id !== one(binding, 'source_id')) continue;
        const vals = key => (Object.hasOwn(source.attrs, key) ? source.attrs[key] : []).map(value => { tick(source); return valueText(value); });
        if (!checks.every(check => { tick(check); return vals(one(check, 'key')).includes(one(check, 'value')); })) continue;
        const sourceTexts = vals(textKey);
        if (!sourceTexts.length) fail('missing-provider-text', source);
        const texts = sourceTexts.filter(text => checks.filter(check => { tick(check); return one(check, 'key') === textKey; }).every(check => { tick(check); return text === one(check, 'value'); }));
        if (!texts.length) continue;
        const origin = JSON.stringify([binding.id, source.id]);
        const metadata = Object.fromEntries(Object.entries(source.attrs).filter(([key]) => key.startsWith('core.') || key === 'source' || key === 'license').map(([key, values]) => [key, values.map(value => { tick(source); return valueText(value); })]));
        provenance.set(origin, { binding: binding.id, wire: source.id, type: source.type, metadata });
        for (const text of texts) {
          tick(source); if (!text) fail('empty-provider-text', source);
          let variants = [[]];
          for (const feature of defs) {
            tick(feature); const key = one(feature, 'key'), from = one(feature, 'from_key');
            const values = has(feature, 'from_id') ? [source.id] : has(feature, 'value') ? [one(feature, 'value')] : from === textKey ? [text] : vals(from);
            if (!values.length) fail('missing-provider-feature', source);
            const next = [];
            for (const variant of variants) for (const value of values) { tick(source); next.push([...variant, [key, value]]); }
            variants = next;
          }
          for (const fields of variants) {
            tick(source); if (!lexicon.has(text)) lexicon.set(text, []);
            lexicon.get(text).push({ cat, feat: Object.fromEntries(fields), origin }); emitted++;
          }
        }
      }
      if (!emitted) fail('missing-provider', binding);
    }
    return { ok: true, source: { world, stamp: world.stamp }, grammar: { types: { rule: types.rule, word: null, coord: null }, productions: [...rules.values()].map(rule => ({ id: rule.id, attrs: { lhs: [one(rule, 'lhs')], rhs: rule.attrs.rhs.map(valueText) } })), lexicon: Object.fromEntries(lexicon) }, composition: { rules: Object.fromEntries(ruleTemplates), lexical: Object.fromEntries(lexical), guards: Object.fromEntries(guards) }, provenance: Object.fromEntries(provenance), issues: [] };
  } catch (error) {
    if (!error?.overlay) throw error;
    return { ok: false, issues: [error.issue] };
  }
}
