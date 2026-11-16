import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, retainPointSpace } from '../tools/lib-under-test.mjs';
const text = `@frame w.legend.frame name=example.root version=1
@s w.legend.space name=example.page form=axes version=1 frame=$frame
@y w.legend.axis of=$s name=y order=20 kind=linear unit=$uy min=-100 max=100
@uy w.legend.unit name=unit of=$y factor=1 offset=0
@x w.legend.axis of=$s name=x order=10 kind=angle unit=$ux period=360
@ux w.legend.unit name=degree of=$x factor=1 offset=0
@alt w.legend.unit name=turn of=$x factor=360 offset=0`;
const make = () => { const w = new World(); w.load('@use core.use world=w.legend'); w.load(text); return w; };
test('point publication captures axis order, root frame and all affine units', () => {
 const w=make(), r=retainPointSpace(w,'s'); assert.equal(r.ok,true); assert.equal(r.created,true);
 const d=r.retained.definition;
 assert.deepEqual(d.axes.map(x=>x.name),['x','y']); assert.equal(d.axes[0].period,360);
 assert.equal(d.axes[0].unit,'ux'); assert.deepEqual(d.axes[0].units.map(x=>x.id),['alt','ux']);
 assert.equal(d.frame.id,'frame'); assert.equal(d.axes[1].min,-100); assert.equal(d.format,'sop.point.space');
 assert.ok(Object.isFrozen(d.axes[0].units[0]));
 assert.equal(retainPointSpace(w,'$s').created,false);
});
test('source edits cannot replace a retained revision and new revisions remain explicit', () => {
 const w=make(), before=retainPointSpace(w,'s').retained;
 assert.equal(w.applyPatch({replace:{id:'alt',attrs:{name:'turn',of:'$x',factor:180,offset:0}}}).ok,true);
 const conflict=retainPointSpace(w,'s'); assert.equal(conflict.ok,false); assert.equal(conflict.violations[0].kind,'retained-revision');
 assert.equal(w.retainedRevision('point.space:s','1'),before);
 assert.equal(w.applyPatch({replace:{id:'s',attrs:{name:'example.page',form:'axes',version:'2',frame:'$frame'}}}).ok,true);
 assert.equal(retainPointSpace(w,'s').retained.definition.axes[0].units[0].factor,180);
 assert.equal(before.definition.axes[0].units[0].factor,360);
});
test('missing roots, graph/empty spaces and empty revisions cannot publish points', () => {
 for (const snippet of [
 '@s w.legend.space name=p form=axes version=1',
 '@f w.legend.frame name=root version=1\n@s w.legend.space name=p form=graph version=1 frame=$f',
 '@f w.legend.frame name=root version=1\n@s w.legend.space name=p form=axes version=1 frame=$f',
 text.replace('form=axes version=1','form=axes version=""'),
 text.replace('name=example.root version=1','name=example.root version=""'),
 ]) { const w=new World();w.load('@use core.use world=w.legend');w.load(snippet);assert.equal(retainPointSpace(w,'s').ok,false);assert.equal(w.retainedRevision('point.space:s','1'),null); }
 assert.equal(retainPointSpace(new World(),'missing').ok,false);
});
test('root frames are typed closed declarations and cannot imply a child transform',()=>{
 for (const bad of ['@f w.legend.frame name=root','@f w.legend.frame version=1','@f w.legend.frame name=root version=1 parent=$f','@f w.legend.frame name=root version=1\n@s w.legend.space name=p version=1 form=axes frame=$s']) {
  const w=new World();w.load('@use core.use world=w.legend');assert.equal(w.tell(bad).ok,false);
 }
});
test('dry and bounded capture do not leave registry entries',()=>{
 const w=make(); assert.equal(retainPointSpace(w,'s',{dry:true}).ok,true);assert.equal(w.retainedRevision('point.space:s','1'),null);
 assert.equal(retainPointSpace(w,'s',{budget:{steps:1}}).ok,false);assert.equal(w.retainedRevision('point.space:s','1'),null);
 assert.equal(retainPointSpace(w,'s').ok,true);
});
test('published definition survives source undo and JSON persistence',()=>{
 const w=make(); const d=retainPointSpace(w,'s').retained.definition;
 w.undo();assert.equal(w.retainedRevision('point.space:s','1').definition,d);
 const restored=World.fromJSON(w.toJSON()); assert.deepEqual(restored.retainedRevision('point.space:s','1').definition,d);
});
test('aliased modules and qualified owners retain distinct identities',()=>{
 const w=new World();w.load('@use core.use world=w.legend as=app.legend');
 assert.equal(w.tell(text.replaceAll('w.legend','app.legend'),{ns:'A'}).ok,true);
 assert.equal(w.tell(text.replaceAll('w.legend','app.legend'),{ns:'B'}).ok,true);
 const a=retainPointSpace(w,'A::s',{family:'app.legend'}),b=retainPointSpace(w,'B::s',{family:'app.legend'});
 assert.equal(a.ok,true);assert.equal(b.ok,true);assert.equal(a.retained.definition.frame.id,'A::frame');
 assert.notEqual(a.retained.owner,b.retained.owner);
});
