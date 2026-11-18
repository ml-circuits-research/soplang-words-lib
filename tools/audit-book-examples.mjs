// Audit every SOP-like Markdown fence against actual loaded library schemas.
// No declarations, missing reference targets or successful effects are fabricated.
// A partial fragment can fail standalone admission without being an invalid example;
// classifications retain that distinction. This is an audit, not an execution proof.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {World,parse} from '../src/index.mjs';
import {CONTRACT_MODULES} from '../src/contracts.mjs';

export function auditBookExamples(text,{published=[]}={}){
 const base=new World({library:Object.fromEntries(published.map(w=>[w.id,w.schemaText]))}),modules=[...Object.keys(CONTRACT_MODULES),'std.schema','std.tool'];
 for(const [i,name] of modules.entries())base.load(`@audit.use.${i} core.use world=${name}`);
 const lines=text.split('\n'),blocks=[];let heading='',fenceCount=0;
 for(let i=0;i<lines.length;i++){
  if(/^#{1,6} /.test(lines[i]))heading=lines[i];
  const open=lines[i].match(/^(`{3,})(.*)$/);if(!open)continue;
  fenceCount++;const start=i+2,body=[];while(++i<lines.length&&!lines[i].startsWith(open[1]))body.push(lines[i]);
  const source=body.join('\n');if(!/^\s*@\S+\s+/m.test(source)||!['','sop'].includes(open[2].trim()))continue;
  const record={line:start,heading,language:open[2].trim(),status:'',wireCount:0};blocks.push(record);
  let wires;try{wires=parse(source);record.wireCount=wires.length;}catch(error){record.status='parse-error';record.error=error.message;continue;}
  const world=base.fork(),declared=new Set(wires.filter(w=>w.type==='core.type').map(w=>w.attrs.of?.[0]??w.id));
  const missingTypes=[...new Set(wires.filter(w=>!w.type.startsWith('core.')&&!world.schema(w.type)&&!declared.has(w.type)).map(w=>w.type))];
  if(missingTypes.length)record.requiresSchemas=missingTypes;
  const fieldIssues=[];
  for(const wire of wires){const schema=base.schema(wire.type);if(!schema?.closed)continue;
   for(const key of Object.keys(wire.attrs))if(!schema.keys[key]&&!key.startsWith('core.'))fieldIssues.push({id:wire.id,type:wire.type,key,issue:'undeclared-key'});
   for(const [key,slot]of Object.entries(schema.keys))if(slot.present==='true'&&!wire.attrs[key])fieldIssues.push({id:wire.id,type:wire.type,key,issue:'missing-present-field'});
  }
  if(fieldIssues.length)record.fieldIssues=fieldIssues;
  const result=world.tell(source);record.admitted=result.ok;
  if(!result.ok)record.violations=result.violations.map(v=>({kind:v.kind,id:v.id,type:v.type,key:v.key,why:v.why}));
  const unknownKinds=[];for(const type of declared)for(const item of world.schema(type)?.unknownKinds??[])unknownKinds.push({type,...item});
  if(unknownKinds.length)record.unknownKinds=unknownKinds;
  record.status=missingTypes.length?'context-required':result.ok&&!fieldIssues.length&&!unknownKinds.length?'schema-admitted':'schema-rejected';
 }
 return {fenceCount,publishedSchemas:published.length,modules,blocks,summary:Object.fromEntries([...new Set(blocks.map(b=>b.status))].map(status=>[status,blocks.filter(b=>b.status===status).length]))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const file=process.argv.slice(2).find(arg=>!arg.startsWith('--'))??fileURLToPath(new URL('../books/sop-worlds-teorie.md',import.meta.url));
 const published=process.argv.includes('--published')?(await import('./worlds.mjs')).publishedWorlds():[];
 if(published===null)throw Error('Pinned published schemas unavailable; no success claim.');
 const report=auditBookExamples(readFileSync(file,'utf8'),{published});
 for(const block of report.blocks)process.stdout.write(JSON.stringify(block)+'\n');
 if(process.argv.includes('--strict')&&report.blocks.some(block=>block.status!=='schema-admitted'))process.exitCode=1;
 process.stdout.write(JSON.stringify({fenceCount:report.fenceCount,sopFenceCount:report.blocks.length,publishedSchemas:report.publishedSchemas,summary:report.summary,scope:'Actual built-in schemas and explicit published imports only; context-required is not schema validation or execution success.'})+'\n');
}
