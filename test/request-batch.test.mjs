import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareRequestBatch,requestBatchFrontier,parse} from '../tools/lib-under-test.mjs';
const base=`@s std.request.source text="An invented request."
@r std.request act=change mood=do source=$s root=$result
@t std.request.target request=$r mode=existing kind=toy.item selector=$selected
@selected std.request.constraint request=$r target=$t concept=tint operator=eq value=old character=assumption polarity=positive
@result std.request.constraint request=$r target=$t concept=tint operator=eq value=new character=requirement polarity=positive`;
const entry=(id,after=[],wires=base)=>({id,request:'r',wires,after});
const build=entries=>{const r=prepareRequestBatch({entries});assert.equal(r.ok,true,JSON.stringify(r));return r.plan;};
test('all graphs validate before planning; identifiers are local and only explicit dependencies order requests',()=>{
 const plan=build([entry('c',['a','b']),entry('b'),entry('a')]);assert.deepEqual(plan.layers,[['a','b'],['c']]);assert.equal(plan.entries.every(e=>e.request==='r'),true);assert.ok(Object.isFrozen(plan.entries[0].after));
 const reverse=build([entry('a'),entry('b'),entry('c',['b','a'])]);assert.deepEqual(reverse,plan);
 const r=prepareRequestBatch({entries:[entry('a'),entry('b',[],base+'\n@evil core.rule when=$t.node then=$r.node')]});assert.equal(r.ok,false);assert.equal(r.plan,undefined);
});
test('complete schema graphs preserve quantification, relations, selector/result, numeric requirements and questions',()=>{
 const relation=base.replace('root=$result','root=$both')+'\n@goal std.request.target request=$r mode=existing kind=toy.container\n@location std.request.constraint request=$r target=$t concept=location operator=relation relation=in goal=$goal character=requirement polarity=positive\n@both std.request.group request=$r operator=and member=$result member=$location';
 const quantified=base.replace('root=$result','root=$q').replace('@result std.request.constraint request=$r target=$t','@result std.request.constraint request=$r target=$bound')+'\n@bound std.request.target request=$r mode=bound\n@q std.request.quant request=$r kind=all target=$t bind=$bound body=$result';
 const numeric=base.replace('concept=tint operator=eq value=new','concept=duration operator=delta value=10 unit=second baseline=before anchor=duration');
 const ask=base.replace('mood=do','mood=ask');
 const plan=build([entry('relation',[],relation),entry('quantified',[],quantified),entry('numeric',[],numeric),entry('question',['relation'],ask)]);
 for(const e of plan.entries){const original={relation,quantified,numeric,question:ask}[e.id];assert.deepEqual(parse(e.wires),parse(original));}
 assert.deepEqual(requestBatchFrontier(plan).ready,['numeric','quantified','relation']);
});
test('refused, unknown and unverified prerequisites block descendants without blocking independent work',()=>{
 const plan=build([entry('a'),entry('b',['a']),entry('c',['b']),entry('independent')]);
 assert.deepEqual(requestBatchFrontier(plan).waiting,['b','c']);
 for(const status of ['refused','failed','unknown','unverified']){
  const f=requestBatchFrontier(plan,[{id:'a',status}]);assert.equal(f.ok,true);assert.deepEqual(f.ready,['independent']);assert.deepEqual(f.blocked,[{id:'b',dependencies:['a']},{id:'c',dependencies:['b']}]);assert.deepEqual(f.waiting,[]);
 }
 const f=requestBatchFrontier(plan,[{id:'a',status:'confirmed'}]);assert.deepEqual(f.ready,['independent','b']);assert.deepEqual(f.waiting,['c']);
 const end=requestBatchFrontier(plan,[{id:'a',status:'confirmed'},{id:'b',status:'confirmed'},{id:'c',status:'confirmed'},{id:'independent',status:'confirmed'}]);assert.deepEqual(end.ready,[]);assert.equal(end.complete.length,4);
});
test('cycles, missing, duplicate and self dependencies fail atomically',()=>{
 for(const entries of [[entry('a',['b']),entry('b',['a'])],[entry('a',['missing'])],[entry('a',['a'])],[entry('a'),entry('a')],[entry('a'),entry('b',['a','a'])]]){const r=prepareRequestBatch({entries});assert.equal(r.ok,false);assert.equal(r.plan,undefined);}
});
test('unsafe inputs, budgets, foreign plans and inconsistent outcome histories refuse',()=>{
 let called=false;const bad={get entries(){called=true;return [];}};assert.equal(prepareRequestBatch(bad).ok,false);assert.equal(called,false);
 assert.equal(prepareRequestBatch({entries:[entry('a')]},{budget:1}).ok,false);assert.equal(prepareRequestBatch({entries:[entry('a')]},{graphBudget:1}).ok,false);
 const plan=build([entry('a'),entry('b',['a'])]);assert.equal(requestBatchFrontier(JSON.parse(JSON.stringify(plan))).ok,false);
 for(const outcomes of [[{id:'b',status:'confirmed'}],[{id:'a',status:'unverified'},{id:'b',status:'confirmed'}],[{id:'a',status:'confirmed'},{id:'a',status:'confirmed'}],[{id:'other',status:'confirmed'}],[{id:'a',status:'done'}]])assert.equal(requestBatchFrontier(plan,outcomes).ok,false);
 assert.equal(requestBatchFrontier(plan,[],{budget:1}).ok,false);
});
test('preparation detaches input and never merges separate requests or manufactures cross-request bindings',()=>{
 const a=entry('a'),b=entry('b',['a']);const plan=build([a,b]);b.after.length=0;b.wires='';assert.deepEqual(plan.entries[1].after,['a']);
 const external=base.replace('value=new','operator=same value=$external').replace('operator=eq operator=same','operator=same');assert.equal(prepareRequestBatch({entries:[entry('a'),entry('b',['a'],external)]}).ok,false);
});
