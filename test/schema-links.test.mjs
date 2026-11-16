import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=w.legend');return w;};
const facts='@thing w.legend.concept name=thing\n@quality w.legend.concept name=quality\n@size w.legend.space name=size version=1 form=axes';
const schema='@t core.type of=item is=thing\n@s core.slot of=item key=value kind=number means=quality space=size';
test('book schema links load atomically with forward declarations',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');const fixture=text.match(/```sop\n(@type.sample core.type[\s\S]*?)\n```/)[1];
 const w=make();w.load(fixture);assert.equal(w.semanticLinks().links.length,3);assert.equal(w.check().ok,true);
 for(const text of [schema+'\n'+facts,facts+'\n'+schema]){const v=make();v.load(text);assert.equal(v.semanticLinks().links.length,3);}
});
test('missing ambiguous wrong-type and quoted links fail without committed changes',()=>{
 for(const bad of ['missing','"quality"','"$quality"','$thing.wrong','$size','quality means=thing']){
  const w=make();w.load(facts);const r=w.tell('@s core.slot of=item key=value means='+bad);assert.equal(r.ok,false,bad);assert.ok(r.violations.some(v=>v.kind==='schema-link'));assert.equal(w.matrix.has('s'),false);
 }
 const w=make();w.load(facts+'\n@other w.legend.concept name=quality');assert.equal(w.tell(schema).ok,false);
 assert.equal(w.tell(schema.replace('means=quality','means=$quality')).ok,true);
});
test('target mutation deletion and newly ambiguous names roll back and check stays sound',()=>{
 const w=make();w.load(facts+'\n'+schema);const links=w.semanticLinks();
 assert.equal(w.retract('quality').ok,false);
 assert.equal(w.applyPatch({replace:{id:'quality',attrs:{name:'renamed'}}}).ok,false);
 assert.equal(w.tell('@other w.legend.concept name=quality').ok,false);
 assert.deepEqual(w.semanticLinks(),links);assert.equal(w.check().ok,true);
});
test('explicit identities remain valid after public name changes',()=>{
 const w=make();w.load(facts+'\n'+schema.replace('means=quality','means=$quality'));
 assert.equal(w.applyPatch({replace:{id:'quality',attrs:{name:'renamed'}}}).ok,true);
 assert.equal(w.semanticLinks().links.find(l=>l.key==='means').target,'quality');
});
test('public names resolve globally and explicit references disambiguate namespaces',()=>{
 const w=make();w.load(facts);assert.equal(w.tell('@c w.legend.concept name=quality',{ns:'N'}).ok,true);
 assert.equal(w.tell(schema).ok,false);
 assert.equal(w.tell(schema.replace('means=quality','means=$N::c')).ok,true);
});
test('semantic declarations remain optional for legacy schemas',()=>{
 const w=make();w.load('@t core.type of=item\n@s core.slot of=item key=value kind=number\n@x item value=3');
 assert.equal(w.semanticLinks().ok,true);assert.equal(w.semanticLinks().links.length,0);
});
test('duplicate/intersect declarations cannot silently discard differing meanings',()=>{
 for(const combine of ['', ' combine=intersect']){
  const w=make();w.load(facts+'\n'+schema);
  assert.equal(w.tell('@s2 core.slot of=item key=value kind=number means=thing space=size'+combine).ok,false);
 }
 const w=make();w.load(facts+'\n'+schema);
 assert.equal(w.tell('@t2 core.type of=item is=quality').ok,false);
 assert.equal(w.tell('@s2 core.slot of=item key=value kind=number means=thing space=size combine=override').ok,true);
});
test('module aliases preserve generic link target declarations',()=>{
 const w=new World();w.load('@use core.use world=w.legend as=app.legend');w.load(facts.replaceAll('w.legend','app.legend')+'\n'+schema);
 assert.equal(w.semanticLinks().links.length,3);assert.equal(w.retract('quality').ok,false);
});
test('generic mapping supports an unrelated annotation vocabulary without legend code',()=>{
 const w=new World();w.load('@binding core.schema.link on=core.type key=classification target=category by=code\n@t core.type of=item classification=basic\n@c category code=basic');
 assert.equal(w.semanticLinks().links[0].target,'c');assert.equal(w.retract('c').ok,false);
});
test('malformed generic link descriptors are rejected',()=>{
 for(const d of ['on=item key=is target=category by=code','on=core.type key=is target=category','on=core.type key=is key=means target=category by=code'])assert.equal(new World().tell('@d core.schema.link '+d).ok,false);
});
