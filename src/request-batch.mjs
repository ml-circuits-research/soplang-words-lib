import { parse, readValue } from './parser.mjs';
import { retainedDefinition } from './retained-revisions.mjs';
import { serializeRequestGraph } from './request-serialize.mjs';

const plans=new WeakMap();
const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function frozen(value){if(value&&typeof value==='object'){for(const child of Object.values(value))frozen(child);Object.freeze(value);}return value;}
/** Validate the entire batch before any consumer dispatch; order is explicit only. */
export function prepareRequestBatch(input,{budget=200000,graphBudget=20000}={}){
 let steps=0;const fail=(reason,id)=>{throw {batch:true,reason,...(id?{id}:{})};};const tick=()=>{if(++steps>budget)fail('budget');};
 try{
  if(![budget,graphBudget].every(n=>Number.isSafeInteger(n)&&n>0))fail('invalid-budget');
  const packet=retainedDefinition(input,tick);if(!shape(packet,['entries'])||!Array.isArray(packet.entries)||!packet.entries.length)fail('invalid-batch');
  const ids=new Set(),entries=[];
  for(const entry of packet.entries){
   tick();if(!shape(entry,['id','request','wires','after'])||typeof entry.id!=='string'||!entry.id||typeof entry.request!=='string'||!entry.request||typeof entry.wires!=='string'||!Array.isArray(entry.after))fail('invalid-entry');
   if(ids.has(entry.id))fail('duplicate-entry',entry.id);ids.add(entry.id);
   const after=new Set();for(const dependency of entry.after){tick();if(typeof dependency!=='string'||!dependency||dependency===entry.id||after.has(dependency))fail('invalid-dependency',entry.id);after.add(dependency);}
   const nodes=parse(entry.wires).map(w=>{
    tick();if(w.pattern)fail('pattern-not-request-data',entry.id);
    const attrs={};for(const [key,tokens] of Object.entries(w.attrs)){tick();Object.defineProperty(attrs,key,{enumerable:true,value:tokens.map(token=>{tick();const value=readValue(token);return {kind:value.kind==='atom'?'literal':value.kind,value:value.v};})});}
    return {id:w.id,type:w.type,attrs};
   });
   const result=serializeRequestGraph({request:entry.request,nodes},{budget:graphBudget});
   if(!result.ok)fail('invalid-request:'+result.issues[0].reason,entry.id);
   entries.push({id:entry.id,request:entry.request,wires:result.wires,after:[...after].sort()});
  }
  const remaining=new Map(),children=new Map();
  for(const entry of entries){tick();remaining.set(entry.id,entry.after.length);for(const dependency of entry.after){tick();if(!ids.has(dependency))fail('missing-dependency',entry.id);if(!children.has(dependency))children.set(dependency,[]);children.get(dependency).push(entry.id);}}
  let ready=entries.filter(e=>{tick();return !e.after.length;}).map(e=>e.id).sort(),count=0;const layers=[];
  while(ready.length){tick();layers.push(ready);count+=ready.length;const next=[];for(const id of ready){tick();for(const child of children.get(id)||[]){tick();const left=remaining.get(child)-1;remaining.set(child,left);if(!left)next.push(child);}}ready=next.sort();}
  if(count!==entries.length)fail('dependency-cycle');
  const plan=frozen({entries:entries.sort((a,b)=>{tick();return a.id<b.id?-1:a.id>b.id?1:0;}),layers});
  plans.set(plan,true);return {ok:true,plan,issues:[]};
 }catch(error){return {ok:false,issues:[{reason:error?.batch?error.reason:'invalid-batch-data',...(error?.id?{id:error.id}:{})}]};}
}
/** Scheduling only: unverified effects never satisfy a semantic-success dependency. */
export function requestBatchFrontier(plan,outcomes=[],{budget=200000}={}){
 let steps=0;const fail=reason=>{throw {batch:true,reason};};const tick=()=>{if(++steps>budget)fail('budget');};
 try{
  if(!Number.isSafeInteger(budget)||budget<1)fail('invalid-budget');if(!plans.has(plan))fail('foreign-plan');
  const copy=retainedDefinition(outcomes,tick);if(!Array.isArray(copy))fail('invalid-outcomes');
  const entries=new Map(plan.entries.map(e=>{tick();return [e.id,e];})),states=new Map();
  for(const outcome of copy){tick();if(!shape(outcome,['id','status'])||!entries.has(outcome.id)||states.has(outcome.id)||!['confirmed','unverified','refused','failed','unknown'].includes(outcome.status))fail('invalid-outcomes');states.set(outcome.id,outcome.status);}
  // Outcomes for a dependent entry must not predate successful prerequisites.
  for(const [id] of states){tick();for(const dependency of entries.get(id).after){tick();if(states.get(dependency)!=='confirmed')fail('premature-outcome');}}
  const ready=[],waiting=[],blocked=[],complete=[];const obstructed=new Set();
  for(const layer of plan.layers)for(const id of layer){tick();if(states.has(id)){complete.push({id,status:states.get(id)});if(states.get(id)!=='confirmed')obstructed.add(id);continue;}
   const dependencies=entries.get(id).after;const blockers=[];let pending=false;
   for(const dependency of dependencies){tick();if(obstructed.has(dependency))blockers.push(dependency);else if(!states.has(dependency))pending=true;}
   if(blockers.length){blocked.push({id,dependencies:blockers});obstructed.add(id);}else if(pending)waiting.push(id);else ready.push(id);
  }
  return {ok:true,ready,waiting,blocked,complete,issues:[]};
 }catch(error){return {ok:false,ready:[],waiting:[],blocked:[],complete:[],issues:[{reason:error?.batch?error.reason:'invalid-outcomes'}]};}
}
