import {inspectRequest} from './request-contracts.mjs';
import {evaluateRequestPredicates} from './request-predicate.mjs';
import {retainedDefinition} from './retained-revisions.mjs';
const first=(w,k)=>w?.attrs[k]?.[0],ref=v=>typeof v==='string'&&v.startsWith('$')?v.slice(1):null,text=v=>typeof v==='string'&&v.length>0;
/** Canonical population membership and snapshot coverage are trusted declarations.
 * No subtype, number, ordinal, context, execution or creation inference. */
export function resolveRequestTargets(world,request,options={}){
 let budget=100000,steps=0,id=typeof request==='string'?request.replace(/^\$/,''):null,stamp=world?.stamp,clock=world?._clock;const targets=[];
 const fail=reason=>{throw {resolution:true,reason};},tick=()=>{if(++steps>budget)fail('budget');},fresh=()=>{if(world.stamp!==stamp||world._clock!==clock)fail('source-changed');};
 const copy=value=>{const out=retainedDefinition(value,tick);fresh();return out;};
 const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
 try{
  if(!world||!id)fail('invalid-input');const descriptors=Object.getOwnPropertyDescriptors(options),opts={};for(const key of Reflect.ownKeys(descriptors)){tick();if(typeof key!=='string'||!['populations','policies','evaluateConstraint','evaluateTarget','bindings','family','budget'].includes(key)||!Object.hasOwn(descriptors[key],'value'))fail('invalid-options');opts[key]=descriptors[key].value;}
  budget=opts.budget??100000;const family=opts.family??'std.request';if(!Number.isSafeInteger(budget)||budget<1||!text(family)||opts.evaluateConstraint!==undefined&&typeof opts.evaluateConstraint!=='function'||opts.evaluateTarget!==undefined&&typeof opts.evaluateTarget!=='function')fail('invalid-options');
  tick();const inspected=inspectRequest(world,id,{family,budget:{steps:Math.max(1,budget-steps)}});steps+=world.stats().steps;fresh();if(!inspected.ok)fail(inspected.issues.some(i=>i.kind==='budget')?'budget':'invalid-request');
  tick();const checked=world.check(undefined,{budget:{steps:Math.max(1,budget-steps)}});steps+=world.stats().steps;fresh();if(!checked.ok)fail(checked.violations.some(i=>i.kind==='budget')?'budget':'invalid-schema');
  const requestWire=copy(world.get(id)),populations=copy(opts.populations??{}),policies=copy(opts.policies??{}),bindings=copy(opts.bindings??{}),owned=new Map();
  for(const wire of world.ofType(family+'.target')){tick();if(ref(first(wire,'request'))===id)owned.set(wire.id,copy(wire));}
  for(const data of [populations,policies,bindings]){if(!data||typeof data!=='object'||Array.isArray(data))fail('invalid-options');for(const key of Object.keys(data)){tick();if(!owned.has(key))fail('foreign-target');}}
  // Ground context may describe other targets, but cannot decide the very
  // candidate being selected or supply a quantifier's lexical variable globally.
  for(const [key,value]of Object.entries(bindings)){tick();if(first(owned.get(key),'mode')==='bound')fail('global-bound-binding');if(Object.hasOwn(populations,key))fail('candidate-binding-conflict');validateBinding(value);}
  function validateContext(ctx){if(!shape(ctx,['instanceId','scope','version'])||!['instanceId','scope','version'].every(k=>text(ctx[k])))throw Error('invalid context');}
  function validateSubject(subject,ctx){if(!shape(subject,['id','source','sourceType','version'])||!(text(subject.id)||Number.isSafeInteger(subject.id))||!['source','sourceType','version'].every(k=>text(subject[k]))||subject.version!==ctx.version)throw Error('invalid subject');}
  function validateBinding(value){if(!shape(value,['context','subject']))throw Error('invalid binding');validateContext(value.context);validateSubject(value.subject,value.context);}
  for(const [target,node]of owned){
   tick();const mode=first(node,'mode'),base={target,kind:first(node,'kind')??null,matches:[],candidates:[],evidence:[]};
   const unresolved=(reason,choices=base.matches)=>({...base,status:'unknown',clarification:{target,reason,choices}});
   if(mode==='new'){targets.push({...base,status:'requires-creation',clarification:null});continue;}
   if(mode==='bound'){if(Object.hasOwn(populations,target)||Object.hasOwn(policies,target))fail('global-bound-population');targets.push({...base,status:'lexically-bound',clarification:null});continue;}
   const population=populations[target],policy=policies[target];
   if(!population){targets.push(unresolved('missing-population'));continue;}
   let valid=true;try{if(!shape(population,['kind','context','complete','subjects','evidence'])||population.kind!==base.kind||typeof population.complete!=='boolean'||!Array.isArray(population.subjects)||!Array.isArray(population.evidence))throw Error();validateContext(population.context);const sources=new Set();for(const subject of population.subjects){tick();validateSubject(subject,population.context);if(sources.has(subject.source))throw Error();sources.add(subject.source);}}catch(error){if(error?.resolution)throw error;valid=false;}
   if(!valid){targets.push(unresolved('invalid-canonical-population'));continue;}
   base.evidence=population.evidence;let unknown=0,targetUnknown=0;
   for(const subject of population.subjects){
    tick();const ground=copy({context:population.context,subject});let evaluation=null,truth='true',targetEvaluation={truth:'true',evidence:[]};
    if(opts.evaluateTarget){
     tick();const input=copy({request:requestWire,target:node,binding:ground,bindings:{...bindings,[target]:ground}});let raw,threw=false;
     try{raw=opts.evaluateTarget(input);}catch(error){fresh();threw=true;targetEvaluation={truth:'unknown',evidence:[],reason:'target-callback-threw'};}
     fresh();if(!threw){try{const captured=copy(raw),keys=Object.keys(captured??{});if(!captured||typeof captured!=='object'||Array.isArray(captured)||!['truth','evidence'].every(k=>Object.hasOwn(captured,k))||keys.some(k=>!['truth','evidence','reason'].includes(k))||!['true','false','unknown'].includes(captured.truth)||!Array.isArray(captured.evidence)||captured.reason!==undefined&&!text(captured.reason))throw Error();targetEvaluation=captured;}catch(error){fresh();if(error?.resolution)throw error;targetEvaluation={truth:'unknown',evidence:[],reason:'invalid-target-callback-data'};}}
    }else if(first(node,'name')!==undefined)targetEvaluation={truth:'unknown',evidence:[],reason:'missing-target-evaluator'};

    if(first(node,'selector')!==undefined){
     if(Object.hasOwn(bindings,target))fail('candidate-binding-conflict');
     evaluation=evaluateRequestPredicates(world,id,{family,selector:target,bindings:{...bindings,[target]:ground},evaluateConstraint:opts.evaluateConstraint,budget:Math.max(1,budget-steps)});steps+=evaluation.steps;fresh();tick();if(!evaluation.ok&&evaluation.failures.some(i=>['budget','source-changed'].includes(i.reason)))fail(evaluation.failures[0].reason);truth=evaluation.truth;
    }
    truth=targetEvaluation.truth==='false'||truth==='false'?'false':targetEvaluation.truth==='unknown'||truth==='unknown'?'unknown':'true';
    base.candidates.push({binding:ground,truth,evaluation,targetEvaluation});if(truth==='true')base.matches.push(ground);else if(truth==='unknown'){unknown++;if(targetEvaluation.truth==='unknown')targetUnknown++;}
   }
   if(!['one','all'].includes(policy)){targets.push(unresolved('missing-or-invalid-policy'));continue;}
   if(policy==='one'&&base.matches.length>1){targets.push({...base,status:'ambiguous',clarification:{target,reason:'multiple-matching-subjects',choices:base.matches}});continue;}
   if(!population.complete||unknown){targets.push(unresolved(!population.complete?'population-incomplete':targetUnknown?'target-predicate-unknown':'selector-unknown'));continue;}
   if(policy==='one'&&!base.matches.length){targets.push({...base,status:'missing',clarification:{target,reason:'no-matching-subject',choices:[]}});continue;}
   targets.push({...base,status:'resolved',clarification:null});
  }
  fresh();return {ok:true,request:id,sourceStamp:stamp,targets:copy(targets),steps,trust:'canonical kind membership, population coverage and pure target/selector callbacks over explicit stable snapshots; no subtype inference'};
 }catch(error){return {ok:false,request:id,truth:'unknown',targets:[],steps,issues:[{reason:world?.stamp!==stamp||world?._clock!==clock?'source-changed':error?.resolution?error.reason:'invalid-resolution-data'}]};}
}
