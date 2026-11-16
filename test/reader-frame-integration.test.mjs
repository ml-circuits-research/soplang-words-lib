import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../tools/lib-under-test.mjs';
import { catalogWorld } from '../tools/worlds.mjs';
import { createEnglishFrameBinder, ENGLISH_FRAME_FACTS } from '../compat/psys2/reader/frames.mjs';
const base=await catalogWorld(ENGLISH_FRAME_FACTS),skip=!base&&'pinned knowledge unavailable';
const input=(verb,valency,node)=>({verb,valency,mood:'do',context:{node},provenance:{source:'toy.source',ranges:[[0,5]]}});
const object={kind:'toy.item',determiner:'definite',qualifier:{concept:'toy.tint',operator:'eq',value:'old'},evidence:[[0,2]],origin:'toy.lexical'};
const readings=[
 input('k.actions.verb.make.create','transitive',{object}),
 input('k.actions.verb.remove.remove','transitive',{object}),
 input('k.actions.verb.change.make','resultative',{object:{...object,selector:{concept:'toy.location',value:'selected'}},result:{concept:'toy.tint',operator:'eq',value:'new'}}),
 input('k.actions.verb.place.put','oblique',{object,goal:{marker:{relation:'toward'},object:{kind:'toy.location'}}}),
 input('k.actions.verb.make.add','oblique',{object:{quantity:{value:2,unit:'toy.count'},head:{concept:'toy.capacity'}},goal:{object}}),
];
const setup=()=>{const world=base.fork(),binder=createEnglishFrameBinder(api),compiled=binder.compile(world);assert.equal(compiled.ok,true,JSON.stringify(compiled.issues));return {world,binder,compiled};};

test('published five licences project complete grounded roles, with selected-frame act authoritative', {skip},()=>{
 const {world,binder,compiled}=setup();assert.equal(compiled.licences.length,5);
 const result=binder.project(world,readings,{compiled,projectionBudget:50000});assert.deepEqual(result.failures,[]);assert.equal(result.candidates.length,5);
 assert.deepEqual(result.candidates.map(c=>c.value.act),['make','remove','change','place','change']);
 const increment=result.candidates[4];assert.equal(api.valueText(world.get('k.actions.verb.make.add').attrs.act[0]),'make');assert.equal(increment.value.act,'change');assert.equal(increment.value.frame_mode,'more');assert.deepEqual(increment.value.needs,['number']);
 for(const candidate of result.candidates){assert.equal(candidate.requestReady,false);assert.equal(candidate.status,'roles-projected');assert.equal(candidate.mood,'do');assert.deepEqual(candidate.provenance,readings[candidate.index].provenance);for(const role of candidate.value.roles){assert.equal(role.requirements.typing,'unresolved');assert.equal(role.requirements.units,'unresolved');assert.equal(role.requirements.target_mode,null);assert.ok(role.source.some(s=>s.metadata['core.source']?.length));}}
});

test('neutral qualifiers and complete selector-bearing objects stay distinct from result predicates; duplicate place roles stay ordered', {skip},()=>{
 const {world,binder,compiled}=setup(),result=binder.project(world,readings.slice(2,4),{compiled});assert.equal(result.candidates.length,2);
 const resultRoles=result.candidates[0].value.roles;assert.deepEqual(resultRoles[0].value,readings[2].context.node.object);assert.deepEqual(resultRoles[1].value,readings[2].context.node.result);assert.equal(resultRoles[1].value.qualifier,undefined);
 const place=result.candidates[1].value.roles.filter(r=>r.act_role==='place');assert.equal(place.length,2);assert.deepEqual(place.map(r=>r.marker),[true,false]);assert.deepEqual(place.map(r=>r.value),[{relation:'toward'},{kind:'toy.location'}]);
 resultRoles[0].value.qualifier.value='mutated';assert.equal(readings[2].context.node.object.qualifier.value,'old');assert.equal(binder.project(world,[readings[2]],{compiled}).candidates[0].value.roles[0].value.qualifier.value,'old');
});

