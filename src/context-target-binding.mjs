import {retainedDefinition} from './retained-revisions.mjs';
import {serializeRequestGraph} from './request-serialize.mjs';
import {evaluateExistenceEvidence} from './reply-existence.mjs';
const FORMAT='sop.context-target.binding';
const text=x=>typeof x==='string'&&x.length>0;
const shape=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const strings=(x,keys)=>keys.every(k=>text(x[k]));
/** Exact historical join only. The bridge declares correlation and the host
 * snapshot/membership meaning; this read does not authenticate those declarations. */
export function lookupContextTargetBinding(world,reference,options={}){
 let budget=100000,graphBudget=20000,steps=0;const stamp=world?.stamp,clock=world?._clock;
 const fail=reason=>{throw {binding:true,reason};},tick=()=>{if(++steps>budget)fail('budget');};
 const fresh=()=>{if(world.stamp!==stamp||world._clock!==clock)fail('source-changed');};
 const copy=x=>{const out=retainedDefinition(x,tick);fresh();return out;};
 const identity=x=>shape(x,['owner','revision'])&&strings(x,['owner','revision']);
 const context=x=>shape(x,['instanceId','scope','version'])&&strings(x,['instanceId','scope','version']);
 const sameContext=(a,b)=>['instanceId','scope','version'].every(k=>a[k]===b[k]);
 const get=ref=>{tick();if(!identity(ref))fail('invalid-retained-reference');const record=copy(world.retainedRevision(ref.owner,ref.revision));if(!record)fail('missing-retained-record');if(!shape(record,['owner','revision','definition'])||record.owner!==ref.owner||record.revision!==ref.revision)fail('retained-identity-mismatch');return record.definition;};
 try{
  if(!world||typeof world.retainedRevision!=='function')fail('invalid-world');
  // Read only fixed data descriptors before copying options, so a small caller
  // allowance governs the options copy too. Accessors are never invoked.
  if(!options||typeof options!=='object'||Array.isArray(options)||![Object.prototype,null].includes(Object.getPrototypeOf(options)))fail('invalid-options');
  for(const key of ['budget','graphBudget']){const d=Object.getOwnPropertyDescriptor(options,key);if(d){if(!Object.hasOwn(d,'value')||!Number.isSafeInteger(d.value)||d.value<1)fail('invalid-options');if(key==='budget')budget=d.value;else graphBudget=d.value;}}
  const opts=copy(options);if(Object.keys(opts).some(k=>!['budget','graphBudget'].includes(k)))fail('invalid-options');tick();
  const root=copy(reference),bridge=get(root);
  if(!shape(bridge,['format','schemaVersion','graph','evidence','membership','witness'])||bridge.format!==FORMAT||bridge.schemaVersion!==1)fail('invalid-binding-record');
  const {graph,evidence,membership,witness}=bridge;
  if(!shape(graph,['owner','revision','target'])||!strings(graph,['owner','revision','target'])||!shape(evidence,['owner','revision','phase','member'])||!strings(evidence,['owner','revision','member'])||!['before','after'].includes(evidence.phase)||!identity(membership))fail('invalid-binding-references');
  if(!shape(witness,['authority','graphRequest','traceRequest','step','invocation','context','population'])||!strings(witness,['authority','graphRequest','traceRequest','step','invocation'])||!context(witness.context)||!shape(witness.population,['source','scope','version'])||!strings(witness.population,['source','scope','version']))fail('missing-or-invalid-correlation-witness');
  const revision=get({owner:graph.owner,revision:graph.revision});
  if(!shape(revision,['format','schemaVersion','graph','parent','changes'])||revision.format!=='sop.request.revision'||revision.schemaVersion!==1)fail('invalid-request-revision');
  // The existing serializer checks schema, ownership and structural inspection in
  // its own finite graph budget. No graph is loaded into the caller's world.
  tick();const checked=serializeRequestGraph(revision.graph,{budget:graphBudget});fresh();
  if(!checked.ok)fail(checked.issues.some(x=>x.reason==='budget'||x.reason==='schema-budget')?'graph-budget':'invalid-request-graph');
  if(witness.graphRequest!==revision.graph.request)fail('graph-request-mismatch');
  let target=null;for(const node of revision.graph.nodes){tick();if(node.id===graph.target)target=node;}
  if(!target||target.type!=='std.request.target'||target.attrs.request?.[0]?.value!==revision.graph.request)fail('foreign-or-missing-target');
  const kind=target.attrs.kind?.[0];if(!kind||kind.kind!=='literal'||!text(kind.value)||target.attrs.mode?.[0]?.value==='bound')fail('unknown-target-kind');
  const snapshot=get({owner:evidence.owner,revision:evidence.revision});
  tick();const verdict=evaluateExistenceEvidence(snapshot,tick);fresh();
  if(!verdict||snapshot.status!==verdict.status||snapshot.reason!==verdict.reason)fail('invalid-existence-evidence');
  if(witness.traceRequest!==snapshot.request.id||witness.step!==snapshot.step.id||witness.invocation!==snapshot.step.invocation)fail('trace-correlation-mismatch');
  const population=snapshot[evidence.phase];
  if(['source','scope','version'].some(k=>population[k]!==witness.population[k]))fail('trace-population-mismatch');
  let member=null;for(const item of population.members){tick();if(item.id===evidence.member){if(member)fail('conflicting-trace-member');member=item;}}
  if(!member)fail('missing-trace-member');
  const canonical=get(membership);
  if(!shape(canonical,['kind','context','complete','subjects','evidence'])||!text(canonical.kind)||!context(canonical.context)||typeof canonical.complete!=='boolean'||!Array.isArray(canonical.subjects)||!Array.isArray(canonical.evidence))fail('invalid-canonical-membership');
  if(canonical.kind!==kind.value)fail('canonical-kind-mismatch');
  if(!sameContext(canonical.context,witness.context))fail('host-context-mismatch');
  const sources=new Set();let subject=null;
  for(const item of canonical.subjects){
   tick();if(!shape(item,['id','source','sourceType','version'])||!(text(item.id)||Number.isSafeInteger(item.id))||!strings(item,['source','sourceType','version'])||item.version!==canonical.context.version||sources.has(item.source))fail('conflicting-canonical-membership');sources.add(item.source);
   if(item.source===member.source){if(item.sourceType!==member.sourceType||item.version!==member.version)fail('subject-snapshot-mismatch');subject=item;}
  }
  if(!subject)fail('missing-canonical-subject');
  // A known selected member remains evidence in partial populations and after
  // removal. Neither completeness nor an effect-success verdict is required.
  const result=copy({reference:root,graph:{...graph,request:revision.graph.request,targetDefinition:target},binding:{context:canonical.context,subject},canonicalKind:kind.value,evidence:{reference:evidence,snapshot,population,member},membership:{reference:membership,population:canonical},witness});
  fresh();return {ok:true,status:'bound-historically',historicalOnly:true,liveBinding:null,...result,steps,limits:{copyAndLookup:budget,perGraph:graphBudget},trust:'externally declared graph-target/trace-member correlation, host context, canonical membership and stable snapshot identity; no incarnation or live identity proof'};
 }catch(error){return {ok:false,status:'unknown',historicalOnly:true,liveBinding:null,binding:null,canonicalKind:null,issues:[{reason:world?.stamp!==stamp||world?._clock!==clock?'source-changed':error?.binding?error.reason:'invalid-binding-data'}],steps,limits:{copyAndLookup:budget,perGraph:graphBudget}};}
}
