import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,assessPropertyChange} from '../tools/lib-under-test.mjs';
const text=`@r std.trace.request message="Set the property."
@expected std.trace.input source=resolved.requirement version=1 source.type=resolved.property key=shade values="[\\\"new\\\"]"
@old std.trace.input source=item.1 version=1 source.type=example.item key=shade values="[\\\"old\\\"]"
@new std.trace.input source=item.1 version=2 source.type=example.item key=shade values="[\\\"new\\\"]"
@s std.trace.step request=$r operation=set.property operation.version=1 invocation=call.1 status=confirmed input=$expected input=$old result=$new
@b std.trace.observation step=$s invocation=call.1 phase=before input=$old
@a std.trace.observation step=$s invocation=call.1 phase=after input=$new`;
const make=(s=text)=>{const w=new World();w.load('@use core.use world=std.trace\n@reply core.use world=std.reply');w.load(s);return w;};
const opts={request:'r',step:'s',before:'b',after:'a',expectation:'expected',source:'item.1',sourceType:'example.item',key:'shade',owner:'reply.1',revision:'1'};
const run=(w,o={})=>assessPropertyChange(w,{...opts,...o});
test('property reply derives change from correlated native evidence and retains a typed claim',()=>{
 const w=make(),r=run(w);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.assessment.status,'changed');assert.ok(Object.isFrozen(r.assessment.before.input.values));
 assert.equal(w.tell(`@claim ${r.claim.type} owner=reply.1 revision=1 status=changed`).ok,true);
 assert.equal(run(w).created,false);
 assert.equal(w.tell('@forged std.reply.property owner=reply.1 revision=1 status=unchanged').ok,false);
 assert.equal(w.tell('@missing std.reply.property owner=absent revision=1 status=changed').ok,false);
});
test('unchanged, mismatch, unconfirmed step and unchanged version remain distinct',()=>{
 const cases=[
 [text.replace('values="[\\\"old\\\"]"','values="[\\\"new\\\"]"'),'unchanged','already-matched'],
 [text.replace('@new std.trace.input source=item.1 version=2','@new std.trace.input source=item.1 version=1'),'unconfirmed','unchanged-version'],
 [text.replace('status=confirmed','status=unknown'),'unconfirmed','step-unconfirmed'],
 [text.replace('key=shade values="[\\\"new\\\"]"\n@s','key=shade values="[\\\"other\\\"]"\n@s'),'unconfirmed','after-mismatch'],
 ];
 for(const [s,status,reason] of cases){const r=run(make(s));assert.equal(r.ok,true);assert.equal(r.assessment.status,status);assert.equal(r.assessment.reason,reason);}
});
test('wrong subject, phase, request, missing expectation linkage and ambiguous input refuse publication',()=>{
 for(const o of [{source:'other'},{sourceType:'other'},{key:'other'},{before:'a'},{after:'b'},{expectation:'new'}]){const w=make();assert.equal(run(w,o).ok,false);assert.equal(w.retainedRevision('reply.1','1'),null);}
 const w=make(text+'\n@r2 std.trace.request message=other');assert.equal(run(w,{request:'r2'}).ok,false);
 const ambiguous=make(text+'\n@extra std.trace.input source=item.1 version=3 source.type=example.item key=shade values="[]"');
 assert.equal(ambiguous.tell('@a std.trace.observation step=$s invocation=call.1 phase=after input=$extra').ok,false);
 assert.equal(ambiguous.applyPatch({replace:{id:'a',attrs:{step:'$s',invocation:'call.1',phase:'after',input:['$new','$extra']}}}).ok,true);
 assert.equal(run(ambiguous).ok,false);
});
test('later trace edits cannot rewrite retained evidence, including after snapshot replay',()=>{
 const w=make(),r=run(w);w.load('@claim std.reply.property owner=reply.1 revision=1 status=changed');
 assert.equal(w.applyPatch({replace:{id:'new',attrs:{source:'item.1',version:'3','source.type':'example.item',key:'shade',values:'"[\\\"other\\\"]"'}}}).ok,true);
 assert.equal(w.check().ok,true);assert.deepEqual(r.assessment.after.input.values,['new']);assert.equal(run(w).ok,false);
 const restored=World.fromJSON(w.toJSON());assert.equal(restored.check().ok,true);assert.deepEqual(restored.retainedRevision('reply.1','1').definition.after.input.values,['new']);
});
test('dry, bounded calls and aliased trace/claim modules retain their explicit boundaries',()=>{
 const w=make();assert.equal(run(w,{dry:true}).ok,true);assert.equal(w.retainedRevision('reply.1','1'),null);
 assert.equal(run(w,{budget:{steps:1}}).ok,false);assert.equal(w.retainedRevision('reply.1','1'),null);
 const a=new World();a.load('@trace core.use world=std.trace as=app.trace\n@reply core.use world=std.reply as=app.reply');a.load(text.replaceAll('std.trace','app.trace'));
 assert.equal(run(a,{family:'app.trace'}).ok,false);const ar=run(a,{family:'app.trace',replyFamily:'app.reply'});assert.equal(ar.ok,true);assert.equal(a.tell(`@claim ${ar.claim.type} owner=${ar.claim.attrs.owner[0]} revision=${ar.claim.attrs.revision[0]} status=${ar.claim.attrs.status[0]}`).ok,true);
});
test('receipt inputs and results are explicit and exact token categories are not coerced',()=>{
 for(const s of [text.replace(' input=$old',''),text.replace(' result=$new','')])assert.equal(run(make(s)).ok,false);
 const w=make();const r=run(w);const forged=JSON.parse(JSON.stringify(r.assessment));forged.status='unchanged';forged.reason='already-matched';
 assert.equal(w.retainRevision('fake','1',forged).ok,true);
 assert.equal(w.tell('@fake std.reply.property owner=fake revision=1 status=unchanged').ok,false);
 const tokenText=text.replaceAll('[\\\"old\\\"]','[\\\"1.0\\\"]').replaceAll('[\\\"new\\\"]','[\\\"1\\\"]');
 assert.equal(run(make(tokenText)).assessment.status,'changed','numeric spellings are distinct exact snapshot tokens');
});

test('retained assessments cannot omit receipt dependencies or reuse an inconsistent record identity',()=>{
 const w=make(),r=run(w);let serial=0;
 for(const mutate of [s=>{s.step.inputs=s.step.inputs.filter(id=>id!=='expected');},s=>{s.after.input.id=s.before.input.id;s.step.results=[s.after.input.id];}]){
  const s=JSON.parse(JSON.stringify(r.assessment));mutate(s);const owner='tampered.'+serial++;
  assert.equal(w.retainRevision(owner,'1',s).ok,true);assert.equal(w.tell(`@bad std.reply.property owner=${owner} revision=1 status=changed`).ok,false);
 }
 const bare=new World();bare.load('@use core.use world=std.trace');bare.load(text);assert.equal(run(bare).ok,false);assert.equal(bare.retainedRevision('reply.1','1'),null);
});
test('a validation callback cannot recursively publish an assessment',()=>{
 const w=new World({fns:{valid:(_args,world)=>{assert.equal(run(world).ok,false);return true;}}});
 w.load('@fn core.function name=valid pure=true out.kind=boolean\n@arg core.function.arg of=$fn name=value kind=ref\n@v core.validate on=item fn=valid');
 assert.equal(w.tell('@x item').ok,false);assert.equal(w.retainedRevision('reply.1','1'),null);
});
