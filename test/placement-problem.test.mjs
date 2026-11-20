// Placement through std.problem: several relations and the observed peers solved together, with the
// relation-to-predicate mapping declared by the method, never by code.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {World,parse} from '../tools/lib-under-test.mjs';
import {worldsDir} from '../tools/worlds.mjs';

const dir=worldsDir();
const skip=!dir && 'pinned spatial world unavailable offline';
const z3Path=new URL('../experiments/node_modules/z3-solver/build/node.js',import.meta.url);
const provider=existsSync(z3Path)?await (await import('../node/smt-z3.mjs')).z3Provider({module:createRequire(import.meta.url)(z3Path.pathname)}):null;
const context='instance="scene" revision="1" frame="page" scope="objects"';
function observed(id,kind,x,y,w,h) {
  return `@box.${id} k.spatial2d.box entity="${id}" ${context} evidence=rectangle min_x=${x} min_y=${y} max_x=${x+w} max_y=${y+h}
  @id.${id} std.placement.identity box=$box.${id} source="source:${id}" container="page" peer=true concept=${kind}`;
}
// An invented scene: a lake, a tree and a rock on an 800 x 600 page; a new 100 x 80 house to place.
function fixture(relax='') {
  const path=dir+'docs/worlds/k.spatial2d/';
  const world=new World({library:{'k.spatial2d':readFileSync(path+'schema.sop','utf8')}});
  world.load('@std core.use world=std.placement\n@space core.use world=k.spatial2d prefix=false');
  world.load(readFileSync(path+'shards/policies.sop','utf8'));
  world.load(`@place std.placement.method directionType=k.spatial2d.direction boxType=k.spatial2d.box relationType=k.spatial2d.relation policyType=k.spatial2d.policy effectiveType=k.spatial2d.effective_policy measurementType=k.spatial2d.measurement peerRelation=independent_peer gapMetric=near_distance containRelation=member_of objective=$choose search=problem grid=10${relax}
  @near std.placement.predicate method=$place relation=near predicate=near gap=40
  @left std.placement.predicate method=$place relation=left predicate=left gap=60
  @peer std.placement.predicate method=$place relation=independent_peer predicate=apart gap=12
  @contain std.placement.predicate method=$place relation=member_of predicate=inside
  @order std.objective.evaluator normalisation=ordinal version=one
  @term.order std.objective.term evaluator=order normalisation=declared.by.evaluator weight=1 priority=0
  @choose std.objective order=lexicographic direction=minimise term=$term.order
  @maker std.placement.tool act=make operation=example.draw kindKey=kind xKey=x yKey=y originX=0 originY=0
  @house std.placement.kind concept=house native=house binding=$maker width=100 height=80
  @page.box k.spatial2d.box entity="page" ${context} evidence=rectangle min_x=0 min_y=0 max_x=800 max_y=600`);
  world.load(observed('lake','lake',300,380,260,140)+'\n'+observed('tree','tree',620,330,60,120)+'\n'+observed('rock','rock',420,300,40,40));
  return world;
}
const request=(relations)=>`@s std.request.source text="add a house"
@r std.request act=make mood=do source=$s
@t.house std.request.target request=$r kind=house mode=new
@t.lake std.request.target request=$r kind=lake mode=existing
@t.tree std.request.target request=$r kind=tree mode=existing
${relations}
@here std.placement.context request=$r ${context} container="page" bounds=$page.box`;
const nearLake='@c1 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=near goal=$t.lake polarity=positive character=requirement';
const leftOfTree='@c2 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=left goal=$t.tree polarity=positive character=requirement';
const read=(text)=>{const rows=parse(text),result=rows[0];return {result,call:rows.find(w=>(result.attrs.call??[]).includes('$'+w.id))};};
const box=(call)=>({x:Number(call.attrs.x[0]),y:Number(call.attrs.y[0]),w:100,h:80});
const overlaps=(p,q)=>p.x<q.x+q.w&&q.x<p.x+p.w&&p.y<q.y+q.h&&q.y<p.y+p.h;
function check(call) {
  const h=box(call),lake={x:300,y:380,w:260,h:140},tree={x:620,y:330,w:60,h:120},rock={x:420,y:300,w:40,h:40};
  const gx=h.x+h.w<=lake.x?lake.x-(h.x+h.w):lake.x+lake.w<=h.x?h.x-(lake.x+lake.w):0, gy=h.y+h.h<=lake.y?lake.y-(h.y+h.h):lake.y+lake.h<=h.y?h.y-(lake.y+lake.h):0;
  assert.ok(!overlaps(h,lake)&&gx<=40&&gy<=40,'near the lake '+JSON.stringify(h));
  assert.ok(h.x+h.w<=tree.x&&tree.x-(h.x+h.w)<=60,'left of the tree '+JSON.stringify(h));
  assert.ok(!overlaps(h,rock),'off the rock');
  assert.ok(h.x>=0&&h.y>=0&&h.x+h.w<=800&&h.y+h.h<=600,'on the page');
}
test('"add a house next to the lake, left of the tree" places it with both relations, off the rock and on the page',{skip},()=>{
  const {result,call}=read(fixture().compileRequest(request(nearLake+'\n'+leftOfTree)));
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.equal(call.type,'example.draw');assert.equal(call.attrs.kind[0],'"house"');
  check(call);
});
test('Z3 compiles the same request and proves an impossible one with the conflicting relations named',{skip:skip||(provider?false:'z3-solver unavailable')},async()=>{
  const w=fixture(),solved=read(await w.compileRequest(request(nearLake+'\n'+leftOfTree),{provider}));
  assert.equal(solved.result.attrs.status[0],'compiled');assert.equal(solved.result.attrs.provider[0],'z3');check(solved.call);
  const farLeft='@c3 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=left goal=$t.lake polarity=positive character=requirement';
  const impossible=read(await w.compileRequest(request(leftOfTree.replace('@c2','@c2')+'\n'+farLeft+'\n'+nearLake.replace('relation=near goal=$t.lake','relation=near goal=$t.tree')),{provider}));
  assert.equal(impossible.result.attrs.status[0],'unavailable');
  assert.equal(impossible.result.attrs.reason[0],'search-unsatisfiable');
  assert.ok((impossible.result.attrs.conflict??[]).length>=2,JSON.stringify(impossible.result.attrs));
});
// A wide house cannot be within 40 of the lake and within 60 of a far tree at once: the declared problem has no
// grid point. A method declared relax=gap keeps both relations' direction and separation hard, makes their
// distances soft, places the house as close as the scene allows and names the relation it could not keep close.
const farTree=(w)=>{w.load(observed('pine','pine',770,330,30,120));return w;};
const leftOfPine='@c2 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=left goal=$t.pine polarity=positive character=requirement';
const pineRequest=(relations)=>request(relations).replace('@t.tree std.request.target request=$r kind=tree mode=existing','@t.pine std.request.target request=$r kind=pine mode=existing');
for (const [label,run] of [['internal search',(w,t)=>w.compileRequest(t)],['Z3',(w,t)=>w.compileRequest(t,{provider})]]) {
  test('relax=gap places a request whose declared distances no placement keeps, and names what it relaxed ('+label+')',{skip:skip||(label==='Z3'&&!provider&&'z3-solver unavailable')},async()=>{
    const strict=read(await run(farTree(fixture()),pineRequest(nearLake+'\n'+leftOfPine)));
    assert.equal(strict.result.attrs.status[0],'unavailable','without relax the declared distances are hard');
    const {result,call}=read(await run(farTree(fixture(' relax=gap')),pineRequest(nearLake+'\n'+leftOfPine)));
    assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
    const h=box(call),lake={x:300,y:380,w:260,h:140},pine={x:770,y:330,w:30,h:120};
    assert.ok(!overlaps(h,lake),'off the lake '+JSON.stringify(h));
    assert.ok(h.x+h.w<=pine.x,'still left of the pine '+JSON.stringify(h));
    assert.ok(result.attrs.relaxed?.length>=1,'names the relaxed relation '+JSON.stringify(result.attrs));
    const kept=read(await run(fixture(' relax=gap'),request(nearLake+'\n'+leftOfTree)));
    assert.equal(kept.result.attrs.relaxed,undefined,'a feasible request is not relaxed');check(kept.call);
  });
}
// "The tree" with two trees: each candidate anchor is its own problem. The tree the house can be next to the lake
// and left of wins; the farther one stays a ranked alternative (relaxed); more combinations than the cap are refused.
test('a goal that denotes several things is solved for each, the best kept and the others ranked',{skip},()=>{
  const world=fixture(' relax=gap');world.load(observed('pine','tree',770,330,30,120));
  const rows=parse(world.compileRequest(request(nearLake+'\n'+leftOfTree))),result=rows[0];
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  const option=id=>rows.find(w=>'$'+w.id===id),choice=option(result.attrs.choice[0]);
  assert.equal(choice.attrs.anchor[0],'"tree"','the tree that keeps both distances');
  assert.equal(result.attrs.relaxed,undefined);
  check(rows.find(w=>(result.attrs.call??[]).includes('$'+w.id)));
  const others=(result.attrs.alternative??[]).map(option).filter(o=>o!==choice);
  assert.deepEqual(others.map(o=>[o.attrs.anchor[0],o.attrs.status[0]]),[['"pine"','relaxed']]);
  const crowded=fixture(' relax=gap');for(let n=0;n<17;n++)crowded.load(observed('t'+n,'tree',20*n,20,10,10));
  assert.equal(read(crowded.compileRequest(request(nearLake+'\n'+leftOfTree))).result.attrs.reason[0],'ambiguous-anchor');
});
test('an undeclared relation is refused before any search',{skip},()=>{
  const {result}=read(fixture().compileRequest(request(nearLake.replace('relation=near','relation=orbiting'))));
  assert.equal(result.attrs.reason[0],'undeclared-relation');
});

