import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

test('structural presence rejects missing values while required remains open', () => {
  const w = new World();
  w.load('@s core.slot of=record key=value kind=number present=true\n@q core.slot of=question key=value kind=number required=true');
  const bad = w.tell('@missing record');
  assert.equal(bad.ok, false);
  assert.equal(bad.violations[0].kind, 'missing-key');
  assert.equal(w.has('missing'), false);
  assert.equal(w.tell('@open question').ok, true);
  assert.equal(w.tell('@zero record value=0').ok, true);
  assert.equal(w.tell('@wrong record value="zero"').ok, false);
});

test('presence uses inherited effective slots and protects atomic replacements', () => {
  const w = new World();
  w.load('@t core.type of=child extends=base\n@s core.slot of=base key=value kind=number present=true');
  w.load('@a child value=1');
  assert.equal(w.tell('@b child').ok, false);
  assert.equal(w.applyPatch({ replace: { id: 'a', attrs: {} } }).ok, false);
  assert.deepEqual(w.get('a').attrs.value, ['1']);
  assert.equal(w.applyPatch({ wires: '@b child', fills: [{ id: 'b', key: 'value', value: 2 }] }).ok, true);
  assert.equal(w.check().ok, true);
});

test('deduction may supply a structurally mandatory value before validation', () => {
  const w = new World();
  w.load('@s core.slot of=record key=value kind=number present=true\n@p record input=?v\n@t record core.on=$p value=?v\n@r core.rule when=$p then=$t');
  assert.equal(w.tell('@a record input=7').ok, true);
  assert.deepEqual(w.get('a').attrs.value, ['7']);
});

test('presence participates in slot conflicts and intersections', () => {
  const w = new World();
  w.load('@s core.slot of=record key=value kind=number');
  assert.equal(w.tell('@t core.slot of=record key=value kind=number present=true').ok, false);
  w.load('@t core.slot of=record key=value kind=number present=true combine=intersect');
  assert.equal(w.tell('@bad record').ok, false);
  assert.equal(w.tell('@good record value=3').ok, true);
});

test('schema changes cannot introduce missing mandatory keys in existing facts', () => {
  const w = new World();
  w.load('@a record');
  assert.equal(w.tell('@s core.slot of=record key=value present=true').ok, false);
  assert.equal(w.has('a'), true);
  assert.equal(w.check().ok, true);
  for (const extra of ['present=maybe', 'present=true prefix=true']) {
    assert.equal(new World().tell(`@s core.slot of=record key=value ${extra}`).ok, false);
  }
});
