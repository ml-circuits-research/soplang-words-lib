import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeRequestGraph, parse, readValue, valueText } from '../tools/lib-under-test.mjs';
const packet = text => ({ request: 'r', nodes: parse(text).map(w => ({ id: w.id, type: w.type, attrs: Object.fromEntries(Object.entries(w.attrs).map(([key, values]) => [key, values.map(raw => {
 const token=readValue(raw); return token.kind==='ref'?{kind:'ref',value:raw.slice(1)}:token.kind==='string'?{kind:'string',value:valueText(raw)}:{kind:'literal',value:raw};
 })])) })) });
const base = '@s std.request.source text="invented source"\n@r std.request act=modify mood=do source=$s root=$c\n@t std.request.target request=$r mode=existing kind=vessel\n@c std.request.constraint request=$r target=$t concept=tint operator=eq value=amber character=requirement polarity=positive source=$s';

test('schema serializer handles selector, logical result and second target without construction branches',()=>{
 const data=packet(base.replace('root=$c','root=$g').replace('kind=vessel','kind=vessel selector=$selected')+'\n@selected std.request.constraint request=$r target=$t concept=tint operator=eq value=gold character=assumption polarity=positive source=$s\n@u std.request.target request=$r mode=existing kind=box\n@relation std.request.constraint request=$r target=$t concept=location operator=relation relation=near goal=$u character=requirement polarity=positive\n@g std.request.group request=$r operator=and member=$c member=$relation');
 const result=serializeRequestGraph(data);assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(result.world.get('t').attrs.selector[0],'$selected');assert.equal(result.world.get('relation').attrs.goal[0],'$u');assert.deepEqual(result.world.get('g').attrs.member,['$c','$relation']);
 // Both selector and result legitimately share the source. An unused source is different.
 data.nodes.push({id:'unused',type:'std.request.source',attrs:{text:[{kind:'string',value:'unrelated'}]}});
 assert.equal(serializeRequestGraph(data).issues[0].reason,'orphan-node');
});

test('literal lexical forms stay distinct from strings and references without coercion',()=>{
 for(const value of ['42','-1.5','true','false','none','amber']){
  const data=packet(base);data.nodes.at(-1).attrs.value=[{kind:'literal',value}];const result=serializeRequestGraph(data);assert.equal(result.ok,true,value+JSON.stringify(result.issues));assert.equal(result.world.get('c').attrs.value[0],value);
 }
 const data=packet(base),value='$s\n@injected wrong';data.nodes.at(-1).attrs.value=[{kind:'string',value}];const result=serializeRequestGraph(data);assert.equal(result.ok,true);assert.equal(valueText(result.world.get('c').attrs.value[0]),value);assert.equal(result.world.get('injected'),undefined);
 for(const value of ['amber other=bad','amber\n@bad bad','$s','"amber"','?x']){const d=packet(base);d.nodes.at(-1).attrs.value=[{kind:'literal',value}];assert.equal(serializeRequestGraph(d).ok,false,value);}
});

test('malformed graph data cannot inject types, slots, nodes or external references',()=>{
 const changes=[
  d=>d.nodes.push({...d.nodes[0]}),d=>{d.nodes[0].id='s\n@bad bad';},
  d=>{d.nodes[2].type='std.request.fake';},d=>{d.nodes[2].type='core.type';},
  d=>{d.nodes[2].attrs.toString=[{kind:'literal',value:'x'}];},
  d=>{d.nodes[2].attrs.request=[{kind:'ref',value:'elsewhere'}];},
  d=>{d.nodes[2].attrs.kind[0].extra=true;},d=>{delete d.nodes[1];},
  d=>{d.nodes[2].attrs.kind=new Array(1);},d=>{d.nodes[2].attrs.kind[0]=new Date();},
  d=>{d.nodes[2].attrs.kind[0].value='vessel\n@evil wrong';},
  d=>d.nodes.push({id:'other',type:'std.request',attrs:{act:[{kind:'literal',value:'look'}],mood:[{kind:'literal',value:'ask'}],source:[{kind:'ref',value:'s'}]}}),
 ];
 for(const change of changes){const d=packet(base);change(d);assert.equal(serializeRequestGraph(d).ok,false,change.toString());}
 let invoked=false;const d=packet(base);Object.defineProperty(d.nodes[2].attrs,'evil',{enumerable:true,get(){invoked=true;return [];}});assert.equal(serializeRequestGraph(d).ok,false);assert.equal(invoked,false);
 const symbols=packet(base);symbols.nodes[0][Symbol('hidden')]=1;assert.equal(serializeRequestGraph(symbols).ok,false);
});

test('graph and token work is bounded, including large text before serialization',()=>{
 assert.equal(serializeRequestGraph(packet(base),{budget:1}).ok,false);
 const d=packet(base);d.nodes[0].attrs.text[0].value='a'.repeat(10000);assert.equal(serializeRequestGraph(d,{budget:500}).issues[0].reason,'budget');
});
