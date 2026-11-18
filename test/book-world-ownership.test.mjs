import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../tools/lib-under-test.mjs';
import {auditBookExamples,bookWorldSources,bookExampleWorld} from '../tools/audit-book-examples.mjs';
const source=(id,role,body,extra='')=>`<!-- sop-world id=${id} role=${role}${extra?' '+extra:''} -->\n\`\`\`sop\n${body}\n\`\`\``;
const schema=source('test.schema','schema','@module core.module name=example\n@type core.type of=example.item closed=true\n@id core.slot of=example.item key=id kind=string present=true\n@selected core.slot of=example.item key=selected kind=boolean','module=example');
const instance=source('test.instance','instance','@use core.use world=example prefix=false\n@one example.item id="one"','uses=test.schema');
const audit=text=>auditBookExamples(text,{WorldClass:World});
test('all book sources have checked owners, declared module dependencies and real schemas',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8'),report=audit(text);
 assert.ok(report.blocks.length>0);assert.deepEqual(report.blocks.filter(row=>row.status!=='schema-admitted'),[]);
 for(const role of ['schema','knowledge','instance'])assert.ok(report.blocks.some(row=>row.role===role));
 const dot=bookExampleWorld(text,'dot.instance',{WorldClass:World});
 assert.equal(dot.get('dot').attrs.x[0],'120');assert.equal(dot.used.has('example'),true);
 assert.doesNotMatch(dot.toSOP(),/core\.(?:type|slot|use|rule)/);
});
test('instance facts use an available module only through a declared real import',()=>{
 assert.ok(audit(schema+'\n'+instance).blocks.every(row=>row.status==='schema-admitted'));
 const missingImport=instance.replace('@use core.use world=example prefix=false\n','');
 assert.equal(audit(schema+'\n'+missingImport).blocks.at(-1).status,'ownership-rejected');
 const missingAvailability=instance.replace(' uses=test.schema','');
 assert.equal(audit(schema+'\n'+missingAvailability).blocks.at(-1).status,'schema-rejected');
});
test('mixing definitions and facts is rejected in both directions, not hidden by successful parsing',()=>{
 const mixed=instance.replace('@one example.item','@extra core.type of=example.extra\n@one example.item');
 assert.equal(audit(schema+'\n'+mixed).blocks.at(-1).status,'schema-rejected');
 const schemaWithObject=schema.replace('@selected core.slot','@one example.item id="one"\n@selected core.slot');
 assert.equal(audit(schemaWithObject).blocks[0].status,'ownership-rejected');
 assert.equal(audit('```sop\n@one example.item id="one"\n```').blocks[0].status,'ownership-required');
});
test('knowledge can own rules without confusing its patterns with live instance objects',()=>{
 const knowledge=source('test.knowledge','knowledge','@knowledge.use core.use world=example prefix=false\n@knowledge.module core.module name=example.knowledge\n@p example.item id=?id\n@t example.item core.on=$p selected=true\n@rule core.rule when=$p then=$t','module=example.knowledge uses=test.schema');
 const state=source('test.instance','instance','@instance.use core.use world=example.knowledge prefix=false\n@one example.item id="one"','uses=test.knowledge');
 const text=schema+'\n'+knowledge+'\n'+state;
 assert.ok(audit(text).blocks.every(row=>row.status==='schema-admitted'));
 const world=bookExampleWorld(text,'test.instance',{WorldClass:World});assert.equal(world.get('one').attrs.selected[0],'true');assert.equal(world.get('p'),undefined);
});
test('source dependency cycles and different owners claiming one module are explicit failures',()=>{
 const cycle=schema.replace('module=example -->','module=example uses=test.knowledge -->')+'\n'+source('test.knowledge','knowledge','@module core.module name=example.knowledge','module=example.knowledge uses=test.schema');
 assert.ok(audit(cycle).blocks.every(row=>row.status==='context-rejected'));
 const duplicate=schema+'\n'+schema.replace('id=test.schema','id=other.schema')+'\n'+instance.replace('uses=test.schema','uses=test.schema,other.schema');
 assert.equal(audit(duplicate).blocks.at(-1).status,'context-rejected');
});
test('the book calculation completes a value and generates a separate justified fact',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const world=bookExampleWorld(text,'event-calculation.instance',{WorldClass:World});
 assert.equal(world.get('meeting1').attrs.end[0],'660');
 let intervals=world.ofType('example.interval');assert.equal(intervals.length,1);assert.deepEqual(intervals[0].attrs,{event:['$meeting1'],start:['630'],end:['660']});
 const r=world.applyPatch({replace:{id:'meeting1',attrs:{start:'630',length:'45'}}},{factsOnly:true});assert.equal(r.ok,true);
 assert.equal(world.get('meeting1').attrs.end[0],'675');intervals=world.ofType('example.interval');assert.equal(intervals.length,1);assert.equal(intervals[0].attrs.end[0],'675');
 assert.equal(world.has('t.end'),false);assert.equal(world.has('t.interval'),false);
});
test('a false check skips deduction, while an incompatible explicit value is a conflict',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8'),world=bookExampleWorld(text,'event-calculation.instance',{WorldClass:World});
 const before=world.toSOP();const conflict=world.applyPatch({replace:{id:'meeting1',attrs:{start:'630',length:'30',end:'999'}}},{factsOnly:true});assert.equal(conflict.ok,false);assert.equal(world.toSOP(),before);
 assert.equal(world.applyPatch({replace:{id:'meeting1',attrs:{start:'630',length:'0'}}},{factsOnly:true}).ok,true);
 assert.equal(world.get('meeting1').attrs.end,undefined);assert.equal(world.ofType('example.interval').length,0);
});
test('book declarations reject unknown closed keys, wrong literal kinds and unbound conclusions',()=>{
 for(const [pattern,conclusion,issue]of[
  ['id=?id bogus=?value','selected=true',/unknown key bogus/],
  ['selected=123','selected=true',/selected=123 must be boolean/],
  ['id=?id','selected=?missing',/unbound conclusion variable \?missing/],
 ]){
  const rules=source('test.rules','knowledge',`@rules.use core.use world=example prefix=false\n@rules.module core.module name=example.rules\n@p example.item ${pattern}\n@t example.item core.on=$p ${conclusion}\n@rule core.rule when=$p then=$t`,'module=example.rules uses=test.schema');
  const row=audit(schema+'\n'+rules).blocks.at(-1);assert.equal(row.status,'schema-rejected');assert.ok(row.violations.some(item=>issue.test(item.why)));
 }
});
