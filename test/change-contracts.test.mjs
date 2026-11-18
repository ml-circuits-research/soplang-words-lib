import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.change');return w;};
const book=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
const fixture=book.match(/(@policy.duration std.change.policy[^\n]*)/)[1];
test('the exact book change policy loads under its closed schema',()=>{
 const w=make();w.load(fixture);assert.equal(w.schema('std.change.policy').closed,true);
 assert.deepEqual(w.get('policy.duration').attrs.anchor,['start']);assert.equal(w.check().ok,true);
});
test('policy fields are mandatory vocabulary names, not references or quoted prose',()=>{
 for(const key of ['kind','concept','anchor','unit'])for(const replacement of ['',`${key}="words here"`,`${key}="start"`,`${key}=$missing`,`${key}=$decl`]){
  const w=make();w.load('@decl example.declaration');const text=fixture.replace(new RegExp(`${key}=[^ ]+`),replacement);
  assert.equal(w.tell(text).ok,false,text);assert.equal(w.has('policy.duration'),false);
 }
});
test('misspelled and conflicting singleton fields are rejected transactionally',()=>{
 for(const extra of ['units=second','anchor=end','unit=second']){
  const w=make();assert.equal(w.tell(fixture+' '+extra).ok,false);assert.equal(w.has('policy.duration'),false);
 }
 const w=make();w.load(fixture);
 assert.equal(w.applyPatch({replace:{id:'policy.duration',attrs:{kind:'meeting',concept:'duration',anchor:'start'}}}).ok,false);
 assert.deepEqual(w.get('policy.duration').attrs.unit,['minute']);
});
test('unrelated vocabularies and explicit alternatives remain data, without automatic selection',()=>{
 const w=make();w.load(fixture+'\n@other std.change.policy kind=sample concept=mass anchor=container unit=gram\n@alternative std.change.policy kind=meeting concept=duration anchor=end unit=second');
 assert.equal(w.ofType('std.change.policy').length,3);
 assert.deepEqual(w.get('policy.duration').attrs.anchor,['start']);
 assert.deepEqual(w.get('alternative').attrs.anchor,['end']);
});
test('policy module aliases and independent namespaces use the same contract',()=>{
 const w=new World();w.load('@use core.use world=std.change as=app.change');
 for(const ns of ['A','B'])assert.equal(w.tell(fixture.replace('std.change','app.change'),{ns}).ok,true);
 assert.equal(w.ofType('app.change.policy').length,2);
 assert.equal(w.tell('@bad app.change.policy kind=item concept=size anchor=center',{ns:'B'}).ok,false);
});
