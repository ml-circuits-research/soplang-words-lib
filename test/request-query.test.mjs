import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,inspectRequest,prepareRequestBatch} from '../tools/lib-under-test.mjs';
const base=`@s std.request.source text="What values?"
@r std.request act=inspect mood=ask source=$s query=$q
@t std.request.target request=$r mode=existing kind=toy.item
@q std.request.query request=$r target=$t operation=values concept=tint source=$s source.start=0 source.end=4`;
const load=text=>{const w=new World();w.load('@use core.use world=std.request');return {w,result:w.tell(text)};};
test('query operations preserve requested projections separately from desired constraints',()=>{
 for(const operation of ['values','count','exists','members']){
  const text=operation==='values'?base:base.replace('operation=values concept=tint','operation='+operation);const {w,result}=load(text);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(inspectRequest(w,'r').ok,true);assert.equal(w.ofType('std.request.constraint').length,0);
  assert.equal(prepareRequestBatch({entries:[{id:'query',request:'r',wires:text,after:[]}]}).ok,true);
 }
});
test('multiple query projections share an explicit selected population without creating effects',()=>{
 const text=base.replace('query=$q','query=$q query=$n').replace('kind=toy.item','kind=toy.item selector=$selected')+'\n@n std.request.query request=$r target=$t operation=count\n@selected std.request.constraint request=$r target=$t concept=tint operator=eq value=old character=assumption polarity=positive';
 const {w,result}=load(text);assert.equal(result.ok,true);assert.equal(w.ofType('std.request.query').length,2);assert.equal(inspectRequest(w,'r').ok,true);
});
test('wrong ownership, action mood, missing concept, extra concept and unreferenced projections refuse',()=>{
 const variants=[base.replace('mood=ask','mood=do'),base.replace('mood=ask','mood=check'),base.replace(' concept=tint',''),base.replace('operation=values','operation=count'),base.replace(' query=$q',''),base.replace('mode=existing','mode=new'),base.replace('source.end=4','source.end=99'),base.replace(' source.start=0',''),base.replace('operation=values','operation=execute')];
 for(const text of variants)assert.equal(load(text).result.ok,false,text);
 const other='\n@r2 std.request act=inspect mood=ask source=$s\n@t2 std.request.target request=$r2 mode=existing kind=toy.item';
 assert.equal(load(base.replace('@q std.request.query request=$r ','@q std.request.query request=$r2 ')+other).result.ok,false);
 assert.equal(load(base.replace('@q std.request.query request=$r target=$t ','@q std.request.query request=$r target=$t2 ')+other).result.ok,false);
});
test('unbound and quantifier-local targets cannot be projected outside their lexical scope',()=>{
 assert.equal(load(base.replace('mode=existing kind=toy.item','mode=bound')).result.ok,false);
 const text=base.replace('query=$q','query=$q root=$all').replace('@q std.request.query request=$r target=$t','@q std.request.query request=$r target=$bound')+'\n@bound std.request.target request=$r mode=bound\n@predicate std.request.constraint request=$r target=$bound concept=tint operator=eq value=old character=requirement polarity=positive\n@all std.request.quant request=$r kind=all target=$t bind=$bound body=$predicate';assert.equal(load(text).result.ok,false);
});
test('aliases, Unicode spans, legacy underspecified ask and finite budget remain explicit',()=>{
 const w=new World();w.load('@use core.use world=std.request as=custom');assert.equal(w.tell(base.replaceAll('std.request','custom')).ok,true);assert.equal(inspectRequest(w,'r',{family:'custom'}).ok,true);assert.equal(inspectRequest(w,'r',{family:'custom',budget:{steps:1}}).ok,false);
 assert.equal(load(base.replace('What values?','😀a').replace('source.end=4','source.end=1')).result.ok,true);
 const underspecified=base.split('\n').filter(l=>!l.startsWith('@q ')).join('\n').replace(' query=$q','');assert.equal(load(underspecified).result.ok,true,'structural compatibility does not imply an answerable query');
});
