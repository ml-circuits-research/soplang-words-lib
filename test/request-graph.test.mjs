import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World, inspectRequest} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.request');return w;};
const base='@s std.request.source text="move the notes"\n@r std.request act=place mood=check source=$s\n@t std.request.target request=$r mode=existing kind=note';
const leaf=(id='c',target='t',extra='operator=occurred act=place phase=result value=true')=>`@${id} std.request.constraint request=$r target=$${target} concept=change ${extra} polarity=positive character=requirement source=$s`;
const quantified=base.replace('source=$s','source=$s root=$q')+'\n@b std.request.target request=$r mode=bound\n'+leaf('c','b')+'\n@q std.request.quant request=$r kind=all target=$t bind=$b body=$c';
const book=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
test('actual book simple and quantified request fragments load',()=>{
 for(const id of ['src1','source.notes']){
  const fixture=book.match(new RegExp('```sop\\n(@'+id+' std.request.source[\\s\\S]*?)\\n```'))[1];const w=make();w.load(fixture);
  assert.equal(inspectRequest(w,id==='src1'?'r1':'request.notes').ok,true);
 }
});
test('logical nodes require an explicit owned root and reject all orphans',()=>{
 for(const text of [base+'\n'+leaf()+'\n@n std.request.not request=$r of=$c',quantified+'\n'+leaf('orphan'),quantified+'\n@n std.request.not request=$r of=$c']){
  const w=make();assert.equal(w.tell(text).ok,false);assert.equal(w.has('r'),false);
 }
});
test('logical cycles, including disconnected cycles and edits, roll back',()=>{
 for(const text of [quantified+'\n@n std.request.not request=$r of=$n',quantified.replace('body=$c','body=$q')])assert.equal(make().tell(text).ok,false);
 const w=make();w.load(quantified);assert.equal(w.applyPatch({replace:{id:'q',attrs:{request:'$r',kind:'all',target:'$t',bind:'$b',body:'$q'}}}).ok,false);assert.equal(inspectRequest(w,'r').ok,true);
});
test('targets, edges, roots and value descriptions cannot cross request ownership',()=>{
 const other='\n@s2 std.request.source text="other"\n@r2 std.request act=make mood=propose source=$s2\n@t2 std.request.target request=$r2 mode=new kind=item\n@c2 std.request.constraint request=$r2 target=$t2 concept=quantity operator=eq value=1 polarity=positive character=requirement';
 for(const text of [quantified.replace('body=$c','body=$c2')+other,base+'\n'+leaf('c','t2')+other,base+'\n'+leaf('c','t','operator=relation relation=near goal=$t2')+other,base+'\n@v std.request.value target=$t2 concept=quantity\n'+leaf('c','t','operator=same value=$v')+other])assert.equal(make().tell(text).ok,false);
});
test('shared DAG leaves must be within scope on every incoming path',()=>{
 const text=quantified.replace('root=$q','root=$g')+'\n@g std.request.group request=$r operator=and member=$q member=$c';
 assert.equal(make().tell(text).ok,false);
 // Shared descendants within the same binder remain valid.
 const valid=quantified.replace('body=$c','body=$g')+'\n@g std.request.group request=$r operator=and member=$c member=$n\n@n std.request.not request=$r of=$c';
 assert.equal(make().tell(valid).ok,true);
});
test('nested binders may use outer bindings as collections but cannot capture identities',()=>{
 const nested=quantified.replace('body=$c','body=$inner').replace(leaf('c','b'),leaf('c','inner.b'))+'\n@inner.b std.request.target request=$r mode=bound\n@inner std.request.quant request=$r kind=each target=$b bind=$inner.b body=$c';
 assert.equal(make().tell(nested).ok,true);
 assert.equal(make().tell(nested.replace('bind=$inner.b','bind=$b')).ok,false);
 assert.equal(make().tell(base+'\n@b std.request.target request=$r mode=bound').ok,false);
});
test('rootless simple constraints are an implicit conjunction with no free bindings',()=>{
 assert.equal(make().tell(base+'\n'+leaf()+'\n'+leaf('second')).ok,true);
 assert.equal(make().tell(base+'\n@b std.request.target request=$r mode=bound\n'+leaf('c','b')).ok,false);
});
test('operator variants reject missing or unrelated arguments',()=>{
 for(const extra of ['operator=relation relation=near','operator=relation relation=near goal=$t value=1','operator=eq value=1 goal=$t','operator=same value=3','operator=occurred act=place phase=result value="true"','operator=delta value=2 baseline=before anchor=start','operator=factor value=0 baseline=before anchor=start','operator=factor value=2 baseline=before anchor=start unit=minute','operator=region value="red"','operator=degree value=$t'])assert.equal(make().tell(base+'\n'+leaf('c','t',extra)).ok,false,extra);
 for(const extra of ['operator=delta value=-2 unit=minute baseline=before anchor=start','operator=factor value=0.5 baseline=before anchor=start','operator=occurred act=place phase=result value=false'])assert.equal(make().tell(base+'\n'+leaf('c','t',extra)).ok,true,extra);
});
test('measured relations require every endpoint/unit field together',()=>{
 const valid='operator=relation relation=before goal=$t measure=10 unit=minute from=instant to=start';
 assert.equal(make().tell(base+'\n'+leaf('c','t',valid)).ok,true);
 for(const key of ['measure','unit','from','to'])assert.equal(make().tell(base+'\n'+leaf('c','t',valid.replace(new RegExp(' '+key+'=[^ ]+'),''))).ok,false,key);
});
test('Unicode scalar source spans reject missing halves, empty and out-of-range intervals',()=>{
 const src=base.replace('move the notes','a😀b');
 assert.equal(make().tell(src+'\n'+leaf()+' source.start=1 source.end=2').ok,true);
 for(const span of ['source.start=1','source.end=2','source.start=1 source.end=1','source.start=2 source.end=4','source.start=-1 source.end=1'])assert.equal(make().tell(src+'\n'+leaf()+' '+span).ok,false,span);
 const w=make();w.load(src+'\n'+leaf()+' source.start=1 source.end=3');assert.equal(w.revise('s','text','"a"').ok,false);
});
test('same descriptions participate in binder scope and ownership',()=>{
 const text=quantified.replace(leaf('c','b'),leaf('c','t','operator=same value=$v'))+'\n@v std.request.value target=$b concept=size';
 assert.equal(make().tell(text).ok,true);
 assert.equal(make().tell(text.replace('root=$q','root=$g')+'\n@g std.request.group request=$r operator=and member=$q member=$c').ok,false);
});
test('aliases, subtype roots and namespace-qualified targets retain family semantics',()=>{
 const w=new World();w.load('@use core.use world=std.request as=app.intent');w.load(quantified.replaceAll('std.request','app.intent'));
 assert.equal(inspectRequest(w,'r',{family:'app.intent'}).ok,true);
 const v=make();v.load('@sub core.type of=special.request extends=std.request');assert.equal(v.tell(quantified.replace('@r std.request ','@r special.request ')).ok,true);
 const n=make();assert.equal(n.tell(quantified,{ns:'N'}).ok,true);assert.equal(inspectRequest(n,'N::r').ok,true);
});
test('graph checks rerun on child-only edits and refuse deletion or invalid replacements',()=>{
 const w=make();w.load(quantified);assert.equal(w.retract('c').ok,false);
 assert.equal(w.applyPatch({replace:{id:'b',attrs:{request:'$r',mode:'existing',kind:'note'}}}).ok,false);
 assert.equal(w.revise('c','target','$t').ok,true);assert.equal(inspectRequest(w,'r').ok,true);
});
test('inspection and transactional graph traversal respect the reasoning budget',()=>{
 const w=make();w.load(quantified);const result=inspectRequest(w,'r',{budget:{steps:1}});assert.equal(result.ok,false);assert.equal(result.issues[0].kind,'budget');
 const before=w.get('c').attrs.value[0];assert.equal(w.revise('c','value','false',{budget:{steps:1}}).ok,false);assert.equal(w.get('c').attrs.value[0],before);
});
test('inspection requires the published contract and does not claim concept-value typing',()=>{
 const raw=new World();raw.load('@r std.request act=make');assert.equal(inspectRequest(raw,'r').ok,false);
 const w=make();w.load(base+'\n'+leaf('c','t','operator=eq value=NaN'));
 assert.equal(inspectRequest(w,'r').ok,true,'literal/quantity compatibility remains a separate semantic gate');
});
test('failed aliased module transactions do not leak their registered validator',()=>{
 const w=new World();const r=w.tell('@use core.use world=std.request as=app.intent\n@r app.intent act=make mood=guess source=$missing');
 assert.equal(r.ok,false);assert.equal(Object.hasOwn(w.fns,'app.intent.valid'),false);
 assert.equal(w.tell('@use core.use world=std.request as=app.intent').ok,true);assert.equal(typeof w.fns['app.intent.valid'],'function');
});
