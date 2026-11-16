import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,inspectRequest} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.request');return w;};
const constraint=(id,value,extra='')=>`@${id} std.request.constraint request=$r target=$t concept=colour operator=region value=${value} polarity=positive character=requirement ${extra}`;
const base='@source std.request.source text="make the red objects blue"\n@r std.request act=change mood=do source=$source\n@t std.request.target request=$r mode=existing kind=object selector=$selected\n'+constraint('selected','red')+'\n'+constraint('desired','blue');
test('identifying pre-state colour stays separate from desired colour',()=>{
 const w=make();w.load(base);assert.equal(inspectRequest(w,'r').ok,true);assert.deepEqual(w.get('t').attrs.selector,['$selected']);assert.equal(w.get('r').attrs.root,undefined);
 const book=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');const fixture=book.match(/```sop\n(@source.selection std.request.source[\s\S]*?)\n```/)[1];make().load(fixture);
});
test('selector-only logical nodes do not require a result root',()=>{
 const w=make();w.load(base.replace('selector=$selected','selector=$choice')+'\n'+constraint('alternate','green')+'\n@choice std.request.group request=$r operator=or member=$selected member=$alternate');assert.equal(inspectRequest(w,'r').ok,true);
 assert.equal(w.tell('@orphan std.request.not request=$r of=$desired').ok,false);
});
test('selector roots and all descendants cannot be reused as result nodes',()=>{
 assert.equal(make().tell(base.replace('mood=do','mood=do root=$selected')).ok,false);
 const overlap=base.replace('mood=do','mood=do root=$result')+'\n@result std.request.group request=$r operator=and member=$selected member=$desired';assert.equal(make().tell(overlap).ok,false);
 const w=make();w.load(base.replace('mood=do','mood=do root=$desired'));assert.equal(w.revise('t','selector','$desired').ok,false);assert.deepEqual(w.get('t').attrs.selector,['$selected']);
});
test('two targets cannot share a selector closure even through different roots',()=>{
 const text=base+'\n@other std.request.target request=$r mode=existing kind=object selector=$outer\n@outer std.request.not request=$r of=$selected';assert.equal(make().tell(text).ok,false);
});
test('only existing targets own same-request selectors',()=>{
 for(const mode of ['new','bound'])assert.equal(make().tell(base.replace('mode=existing',`mode=${mode}`)).ok,false);
 const cross=base.replace('selector=$selected','selector=$outside')+'\n@r2 std.request act=inspect mood=ask source=$source\n@t2 std.request.target request=$r2 mode=existing kind=object\n'+constraint('outside','green').replace('request=$r ','request=$r2 ').replace('target=$t ','target=$t2 ');assert.equal(make().tell(cross).ok,false);
});
test('selectors reject requested changes/events, while result variants remain available',()=>{
 for(const variant of ['operator=delta value=2 unit=u baseline=before anchor=center','operator=factor value=2 baseline=before anchor=center','operator=occurred value=true act=change phase=result']){
  assert.equal(make().tell(base.replace('operator=region value=red',variant)).ok,false);
  assert.equal(make().tell(base.replace('operator=region value=blue',variant)).ok,true);
 }
});
test('quantified selector scopes cannot leak into independent result roots',()=>{
 const q=base.replace('selector=$selected','selector=$q').replace('target=$t concept=colour operator=region value=red','target=$bound concept=colour operator=region value=red')+'\n@bound std.request.target request=$r mode=bound\n@q std.request.quant request=$r kind=all target=$t bind=$bound body=$selected';
 const w=make();w.load(q);assert.equal(inspectRequest(w,'r').ok,true);assert.equal(w.revise('desired','target','$bound').ok,false);
});
test('mutually related target candidates are permitted without pretending to resolve them',()=>{
 const text=base.replace('operator=region value=red','operator=relation relation=near goal=$other')+'\n@other std.request.target request=$r mode=existing kind=object selector=$reverse\n'+constraint('reverse','green').replace('target=$t ','target=$other ').replace('operator=region value=green','operator=relation relation=near goal=$t');
 const w=make();w.load(text);assert.equal(inspectRequest(w,'r').ok,true);
});
test('selector cycles and aliases/namespaces obey the same structural checks',()=>{
 const w=new World();w.load('@use core.use world=std.request as=app.request');assert.equal(w.tell(base.replaceAll('std.request','app.request'),{ns:'A'}).ok,true);
 assert.equal(inspectRequest(w,'A::r',{family:'app.request'}).ok,true);
 const cycle=base.replace('selector=$selected','selector=$loop')+'\n@loop std.request.not request=$r of=$loop';assert.equal(make().tell(cycle).ok,false);
});
