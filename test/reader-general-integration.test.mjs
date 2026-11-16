import {test} from 'node:test';import assert from 'node:assert/strict';
import * as api from '../tools/lib-under-test.mjs';import {catalogWorld}from'../tools/worlds.mjs';
import {createGeneralEnglishReader,englishRequestMappings,ENGLISH_PHRASE_FACTS,ENGLISH_REQUEST_MAPPING_FACTS}from'../compat/psys2/reader/general.mjs';
import {ENGLISH_FRAME_FACTS}from'../compat/psys2/reader/frames.mjs';
const phraseWorld=await catalogWorld(ENGLISH_PHRASE_FACTS),frameWorld=await catalogWorld({...ENGLISH_FRAME_FACTS,...ENGLISH_REQUEST_MAPPING_FACTS,'w.lang.en':[...ENGLISH_FRAME_FACTS['w.lang.en'],'w.lang.en.prep'],'k.attributes':['k.attributes.attribute']});
const skip=!phraseWorld||!frameWorld?'pinned knowledge unavailable':false;
const setup=()=>{const reader=createGeneralEnglishReader(api),mapping=englishRequestMappings(api,frameWorld);assert.equal(mapping.ok,true,JSON.stringify(mapping));const compiled=reader.compile({phraseWorld,frameWorld,mappings:mapping.mappings});assert.equal(compiled.ok,true,JSON.stringify(compiled));return {reader,compiled,mapping};};
const graph=(reader,compiled,text)=>{const out=reader.read(compiled,text);assert.equal(out.coverage.complete,true,text+JSON.stringify(out));assert.ok(out.candidates.length,text);return out.candidates.map(candidate=>{const w=new api.World();w.load('@use core.use world=std.request');w.load(candidate.wires);assert.equal(api.inspectRequest(w,candidate.request).ok,true);assert.ok(candidate.origins.length);return {w,candidate};});};
test('all graphable published frame families reach validated requests across target domains',{skip},()=>{
 const {reader,compiled}=setup();assert.deepEqual(compiled.licences,['create','remove','result.change','place']);assert.deepEqual(compiled.unresolved,[{licence:'increment',reason:'missing-request-mapping'}]);
 for(const text of ['create a circle','create a report','remove the square','remove the report'])for(const {w} of graph(reader,compiled,text)){assert.equal(w.get('subject').attrs.mode[0],text.startsWith('create')?'new':'existing');assert.equal(w.get('r').attrs.root,undefined);assert.equal(w.ofType('std.request.constraint').length,0);}
 for(const text of ['make the green circle purple','make the blue square red','put the circle near the square','put the green circle above the blue square'])graph(reader,compiled,text);
});
test('neutral qualifiers select existing objects and describe new results without conflation',{skip},()=>{
 const {reader,compiled}=setup();for(const {w}of graph(reader,compiled,'create a green circle')){assert.equal(w.get('subject').attrs.selector,undefined);assert.equal(w.get('subject.qualifier').attrs.character[0],'requirement');}
 for(const {w,candidate}of graph(reader,compiled,'make the green circle purple')){assert.deepEqual(w.get('subject').attrs.selector,['$subject.qualifier']);assert.deepEqual(w.get('subject.qualifier').attrs.value,['"green"']);assert.equal(w.get('subject.qualifier').attrs.character[0],'assumption');assert.deepEqual(w.get('result').attrs.value,['"purple"']);assert.equal(w.get('result').attrs.character[0],'requirement');assert.deepEqual(candidate.evidence.nodes.find(n=>n.id==='result').ranges,[[22,28]]);}
 for(const {w}of graph(reader,compiled,'put the green circle near the blue square')){assert.deepEqual(w.get('relation').attrs.goal,['$goal']);assert.deepEqual(w.get('relation').attrs.target,['$subject']);assert.deepEqual(w.get('goal').attrs.selector,['$goal.qualifier']);assert.equal(w.get('relation').attrs.concept[0],'place');assert.equal(w.get('relation').attrs.relation[0],'near');}
});
test('unlicensed constructions, quantities and source gaps remain explicit rather than guessed',{skip},()=>{
 const {reader,compiled}=setup();for(const text of ['create two circles','remove the circle and create a square','is the circle green?','make it purple','put the circle with the square','put the circle next the square','make the circle purple?','create a circle!','create, a circle']){const out=reader.read(compiled,text);assert.equal(out.candidates.length,0,text);assert.equal(out.coverage.complete,false,text);}
 assert.equal(reader.read(compiled,'create a circle',{profile:{}}).failures[0].reason,'unsupported-reader-option');assert.equal(reader.read(compiled,'create a circle',{bridgeBudget:1}).candidates.length,0);
});
test('source-backed mappings reject missing joins and stale worlds; all alternatives retain provenance',{skip},()=>{
 const {reader,compiled,mapping}=setup();for(const {candidate}of graph(reader,compiled,'create a purple circle')){assert.ok(candidate.origins.some(o=>o.type==='k.colours.colour'));assert.equal(candidate.coverage.complete,true);}
 const changed=frameWorld.fork();const row=changed.get('w.reader.en.requests.component.place.relation');changed.replace(row.id,api.format({...row,attrs:{...row.attrs,concept:['invented']}}));assert.equal(englishRequestMappings(api,changed).ok,false);
 const unknown=structuredClone(mapping.mappings);unknown[0].components[0].role='absent';assert.equal(reader.compile({phraseWorld,frameWorld,mappings:unknown}).ok,false);
 const copy=phraseWorld.fork(),local=reader.compile({phraseWorld:copy,frameWorld,mappings:mapping.mappings});assert.equal(local.ok,true);copy.load('@reader.extra core.type of=reader.extra');assert.equal(reader.read(local,'create a circle').failures[0].reason,'stale-or-foreign-reader');
});
test('duplicate source licences remain alternatives rather than a false unique intent',{skip},()=>{
 const {mapping}=setup(),frames=frameWorld.fork(),licence=frames.get('w.reader.en.frames.licence.create');frames.load(api.format({...licence,id:licence.id+'.alternative',attrs:{...licence.attrs,name:['create.alternative']}}));
 for(const row of [...frames.wires.values()].filter(w=>w.type==='w.reader.en.frames.role'&&w.attrs.licence?.[0]==='create'))frames.load(api.format({...row,id:row.id+'.alternative',attrs:{...row.attrs,name:[row.attrs.name[0]+'.alternative'],licence:['create.alternative']}}));
 const mappings=structuredClone(mapping.mappings);mappings.push({...structuredClone(mappings[0]),licence:'create.alternative'});const reader=createGeneralEnglishReader(api),compiled=reader.compile({phraseWorld,frameWorld:frames,mappings});assert.equal(compiled.ok,true);
 const partial=reader.compile({phraseWorld,frameWorld:frames,mappings:mapping.mappings});assert.equal(partial.ok,true);assert.equal(reader.read(partial,'create a circle').failures[0].reason,'missing-request-mapping');
 const result=reader.read(compiled,'create a circle');assert.equal(result.candidates.length,2,JSON.stringify(result.failures));assert.equal(result.interpretations.length,2);assert.notEqual(result.interpretations[0].licence,result.interpretations[1].licence);
 assert.equal(reader.read(compiled,'create a circle',{compositionBudget:1}).candidates.length,0);
});

test('malformed graph mappings and generated qualifier ID collisions are refused before reading',{skip},()=>{
 const {reader,mapping}=setup();for(const mutate of [m=>m[0].components.push({...m[0].components[0]}),m=>{m[2].components.find(c=>c.kind==='predicate').id='subject.qualifier';},m=>{m[0].components[0].extra='ignored';},m=>{m[0].metadata=[['__proto__','injected']];}]){const m=structuredClone(mapping.mappings);mutate(m);assert.equal(reader.compile({phraseWorld,frameWorld,mappings:m}).ok,false,mutate.toString());}
 let invoked=false;const hostile={get licence(){invoked=true;return 'create';}};assert.equal(reader.compile({phraseWorld,frameWorld,mappings:[hostile]}).ok,false);assert.equal(invoked,false);
});
