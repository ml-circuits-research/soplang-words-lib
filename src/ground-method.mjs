// Lexical grounding as a declared, order-independent choice. A mention is compared with
// candidate lemmas along three routes: exact identity, spelling repair (bounded edit
// cost) and declared knowledge relations (bounded traversal over supplied edges).
// Each admissible route yields a cost; the policy's std.decide criteria then rank the
// candidates through std.choice, which keeps ties visible instead of resolving them by
// enumeration order. No candidate with knowledge evidence is dropped by a spelling limit.
import { parse, quote, serialize, str } from './parser.mjs';
import { editCost } from './spell.mjs';
import { compileChoice } from './choice-method.mjs';

const prefix = 'std.ground.';
const schema = {
  policy: { name: 'kind=atom present=true', measure: 'kind=atom present=true', maxSpelling: 'kind=number min=0',
    stepCost: 'kind=number min=0', maxSteps: 'kind=integer min=0 max=8', follow: 'kind=atom many=true' },
  request: { policy: 'kind=atom present=true', mention: 'kind=string present=true',
    candidate: 'type=std.ground.candidate many=true', edge: 'type=std.ground.edge many=true' },
  candidate: { lemma: 'kind=string present=true', concept: 'kind=string', measurement: 'type=std.choice.measurement many=true' },
  edge: { from: 'kind=string present=true', to: 'kind=string present=true', relation: 'kind=atom present=true' },
  evidence: { candidate: 'type=std.ground.candidate present=true', route: 'kind=atom enum=exact enum=spelling enum=knowledge enum=none present=true',
    cost: 'kind=number', path: 'kind=string many=true' },
  result: { request: 'type=std.ground.request present=true', status: 'kind=atom enum=selected enum=unavailable present=true',
    reason: 'kind=atom', selected: 'type=std.ground.candidate', alternative: 'type=std.ground.candidate many=true',
    tie: 'type=std.ground.candidate many=true', dropped: 'kind=integer min=1', evidence: 'type=std.ground.evidence many=true', choice: 'type=std.choice.result' },
};
export const groundContract = { text: [
  '@ground.module core.module name=std.ground imports=std.choice ' + Object.keys(schema).map(kind => 'exports=' + prefix + kind).join(' '),
  ...Object.entries(schema).flatMap(([kind, keys]) => {
    const type = prefix + kind;
    return ['@' + type + '.type core.type of=' + type + ' closed=true',
      ...Object.entries(keys).map(([key, spec]) => '@' + type + '.' + key + ' core.slot of=' + type + ' key=' + key + ' ' + spec)];
  }),
].join('\n'), fns: {} };

const LIMITS = { candidates: 4096, edges: 4096, text: 64, choice: 240 };
const field = (wire, key) => wire.attrs[key]?.[0];
const ref = token => typeof token === 'string' && token.startsWith('$') ? token.slice(1) : undefined;
const own = (row, keys) => Object.keys(row.attrs).every(key => keys.includes(key));
const wire = (id, type, attributes) => ({ id, type, attrs: Object.fromEntries(Object.entries(attributes)
  .filter(([, value]) => value !== undefined && !(Array.isArray(value) && !value.length))
  .map(([key, value]) => [key, [].concat(value)])) });
const fold = text => text.normalize('NFC').toLowerCase();

function policyFor(world, name) {
  const rows = world.ofType(prefix + 'policy').filter(row => str(field(row, 'name')) === name);
  if (rows.length !== 1) return null;
  const [row] = rows, number = (key, fallback) => row.attrs[key] ? Number(field(row, key)) : fallback;
  const policy = { measure: str(field(row, 'measure')), maxSpelling: number('maxSpelling', 0),
    stepCost: number('stepCost', 1), maxSteps: number('maxSteps', 0), follow: new Set((row.attrs.follow ?? []).map(str)) };
  return [policy.maxSpelling, policy.stepCost, policy.maxSteps].every(Number.isFinite) ? policy : null;
}

// Shortest declared path from the mention to each reachable term, bounded by maxSteps.
function knowledgePaths(mention, edges, policy) {
  const next = new Map();
  for (const edge of edges) {
    if (!policy.follow.has(edge.relation)) continue;
    if (!next.has(edge.from)) next.set(edge.from, []);
    next.get(edge.from).push(edge);
  }
  const paths = new Map([[mention, []]]);
  let frontier = [mention];
  for (let depth = 0; depth < policy.maxSteps && frontier.length; depth++) {
    const following = [];
    for (const term of frontier) for (const edge of next.get(term) ?? []) {
      if (paths.has(edge.to)) continue;
      paths.set(edge.to, [...paths.get(term), edge.relation + ':' + edge.to]);
      following.push(edge.to);
    }
    frontier = following;
  }
  return paths;
}