// Alignment, regions and fitting, declared per relation: a house right of the tree keeps the tree's ground line;
// a boat in the lake goes into the lake's water region and is drawn smaller to fit; a cup on the table rests on its
// surface region. The result names the geometry each subject is given, so the caller can check it after the call.
function declaredFixture() {
  const world=fixture();
  world.load(`@right std.placement.predicate method=$place relation=right predicate=right gap=60 align=y edge=1 alignWeight=0.2
  @in.water std.placement.predicate method=$place relation=in predicate=inside region=water held=true fit=0.6
  @in std.placement.predicate method=$place relation=in predicate=inside fit=0.6
  @on.surface std.placement.predicate method=$place relation=on predicate=on region=surface gap=4 share=0 align=x alignWeight=0.2
  @on std.placement.predicate method=$place relation=on predicate=on
  @sizer std.placement.tool act=make operation=example.paint kindKey=kind xKey=x yKey=y sizeKey=size originX=0 originY=0
  @boat std.placement.kind concept=boat native=boat binding=$sizer width=160 height=160
  @cup std.placement.kind concept=cup native=cup binding=$sizer width=40 height=40
  @water std.placement.region entity="lake" kind=water ${context} min_x=310 min_y=410 max_x=550 max_y=490 holds="boat" holds="fish"
  @table.top std.placement.region entity="table" kind=surface ${context} min_x=105 min_y=420 max_x=245 max_y=420`);
  world.load(observed('table','table',100,380,150,120));
  return world;
}
const ask=(subject,relation,anchor)=>`@s std.request.source text="add"
@r std.request act=make mood=do source=$s
@t.new std.request.target request=$r kind=${subject} mode=new
@t.anchor std.request.target request=$r kind=${anchor} mode=existing
@c std.request.constraint request=$r target=$t.new concept=place operator=relation relation=${relation} goal=$t.anchor polarity=positive character=requirement
@here std.placement.context request=$r ${context} container="page" bounds=$page.box`;
function placed(text) {
  const rows=parse(text),result=rows[0],call=rows.find(w=>(result.attrs.call??[]).includes('$'+w.id));
  const option=rows.find(w=>'$'+w.id===result.attrs.choice?.[0]),n=(w,k)=>Number(w.attrs[k][0]);
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  assert.ok(option,'the result names the chosen geometry');
  const size=call.attrs.size?n(call,'size'):undefined,bounds={x0:n(option,'minX'),y0:n(option,'minY'),x1:n(option,'maxX'),y1:n(option,'maxY')};
  assert.equal(bounds.x0,n(call,'x'));assert.equal(bounds.y0,n(call,'y'));
  return {call,size,bounds};
}
for (const [label,run] of [['internal search',(w,t)=>w.compileRequest(t)],['Z3',(w,t)=>w.compileRequest(t,{provider})]]) {
  const skipZ3=label==='Z3'&&!provider&&'z3-solver unavailable';
  test('declared alignment, regions and fitting ('+label+')',{skip:skip||skipZ3},async()=>{
    const beside=placed(await run(declaredFixture(),request('@c2 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=right goal=$t.tree polarity=positive character=requirement')));
    assert.ok(beside.bounds.x0>=680&&beside.bounds.x0<=740,'right of the tree '+JSON.stringify(beside.bounds));
    assert.equal(beside.bounds.y1,450,'on the ground line of the tree');
    const boat=placed(await run(declaredFixture(),ask('boat','in','lake')));
    assert.equal(boat.size,48,'drawn at 0.6 of the water height');
    assert.ok(boat.bounds.x0>=310&&boat.bounds.x1<=550&&boat.bounds.y0>=410&&boat.bounds.y1<=490,'in the water '+JSON.stringify(boat.bounds));
    const cup=placed(await run(declaredFixture(),ask('cup','on','table')));
    assert.equal(cup.size,undefined,'a cup that fits keeps its own size');
    assert.ok(cup.bounds.y1>=420&&cup.bounds.y1<=424,'resting on the table surface '+JSON.stringify(cup.bounds));
    assert.ok(Math.abs((cup.bounds.x0+cup.bounds.x1)/2-175)<=5,'centred on the surface, within half a grid step');
  });
}

