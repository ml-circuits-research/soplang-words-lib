import { inspectRequest } from './request-contracts.mjs';
import { retainedDefinition } from './retained-revisions.mjs';

const first=(wire,key)=>wire?.attrs[key]?.[0];
const ref=value=>typeof value==='string'&&value.startsWith('$')?value.slice(1):null;
const invert=truth=>truth==='true'?'false':truth==='false'?'true':'unknown';
const text=value=>typeof value==='string'&&value.length>0;

/** Graph-only, synchronous three-valued evaluation. Callback truth and declared
 * population coverage are trusted inputs, never independent host assessments. */
export function evaluateRequestPredicates(world,request,options={}){
 let steps=0,budget=50000,stamp=world?.stamp,id=typeof request==='string'?request.replace(/^\$/,''):null;
 const trace=[],unknownReasons=[],failures=[];let provenance=null;
 const fail=(reason,node)=>{throw {requestPredicate:true,reason,...(node?{node}:{})};};
 const tick=()=>{if(++steps>budget)fail('budget');};
 const fresh=()=>{if(world.stamp!==stamp)fail('source-changed');};
 const copy=value=>{const result=retainedDefinition(value,tick);fresh();return result;};
 const append=(target,items)=>{for(const item of items){tick();target.push(item);}};
 const shape=(value,required,optional=[])=>{tick();return value&&typeof value==='object'&&!Array.isArray(value)&&required.every(key=>Object.hasOwn(value,key))&&Object.keys(value).every(key=>required.includes(key)||optional.includes(key));};
 const unknown=(reason,node,evidence=[])=>{const entry={reason,...(node?{node}:{})};unknownReasons.push(entry);return {truth:'unknown',evidence,reasons:[entry]};};
 const output=(ok,value)=>({ok,truth:value.truth,request:id,sourceStamp:stamp,evidence:value.evidence,reasons:value.reasons,unknownReasons,trace,failures,provenance,steps,trust:'pure callback semantic truth and population coverage over declared stable external snapshots; not independently assessed'});
 try{
  if(!world||!id||!Number.isSafeInteger(stamp))fail('invalid-input');
  const descriptors=Object.getOwnPropertyDescriptors(options);
  for(const key of Reflect.ownKeys(descriptors)){tick();if(typeof key!=='string'||!['evaluateConstraint','resolvePopulation','bindings','selector','family','budget','maxDepth'].includes(key)||!Object.hasOwn(descriptors[key],'value'))fail('invalid-options');}
  const opts=Object.fromEntries(Object.entries(descriptors).map(([key,value])=>[key,value.value]));
  budget=opts.budget??50000;const maxDepth=opts.maxDepth??64,family=opts.family??'std.request';
  if(!Number.isSafeInteger(budget)||budget<1||!Number.isSafeInteger(maxDepth)||maxDepth<1||maxDepth>256||!text(family)||opts.evaluateConstraint!==undefined&&typeof opts.evaluateConstraint!=='function'||opts.resolvePopulation!==undefined&&typeof opts.resolvePopulation!=='function')fail('invalid-options');
  tick();const inspected=inspectRequest(world,id,{family,budget:{steps:Math.max(1,budget-steps)}});steps+=world.stats().steps;fresh();
  if(!inspected.ok)fail(inspected.issues.some(issue=>issue.kind==='budget')?'budget':'invalid-request');
  tick();const schema=world.check(undefined,{budget:{steps:Math.max(1,budget-steps)}});steps+=world.stats().steps;fresh();
  if(!schema.ok)fail(schema.violations.some(issue=>issue.kind==='budget')?'budget':'invalid-schema');
  tick();const requestWire=copy(world.get(id)),targets=new Map(),nodes=new Map(),kinds=new Map(),values=new Map();
  for(const kind of ['target','constraint','not','group','quant'])for(const wire of world.ofType(family+'.'+kind)){
   tick();if(ref(first(wire,'request'))!==id)continue;const record=copy(wire);if(kind==='target')targets.set(wire.id,record);else{nodes.set(wire.id,record);kinds.set(wire.id,kind);}
  }
  for(const wire of world.ofType(family+'.value')){tick();if(targets.has(ref(first(wire,'target'))))values.set(wire.id,copy(wire));}
  const context=value=>{
   if(!shape(value,['instanceId','scope','version'])||!['instanceId','scope','version'].every(key=>text(value[key])))fail('invalid-binding-context');
   return value;
  };
  const subject=(value,ctx)=>{
   if(!shape(value,['id','source','sourceType','version'])||!['source','sourceType','version'].every(key=>text(value[key]))||!(text(value.id)||Number.isSafeInteger(value.id))||value.version!==ctx.version)fail('invalid-historical-subject');
   return value;
  };
  const initial=copy(opts.bindings??{}),bindings=new Map();
  if(!initial||typeof initial!=='object'||Array.isArray(initial))fail('invalid-bindings');
  for(const [target,value]of Object.entries(initial)){
   tick();if(!targets.has(target)||first(targets.get(target),'mode')==='bound'||!shape(value,['context','subject']))fail('invalid-bindings',target);
   subject(value.subject,context(value.context));bindings.set(target,value);
  }
  const bindingSnapshot=environment=>{const result=Object.create(null);for(const [key,value]of environment){tick();result[key]=value;}return copy(result);};
  const invoke=(callback,input,reason,node)=>{
   tick();fresh();const clock=world._clock;const callbackFresh=()=>{fresh();if(world._clock!==clock)fail('source-changed',node);};let value;
   try{value=callback(copy(input));}catch(error){callbackFresh();return {error:unknown(reason,node)};}
   callbackFresh();try{const captured=copy(value);callbackFresh();return {value:captured};}catch(error){callbackFresh();if(error?.requestPredicate)throw error;return {error:unknown('invalid-callback-data',node)};}
  };
  const children=node=>kinds.get(node.id)==='not'?[ref(first(node,'of'))]:kinds.get(node.id)==='group'?(node.attrs.member??[]).map(ref):kinds.get(node.id)==='quant'?[ref(first(node,'body'))]:[];
  const selected=new Set();
  const mark=start=>{const pending=[start];while(pending.length){tick();const key=pending.pop();if(selected.has(key))continue;selected.add(key);for(const child of children(nodes.get(key))){tick();pending.push(child);}}};
  for(const target of targets.values()){tick();const selector=ref(first(target,'selector'));if(selector)mark(selector);}
  let roots;
  if(opts.selector!==undefined){if(!text(opts.selector)||!targets.has(opts.selector)||!ref(first(targets.get(opts.selector),'selector')))fail('missing-selector');roots=[ref(first(targets.get(opts.selector),'selector'))];}
  else{const root=ref(first(requestWire,'root'));roots=root?[root]:[...nodes.keys()].filter(key=>{tick();return kinds.get(key)==='constraint'&&!selected.has(key);});}
  provenance=copy({request:requestWire,roots,selector:opts.selector??null});
  const memo=new Map();
  const evaluate=(key,environment,depth)=>{
   tick();fresh();if(depth>maxDepth)fail('depth-budget',key);const node=nodes.get(key);if(!node)fail('invalid-logical-node',key);
   const bound=bindingSnapshot(environment),cacheKey=JSON.stringify([key,bound]);for(let i=0;i<cacheKey.length;i++)tick();if(memo.has(cacheKey))return memo.get(cacheKey);
   const kind=kinds.get(key);let result;
   if(kind==='constraint'){
    const required=[ref(first(node,'target'))],goal=ref(first(node,'goal'));
    if(goal)required.push(goal);if(first(node,'operator')==='same'){const value=values.get(ref(first(node,'value')));required.push(ref(first(value,'target')));}
    const missing=required.filter(target=>{tick();return !environment.has(target);});
    if(missing.length)result=unknown('missing-ground-binding',key);
    else if(!opts.evaluateConstraint)result=unknown('missing-constraint-evaluator',key);
    else{
     const positive=copy({...node,attrs:{...node.attrs,polarity:['positive']}}),called=invoke(opts.evaluateConstraint,{request:requestWire,constraint:positive,originalPolarity:first(node,'polarity'),bindings:bound,context:opts.selector===undefined?'result':'selector'},'constraint-callback-threw',key);
     if(called.error)result=called.error;
     else if(!shape(called.value,['truth','evidence'],['reason'])||!['true','false','unknown'].includes(called.value.truth)||!Array.isArray(called.value.evidence)||called.value.reason!==undefined&&!text(called.value.reason))result=unknown('invalid-constraint-result',key);
     else{const value=called.value;result=value.truth==='unknown'?unknown(value.reason??'constraint-unknown',key,value.evidence):{truth:value.truth,evidence:value.evidence,reasons:[]};if(first(node,'polarity')==='negative')result={...result,truth:invert(result.truth)};}
    }
   }else if(kind==='not'){const value=evaluate(ref(first(node,'of')),environment,depth+1);result={...value,truth:invert(value.truth)};}
   else if(kind==='group')result=combine(first(node,'operator'),children(node),environment,depth+1);
   else{
    const target=ref(first(node,'target'));
    if(first(targets.get(target),'mode')==='bound'&&!environment.has(target))result=unknown('missing-ground-binding',key);
    else if(!opts.resolvePopulation)result=unknown('missing-population-resolver',key);
    else{
     const called=invoke(opts.resolvePopulation,{request:requestWire,quantifier:node,target:targets.get(target),bindings:bound,context:opts.selector===undefined?'result':'selector'},'population-callback-threw',key);
     if(called.error)result=called.error;
     else{
      const population=called.value;let valid=shape(population,['context','complete','subjects','evidence'])&&typeof population.complete==='boolean'&&Array.isArray(population.subjects)&&Array.isArray(population.evidence);
      if(valid){try{context(population.context);const seen=new Set();for(const item of population.subjects){tick();subject(item,population.context);if(seen.has(item.source))fail('duplicate-population-source',key);seen.add(item.source);}}catch(error){if(error?.reason==='budget'||error?.reason==='source-changed')throw error;valid=false;}}
      if(!valid)result=unknown('invalid-population',key);
      else{
       const quant=first(node,'kind'),universal=quant==='all'||quant==='each',evidence=[],reasons=[];append(evidence,population.evidence);let decisive=null,sawUnknown=false;
       for(const item of population.subjects){
        tick();const nested=new Map(environment);nested.set(ref(first(node,'bind')),copy({context:population.context,subject:item}));const value=evaluate(ref(first(node,'body')),nested,depth+1);append(evidence,value.evidence);append(reasons,value.reasons);
        if(value.truth==='unknown')sawUnknown=true;if(universal&&value.truth==='false'){decisive='false';break;}if(!universal&&value.truth==='true'){decisive=quant==='none'?'false':'true';break;}
       }
       if(decisive)result={truth:decisive,evidence,reasons};
       else if(!population.complete){result=unknown('population-incomplete',key,evidence);const combined=[];append(combined,reasons);append(combined,result.reasons);result.reasons=combined;}
       else if(sawUnknown)result={truth:'unknown',evidence,reasons};
       else result={truth:universal||quant==='none'?'true':'false',evidence,reasons};
      }
     }
    }
   }
   tick();const entry=copy({node,bindings:bound,truth:result.truth,evidence:result.evidence,reasons:result.reasons});trace.push(entry);memo.set(cacheKey,result);return result;
  };
  const combine=(operator,ids,environment,depth)=>{
   const evidence=[],reasons=[];let sawUnknown=false;
   for(const key of ids){tick();const value=evaluate(key,environment,depth);append(evidence,value.evidence);append(reasons,value.reasons);if(value.truth==='unknown')sawUnknown=true;if(operator==='and'&&value.truth==='false'||operator==='or'&&value.truth==='true')return {truth:value.truth,evidence,reasons};}
   return {truth:sawUnknown?'unknown':operator==='and'?'true':'false',evidence,reasons};
  };
  const result=roots.length?combine('and',roots,bindings,0):unknown('no-predicate-content',id);fresh();return output(true,copy(result));
 }catch(error){
  const reason=world?.stamp!==stamp?'source-changed':error?.requestPredicate?error.reason:'invalid-evaluation-data',node=error?.node;failures.push({reason,...(node?{node}:{})});return output(false,{truth:'unknown',evidence:[],reasons:failures});
 }
}
