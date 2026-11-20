import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,parse} from '../tools/lib-under-test.mjs';
import {worldsDir} from '../tools/worlds.mjs';

const dir=worldsDir();
const skip=!dir && 'pinned spatial world unavailable offline';
const context='instance="sheet" revision="1" frame="page" scope="objects"';
const request=`@s std.request.source text="place a new token by the marker"
@r std.request act=make mood=do source=$s
@new std.request.target request=$r kind=token mode=new
@existing std.request.target request=$r kind=marker mode=existing
@where std.request.constraint request=$r target=$new concept=place operator=relation relation=near goal=$existing polarity=positive character=requirement
@here std.placement.context request=$r ${context} container="page"`;
function observed(id,kind,x,y,w,h) {
  return `@box.${id} k.spatial2d.box entity="${id}" ${context} evidence=rectangle min_x=${x} min_y=${y} max_x=${x+w} max_y=${y+h}
  @id.${id} std.placement.identity box=$box.${id} source="source:${id}" container="page" peer=true concept=${kind}`;
}
function fixture() {
  const path=dir+'docs/worlds/k.spatial2d/';
  const world=new World({library:{'k.spatial2d':readFileSync(path+'schema.sop','utf8')}});
  world.load('@std core.use world=std.placement\n@space core.use world=k.spatial2d prefix=false');
  world.load(readFileSync(path+'shards/policies.sop','utf8'));
  world.load(`@place std.placement.method directionType=k.spatial2d.direction boxType=k.spatial2d.box relationType=k.spatial2d.relation policyType=k.spatial2d.policy effectiveType=k.spatial2d.effective_policy measurementType=k.spatial2d.measurement peerRelation=independent_peer gapMetric=near_distance objective=$choose
  @clear std.objective.evaluator normalisation=distance version=one
  @area std.objective.evaluator normalisation=area version=one
  @order std.objective.evaluator normalisation=ordinal version=one
  @cost.clear std.placement.cost evaluator=$clear metric=clearance_deficit
  @cost.area std.placement.cost evaluator=$area metric=overlap_area
  @cost.order std.placement.cost evaluator=$order metric=rank
  @term.clear std.objective.term evaluator=clear normalisation=declared.by.evaluator weight=1 priority=0
  @term.area std.objective.term evaluator=area normalisation=declared.by.evaluator weight=1 priority=0
  @term.order std.objective.term evaluator=order normalisation=declared.by.evaluator weight=1 priority=1
  @choose std.objective order=lexicographic direction=minimise term=$term.clear term=$term.area term=$term.order
  @maker std.placement.tool act=make operation=example.put kindKey=form xKey=x yKey=y originX=0 originY=0
  @tk std.placement.kind concept=token native=dot binding=$maker width=10 height=10
  @ink std.placement.argument binding=$tk key=ink value="green"`);
  world.load(observed('marker','marker',100,50,40,10));
  return world;
}
function outcome(world,sop=request) {
  const rows=parse(world.compileRequest(sop)), result=rows[0];
  return {result,call:rows.find(w=>'$'+w.id===result.attrs.call?.[0]),options:rows.filter(w=>w.type==='std.placement.option')};
}
test('an authored relation compiles from a live anchor, changes after a manual move, and avoids a new peer',{skip},()=>{
  const w=fixture(), first=outcome(w);
  assert.equal(first.result.attrs.status[0],'compiled',JSON.stringify(first.result));
  assert.deepEqual(first.call.attrs,{ink:['"green"'],x:['152'],y:['50'],form:['"dot"']});
  assert.equal(first.options.length,4);
  assert.equal(w.has('placement.proposed.box'),false);
  assert.ok(w.revise('box.marker',{min_x:160,max_x:200}).ok);
  assert.equal(outcome(w).call.attrs.x[0],'212');
  w.load(observed('other','block',212,50,10,10));
  const second=outcome(w);
  assert.equal(second.call.attrs.x[0],'138');
  assert.equal(second.options.find(o=>o.attrs.direction[0]==='right').attrs.cost[0]>0,true);
  assert.equal(w.has('r'),false);
});
test('unknown requirements and stale instance context cannot produce a spatial instruction',{skip},()=>{
  const w=fixture();
  assert.equal(outcome(w,request+'\n@extra std.request.constraint request=$r target=$new concept=tint operator=eq value=red polarity=positive character=requirement').call,undefined);
  assert.equal(outcome(w,request.replace('revision="1"','revision="0"')).call,undefined);
  assert.equal(outcome(w,request+'\n@fake std.placement.argument binding=$tk key=ink value="red"').call,undefined);
});
test('tutorial worlds supply a tree extent, colour and bottom-aligned 20-unit clearance',{skip},()=>{
  const w=fixture();
  w.load(observed('h1','house',400,200,120,120));
  w.load('@treeKind std.placement.kind binding=$maker concept=tree native=tree width=60 height=100\n@leaf std.placement.argument binding=$treeKind key=ink value="#228B22"');
  assert.ok(w.revise('k.spatial2d.direction.right',{anchor_y:1,subject_y:1}).ok);
  assert.ok(w.revise('k.spatial2d.policy.near','clearance',20).ok);
  const treeRequest=request.replace('kind=token','kind=tree').replace('kind=marker','kind=house');
  const {call}=outcome(w,treeRequest);
  assert.deepEqual(call.attrs,{form:['"tree"'],x:['540'],y:['220'],ink:['"#228B22"']});
  const circuit=parse(w.compileRequest(treeRequest));
  const choice=circuit.find(wire=>'$'+wire.id===circuit[0].attrs.choice[0]);
  assert.deepEqual([choice.attrs.maxX[0],choice.attrs.maxY[0]],['600','320']);
  assert.ok(choice.attrs.evidence.every(ref=>circuit.some(row=>'$'+row.id===ref&&row.type==='k.spatial2d.measurement')));
});
// search=problem: one relation with declared directions keeps its ranked directions and clearance; each direction's
// place is solved as a std.problem (here by the internal search), the subject moving along the anchor's side to keep
// apart from a peer, and the result names the provider.
test('search=problem solves each declared direction as its own problem and slides along the side past a peer',{skip},async()=>{
  const searched=()=>{const w=fixture();w.revise('place',{search:'problem'});return w;};
  const w=searched(), first=outcome(w);
  assert.equal(first.result.attrs.status[0],'compiled',JSON.stringify(first.result));
  assert.equal(first.result.attrs.provider[0],'internal');
  assert.deepEqual(first.call.attrs,{ink:['"green"'],x:['152'],y:['50'],form:['"dot"']},'unobstructed: exactly the declared slot');
  assert.equal(first.options.length,4);
  assert.ok(w.revise('box.marker',{min_x:160,max_x:200}).ok);
  w.load(observed('other','block',212,50,10,10));
  const blocked=outcome(w);
  assert.equal(blocked.call.attrs.x[0],'138','a short side leaves no room past the peer: the other side');
  // A tall marker: the token stays on the preferred side and moves down it, clear of the peer.
  const tall=searched();
  assert.ok(tall.revise('box.marker',{max_y:150}).ok);
  tall.load(observed('other','block',152,95,10,10));
  const slid=outcome(tall), y=Number(slid.call.attrs.y[0]);
  assert.equal(slid.call.attrs.x[0],'152');
  assert.ok(y+10<=95||y>=105,'apart from the peer '+y);
  assert.ok(y>=50-5&&y<=150-5,'beside the marker '+y);
});

