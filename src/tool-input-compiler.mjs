import { parse, serialize, SopError } from './parser.mjs';
import { decodeCapabilityCall } from './internal/capability-call.mjs';

const fail = (reason) => '@tool.input.result std.compile.result status=unavailable reason=' + reason;

export function compileToolInput(sop) {
  if (typeof sop !== 'string' || sop.length > 4_000_000) return fail('invalid-call-input');
  let nodes;
  try { nodes = parse(sop); } catch (error) {
    if (error instanceof SopError) return fail('invalid-sop');
    throw error;
  }
  const call = decodeCapabilityCall(nodes);
  return call.reason ? fail(call.reason) : serialize(call.wires);
}
