import {retainedDefinition} from './retained-revisions.mjs';

const FORMAT='sop.selective.calibration';
const verified=new WeakMap();
const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=v=>typeof v==='string'&&v.length>0;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function identity(v){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length>0;}

function derive(input,tick){
 const fail=reason=>{throw Error(reason);};
 if(!shape(input,['identity','scope','policy','fitRows','evaluationRows'])||!identity(input.identity)||!text(input.scope))fail('invalid-calibration-input');
 const p=input.policy;
 if(!shape(p,['minFitAccepted','minEvaluationAccepted','maxErrorRate'])||!['minFitAccepted','minEvaluationAccepted'].every(k=>Number.isSafeInteger(p[k])&&p[k]>0)||!finite(p.maxErrorRate)||p.maxErrorRate<0||p.maxErrorRate>1)fail('invalid-admission-policy');
 const ids=new Set(),sources=new Set();
 for(const rows of [input.fitRows,input.evaluationRows]){
  tick();if(!Array.isArray(rows)||rows.length>50000)fail('invalid-calibration-rows');
  for(const row of rows){
   tick();if(!shape(row,['id','source','score','eligible','correct'])||!text(row.id)||!text(row.source)||typeof row.eligible!=='boolean'||!(row.score===null||finite(row.score)))fail('invalid-calibration-row');
   if(row.eligible?!finite(row.score)||typeof row.correct!=='boolean':row.correct!==null)fail('unknown-eligible-label');
   if(ids.has(row.id)||sources.has(row.source))fail('overlapping-or-repeated-source');
   ids.add(row.id);sources.add(row.source);
  }
 }
 // Fit threshold selection never reads evaluation labels. Equal scores form one group.
 const ordered=input.fitRows.filter(row=>{tick();return row.eligible;}).sort((a,b)=>{tick();return b.score-a.score;});
 let threshold=null,accepted=0,wrong=0;
 for(let i=0;i<ordered.length;){
  tick();const score=ordered[i].score;
  do{tick();accepted++;if(!ordered[i].correct)wrong++;i++;}while(i<ordered.length&&ordered[i].score===score);
  if(accepted>=p.minFitAccepted&&wrong<=p.maxErrorRate*accepted)threshold=score;
 }
 const summarize=rows=>{
  let eligible=0,accepted=0,wrong=0;
  for(const row of rows){tick();if(row.eligible){eligible++;if(threshold!==null&&row.score>=threshold){accepted++;if(!row.correct)wrong++;}}}
  return {total:rows.length,eligible,ineligible:rows.length-eligible,accepted,abstained:rows.length-accepted,correct:accepted-wrong,wrong,coverage:rows.length?accepted/rows.length:0,risk:accepted?wrong/accepted:null};
 };
 const fit=summarize(input.fitRows),evaluation=summarize(input.evaluationRows);
 const approved=threshold!==null&&evaluation.accepted>=p.minEvaluationAccepted&&evaluation.wrong<=p.maxErrorRate*evaluation.accepted;
 return {threshold,approved,reason:threshold===null?'no-fit-threshold':evaluation.accepted<p.minEvaluationAccepted?'insufficient-evaluation-support':approved?'empirical-policy-met':'evaluation-risk-exceeded',fit,evaluation};
}

/** C1 labels and pipeline identity are trusted declarations; this is empirical
 * selective admission, not a calibrated per-prediction probability or guarantee. */
export function retainSelectiveCalibration(world,input,options={}){
 return world._guard(options,()=>{
  const tick=()=>world._b.tick('validate'),fail=reason=>({ok:false,created:false,issues:[{reason}]});
  if(world._runningValidator){world._validatorMutation=true;return fail('publication-inside-validator');}
  let packet,definition;
  try{
   if(options.dry!==undefined&&typeof options.dry!=='boolean')return fail('invalid-dry-option');
   packet=retainedDefinition(input,tick);
   if(!shape(packet,['owner','revision','identity','scope','policy','fitRows','evaluationRows'])||!text(packet.owner)||!text(packet.revision))return fail('invalid-calibration-identity');
   const {owner,revision,...evidence}=packet;
   const report=derive(evidence,tick);
   definition=retainedDefinition({format:FORMAT,schemaVersion:1,evidence,report},tick);
   const saved=world.retainRevision(owner,revision,definition,{dry:options.dry});
   if(saved.ok&&!options.dry)verified.set(saved.retained.definition,definition);
   return {...saved,...(saved.ok?{calibration:definition.report}: {})};
  }catch(error){if(error===world._b.signal)throw error;return fail(error.message||'invalid-calibration-data');}
 },issue=>({ok:false,created:false,issues:[issue]}));
}

/** Read-only decision against immutable, recomputed evidence. Caller must supply
 * the same complete pipeline identity, scope and declared score definition. */
export function assessSelectiveCalibration(world,reference,candidate,options={}){
 return world._guard(options,()=>{
  const tick=()=>world._b.tick('validate'),fail=reason=>({ok:false,admitted:false,reason});
  try{
   const ref=retainedDefinition(reference,tick),query=retainedDefinition(candidate,tick);
   if(!shape(ref,['owner','revision'])||!text(ref.owner)||!text(ref.revision))return fail('invalid-calibration-identity');
   if(!shape(query,['identity','scope','score','eligible'])||!identity(query.identity)||!text(query.scope)||typeof query.eligible!=='boolean'||!(query.score===null||finite(query.score))||query.eligible&&!finite(query.score))return fail('invalid-admission-query');
   const record=world.retainedRevision(ref.owner,ref.revision);
   if(!record)return fail('missing-calibration');
   let definition=verified.get(record.definition);
   if(!definition){
    const copy=retainedDefinition(record.definition,tick);
    if(!shape(copy,['format','schemaVersion','evidence','report'])||copy.format!==FORMAT||copy.schemaVersion!==1)return fail('foreign-calibration');
    const computed=retainedDefinition(derive(copy.evidence,tick),tick);
    if(!same(copy.report,computed))return fail('calibration-summary-mismatch');
    definition=copy;verified.set(record.definition,copy);
   }
   if(!same(query.identity,definition.evidence.identity)||query.scope!==definition.evidence.scope)return fail('calibration-context-mismatch');
   const report=definition.report;
   const admitted=query.eligible&&report.approved&&query.score>=report.threshold;
   return {ok:true,admitted,reason:!query.eligible?'candidate-ineligible':!report.approved?report.reason:!admitted?'below-threshold':'empirical-policy-met',calibration:ref,threshold:report.threshold,policy:definition.evidence.policy,fit:report.fit,evaluation:report.evaluation,scope:definition.evidence.scope,trust:'C1 correctness labels, source identities and complete pipeline/score identity; no individual probability or future-error guarantee'};
  }catch(error){if(error===world._b.signal)throw error;return fail(error.message||'invalid-calibration-data');}
 },issue=>({ok:false,admitted:false,reason:'budget',issues:[issue]}));
}
