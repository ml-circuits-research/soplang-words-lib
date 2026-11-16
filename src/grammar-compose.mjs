// Declarative semantics over parseText trees. No language, ontology or request
// schema is built in. A mapping is an author's interpretation, not its proof.
import { own, plain, validCompositionLimits, compositionEvaluator } from './composition-evaluator.mjs';

/**
 * Compose each parse independently using rules[tree.rule] and lexical[tree.cat].
 * Templates are JSON values, objects and arrays. {$get: path} copies an own-property
 * path from {node, children}; {$literal: value} quotes JSON containing reserved keys.
 * Every child needs a mapping; {$literal:null} explicitly acknowledges syntax-only
 * material. guards[rule] lists {left, right} template pairs that must be structurally
 * equal before the parent is accepted. Missing bindings reject that parse. No candidates are merged or ranked.
 * Returned candidates carry their parse index; failures and budget limits remain
 * explicit. This mechanism does not claim exhaustive parsing or semantic validity.
 */
export function composeParses(parses, { rules = {}, lexical = {}, guards = {}, budget = 20000, maxDepth = 64 } = {}) {
  const candidates = [], failures = [];
  if (!validCompositionLimits(budget, maxDepth))
    return { candidates, failures: [{ reason: 'invalid-limits' }], truncated: true };
  const evaluator = compositionEvaluator(budget, maxDepth);
  const { tick, fail, read, entries, evaluate, checkGuards, validateGuards } = evaluator;
  const compose = (node, depth) => { // bounded: tick charges every tree node and caps depth
    tick(depth);
    if (!plain(node)) fail('invalid-node');
    if (own(node, 'coord')) fail('unmapped-coordination');
    const children = own(node, 'children') ? read(node, 'children') : [];
    if (!Array.isArray(children)) fail('invalid-children');
    const hasRule = own(node, 'rule');
    const map = hasRule ? rules : lexical;
    const key = read(node, hasRule ? 'rule' : 'cat');
    if (!own(map, key)) fail('missing-mapping');
    const values = entries(children, depth).map(([, child]) => compose(child, depth + 1));
    const context = { node, children: values };
    if (hasRule && own(guards, key)) {
      checkGuards(read(guards, key), context, depth);
    }
    return evaluate(read(map, key), context, depth + 1);
  };
  // Validate all guard declarations before any candidate can escape. A private
  // validation sentinel checks template syntax/JSON without resolving bindings.
  try {
    validateGuards(rules, guards);
  } catch (error) {
    if (!error?.composition) throw error;
    return { candidates, failures: [{ reason: error.reason }], ...(evaluator.exhausted ? { truncated: true } : {}) };
  }
  for (let index = 0; index < parses.length; index++) {
    try { candidates.push({ index, value: compose(parses[index].tree, 0) }); }
    catch (error) {
      if (!error?.composition) throw error;
      failures.push({ index, reason: error.reason });
      if (evaluator.exhausted) break;
    }
  }
  return { candidates, failures, ...(evaluator.exhausted || parses.truncated ? { truncated: true } : {}) };
}
