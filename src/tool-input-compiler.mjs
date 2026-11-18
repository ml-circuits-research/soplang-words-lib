import { parse, serialize, SopError } from './parser.mjs';
import { decodeCapabilityCall } from './internal/capability-call.mjs';

const fail = (reason) => '@tool.input.result std.compile.result status=unavailable reason=' + reason;

// Rule compilation emits ordered calls together with their explanation. Resolve only
// its call references, using the receiving world's declared interpreter contracts.
function projectRuleCalls(world, nodes, result) {
  if (nodes.length > 10_000) return fail('call-budget');
  const index = new Map(nodes.map(node => [node.id, node]));
  const refs = result.attrs.call ?? [];
  if (index.size !== nodes.length || nodes.some(node => node.pattern) ||
      result.attrs.status?.length !== 1 || result.attrs.status[0] !== 'compiled' ||
      !refs.length || refs.length > nodes.length) return fail('call-root');
  const selected = new Set(refs);
  if (selected.size !== refs.length) return fail('call-root');
  const calls = [];
  const type = index.get(refs[0].slice(1))?.type;
  const schema = type && world.schema(type);
  if (!schema?.closed || !schema.lineage.includes('std.compile.call')) return fail('invalid-call-type');
  const actions = new Set();
  for (const ref of refs) {
    const call = ref.startsWith('$') && index.get(ref.slice(1));
    if (!call || call.type !== type || call.attrs.action?.length !== 1 ||
        call.attrs.order?.[0] !== String(calls.length + 1)) return fail('invalid-call-reference');
    if (Object.values(call.attrs).some(values => values.some(token => token.startsWith('?')))) {
      return fail('invalid-call-value');
    }
    actions.add(call.attrs.action[0]);
    calls.push(call);
  }
  if (nodes.some(node => node !== result && node.type !== 'std.compile.evidence' && !selected.has('$' + node.id))) {
    return fail('call-root');
  }
  const admitted = world.ofType('std.compile.rule').some(profile => {
    if (profile.attrs.call?.[0] !== type) return false;
    const permitted = new Set(profile.attrs.action ?? []);
    return [...actions].every(action => permitted.has(action));
  });
  if (!admitted) return fail('unavailable-action');
  const input = serialize(calls);
  return world.check(input, {factsOnly:true, strict:true}).ok ? input : fail('invalid-call-field');
}

export function compileToolInput(world, sop) {
  if (typeof sop !== 'string' || sop.length > 4_000_000) return fail('invalid-call-input');
  let nodes;
  try { nodes = parse(sop); } catch (error) {
    if (error instanceof SopError) return fail('invalid-sop');
    throw error;
  }
  const results = nodes.filter(node => node.type === 'std.compile.result');
  if (results.length) return results.length === 1 ? projectRuleCalls(world, nodes, results[0]) : fail('call-root');
  const call = decodeCapabilityCall(nodes);
  return call.reason ? fail(call.reason) : serialize(call.wires);
}
