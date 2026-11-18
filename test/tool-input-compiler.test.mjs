import assert from 'node:assert/strict';
import { test } from 'node:test';
import { World, parse } from '../tools/lib-under-test.mjs';
import { decodeCapabilityCall } from '../src/internal/capability-call.mjs';

const call = `
@operation std.capability.call operation="ledger.write" argument=$options argument=$absent
@options std.capability.arg name="options" value=$record
@record std.capability.record entry=$order entry=$empty
@order std.capability.arg name="order" value=$list
@list std.capability.list member=$one member=$zero
@one std.capability.item index=1 value=-0
@zero std.capability.item index=0 value="\$literal"
@empty std.capability.arg name="empty" value=$empty.list
@empty.list std.capability.list
@absent std.capability.arg name="optional" value=null
`;

test('mechanical input projects the selected call and preserves structured values', () => {
  const world = new World();
  const input = world.compileToolInput(`
@comparison std.interpret.result status=compiled plan=$plan
@plan std.capability.result status=compiled instance="ledger-3" version="9" call=$operation
@other std.capability.alternative operation="other" status=unavailable
${call}`);
  const nodes = parse(input);
  const decoded = decodeCapabilityCall(nodes);
  assert.equal(decoded.operation, 'ledger.write');
  assert.deepEqual(decoded.args, { options: { order: ['$literal', -0], empty: [] }, optional: null });
  assert.deepEqual(nodes.map(({ id }) => id).sort(), parse(call).map(({ id }) => id).sort());
  assert.equal(world.compileToolInput(input), input);
  assert.equal(world.has('operation'), false);
});

test('mechanical input rejects ambiguous roots, invalid references and nonconcrete values', () => {
  const world = new World();
  const bad = [
    call + '@extra std.capability.call operation="other"',
    call + '@plan std.capability.result status=unavailable call=$operation',
    call + '@plan std.capability.result status=compiled call=$missing',
    call.replace('member=$one member=$zero', 'member=$one'),
    call.replace('value=-0', 'value=?unspecified'),
    call.replace('value=-0', 'value=$list'),
    call.replace('name="order"', 'name="empty"'),
    call.replace('name="order"', 'name="__proto__"'),
    call.replace('entry=$order', 'entry=$zero'),
    call.replace('name="order"', 'name="order" extra=true'),
    call.replace('name="order"', 'name="order" constructor=true'),
    call + '@unused std.capability.list',
  ];
  for (const input of bad) {
    const [result] = parse(world.compileToolInput(input));
    assert.equal(result?.type, 'std.compile.result', input);
    assert.deepEqual(result.attrs.status, ['unavailable']);
  }
});
