import { format, parse, SopError } from './parser.mjs';

const first = (wire, key) => wire.attrs[key]?.[0];
const target = (world, wire, key) => world.get(first(wire, key)?.slice(1));
const descendsFrom = (world, type, base) => type === base || world.schema(type)?.lineage.includes(base);
const scored = (trial) => trial.status === 'scored';

function readTerms(world, objective) {
  const type = objective.type;
  const terms = [];
  for (const ref of objective.attrs.term || []) {
    const wire = world.get(ref.slice(1));
    if (wire?.type !== type + '.term') return { reason: 'invalid-term', detail: ref };
    const weight = Number(first(wire, 'weight'));
    if (weight === 0) continue;
    const evaluator = world.get(first(wire, 'evaluator'));
    if (evaluator?.type !== type + '.evaluator') return { reason: 'unknown-evaluator', detail: wire.id };
    terms.push({
      term: wire.id, evaluator: evaluator.id, normalisation: first(evaluator, 'normalisation'),
      version: first(evaluator, 'version'), weight, priority: Number(first(wire, 'priority')),
    });
  }
  return { terms, priorities: [...new Set(terms.map((term) => term.priority))].sort((a, b) => a - b) };
}

function trialFacts(id, wires, type, tick) {
  if (typeof id !== 'string' || typeof wires !== 'string') return null;
  for (let i = 0; i < id.length + wires.length; i++) tick();
  const [marker, ...extra] = parse(`@${id} ${type}.candidate`);
  if (extra.length || marker?.id !== id || marker.type !== type + '.candidate' || Object.keys(marker.attrs).length) return null;
  const facts = parse(wires);
  if (facts.some((wire) => wire.id === id)) return null;
  return [marker, ...facts];
}

function evaluateTrial(fork, id, wires, type, objective) {
  const tick = () => fork._b.tick('validate');
  let facts;
  try {
    facts = trialFacts(id, wires, type, tick);
  } catch (error) {
    if (!(error instanceof SopError)) throw error;
    return { id, status: 'invalid', reason: 'invalid-candidate-facts', detail: error.message };
  }
  if (!facts || fork.has(id)) return { id, status: 'invalid', reason: 'invalid-candidate' };

  const reserved = [type, type + '.term', type + '.evaluator', type + '.candidate', type + '.measurement'];
  for (const fact of facts.slice(1)) {
    tick();
    if (reserved.some((base) => descendsFrom(fork, fact.type, base))) {
      return { id, status: 'invalid', reason: 'reserved-candidate-fact', detail: fact.id };
    }
  }

  const result = fork.tell(facts, { strict: false, factsOnly: true, ns: '' });
  if (!result.ok) {
    const { violations } = result;
    const status = violations.every((v) => v.kind === 'deny') ? 'rejected' : 'invalid';
    return { id, status, violations };
  }
  const consistency = fork.solveReport();
  if (consistency.status === 'unsat') return { id, status: 'rejected', reason: 'no-consistent-completion' };
  if (consistency.status !== 'sat') {
    const reason = consistency.reason || 'solver-budget';
    return { id, status: consistency.reason ? 'incomplete' : 'exhausted', reason };
  }

  const candidate = fork.get(id);
  if (candidate?.id !== id || candidate.type !== type + '.candidate') {
    return { id, status: 'invalid', reason: 'invalid-candidate' };
  }

  // A fresh marker scopes the observations to this trial. Only newly derived facts can measure it.
  const measurements = new Map();
  for (const wireId of new Set(result.derived)) {
    tick();
    const wire = fork.get(wireId);
    if (wire?.type !== type + '.measurement' || wire.meta?.told || target(fork, wire, 'candidate')?.id !== id) continue;
    const evaluator = target(fork, wire, 'evaluator').id;
    if (!measurements.has(evaluator)) measurements.set(evaluator, []);
    measurements.get(evaluator).push(wire);
  }

  const terms = [];
  const costs = new Map(objective.priorities.map((priority) => [priority, 0]));
  for (const term of objective.terms) {
    tick();
    const rows = measurements.get(term.evaluator) || [];
    if (rows.length !== 1) {
      return { id, status: 'incomplete', reason: rows.length ? 'ambiguous-measurement' : 'missing-measurement',
        detail: term.evaluator, terms, measurements: rows.map((wire) => wire.id) };
    }
    const [wire] = rows;
    const value = Number(first(wire, 'value'));
    const weighted = term.weight * value;
    const sum = costs.get(term.priority) + weighted;
    if (!Number.isFinite(sum)) {
      return { id, status: 'invalid', reason: 'nonfinite-cost', detail: term.term, terms };
    }
    costs.set(term.priority, sum);
    terms.push({ ...term, value, weighted, measurement: format(wire), rule: wire.meta.via, support: [...wire.meta.from] });
  }
  return { id, status: 'scored', vector: [...costs.values()], terms };
}

function compareVectors(left, right, direction) {
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -direction : direction;
  }
  return 0;
}

/** Rank finite trial facts using an objective and its declared SOP measurements. */
export function evaluateObjective(world, objectiveId, candidates, options = {}) {
  const trials = [];
  const invalid = (reason, detail) => ({
    status: 'invalid', reason, ...(detail === undefined ? {} : { detail }), trials,
    ranked: [], best: [], priorities: [], remaining: Array.isArray(candidates) ? candidates.length - trials.length : 0,
  });
  const { maxCandidates = 128, budget } = options;
  if (!Array.isArray(candidates) || !Number.isSafeInteger(maxCandidates) || maxCandidates < 0 ||
      (budget?.steps !== undefined && (!Number.isSafeInteger(budget.steps) || budget.steps < 0)) ||
      (budget?.ms !== undefined && (!Number.isFinite(budget.ms) || budget.ms < 0))) {
    return invalid('invalid-limits-or-candidates');
  }
  const source = world?.version;
  const objective = typeof objectiveId === 'string' ? world?.get(objectiveId) : undefined;
  if (!objective || !world.schema(objective.type + '.measurement') ||
      first(objective, 'order') !== 'lexicographic' ||
      !['minimise', 'maximise'].includes(first(objective, 'direction'))) {
    return invalid('invalid-objective');
  }
  const declared = readTerms(world, objective);
  if (declared.reason) return invalid(declared.reason, declared.detail);

  const seen = new Set();
  for (let i = 0; i < Math.min(candidates.length, maxCandidates); i++) {
    const { id, wires } = candidates[i] || {};
    if (typeof id !== 'string' || seen.has(id)) {
      trials.push({ id, status: 'invalid', reason: 'invalid-or-duplicate-candidate-id' });
      continue;
    }
    seen.add(id);
    const fork = world.fork();
    trials.push(fork._guard({ budget }, () => evaluateTrial(fork, id, wires, objective.type, declared),
      (violation) => ({ id, status: 'exhausted', violations: [violation] })));
    if (world.version !== source) return invalid('source-changed');
  }

  const direction = first(objective, 'direction') === 'minimise' ? 1 : -1;
  const compare = (left, right) => compareVectors(left.vector, right.vector, direction);
  const ranked = trials.filter(scored).sort(compare);
  const best = ranked.filter((trial) => compare(trial, ranked[0]) === 0);
  const remaining = candidates.length - trials.length;
  let status;
  if (remaining || trials.some((trial) => trial.status === 'exhausted')) status = 'exhausted';
  else if (trials.some((trial) => trial.status === 'incomplete' || trial.status === 'invalid')) status = 'incomplete';
  else status = best.length ? 'optimal' : 'infeasible';
  return { status, trials, ranked, best, remaining, priorities: declared.priorities };
}
