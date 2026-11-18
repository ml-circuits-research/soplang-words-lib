// Validate explicitly owned book sources in their declared dependency contexts.
// Supplying a module does not load it: only real core.use/module imports do that.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {World,parse} from '../src/index.mjs';
import {fitsKind} from '../src/matrix.mjs';

export function bookWorldSources(text){
 const lines=text.split('\n'),blocks=[];let heading='',pending=null,fenceCount=0;
 for(let i=0;i<lines.length;i++){
  if(/^#{1,6} /.test(lines[i]))heading=lines[i];
  const annotation=lines[i].match(/^<!-- sop-world (.+) -->$/);
  if(annotation){pending=Object.fromEntries([...annotation[1].matchAll(/(\w+)=([^ ]+)/g)].map(m=>[m[1],m[2]]));continue;}
  const open=lines[i].match(/^(`{3,})(.*)$/);if(!open)continue;
  fenceCount++;const line=i+2,body=[];while(++i<lines.length&&!lines[i].startsWith(open[1]))body.push(lines[i]);
  const source=body.join('\n'),language=open[2].trim(),metadata=pending;pending=null;
  if(!/^\s*@\S+\s+/m.test(source)||!['','sop'].includes(language))continue;
  blocks.push({line,heading,language,source,...metadata});
 }
 return {fenceCount,blocks};
}

function assemble(blocks,id,{published=[],WorldClass=World}={}){
 const byId=new Map();
 for(const block of blocks){if(!block.id)continue;if(byId.has(block.id))throw Error('duplicate owning world: '+block.id);byId.set(block.id,block);}
 const root=byId.get(id);if(!root)throw Error('missing owning world: '+id);
 const library=Object.fromEntries(published.map(w=>[w.id,w.schemaText])),seen=new Set(),active=new Set(),modules=new Map();
 const supply=block=>{
  if(active.has(block.id))throw Error('cyclic source dependency: '+block.id);
  if(seen.has(block.id))return;
  active.add(block.id);
  for(const dependency of(block.uses??'').split(',').filter(Boolean)){
   const next=byId.get(dependency);if(!next)throw Error('missing source dependency: '+dependency);
   if(next.role==='instance')throw Error('instance data is not an importable definition module: '+dependency);
   supply(next);
  }
  active.delete(block.id);seen.add(block.id);
  if(block.module){if(modules.has(block.module))throw Error('different sources claim module: '+block.module);modules.set(block.module,block.id);library[block.module]=block.source;}
 };
 supply(root);
 const world=new WorldClass({library}),wires=parse(root.source);
 let result;
 if(root.role==='instance'){
  // Dependency directives describe the context, not the mutable instance payload.
  const imports=wires.filter(w=>w.type==='core.use');
  if(imports.length){const loaded=world.tell(imports);if(!loaded.ok)return {root,world,wires,result:loaded};}
  result=world.tell(wires.filter(w=>w.type!=='core.use'),{factsOnly:true});
 }else result=world.tell(root.module?`@audit.root core.use world=${root.module} prefix=false`:root.source);
 return {root,world,wires,result,modules};
}

// Test/document tooling only: this is not a semantic library orchestration API.
export function bookExampleWorld(text,id,options={}){
 const {blocks}=bookWorldSources(text),out=assemble(blocks,id,options);
 if(!out.result.ok)throw Error(`book world ${id}: ${JSON.stringify(out.result.violations)}`);
 return out.world;
}

// Declaration checks for these book sources. Runtime rule admission is a separate
// contract; successfully loading a legacy evaluation context alone is not this proof.
function ruleIssues(world,wires){
 const issues=[],find=ref=>world.matrix.get(ref.slice(1));
 const variables=wire=>Object.values(wire?.attrs??{}).flat().filter(value=>value[0]==='?');
 for(const rule of wires.filter(w=>w.type==='core.rule'||w.type==='core.deny')){
  const positive=(rule.attrs.when??[]).map(find).filter(Boolean),calcs=(rule.attrs.with??[]).map(find).filter(Boolean),templates=(rule.attrs.then??[]).map(find).filter(Boolean);
  const bound=new Set(positive.flatMap(variables));for(const calc of calcs)for(const value of calc.attrs.out??[])bound.add(value);
  for(const template of templates)for(const value of variables(template))if(!bound.has(value))issues.push({id:rule.id,template:template.id,variable:value,issue:'unbound-conclusion-value'});
  const patterns=[...positive,...(rule.attrs.not??[]).map(find).filter(Boolean),...templates];
  for(const wire of patterns){
   const schema=world.schema(wire.type);if(!schema){issues.push({id:wire.id,type:wire.type,issue:'missing-pattern-schema'});continue;}
   for(const [key,values]of Object.entries(wire.attrs)){
    if(key.startsWith('core.'))continue;
    const slot=schema.keys[key]??Object.entries(schema.keys).find(([prefix,spec])=>spec.prefix==='true'&&key.startsWith(prefix))?.[1];
    if(!slot){if(schema.closed)issues.push({id:wire.id,key,issue:'unknown-pattern-key'});continue;}
    const kinds=Array.isArray(slot.kind)?slot.kind:slot.kind?[slot.kind]:[];
    for(const value of values){if(value[0]==='?'||value[0]==='$')continue;
     if(kinds.length&&!kinds.some(kind=>fitsKind(kind,value)))issues.push({id:wire.id,key,value,issue:'invalid-pattern-literal-kind'});
    }
   }
  }
 }
 return issues;
}

export function auditBookExamples(text,options={}){
 const {fenceCount,blocks}=bookWorldSources(text),records=[];
 for(const block of blocks){
  const {source,...metadata}=block,record={...metadata,status:'',wireCount:0};records.push(record);
  if(!block.id||!['schema','knowledge','instance'].includes(block.role)){record.status='ownership-required';continue;}
  try{
   const {world,wires,result,modules}=assemble(blocks,block.id,options);record.wireCount=wires.length;record.admitted=result.ok;
   if(!result.ok){record.status='schema-rejected';record.violations=result.violations.map(({kind,id,type,key,why})=>({kind,id,type,key,why}));continue;}
   const declarationIssues=ruleIssues(world,wires);
   if(declarationIssues.length){record.status='declaration-rejected';record.issues=declarationIssues;continue;}
   const issues=[];
   for(const wire of wires){
    const inMatrix=world.matrix.has(wire.id),directive=['core.use','core.module'].includes(wire.type);
    if(block.role==='schema'&&!inMatrix)issues.push({id:wire.id,issue:'schema-source-owns-data'});
    if(block.role==='knowledge'&&['core.type','core.slot','core.schema.map','core.schema.link'].includes(wire.type))issues.push({id:wire.id,issue:'knowledge-source-owns-type-definition'});
    if(block.role==='instance'&&inMatrix&&!directive)issues.push({id:wire.id,issue:'instance-source-owns-schema-definition'});
    if(!inMatrix&&!world.schema(wire.type))issues.push({id:wire.id,type:wire.type,issue:'missing-declared-schema'});
    if(wire.type==='core.type')for(const unknown of world.schema(wire.attrs.of?.[0])?.unknownKinds??[])issues.push({id:wire.id,issue:'unknown-value-kind',...unknown});
   }
   for(const dep of(block.uses??'').split(',').filter(Boolean)){
    const target=blocks.find(b=>b.id===dep);
    if(!target.module||!world.used.has(target.module))issues.push({dependency:dep,issue:'dependency-not-imported'});
   }
   if(issues.length){record.status='ownership-rejected';record.issues=issues;}else record.status='schema-admitted';
  }catch(error){record.status='context-rejected';record.error=error.message;}
 }
 return {fenceCount,publishedSchemas:options.published?.length??0,blocks:records,summary:Object.fromEntries([...new Set(records.map(b=>b.status))].map(status=>[status,records.filter(b=>b.status===status).length]))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const file=process.argv.slice(2).find(arg=>!arg.startsWith('--'))??fileURLToPath(new URL('../books/sop-worlds-teorie.md',import.meta.url));
 const published=process.argv.includes('--published')?(await import('./worlds.mjs')).publishedWorlds():[];
 if(published===null)throw Error('Pinned published schemas unavailable; no success claim.');
 const report=auditBookExamples(readFileSync(file,'utf8'),{published});
 for(const block of report.blocks)process.stdout.write(JSON.stringify(block)+'\n');
 if(process.argv.includes('--strict')&&report.blocks.some(block=>block.status!=='schema-admitted'))process.exitCode=1;
 process.stdout.write(JSON.stringify({fenceCount:report.fenceCount,sopFenceCount:report.blocks.length,publishedSchemas:report.publishedSchemas,summary:report.summary,scope:'Declared source ownership and real imports; structural admission is not execution proof.'})+'\n');
}