// pull: a soft term per unit of distance along the relation's direction. Left of the tree with pull, the house ends
// at the tree (the gap declared by the peer policy aside), not anywhere within the declared 60.
test('a declared pull keeps the subject close to its anchor along the relation',{skip},async()=>{
  const pulled=()=>{const world=fixture();world.load('@left.pull std.placement.predicate method=$place relation=right predicate=right gap=60 pull=1');return world;};
  const rightOfTree='@c3 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=right goal=$t.tree polarity=positive character=requirement';
  for(const p of [undefined,...(provider?[provider]:[])]){
   const out=read(await pulled().compileRequest(request(rightOfTree+'\n'+nearLake.replace('relation=near','relation=independent_peer').replace('c1','c0')),p?{provider:p}:{}));
   assert.equal(out.result.attrs.status[0],'compiled',JSON.stringify(out.result.attrs));
   const h=box(out.call);
   assert.ok(h.x>=680&&h.x-680<=12,(p?'z3 ':'internal ')+JSON.stringify(h));
  }
});
// clearance: a directional relation keeps at least that distance from its anchor; with pull the subject sits at
// exactly that distance. The pull cost is the distance from that slot, never negative.
test('a declared clearance keeps the distance and pull closes to it exactly',{skip},async()=>{
  const cleared=()=>{const world=fixture();world.load('@right.clear std.placement.predicate method=$place relation=right predicate=right gap=60 clearance=12 pull=1');return world;};
  const rightOfTree='@c3 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=right goal=$t.tree polarity=positive character=requirement';
  for(const p of [undefined,...(provider?[provider]:[])]){
   const out=read(await cleared().compileRequest(request(rightOfTree+'\n'+nearLake.replace('relation=near','relation=independent_peer').replace('c1','c0')),p?{provider:p}:{}));
   assert.equal(out.result.attrs.status[0],'compiled',JSON.stringify(out.result.attrs));
   assert.ok(Number(out.result.attrs.cost?.[0]??0)>=0,'the closeness cost is not negative');
   // Z3 is exact; the internal search is on the declared grid (10), so within one step beyond the clearance.
   const x=box(out.call).x;assert.ok(p?x===692:x>=692&&x<702,(p?'z3 ':'internal ')+JSON.stringify(box(out.call)));
  }
});

