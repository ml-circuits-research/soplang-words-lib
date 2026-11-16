import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World } from '../tools/lib-under-test.mjs';
const example = readFileSync(new URL('../books/sop-worlds-teorie.md', import.meta.url), 'utf8')
  .match(/```sop\n(@sample.width.a std.reference.sample[\s\S]*?)\n```/)[1];
const make = () => { const w = new World(); w.load('@use core.use world=std.reference'); return w; };
const values = (w, id) => w.get(id).attrs.member.map((ref) => Number(w.get(ref.slice(1)).attrs.value[0]));

test('reference contract loads the exact book sample with all dependencies', () => {
  const w = make(); w.load(example);
  assert.deepEqual(values(w, 'reference.widths'), [8, 10, 12]);
  assert.equal(w.check().ok, true);
});

test('distinct equal measurements keep their multiplicity; repeated identity is not a new sample', () => {
  const w = make();
  w.load('@a std.reference.sample value=8 unit=u\n@b std.reference.sample value=8 unit=u\n@c std.reference.sample value=12 unit=u\n@s std.reference.set version=1 property=measure unit=u member=$a member=$b member=$c member=$a');
  const sample = values(w, 's').sort((a, b) => a - b);
  assert.deepEqual(sample, [8, 8, 12]);
  assert.equal(sample[1], 8, 'the observed median differs from a deduplicated value set');
});

test('units are checked on insertion and on later edits to a referenced sample', () => {
  const w = make(); w.load(example);
  const before = w.toSOP();
  assert.equal(w.tell('@s std.reference.set version=1 property=width unit=other.unit member=$sample.width.a').ok, false);
  assert.equal(w.applyPatch({ replace: { id: 'sample.width.a', attrs: { value: 8, unit: 'other.unit' } } }).ok, false);
  assert.equal(w.toSOP(), before);
  assert.equal(w.check().ok, true);
});

test('missing members, malformed values and incorrect typed references are rejected', () => {
  for (const bad of [
    '@s std.reference.set version=1 property=width unit=u',
    '@s std.reference.set property=width unit=u member=$sample.width.a',
    '@s std.reference.set version=1 unit=u member=$sample.width.a',
    '@s std.reference.set version=1 property=width member=$sample.width.a',
    '@s std.reference.set version=1 property=width unit=page.unit member=$reference.widths',
    '@s std.reference.set version=1 property=width unit=page.unit member="$sample.width.a"',
    '@s std.reference.set version=1 property=width unit=page.unit member=$missing',
    '@a std.reference.sample unit=u', '@a std.reference.sample value=8',
    '@a std.reference.sample value=8 value=9 unit=u',
    '@a std.reference.sample value=8 unit=u unknown=true',
    ...['NaN', 'Infinity', '1e999', '8kg', '"8"'].map((value) => `@a std.reference.sample value=${value} unit=u`),
  ]) {
    const w = make(); w.load(example);
    assert.equal(w.tell(bad).ok, false, bad);
    assert.equal(w.has('a'), false);
    assert.equal(w.has('s'), false);
  }
});

test('referenced samples are protected and atomic forward references remain valid', () => {
  const w = make(); assert.equal(w.tell(example.split('\n').reverse().join('\n')).ok, true);
  assert.equal(w.retract('sample.width.a').ok, false);
  assert.equal(w.applyPatch({ replace: { id: 'reference.widths', attrs: { version: 1, property: 'width', unit: 'page.unit' } } }).ok, false);
  assert.deepEqual(values(w, 'reference.widths'), [8, 10, 12]);
});

test('aliased contracts accept other measurements including negative values and zero', () => {
  const w = new World(); w.load('@use core.use world=std.reference as=sample.data');
  w.load('@a sample.data.sample value=-3 unit=offset.unit\n@b sample.data.sample value=0 unit=offset.unit\n@s sample.data.set version=2 property=offset unit=offset.unit member=$a member=$b');
  assert.deepEqual(values(w, 's'), [-3, 0]);
  assert.equal(w.check().ok, true);
  assert.equal(w.tell('@bad sample.data.set version=2 property=offset unit=wrong member=$a').ok, false);
});

test('sample provenance is optional for illustrations but typed and protected when supplied', () => {
  const w = make();
  w.load('@source std.source name=toy.measurements version=state.7 status=illustrative\n@mapping std.import.mapping name=read.measurement version=1\n@origin std.provenance source=$source record=row.1 mapping=$mapping\n@a std.reference.sample value=5 unit=u provenance=$origin');
  assert.equal(w.tell('@b std.reference.sample value=5 unit=u provenance=$source').ok, false);
  assert.equal(w.retract('origin').ok, false);
  assert.equal(w.check().ok, true);
});

test('shared members are checked against every set, while version is recorded metadata', () => {
  const w = make();
  w.load('@a std.reference.sample value=5 unit=u\n@s1 std.reference.set version=1 property=length unit=u member=$a\n@s2 std.reference.set version=2 property=length unit=u member=$a');
  const before = w.toSOP();
  assert.equal(w.applyPatch({ replace: { id: 's1', attrs: { version: 1, property: 'length', unit: 'different', member: '$a' } } }).ok, false);
  assert.equal(w.applyPatch({ replace: { id: 'a', attrs: { value: 5, unit: 'different' } } }).ok, false);
  assert.equal(w.toSOP(), before);
  assert.equal(w.applyPatch({ replace: { id: 'a', attrs: { value: 6, unit: 'u' } } }).ok, true);
  assert.deepEqual(values(w, 's1'), [6]);
  assert.deepEqual(values(w, 's2'), [6]);
  assert.equal(w.get('s1').attrs.version[0], '1', 'this structural module does not implement versioned immutability');
});

test('unit names use literal identity rather than numeric or clock equivalence', () => {
  for (const [left, right] of [['1', '1.0'], ['10:00', '10:00:00']]) {
    const w = make();
    assert.equal(w.tell(`@a std.reference.sample value=8 unit=${left}\n@s std.reference.set version=1 property=measure unit=${right} member=$a`).ok, false);
  }
});
