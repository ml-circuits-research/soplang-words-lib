import { World } from './world.mjs';
import { parse, format, quote, readValue } from './parser.mjs';
import { inspectRequest } from './request-contracts.mjs';
import { retainedDefinition } from './retained-revisions.mjs';

// Internal normalization for SOP and batch ingress. Token kinds come from the parser.
export function requestPacketFromSop(sop, tick, fail) {
  let request;
  const nodes = parse(sop).map(wire => {
    tick();
    if (wire.pattern || wire.legacy) fail('pattern-not-request-data');
    if (wire.type === 'std.request') {
      if (request !== undefined) fail('foreign-request');
      request = wire.id;
    }
    const attrs = Object.fromEntries(Object.entries(wire.attrs).map(([key, tokens]) => {
      tick();
      return [key, tokens.map(token => {
        tick();
        const value = readValue(token);
        return {kind:value.kind === 'atom' ? 'literal' : value.kind, value:value.v};
      })];
    }));
    return {id:wire.id, type:wire.type, attrs};
  });
  if (!request) fail('missing-request');
  return {request, nodes};
}

/** Validate and serialize one request with its complete graph. */
export function serializeRequestGraph(input, { budget = 20000 } = {}) {
  let steps = 0;
  const fail = reason => { throw { requestSerialization: true, reason }; };
  const tick = () => { if (++steps > budget) fail('budget'); };
  const shape = (value, keys) => {
    tick();
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail('invalid-shape');
  };
  try {
    if (!Number.isSafeInteger(budget) || budget < 1) fail('invalid-budget');
    if (typeof input === 'string' && input.length > 256_000) fail('request-budget');
    const packet = retainedDefinition(typeof input === 'string' ? requestPacketFromSop(input, tick, fail) : input, tick);
    shape(packet, ['request', 'nodes']);
    if (typeof packet.request !== 'string' || !Array.isArray(packet.nodes) || !packet.nodes.length) fail('invalid-graph');
    const world = new World({ budget: { steps: budget } });
    if (!world.tell('@request.schema core.use world=std.request').ok) fail('schema-budget');
    const exported = new Set(world.modules().find(module => module.name === 'std.request')?.exports || []);
    const schemas = new Map(), ids = new Set(), records = [], edges = [];
    let rootCount = 0;
    for (const node of packet.nodes) { // bounded: canonical copy and each node are charged
      tick(); shape(node, ['id', 'type', 'attrs']);
      if (typeof node.id !== 'string' || typeof node.type !== 'string' || !node.attrs || typeof node.attrs !== 'object' || Array.isArray(node.attrs)) fail('invalid-node');
      const probe = parse(`@${node.id} probe`);
      if (probe.length !== 1 || probe[0].id !== node.id || probe[0].type !== 'probe' || probe[0].pattern || Object.keys(probe[0].attrs).length) fail('invalid-id');
      if (ids.has(node.id) || world.wires.has(node.id) || world.matrix.has(node.id)) fail('duplicate-or-reserved-id');
      const schema = world.schema(node.type);
      if (!schema || !schema.lineage.some(type => exported.has(type))) fail('unknown-type');
      if (schema.lineage.includes('std.request')) { rootCount++; if (node.id !== packet.request) fail('foreign-request'); }
      schemas.set(node.id, schema); ids.add(node.id);
    }
    if (rootCount !== 1 || !ids.has(packet.request)) fail('missing-request');
    for (const node of packet.nodes) { // bounded: attributes/tokens are charged before serialization
      tick(); const attrs = {}, schema = schemas.get(node.id);
      for (const [key, values] of Object.entries(node.attrs)) {
        tick();
        const slot = Object.hasOwn(schema.keys, key) ? schema.keys[key] : Object.values(schema.keys).find(s => (s.prefix === true || s.prefix === 'true') && key.startsWith(s.key));
        if (!slot) fail('unknown-slot');
        if (!Array.isArray(values) || !values.length || (!slot.many && values.length !== 1)) fail('slot-cardinality');
        const tokens = [];
        for (const token of values) {
          tick(); shape(token, ['kind', 'value']);
          if (typeof token.value !== 'string') fail('invalid-token');
          let encoded;
          if (token.kind === 'string') encoded = quote(token.value);
          else if (token.kind === 'ref') {
            if (!ids.has(token.value)) fail('external-reference');
            encoded = '$' + token.value;
            const ownership = [].concat(slot.to || []).some(type => world.schema(type)?.lineage.includes('std.request'));
            edges.push({ from: node.id, to: token.value, ownership });
          } else if (token.kind === 'literal') {
            if (!token.value || readValue(token.value).kind !== 'atom') fail('invalid-literal');
            const probe = parse(`@probe probe value=${token.value}`);
            if (probe.length !== 1 || probe[0].id !== 'probe' || probe[0].type !== 'probe' || probe[0].pattern || Object.keys(probe[0].attrs).length !== 1 || probe[0].attrs.value?.length !== 1 || probe[0].attrs.value[0] !== token.value) fail('invalid-literal');
            encoded = token.value;
          } else fail('unknown-token-kind');
          tokens.push(encoded);
        }
        Object.defineProperty(attrs, key, { value: tokens, enumerable: true });
      }
      records.push({ id: node.id, type: node.type, attrs });
    }
    // Ownership references bring targets/owned nodes into the request; all other
    // nodes must be used by a forward edge (an unused value/source is not evidence).
    const reached = new Set(), pending = [packet.request], outgoing = new Map();
    for (const edge of edges) {
      tick(); if (!outgoing.has(edge.from)) outgoing.set(edge.from, []); outgoing.get(edge.from).push(edge.to);
      if (edge.ownership && edge.to === packet.request) pending.push(edge.from);
    }
    while (pending.length) { // bounded: each graph node/edge is charged
      tick(); const id = pending.pop(); if (reached.has(id)) continue; reached.add(id);
      for (const next of outgoing.get(id) || []) { tick(); pending.push(next); }
    }
    if (reached.size !== ids.size) fail('orphan-node');
    const wires = records.map(record => { tick(); return format(record); }).join('\n');
    if (!world.tell(wires).ok || !inspectRequest(world, packet.request, { budget: { steps: budget } }).ok) fail('invalid-request-graph');
    return { ok: true, request: packet.request, wires, world, issues: [] };
  } catch (error) {
    return { ok: false, issues: [{ reason: error?.requestSerialization ? error.reason : 'invalid-graph-data' }] };
  }
}
