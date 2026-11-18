import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {bookExampleWorld} from '../tools/audit-book-examples.mjs';
import {World,parse,str} from '../tools/lib-under-test.mjs';
import {decodeCapabilityCall} from '../src/internal/capability-call.mjs';

function fixture(){
 const world=new World();
 world.load(`
@cap core.use world=std.capability
@comparison core.use world=std.interpret
@left std.capability.scope instance="left" version="3"
@right std.capability.scope instance="right" version="3"
@make std.capability.mode act=make target=new
@left.make std.capability.operation scope=$left name="frame.stamp" act=make on="frame" order=0 eligible=true
@right.make std.capability.operation scope=$right name="frame.cast" act=make on="frame" order=0 eligible=true
@left.width std.capability.parameter operation=$left.make name="width" kind=number min=1 max=100
@left.height std.capability.parameter operation=$left.make name="height" kind=number min=1 max=100
@right.width std.capability.parameter operation=$right.make name="width" kind=number min=1 max=100
@right.height std.capability.parameter operation=$right.make name="height" kind=number min=1 max=100
@left.round std.capability.target scope=$left canonical=toy.round label="round" operation=$left.make
@left.square std.capability.target scope=$left canonical=toy.square label="square" operation=$left.make
@right.round std.capability.target scope=$right canonical=toy.round label="round" operation=$right.make
@left.measure std.capability.property scope=$left concept=width on="frame" parameter="width" order=0
@right.measure std.capability.property scope=$right concept=width on="frame" parameter="width" order=0
@left.default.width std.capability.seed scope=$left kind=toy.round source=value phase=missing parameter="width" value=11 order=0 replace=true
@left.default.height.bad std.capability.seed scope=$left kind=toy.round source=value phase=missing parameter="height" value=200 order=1 required=true
@left.default.height std.capability.seed scope=$left kind=toy.round source=value phase=missing parameter="height" value=12 order=2 notice="Height from observation: {value}."
@left.square.height std.capability.seed scope=$left kind=toy.square source=value phase=missing parameter="height" value=18 order=2
@estimate.type core.type of=toy.estimate closed=true
@estimate.height core.slot of=toy.estimate key=height kind=number present=true
@estimate.scope core.slot of=toy.estimate key=scope type=std.capability.scope present=true
@measure.right toy.estimate height=22 scope=$right
@estimate toy.estimate height=?height scope=?scope
@right.round.height std.capability.seed scope=?scope kind=toy.round source=value phase=missing parameter="height" value=?height order=2
@derive.right core.rule when=$estimate then=$right.round.height
@left.early std.capability.seed scope=$left kind=toy.round source=value phase=initial parameter="height" value=14 order=1
`);
 return world;
}
function request({prefix='r',scope='left',kind='toy.round',width,operator='eq'}={}){
 return [
  `@${prefix}.s std.request.source text="Make a frame"`,
  `@${prefix} std.request act=make mood=do source=$${prefix}.s`,
  `@${prefix}.t std.request.target request=$${prefix} mode=new kind=${kind}`,
  ...(width===undefined?[]:[`@${prefix}.w std.request.constraint request=$${prefix} target=$${prefix}.t concept=width operator=${operator} value=${width} polarity=positive character=requirement`]),
  `@${prefix}.ctx std.capability.context request=$${prefix} scope=$${scope}`,
 ];
}
function compile(world,requestSop){
 const sop=world.compileRequest(requestSop),rows=parse(sop);
 const result=rows.find(row=>row.type==='std.capability.result');
 assert.equal(result?.attrs.status[0],'compiled',sop);
 const {operation,args}=decodeCapabilityCall(parse(world.compileToolInput(sop)));
 return {call:{operation,args},result,rows};
}
test('optional inferred dimensions respect explicit and unresolved siblings and retain the applied seed',()=>{
 const world=fixture(),run=opts=>compile(world,request(opts).join('\n'));
 const inferred=run();
 assert.deepEqual(inferred.call.args,{width:11,height:12});
 assert.ok(inferred.result.attrs.support.map(str).includes('left.default.height'));
 assert.ok(!inferred.result.attrs.support.map(str).includes('left.default.height.bad'));
 assert.deepEqual(inferred.result.attrs.note.map(str),['Height from observation: 12.']);
 assert.deepEqual(run({width:9}).call.args,{width:9,height:12});
 const partiallyBound=run({width:200});
 assert.deepEqual(partiallyBound.call.args,{height:12});
 assert.deepEqual(partiallyBound.result.attrs.skipped.map(str),['width 200']);
 assert.deepEqual(run({width:9,operator:'less.equal'}).call.args,{height:12});
 assert.deepEqual(run({kind:'toy.square'}).call.args,{height:18});
 assert.deepEqual(run({scope:'right'}).call,{operation:'frame.cast',args:{height:22}});
});
test('alternative calls use their own scope and candidate kind with no inferred value leaking into the winner',()=>{
 const world=fixture();
 const input=[];
 for(const opts of [{prefix:'a',width:200},{prefix:'b',scope:'right',width:8}]){
  const rows=request(opts);
  input.push(...rows,`@${opts.prefix}.option std.interpret.proposal request=$${opts.prefix} `+
   parse(rows.join('\n')).map(row=>'member=$'+row.id).join(' '));
 }
 input.push('@compare std.interpret.input proposal=$a.option proposal=$b.option');
 const result=compile(world,input.join('\n'));
 assert.deepEqual(result.call,{operation:'frame.cast',args:{width:8,height:22}});
 const applied=result.result.attrs.support.map(str).find(id=>world.get(id)?.type==='std.capability.seed');
 assert.ok(world.why(applied).steps.some(step=>step.id==='measure.right'));
 assert.ok(!result.result.attrs.support.map(str).includes('left.default.height'));
 assert.equal(result.rows.filter(row=>row.type==='std.interpret.reading').length,2);
});


