import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=w.legend');return w;};
test('book conceptual declarations load with explicit dependencies',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const fixture=text.match(/```sop\n(@concept.entity w.legend.concept[\s\S]*?)\n```/)[1];
 const w=make();w.load(fixture);assert.equal(w.check().ok,true);
});
test('concept specialisation rejects self and arbitrary-length cycles atomically',()=>{
 for(const n of [1,2,3,7]){
  const text=Array.from({length:n},(_,i)=>`@c${i} w.legend.concept name=c${i} specialises=$c${(i+1)%n}`).join('\n');
  const w=make();const r=w.tell(text);assert.equal(r.ok,false);assert.ok(r.violations.some(v=>v.kind==='deny'));assert.equal(w.ofType('w.legend.concept').length,0);
 }
});
test('specialisation edits are checked and derived closure retracts with its premises',()=>{
 const w=make();w.load('@a w.legend.concept name=a\n@b w.legend.concept name=b specialises=$a\n@c w.legend.concept name=c specialises=$b');
 assert.equal(w.applyPatch({replace:{id:'a',attrs:{name:'a',specialises:'$c'}}}).ok,false);
 assert.equal(w.retract('a').ok,false);
 assert.equal(w.applyPatch({replace:{id:'b',attrs:{name:'b'}}}).ok,true);
 assert.equal(w.applyPatch({replace:{id:'a',attrs:{name:'a',specialises:'$c'}}}).ok,true,'old ancestry must no longer produce a cycle');
 assert.equal(w.check().ok,true);
});
test('hierarchy checks traverse explicit cross-namespace references',()=>{
 const w=make();w.load('@a w.legend.concept name=a');
 assert.equal(w.tell('@b w.legend.concept name=b specialises=$::a',{ns:'B'}).ok,true);
 assert.equal(w.applyPatch({replace:{id:'a',attrs:{name:'a',specialises:'$B::b'}}}).ok,false);
});
test('degree declarations require finite positive factors and explicit direction',()=>{
 for(const factor of ['0','-1','Infinity','"1"','1e999'])assert.equal(make().tell(`@d w.legend.degree word=large direction=up factor=${factor}`).ok,false);
 for(const factor of ['0.5','1','1.6'])assert.equal(make().tell(`@d w.legend.degree word=large direction=down factor=${factor}`).ok,true);
 assert.equal(make().tell('@d w.legend.degree word=large factor=2').ok,false);
 assert.equal(make().tell('@d w.legend.degree word=large direction=sideways factor=2').ok,false);
});
test('roles use the reference union and agree with the owning act vocabulary',()=>{
 const w=make();w.load('@c w.legend.condition kind=exists object=result\n@a w.legend.act name=make change=appear role=result after=$c\n@r w.legend.relation name=associated');
 assert.equal(w.tell('@ra w.legend.role name=result of=$a\n@rr w.legend.role name=source of=$r').ok,true);
 for(const target of ['$c','$missing','"$a"','a'])assert.equal(w.tell(`@bad w.legend.role name=result of=${target}`).ok,false);
 assert.equal(w.tell('@bad w.legend.role name=undeclared of=$a').ok,false);
 assert.equal(w.tell('@duplicate w.legend.role name=source of=$::r',{ns:'N'}).ok,false);
 assert.equal(w.retract('r').ok,false);
});
test('inverse relations may be symmetric or one-sided but not inconsistent',()=>{
 for(const text of ['@a w.legend.relation name=near inverse=$a','@a w.legend.relation name=before inverse=$b\n@b w.legend.relation name=after','@a w.legend.relation name=before inverse=$b\n@b w.legend.relation name=after inverse=$a'])assert.equal(make().tell(text).ok,true);
 assert.equal(make().tell('@a w.legend.relation name=a inverse=$b\n@b w.legend.relation name=b inverse=$c\n@c w.legend.relation name=c').ok,false);
 const w=make();w.load('@s w.legend.space name=s form=axes version=1\n@t w.legend.space name=t form=axes version=1');
 assert.equal(w.tell('@a w.legend.relation name=a space=$s inverse=$b\n@b w.legend.relation name=b space=$t').ok,false);
});
test('unknown fields, wrong references and missing names are rejected',()=>{
 for(const text of ['@c w.legend.concept group=thing','@c w.legend.concept name=c specialises=$missing','@c w.legend.concept name=c mystery=yes','@r w.legend.relation test=check','@r w.legend.role name=subject','@r w.legend.relation name=r\n@c w.legend.concept name=c specialises=$r'])assert.equal(make().tell(text).ok,false);
});
test('hierarchy and role checks survive module aliases',()=>{
 const w=new World();w.load('@use core.use world=w.legend as=app.legend');
 assert.equal(w.tell('@a app.legend.concept name=a specialises=$b\n@b app.legend.concept name=b specialises=$a').ok,false);
 w.load('@c app.legend.condition kind=exists object=result\n@a app.legend.act name=make change=appear role=result after=$c');
 assert.equal(w.tell('@role app.legend.role name=other of=$a').ok,false);
});
