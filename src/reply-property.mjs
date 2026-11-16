import { parse, quote, str } from './parser.mjs';

const FORMAT = 'sop.reply.exact-property';
const first = (w, k) => w?.attrs[k]?.[0];
const shape = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const strings = (v, keys) => keys.every(k => typeof v[k] === 'string' && v[k].length > 0);
// bounded: each token and character is charged to the world budget.
function tokens(values, tick) {
  if (!Array.isArray(values)) return false;
  for (const value of values) {
    tick(); if (typeof value !== 'string' || value.startsWith('?') || value.startsWith('$?')) return false;
    for (let i=0;i<value.length;i++) tick();
    let wires; try { wires=parse('@v value item='+value); } catch { return false; }
    if (wires.length!==1 || wires[0].id!=='v' || wires[0].type!=='value' || Object.keys(wires[0].attrs).length!==1 || wires[0].attrs.item?.length!==1 || wires[0].attrs.item[0]!==value) return false;
  }
  return true;
}
function input(v,tick) {
  return shape(v,['id','source','version','sourceType','key','values']) && strings(v,['id','source','version','sourceType','key']) && tokens(v.values,tick);
}
// bounded: comparison charges each token and character.
function equal(a,b,tick) {
  if(a.length!==b.length)return false;
  for(let i=0;i<a.length;i++){tick();for(let j=0;j<Math.max(a[i].length,b[i].length);j++)tick();if(a[i]!==b[i])return false;}
  return true;
}
// Recompute from retained contents on every claim check; status is not evidence.
function evaluate(s,tick) {
  tick();
  if(!shape(s,['format','schemaVersion','request','step','subject','expectation','before','after','status','reason']) || s.format!==FORMAT || s.schemaVersion!==1) return null;
  if(!shape(s.request,['id','message']) || !strings(s.request,['id']) || typeof s.request.message!=='string')return null;
  if(!shape(s.step,['id','request','invocation','status','operation','version','inputs','results']) || !strings(s.step,['id','request','invocation','status','operation','version']) || !['planned','confirmed','refused','unknown','partial'].includes(s.step.status) || s.step.request!==s.request.id)return null;
  if(!shape(s.subject,['source','sourceType','key']) || !strings(s.subject,['source','sourceType','key']) || !input(s.expectation,tick) || s.expectation.key!==s.subject.key)return null;
  // bounded: exactly two observation phases.
  for(const phase of ['before','after']) {
    const o=s[phase]; tick();
    if(!shape(o,['id','step','invocation','phase','input']) || !strings(o,['id','step','invocation','phase']) || o.phase!==phase || o.step!==s.step.id || o.invocation!==s.step.invocation || !input(o.input,tick))return null;
    if(['source','sourceType','key'].some(k=>o.input[k]!==s.subject[k]))return null;
  }
  // bounded: captured operation input/result identities share the validation budget.
  for(const ids of [s.step.inputs,s.step.results]) {
    if(!Array.isArray(ids))return null;
    for(const id of ids){tick();if(typeof id!=='string'||!id)return null;for(let i=0;i<id.length;i++)tick();}
  }
  if(s.before.id===s.after.id || !s.step.inputs.includes(s.expectation.id) || !s.step.inputs.includes(s.before.input.id) || !s.step.results.includes(s.after.input.id))return null;
  // bounded: the seven captured records must not assign conflicting contents/types to one identity.
  const records=new Map();
  for(const [kind,record] of [['request',s.request],['step',s.step],['observation',s.before],['observation',s.after],['input',s.expectation],['input',s.before.input],['input',s.after.input]]) {
    tick();
    const canonical=JSON.stringify([kind,...Object.keys(record).sort().map(key=>[key,key==='input'?record.input.id:record[key]])]);
    for(let i=0;i<canonical.length;i++)tick();
    if(records.has(record.id)&&records.get(record.id)!==canonical)return null;
    records.set(record.id,canonical);
  }
  const before=equal(s.before.input.values,s.expectation.values,tick), after=equal(s.after.input.values,s.expectation.values,tick);
  if(before&&after)return {status:'unchanged',reason:'already-matched'};
  if(!after)return {status:'unconfirmed',reason:'after-mismatch'};
  if(s.step.status!=='confirmed')return {status:'unconfirmed',reason:'step-unconfirmed'};
  if(s.before.input.version===s.after.input.version)return {status:'unconfirmed',reason:'unchanged-version'};
  return {status:'changed',reason:'matched-after-change'};
}
export function replyPropertyValidator([ref],world,{tick}) {
  const claim=world.get(ref.slice(1));
  const owner=first(claim,'owner'),revision=first(claim,'revision');
  if(owner===undefined||revision===undefined)return false;
  const record=world.retainedRevision(str(owner),str(revision));
  if(!record)return false;
  const result=evaluate(record.definition,tick);
  return !!result && result.status===record.definition.status && result.reason===record.definition.reason && first(claim,'status')===result.status;
}

