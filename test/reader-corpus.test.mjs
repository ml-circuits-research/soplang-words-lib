import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReaderRows,validateDevelopment,validateHeldout,jsonRows} from '../tools/reader-corpus.mjs';
const base=new URL('../compat/psys2/reader/',import.meta.url);
const rows=jsonRows(readFileSync(new URL('development/rows.jsonl',base),'utf8'));
const labels=jsonRows(readFileSync(new URL('development/labels.jsonl',base),'utf8'));
const toy={id:'toy',area:'drawing',text:'add an item',source:{kind:'toy'},gold:{outcome:'request',candidates:[{request:'r',wires:'@source std.request.source text="add an item"\n@r std.request act=make mood=do source=$source\n@target std.request.target request=$r mode=new kind=item'}]}};
test('development provenance inventory and proposed labels retain every source row',()=>{
 const result=validateDevelopment(rows,labels);assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(result.rows,205);assert.equal(result.labelled,7);assert.equal(result.pending,198);
 const en=rows.filter(r=>r.source.kind==='owner-english');assert.equal(en.length,16);
 const mixed=rows.filter(r=>r.source.kind==='owner-english-language-reviewed');assert.equal(mixed.length,28);assert.ok(mixed.some(r=>r.source.turn===14&&r.source.selectedLanguage==='ro'));assert.ok(!mixed.some(r=>r.source.turn===33));
 const gloss=rows.filter(r=>r.source.kind==='owner-reviewed-english-gloss');assert.equal(gloss.length,161);assert.ok(gloss.every(r=>r.source.originalText&&r.source.translation==='hand-gloss'));
 assert.ok(rows.every(r=>!Object.hasOwn(r,'ref')&&!Object.hasOwn(r,'expect')),'old reader and execution keys are not labels');
});
test('independently authored holdout remains byte-frozen and structurally valid',()=>{
 const result=validateHeldout();assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(result.rows,20);
});
test('candidate labels use published graphs and exact source text',()=>{
 assert.equal(validateReaderRows([toy]).ok,true);
 for(const bad of [toy.gold.candidates[0].wires.replace('mood=do','mood=guess'),toy.gold.candidates[0].wires.replace('text="add an item"','text="another sentence"'),toy.gold.candidates[0].wires+'\n@extra std.request.unknown foo=bar']){
  const row=structuredClone(toy);row.gold.candidates[0].wires=bad;assert.equal(validateReaderRows([row]).ok,false);
 }
 const missing=structuredClone(toy);missing.gold.candidates[0].request='absent';assert.equal(validateReaderRows([missing]).ok,false);
});
test('invalid source spans and orphan request nodes are refused',()=>{
 for(const extra of ['@c std.request.constraint request=$r target=$target concept=colour operator=eq value=red polarity=positive character=requirement source=$source source.start=0 source.end=100','@n std.request.not request=$r of=$n']){
  const row=structuredClone(toy);row.gold.candidates[0].wires+='\n'+extra;assert.equal(validateReaderRows([row]).ok,false);
 }
});
test('corpus and label identities cannot silently overwrite rows or evidence',()=>{
 assert.equal(validateReaderRows([toy,toy]).ok,false);
 assert.equal(validateDevelopment([toy],[{id:'missing',gold:toy.gold}]).ok,false);
 assert.equal(validateDevelopment([toy],[{id:'toy',gold:toy.gold},{id:'toy',gold:toy.gold}]).ok,false);
 assert.equal(validateDevelopment([toy],[{id:'toy',text:'replaced',gold:toy.gold}]).ok,false);
 const pending={...toy};delete pending.gold;assert.equal(validateReaderRows([pending]).ok,true);assert.equal(validateReaderRows([pending],{heldout:true}).ok,false);
});
