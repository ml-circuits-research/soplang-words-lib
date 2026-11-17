import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareRequestGraphs as compare,serializeRequestGraph,parse,readValue,valueText} from '../tools/lib-under-test.mjs';
const graph=text=>({request:'r',nodes:parse(text).map(w=>({id:w.id,type:w.type,attrs:Object.fromEntries(Object.entries(w.attrs).map(([key,values])=>[key,values.map(raw=>{
 const t=readValue(raw);return {kind:t.kind==='ref'?'ref':t.kind==='string'?'string':'literal',value:t.kind==='ref'?raw.slice(1):t.kind==='string'?valueText(raw):raw};
})]))}))});
const source='@s std.request.source text="invented source"\n@r std.request act=modify mood=do source=$s root=$c\n@t std.request.target request=$r mode=existing kind=vessel\n@c std.request.constraint request=$r target=$t concept=tint operator=eq value=amber character=requirement polarity=positive source=$s';
function renamed(g,names){return {request:names[g.request],nodes:g.nodes.toReversed().map(n=>({id:names[n.id],type:n.type,attrs:Object.fromEntries(Object.entries(n.attrs).toReversed().map(([k,ts])=>[k,ts.map(t=>({...t,value:t.kind==='ref'?names[t.value]:t.value}))]))}))};}
function valid(g){assert.equal(serializeRequestGraph(g).ok,true);return g;}
test('local ID renaming ignores node/attribute insertion order and returns a full rooted bijection',()=>{
 const a=valid(graph(source)),b=valid(renamed(a,{s:'origin',r:'request',t:'subject',c:'predicate'})),before=JSON.stringify([a,b]);
 const r=compare(a,b);assert.equal(r.ok,true);assert.equal(r.equal,true);assert.equal(r.mapping.r,'request');assert.equal(new Set(Object.values(r.mapping)).size,a.nodes.length);assert.equal(Object.isFrozen(r.mapping),true);assert.equal(JSON.stringify([a,b]),before);
});
test('all small graph relabelings preserve literals that happen to spell a local ID',()=>{
 const a=valid(graph(source.replace('invented source','t').replace('kind=vessel','kind=r')));
 function permutations(xs){return xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(t=>[x,...t])):[[]];}
 for(const ids of permutations(['n0','n1','n2','n3'])){const names=Object.fromEntries(a.nodes.map((n,i)=>[n.id,ids[i]]));assert.equal(compare(a,valid(renamed(a,names))).equal,true);}
});
test('every semantic attribute and token kind remains exact',()=>{
 const a=valid(graph(source));
 for(const changed of [source.replace('value=amber','value=gold'),source.replace('value=amber','value="amber"'),source.replace('act=modify','act=place'),source.replace('polarity=positive','polarity=negative')]){
  const r=compare(a,valid(graph(changed)));assert.equal(r.ok,true);assert.equal(r.equal,false);
 }
});
test('bijection preserves reference sharing, beyond matching labels or neighborhood summaries',()=>{
 const s=source.replace('root=$c','root=$g')+'\n@u std.request.target request=$r mode=existing kind=vessel\n@d std.request.constraint request=$r target=$t concept=extent operator=eq value=amber character=requirement polarity=positive\n@e std.request.constraint request=$r target=$u concept=mass operator=eq value=amber character=requirement polarity=positive\n@g std.request.group request=$r operator=and member=$c member=$d member=$e';
 const a=valid(graph(s)),b=valid(graph(s.replace('@d std.request.constraint request=$r target=$t','@d std.request.constraint request=$r target=$u')));
 assert.equal(compare(a,b).equal,false);
});
test('ambiguous local labels backtrack rather than accepting the first available target',()=>{
 const s=source.replace('root=$c','root=$g')+'\n@u std.request.target request=$r mode=existing kind=vessel\n@d std.request.constraint request=$r target=$u concept=extent operator=eq value=large character=requirement polarity=positive\n@g std.request.group request=$r operator=and member=$c member=$d';
 const a=valid(graph(s)),b=valid(renamed(a,{s:'origin',r:'root',t:'z',u:'a',c:'p',d:'q',g:'group'}));
 const result=compare(a,b);assert.equal(result.equal,true);assert.equal(result.mapping.t,'z');assert.equal(result.mapping.u,'a');
});
test('repeated value order stays exact even where a separate logical evaluator could commute it',()=>{
 const s=source.replace('root=$c','root=$g')+'\n@d std.request.constraint request=$r target=$t concept=extent operator=eq value=large character=requirement polarity=positive\n@g std.request.group request=$r operator=and member=$c member=$d';
 assert.equal(compare(valid(graph(s)),valid(graph(s.replace('member=$c member=$d','member=$d member=$c')))).equal,false);
});
test('provenance is not silently ignored',()=>{
 const a=valid(graph(source+' source.start=0 source.end=1')),b=valid(graph(source+' source.start=0 source.end=2'));assert.equal(compare(a,b).equal,false);
});
test('invalid or accessor data is unknown rather than a negative equivalence or an executed getter',()=>{
 const a=graph(source);let accessed=false;const bad={request:'r'};Object.defineProperty(bad,'nodes',{enumerable:true,get(){accessed=true;return a.nodes;}});
 assert.equal(compare(bad,a).equal,null);assert.equal(accessed,false);
 const extra=structuredClone(a);extra.nodes.push({id:'orphan',type:'std.request.value',attrs:{}});assert.equal(compare(a,extra).equal,null);
 assert.equal(compare(a,{...a,unexpected:true}).equal,null);
});
test('limits preserve unknown and never expose a partial matching as proof',()=>{
 const a=valid(graph(source)),complete=compare(a,a);assert.equal(complete.equal,true);
 for(const options of [{budget:1},{budget:complete.steps-1},{graphBudget:1},{maxNodes:2},{budget:0},{maxNodes:257}]){
  const r=compare(a,a,options);assert.equal(r.ok,false);assert.equal(r.equal,null);assert.equal(r.mapping,null);
 }
});
