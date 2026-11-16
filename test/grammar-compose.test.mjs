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

test('per-production guards reject only mismatching alternatives before parent evaluation',()=>{
 const guarded={...mapping,guards:{r:[{left:get('children',1,'concept'),right:'tint'}]}};
 const result=composeParses(parses(),guarded);
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].value.result.concept,'tint');
 assert.equal(result.failures[0].reason,'guard-rejected');
 const rejected=composeParses(parses(),{...guarded,rules:{r:get('absent')},guards:{r:[{left:1,right:2}]}});
 assert.ok(rejected.failures.every(f=>f.reason==='guard-rejected'),'parent template is not evaluated after rejection');
 assert.ok(composeParses(parses(),{...guarded,guards:{r:[{left:get('children',1,'absent'),right:null}]}}).failures.every(f=>f.reason==='missing-binding'));
 assert.deepEqual(composeParses(parses(),{...mapping,rules:{...mapping.rules,unrelated:'unused'},guards:{unrelated:[{left:1,right:2}]}}),composeParses(parses(),mapping));
});

test('guard equality is structural JSON equality, insensitive to object order but strict on types and array order',()=>{
 const p=[{tree:{cat:'M',rule:'r',children:[]}}];
 const check=(left,right)=>composeParses(p,{rules:{r:'accepted'},guards:{r:[{left:{$literal:left},right:{$literal:right}}]}});
 assert.equal(check({a:[1,{x:false,y:null}],b:'v'},{b:'v',a:[1,{y:null,x:false}]}).candidates.length,1);
 assert.equal(check(-0,0).candidates.length,1,'JSON has one zero value');
 assert.equal(check(Object.assign(Object.create(null),{a:1}),{a:1}).candidates.length,1);
 for(const [a,b] of [[1,'1'],[false,0],[[1,2],[2,1]],[{},[]],[{a:1},{b:1}],[null,{}],['A','a']]) assert.equal(check(a,b).failures[0].reason,'guard-rejected');
 assert.equal(check(JSON.parse('{"__proto__":1}'),{}).failures[0].reason,'guard-rejected');
});

test('guard declarations and operands fail closed and use the shared budget',()=>{
 const p=[{tree:{cat:'M',rule:'r',children:[]}}];
 const check=guards=>composeParses(p,{rules:{r:'accepted'},guards:{r:guards}});
 for(const guard of [null,{},[{left:1}],[{left:1,right:1,operator:'coerce'}],Array(1)]) assert.equal(check(guard).candidates.length,0);
 let called=0;const operand={get x(){called++;return 1;}};
 assert.equal(check([{left:{$literal:operand},right:{x:1}}]).failures[0].reason,'accessor-property');
 assert.equal(called,0);
 const guards={r:[{left:Array(20).fill(1),right:Array(20).fill(1)}]};
 assert.equal(composeParses(p,{rules:{r:'accepted'},budget:30}).candidates.length,1);
 const bounded=composeParses(p,{rules:{r:'accepted'},guards,budget:30});
 assert.equal(bounded.truncated,true);assert.equal(bounded.failures[0].reason,'budget');assert.deepEqual(bounded.candidates,[]);
 const halfway=composeParses([...p,...p],{rules:{r:'accepted'},guards:{r:[{left:1,right:1}]},budget:30});
 assert.deepEqual(halfway,{candidates:[{index:0,value:'accepted'}],failures:[{index:1,reason:'budget'}],truncated:true});
});


test('all guard declarations validate before any candidate, including unused rules and inherited/accessor maps',()=>{
 const p=[{tree:{cat:'M',rule:'r',children:[]}}];
 const rules={r:'accepted',unused:'unused'};
 for(const guards of [null,{typo:[{left:1,right:1}]},{unused:[{left:1}]},Object.create({r:[{left:1,right:2}]}),{unused:[{left:{$get:[]},right:1}]}]) {
  const out=composeParses(p,{rules,guards});assert.deepEqual(out.candidates,[]);assert.equal(out.failures.length,1);assert.equal(out.failures[0].index,undefined);
 }
 let calls=0;const guards={get unused(){calls++;return [];}};
 assert.equal(composeParses(p,{rules,guards}).failures[0].reason,'accessor-property');assert.equal(calls,0);
 const valid=composeParses(p,{rules,guards:{unused:[{left:get('missing','in','this','batch'),right:0}]}});
 assert.deepEqual(valid.candidates,[{index:0,value:'accepted'}]);
});
