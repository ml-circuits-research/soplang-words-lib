import {serializeRequestGraph} from './request-serialize.mjs';
import {retainedDefinition} from './retained-revisions.mjs';

/** Strict rooted graph identity up to a bijection of local node identifiers.
 * Attribute value order, token kinds, literals and provenance all remain exact.
 * This is neither logical equivalence nor evidence of intent or execution. */
export function compareRequestGraphs(left,right,{budget=200000,graphBudget=20000,maxNodes=128}={}){
 let steps=0;
 const stop=reason=>{throw {requestComparison:true,reason};};
 const tick=()=>{if(++steps>budget)stop('budget');};
 const answer=(equal,reason,mapping=null)=>({ok:true,equal,reason,mapping,steps});
 try{
  if(![budget,graphBudget,maxNodes].every(n=>Number.isSafeInteger(n)&&n>0)||maxNodes>256)stop('invalid-options');
  const stringWork=(x,y)=>{for(let i=0;i<Math.max(x.length,y.length);i++)tick();};
  const order=(x,y)=>{tick();stringWork(x,y);return x<y?-1:x>y?1:0;};
  const a=retainedDefinition(left,tick),b=retainedDefinition(right,tick);
  for(const graph of [a,b]){
   tick();if(!graph||!Array.isArray(graph.nodes))stop('invalid-request-graph');
   if(graph.nodes.length>maxNodes)stop('node-limit');
   if(!serializeRequestGraph(graph,{budget:graphBudget}).ok)stop('invalid-request-graph');
  }
  if(a.nodes.length!==b.nodes.length)return answer(false,'node-count');
  const signature=node=>{
   tick();const keys=Object.keys(node.attrs).sort();
   const data=[node.type,keys.map(key=>{tick();return [key,node.attrs[key].map(token=>{
    tick();return token.kind==='ref'?['ref']:[token.kind,token.value];
   })];})];
   const text=JSON.stringify(data);for(let i=0;i<text.length;i++)tick();return text;
  };
  const aa=new Map(),bb=new Map(),groups=new Map();
  for(const n of a.nodes){tick();aa.set(n.id,{record:n,signature:signature(n)});}
  for(const n of b.nodes){
   tick();const s=signature(n);bb.set(n.id,{record:n,signature:s});
   if(!groups.has(s))groups.set(s,[]);groups.get(s).push(n.id);
  }
  for(const ids of groups.values())ids.sort(order);
  const choices=new Map();
  for(const [id,v]of aa){tick();const ids=groups.get(v.signature);if(!ids)return answer(false,'node-labels');choices.set(id,ids);}
  const mapping=new Map([[a.request,b.request]]),reverse=new Map([[b.request,a.request]]);
  const compatible=(x,y)=>{
   tick();const u=aa.get(x),v=bb.get(y);if(!u||!v)return false;
   stringWork(u.signature,v.signature);if(u.signature!==v.signature)return false;
   for(const key of Object.keys(u.record.attrs))for(let i=0;i<u.record.attrs[key].length;i++){
    tick();const p=u.record.attrs[key][i],q=v.record.attrs[key][i];
    if(p.kind==='ref'&&((mapping.has(p.value)&&mapping.get(p.value)!==q.value)||(reverse.has(q.value)&&reverse.get(q.value)!==p.value)))return false;
   }
   return true;
  };
  const consistent=()=>{for(const [x,y]of mapping){tick();if(!compatible(x,y))return false;}return true;};
  // Minimum remaining candidates; labels and the existing partial bijection prune
  // the search. A true result always carries a fully checked bijection.
  const visit=()=>{
   tick();if(!consistent())return false;
   if(mapping.size===aa.size)return true;
   let selected=null,available=null;
   for(const [x,ids]of choices){
    tick();if(mapping.has(x))continue;const candidates=[];
    for(const y of ids){tick();if(!reverse.has(y)&&compatible(x,y))candidates.push(y);}
    if(!candidates.length)return false;
    if(available===null||candidates.length<available.length){selected=x;available=candidates;}
   }
   for(const y of available){
    tick();mapping.set(selected,y);reverse.set(y,selected);
    if(visit())return true;mapping.delete(selected);reverse.delete(y);
   }
   return false;
  };
  if(!visit())return answer(false,'reference-structure');
  const witness=Object.create(null);
  for(const id of [...mapping.keys()].sort(order)){tick();witness[id]=mapping.get(id);}
  return answer(true,'local-identity-renaming',Object.freeze(witness));
 }catch(error){return {ok:false,equal:null,reason:error?.requestComparison?error.reason:'invalid-graph-data',mapping:null,steps};}
}
