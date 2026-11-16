import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../tools/lib-under-test.mjs';
const retain=(w,definition={axes:['x','y'],unit:'u'})=>w.retainRevision('example.space','1',definition);
test('exact retained JSON is detached, deeply frozen and key-order independent',()=>{
 const w=new World(),input={b:[1,{x:true}],a:null};assert.equal(retain(w,input).created,true);input.b[1].x=false;
 const record=w.retainedRevision('example.space','1');assert.equal(record.definition.b[1].x,true);assert.throws(()=>record.definition.b.push(2),TypeError);
 assert.equal(retain(w,{a:null,b:[1,{x:true}]}).created,false);assert.equal(retain(w,{b:[1,{x:false}],a:null}).ok,false);
 assert.equal(w.retainedRevision('absent','1'),null);
});
test('invalid JSON data, cycles, accessors and sparse arrays fail without publication',()=>{
 const cycle={};cycle.self=cycle;let read=false;const accessor={get x(){read=true;return 1;}};
 for(const value of [undefined,NaN,Infinity,1n,()=>1,new Date(),cycle,accessor,[,1],Object.assign([1],{extra:2}),{x:undefined}]){
  const w=new World();assert.equal(w.retainRevision('example.space','1',value).ok,false);assert.equal(w.retainedRevision('example.space','1'),null);
 }
 assert.equal(read,false);
});
test('dry and budgeted publication do not leak entries or change source facts',()=>{
 const w=new World();w.load('@x item value=1');assert.equal(w.retainRevision('a','1',{x:1},{dry:true}).ok,true);assert.equal(w.retainedRevision('a','1'),null);
 assert.equal(w.retainRevision('a','1',{text:'x'.repeat(1000)},{budget:{steps:10}}).ok,false);assert.equal(w.retainedRevision('a','1'),null);assert.deepEqual(w.get('x').attrs.value,['1']);
});
test('forks isolate new retention and preserve definitions inherited before the fork',()=>{
 const w=new World();retain(w);const f=w.fork();assert.equal(f.retainRevision('other','1',{v:2}).ok,true);assert.equal(w.retainedRevision('other','1'),null);
 assert.equal(retain(f,{axes:['y','x'],unit:'u'}).ok,false);assert.deepEqual(w.retainedRevision('example.space','1').definition.axes,['x','y']);
});
test('ordinary undo, redo, rewind and source removal cannot erase retained meaning',()=>{
 const w=new World();w.load('@x item value=1');const mark=w.mark('before');retain(w);w.load('@y item value=2');
 assert.equal(w.undo().ok,true);assert.ok(w.retainedRevision('example.space','1'));assert.equal(w.redo().ok,true);assert.equal(w.rewind(mark).ok,true);assert.ok(w.retainedRevision('example.space','1'));
 assert.equal(w.retract('x').ok,true);assert.ok(w.retainedRevision('example.space','1'));assert.equal(retain(w,{axes:['z']}).ok,false);
});
test('conflicting marked lineage refuses adoption before facts or marks change',()=>{
 const w=new World();w.load('@x item value=1');const mark=w.mark('fork');retain(w,{x:1});retain(mark.world,{x:2});w.load('@later item value=2');const before=JSON.stringify(w.toJSON());
 const r=w.rewind(mark);assert.equal(r.ok,false);assert.equal(r.violations[0].kind,'retained-revision');assert.equal(JSON.stringify(w.toJSON()),before);assert.equal(w.marks().length,1);
});
test('full, delta and timeline snapshots retain definitions after history truncation',()=>{
 const w=new World();w.load('@x item value=1');const base=w.fork();const mark=w.mark('before');retain(w);w.load('@y item value=2');w.undo();
 for(const [data,opts] of [[w.toJSON(),{}],[w.toJSON({since:base}),{base}],[w.toJSON({timeline:true}),{}]]){
  const restored=World.fromJSON(JSON.parse(JSON.stringify(data)),opts);assert.ok(restored.retainedRevision('example.space','1'));assert.equal(retain(restored,{axes:[]}).ok,false);
  if(restored.marks().length){assert.equal(restored.rewind(restored.marks()[0].mark).ok,true);assert.ok(restored.retainedRevision('example.space','1'));}
 }
 assert.equal(base.retainedRevision('example.space','1'),null);assert.ok(mark.world);
});
test('restoration rejects conflicting or malformed retained definitions',()=>{
 const w=new World();retain(w);const data=JSON.parse(JSON.stringify(w.toJSON()));data.retained.push({owner:'example.space',revision:'1',definition:{other:true}});assert.throws(()=>World.fromJSON(data),/retained definition/);
 assert.throws(()=>World.fromJSON({format:'sopworld',version:1,log:[],retained:{}}),/array/);
 const base=new World();retain(base,{different:true});assert.throws(()=>World.fromJSON(w.toJSON({since:new World()}),{base}),/retained definition/);
});
test('validation functions cannot publish definitions as a hidden side effect',()=>{
 const w=new World({fns:{valid:(_args,world)=>{retain(world);return true;}}});
 w.load('@fn core.function name=valid pure=true out.kind=boolean\n@arg core.function.arg of=$fn name=value kind=ref\n@v core.validate on=item fn=valid');
 assert.equal(w.tell('@x item').ok,false);assert.equal(w.retainedRevision('example.space','1'),null);
});
test('rewind budget exhaustion preserves facts and retained definitions',()=>{
 const w=new World();w.load('@x item value=1');const mark=w.mark('before');retain(w);w.load('@y item value=2');const before=JSON.stringify(w.toJSON());
 assert.equal(w.rewind(mark,{budget:{steps:0}}).ok,false);assert.equal(JSON.stringify(w.toJSON()),before);
});

test('partial rewind preserves definitions retained by commit listeners',()=>{
 const w=new World();w.load('@x item value=1');const mark=w.mark();w.revise('x','value',2);
 w.on(()=>w.retainRevision('during','1',{x:1}));
 assert.equal(w.rewind(mark,{only:'item'}).ok,true);assert.ok(w.retainedRevision('during','1'));assert.deepEqual(w.get('x').attrs.value,['1']);
});
test('retention inside refused action transactions rolls back',()=>{
 const w=new World({actions:{publish:ctx=>{retain(ctx.world);return true;}}});w.load('@a core.action name=publish fn=publish');
 assert.equal(w.act([{action:'publish'},{action:'missing'}]).ok,false);assert.equal(w.retainedRevision('example.space','1'),null);
 assert.equal(w.act({action:'publish'}).ok,true);assert.ok(w.retainedRevision('example.space','1'));
});
