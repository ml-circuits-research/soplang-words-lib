import {test} from 'node:test';import assert from 'node:assert/strict';
import {World,evaluateRequestPredicates} from '../tools/lib-under-test.mjs';
const context=(version='1',instanceId='toy.instance',scope='items')=>({instanceId,scope,version});
const subject=(id='one',version='1')=>({id,source:'toy.source.'+id,sourceType:'toy.item',version});
const binding=(id='one',version='1')=>({context:context(version),subject:subject(id,version)});
const leaf=(id='c',target='t',polarity='positive')=>`@${id} std.request.constraint request=$r target=$${target} concept=quantity operator=eq value=1 polarity=${polarity} character=requirement`;
const make=(body='',root='',targetExtra='')=>{const w=new World();w.load(`@use core.use world=std.request\n@s std.request.source text="invented"\n@r std.request act=inspect mood=check source=$s${root?' root=$'+root:''}\n@t std.request.target request=$r mode=existing kind=sample ${targetExtra}\n${body}`);return w;};
const evaluate=(w,options={})=>evaluateRequestPredicates(w,'r',{bindings:{t:binding()},evaluateConstraint:()=>({truth:'true',evidence:[{source:'toy.evidence'}]}),...options});
const quant=(kind='all',extra='')=>make(`@b std.request.target request=$r mode=bound\n${leaf('c','b')}\n@q std.request.quant request=$r kind=${kind} target=$t bind=$b body=$c\n${extra}`,'q');
const population=(subjects=[],complete=true)=>({context:context(),complete,subjects,evidence:[{source:'toy.population'}]});