// A count on a new subject ("add three houses near the lake"): that many subjects in the one problem, each with the
// subject's relations, kept apart from each other and from the observed peers. Three subjects are too many to
// enumerate whole; the internal search answers by block coordinate search (reason=block-search), Z3 exactly.
const counted=(n,relations=nearLake)=>request(relations)+`\n@count std.request.constraint request=$r target=$t.house concept=count operator=eq value=${n} polarity=positive character=requirement`;
for (const [label,run] of [['internal search',(w,t)=>w.compileRequest(t)],['Z3',(w,t)=>w.compileRequest(t,{provider})]]) {
  test('a counted new subject makes that many calls, each near its anchor, none overlapping ('+label+')',{skip:skip||(label==='Z3'&&!provider&&'z3-solver unavailable')},async()=>{
    const rows=parse(await run(fixture(' relax=gap'),counted(3))),result=rows[0];
    assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
    const calls=rows.filter(w=>(result.attrs.call??[]).includes('$'+w.id));
    assert.equal(calls.length,3);
    const houses=calls.map(box),lake={x:300,y:380,w:260,h:140},rock={x:420,y:300,w:40,h:40},tree={x:620,y:330,w:60,h:120};
    for(const h of houses){
      assert.ok(!overlaps(h,lake)&&!overlaps(h,rock)&&!overlaps(h,tree),'off the lake, rock and tree '+JSON.stringify(h));
      assert.ok(h.x>=0&&h.y>=0&&h.x+h.w<=800&&h.y+h.h<=600,'on the page');
    }
    for(let i=0;i<3;i++)for(let j=0;j<i;j++)assert.ok(!overlaps(houses[i],houses[j]),'apart '+JSON.stringify([houses[i],houses[j]]));
    if(!result.attrs.relaxed)for(const h of houses){
      const gx=h.x+h.w<=lake.x?lake.x-(h.x+h.w):lake.x+lake.w<=h.x?h.x-(lake.x+lake.w):0,gy=h.y+h.h<=lake.y?lake.y-(h.y+h.h):lake.y+lake.h<=h.y?h.y-(lake.y+lake.h):0;
      assert.ok(gx<=40&&gy<=40,'near the lake '+JSON.stringify(h));
    }
  });
}
test('a count of one is the subject itself; an invalid count is refused before any search',{skip},()=>{
  const one=parse(fixture().compileRequest(counted(1))),result=one[0];
  assert.equal(result.attrs.status[0],'compiled');assert.equal(result.attrs.call.length,1);
  assert.equal(parse(fixture().compileRequest(counted(40)))[0].attrs.reason[0],'request-count');
});

