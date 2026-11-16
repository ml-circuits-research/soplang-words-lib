import {serializeRequestGraph} from './request-serialize.mjs';
import {retainedDefinition} from './retained-revisions.mjs';
const FORMAT='sop.request.revision';
/** Retain an explicit graph revision. Selection of a prior turn and interpretation
 * of a correction belong to the caller; this mechanism performs no effects. */
export function retainRequestRevision(world,input,{budget=200000,graphBudget=20000,retentionBudget=200000,dry=false}={}){
 let steps=0;const fail=reason=>{throw {revision:true,reason};},tick=()=>{if(++steps>budget)fail('copy-budget');};
 const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
 const identity=v=>shape(v,['owner','revision'])&&['owner','revision'].every(k=>typeof v[k]==='string'&&v[k]);
 const copy=v=>retainedDefinition(v,tick);
 const validate=graph=>{const result=serializeRequestGraph(graph,{budget:graphBudget});if(!result.ok)fail('invalid-request-graph');return result;};
 try{
  if(![budget,graphBudget,retentionBudget].every(n=>Number.isSafeInteger(n)&&n>0)||typeof dry!=='boolean')fail('invalid-options');
  if(!world||typeof world.retainRevision!=='function'||typeof world.retainedRevision!=='function')fail('invalid-world');
  if(world._runningValidator){world._validatorMutation=true;fail('publication-inside-validator');}
  const packet=copy(input);let graph,parent=null,changes=null;
  if(!packet||!identity({owner:packet.owner,revision:packet.revision}))fail('invalid-revision-identity');
  if(Object.hasOwn(packet,'graph')){
   if(!shape(packet,['owner','revision','graph']))fail('invalid-input');graph=packet.graph;
  }else{
   if(!shape(packet,['owner','revision','base','changes'])||!identity(packet.base)||!shape(packet.changes,['put','remove'])||!Array.isArray(packet.changes.put)||!Array.isArray(packet.changes.remove))fail('invalid-input');
   parent=packet.base;changes=packet.changes;
   if(parent.owner===packet.owner&&parent.revision===packet.revision)fail('self-parent');
   const base=world.retainedRevision(parent.owner,parent.revision)?.definition;
   if(!base||base.format!==FORMAT||base.schemaVersion!==1||!shape(base,['format','schemaVersion','graph','parent','changes']))fail('missing-or-foreign-base');
   validate(base.graph);
   const nodes=new Map();for(const node of base.graph.nodes){tick();nodes.set(node.id,node);}
   const removed=new Set(),put=new Set();
   for(const id of changes.remove){tick();if(typeof id!=='string'||removed.has(id)||!nodes.has(id))fail('invalid-removal');removed.add(id);nodes.delete(id);}
   for(const node of changes.put){
    tick();if(!node||typeof node.id!=='string'||put.has(node.id)||removed.has(node.id))fail('duplicate-or-conflicting-change');put.add(node.id);
    const previous=nodes.get(node.id);
    if(previous?.type==='std.request.source'&&JSON.stringify(previous)!==JSON.stringify(node))fail('source-replacement-requires-new-identity');
    nodes.set(node.id,node);
   }
   graph=copy({request:base.graph.request,nodes:[...nodes.values()]});
  }
  const serialized=validate(graph),definition=copy({format:FORMAT,schemaVersion:1,graph,parent,changes});
  const saved=world.retainRevision(packet.owner,packet.revision,definition,{dry,budget:{steps:retentionBudget}});
  return {...saved,...(saved.ok?{graph:saved.retained.definition.graph,wires:serialized.wires}:{}),steps,limits:{copy:budget,perGraph:graphBudget,retention:retentionBudget}};
 }catch(error){return {ok:false,created:false,issues:[{reason:error?.revision?error.reason:'invalid-revision-data'}],steps};}
}
