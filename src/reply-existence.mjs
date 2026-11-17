import { quote, str } from './parser.mjs';
const FORMAT='sop.reply.existence';
const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const strings=(v,keys)=>keys.every(k=>typeof v[k]==='string'&&v[k].length>0);
const first=(w,k)=>w?.attrs[k]?.[0];
export function evaluateExistenceEvidence(s,tick){
 tick();
 if(!shape(s,['format','schemaVersion','request','step','expectation','before','after','status','reason'])||s.format!==FORMAT||s.schemaVersion!==1)return null;
 if(!shape(s.request,['id','message'])||!strings(s.request,['id'])||typeof s.request.message!=='string')return null;
 if(!shape(s.step,['id','request','invocation','operation','version','status','expectations','populations'])||!strings(s.step,['id','request','invocation','operation','version','status'])||s.step.request!==s.request.id||!['planned','confirmed','refused','unknown','partial'].includes(s.step.status))return null;
 const e=s.expectation;
 if(!shape(e,['id','source','sourceType','scope','desired'])||!strings(e,['id','source','sourceType','scope'])||!['present','absent'].includes(e.desired))return null;
 for(const ids of [s.step.expectations,s.step.populations]){if(!Array.isArray(ids))return null;for(const id of ids){tick();if(typeof id!=='string'||!id)return null;}}
 if(!s.step.expectations.includes(e.id)||!s.before||!s.after||s.before.id===s.after.id)return null;
 const records=new Map();
 const record=(kind,v)=>{tick();const encoded=JSON.stringify([kind,v]);for(let i=0;i<encoded.length;i++)tick();if(records.has(v.id)&&records.get(v.id)!==encoded)return false;records.set(v.id,encoded);return true;};
 if(!record('request',s.request)||!record('step',s.step)||!record('expectation',e))return null;
 const presence=[];
 // bounded: two populations; every member and captured byte is charged.
 for(const phase of ['before','after']){
  const p=s[phase];
  if(!shape(p,['id','step','invocation','phase','source','version','scope','coverage','semantics','members'])||!strings(p,['id','step','invocation','source','version','scope'])||p.step!==s.step.id||p.invocation!==s.step.invocation||p.phase!==phase||p.scope!==e.scope||!['complete','partial'].includes(p.coverage)||!['lifecycle','view'].includes(p.semantics)||!Array.isArray(p.members)||!s.step.populations.includes(p.id))return null;
  const identities=new Set();let found=false;
  for(const m of p.members){tick();if(!shape(m,['id','source','version','sourceType'])||!strings(m,['id','source','version','sourceType'])||identities.has(m.source)||!record('member',m))return null;identities.add(m.source);if(m.source===e.source){if(m.sourceType!==e.sourceType)return null;found=true;}}
  if(!record('population',p))return null;
  presence.push(found?true:p.coverage==='complete'?false:null);
 }
 if(s.before.source!==s.after.source||s.before.semantics!==s.after.semantics)return null;
 const desired=e.desired==='present',[before,after]=presence;
 if(before===null||after===null)return {status:'unconfirmed',reason:'incomplete-population'};
 if(after!==desired)return {status:'unconfirmed',reason:'after-mismatch'};
 if(s.before.semantics!=='lifecycle')return {status:'unconfirmed',reason:'view-membership-only'};
 if(before===after)return {status:'unchanged',reason:'already-matched'};
 if(s.step.status!=='confirmed')return {status:'unconfirmed',reason:'step-unconfirmed'};
 if(s.before.version===s.after.version)return {status:'unconfirmed',reason:'unchanged-version'};
 return {status:desired?'made':'removed',reason:'observed-lifecycle-change'};
}
// Shared internal checker for retained historical evidence; no live claim is required.
export function replyExistenceValidator([ref],world,{tick}){
 const claim=world.get(ref.slice(1)),owner=first(claim,'owner'),revision=first(claim,'revision');if(owner===undefined||revision===undefined)return false;
 const saved=world.retainedRevision(str(owner),str(revision));if(!saved)return false;
 const result=evaluateExistenceEvidence(saved.definition,tick);
 return !!result&&result.status===saved.definition.status&&result.reason===saved.definition.reason&&first(claim,'status')===result.status;
}
/** Assess historical lifecycle membership, never absence from an open/filtered view. */
export function assessExistenceChange(world,options={}){
 return world._guard(options,()=>{
  const tick=()=>world._b.tick('validate'),family=options.family||'std.trace',replyFamily=options.replyFamily||'std.reply',c=world._compiled();
  const fail=why=>({ok:false,created:false,violations:[{kind:'reply-existence',why}]});
  if(world._runningValidator){world._validatorMutation=true;return fail('assessment publication is unavailable inside validation');}
  if(!world.schema(family+'.population')?.closed||!world.schema(replyFamily+'.existence')?.closed||!c.validators.some(v=>v.on===replyFamily+'.existence'&&world.fns[v.fn]===replyExistenceValidator))return fail('trace population and reply existence contracts must be loaded');
  const checked=world.check();if(!checked.ok)return {ok:false,created:false,violations:checked.violations||checked.issues};
  const get=(id,suffix)=>{const w=world.get(String(id).replace(/^\$/,''));return w&&c.isA(w.type,family+suffix)?w:null;};
  const request=get(options.request,'.request'),step=get(options.step,'.step'),expectation=get(options.expectation,'.presence');
  if(!request||!step||!expectation)return fail('request, step and presence expectation must be typed trace records');
  const refs=(w,k)=>(w.attrs[k]||[]).map(ref=>{tick();return ref.slice(1);});
  const capture=id=>{
   const p=get(id,'.population');if(!p)return null;
   const members=[];for(const ref of p.attrs.member||[]){tick();const m=get(ref,'.subject');if(!m)return null;members.push({id:m.id,source:str(first(m,'source')),version:str(first(m,'version')),sourceType:first(m,'source.type')});}
   return {id:p.id,step:first(p,'step')?.slice(1),invocation:str(first(p,'invocation')),phase:first(p,'phase'),source:str(first(p,'source')),version:str(first(p,'version')),scope:str(first(p,'scope')),coverage:first(p,'coverage'),semantics:first(p,'semantics'),members};
  };
  const snapshot={format:FORMAT,schemaVersion:1,request:{id:request.id,message:str(first(request,'message'))},step:{id:step.id,request:first(step,'request')?.slice(1),invocation:str(first(step,'invocation')),operation:str(first(step,'operation')),version:str(first(step,'operation.version')),status:first(step,'status'),expectations:refs(step,'presence'),populations:refs(step,'population')},expectation:{id:expectation.id,source:str(first(expectation,'source')),sourceType:first(expectation,'source.type'),scope:str(first(expectation,'scope')),desired:first(expectation,'desired')},before:capture(options.before),after:capture(options.after),status:'',reason:''};
  const result=evaluateExistenceEvidence(snapshot,tick);if(!result)return fail('population evidence must correlate identities, scope, request, step and invocation');Object.assign(snapshot,result);
  const saved=world.retainRevision(options.owner,options.revision,snapshot,{dry:options.dry});if(!saved.ok)return saved;
  return {...saved,assessment:saved.retained.definition,claim:{type:replyFamily+'.existence',attrs:{owner:[quote(options.owner)],revision:[quote(options.revision)],status:[result.status]}}};
 },issue=>({ok:false,created:false,violations:[issue]}));
}
