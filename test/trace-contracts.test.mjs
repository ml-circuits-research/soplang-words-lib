import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,quote,str,serialize} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.trace');return w;};
const input=(values)=>'@i std.trace.input source="other::object" version="state-17" source.type=example.item key=value values='+quote(JSON.stringify(values));
test('historical snapshot preserves token categories, duplicates and order',()=>{
 const values=['1','1','1.0','"1"','$missing','"$missing"','true','"true"','"a\\nb"','$archive::old',...['?x','$?x','quote \" and backslash \\', '😀', '\u0000'].map(quote)];
 const w=make();w.load(input(values));assert.deepEqual(JSON.parse(str(w.get('i').attrs.values[0])),values);
 assert.equal(w.has('missing'),false);assert.equal(w.check().ok,true);
 const restored=make();restored.load(serialize([w.get('i')]));assert.deepEqual(restored.get('i').attrs,w.get('i').attrs);
});
test('book request and revised input declarations load under the actual foundation',()=>{
 const book=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const records=book.split('\n').filter(l=>l.startsWith('@req1 std.trace.request ')||l.startsWith('@input1 std.trace.input '));
 assert.equal(records.length,2);const w=make();w.load(records.join('\n'));assert.equal(w.check().ok,true);
});
test('snapshot JSON must contain only canonical concrete single tokens',()=>{
 for(const values of [{value:1},null,1,'1',[1],[true],[null],[[]],[''],['?x'],['$?x'],['a b'],['a value=b'],['a\n@second other'],['1 #comment'],['"bad\\q"'],['"\\u0061"'],[' 1'],['1 ']]){
  const w=make();assert.equal(w.tell(input(values)).ok,false,JSON.stringify(values));assert.equal(w.has('i'),false);
 }
 assert.equal(make().tell(input([])).ok,true,'an observed empty slot is distinct from a missing snapshot');
});
test('required source metadata and payload survive invalid edits',()=>{
 for(const field of ['source','version','source.type','key','values']){
  const w=make();w.load(input(['a']));const attrs={...w.get('i').attrs};delete attrs[field];
  assert.equal(w.applyPatch({replace:{id:'i',attrs}}).ok,false,field);assert.ok(w.get('i').attrs[field]);
 }
 const w=make();assert.equal(w.tell('@r std.trace.request').ok,false);
 assert.equal(w.tell('@r std.trace.request message="hello" unexpected=true').ok,false);
 assert.equal(w.tell(input(['a'])+' value=lost').ok,false);
});
test('historical reference tokens and source identities do not track live source mutations',()=>{
 const w=make();w.load('@object example.item value=old\n'+input(['$object','old']));
 assert.equal(w.revise('object','value','new').ok,true);assert.equal(w.retract('object').ok,true);
 assert.deepEqual(JSON.parse(str(w.get('i').attrs.values[0])),['$object','old']);assert.equal(w.check().ok,true);
});
test('snapshot validation applies through aliases, namespaces and subtype declarations',()=>{
 const w=new World();w.load('@use core.use world=std.trace as=app.trace\n@sub core.type of=example.input extends=app.trace.input');
 assert.equal(w.tell(input(['"hello"']).replace('std.trace.input','example.input'),{ns:'session'}).ok,true);
 assert.equal(w.tell(input(['?x']).replace('@i ','@bad ').replace('std.trace.input','example.input'),{ns:'session'}).ok,false);
});
test('token scans consume validation budget and failed edits restore the snapshot',()=>{
 const w=make();w.load(input(['a']));const before=w.get('i').attrs.values[0];
 const result=w.revise('i','values',quote(JSON.stringify(['a'.repeat(1000)])),{budget:{steps:100}});
 assert.equal(result.ok,false);assert.equal(w.get('i').attrs.values[0],before);
 assert.ok(result.violations.some(v=>v.kind==='budget'));
});
