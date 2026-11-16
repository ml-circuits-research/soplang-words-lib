import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, parseText } from '../tools/lib-under-test.mjs';
const world=new World();world.load('@r g.rule lhs=M rhs=N');
const lexicon={ko:Array.from({length:5},(_,i)=>({cat:'N',lemma:'same',origin:String(i)}))};
test('opt-in actual pruning reports final and chart caps, retaining default output compatibility',()=>{
 const legacy=parseText(world,'ko',{start:'M',lexicon,max:1});assert.equal(legacy.limits,undefined);
 const bounded=parseText(world,'ko',{start:'M',lexicon,max:1,reportLimits:true});
 assert.equal(bounded.length,1);assert.equal(bounded.limits.pruned,true);assert.deepEqual(new Set(bounded.limits.reasons),new Set(['chart','results']));
 const complete=parseText(world,'ko',{start:'M',lexicon,max:8,reportLimits:true});assert.equal(complete.length,5);assert.deepEqual(complete.limits,{pruned:false,reasons:[]});
 const finalOnly=parseText(world,'ko',{start:'M',lexicon,max:2,reportLimits:true});assert.deepEqual(finalOnly.limits,{pruned:true,reasons:['results']});
});
test('pruning inside an unsuccessful branch remains visible when one full parse survives',()=>{
 const w=new World();w.load('@a g.rule lhs=M rhs=N rhs=Missing @b g.rule lhs=M rhs=Only');
 const parsed=parseText(w,'ko',{start:'M',max:1,reportLimits:true,lexicon:{ko:[...lexicon.ko,{cat:'Only'}]}});
 assert.equal(parsed.length,1);assert.equal(parsed.limits.pruned,true);assert.ok(parsed.limits.reasons.includes('chart'));
});
