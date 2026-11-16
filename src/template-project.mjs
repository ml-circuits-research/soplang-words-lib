import { own, plain, validCompositionLimits, compositionEvaluator } from './composition-evaluator.mjs';

/** Project indexed semantic JSON contexts with the composition template language. */
export function projectTemplates(jobs, { templates = {}, guards = {}, budget = 20000, maxDepth = 64 } = {}) {
  const candidates = [], failures = [];
  if (!validCompositionLimits(budget, maxDepth)) return { candidates, failures: [{ reason: 'invalid-limits' }], truncated: true };
  const evaluator = compositionEvaluator(budget, maxDepth);
  const { tick, fail, read, entries, copy, evaluate, checkGuards, validateGuards, validate } = evaluator;
  let indexed;
  try {
    if (!plain(templates)) fail('invalid-templates');
    // Declarations are checked globally before a successful job can escape.
    for (const [, template] of entries(templates, 0)) validate(template);
    validateGuards(templates, guards);
    if (!Array.isArray(jobs)) fail('invalid-jobs');
    indexed = entries(jobs, 0);
  } catch (error) {
    if (!error?.composition) throw error;
    return { candidates, failures: [{ reason: error.reason }], ...(evaluator.exhausted ? { truncated: true } : {}) };
  }
  for (const [key, job] of indexed) { // bounded: jobs and each context share evaluator state
    const index = Number(key);
    try {
      tick(0);
      if (!plain(job) || entries(job, 0).length !== 2 || !own(job, 'template') || !own(job, 'context')) fail('invalid-job');
      const template = read(job, 'template');
      if (typeof template !== 'string' || !own(templates, template)) fail('missing-mapping');
      // Full context validation is deliberate: unused unsafe properties are not
      // part of semantic JSON either. No host accessor or callback is executed.
      const context = copy(read(job, 'context'), 0);
      if (own(guards, template)) checkGuards(read(guards, template), context, 0);
      const value = evaluate(read(templates, template), context, 0);
      candidates.push({ index, value });
    } catch (error) {
      if (!error?.composition) throw error;
      failures.push({ index, reason: error.reason });
      if (evaluator.exhausted) break;
    }
  }
  return { candidates, failures, ...(evaluator.exhausted ? { truncated: true } : {}) };
}