test('positive callback truth, evidence and source provenance stay separate from polarity',()=>{
 const w=make(leaf('c','t','negative'));let captured;const r=evaluate(w,{evaluateConstraint:input=>{captured=input;return {truth:'false',evidence:[{source:'witness'}]};}});assert.equal(r.ok,true);assert.equal(r.truth,'true');assert.equal(captured.constraint.attrs.polarity[0],'positive');assert.equal(captured.originalPolarity,'negative');assert.ok(Object.isFrozen(captured.bindings.t.subject));assert.equal(r.trace[0].node.attrs.polarity[0],'negative');assert.equal(r.provenance.request.attrs.source[0],'$s');assert.equal(r.evidence[0].source,'witness');assert.equal(w.get('c').attrs.polarity[0],'negative');
 for(const polarity of ['positive','negative'])assert.equal(evaluate(make(leaf('c','t',polarity)),{evaluateConstraint:()=>({truth:'unknown',evidence:[],reason:'unobserved'})}).truth,'unknown');
});
test('nested AND/OR/NOT use strong three-valued logic and memoize shared DAG nodes per binding',()=>{
 const w=make(`${leaf()}\n@n std.request.not request=$r of=$c\n@g std.request.group request=$r operator=and member=$c member=$n`,'g');let calls=0;const result=evaluate(w,{evaluateConstraint:()=>{calls++;return {truth:'true',evidence:[]};}});assert.equal(result.truth,'false');assert.equal(calls,1);assert.equal(result.trace.filter(e=>e.node.id==='c').length,1);
 const nested=make(`${leaf('a')}\n${leaf('b')}\n${leaf('c')}\n@or std.request.group request=$r operator=or member=$b member=$c\n@and std.request.group request=$r operator=and member=$a member=$or`,'and');const values={a:'unknown',b:'false',c:'true'};assert.equal(evaluate(nested,{evaluateConstraint:({constraint})=>({truth:values[constraint.id],evidence:[]})}).truth,'unknown');values.a='false';assert.equal(evaluate(nested,{evaluateConstraint:({constraint})=>({truth:values[constraint.id],evidence:[]})}).truth,'false');
});
test('default implicit conjunction excludes every selector closure and empty content is unknown',()=>{
 const w=make(`${leaf('selector')}\n${leaf('result')}`,'','selector=$selector'),calls=[];const callback=({constraint,context})=>{calls.push([constraint.id,context]);return {truth:constraint.id==='selector'?'false':'true',evidence:[]};};assert.equal(evaluate(w,{evaluateConstraint:callback}).truth,'true');assert.deepEqual(calls,[['result','result']]);assert.equal(evaluate(w,{selector:'t',evaluateConstraint:callback}).truth,'false');assert.equal(calls.at(-1)[1],'selector');
 assert.equal(evaluate(make()).truth,'unknown');assert.equal(evaluate(make(leaf('selector'),'','selector=$selector')).reasons[0].reason,'no-predicate-content');assert.equal(evaluate(w,{selector:'missing'}).ok,false);
});
test('complete empty quantifiers have vacuous truth without inventing leaf observations',()=>{
 for(const [kind,truth]of [['all','true'],['each','true'],['any','false'],['none','true']]){let calls=0;const result=evaluate(quant(kind),{resolvePopulation:()=>population(),evaluateConstraint:()=>{calls++;return {truth:'true',evidence:[]};}});assert.equal(result.truth,truth,kind);assert.equal(calls,0);}
});
test('partial populations need coverage but counterexamples and witnesses are decisive',()=>{
 for(const [kind,value,truth]of [['all','false','false'],['each','false','false'],['any','true','true'],['none','true','false'],['all','true','unknown'],['each','true','unknown'],['any','false','unknown'],['none','false','unknown']]){const result=evaluate(quant(kind),{resolvePopulation:()=>population([subject()],false),evaluateConstraint:()=>({truth:value,evidence:[{source:'actual.witness'}]})});assert.equal(result.truth,truth,kind+value);assert.ok(result.evidence.some(e=>e.source==='actual.witness'));}
 for(const kind of ['all','each','any','none'])assert.equal(evaluate(quant(kind),{resolvePopulation:()=>population([],false)}).truth,'unknown');
});
test('nested populations bind lexically with explicit independent snapshots',()=>{
 const w=make(`@outer.b std.request.target request=$r mode=bound\n@inner.b std.request.target request=$r mode=bound\n${leaf('c','inner.b')}\n@outer std.request.quant request=$r kind=all target=$t bind=$outer.b body=$inner\n@inner std.request.quant request=$r kind=any target=$outer.b bind=$inner.b body=$c`,'outer'),seen=[];
 const result=evaluate(w,{resolvePopulation:input=>input.quantifier.id==='outer'?population([subject('a'),subject('b')]):{context:context('2','other.instance','nested'),complete:true,subjects:[subject('nested','2')],evidence:[]},evaluateConstraint:({bindings})=>{seen.push([bindings['outer.b'].subject.id,bindings['inner.b'].context.instanceId,bindings['inner.b'].subject.version]);return {truth:'true',evidence:[]};}});assert.equal(result.truth,'true');assert.deepEqual(seen,[['a','other.instance','2'],['b','other.instance','2']]);assert.ok(result.trace.filter(e=>e.node.id==='c').every(e=>!Object.hasOwn(e.bindings,'outside')));
});
test('missing explicit ground bindings and absent snapshot contexts never reach semantic callbacks',()=>{
 let called=0;const callback=()=>{called++;return {truth:'true',evidence:[]};};assert.equal(evaluate(make(leaf()),{bindings:{},evaluateConstraint:callback}).reasons[0].reason,'missing-ground-binding');
 for(const value of [subject(),{context:{scope:'items',version:'1'},subject:subject()},{context:context('2'),subject:subject()}]){const result=evaluate(make(leaf()),{bindings:{t:value},evaluateConstraint:callback});assert.equal(result.ok,false);assert.equal(result.truth,'unknown');}assert.equal(called,0);
});
test('relation goals and same-value subjects also require explicit ground bindings',()=>{
 for(const operator of ['operator=relation relation=near goal=$other','operator=same value=$value']){const w=make(`@other std.request.target request=$r mode=existing kind=sample\n${operator.includes('same')?'@value std.request.value target=$other concept=quantity\n':''}${leaf().replace('operator=eq value=1',operator)}`);assert.equal(evaluate(w).truth,'unknown');assert.equal(evaluate(w,{bindings:{t:binding(),other:binding('two','2')}}).truth,'true');}
});
test('duplicate populations, conflicting versions and missing population context are unknown',()=>{
 const bad=[population([subject(),subject()]),population([subject(),subject('one','2')]),{complete:true,subjects:[subject()],evidence:[]},{...population(),context:{instanceId:'x',scope:'items',version:'2'},subjects:[subject()]}];
 for(const p of bad){const result=evaluate(quant(),{resolvePopulation:()=>p});assert.equal(result.truth,'unknown');assert.ok(result.unknownReasons.some(e=>e.reason==='invalid-population'));}
});
test('callback throws, malformed evidence, thenables and accessors fail honestly',()=>{
 let accessed=false;const hostile={truth:'true',get evidence(){accessed=true;return [];}};
 for(const callback of [()=>{throw Error('missing semantic provider');},()=>({truth:true,evidence:[]}),()=>({truth:'true'}),()=>Promise.resolve({truth:'true',evidence:[]}),()=>hostile])assert.equal(evaluate(make(leaf()),{evaluateConstraint:callback}).truth,'unknown');assert.equal(accessed,false);
});
test('budget/depth exhaustion and evidence explosions refuse the whole evaluation',()=>{
 const w=make(leaf());assert.equal(evaluate(w,{budget:1}).truth,'unknown');assert.ok(evaluate(w,{budget:1}).failures.some(e=>e.reason==='budget'));
 const n=make(`${leaf()}\n@n1 std.request.not request=$r of=$c\n@n2 std.request.not request=$r of=$n1`,'n2');assert.equal(evaluate(n,{maxDepth:1}).failures[0].reason,'depth-budget');assert.equal(evaluate(w,{evaluateConstraint:()=>({truth:'true',evidence:Array(10000).fill('evidence')})}).failures[0].reason,'budget');
});
test('schema and binder violations are refused before any callback',()=>{
 const w=make(leaf());w.get('c').attrs.unknown=['bad'];let called=false;const r=evaluate(w,{evaluateConstraint:()=>{called=true;return {truth:'true',evidence:[]};}});assert.equal(r.ok,false);assert.equal(r.failures[0].reason,'invalid-schema');assert.equal(called,false);
 const q=quant();q.get('c').attrs.target=['$missing'];assert.equal(evaluate(q,{resolvePopulation:()=>population([subject()])}).failures[0].reason,'invalid-request');
});
test('callback world mutation invalidates every result including mutation followed by undo',()=>{
 for(const undo of [false,true]){const w=make(leaf()),before=w.stamp;const result=evaluate(w,{evaluateConstraint:()=>{if(undo)w.trial(()=>w.load('@changed core.type of=toy.changed'));else w.load('@changed core.type of=toy.changed');return {truth:'true',evidence:[]};}});assert.equal(result.ok,false);assert.equal(result.truth,'unknown');assert.equal(result.failures[0].reason,'source-changed');if(undo)assert.equal(w.stamp,before);}
 const w=quant();assert.equal(evaluate(w,{resolvePopulation:()=>{w.load('@changed core.type of=toy.changed');return population();}}).failures[0].reason,'source-changed');
});
test('aliased request families use the same graph semantics without consumer names',()=>{
 const w=new World();w.load('@u core.use world=std.request as=toy.request');w.load(make(leaf()).ofType('std.request.source').map(w=>`@${w.id} toy.request.source text="invented"`).join('\n')+'\n@r toy.request act=inspect mood=check source=$s\n@t toy.request.target request=$r mode=existing kind=sample\n'+leaf().replace('std.request.constraint','toy.request.constraint'));assert.equal(evaluate(w,{family:'toy.request'}).truth,'true');
});

