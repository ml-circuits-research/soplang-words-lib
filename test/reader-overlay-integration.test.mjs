import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileGrammarOverlay, parseText, composeParses, readGrammarRequests, World, inspectRequest } from '../tools/lib-under-test.mjs';
import { catalogWorld } from '../tools/worlds.mjs';
import { ENGLISH_OVERLAY_TYPES, ENGLISH_READER_FACTS, ENGLISH_REQUEST_OPTIONS } from '../compat/psys2/reader/overlay.mjs';
const world=await catalogWorld(ENGLISH_READER_FACTS);

test('published overlay compiles provider families and both declared value domains', {skip:!world&&'pinned knowledge unavailable'},()=>{
 const compiled=compileGrammarOverlay(world,{types:ENGLISH_OVERLAY_TYPES});assert.equal(compiled.ok,true,JSON.stringify(compiled.issues));
 const entries=Object.entries(compiled.grammar.lexicon).flatMap(([text,entries])=>entries.map(entry=>({text,...entry})));
 assert.ok(entries.length>1000,'broad provider families, not just development sentence words');
 const target=entries.find(entry=>entry.cat==='KIND'&&/^[a-z]+$/.test(entry.text));
 for(const concept of ['colour','shape']) {
  const property=entries.find(entry=>entry.cat==='PROPERTY'&&entry.feat.concept===concept);
  const value=entries.find(entry=>entry.cat==='VALUE'&&entry.feat.concept===concept&&/^[a-z]+$/.test(entry.text));
  const sentence=`change the ${property.text} of the ${target.text} to ${value.text}`;
  const parses=parseText(world,sentence,{...compiled.grammar,start:'Message',sourceSpans:true});
  const result=composeParses(parses,compiled.composition);
  assert.ok(result.candidates.length>0,JSON.stringify({sentence,failures:result.failures}));
  for(const candidate of result.candidates){assert.equal(candidate.value.mood,'do');assert.equal(candidate.value.target.mode,'existing');assert.equal(candidate.value.constraint.concept,concept);assert.deepEqual(candidate.value.constraint.evidence,[[sentence.length-value.text.length,sentence.length]]);}
 }
 const property=entries.find(entry=>entry.cat==='PROPERTY'&&entry.feat.concept==='colour');
 const value=entries.find(entry=>entry.cat==='VALUE'&&entry.feat.concept==='shape'&&/^[a-z]+$/.test(entry.text));
 const incompatible=parseText(world,`change the ${property.text} of the ${target.text} to ${value.text}`,{...compiled.grammar,start:'Message',sourceSpans:true});
 const declined=composeParses(incompatible,compiled.composition);assert.ok(incompatible.length);assert.equal(declined.candidates.length,0);assert.ok(declined.failures.every(f=>f.reason==='guard-rejected'));
});


test('published imperative family yields the owner development colour request and a second property family', {skip:!world&&'pinned knowledge unavailable'},()=>{
 const compiled=compileGrammarOverlay(world,{types:ENGLISH_OVERLAY_TYPES});assert.equal(compiled.ok,true);
 for(const [text,concept,value] of [['Change the colour of the circle to purple.','colour','purple'],['Change the shape of the circle to square.','shape','square']]) {
  const result=readGrammarRequests(world,text,{compiled,...ENGLISH_REQUEST_OPTIONS});assert.equal(result.candidates.length,1,JSON.stringify(result));assert.equal(result.coverage.complete,true);
  const candidate=result.candidates[0],graph=new World();graph.load('@use core.use world=std.request');graph.load(candidate.wires);assert.equal(inspectRequest(graph,candidate.request).ok,true);
  assert.equal(graph.get('target').attrs.mode[0],'existing');assert.equal(graph.get('target').attrs.kind[0],'circle');assert.equal(graph.get('target').attrs.selector,undefined);
  assert.equal(graph.get('r').attrs.root[0],'$condition');assert.equal(graph.get('condition').attrs.concept[0],concept);assert.equal(graph.get('condition').attrs.value[0],value);
  assert.equal(graph.get('condition').attrs.character[0],'requirement');assert.equal(graph.get('condition').attrs.polarity[0],'positive');
  const start=Array.from(text.slice(0,text.indexOf(value))).length;assert.deepEqual(candidate.evidence.nodes[0].ranges,[[start,start+Array.from(value).length]]);
  assert.ok(candidate.origins.some(origin=>origin.wire==='k.shapes.shape.circle'));
 }
 for(const text of ['Change the colour of the green circle to purple.','Change the colour of the circle to purple?','Do not change the colour of the circle to purple.'])assert.equal(readGrammarRequests(world,text,{compiled,...ENGLISH_REQUEST_OPTIONS}).candidates.length,0,text);
});
