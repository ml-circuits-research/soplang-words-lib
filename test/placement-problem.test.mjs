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
function fixture() {
  const path=dir+'docs/worlds/k.spatial2d/';
  const world=new World({library:{'k.spatial2d':readFileSync(path+'schema.sop','utf8')}});
  world.load('@std core.use world=std.placement\n@space core.use world=k.spatial2d prefix=false');
  world.load(readFileSync(path+'shards/policies.sop','utf8'));
  world.load(`@place std.placement.method directionType=k.spatial2d.direction boxType=k.spatial2d.box relationType=k.spatial2d.relation policyType=k.spatial2d.policy effectiveType=k.spatial2d.effective_policy measurementType=k.spatial2d.measurement peerRelation=independent_peer gapMetric=near_distance containRelation=member_of objective=$choose search=problem grid=10
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
test('an undeclared relation is refused before any search',{skip},()=>{
  const {result}=read(fixture().compileRequest(request(nearLake.replace('relation=near','relation=orbiting'))));
  assert.equal(result.attrs.reason[0],'undeclared-relation');
});