test('native numeric subject IDs retain type and cannot collapse into string IDs',()=>{
 const rows=[{...subject(),id:17},{...subject('two'),id:'17'}],seen=[];const result=evaluate(quant(),{resolvePopulation:()=>population(rows),evaluateConstraint:({bindings})=>{seen.push(bindings.b.subject.id);return {truth:'true',evidence:[]};}});assert.equal(result.truth,'true');assert.deepEqual(seen,[17,'17']);
 for(const id of [1.5,NaN,Infinity,9007199254740992])assert.equal(evaluate(make(leaf()),{bindings:{t:{context:context(),subject:{...subject(),id}}}}).truth,'unknown');
});
test('whole-world schema auditing consumes the same finite evaluation budget',()=>{
 const w=make(leaf());w.load('@toy.type core.type of=toy.extra\n'+Array.from({length:300},(_,i)=>`@extra${i} toy.extra value=${i}`).join('\n'));const stamp=w.stamp;let called=false;const result=evaluate(w,{budget:1000,evaluateConstraint:()=>{called=true;return {truth:'true',evidence:[]};}});assert.equal(result.truth,'unknown');assert.equal(result.failures[0].reason,'budget');assert.equal(called,false);assert.equal(w.stamp,stamp);assert.ok(result.steps<=1002);
});
