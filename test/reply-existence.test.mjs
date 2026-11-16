import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,assessExistenceChange,format} from '../tools/lib-under-test.mjs';
const fixture=`@r std.trace.request message="Create a thing."
@e std.trace.presence source=item.lifetime.1 source.type=toy.item scope=store desired=present
@m std.trace.subject source=item.lifetime.1 source.type=toy.item version=1
@s std.trace.step request=$r operation=create operation.version=1 invocation=call status=confirmed presence=$e population=$b population=$a
@b std.trace.population step=$s invocation=call phase=before source=store.lifetime.1 version=1 scope=store coverage=complete semantics=lifecycle
@a std.trace.population step=$s invocation=call phase=after source=store.lifetime.1 version=2 scope=store coverage=complete semantics=lifecycle member=$m`;
const opts={request:'r',step:'s',expectation:'e',before:'b',after:'a',owner:'reply',revision:'1'};
function make(text=fixture){const w=new World();w.load('@t core.use world=std.trace\n@p core.use world=std.reply');w.load(text);assert.equal(w.check().ok,true);return w;}
const run=(w,o={})=>assessExistenceChange(w,{...opts,...o});
const claim=(r,id='claim')=>format({id,...r.claim});
test('existence assesses made and removed with typed retained evidence',()=>{
 for(const removal of [false,true]){
  const text=removal?fixture.replace('desired=present','desired=absent').replace('phase=before source=store.lifetime.1 version=1 scope=store coverage=complete semantics=lifecycle','phase=before source=store.lifetime.1 version=1 scope=store coverage=complete semantics=lifecycle member=$m').replace('phase=after source=store.lifetime.1 version=2 scope=store coverage=complete semantics=lifecycle member=$m','phase=after source=store.lifetime.1 version=2 scope=store coverage=complete semantics=lifecycle'):fixture;
  const w=make(text),r=run(w);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.assessment.status,removal?'removed':'made');assert.equal(w.tell(claim(r)).ok,true);assert.ok(Object.isFrozen(r.assessment.after.members));assert.equal(run(w).created,false);
 }
});
test('partial absence, view membership, unknown execution and unchanged revision cannot claim lifecycle',()=>{
 const cases=[
  [fixture.replace('phase=before source=store.lifetime.1 version=1 scope=store coverage=complete','phase=before source=store.lifetime.1 version=1 scope=store coverage=partial'),'incomplete-population'],
  [fixture.replaceAll('semantics=lifecycle','semantics=view'),'view-membership-only'],
  [fixture.replaceAll('semantics=lifecycle','semantics=view').replace('desired=present','desired=absent').replace(' member=$m',''),'view-membership-only'],
  [fixture.replace('status=confirmed','status=unknown'),'step-unconfirmed'],
  [fixture.replace('version=2','version=1'),'unchanged-version'],
  [fixture.replace(' member=$m',''),'after-mismatch'],
 ];
 for(const [text,reason] of cases){const r=run(make(text));assert.equal(r.ok,true);assert.equal(r.assessment.status,'unconfirmed');assert.equal(r.assessment.reason,reason);}
 const r=run(make(fixture.replace('phase=before source=store.lifetime.1 version=1 scope=store coverage=complete semantics=lifecycle','phase=before source=store.lifetime.1 version=1 scope=store coverage=complete semantics=lifecycle member=$m')));assert.equal(r.assessment.status,'unchanged');
});
test('cross scope, invocation, phase, population source, type and receipt linkage reject',()=>{
 const variants=[fixture.replace(' population=$b',''),fixture.replace(' presence=$e',''),fixture.replace('phase=after','phase=before'),fixture.replace('phase=after source=store.lifetime.1','phase=after source=other'),fixture.replace('phase=after source=store.lifetime.1 version=2 scope=store','phase=after source=store.lifetime.1 version=2 scope=other'),fixture.replace('@a std.trace.population step=$s invocation=call','@a std.trace.population step=$s invocation=other'),fixture.replace('@m std.trace.subject source=item.lifetime.1 source.type=toy.item','@m std.trace.subject source=item.lifetime.1 source.type=other')];
 for(const text of variants){const w=make(text);assert.equal(run(w).ok,false,text);assert.equal(w.retainedRevision('reply','1'),null);}
 const w=make();w.load('@r2 std.trace.request message=other');assert.equal(run(w,{request:'r2'}).ok,false);
});
test('duplicates and conflicting captured identities reject rather than count twice',()=>{
 const w=make(fixture+'\n@m2 std.trace.subject source=item.lifetime.1 source.type=toy.item version=2');assert.equal(w.applyPatch({replace:{id:'a',attrs:{...w.get('a').attrs,member:['$m','$m2']}}}).ok,true);assert.equal(run(w).ok,false);
 const good=make(),r=run(good),tampered=JSON.parse(JSON.stringify(r.assessment));tampered.after.members[0].id='r';assert.equal(good.retainRevision('bad','1',tampered).ok,true);assert.equal(good.tell('@bad std.reply.existence owner=bad revision=1 status=made').ok,false);
});
test('claim recomputation rejects forged verdicts, supports restore and ignores later live changes',()=>{
 const w=make(),r=run(w);assert.equal(w.tell(claim(r)).ok,true);
 for(const change of [s=>s.status='removed',s=>s.before.coverage='partial',s=>s.step.populations=[],s=>s.before.semantics='view']){const s=JSON.parse(JSON.stringify(r.assessment));change(s);const other=new World();other.load('@p core.use world=std.reply');assert.equal(other.retainRevision('reply','1',s).ok,true);assert.equal(other.tell(claim(r)).ok,false);}
 assert.equal(w.applyPatch({replace:{id:'a',attrs:{...w.get('a').attrs,version:['3'],member:[]}}}).ok,true);assert.equal(w.check().ok,true);assert.equal(run(w).ok,false);assert.equal(World.fromJSON(w.toJSON()).check().ok,true);
 const restored=new World();restored.load('@p core.use world=std.reply');assert.equal(restored.retainRevision('reply','1',r.assessment).ok,true);assert.equal(restored.tell(claim(r)).ok,true);
});
test('dry, budgets, aliases and missing evaluators preserve publication boundary',()=>{
 const w=make();assert.equal(run(w,{dry:true}).ok,true);assert.equal(w.retainedRevision('reply','1'),null);assert.equal(run(w,{budget:{steps:1}}).ok,false);
 const bare=new World();bare.load('@t core.use world=std.trace');bare.load(fixture);assert.equal(run(bare).ok,false);
 const alias=new World();alias.load('@t core.use world=std.trace as=custom.trace\n@p core.use world=std.reply as=custom.reply');alias.load(fixture.replaceAll('std.trace','custom.trace'));const r=run(alias,{family:'custom.trace',replyFamily:'custom.reply'});assert.equal(r.ok,true);assert.equal(alias.tell(claim(r)).ok,true);
});
test('recursive validation cannot publish an existence assessment',()=>{
 const w=new World({fns:{valid:(_args,world)=>{assert.equal(run(world).ok,false);return true;}}});
 w.load('@fn core.function name=valid pure=true out.kind=boolean\n@arg core.function.arg of=$fn name=value kind=ref\n@v core.validate on=item fn=valid');assert.equal(w.tell('@x item').ok,false);assert.equal(w.retainedRevision('reply','1'),null);
});