export function compileGrounding(world, wires) {
  const fail = reason => '@compile.result std.compile.result status=unavailable reason=' + reason + '\n';
  const requests = wires.filter(row => row.type === prefix + 'request'), byId = new Map(wires.map(row => [row.id, row]));
  if (requests.length !== 1 || byId.size !== wires.length ||
      wires.some(row => row.pattern || row.id.startsWith('ground.output.') || world.has(row.id) || world.matrix.has(row.id))) return fail('ground-identity');
  if (!['request', 'candidate', 'edge'].every(kind => world.schema(prefix + kind)?.closed)) return fail('ground-contract');
  const [request] = requests;
  if (!own(request, ['policy', 'mention', 'candidate', 'edge']) || request.attrs.mention?.length !== 1 || request.attrs.policy?.length !== 1) return fail('invalid-ground-request');
  const name = str(field(request, 'policy')), policy = policyFor(world, name), mention = fold(str(field(request, 'mention')));
  if (!policy) return fail('ground-policy');
  if (!mention || mention.length > LIMITS.text) return fail('invalid-mention');
  const candidateTokens = request.attrs.candidate ?? [], edgeTokens = request.attrs.edge ?? [];
  if (candidateTokens.length > LIMITS.candidates || edgeTokens.length > LIMITS.edges) return fail('ground-budget');
  const used = new Set([request.id]), take = (token, type, keys) => {
    const row = byId.get(ref(token));
    if (!row || used.has(row.id) || row.type !== type || !own(row, keys)) return null;
    used.add(row.id); return row;
  };
  const edges = [];
  for (const token of edgeTokens) {
    const edge = take(token, prefix + 'edge', ['from', 'to', 'relation']);
    if (!edge) return fail('invalid-ground-edge');
    edges.push({ from: fold(str(field(edge, 'from'))), to: fold(str(field(edge, 'to'))), relation: str(field(edge, 'relation')) });
  }
  const candidates = [];
  for (const token of candidateTokens) {
    const row = take(token, prefix + 'candidate', ['lemma', 'concept', 'measurement']);
    if (!row || row.attrs.lemma?.length !== 1) return fail('invalid-ground-candidate');
    const measurements = [];
    for (const binding of row.attrs.measurement ?? []) {
      const measure = take(binding, 'std.choice.measurement', ['metric', 'value']);
      if (!measure || str(field(measure, 'metric')) === policy.measure) return fail('invalid-ground-measurement');
      measurements.push(measure);
    }
    const lemma = fold(str(field(row, 'lemma')));
    if (!lemma || lemma.length > LIMITS.text) return fail('invalid-ground-candidate');
    candidates.push({ row, lemma, measurements });
  }
  if (used.size !== wires.length) return fail('unowned-ground-wire');
  const admitted = world.fork().tell(wires, { factsOnly: true });
  if (!admitted.ok) return fail(admitted.violations.some(row => row.kind === 'budget') ? 'budget' : 'invalid-ground-facts');

  const paths = knowledgePaths(mention, edges, policy), evidence = [], viable = [];
  for (const candidate of candidates) {
    const routes = [];
    if (candidate.lemma === mention) routes.push({ route: 'exact', cost: 0, path: [] });
    const path = paths.get(candidate.lemma);
    if (path?.length) routes.push({ route: 'knowledge', cost: path.length * policy.stepCost, path });
    const spelling = editCost(mention, candidate.lemma, policy.maxSpelling);
    if (Number.isFinite(spelling) && spelling > 0) routes.push({ route: 'spelling', cost: spelling, path: [] });
    routes.sort((a, b) => a.cost - b.cost || a.route.localeCompare(b.route));
    const best = routes[0] ?? { route: 'none', path: [] };
    const id = 'ground.output.evidence.' + evidence.length;
    evidence.push(wire(id, prefix + 'evidence', { candidate: '$' + candidate.row.id, route: best.route,
      cost: best.cost === undefined ? undefined : String(best.cost), path: best.path.map(quote) }));
    if (best.cost !== undefined) viable.push({ ...candidate, cost: best.cost });
  }
  // Canonical order makes the ranking independent of how candidates were enumerated.
  // Beyond the choice budget only the cheapest admitted candidates are compared; the
  // number left out is reported, never hidden.
  viable.sort((a, b) => a.cost - b.cost || a.lemma.localeCompare(b.lemma) || a.row.id.localeCompare(b.row.id));
  const dropped = Math.max(0, viable.length - LIMITS.choice);
  viable.length = Math.min(viable.length, LIMITS.choice);
  viable.sort((a, b) => a.lemma.localeCompare(b.lemma) || a.row.id.localeCompare(b.row.id));
  const choiceWires = [], options = [];
  viable.forEach((candidate, index) => {
    const own = wire('ground.output.measure.' + index, 'std.choice.measurement', { metric: policy.measure, value: String(candidate.cost) });
    const copies = candidate.measurements.map((row, j) => wire('ground.output.measure.' + index + '.' + j, 'std.choice.measurement',
      { metric: field(row, 'metric'), value: field(row, 'value') }));
    const option = wire('ground.output.option.' + index, 'std.choice.option', { measurement: [own, ...copies].map(row => '$' + row.id) });
    choiceWires.push(option, own, ...copies); options.push(option);
  });
  const choiceRequest = wire('ground.output.choice', 'std.choice.request', { policy: name, option: options.map(row => '$' + row.id) });
  const choiceText = compileChoice(world, [choiceRequest, ...choiceWires]);
  const [choiceResult, ...assessments] = parse(choiceText);
  if (choiceResult?.type !== 'std.choice.result') return choiceText;
  const candidateOf = token => '$' + viable[Number(ref(token).split('.').pop())].row.id;
  const result = wire('ground.output.result', prefix + 'result', {
    request: '$' + request.id, status: field(choiceResult, 'status'), reason: field(choiceResult, 'reason'),
    selected: choiceResult.attrs.option ? candidateOf(field(choiceResult, 'option')) : undefined,
    alternative: (choiceResult.attrs.alternative ?? []).map(candidateOf), tie: (choiceResult.attrs.tie ?? []).map(candidateOf),
    evidence: evidence.map(row => '$' + row.id), choice: '$' + choiceResult.id,
  });
  return serialize([result, ...evidence, choiceRequest, ...choiceWires, choiceResult, ...assessments]);
}
