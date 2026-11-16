import { parseText } from './grammar.mjs';
import { composeParses } from './grammar-compose.mjs';
import { World } from './world.mjs';
import { inspectRequest } from './request-contracts.mjs';
import { quote } from './parser.mjs';

const atom = value => typeof value === 'string' && /^[\p{L}_][\p{L}\p{N}_.:-]*$/u.test(value);
const own = (value, key) => value && typeof value === 'object' && Object.hasOwn(value, key);

/** Bounded bridge for explicitly declared positive property assignments. No effects. */
export function readGrammarRequests(world, text, { compiled, start = 'S', terminalPunctuation = [], max = 32, budget = 20000, sourceBudget = 20000, compositionBudget = 20000, bridgeBudget = 20000 } = {}) {
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
    for (const candidate of composed.candidates) { // bounded: parse max and bridge steps
      tick(); const value = candidate.value, tree = parsed[candidate.index].tree;
      shape(value, ['act', 'mood', 'target', 'constraint', 'evidence']);
      shape(value.target, ['mode', 'kind'], ['determiner']);
      shape(value.constraint, ['concept', 'operator', 'value', 'character', 'polarity', 'evidence']);
      const target = value.target, condition = value.constraint;
      if (value.mood !== 'do' || target.mode !== 'existing' || condition.operator !== 'eq' || condition.character !== 'requirement' || condition.polarity !== 'positive') fail('unsupported-request-profile');
      for (const term of [value.act, target.kind, condition.concept, ...(own(target, 'determiner') ? [target.determiner] : [])]) { tick(); if (!atom(term)) fail('unresolved-symbol'); }
      if (typeof condition.value !== 'string' || !condition.value) fail('unresolved-value');
      const commandEvidence = ranges(value.evidence), constraintEvidence = ranges(condition.evidence);
      if (JSON.stringify(commandEvidence) !== JSON.stringify(tree.sourceRanges)) fail('incomplete-command-evidence');
      const covered = coverage(commandEvidence), lexical = leaves(tree);
      if (!lexical.some(node => JSON.stringify(node.sourceRanges) === JSON.stringify(constraintEvidence))) fail('nonlexical-value-evidence');
      const origins = lexical.map(node => {
        tick(); const origin = own(compiled.provenance, node.origin) ? compiled.provenance[node.origin] : null;
        if (typeof node.origin !== 'string' || !origin) fail('missing-lexical-origin');
        return { origin: node.origin, binding: origin.binding, wire: origin.wire, type: origin.type, metadata: Object.fromEntries(Object.entries(origin.metadata).map(([key, values]) => [key, values.map(item => { tick(); return item; })])), ranges: ranges(node.sourceRanges) };
      });
      const scalar = atom(condition.value) ? condition.value : quote(condition.value);
      const span = constraintEvidence.length === 1 ? ` source.start=${constraintEvidence[0][0]} source.end=${constraintEvidence[0][1]}` : '';
      const wires = `@source std.request.source text=${quote(text)}\n@r std.request act=${value.act} mood=${value.mood} source=$source root=$condition\n@target std.request.target request=$r mode=${target.mode} kind=${target.kind}${own(target, 'determiner') ? ` determiner=${target.determiner}` : ''}\n@condition std.request.constraint request=$r target=$target concept=${condition.concept} operator=${condition.operator} value=${scalar} character=${condition.character} polarity=${condition.polarity} source=$source${span}`;
      const graph = new World({ budget: { steps: bridgeBudget } });
      if (!graph.tell('@use core.use world=std.request').ok) fail('request-validation-incomplete');
      if (!graph.tell(wires).ok || !inspectRequest(graph, 'r', { budget: { steps: bridgeBudget } }).ok) fail('invalid-request-graph');
      candidates.push({ request: 'r', wires, evidence: { unit: 'unicode-scalar', command: commandEvidence, constraint: constraintEvidence }, origins, coverage: covered });
    }
    if (compiled.source.world !== world || compiled.source.stamp !== world.stamp) fail('source-changed-during-read');
    return { candidates, failures: composed.failures, coverage: { complete: true } };
  } catch (error) {
    if (!error?.bridge) throw error;
    return refused(error.reason);
  }
}
