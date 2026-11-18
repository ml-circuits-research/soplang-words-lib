import test from 'node:test';
import assert from 'node:assert/strict';

const bundle=process.env.SOPWORLD_BUNDLE==='1';
const {World,parse}=await import(bundle?'../docs/sopworld.mjs':'../src/index.mjs');
const policy=`
@import core.use world=std.choice
@order core.use world=std.decide
@rule.hard std.decide.criterion of=dispatch n=1 name=feasible measure=blocked dir=hard
@rule.first std.decide.criterion of=dispatch n=2 name=distance measure=distance dir=min
@rule.second std.decide.criterion of=dispatch n=3 name=priority measure=priority dir=max
`;
const packet=options=>`@q std.choice.request policy=dispatch ${options.map((_,i)=>'option=$o'+i).join(' ')}
`+options.map(([blocked,distance,priority],i)=>`@o${i} std.choice.option measurement=$b${i} measurement=$d${i} measurement=$p${i}
@b${i} std.choice.measurement metric=blocked value=${blocked}
@d${i} std.choice.measurement metric=distance value=${distance}
@p${i} std.choice.measurement metric=priority value=${priority}`).join('\n');
function setup(){
 const world=new World();
 assert.equal(world.tell(policy).ok,true);
 return world;
}
test('SOP choice applies trusted hard exclusions and declared lexicographic measures with stable ties',()=>{
 const world=setup(),before=world.toJSON();
 const input=packet([[0,3,4],[1,0,9],[0,2,8],[0,2,8],[0,2,4]]);
 const resultText=world.compileRequest(input),[result,...assessments]=parse(resultText);
 assert.deepEqual(result.attrs,{request:['$q'],status:['selected'],option:['$o2'],alternative:['$o3','$o4','$o0'],
  tie:['$o3'],assessment:assessments.map(row=>'$'+row.id)});
 assert.deepEqual(assessments.map(row=>[row.attrs.option[0],row.attrs.status[0],row.attrs.criterion?.[0]]),[
  ['$o2','selected',undefined],['$o3','available',undefined],['$o4','available','priority'],
  ['$o0','available','distance'],['$o1','denied','feasible'],
 ]);
 assert.equal(world.fork().tell(input+'\n'+resultText,{factsOnly:true}).ok,true);
 assert.deepEqual(world.toJSON(),before);
});
test('choice rejects unowned, missing, duplicate and invalid observations without choosing a candidate',()=>{
 const world=setup(),valid=packet([[0,1,2]]);
 const cases=[
  [valid.replace('value=1','value=Infinity'),'invalid-choice-measurement'],
  [valid.replace('metric=priority','metric=distance'),'invalid-choice-measurement'],
  [valid.replace('measurement=$p0',''),'invalid-choice-option'],
  [valid.replace('option=$o0','option=$o0 option=$o0'),'invalid-choice-option'],
  [valid+'\n@x core.type of=rogue','unowned-choice-wire'],
  [valid.replace('policy=dispatch','policy=missing'),'choice-policy'],
 ];
 for(const [text,reason] of cases)assert.equal(parse(world.compileRequest(text))[0].attrs.reason?.[0],reason);
 assert.equal(parse(world.compileRequest(packet([])))[0].attrs.reason[0],'no-candidates');
 const none=parse(world.compileRequest(packet([[1,0,9],[2,4,2]])));
 assert.equal(none[0].attrs.reason[0],'hard-exclusion');
 assert.ok(none.slice(1).every(row=>row.attrs.status[0]==='denied'));
});
