// arbitrate by coverage (reviewer 03:20, PSys2's Q15 item 3): when several worlds own a request, the one whose
// reading consumes more of its words wins, then priority; the open tab is the host's criterion; explained.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, arbitrate } from '../tools/lib-under-test.mjs';

const W = `@acts core.use world=std.acts
@art std.schema.world name=art doc="drawing"  @face std.schema.world name=face doc="an avatar" priority=2
@t core.type of=shape extends=std.schema.thing  @f core.type of=mood extends=std.schema.thing
@k1 std.schema.kind of=shape world=art acts=make  @k2 std.schema.kind of=shape world=face acts=make`;

test('arbitrate: coverage first, then priority; the open tab is a host criterion', () => {
  const w = new World(); w.load(W);
  const req = { action: 'make', args: { kind: 'shape' } };
  assert.deepEqual(arbitrate(w, req).ambiguous?.sort(), ['art', 'face'], 'two owners, nothing to choose by');
  const cov = (n) => (n === 'art' ? 5 : 2);
  const r = arbitrate(w, req, { coverage: cov, words: 'draw a happy purple tree' });
  assert.equal(r.owner, 'art', 'the world that reads more of the request');
  const TAB = [{ name: 'coverage', measure: 'coverage', dir: 'max' }, { name: 'tab', measure: 'active', dir: 'max' }, { name: 'priority', measure: 'priority', dir: 'max' }];
  assert.equal(arbitrate(w, req, { coverage: () => 3, active: 'art', criteria: TAB }).owner, 'art', 'a tie in coverage: the open tab, by the host\'s criterion');
  assert.equal(arbitrate(w, req, { coverage: () => 3, active: 'art' }).owner, 'face', 'without it, priority');
  assert.equal(arbitrate(w, req, { coverage: () => 3, active: 'none' }).owner, 'face', 'then priority');
  assert.ok(r.ranked.find((x) => x.world === 'face').on === 'coverage');
});
