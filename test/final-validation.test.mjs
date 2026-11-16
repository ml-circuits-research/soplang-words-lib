import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../tools/lib-under-test.mjs';
const declaration='@fn core.function name=valid out.kind=boolean pure=true\n@arg core.function.arg of=$fn name=record kind=ref\n@v core.validate on=parent fn=valid why="child must be nonnegative"';
const make=(fn=([ref],w)=>{const p=w.get(ref.slice(1));const id=p.attrs.child[0];const child=w.get(id.startsWith('$')?id.slice(1):id);return !!child&&Number(child.attrs.value[0])>=0;})=>{
 const w=new World();w.register('function','valid',fn);w.load(declaration);return w;
};
test('final validation allows forward records and checks child-only edits against untouched parents',()=>{
 const w=make();w.load('@p parent child=c\n@c child value=1');
 assert.equal(w.revise('c','value',-1).ok,false);assert.equal(w.get('c').attrs.value[0],'1');
 assert.equal(w.retract('c').ok,false);assert.equal(w.check().ok,true);
});
test('invalid return values and thrown errors fail closed',()=>{
 for(const fn of [()=>false,()=>undefined,()=> 'true',()=>[],()=>Promise.resolve(true),()=>{throw new Error('broken');}]){
  const w=make(fn);const r=w.tell('@p parent');assert.equal(r.ok,false);assert.ok(r.violations.some(v=>v.kind==='validation'));assert.equal(w.has('p'),false);
 }
});
test('missing registration rejects even an empty validator configuration',()=>{
 const w=new World();const r=w.tell(declaration);assert.equal(r.ok,false);assert.ok(r.violations.some(v=>v.kind==='validation'));assert.equal(w.matrix.size,0);
});
test('signature and descriptor errors are rejected',()=>{
 for(const text of [declaration.replace('pure=true','pure=false'),declaration.replace('out.kind=boolean','out.kind=number'),declaration.replace('kind=ref','kind=atom'),declaration.replace('kind=ref','kind=ref optional=true'),declaration+'\n@second core.function.arg of=$fn name=other kind=ref',declaration.replace('on=parent','on=parent on=child')]){
  const w=new World();w.register('function','valid',()=>true);assert.equal(w.tell(text).ok,false);
 }
});
test('function re-registration cannot reuse a previous successful result',()=>{
 const w=make(()=>true);w.load('@p parent');assert.equal(w.check().ok,true);
 w.register('function','valid',()=>false);assert.equal(w.check().ok,false);assert.equal(w.tell('@unrelated fact').ok,false);assert.equal(w.has('unrelated'),false);
 w.register('function','valid',()=>true);assert.equal(w.check().ok,true);
});
test('subtypes and namespace-qualified references use the same callback contract',()=>{
 const seen=[];const w=make(([ref])=>{seen.push(ref);return true;});w.load('@p core.type of=parent\n@s core.type of=special extends=parent');
 w.tell('@x special',{ns:'N'});assert.ok(seen.includes('$N::x'));
});
test('dry checks validate proposed final state and preserve original state',()=>{
 const w=make();w.load('@p parent child=c\n@c child value=1');
 const r=w.check({replace:{id:'c',attrs:{value:-1}}});assert.equal(r.ok,false);assert.equal(w.get('c').attrs.value[0],'1');
});
test('cooperative validator traversal consumes budget and rolls back',()=>{
 const w=make((_args,_world,{tick})=>{for(let i=0;i<100;i++)tick();return true;});
 const r=w.tell('@p parent',{budget:{steps:30}});assert.equal(r.ok,false);assert.equal(r.violations[0].kind,'budget');assert.equal(w.has('p'),false);
 assert.equal(w.tell('@p parent').ok,true);
});
test('attempting a nested mutation is rejected without retaining its effects',()=>{
 const w=make((_args,world)=>{world.tell('@side effect');return true;});
 const r=w.tell('@p parent');assert.equal(r.ok,false);assert.equal(w.has('side'),false);assert.equal(w.has('p'),false);
});
test('validator declarations follow module aliases without fixed vocabulary',()=>{
 const w=new World({library:{sample:declaration.replace('name=valid','name=sample.valid').replace('fn=valid','fn=sample.valid').replaceAll('on=parent','on=sample.parent')}});
 w.register('function','app.valid',()=>false);
 w.load('@use core.use world=sample as=app');
 const r=w.tell('@p app.parent');assert.equal(r.ok,false);assert.ok(r.violations.some(v=>v.fn==='app.valid'));
});
