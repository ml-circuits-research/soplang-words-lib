// Dataset integrity only: this module neither reads nor proposes interpretations.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {World,parse,str} from './lib-under-test.mjs';
const root=new URL('../compat/psys2/reader/',import.meta.url);
export const sha256=text=>createHash('sha256').update(text).digest('hex');
export const jsonRows=text=>text.split('\n').filter(line=>line.trim()&&!line.startsWith('//')).map(JSON.parse);
export function validateReaderRows(rows,{heldout=false}={}) {
 const issues=[],ids=new Set();let labelled=0,pending=0;
 for(const row of rows){
  const fail=message=>issues.push({id:row.id||null,message});
  if(typeof row.id!=='string'||!row.id||ids.has(row.id))fail('row id must be unique');ids.add(row.id);
  if(typeof row.text!=='string'||!row.text.trim())fail('text must be nonempty');
  if(!['drawing','diagram','documents','calendar',...heldout?[]:['unassigned','outside-scope']].includes(row.area))fail('invalid area');
  if(!row.source||typeof row.source.kind!=='string')fail('source attribution required');
  if(!row.gold){pending++;if(heldout)fail('heldout row needs a frozen label');continue;}
  labelled++;
  if(row.gold.outcome!=='request'||!Array.isArray(row.gold.candidates)||row.gold.candidates.length===0){fail('request label needs candidates');continue;}
  for(const candidate of row.gold.candidates){
   if(typeof candidate.wires!=='string'||typeof candidate.request!=='string'){fail('candidate needs wires and designated request');continue;}
   try{
    const wires=parse(candidate.wires);
    const types=new Set(['std.request','std.request.source','std.request.target','std.request.constraint','std.request.not','std.request.group','std.request.quant','std.request.value']);
    if(wires.some(w=>!types.has(w.type))) {fail('candidate may contain only published request-contract records');continue;}
    const w=new World();w.load('@use core.use world=std.request');const result=w.tell(candidate.wires);
    if(!result.ok){fail('candidate violates published request contract');continue;}
    const request=w.get(candidate.request);
    if(request?.type!=='std.request'){fail('designated request is missing');continue;}
    const source=w.get(request.attrs.source[0].slice(1));
    if(str(source?.attrs.text?.[0])!==row.text)fail('request source differs from row text');
    if(wires.filter(w=>w.type==='std.request').length!==1)fail('a candidate must designate its sole request');
    for(const record of wires.filter(w=>w.type==='std.request.source'))if(str(record.attrs.text?.[0])!==row.text)fail('foreign source text in candidate');
   }catch{fail('candidate cannot be parsed/loaded');}
  }
 }
 return {ok:issues.length===0,rows:rows.length,labelled,pending,issues};
}
export function validateDevelopment(rows,labels){
 const ids=new Set(rows.map(r=>r.id)),seen=new Set(),extra=[];
 for(const label of labels){
  if(!ids.has(label.id))extra.push({id:label.id,message:'label has no source row'});
  if(seen.has(label.id))extra.push({id:label.id,message:'duplicate label id'});seen.add(label.id);
  if(Object.keys(label).some(k=>!['id','gold','annotation'].includes(k)))extra.push({id:label.id,message:'label cannot override source evidence'});
 }
 const map=new Map(labels.map(l=>[l.id,l]));
 const result=validateReaderRows(rows.map(r=>({...r,gold:map.get(r.id)?.gold,annotation:map.get(r.id)?.annotation||r.annotation})));
 result.issues.push(...extra);result.ok=result.issues.length===0;return result;
}
export function importDevelopment(repo,manifest){
 const rows=[],sources=[];
 for(const source of manifest.sources){
  const text=execFileSync('git',['-C',repo,'show',`${manifest.commit}:${source.path}`],{encoding:'utf8',maxBuffer:16*1024*1024});
  sources.push({path:source.path,sha256:sha256(text)});
  const input=jsonRows(text);
  for(const original of input){
   if(source.select==='hand-gloss'&&!(original.source==='real'&&original.en_by==='hand-gloss'))continue;
   if(source.turns&&!source.turns.includes(original.turn))continue;
   const tab=original.tab,area=({draw:'drawing',diagram:'diagram',editor:'documents',calendar:'calendar'})[tab]||(tab===null?'unassigned':'outside-scope');
   const key=source.select==='hand-gloss'?original.id:String(original.turn).padStart(3,'0');
   rows.push({id:`${source.id}:${key}`,area,text:source.select==='hand-gloss'?original.en:original.text,
    source:{kind:source.kind,repository:'psys2',commit:manifest.commit,path:source.path,...source.select==='hand-gloss'?{row:original.id,originalText:original.ro,translation:'hand-gloss'}:{turn:original.turn,selectedLanguage:original.lang,mode:original.mode||'typed'}},
    ...(source.select==='hand-gloss'?{context:{setup:original.setup||[],tab}}:{context:{session:source.id,turn:original.turn,tab,previousTurn:original.turn>1?original.turn-1:null}}),
    ...(original.intent?{reviewedIntent:original.intent}:{}),annotation:{status:'pending',reason:'Requires request-wire annotation; old reader output is not gold.'}});
  }
 }
 return {rows,sources};
}
export function validateHeldout(){
 const bytes=readFileSync(new URL('heldout/rows.jsonl',root),'utf8'),manifest=JSON.parse(readFileSync(new URL('heldout/manifest.json',root),'utf8'));
 const result=validateReaderRows(jsonRows(bytes),{heldout:true});
 if(sha256(bytes)!==manifest.rowsSha256)result.issues.push({id:null,message:'heldout fingerprint differs'});
 if(result.rows!==manifest.count)result.issues.push({id:null,message:'heldout count differs'});
 result.ok=result.issues.length===0;return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const mode=process.argv[2]||'check';
 if(mode==='import'){
  const repo=process.argv[3];if(!repo)throw Error('usage: node tools/reader-corpus.mjs import /path/to/psys2');
  const manifest=JSON.parse(readFileSync(new URL('development/manifest.json',root),'utf8'));
  const result=importDevelopment(repo,manifest);
  writeFileSync(new URL('development/rows.jsonl',root),result.rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  writeFileSync(new URL('development/source-digests.json',root),JSON.stringify(result.sources,null,2)+'\n');
  console.log(JSON.stringify({rows:result.rows.length,sources:result.sources.length}));
 }else if(mode==='verify-source'){
  const manifest=JSON.parse(readFileSync(new URL('development/manifest.json',root),'utf8'));
  const generated=importDevelopment(process.argv[3],manifest);
  const stored=readFileSync(new URL('development/rows.jsonl',root),'utf8');
  const digests=JSON.parse(readFileSync(new URL('development/source-digests.json',root),'utf8'));
  const ok=stored===generated.rows.map(r=>JSON.stringify(r)).join('\n')+'\n'&&JSON.stringify(digests)===JSON.stringify(generated.sources);
  console.log(JSON.stringify({ok,rows:generated.rows.length,sources:generated.sources.length}));if(!ok)process.exitCode=1;
 }else if(mode==='check'){
  const rows=jsonRows(readFileSync(new URL('development/rows.jsonl',root),'utf8'));
  const labels=jsonRows(readFileSync(new URL('development/labels.jsonl',root),'utf8'));
  const development=validateDevelopment(rows,labels);
  const heldout=validateHeldout();console.log(JSON.stringify({development,heldout},null,2));if(!development.ok||!heldout.ok)process.exitCode=1;
 }else throw Error('unknown reader corpus command');
}
