// The undo contract (Round 28 item 4, from PSys2's lessons): one request is one undo step,
// one sentence is one step, and requests tagged with the same message are one step together.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const W = `@acts core.use world=std.acts  @x std.schema.world name=x
@t core.type of=box extends=std.schema.thing closed=true  @s core.slot of=box key=colour
@k std.schema.kind of=box world=x acts=make acts=change acts=remove`;

test('undo: per request by default; a whole message when tagged, across several calls', () => {
  const w = new World(); w.load(W);
  w.act({ action: 'make', args: { kind: 'box' } });
  w.act({ action: 'make', args: { kind: 'box' } }, { message: 'm1' });
  w.act([{ action: 'change', args: { thing: 'box1', attr: 'colour', value: 'red' } }, { action: 'make', args: { kind: 'box' } }], { message: 'm1' });
  w.act({ action: 'remove', args: { thing: 'box2' } }, { message: 'm1' });
  assert.deepEqual(w.ofType('box').map((b) => b.id), ['box1', 'box3']);
  w.act({ action: 'undo', args: {} });
  assert.deepEqual([w.ofType('box').map((b) => b.id), w.get('box1').attrs.colour], [['box1'], undefined], 'the whole message went back in one step');
  w.act({ action: 'undo', args: {} });
  assert.deepEqual(w.ofType('box').length, 0, 'then the request before it');
  w.act({ action: 'redo', args: {} }); w.act({ action: 'redo', args: {} });
  assert.deepEqual(w.ofType('box').map((b) => b.id), ['box1', 'box3'], 'redo gives the message back whole');
});
