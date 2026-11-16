import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load(`@a core.type of=base
@b core.type of=left
@c core.type of=right
@t core.type of=item extends=base extends=left
@child core.type of=child extends=item
@x item value=one
@y child value=two`);return w;};
const ids=(w,type)=>w.ofType(type).map(x=>x.id).sort();
test('changing only a mixin rebuilds descendant type and value indexes',()=>{
 const w=make();assert.deepEqual(ids(w,'left'),['x','y']);
 assert.equal(w.tell('@changed core.type of=item extends=base extends=right').ok,true);
 assert.deepEqual(ids(w,'left'),[]);assert.deepEqual(ids(w,'right'),['x','y']);
 assert.deepEqual(w.ask('@p right value=two').map(x=>x.p),['y']);
 assert.deepEqual(w.ask('@p left value=?v'),[]);
 assert.deepEqual(ids(w,'base'),['x','y']);
});
test('mixin index changes roll back with a refused transaction and isolate forks',()=>{
 const w=make(),fork=w.fork();
 const bad=w.tell('@changed core.type of=item extends=base extends=right\n@bad example ref=$missing');
 assert.equal(bad.ok,false);assert.deepEqual(ids(w,'left'),['x','y']);assert.deepEqual(ids(w,'right'),[]);
 assert.equal(w.tell('@changed core.type of=item extends=base extends=right').ok,true);
 assert.deepEqual(ids(fork,'left'),['x','y']);assert.deepEqual(ids(fork,'right'),[]);
});
test('mixin change is replayed consistently by undo, redo and snapshots',()=>{
 const w=make();w.load('@changed core.type of=item extends=base extends=right');
 const restored=World.fromJSON(w.toJSON());assert.deepEqual(ids(restored,'right'),['x','y']);assert.deepEqual(ids(restored,'left'),[]);
 w.undo();assert.deepEqual(ids(w,'left'),['x','y']);assert.deepEqual(ids(w,'right'),[]);
 w.redo();assert.deepEqual(ids(w,'right'),['x','y']);assert.deepEqual(ids(w,'left'),[]);
});
test('a newly inherited rule can see already stored facts through rebuilt indexes',()=>{
 const w=make();w.load('@p right value=?v\n@out seen value=?v\n@r core.rule when=$p then=$out');
 assert.equal(w.ofType('seen').length,0);
 w.load('@changed core.type of=item extends=base extends=right');
 assert.deepEqual(w.ofType('seen').map(x=>x.attrs.value[0]).sort(),['one','two']);
});
