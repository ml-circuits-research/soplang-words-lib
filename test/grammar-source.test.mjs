import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,parseText} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@r g.rule lhs=S rhs=W+');return w;};
const options={sourceSpans:true,lexicon:Object.fromEntries(['red','cup','next to','x','i','tem','ος','𐐨','a','b','s'].map(word=>[word,{cat:'W'}]))};
const nodes=tree=>{const all=[tree],seen=new Set();for(let i=0;i<all.length;i++){const n=all[i];if(seen.has(n))continue;seen.add(n);all.push(...(n.children||[]),...(n.coord||[]));}return [...seen];};
function withoutSources(result){const copy=structuredClone(result);delete copy.source;for(const p of copy)for(const n of nodes(p.tree))delete n.sourceRanges;return copy;}
test('opt-in provenance keeps legacy tokens, parse candidates and token-index spans unchanged',()=>{
 const w=make(),text='  RED, cup!';const legacy=parseText(w,text,{lexicon:options.lexicon}),mapped=parseText(w,text,options);
 assert.deepEqual(withoutSources(mapped),legacy);assert.equal(Object.hasOwn(legacy,'source'),false);
 assert.equal(mapped.source.text,text);assert.equal(mapped.source.unit,'unicode-scalar');assert.equal(mapped.source.status,'exact');
 assert.deepEqual(mapped.source.tokenRanges,[[[2,5]],[[7,10]]]);assert.deepEqual(mapped[0].tree.span,[0,2]);assert.deepEqual(mapped[0].tree.sourceRanges,[[2,5],[7,10]]);
});
test('multiword lexemes retain disjoint evidence through whitespace and ignored punctuation',()=>{
 const p=parseText(make(),'NEXT,\n TO x',options);assert.deepEqual(p.tokens,['next to','x']);
 assert.deepEqual(p.source.tokenRanges,[[[0,4],[7,9]],[[10,11]]]);assert.deepEqual(p[0].tree.sourceRanges,[[0,4],[7,9],[10,11]]);
 assert.deepEqual([...p.source.text].slice(...p.source.tokenRanges[0][1]).join(''),'TO');
});
test('Unicode scalar offsets handle astral characters, combining gaps and casing expansions',()=>{
 const astral=parseText(make(),'😀 RED 𐐀',options);assert.deepEqual(astral.tokens,['red','𐐨']);assert.deepEqual(astral.source.tokenRanges,[[[2,5]],[[6,7]]]);
 const combining=parseText(make(),'a\u0301b',options);assert.deepEqual(combining.tokens,['a','b']);assert.deepEqual(combining.source.tokenRanges,[[[0,1]],[[2,3]]]);
 const expansion=parseText(make(),'İTEM',options);assert.deepEqual(expansion.tokens,['i','tem']);assert.deepEqual(expansion.source.tokenRanges,[[[0,1]],[[1,4]]]);
 const context=parseText(make(),'ΟΣ',options);assert.deepEqual(context.tokens,['ος']);assert.equal(context.source.status,'exact');assert.deepEqual(context.source.tokenRanges,[[[0,2]]]);
});
test('actual alternation rewrites keep parses but decline unproven original alignment',()=>{
 const w=make(),alternations={rules:[{name:'wrapper',from:'please {x}',to:'{x}'}]};
 const changed=parseText(w,'Please RED cup!',{...options,alternations});assert.equal(changed.length,1);assert.deepEqual(changed.tokens,['red','cup']);assert.equal(changed.source.status,'unavailable');assert.equal(changed.source.reason,'unaligned-alternation');assert.equal(changed.source.tokenRanges,null);assert.equal(changed.source.text,'Please RED cup!');assert.ok(nodes(changed[0].tree).every(n=>!Object.hasOwn(n,'sourceRanges')));
 const unchanged=parseText(w,'RED cup!',{...options,alternations});assert.equal(unchanged.source.status,'exact');assert.deepEqual(unchanged.source.tokenRanges,[[[0,3]],[[4,7]]]);
});
test('isolated surrogates never produce purported Unicode scalar provenance',()=>{
 for(const text of ['\ud800RED','RED\udfff']){const p=parseText(make(),text,options);assert.equal(p.length,1);assert.equal(p.source.status,'unavailable');assert.equal(p.source.reason,'invalid-unicode');assert.equal(p.source.tokenRanges,null);assert.ok(nodes(p[0].tree).every(n=>!Object.hasOwn(n,'sourceRanges')));}
});
test('mapping-only budget exhaustion preserves parses without partial decorations',()=>{
 const w=make(),text='red cup red cup',legacy=parseText(w,text,{lexicon:options.lexicon});
 for(const sourceBudget of [0,1,30,60,90]){const p=parseText(w,text,{...options,sourceBudget});assert.deepEqual(withoutSources(p),legacy);assert.equal(p.source.status,'unavailable');assert.equal(p.source.reason,'budget');assert.ok(nodes(p[0].tree).every(n=>!Object.hasOwn(n,'sourceRanges')));}
 const bad=parseText(w,text,{...options,sourceBudget:Infinity});assert.equal(bad.source.reason,'invalid-budget');
 const complete=parseText(w,text,{...options,sourceBudget:1000});assert.equal(complete.source.status,'exact');assert.deepEqual(withoutSources(complete),legacy);
});
test('empty or unknown text still has honest token correspondence without inventing parses',()=>{
 const w=make();const empty=parseText(w,'😀, !',options);assert.equal(empty.length,0);assert.equal(empty.source.status,'exact');assert.deepEqual(empty.source.tokenRanges,[]);
 const unknown=parseText(w,'RED unknown!',options);assert.equal(unknown.length,0);assert.deepEqual(unknown.unknown,[{word:'unknown',at:1}]);assert.deepEqual(unknown.source.tokenRanges[1],[[4,11]]);
});