/** Verify only exact native property tokens, preserving an immutable evidence snapshot. */
export function assessPropertyChange(world, options = {}) {
  return world._guard(options,()=>{
    const tick=()=>world._b.tick('validate'),family=options.family||'std.trace',c=world._compiled();
    const fail=why=>({ok:false,created:false,violations:[{kind:'reply-property',why}]});
    if(world._runningValidator){world._validatorMutation=true;return fail('assessment publication is unavailable inside validation');}
    const get=(id,suffix)=>{const w=world.get(String(id).replace(/^\$/,''));return w&&c.isA(w.type,family+suffix)?w:null;};
    if(!world.schema(family+'.request')?.closed)return fail('trace contracts must be loaded');
    const replyFamily=options.replyFamily||'std.reply';
    if(!world.schema(replyFamily+'.property')?.closed || !c.validators.some(v=>v.on===replyFamily+'.property'&&world.fns[v.fn]===replyPropertyValidator))return fail('reply property contract and evaluator must be loaded');
    const checked=world.check();if(!checked.ok)return {ok:false,created:false,violations:checked.violations||checked.issues};
    const request=get(options.request,'.request'),step=get(options.step,'.step'),expected=get(options.expectation,'.input');
    if(!request||!step||!expected)return fail('request, step and expectation must be typed trace records');
    const capture=w=>({id:w.id,source:str(first(w,'source')),version:str(first(w,'version')),sourceType:first(w,'source.type'),key:first(w,'key'),values:JSON.parse(str(first(w,'values')))});
    if(!(step.attrs.input||[]).includes('$'+expected.id))return fail('expectation must be an explicit input of the step');
    const subject={source:options.source,sourceType:options.sourceType,key:options.key};
    const observation=id=>{
      const w=get(id,'.observation');if(!w)return null;
      const matches=new Map();
      // bounded: observation input references are charged individually.
      for(const ref of w.attrs.input||[]){tick();const v=get(ref,'.input');if(v&&str(first(v,'source'))===subject.source&&first(v,'source.type')===subject.sourceType&&first(v,'key')===subject.key)matches.set(v.id,v);}
      if(matches.size!==1)return null;
      return {id:w.id,step:first(w,'step')?.slice(1),invocation:str(first(w,'invocation')),phase:first(w,'phase'),input:capture(matches.values().next().value)};
    };
    const snapshot={format:FORMAT,schemaVersion:1,request:{id:request.id,message:str(first(request,'message'))},step:{id:step.id,request:first(step,'request')?.slice(1),invocation:str(first(step,'invocation')),status:first(step,'status'),operation:str(first(step,'operation')),version:str(first(step,'operation.version')),inputs:(step.attrs.input||[]).map(ref=>{tick();return ref.slice(1);}),results:(step.attrs.result||[]).map(ref=>{tick();return ref.slice(1);})},subject,expectation:capture(expected),before:observation(options.before,'before'),after:observation(options.after,'after'),status:'',reason:''};
    if(!snapshot.before||!snapshot.after)return fail('observations must uniquely identify the selected property');
    const result=evaluate(snapshot,tick);if(!result)return fail('evidence must uniquely identify the same property and correlate request, step, invocation and phases');
    Object.assign(snapshot,result);
    const saved=world.retainRevision(options.owner,options.revision,snapshot,{dry:options.dry});
    if(!saved.ok)return saved;
    return {...saved,assessment:saved.retained.definition,claim:{type:(options.replyFamily||'std.reply')+'.property',attrs:{owner:[quote(options.owner)],revision:[quote(options.revision)],status:[result.status]}}};
  },issue=>({ok:false,created:false,violations:[issue]}));
}
