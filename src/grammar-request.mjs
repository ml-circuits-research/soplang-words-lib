import { parseText } from './grammar.mjs';
import { composeParses } from './grammar-compose.mjs';
import { serializeRequestGraph } from './request-serialize.mjs';
import { retainedDefinition } from './retained-revisions.mjs';
import { valueText } from './parser.mjs';

const own = (value, key) => value && typeof value === 'object' && Object.hasOwn(value, key);

/** Bounded schema graph bridge. Construction semantics come from templates. No effects. */
export function readGrammarRequests(world, text, { compiled, profile, start = 'S', terminalPunctuation = [], max = 32, budget = 20000, sourceBudget = 20000, compositionBudget = 20000, bridgeBudget = 20000 } = {}) {
  const refused = (reason, details = {}) => ({ candidates: [], failures: [{ reason, ...details }], coverage: { complete: false } });
  if (typeof text !== 'string' || typeof start !== 'string' || !start || ![max, budget, sourceBudget, compositionBudget, bridgeBudget].every(n => Number.isSafeInteger(n) && n > 0)) return refused('invalid-input');
  if (!Array.isArray(terminalPunctuation) || terminalPunctuation.some(mark => typeof mark !== 'string' || !/^[\p{P}\p{S}]+$/u.test(mark))) return refused('invalid-punctuation-policy');
  if (compiled?.ok !== true || compiled.source?.world !== world || compiled.source.stamp !== world.stamp) return refused('stale-or-foreign-compilation');
  if (text.length > bridgeBudget) return refused('bridge-budget');
  const parsed = parseText(world, text, { ...compiled.grammar, start, max, budget, sourceSpans: true, sourceBudget, reportLimits: true });
  if (parsed.truncated || parsed.limits.pruned) return refused('parse-incomplete', { limits: parsed.limits });
  if (parsed.source.status !== 'exact') return refused('source-unavailable', { detail: parsed.source.reason });
  if (!parsed.length) return refused('no-reading', { unknown: parsed.unknown || [] });
  const composed = composeParses(parsed, { ...compiled.composition, budget: compositionBudget });
  if (composed.truncated || composed.failures.some(f => f.reason !== 'guard-rejected')) return refused('composition-incomplete', { detail: composed.failures });
  if (!composed.candidates.length) return refused('no-compatible-reading', { detail: composed.failures });
  let steps = 0;
  const fail = reason => { throw { bridge: true, reason }; };
  const tick = () => { if (++steps > bridgeBudget) fail('bridge-budget'); };
  const chars = Array.from(text), candidates = [];
  const shape = (value, required, optional = []) => {
    tick();
    if (!value || typeof value !== 'object' || Array.isArray(value) || required.some(key => !own(value, key)) || Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) fail('unsupported-semantic-record');
  };
  const ranges = value => {
    if (!Array.isArray(value) || !value.length) fail('missing-evidence');
    let end = 0;
    return value.map(pair => {
      tick();
      if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isSafeInteger) || pair[0] < end || pair[0] < 0 || pair[1] <= pair[0] || pair[1] > chars.length) fail('invalid-evidence');
      end = pair[1]; return [...pair];
    });
  };
  const coverage = evidence => {
    let end = 0;
    for (const [a, b] of evidence) { // bounded: evidence ranges; source length is prebounded
      tick(); if (!/^\s*$/u.test(chars.slice(end, a).join(''))) fail('unaccounted-source-gap'); end = b;
    }
    const tail = chars.slice(end).join('');
    if (!/^\s*$/u.test(tail) && !terminalPunctuation.includes(tail.trim())) fail('unaccounted-source-gap');
    return { complete: true, terminal: tail.trim() || null };
  };
  const leaves = tree => { // bounded: each tree node charged; grammar/source budgets already bound the tree
    tick();
    return tree.children ? tree.children.flatMap(leaves) : [tree];
  };
  try {
    let mapped = composed.candidates;
    if (profile !== undefined) {
      const mapping = retainedDefinition(profile, tick);
      shape(mapping, ['rules', 'guards']);
      if (!mapping.rules || Array.isArray(mapping.rules) || typeof mapping.rules !== 'object') fail('invalid-profile');
      const variants = Object.keys(mapping.rules), inputs = [];
      if (!variants.length) fail('invalid-profile');
      for (const candidate of composed.candidates) {
        for (const rule of variants) {
          tick(); inputs.push({ tree: { rule, value: candidate.value, source: { text } }, original: candidate.index });
        }
      }
      const result = composeParses(inputs, { ...mapping, budget: compositionBudget });
      if (result.truncated || result.failures.some(f => !['missing-binding', 'guard-rejected'].includes(f.reason))) fail('profile-incomplete');
      mapped = result.candidates.map(candidate => { tick(); return { index: inputs[candidate.index].original, value: candidate.value }; });
      if (composed.candidates.some(candidate => !mapped.some(item => item.index === candidate.index))) fail('unsupported-request-profile');
    }
    for (const candidate of mapped) { // bounded: parse/profile expansion and bridge steps
      tick(); const value = retainedDefinition(candidate.value, tick), tree = parsed[candidate.index].tree;
      shape(value, ['request', 'source', 'nodes', 'evidence']);
      shape(value.evidence, ['command', 'nodes']);
      if (!Array.isArray(value.nodes) || !Array.isArray(value.evidence.nodes)) fail('invalid-graph-envelope');
      const commandEvidence = ranges(value.evidence.command);
      if (JSON.stringify(commandEvidence) !== JSON.stringify(tree.sourceRanges)) fail('incomplete-command-evidence');
      const covered = coverage(commandEvidence), lexical = leaves(tree);
      const treeRanges = new Set();
      const collect = node => { // bounded: each tree node is charged
        tick(); treeRanges.add(JSON.stringify(node.sourceRanges));
        for (const child of node.children || []) collect(child);
      };
      collect(tree);
      const checked = serializeRequestGraph({ request: value.request, nodes: value.nodes }, { budget: bridgeBudget });
      if (!checked.ok) fail(checked.issues[0].reason);
      const source = checked.world.get(value.source), request = checked.world.get(value.request);
      if (!source || !checked.world.schema(source.type)?.lineage.includes('std.request.source') || source.attrs.text?.length !== 1 || valueText(source.attrs.text[0]) !== text || request.attrs.source?.length !== 1 || request.attrs.source[0] !== '$' + value.source) fail('foreign-source-evidence');
      const anchors = new Map();
      for (const anchor of value.evidence.nodes) {
        tick(); shape(anchor, ['id', 'source', 'ranges']);
        if (typeof anchor.id !== 'string' || anchor.source !== value.source || anchors.has(anchor.id) || !checked.world.get(anchor.id)) fail('invalid-node-evidence');
        const evidence = ranges(anchor.ranges);
        if (!treeRanges.has(JSON.stringify(evidence))) fail('unverified-node-evidence');
        anchors.set(anchor.id, { id: anchor.id, source: anchor.source, ranges: evidence });
      }
      const nodes = value.nodes.map(node => {
        tick(); const attrs = { ...node.attrs }, schema = checked.world.schema(node.type), anchor = anchors.get(node.id);
        if (schema.lineage.includes('std.request.source') && node.id !== value.source) fail('foreign-source-evidence');
        if (own(attrs, 'source') && JSON.stringify(attrs.source) !== JSON.stringify([{ kind: 'ref', value: value.source }])) fail('foreign-source-evidence');
        const spanKeys = ['source.start', 'source.end'];
        if (spanKeys.some(key => own(attrs, key))) fail('predeclared-source-span');
        if (anchor && own(schema.keys, 'source')) {
          if (own(attrs, 'source') && JSON.stringify(attrs.source) !== JSON.stringify([{ kind: 'ref', value: anchor.source }])) fail('foreign-source-evidence');
          attrs.source = [{ kind: 'ref', value: anchor.source }];
          if (anchor.ranges.length === 1 && spanKeys.every(key => own(schema.keys, key))) {
            attrs['source.start'] = [{ kind: 'literal', value: String(anchor.ranges[0][0]) }];
            attrs['source.end'] = [{ kind: 'literal', value: String(anchor.ranges[0][1]) }];
          }
        }
        return { ...node, attrs };
      });
      const origins = lexical.map(node => {
        tick(); const origin = own(compiled.provenance, node.origin) ? compiled.provenance[node.origin] : null;
        if (typeof node.origin !== 'string' || !origin) fail('missing-lexical-origin');
        return { origin: node.origin, binding: origin.binding, wire: origin.wire, type: origin.type, metadata: Object.fromEntries(Object.entries(origin.metadata).map(([key, values]) => [key, values.map(item => { tick(); return item; })])), ranges: ranges(node.sourceRanges) };
      });
      const graph = serializeRequestGraph({ request: value.request, nodes }, { budget: bridgeBudget });
      if (!graph.ok) fail(graph.issues[0].reason);
      candidates.push({ request: value.request, wires: graph.wires, evidence: { unit: 'unicode-scalar', command: commandEvidence, nodes: [...anchors.values()] }, origins, coverage: covered });
    }
    if (compiled.source.world !== world || compiled.source.stamp !== world.stamp) fail('source-changed-during-read');
    return { candidates, failures: composed.failures, coverage: { complete: true } };
  } catch (error) {
    return refused(error?.bridge ? error.reason : 'invalid-graph-data');
  }
}
