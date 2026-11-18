import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,serializeInstanceState,instanceStateWorld} from '../tools/lib-under-test.mjs';
const schema=`@schema core.module name=sample.schema exports=sample.schema.item
@type core.type of=sample.schema.item closed=true
@id core.slot of=sample.schema.item key=id kind=string present=true
@size core.slot of=sample.schema.item key=size kind=number
@selected core.slot of=sample.schema.item key=selected kind=boolean`;
const context=()=>{const w=new World({library:{'sample.schema':schema}});w.load('@use core.use world=sample.schema');return w;};
test('instance facts use a separately imported schema and remain independently reloadable',()=>{
 const base=context(),matrix=base.toSOP({schema:true}),a=base.fork(),b=base.fork();
 assert.equal(a.tell('@one sample.schema.item id="one" size=20',{factsOnly:true}).ok,true);
 assert.equal(b.tell('@two sample.schema.item id="two" size=30',{factsOnly:true}).ok,true);
 assert.equal(base.toSOP({schema:true}),matrix);assert.equal(base.wires.size,0);assert.equal(a.has('two'),false);assert.equal(b.has('one'),false);
 const text=a.toSOP({derived:false});assert.doesNotMatch(text,/core\.(?:type|slot|use|rule)/);
 const restored=context();assert.equal(restored.tell(text,{factsOnly:true}).ok,true);assert.equal(restored.get('one').attrs.size[0],'20');
});
test('instance admission rejects schema, imports and rule-owned templates atomically before side effects',()=>{
 for(const payload of [
  '@injected core.type of=evil.item closed=true',
  '@injected core.slot of=sample.schema.item key=extra kind=string',
  '@injected core.use world=std.acts',
  '@p sample.schema.item id=?id\n@t sample.schema.item core.on=$p selected=true\n@r core.rule when=$p then=$t',
  '@mapping core.schema.map from=foreign.type as=type of=name\n@injected foreign.type name=unexpected',
 ]){
  const world=context(),before=world.toJSON();const r=world.tell('@good sample.schema.item id="good"\n'+payload,{factsOnly:true});
  assert.equal(r.ok,false);assert.ok(r.violations.some(v=>v.kind==='schema-ownership'));assert.equal(world.has('good'),false);assert.deepEqual(world.toJSON(),before);
 }
});
test('admission recognises schema types mapped by the supplied context rather than core prefixes',()=>{
 const world=context();world.load('@mapping core.schema.map from=foreign.slot as=slot of=owner key=name kind=value.kind');
 const before=world.toJSON();const r=world.tell('@foreign foreign.slot owner=sample.schema.item name=extra value.kind=string',{factsOnly:true});
 assert.equal(r.ok,false);assert.equal(r.violations[0].kind,'schema-ownership');assert.deepEqual(world.toJSON(),before);
});
test('instance patch admission cannot turn an existing fact into a schema declaration',()=>{
 const world=context();world.tell('@one sample.schema.item id="one"',{factsOnly:true});const before=world.toJSON();
 const r=world.applyPatch({replace:{id:'one',type:'core.type',attrs:{of:'unexpected'}}},{factsOnly:true});
 assert.equal(r.ok,false);assert.ok(r.violations.some(v=>v.kind==='schema-ownership'));assert.deepEqual(world.toJSON(),before);
});
test('a separately supplied rule still derives local instance conclusions',()=>{
 const world=context();world.load('@p sample.schema.item id=?id\n@t sample.schema.item core.on=$p selected=true\n@r core.rule when=$p then=$t');
 const r=world.tell('@one sample.schema.item id="one"',{factsOnly:true});assert.equal(r.ok,true);assert.equal(world.get('one').attrs.selected[0],'true');
});
test('archive facts cannot smuggle a schema-mapped declaration into the inference context',()=>{
 const sop=serializeInstanceState({instanceId:'one',world:'sample',schemaVersion:'1',revision:0,objects:[{id:'injected',type:'foreign.slot',attributes:{owner:['sample.schema.item'],name:['hidden'],'value.kind':['string']}}],projection:{}});
 assert.throws(()=>instanceStateWorld(sop,{schema:'@mapping core.schema.map from=foreign.slot as=slot of=owner key=name kind=value.kind'}),/instance-state:facts/);
});
