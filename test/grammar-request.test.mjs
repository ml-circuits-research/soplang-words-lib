import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readGrammarRequests, inspectRequest, valueText } from '../tools/lib-under-test.mjs';
const get=(...path)=>({$get:path});
// Invented three-word language; adapter knowledge is explicit data, not English rules.
const fixture=()=>{
 const world=new World();
 const lexical={A:get('node','feat'),K:get('node','feat'),V:{concept:get('node','feat','concept'),operator:get('node','feat','operator'),value:get('node','feat','value'),evidence:get('node','sourceRanges')}};
 const rule={act:get('children',0,'act'),mood:'do',target:{mode:'existing',kind:get('children',1,'kind')},constraint:{concept:get('children',2,'concept'),operator:get('children',2,'operator'),value:get('children',2,'value'),character:'requirement',polarity:'positive',evidence:get('children',2,'evidence')},evidence:get('node','sourceRanges')};
 const compiled={ok:true,source:{world,stamp:world.stamp},grammar:{types:{word:null,coord:null},productions:[{id:'r',attrs:{lhs:['M'],rhs:['A','K','V']}}],lexicon:{mo:{cat:'A',feat:{act:'modify'},origin:'a'},ko:{cat:'K',feat:{kind:'vessel'},origin:'k'},za:{cat:'V',feat:{concept:'tint',operator:'eq',value:'amber'},origin:'v'}}},composition:{rules:{r:rule},lexical},provenance:Object.fromEntries(['a','k','v'].map(id=>[id,{binding:'toy',wire:id,type:'toy.term',metadata:{'core.source':['invented']}}]))};
 return {world,compiled,options:{compiled,start:'M',terminalPunctuation:['.']}};
};
const graph=candidate=>{const w=new World();w.load('@u core.use world=std.request');w.load(candidate.wires);return w;};

test('declared generic property assignment becomes a checked request graph with exact source and no instance claim',()=>{
 const {world,options}=fixture();const result=readGrammarRequests(world,'Mo ko za.',options);
 assert.equal(result.candidates.length,1,JSON.stringify(result));assert.equal(result.coverage.complete,true);
 const c=result.candidates[0],w=graph(c);assert.equal(inspectRequest(w,c.request).ok,true);
 assert.equal(valueText(w.get('source').attrs.text[0]),'Mo ko za.');assert.equal(w.get('target').attrs.mode[0],'existing');assert.equal(w.get('target').attrs.kind[0],'vessel');
 assert.equal(w.get('condition').attrs.value[0],'amber');assert.deepEqual([w.get('condition').attrs['source.start'][0],w.get('condition').attrs['source.end'][0]],['6','8']);
 assert.equal(c.coverage.terminal,'.');assert.equal(c.origins.length,3);assert.equal(world.wires.size,0);
});

test('unaccounted punctuation, negation, target modifiers and absent semantic declarations never become successful readings',()=>{
 for(const text of ['Mo ko za?','Mo, ko za','not mo ko za','mo extra ko za','😀mo ko za']){const f=fixture();assert.equal(readGrammarRequests(f.world,text,f.options).candidates.length,0,text);}
 const f=fixture();assert.equal(readGrammarRequests(f.world,'mo ko za.',{...f.options,terminalPunctuation:[]}).failures[0].reason,'unaccounted-source-gap');
 assert.equal(readGrammarRequests(f.world,'mo ko za',{...f.options,terminalPunctuation:['not']}).failures[0].reason,'invalid-punctuation-policy');
 for(const path of [['target','mode'],['constraint','polarity'],['constraint','character']]){const f=fixture();delete f.compiled.composition.rules.r[path[0]][path[1]];assert.equal(readGrammarRequests(f.world,'mo ko za',f.options).candidates.length,0);}
 const selected=fixture();selected.compiled.composition.rules.r.target.selector='unsupported';assert.equal(readGrammarRequests(selected.world,'mo ko za',selected.options).candidates.length,0,'unimplemented selector is not silently dropped');
});

test('ambiguity survives and actual pruning, missing alternative bindings or resource exhaustion decline',()=>{
 const f=fixture(),original=f.compiled.grammar.lexicon.za;f.compiled.grammar.lexicon.za=[original,{...original,feat:{...original.feat,value:'gold'},origin:'other'}];f.compiled.provenance.other={...f.compiled.provenance.v,wire:'other'};
 assert.equal(readGrammarRequests(f.world,'mo ko za',f.options).candidates.length,2);
 assert.equal(readGrammarRequests(f.world,'mo ko za',{...f.options,max:1}).failures[0].reason,'parse-incomplete');
 delete f.compiled.grammar.lexicon.za[1].feat.concept;assert.equal(readGrammarRequests(f.world,'mo ko za',f.options).failures[0].reason,'composition-incomplete');
 for(const limit of ['budget','sourceBudget','compositionBudget','bridgeBudget']){const x=fixture();assert.equal(readGrammarRequests(x.world,'mo ko za',{...x.options,[limit]:1}).candidates.length,0,limit);}
 const low=fixture();assert.doesNotThrow(()=>readGrammarRequests(low.world,'mo ko za',{...low.options,bridgeBudget:100}));
});

test('bridge refuses stale schema stamps and foreign worlds, retaining freshness after read-only use',()=>{
 const f=fixture();assert.equal(readGrammarRequests(f.world.fork(),'mo ko za',f.options).failures[0].reason,'stale-or-foreign-compilation');
 assert.equal(readGrammarRequests(f.world,'mo ko za',f.options).candidates.length,1);
 f.world.load('@new core.type of=extra');assert.equal(readGrammarRequests(f.world,'mo ko za',f.options).failures[0].reason,'stale-or-foreign-compilation');
});

test('disjoint lexical evidence remains disjoint, and serialization cannot inject extra wires',()=>{
 const f=fixture();f.compiled.grammar.lexicon['za zi']=f.compiled.grammar.lexicon.za;delete f.compiled.grammar.lexicon.za;
 const result=readGrammarRequests(f.world,'mo ko za zi',f.options);assert.equal(result.candidates.length,1,JSON.stringify(result));const c=result.candidates[0];assert.deepEqual(c.evidence.constraint,[[6,8],[9,11]]);assert.equal(graph(c).get('condition').attrs['source.start'],undefined);
 const x=fixture();x.compiled.grammar.lexicon.za.feat.value='odd "value"\n@injected bad';const answer=readGrammarRequests(x.world,'mo ko za',x.options);assert.equal(answer.candidates.length,1);const w=graph(answer.candidates[0]);assert.equal(w.get('injected'),undefined);assert.equal(valueText(w.get('condition').attrs.value[0]),'odd "value"\n@injected bad');
});
