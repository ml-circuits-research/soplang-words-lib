import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectTemplates, composeParses } from '../tools/lib-under-test.mjs';
const get=(...path)=>({$get:path});
const job=(context,template='frame')=>({template,context});

// Toy role records model the published frame contract without copying its facts.
const template={roles:[
 {frame_role:'object',act_role:'object',marker:false,value:get('node','object')},
 {frame_role:'result',act_role:'value',marker:false,value:get('node','result')},
]};
const context={node:{object:{kind:'toy.item',selector:{concept:'toy.tint',operator:'eq',value:'old'}},result:{concept:'toy.texture',operator:'eq',value:'new'}}};
test('direct semantic projection preserves whole selectors and distinct results, alternatives and detached data',()=>{
 const result=projectTemplates([job(context),job(context)],{templates:{frame:template}});
 assert.deepEqual(result.failures,[]);assert.deepEqual(result.candidates.map(c=>c.index),[0,1]);
 const roles=result.candidates[0].value.roles;assert.deepEqual(roles[0].value,context.node.object);assert.deepEqual(roles[1].value,context.node.result);assert.equal(roles[1].value.selector,undefined);
 roles[0].value.selector.value='changed';assert.equal(context.node.object.selector.value,'old');assert.equal(result.candidates[1].value.roles[0].value.selector.value,'old');
});

test('duplicate semantic role names retain both marker and argument records in their original order',()=>{
 const input={goal:{marker:'toward',object:{kind:'toy.location'}}};
 const roles=[{frame_role:'relation',act_role:'place',marker:true,value:get('goal','marker')},{frame_role:'location',act_role:'place',marker:false,value:get('goal','object')}];
 const result=projectTemplates([job(input)],{templates:{frame:roles}});
 assert.deepEqual(result.candidates[0].value,[{frame_role:'relation',act_role:'place',marker:true,value:'toward'},{frame_role:'location',act_role:'place',marker:false,value:{kind:'toy.location'}}]);
});

test('null is a real semantic context, never the template validation sentinel',()=>{
 const result=projectTemplates([job(null,'constant'),job(null,'read')],{templates:{constant:{$literal:null},read:get('missing')}});
 assert.deepEqual(result.candidates,[{index:0,value:null}]);assert.deepEqual(result.failures,[{index:1,reason:'missing-binding'}]);
 assert.equal(projectTemplates([job(null)],{templates:{frame:false},guards:{frame:[{left:get('missing'),right:null}]}}).failures[0].reason,'missing-binding');
});

test('missing paths and guard rejection remain indexed failures without discarding other candidates',()=>{
 const result=projectTemplates([job({x:1}),job({x:2}),job({}),job({x:1},'unknown')],{templates:{frame:get('x')},guards:{frame:[{left:get('x'),right:1}]}});
 assert.deepEqual(result.candidates,[{index:0,value:1}]);assert.deepEqual(result.failures,[{index:1,reason:'guard-rejected'},{index:2,reason:'missing-binding'},{index:3,reason:'missing-mapping'}]);
 const rejection=projectTemplates([job({})],{templates:{frame:get('absent')},guards:{frame:[{left:1,right:2}]}});assert.equal(rejection.failures[0].reason,'guard-rejected');
});

test('shared evaluator preserves composition language and equality semantics',()=>{
 const values=[null,false,0,'',{$get:['data']},{nested:[1,2]}];
 for(const value of values){
  const context={data:value},templates={frame:{a:get('data'),b:{$literal:{$get:['not-read']}}}};
  const direct=projectTemplates([job(context)],{templates});
  const parsed=composeParses([{tree:{rule:'frame',data:value}}],{rules:{frame:{a:get('node','data'),b:{$literal:{$get:['not-read']}}}}});
  assert.deepEqual(direct,parsed);
 }
 const guards={frame:[{left:get('a'),right:get('b')}]},templates={frame:'equal'};
 assert.equal(projectTemplates([job({a:{x:1,y:[false,null]},b:{y:[false,null],x:1}})],{templates,guards}).candidates.length,1);
 for(const [a,b] of [[1,'1'],[false,0],[[1,2],[2,1]],[{},[]]])assert.equal(projectTemplates([job({a,b})],{templates,guards}).failures[0].reason,'guard-rejected');
});

test('all declarations preflight before candidates and unsafe contexts are rejected without invoking getters',()=>{
 const jobs=[job({safe:1})],templates={frame:get('safe')};
 for(const options of [
  {templates:{...templates,unused:{$get:[]}}},
  {templates,guards:{absent:[{left:1,right:1}]}},
  {templates,guards:{frame:[{left:1}]}},
  {templates:Object.create(templates)},
 ])assert.deepEqual(projectTemplates(jobs,options).candidates,[]);
 let calls=0;const unsafe={safe:1,get ignored(){calls++;return 2;}};
 const accessorTemplate={get frame(){calls++;return 'bad';}};
 const accessorJob={template:'frame',get context(){calls++;return {};}};
 for(const [input,options] of [[[job(unsafe)],{templates}],[[accessorJob],{templates}],[jobs,{templates:accessorTemplate}]])assert.deepEqual(projectTemplates(input,options).candidates,[]);
 assert.equal(calls,0);
 for(const bad of [new Date(),[,1],Object.assign([1],{extra:2}),{[Symbol('x')]:1},Object.create({safe:1})])assert.equal(projectTemplates([job(bad)],{templates}).candidates.length,0);
 const sparse=Array(1);assert.equal(projectTemplates(sparse,{templates}).failures[0].index,undefined);
 const proto=JSON.parse('{"__proto__":{"safe":1}}');assert.deepEqual(projectTemplates([job(proto)],{templates:{frame:get('__proto__')}}).candidates[0].value,{safe:1});assert.equal(Object.prototype.safe,undefined);
});

test('one bounded evaluator covers the entire batch and marks partial enumeration explicitly',()=>{
 const templates={frame:get('x')},jobs=[job({x:1}),job({x:2})];
 const full=projectTemplates(jobs,{templates});assert.equal(full.candidates.length,2);
 // Find the first success boundary; the same budget cannot reset for job two.
 let budget=0,result;
 do{result=projectTemplates(jobs,{templates,budget:budget++});}while(!result.candidates.length && budget<1000);
 assert.equal(result.candidates.length,1);assert.equal(result.truncated,true);assert.equal(result.failures.at(-1).reason,'budget');assert.equal(result.failures.at(-1).index,1);
 assert.equal(projectTemplates([jobs[0]],{templates,budget:budget-1}).candidates.length,1);
 const malformed=projectTemplates(jobs,{templates,budget:-1});assert.equal(malformed.failures[0].reason,'invalid-limits');assert.equal(malformed.truncated,true);
 const cycle={};cycle.self=cycle;assert.equal(projectTemplates([job(cycle)],{templates,maxDepth:8}).failures[0].reason,'depth');
});
