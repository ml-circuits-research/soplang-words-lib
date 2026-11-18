import { parse, SopError } from './parser.mjs';
import { inspectRequest } from './request-contracts.mjs';
import { compileRuleCircuit } from './rule-circuit.mjs';
import { placementCircuit } from './placement-method.mjs';

const fail = reason => '@compile.result std.compile.result status=unavailable reason='+reason+'\n';

// Only authored request records cross this boundary. Schemas, methods, observations
// and tool interfaces belong to the receiving World's trusted composition.
export function compileRequest(world, sop) {
  if (typeof sop!=='string' || sop.length>256_000) return fail('invalid-request-input');
  let wires;
  try { wires=parse(sop); } catch (error) {
    if (error instanceof SopError) return fail('invalid-sop');
    throw error;
  }
  if (!wires.length || wires.length>1024) return fail('request-budget');
  const contexts=wires.filter(w=>w.type==='std.placement.context');
  const nodes=wires.filter(w=>!contexts.includes(w));
  const roots=nodes.filter(w=>w.type==='std.request');
  if (roots.length!==1 || contexts.length>1) return fail('request-root');
  const root=roots[0], ids=new Set(wires.map(w=>w.id)), nodeIds=new Set(nodes.map(w=>w.id));
  if (ids.size!==wires.length || wires.some(w=>world.has(w.id)||world.matrix.has(w.id)||
      w.pattern||Object.keys(w.attrs).some(k=>k.startsWith('core.')))) return fail('request-identity');
  if (nodes.some(w=>(w.type!=='std.request'&&!w.type.startsWith('std.request.'))||!world.schema(w.type)?.closed)) return fail('request-types');
  const touched=new Set([root.id]);
  for (const node of nodes) {
    if (node!==root && node.type!=='std.request.source' && node.type!=='std.request.value' &&
        node.attrs.request?.[0]!=='$'+root.id) return fail('request-ownership');
    for (const values of Object.values(node.attrs)) for (const token of values) {
      if (token.startsWith('?')) return fail('variable-in-request');
      if (token.startsWith('$')) {
        if (!nodeIds.has(token.slice(1))) return fail('external-request-reference');
        touched.add(token.slice(1));
      }
    }
  }
  if (nodes.some(w=>w.type==='std.request.source'&&!touched.has(w.id))) return fail('orphan-source');
  if (contexts.length && (contexts[0].attrs.request?.[0]!=='$'+root.id || !world.schema('std.placement.context'))) return fail('request-context');
  const fork=world.fork();
  const admitted=fork.tell(wires,{factsOnly:true});
  if (!admitted.ok) return fail(admitted.violations.some(v=>v.kind==='budget')?'budget':'invalid-request');
  if (!inspectRequest(fork,root.id).ok) return fail('invalid-request');
  if (contexts.length && nodes.some(w=>w.type==='std.request.constraint' && w.attrs.operator?.[0]==='relation')) {
    return placementCircuit(fork,root,nodes,contexts[0]);
  }
  return compileRuleCircuit(fork,root.id,nodes) ?? '@compile.result std.compile.result status=not-applicable reason=no-method\n';
}