test('missing paths and unlicensed senses fail explicitly without inventing role values', {skip},()=>{
 const {world,binder,compiled}=setup();const missing=input('k.actions.verb.change.make','resultative',{object});const wrong=input('k.actions.verb.make.create','resultative',{object,result:{value:'x'}});
 const result=binder.project(world,[missing,wrong,readings[0]],{compiled});assert.deepEqual(result.candidates.map(c=>c.index),[2]);assert.ok(result.failures.some(f=>f.index===0&&f.reason==='missing-binding'));assert.ok(result.failures.some(f=>f.index===1&&f.reason==='unlicensed-reading'));
 let called=false;const unsafe={...readings[0],get unused(){called=true;return 1;}};assert.equal(binder.project(world,[unsafe],{compiled}).candidates.length,0);assert.equal(called,false);
 const noMood={...readings[0]};delete noMood.mood;assert.equal(binder.project(world,[noMood],{compiled}).failures[0].reason,'invalid-reading');
});

test('duplicate licences preserve alternatives and finite budgets never masquerade as exhaustive selection', {skip},()=>{
 const {world,binder}=setup();const original=world.get('w.reader.en.frames.licence.create');const roles=[...world.wires.values()].filter(w=>w.type==='w.reader.en.frames.role'&&w.attrs.licence?.[0]==='create');
 world.load(api.format({...original,id:'toy.alternative',attrs:{...original.attrs,name:['create.alt']}}));
 for(const role of roles)world.load(api.format({...role,id:role.id+'.alt',attrs:{...role.attrs,name:[role.attrs.name[0]+'.alt'],licence:['create.alt']}}));
 const compiled=binder.compile(world);assert.equal(compiled.ok,true,JSON.stringify(compiled.issues));const result=binder.project(world,[readings[0]],{compiled});assert.equal(result.candidates.length,2);assert.equal(result.candidates[0].index,result.candidates[1].index);assert.notEqual(result.candidates[0].licence,result.candidates[1].licence);result.candidates[0].provenance.ranges[0][0]=999;assert.equal(result.candidates[1].provenance.ranges[0][0],0);assert.equal(readings[0].provenance.ranges[0][0],0);
 assert.equal(binder.project(world,readings,{compiled,projectionBudget:1}).truncated,true);assert.equal(binder.project(world,readings,{compiled,budget:1}).truncated,true);assert.equal(binder.compile(world,{budget:1}).ok,false);
});

test('compilation rejects incomplete roles, source-join mismatches and path ambiguity; freshness binds exact world state', {skip},()=>{
 const changes=[
  w=>w.retract('w.reader.en.frames.role.increment.amount'),
  w=>{const row=w.get('w.reader.en.frames.licence.increment');assert.equal(w.replace(row.id,api.format({...row,attrs:{...row.attrs,verb_id:['k.actions.verb.change.make']}})).ok,true);},
  w=>{const row=w.get('w.reader.en.frames.role.place.rel');assert.equal(w.replace(row.id,api.format({...row,attrs:{...row.attrs,role_map:['w.lang.en.role_map.make.thing']}})).ok,true);},
  w=>w.retract('w.reader.en.frames.step.result.change.thing.0'),
  w=>{const row=w.get('w.reader.en.frames.step.create.thing.0');w.load(api.format({...row,id:'toy.duplicate.step'}));},
 ];
 for(const change of changes){const world=base.fork();change(world);assert.equal(createEnglishFrameBinder(api).compile(world).ok,false,change.toString());}
 const {world,binder,compiled}=setup();assert.equal(binder.project(world.fork(),readings,{compiled}).failures[0].reason,'stale-or-foreign-compilation');world.load('@toy.extra core.type of=toy.extra');assert.equal(binder.project(world,readings,{compiled}).failures[0].reason,'stale-or-foreign-compilation');
 const other=new api.World();other.load('@w.reader.en.frames core.module name=w.reader.en.frames version=99');assert.equal(createEnglishFrameBinder(api).compile(other).issues[0].reason,'unsupported-module-version');
});

test('optional target mode is explicit metadata; unknown values fail instead of inferred modes', {skip},()=>{
 for(const mode of ['new','bound']){const world=base.fork();world.load('@toy.mode core.slot of=w.reader.en.frames.role key=target_mode kind=atom');const row=world.get('w.reader.en.frames.role.create.thing');assert.equal(world.replace(row.id,api.format({...row,attrs:{...row.attrs,target_mode:[mode]}})).ok,true);const binder=createEnglishFrameBinder(api),compiled=binder.compile(world);assert.equal(compiled.ok,mode==='new');if(compiled.ok){const c=binder.project(world,[readings[0]],{compiled}).candidates[0];assert.equal(c.value.roles[0].requirements.target_mode,'new');assert.deepEqual(c.value.roles[0].value.qualifier,object.qualifier);}}
});
