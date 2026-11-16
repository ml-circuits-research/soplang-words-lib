import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,quote} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.trace');return w;};
const step=(id,request='r',extra='')=>`@${id} std.trace.step request=$${request} operation=example.change operation.version=1 invocation=call.${id} status=confirmed ${extra}`;
const base='@r std.trace.request message="change a value"\n@r2 std.trace.request message="undo that"\n@i std.trace.input source=external version=17 source.type=example.item key=value values='+quote('["1"]')+'\n'+step('s')+'\n'+step('u','r2');
const observation=(id,owner,extra='')=>`@${id} std.trace.observation step=$${owner} invocation=call.${owner} phase=after input=$i ${extra}`;
test('full revised book trace fragment loads with distinct undo invocation evidence',()=>{
 const book=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const fixture=book.match(/```sop\n(@req1 std.trace.request[\s\S]*?)\n```/)[1];
 const w=make();w.load(fixture);assert.equal(w.check().ok,true);assert.equal(w.get('undo1').attrs.execution[0],'$undo.step');
});
test('all added trace records are closed, required and typed',()=>{
 for(const [type,attrs] of [['step','request=$r'],['observation','step=$s invocation=call.s phase=after'],['reply','request=$r'],['undo','target=$s'],['correction','target=$s']]){
  const w=make();w.load(base);assert.equal(w.tell(`@bad std.trace.${type} ${attrs}`).ok,false,type);
 }
 for(const record of [step('bad')+' status=bogus',observation('bad','s').replace('phase=after','phase=during'),'@bad std.trace.undo target=$i execution=$u','@bad std.trace.reply request=$r text=hello stepp=$s']){
  const w=make();w.load(base);assert.equal(w.tell(record).ok,false,record);
 }
});
test('dependencies cross requests but cycles including child-only edits are refused',()=>{
 const w=make();w.load(base+'\n'+step('v','r2','depends=$s depends=$u'));assert.equal(w.check().ok,true);
 assert.equal(w.revise('s','depends','$v').ok,false);assert.equal(w.get('s').attrs.depends,undefined);
 assert.equal(w.revise('s','depends','$s').ok,false);
 const cycle=base+'\n'+step('a','r','depends=$b')+'\n'+step('b','r2','depends=$a');assert.equal(make().tell(cycle).ok,false);
});
test('observation invocation correlation is lexical and invalidated by step edits',()=>{
 const w=make();w.load(base+'\n'+observation('o','s'));
 assert.equal(w.revise('s','invocation','changed').ok,false);
 assert.equal(w.revise('o','invocation','call.u').ok,false);
 assert.equal(make().tell((base+'\n'+observation('o','s')).replace('invocation=call.s','invocation=01').replace('invocation=call.s','invocation=1')).ok,false);
 assert.equal(w.retract('i').ok,false);
});
test('reply memberships match request identity; replies without steps remain valid',()=>{
 const w=make();w.load(base+'\n@reply std.trace.reply request=$r text="Which value?"');
 assert.equal(w.revise('reply','step','$u').ok,false);assert.equal(w.revise('reply','step','$s').ok,true);
 assert.equal(w.revise('s','request','$r2').ok,false);
});
test('undo observations belong to the distinct undo execution, never the original step',()=>{
 const w=make();w.load(base+'\n'+observation('original','s')+'\n'+observation('restored','u')+'\n@undo std.trace.undo target=$s execution=$u observation=$restored');
 assert.equal(w.revise('undo','observation','$original').ok,false);assert.equal(w.revise('undo','execution','$s').ok,false);
 assert.equal(w.revise('restored','step','$s').ok,false);assert.equal(w.retract('u').ok,false);
});
test('correction lineage crosses requests but rejects self-links, forks and cycles',()=>{
 const w=make();w.load(base+'\n'+step('v','r2')+'\n@c std.trace.correction target=$s replacement=$u');
 for(const text of ['@self std.trace.correction target=$v replacement=$v','@fork std.trace.correction target=$s replacement=$v','@cycle std.trace.correction target=$u replacement=$s'])assert.equal(w.tell(text).ok,false,text);
 assert.equal(w.tell('@next std.trace.correction target=$u replacement=$v').ok,true);
 assert.equal(w.revise('next','replacement','$s').ok,false);
});
test('aliased module namespaces and subtypes retain all correlation checks',()=>{
 const w=new World();w.load('@use core.use world=std.trace as=app.trace\n@sub core.type of=example.step extends=app.trace.step');
 const text=(base+'\n'+observation('o','s')).replaceAll('std.trace','app.trace').replaceAll('app.trace.step','example.step');
 assert.equal(w.tell(text,{ns:'A'}).ok,true);assert.equal(w.tell(text,{ns:'B'}).ok,true);
 assert.equal(w.revise('A::o','step','$B::s').ok,true,'cross-namespace evidence is allowed when the invocation agrees');
 assert.equal(w.tell('@reply app.trace.reply request=$A::r step=$B::s text=hello').ok,false);
});
test('trace topology checks consume the reasoning budget',()=>{
 const w=make();w.load(base);assert.equal(w.check(undefined,{budget:{steps:1}}).ok,false);assert.equal(w.check().ok,true);
});
