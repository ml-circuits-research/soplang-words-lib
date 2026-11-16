import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileGrammarOverlay, parseText, composeParses } from '../tools/lib-under-test.mjs';
import { catalogWorld } from '../tools/worlds.mjs';
import { ENGLISH_OVERLAY_TYPES, ENGLISH_READER_FACTS } from '../compat/psys2/reader/overlay.mjs';
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
