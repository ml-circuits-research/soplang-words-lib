import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,calibrateReference} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.reference');return w;};
const data=values=>values.map((v,i)=>`@s${i} std.reference.sample value=${v} unit=example.unit`).join('\n')+'\n@r std.reference.set version=1 property=width unit=example.unit '+values.map((_,i)=>`member=$s${i}`).join(' ');
test('book reference sample produces the reproducible median with detached inputs',()=>{
 const book=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');const w=make();w.load(book.match(/```sop\n(@sample.width.a std.reference.sample[\s\S]*?)\n```/)[1]);
 const r=calibrateReference(w,'reference.widths');assert.equal(r.ok,true);assert.equal(r.snapshot.value,10);assert.equal(r.snapshot.samples.length,3);
 assert.equal(w.revise('sample.width.b','value','100').ok,true);assert.equal(r.snapshot.value,10);assert.equal(calibrateReference(w,'reference.widths').snapshot.value,12);
});
test('distinct equal samples retain multiplicity; duplicate member identity does not',()=>{
 const w=make();w.load(data([8,8,12])+' member=$s0');const {snapshot}=calibrateReference(w,'r');assert.equal(snapshot.value,8);assert.equal(snapshot.samples.length,3);assert.deepEqual(snapshot.samples.map(s=>s.token),['8','8','12']);
});
test('median is robust at extreme finite values and refuses nonpositive normalisation',()=>{
 for(const [values,expected] of [[[Number.MAX_VALUE,Number.MAX_VALUE],Number.MAX_VALUE],[[Number.MIN_VALUE,Number.MIN_VALUE],Number.MIN_VALUE],[[Number.MIN_VALUE,2*Number.MIN_VALUE],2*Number.MIN_VALUE],[[-Number.MAX_VALUE,Number.MAX_VALUE],null],[[-4,-2],null],[[0],null],[[2,4],3]]){
  const w=make();w.load(data(values));const r=calibrateReference(w,'r');assert.equal(r.ok,expected!==null);if(r.ok)assert.equal(r.snapshot.value,expected);
 }
});
test('provenance closure is frozen, detached and JSON serializable',()=>{
 const w=make();w.load('@source std.source name=toy version=7 status=illustrative\n@mapping std.import.mapping name=measure version=2\n@p std.provenance source=$source record=row mapping=$mapping\n'+data([8]));
 assert.equal(w.revise('s0','provenance','$p').ok,true);const {snapshot}=calibrateReference(w,'r');assert.equal(snapshot.evidence.length,3);
 assert.throws(()=>{snapshot.samples[0].value=9;},TypeError);assert.throws(()=>{snapshot.evidence[0].attrs.record.push('changed');},TypeError);
 assert.equal(w.revise('source','version','8').ok,true);assert.deepEqual(snapshot.evidence.find(e=>e.id==='source').attrs.version,['7']);
 const restored=JSON.parse(JSON.stringify(snapshot));assert.equal(restored.value,8);assert.deepEqual(restored.samples,snapshot.samples);assert.equal(restored.evidence.length,3);
});
test('capture supports aliases, namespaces and reference subtypes',()=>{
 const w=new World();w.load('@use core.use world=std.reference as=app.ref\n@sub core.type of=example.reference extends=app.ref.set');w.tell(data([1,3,5]).replaceAll('std.reference.sample','app.ref.sample').replace('std.reference.set','example.reference'),{ns:'A'});
 assert.equal(calibrateReference(w,'A::r',{family:'app.ref'}).snapshot.value,3);
});
test('unknown contracts, missing identities and budget exhaustion fail without mutation',()=>{
 const w=make();w.load(data([1,2,3]));const before=w.get('r');assert.equal(calibrateReference(w,'missing').ok,false);assert.equal(calibrateReference(w,'s0').ok,false);
 const r=calibrateReference(w,'r',{budget:{steps:1}});assert.equal(r.ok,false);assert.equal(r.issues[0].kind,'budget');assert.deepEqual(w.get('r'),before);
 const raw=new World();raw.load('@r std.reference.set version=1 property=x unit=u member=$s\n@s std.reference.sample value=1 unit=u');assert.equal(calibrateReference(raw,'r').ok,false);
});