test('the book frame example preserves the stated width and supports its inferred height',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const world=bookExampleWorld(text,'frame-defaults.instance',{WorldClass:World});
 const query=request({scope:'frame.scope',width:9});
 const inferred=compile(world,query.join('\n'));
 assert.deepEqual(inferred.call,{operation:'frame.make',args:{width:9,height:12}});
 assert.ok(inferred.result.attrs.support.map(str).includes('frame.height.default'));
 const explicit=compile(world,query.join('\n')+
  '\n@r.h std.request.constraint request=$r target=$r.t concept=height operator=eq value=7 polarity=positive character=requirement');
 assert.deepEqual(explicit.call.args,{width:9,height:7});
});

test('competing readings use only the measurements for their own admitted arguments', () => {
 const world = fixture();
 world.load(`
@left.count std.capability.parameter operation=$left.make name="count" kind=integer min=1 max=3 default=1
@left.x std.capability.parameter operation=$left.make name="x" kind=number min=0 max=100 default=2
@left.y std.capability.parameter operation=$left.make name="y" kind=number min=0 max=100
@left.marker std.capability.parameter operation=$left.make name="marker" kind=number
@left.count.property std.capability.property scope=$left concept=count on="frame" parameter="count" order=0
@left.x.property std.capability.property scope=$left concept=x on="frame" parameter="x" order=0
@one std.capability.arg name="count" value=1
@three std.capability.arg name="count" value=3
@inferred.x std.capability.arg name="x" value=18
@measurement.type core.type of=toy.measurement closed=true
@measurement.arg core.slot of=toy.measurement key=argument kind=ref to=std.capability.arg
@measurement.x core.slot of=toy.measurement key=x kind=number
@measurement.y core.slot of=toy.measurement key=y kind=number
@single.measurement toy.measurement argument=$one x=18 y=25
@triple.measurement toy.measurement argument=$three x=66 y=71
@measurement toy.measurement argument=?argument x=?x y=?y
@x.seed std.capability.seed scope=$left kind=toy.round operation="frame.stamp" source=value phase=missing parameter="x" value=?x whenArgument=?argument order=0
@y.seed std.capability.seed scope=$left kind=toy.round operation="frame.stamp" source=value phase=missing parameter="y" value=?y whenArgument=?argument order=0
@derive.measurement core.rule when=$measurement then=$x.seed then=$y.seed
@chained std.capability.seed phase=missing source=value parameter="marker" value=99 whenArgument=$inferred.x order=1
`);
 const graph = (id, count, x) => [
  ...request({prefix:id}),
  ...(count === undefined ? [] : [`@${id}.count std.request.constraint request=$${id} target=$${id}.t concept=count operator=eq value=${count} polarity=positive character=requirement`]),
  ...(x === undefined ? [] : [`@${id}.x std.request.constraint request=$${id} target=$${id}.t concept=x operator=eq value=${x} polarity=positive character=requirement`]),
 ];
 const proposal = (id, rows) => [...rows,
  `@${id}.option std.interpret.proposal request=$${id} ` + parse(rows.join('\n')).map(row => 'member=$' + row.id).join(' ')];
 const one = proposal('single',graph('single',1));
 const three = proposal('triple',graph('triple',3));
 for (const [first, second, id, alternative, measurement, args, rejected] of [
  [one, three, 'single', 'triple', 'single.measurement', { count:1, x:18, y:25 }, 'three'],
  [three, one, 'triple', 'single', 'triple.measurement', { count:3, x:66, y:71 }, 'one'],
 ]) {
  const chosen = compile(world,[...first,...second,`@compare.counts std.interpret.input proposal=$${id}.option proposal=$${alternative}.option`].join('\n'));
  assert.deepEqual(chosen.call,{operation:'frame.stamp',args:{ width:11,height:12,...args }});
  assert.deepEqual(chosen.rows.filter(row => row.type==='std.interpret.reading').map(row => row.attrs.status[0]),['compiled','compiled']);
  const interpretation = chosen.rows.find(row => row.type==='std.interpret.result');
  assert.equal(str(chosen.rows.find(row => '$'+row.id===interpretation.attrs.choice[0]).attrs.request[0]),id);
  const support = chosen.result.attrs.support.map(str);
  assert.ok(!support.includes(rejected));
  assert.doesNotMatch(support.join(' '),/chained/);
  const measuredSeeds = support.filter(id => world.get(id)?.attrs.whenArgument);
  assert.equal(measuredSeeds.length,2);
  assert.ok(measuredSeeds.every(seed => world.why(seed).steps.some(step => step.id===measurement)));
 }

 const run = (count, x) => compile(world,graph('check',count,x).join('\n')).call.args;
 assert.deepEqual(run(undefined),{ width:11,height:12,count:1,x:18,y:25 });
 assert.deepEqual(run(3,4),{ width:11,height:12,count:3,x:4,y:71 });
 assert.deepEqual(run(2),{ width:11,height:12,count:2,x:2 });
 assert.deepEqual(run(9),{ width:11,height:12,count:1,x:2 });
 assert.deepEqual(run(3,999),{ width:11,height:12,count:3,x:2,y:71 });
});
