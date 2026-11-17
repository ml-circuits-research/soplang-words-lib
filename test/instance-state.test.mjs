import {test} from 'node:test';
import assert from 'node:assert/strict';
import {serializeInstanceState,readInstanceState,instanceStateWorld,factsOf,str} from '../tools/lib-under-test.mjs';
const state=()=>({instanceId:'immutable-instance',world:'invented.board',schemaVersion:'invented.board/1',revision:4,objects:[{id:'first id',type:'invented.node',attributes:{kind:['node'],label:['First'],x:[12.5],tags:[['a','b']],optional:[]},relations:{}},{id:'second',type:'invented.node',attributes:{kind:['node'],label:['Second']},relations:{next:['first id']}}],projection:{nodes:[{id:'first id',x:12.5,shape:{points:[[1,2],[3,4]]}},{id:'second'}],selected:['first id'],optional:null,enabled:false,negativeZero:-0,text:'$not-a-reference 🐟 "quoted"\ntext'}});
test('instance state is typed SOP facts and a transparent lossless implementation projection',()=>{
 const input=state(),wires=serializeInstanceState(input),restored=readInstanceState(wires);
 assert.deepEqual(restored,input);assert.ok(Object.is(restored.projection.negativeZero,-0));
 assert.match(wires,/std\.instance\.snapshot/);assert.match(wires,/invented\.node.*label="First"/);assert.match(wires,/std\.instance\.value.*kind="array"/);assert.doesNotMatch(wires,/projection="\{/);
 const world=instanceStateWorld(wires),facts=factsOf(world),ids=facts.ofKind('node');assert.equal(ids.length,2);const second=ids.find(id=>str(world.get(id).attrs.label[0])==='Second'),first=ids.find(id=>id!==second);assert.deepEqual(facts.related(second,'next'),[first]);
});
test('local fact identity remains stable when the population order changes',()=>{
 const a=state(),b=state();b.objects.reverse();const wa=instanceStateWorld(serializeInstanceState(a)),wb=instanceStateWorld(serializeInstanceState(b));
 for(const label of ['First','Second']){const find=w=>factsOf(w).ofKind('node').find(id=>str(w.get(id).attrs.label[0])===label);assert.equal(find(wa),find(wb));}
 b.instanceId='independent-copy';assert.equal(readInstanceState(serializeInstanceState(b)).instanceId,'independent-copy');
});
test('restored actual instance facts are processed by ordinary declared SOP rules',()=>{
 const input=state();input.objects[1].relations={};input.objects.push({id:'edge',type:'invented.link',attributes:{},relations:{from:['first id'],to:['second']}});
 const schema=`@node core.type of=invented.node
@link core.type of=invented.link
@p.node invented.node
@p.in invented.link to=$p.node
@t.start invented.node core.on=$p.node start=true
@r.start core.rule when=$p.node not=$p.in then=$t.start`;
 const world=instanceStateWorld(serializeInstanceState(input),{schema}),nodes=factsOf(world).ofKind('node');
 assert.equal(nodes.length,2);const first=nodes.find(id=>str(world.get(id).attrs.label[0])==='First'),second=nodes.find(id=>id!==first);assert.equal(str(world.get(first).attrs.start[0]),'true');assert.equal(world.get(second).attrs.start,undefined);
});
test('explicit cyclic semantic relations are retained; cyclic implementation data is rejected',()=>{
 const input=state();input.objects[0].relations={next:['second']};assert.deepEqual(readInstanceState(serializeInstanceState(input)).objects,input.objects);
 input.projection.self=input.projection;assert.throws(()=>serializeInstanceState(input),/cyclic/);
});
test('data accessors, prototype objects, sparse arrays, dangling references and budgets fail before execution',()=>{
 let ran=false;const input=state();Object.defineProperty(input.projection,'evil',{enumerable:true,get(){ran=true;return 1;}});assert.throws(()=>serializeInstanceState(input),/accessor/);assert.equal(ran,false);
 const prototype=state();prototype.projection=new Date();assert.throws(()=>serializeInstanceState(prototype),/prototype/);
 const sparse=state();sparse.projection=[,1];assert.throws(()=>serializeInstanceState(sparse),/sparse/);
 const dangling=state();dangling.objects[0].relations={next:['missing']};assert.throws(()=>serializeInstanceState(dangling),/relation-target/);
 assert.throws(()=>serializeInstanceState(state(),{maxNodes:2}),/budget/);assert.throws(()=>readInstanceState(serializeInstanceState(state()),{maxBytes:5}),/byte-budget/);
});
test('restore rejects unrelated wires, duplicate identities, wrong scalar types and mutated stable identities',()=>{
 const wires=serializeInstanceState(state());assert.throws(()=>readInstanceState(wires+'\n@extra invented.node'),/unowned/);
 assert.throws(()=>readInstanceState(wires+wires),/duplicate-wire|declared twice/);
 assert.throws(()=>readInstanceState(wires.replace('value=12.5 kind="number"','value="twelve" kind="number"')),/scalar-type/);
 assert.throws(()=>readInstanceState(wires.replace('id="first id"','id="different"')),/object-identity/);
 const invalid=state();invalid.objects[0].type='std.instance.value';assert.throws(()=>serializeInstanceState(invalid),/object/);
});
