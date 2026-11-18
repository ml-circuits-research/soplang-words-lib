import { quote, serialize } from './parser.mjs';

const first = (wire, key) => wire.attrs[key]?.[0];
const reference = (world, value) => world.get(value?.slice(1));
const trustedType = (world, type, base) => {
  const schema = world.schema(type);
  return type !== base && schema?.closed && schema.lineage.includes(base);
};

function output(status, { reason, calls = [], evidence = [] } = {}) {
  const attrs = { status: [status] };
  if (reason) attrs.reason = [reason];
  if (calls.length) attrs.call = calls.map((call) => '$' + call.id);
  const proofs = evidence.map((item, index) => ({
    id: 'compile.evidence.' + index, type: 'std.compile.evidence', pattern: false,
    attrs: { wire: [quote(item.wire)], rule: [quote(item.rule)], support: (item.from || []).map(quote) },
  }));
  if (proofs.length) attrs.evidence = proofs.map((proof) => '$' + proof.id);
  return serialize([{ id: 'compile.result', type: 'std.compile.result', attrs, pattern: false }, ...calls, ...proofs]);
}

function ancestry(world, root, tick) {
  const pending = [root], seen = new Set();
  while (pending.length) {
    tick();
    const wire = pending.pop();
    if (!wire || seen.has(wire.id)) continue;
    seen.add(wire.id);
    for (const id of wire.meta?.from || []) {
      tick();
      pending.push(world.get(id));
    }
  }
  return seen;
}

function derived(world, wire) {
  return wire?.meta?.told !== true && world.matrix.has(wire?.meta?.via);
}

function realization(world, profile, terminal, request, required, tick) {
  if (!derived(world, terminal)) return { reason: 'untrusted-terminal' };
  const cover = new Set((terminal.attrs.cover || []).map((value) => {
    tick();
    return reference(world, value)?.id;
  }));
  if (cover.size !== required.size || [...required].some((id) => !cover.has(id))) {
    return { reason: 'incomplete-coverage' };
  }
  const support = ancestry(world, terminal, tick);
  if (!support.has(request.id) || [...required].some((id) => !support.has(id))) {
    return { reason: 'unproved-coverage' };
  }
  const actions = new Set(profile.attrs.action);
  const callType = first(profile, 'call');
  const calls = [];
  const emitted = new Set();
  const vocabulary = world._vocab();
  if (vocabulary.action !== 'action' || vocabulary.arg !== 'arg.') return { reason: 'incompatible-action-vocabulary' };
  for (const ref of terminal.attrs.call || []) {
    tick();
    const wire = reference(world, ref);
    if (wire?.type !== callType || emitted.has(wire.id) || !derived(world, wire) ||
        !ancestry(world, wire, tick).has(request.id)) {
      return { reason: 'untrusted-call' };
    }
    const action = first(wire, 'action');
    const tool = world._compiled().actions.get(action);
    if (!actions.has(action) || !tool || tool.required.some((key) => !wire.attrs['arg.' + key]?.length)) {
      return { reason: 'unavailable-action' };
    }
    emitted.add(wire.id);
    calls.push({ wire, order: Number(first(wire, 'order')) });
  }
  calls.sort((a, b) => a.order - b.order);
  if (!calls.length || calls.some((call, index) => call.order !== index + 1)) return { reason: 'invalid-call-order' };

  return {
    calls: calls.map(({ wire }) => wire),
    evidence: [terminal, ...calls.map((call) => call.wire)].map((wire) => ({
      wire: wire.id, rule: wire.meta.via, from: wire.meta.from,
    })),
  };
}

/** Lower a complete rule derivation over the already admitted request graph. */
export function compileRuleCircuit(world, requestId, nodes) {
  const request = world.get(requestId);
  if (!request || request.type !== 'std.request' || first(request, 'mood') !== 'do') return null;
  const unavailable = (reason, evidence) => output('unavailable', { reason, evidence });
  return world._guard({}, () => {
    const tick = () => world._b.tick('validate');
    const act = first(request, 'act');
    const profiles = world.ofType('std.compile.rule').filter((wire) => {
      tick();
      return wire.type === 'std.compile.rule' && first(wire, 'act') === act;
    });
    if (!profiles.length) return null;
    const required = new Set();
    for (const node of nodes) {
      tick();
      if (node.type !== 'std.request.source' && world.resolve(node.id) !== request.id) required.add(world.resolve(node.id));
    }

    const choices = new Map();
    let reason;
    for (const profile of profiles) {
      tick();
      const type = first(profile, 'terminal');
      if (!trustedType(world, type, 'std.compile.terminal') ||
          !trustedType(world, first(profile, 'call'), 'std.compile.call')) {
        return unavailable('invalid-rule-profile');
      }
      for (const terminal of world.ofType(type)) {
        tick();
        if (terminal.type !== type || reference(world, first(terminal, 'request'))?.id !== request.id) continue;
        const choice = realization(world, profile, terminal, request, required, tick);
        if (choice.reason) {
          if (choice.reason === 'untrusted-terminal' || choice.reason === 'untrusted-call') return unavailable(choice.reason);
          reason ??= choice.reason;
        } else choices.set(terminal.id, choice);
      }
    }
    if (!choices.size) return unavailable(reason || 'no-complete-derivation');
    if (choices.size > 1) return unavailable('ambiguous-derivations', [...choices.values()].flatMap((choice) => choice.evidence));
    return output('compiled', choices.values().next().value);
  }, () => unavailable('budget'));
}
