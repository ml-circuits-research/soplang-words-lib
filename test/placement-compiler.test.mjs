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

// An anchor inside a container the new subject's tool cannot make into (no containerKey: a node inside a diagram group)
// is measured by its observed box; the subject is made in the context's container, apart from that container's peers.
test('an anchor inside another container places a new subject in the context container',{skip},()=>{
  const w=fixture();w.revise('place',{search:'problem'});
  w.load(`@box.inner k.spatial2d.box entity="inner" ${context} evidence=rectangle min_x=300 min_y=40 max_x=340 max_y=50
  @id.inner std.placement.identity box=$box.inner source="source:inner" container="frame" concept=marker name="Inner"`);
  const {result,call}=outcome(w,request.replace('kind=marker mode=existing','kind=marker mode=existing name="Inner"'));
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.ok(Number(call.attrs.x[0])>=340||Number(call.attrs.x[0])+10<=300,'beside the inner marker '+call.attrs.x[0]);
});

// Fallbacks (std.placement.method fallback=, in the declared order) when no declared place on the stated side is
// feasible: an anchor at the page edge leaves no room on its left. The result names the fallback used.
const page='@page.box k.spatial2d.box entity="page" '+context+' evidence=rectangle min_x=0 min_y=0 max_x=300 max_y=200';
const leftRequest=request.replace('relation=near','relation=left').replace('container="page"','container="page" bounds=$page.box');
// The pinned spatial world declares near's four sides; "left of" (one side, at the near clearance) is declared here.
const leftOf=`@dir.left k.spatial2d.direction relation=left name=left anchor_x=0 anchor_y=0.5 subject_x=1 subject_y=0.5 gap_x=-1 gap_y=0 rank=0
@pol.left k.spatial2d.policy relation=left metric=near_distance profiled=true geometry=box_pair clearance=12 weight=1 hard=false`;
function edged(marker,fallback={},extra='') {
  const w=fixture();
  w.load(page+'\n'+leftOf+'\n'+extra);
  assert.ok(w.revise('place',{search:'problem',containRelation:'member_of',containEvidence:'containment',...fallback}).ok);
  const [x,y,wd,h]=marker; assert.ok(w.revise('box.marker',{min_x:x,min_y:y,max_x:x+wd,max_y:y+h}).ok);
  return w;
}
test('an anchor at the page edge: without a fallback the request is refused; shift keeps the stated side',{skip},()=>{
  const none=edged([0,90,40,20]);
  assert.equal(outcome(none,leftRequest).result.attrs.reason?.[0],'no-feasible-placement');
  const w=edged([0,90,40,20],{fallback:'shift'});
  const {result,call}=outcome(w,leftRequest);
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.equal(result.attrs.fallback[0],'shift');
  const x=Number(call.attrs.x[0]),y=Number(call.attrs.y[0]);
  assert.ok(x+5<20,'centre left of the marker centre '+x);
  assert.ok(x>=0&&y>=0&&x+10<=300&&y+10<=200,'on the page');
  assert.ok(y+10+12<=90||y>=110+12,'clear of the marker by the clearance '+y);
  assert.ok(Math.abs(y+5-100)<=40,'close to the marker '+y);
});
test('shrink draws a new subject smaller, within the declared minimum share, at the stated slot',{skip},()=>{
  const sized='@maker2 std.placement.tool act=make operation=example.put kindKey=form xKey=x yKey=y sizeKey=size originX=0 originY=0';
  const w=edged([30,90,40,20],{fallback:['shrink','shift'],minShare:0.6},sized);
  assert.ok(w.revise('tk',{binding:'$maker2',width:20,height:20}).ok);
  assert.ok(w.revise('ink',{binding:'$tk'}).ok);
  const {result,call}=outcome(w,leftRequest);
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.equal(result.attrs.fallback[0],'shrink');
  assert.equal(call.attrs.size[0],'18','the largest share that fits: 0.9 of 20');
  assert.equal(call.attrs.x[0],'0');
  // Below the declared minimum share nothing fits: the next fallback (shift) is used.
  const tight=edged([10,90,40,20],{fallback:['shrink','shift'],minShare:0.6},sized);
  assert.ok(tight.revise('tk',{binding:'$maker2',width:20,height:20}).ok);
  const shifted=outcome(tight,leftRequest);
  assert.equal(shifted.result.attrs.fallback?.[0],'shift',JSON.stringify(shifted.result.attrs));
  assert.equal(shifted.call.attrs.size,undefined);
});
test('side: the nearest free place on another declared side, in its declared rank',{skip},()=>{
  const w=edged([0,90,10,20],{fallback:['shift','side'],fallbackDirections:'near'});
  const {result,call,options}=outcome(w,leftRequest);
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.equal(result.attrs.fallback[0],'side');
  const chosen=options.find(o=>'$'+o.id===result.attrs.choice[0]);
  assert.equal(chosen.attrs.direction[0],'right');
  assert.equal(call.attrs.x[0],'22');
});
// A near subject minimises its distance: with a declared distance term (the domain's near_distance measurement), a
// slot a little short of a peer's clearance beats one pushed far away by the water the subject avoids.
test('a distance term keeps a near subject close when the alternatives are pushed far away',{skip},()=>{
  const scene=(distance)=>{
    const w=fixture();w.revise('place',{search:'problem'});w.revise('tk',{avoids:'water'});
    const water=[[60,30,30,40],[90,20,60,25],[90,65,60,25]];
    w.load(water.map(([x,y,wd,h],i)=>`@water.${i} std.placement.region entity="pond" kind=water ${context} min_x=${x} min_y=${y} max_x=${x+wd} max_y=${y+h}`).join('\n'));
    w.load(observed('other','block',160,50,10,10));
    if (distance) {
      w.load(`@far std.objective.evaluator normalisation=distance version=one
      @cost.far std.placement.cost evaluator=$far metric=near_distance
      @term.far std.objective.term evaluator=far normalisation=declared.by.evaluator weight=1 priority=0`);
      assert.ok(w.revise('choose',{term:['$term.clear','$term.area','$term.far','$term.order']}).ok);
    }
    const {result,options}=outcome(w);
    assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
    return options.find(o=>'$'+o.id===result.attrs.choice[0]).attrs.direction[0];
  };
  assert.notEqual(scene(false),'right','without a distance term the far, uncrowded slot wins');
  assert.equal(scene(true),'right');
});