// std.placement.kind avoids= with one relation (search=problem): every declared slot by the marker lies in a moat the
// token keeps out of; each direction's problem may move the token further out along its direction (a soft pull back
// to the slot), so it lands off the water instead of every direction being rejected (avoided-region).
test('a single relation steers each slot out of the regions the subject avoids',{skip},()=>{
  const w=fixture();w.revise('place',{search:'problem'});
  w.revise('tk',{avoids:'water'});
  const moat=[[85,35,15,40],[140,35,15,40],[85,35,70,15],[85,60,70,15]];
  w.load(moat.map(([x,y,wd,h],i)=>`@moat.${i} std.placement.region entity="moat" kind=water ${context} min_x=${x} min_y=${y} max_x=${x+wd} max_y=${y+h}`).join('\n'));
  const {result,call,options}=outcome(w);
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs)+JSON.stringify(options.map(o=>o.attrs)));
  const x=Number(call.attrs.x[0]),y=Number(call.attrs.y[0]);
  assert.ok(!moat.some(([mx,my,mw,mh])=>x<mx+mw&&mx<x+10&&y<my+mh&&my<y+10),'off the water '+x+','+y);
});

// A native kind named by several words ("shooting star") is a string, passed to the tool as written.
test('a native kind of several words places like a one-word kind',{skip},()=>{
  const w=fixture();
  w.load('@star std.placement.kind concept=shooting.star native="shooting star" binding=$maker width=10 height=10');
  const {result,call}=outcome(w,request.replace('kind=token','kind=shooting.star'));
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.equal(call.attrs.form[0],'"shooting star"');
});
