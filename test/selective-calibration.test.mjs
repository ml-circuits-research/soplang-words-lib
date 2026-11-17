import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,retainSelectiveCalibration as retain,assessSelectiveCalibration as assess} from '../tools/lib-under-test.mjs';
const row=(id,score,correct=true,eligible=true)=>({id,source:id,score,eligible,correct:eligible?correct:null});
const identity={model:'example.model@1',decoder:'example.decoder@1',score:'minimum-decision-margin@1',bindings:'example.bindings@1'};
const input=extra=>({owner:'calibration',revision:'1',identity,scope:'example.whole-prediction',policy:{minFitAccepted:2,minEvaluationAccepted:2,maxErrorRate:0},fitRows:[row('f1',9),row('f2',8),row('f3',7,false),row('f4',null,null,false)],evaluationRows:[row('e1',10),row('e2',8),row('e3',6,false),row('e4',null,null,false)],...extra});
const query=(score,extra={})=>({identity,scope:'example.whole-prediction',score,eligible:true,...extra});
const ref={owner:'calibration',revision:'1'};
test('fit maximizes coverage under policy; independent evaluation approves fixed threshold',()=>{
 const w=new World(),r=retain(w,input());assert.equal(r.ok,true);assert.equal(r.calibration.threshold,8);assert.equal(r.calibration.approved,true);assert.equal(r.calibration.fit.coverage,.5);assert.equal(r.calibration.evaluation.abstained,2);
 assert.equal(assess(w,ref,query(8)).admitted,true);assert.equal(assess(w,ref,query(7)).admitted,false);assert.equal(assess(w,ref,query(null,{eligible:false})).reason,'candidate-ineligible');
 assert.equal(assess(w,ref,query(9,{identity:{...identity,model:'changed'}})).reason,'calibration-context-mismatch');assert.equal(assess(w,ref,query(9,{scope:'other'})).admitted,false);
});
test('evaluation failure cannot retune the fitted threshold or approve empty acceptance',()=>{
 const w=new World(),r=retain(w,input({evaluationRows:[row('e1',10),row('e2',8,false),row('e3',7)]}));assert.equal(r.calibration.threshold,8);assert.equal(r.calibration.reason,'evaluation-risk-exceeded');assert.equal(assess(w,ref,query(100)).admitted,false);
 for(const evaluationRows of [[],[row('e',2)],[row('e',null,null,false)]]){const v=new World(),x=retain(v,input({evaluationRows}));assert.equal(x.ok,true);assert.equal(x.calibration.approved,false);}
});
test('equal-score groups cannot be split by label or input order',()=>{
 for(const fitRows of [[row('a',9),row('b',9,false),row('c',10)],[row('b',9,false),row('c',10),row('a',9)]]){const w=new World(),r=retain(w,input({fitRows}));assert.equal(r.calibration.threshold,null);assert.equal(r.calibration.reason,'no-fit-threshold');}
});
test('global source and row identities forbid overlap and replicated evidence',()=>{
 for(const change of [{evaluationRows:[row('f1',10),row('e2',8)]},{evaluationRows:[{...row('e1',10),source:'f1'},row('e2',8)]},{fitRows:[row('a',9),{...row('b',8),source:'a'}]}]){const w=new World();assert.equal(retain(w,input(change)).ok,false);assert.equal(w.retainedRevision(ref.owner,ref.revision),null);}
});
test('eligible unknown labels, nonfinite/coerced values and accessors refuse without execution',()=>{
 let accessed=false;const bad={...input()};Object.defineProperty(bad,'fitRows',{get(){accessed=true;return [];},enumerable:true});assert.equal(retain(new World(),bad).ok,false);assert.equal(accessed,false);
 for(const r of [{...row('x',8),correct:null},row('x',NaN),row('x','8'),{...row('x',null,null,false),correct:false}])assert.equal(retain(new World(),input({fitRows:[r]})).ok,false);
});
test('dry retention, identity conflicts and budget failure publish no altered artifact',()=>{
 const w=new World();assert.equal(retain(w,input(),{dry:true}).ok,true);assert.equal(w.retainedRevision(ref.owner,ref.revision),null);assert.equal(retain(w,input(),{budget:{steps:1}}).ok,false);assert.equal(w.retainedRevision(ref.owner,ref.revision),null);
 const first=retain(w,input()).retained;assert.equal(retain(w,input({scope:'changed'})).ok,false);assert.equal(w.retainedRevision(ref.owner,ref.revision),first);assert.equal(assess(w,ref,query(9),{budget:{steps:1}}).admitted,false);
});
test('restored immutable evidence is recomputed; a forged summary never grants admission',()=>{
 const w=new World();retain(w,input());const restored=World.fromJSON(w.toJSON());assert.equal(assess(restored,ref,query(9)).admitted,true);
 const f=new World(),definition=structuredClone(w.retainedRevision(ref.owner,ref.revision).definition);definition.report.threshold=0;assert.equal(f.retainRevision(ref.owner,ref.revision,definition).ok,true);assert.equal(assess(f,ref,query(9)).reason,'calibration-summary-mismatch');
});
test('rejected labels do not get rounded to zero empirical risk',()=>{
 const fitRows=Array.from({length:2001},(_,i)=>row('f'+i,8,i!==2000));const w=new World(),r=retain(w,input({fitRows}));assert.equal(r.calibration.threshold,null);assert.equal(r.calibration.approved,false);
});
