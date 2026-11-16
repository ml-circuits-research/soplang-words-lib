import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World } from '../tools/lib-under-test.mjs';

const contract = () => {
  const w = new World();
  w.load('@contracts core.use world=std.knowledge');
  return w;
};
const example = readFileSync(new URL('../books/sop-worlds-teorie.md', import.meta.url), 'utf8')
  .match(/```sop\n(@source.toy std.source[\s\S]*?)\n```/)[1];

test('book import-evidence example loads under the actual closed contract modules', () => {
  const w = contract();
  assert.equal(w.tell(example).ok, true);
  assert.equal(w.check().ok, true);
  assert.equal(w.schema('std.provenance').closed, true);
  assert.equal(w.get('fact.duck').attrs.status[0], 'candidate');
});

test('import contracts reject missing fields, misspellings, cardinality and status errors', () => {
  for (const bad of [
    '@bad std.source name=toy version=1',
    '@bad std.source name=toy version=1 status=unknown',
    '@bad std.source name=toy version=1 status=illustrative licence=MIT',
    '@bad std.source name=toy version=1 version=2 status=illustrative',
    '@bad std.import.mapping name=parent',
    '@bad std.provenance record=row',
  ]) {
    const w = contract(), result = w.tell(bad);
    assert.equal(result.ok, false, bad);
    assert.equal(w.has('bad'), false);
  }
});

test('reference-looking strings and wrong evidence types cannot stand in for typed references', () => {
  for (const source of ['"$source.toy"', '$map.kind', '$missing']) {
    const w = contract(); w.load(example);
    const result = w.tell(`@bad std.provenance source=${source} record=row mapping=$map.kind`);
    assert.equal(result.ok, false, source);
  }
  const w = contract(); w.load(example);
  assert.equal(w.tell('@bad std.knowledge.parent child=one parent=two provenance=$source.toy status=candidate').ok, false);
});

test('evidence dependencies survive attempted deletion and invalid atomic replacement', () => {
  const w = contract(); w.load(example);
  assert.equal(w.retract('source.toy').ok, false);
  assert.equal(w.has('source.toy'), true);
  assert.equal(w.applyPatch({ replace: { id: 'origin.duck', attrs: { source: '$source.toy', record: 'row' } } }).ok, false);
  assert.deepEqual(w.get('origin.duck').attrs.mapping, ['$map.kind']);
  assert.equal(w.check().ok, true);
});

test('the same schemas accept unrelated families without changing host code', () => {
  const w = contract();
  w.load(`
    @s std.source name=toy.material.table version=2 status=illustrative
    @m std.import.mapping name=material.taxonomy version=3 description="Preserve source relation"
    @p std.provenance source=$s record=alloy.row mapping=$m
    @f std.knowledge.parent child=alloy parent=material provenance=$p status=candidate
  `);
  assert.equal(w.check().ok, true);
  assert.equal(w.get('f').attrs.status[0], 'candidate');
});

test('atomic batches resolve forward references and each module is independently loadable', () => {
  const w = contract();
  assert.equal(w.tell(example.split('\n').reverse().join('\n')).ok, true);
  for (const module of ['std.source', 'std.import', 'std.provenance', 'std.knowledge']) {
    const isolated = new World();
    assert.doesNotThrow(() => isolated.load(`@use core.use world=${module}`));
    assert.equal(isolated.check().ok, true);
  }
});

test('module aliases rename exact root type names as well as dotted descendants', () => {
  const w = new World();
  w.load('@use core.use world=std.source as=local.source');
  assert.equal(w.tell('@s local.source name=toy version=1 status=illustrative').ok, true);
  assert.equal(w.tell('@bad local.source name=toy').ok, false);
  assert.equal(w.schema('local.source').closed, true);
});

test('module aliases preserve quoted text even when it names the original module', () => {
  const w = new World({ library: { sample: '@t core.type of=sample closed=true\n@k core.slot of=sample key=text kind=string\n@f sample text="use sample and sample.child here"' } });
  w.load('@u core.use world=sample as=copy');
  const fact = w.ofType('copy')[0];
  assert.deepEqual(fact.attrs.text, ['"use sample and sample.child here"']);
  assert.equal(w.schema('copy').closed, true);
});
