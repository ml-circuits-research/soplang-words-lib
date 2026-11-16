import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=std.request');return w;};
const source='@s std.request.source text="propose a sample"';
const request='@r std.request act=make mood=propose source=$s';
const target='@t std.request.target request=$r mode=new kind=sample';
test('actual book request foundation loads in forward-reference order',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const fixture=text.match(/```sop\n(@request.sample std.request[\s\S]*?)\n```/)[1];
 const w=make();w.load(fixture);assert.equal(w.get('request.sample').attrs.mood[0],'propose');assert.equal(w.check().ok,true);
});
test('request mode is explicit and no default authorizes execution',()=>{
 for(const mood of ['do','propose','check','ask'])assert.equal(make().tell(source+'\n'+request.replace('mood=propose',`mood=${mood}`)).ok,true);
 for(const bad of [request.replace(' mood=propose',''),request.replace('mood=propose','mood=automatic'),request+' mood=do']){
  const w=make();assert.equal(w.tell(source+'\n'+bad).ok,false);assert.equal(w.has('s'),false);
 }
});
test('required fields, variants and closed records reject malformed envelopes',()=>{
 for(const [wire,fields] of [[source,['text']],[request,['act','source']],[target,['request','mode','kind']]])for(const field of fields){
  const bad=wire.replace(new RegExp(` ${field}=(?:"[^"]*"|[^ ]+)`),'');
  const prefix=wire===source?'':wire===request?source:source+'\n'+request;
  assert.equal(make().tell(prefix+'\n'+bad).ok,false,field);
 }
 for(const bad of [target.replace('mode=new','mode=bound'),target.replace('mode=new','mode=guess'),target+' determiner=unknown',target+' resolved=$entity',request+' root=$t']){
  const prefix=bad.startsWith('@t')?source+'\n'+request:source;assert.equal(make().tell(prefix+'\n'+bad).ok,false);
 }
});
test('reference types and deletion preserve envelope ownership',()=>{
 for(const ref of ['$missing','$s','"$r"','r'])assert.equal(make().tell(source+'\n'+request+'\n'+target.replace('request=$r',`request=${ref}`)).ok,false);
 const w=make();w.load(source+'\n'+request+'\n'+target);
 assert.equal(w.retract('r').ok,false);assert.equal(w.retract('s').ok,false);assert.equal(w.retract('t').ok,true);assert.equal(w.retract('r').ok,true);assert.equal(w.retract('s').ok,true);
});
test('valid edits keep identity while incomplete replacements roll back',()=>{
 const w=make();w.load(source+'\n'+request+'\n'+target);
 assert.equal(w.applyPatch({replace:{id:'r',attrs:{act:'make',source:'$s'}}}).ok,false);
 assert.equal(w.get('r').attrs.mood[0],'propose');
 assert.equal(w.applyPatch({replace:{id:'r',attrs:{act:'make',source:'$s',mood:'check'}}}).ok,true);
 assert.equal(w.get('t').attrs.request[0],'$r');
});
test('source reuse, arbitrary act/kind names and aliases do not bake in demo vocabulary',()=>{
 const w=new World();w.load('@use core.use world=std.request as=app.intent');
 w.load((source+'\n'+request+'\n'+target+'\n@r2 std.request act=inspect.custom mood=ask source=$s\n@t2 std.request.target request=$r2 mode=existing kind=custom.item determiner=definite name="some item"').replaceAll('std.request','app.intent'));
 assert.equal(w.check().ok,true);assert.equal(w.ofType('app.intent').length,2);
});