// What holds a subject up (std.placement.kind avoids=): a cottage "near the lake, left of the tree" keeps out of every
// region of the water of a river beside the tree, hard, whatever the relations would prefer.
function riverFixture() {
  const world=fixture();
  world.load(`@river.a std.placement.region entity="river" kind=water ${context} min_x=430 min_y=180 max_x=620 max_y=300
  @river.b std.placement.region entity="river" kind=water ${context} min_x=440 min_y=300 max_x=620 max_y=379
  @cottage std.placement.kind concept=cottage native=cottage binding=$maker width=100 height=80 avoids=water avoids=road`);
  return world;
}
for (const [label,run] of [['internal search',(w,t)=>w.compileRequest(t)],['Z3',(w,t)=>w.compileRequest(t,{provider})]]) {
  const skipZ3=label==='Z3'&&!provider&&'z3-solver unavailable';
  test('a subject keeps out of the regions its kind avoids ('+label+')',{skip:skip||skipZ3},async()=>{
    const water=[{x:430,y:180,w:190,h:120},{x:440,y:300,w:180,h:79}];
    const ask2=request(nearLake+'\n'+leftOfTree).replaceAll('kind=house','kind=cottage').replaceAll('$t.house','$t.cottage').replaceAll('@t.house','@t.cottage');
    const {result,call}=read(await run(riverFixture(),ask2));
    assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
    const h=box(call);
    assert.ok(!water.some(w=>overlaps(h,w)),'out of the water '+JSON.stringify(h));
    check(call);
  });
}
test('a relation declared pair=sides said for two anchors places the subject between them, on the facing side of each',{skip},()=>{
  const world=fixture();
  world.load(observed('well','well',60,380,40,40)+`
  @between std.placement.predicate method=$place relation=between predicate=apart pair=sides
  @right std.placement.predicate method=$place relation=right predicate=right gap=200
  @next.right std.placement.predicate method=$place relation=next predicate=right gap=60 flow="right"`);
  const between=(goal,id)=>`@${id} std.request.constraint request=$r target=$t.house concept=place operator=relation relation=between goal=${goal} polarity=positive character=requirement`;
  const well='@t.well std.request.target request=$r kind=well mode=existing';
  const {result,call}=read(world.compileRequest(request(well+'\n'+between('$t.lake','c1')+'\n'+between('$t.well','c2')).replace('bounds=$page.box','bounds=$page.box flow="right"')));
  assert.equal(result.attrs.status[0],'compiled',JSON.stringify(result.attrs));
  // The well is far left of the lake: the house is left of the lake and right of the well.
  const h=box(call);
  assert.ok(h.x>=100&&h.x+h.w<=300,'between on x '+JSON.stringify(h));
  // Said for one anchor only, the pair is refused before any search.
  const one=read(world.compileRequest(request(between('$t.lake','c1')))).result;
  assert.notEqual(one.attrs.status[0],'compiled');assert.equal(one.attrs.reason[0],'paired-relation-anchors');
});
test('a predicate declared flow= holds only in a context that observes that flow',{skip},()=>{
  const world=fixture();
  world.load(`@next.down std.placement.predicate method=$place relation=next predicate=below gap=60 flow="down"
  @next.right std.placement.predicate method=$place relation=next predicate=right gap=60 flow="right"`);
  const next='@c1 std.request.constraint request=$r target=$t.house concept=place operator=relation relation=next goal=$t.tree polarity=positive character=requirement';
  const flowing=(flow)=>request(next).replace('bounds=$page.box','bounds=$page.box'+(flow?' flow="'+flow+'"':''));
  const tree={x:620,y:330,w:60,h:120};
  const right=read(world.compileRequest(flowing('right')));
  assert.equal(right.result.attrs.status[0],'compiled',JSON.stringify(right.result.attrs));
  assert.ok(box(right.call).x>=tree.x+tree.w,'right of the tree in a rightward flow '+JSON.stringify(box(right.call)));
  const none=read(world.compileRequest(flowing(null))).result;
  assert.notEqual(none.attrs.status[0],'compiled');assert.equal(none.attrs.reason[0],'undeclared-relation');
});
