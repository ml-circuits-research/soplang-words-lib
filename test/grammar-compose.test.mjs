import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, parseText, composeParses } from '../tools/lib-under-test.mjs';

// Invented toy language: the order is target, quality, imperative verb.
const world = new World();
world.tell(`@n g.word text=ko cat=N kind=vessel
@v g.word text=mi cat=V act=modify mood=do
@a g.word text=za cat=A concept=tint operator=eq value=amber
@b g.word text=za cat=A concept=texture operator=eq value=rough
@r g.rule lhs=M rhs=N rhs=A rhs=V`);
const get = (...path) => ({ $get: path });
const mapping = {
 lexical: { N: { kind: get('node','feat','kind') }, A: { concept: get('node','feat','concept'), operator: get('node','feat','operator'), value: get('node','feat','value'), ranges: get('node','sourceRanges') }, V: { act: get('node','feat','act'), mood: get('node','feat','mood') } },
 rules: { r: { target: get('children',0), result: get('children',1), act: get('children',2,'act'), mood: get('children',2,'mood') } },
};
const parses = () => parseText(world,'Ko za mi.',{start:'M',sourceSpans:true});

test('declarative composition preserves lexical alternatives, canonical features and original evidence', () => {
 const p=parses(), out=composeParses(p,mapping);
 assert.equal(out.candidates.length,2); assert.deepEqual(out.failures,[]);
 assert.deepEqual(new Set(out.candidates.map(c=>c.value.result.concept)),new Set(['tint','texture']));
 for(const c of out.candidates){ assert.equal(c.value.target.kind,'vessel'); assert.equal(c.value.act,'modify'); assert.deepEqual(c.value.result.ranges,[[3,5]]); }
 out.candidates[0].value.result.ranges[0][0]=999;
 assert.deepEqual(p[0].tree.children[1].sourceRanges,[[3,5]],'output cannot mutate parser evidence');
});

test('missing mappings or features reject a reading, never invent a value',()=>{
 assert.equal(composeParses(parses(),{...mapping,lexical:{...mapping.lexical,A:{value:get('node','feat','absent')}}}).candidates.length,0);
 assert.ok(composeParses(parses(),{...mapping,lexical:{N:mapping.lexical.N,V:mapping.lexical.V}}).failures.every(f=>f.reason==='missing-mapping'));
 assert.equal(composeParses(parses(),{...mapping,rules:{r:get('children',0,'toString')}}).failures[0].reason,'missing-binding');
});

test('syntax-only nodes need explicit acknowledgement; quoted JSON and false/zero/null survive',()=>{
 const p=[{tree:{cat:'X',feat:{zero:0,no:false,empty:'',nil:null}}}];
 assert.deepEqual(composeParses(p,{lexical:{X:{$literal:null}}}).candidates[0].value,null);
 assert.deepEqual(composeParses(p,{lexical:{X:{data:get('node','feat'),quoted:{$literal:{$get:['not','evaluated']}}}}}).candidates[0].value,{data:{zero:0,no:false,empty:'',nil:null},quoted:{$get:['not','evaluated']}});
});

test('unmapped coordination, malformed directives, cycles and budgets are explicit',()=>{
 assert.equal(composeParses([{tree:{cat:'N',coord:[]}}],mapping).failures[0].reason,'unmapped-coordination');
 assert.equal(composeParses(parses(),{...mapping,budget:0}).truncated,true);
 assert.equal(composeParses(parses(),{...mapping,budget:-1}).failures[0].reason,'invalid-limits');
 assert.equal(composeParses(parses(),{...mapping,rules:{r:{$get:[]}}}).failures[0].reason,'invalid-path');
 const cyclic={};cyclic.again=cyclic;
 assert.equal(composeParses([{tree:{cat:'X'}}],{lexical:{X:{$literal:cyclic}},maxDepth:8}).failures[0].reason,'depth');
 const limited=composeParses([{tree:{cat:'X'}},{tree:{cat:'X'}}],{lexical:{X:'v'},budget:4});
 assert.deepEqual(limited,{candidates:[{index:0,value:'v'}],failures:[{index:1,reason:'budget'}],truncated:true});
 const p=parses();p.truncated=true;
 assert.equal(composeParses(p,mapping).truncated,true);
});

test('JSON copying rejects exotic objects, sparse arrays, symbols and accessors without executing them',()=>{
 const p=[{tree:{cat:'X'}}];
 const evaluate=value=>composeParses(p,{lexical:{X:{$literal:value}}});
 class Record { constructor(){this.value=1;} }
 for(const value of [new Date(),new Record(),[,1],Object.assign([1],{extra:2}),{[Symbol('hidden')]:1}]) {
  assert.equal(evaluate(value).candidates.length,0);
  assert.equal(evaluate(value).failures.length,1);
 }
 let calls=0;
 const getter={get value(){calls++;return 1;}};
 assert.equal(evaluate(getter).failures[0].reason,'accessor-property');
 assert.equal(composeParses(p,{lexical:{X:getter}}).failures[0].reason,'accessor-property');
 const array=[1];Object.defineProperty(array,'0',{get(){calls++;return 1;},enumerable:true});
 assert.equal(evaluate(array).failures[0].reason,'accessor-property');
 const node={cat:'X',feat:getter};
 assert.equal(composeParses([{tree:node}],{lexical:{X:get('node','feat','value')}}).failures[0].reason,'accessor-property');
 assert.equal(calls,0);
 const proto=JSON.parse('{"__proto__":{"value":1}}');
 const result=evaluate(proto).candidates[0].value;
 assert.equal(Object.getPrototypeOf(result),Object.prototype);
 assert.equal(Object.hasOwn(result,'__proto__'),true);
 assert.deepEqual(result.__proto__,{value:1});
 assert.equal(Object.prototype.value,undefined);
});
