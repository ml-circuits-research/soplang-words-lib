import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../tools/lib-under-test.mjs';
const make=()=>{const w=new World();w.load('@use core.use world=w.legend');return w;};
const base='@s w.legend.space name=distance form=axes version=1\n@a w.legend.axis of=$s name=length order=0 kind=linear unit=$u\n@u w.legend.unit name=metre of=$a factor=1 offset=0';
const axis=(extra)=>base.replace('unit=$u','unit=$u '+extra);
test('the book colour axis fixture supplies all typed dependencies',()=>{
 const text=readFileSync(new URL('../books/sop-worlds-teorie.md',import.meta.url),'utf8');
 const fixture=text.match(/```sop\n(@sp.colour w.legend.space[\s\S]*?)\n```/)[1];
 const w=make();w.load(fixture);assert.equal(w.ofType('w.legend.axis').length,3);assert.equal(w.check().ok,true);
});
test('space, axis and unit fields are structurally required',()=>{
 for(const [line,fields] of [[0,['name','form','version']],[1,['of','name','order','kind','unit']],[2,['name','of','factor','offset']]])for(const f of fields){
  const lines=base.split('\n');lines[line]=lines[line].replace(new RegExp(` ${f}=[^ ]+`),'');
  assert.equal(make().tell(lines.join('\n')).ok,false,`${line}:${f}`);
 }
});
test('finite numeric parameters, positive scales and explicit circular periods',()=>{
 for(const extra of ['min=3 max=3','min=4 max=3','weight=0','weight=-1','normalisation=0','normalisation=-1','min=NaN','max=Infinity','weight="1"','period=360','step=1','scale=ratio','scale=ratio step=1','scale=ratio step=-2','scale=interval step=0'])assert.equal(make().tell(axis(extra)).ok,false,extra);
 for(const extra of ['min=-5 max=10','weight=0.1 normalisation=4','scale=ratio step=1.25','scale=interval step=2'])assert.equal(make().tell(axis(extra)).ok,true,extra);
 assert.equal(make().tell(base.replace('kind=linear','kind=angle')).ok,false);
 assert.equal(make().tell(base.replace('kind=linear','kind=angle period=6.283185307179586')).ok,true);
 for(const value of ['0','-1','1e999'])assert.equal(make().tell(base.replace('kind=linear',`kind=angle period=${value}`)).ok,false);
 for(const value of ['-1','0.5','9007199254740992'])assert.equal(make().tell(base.replace('order=0',`order=${value}`)).ok,false);
});
test('canonical units are identity conversions owned by the exact axis',()=>{
 for(const change of [['factor=1','factor=2'],['offset=0','offset=1'],['of=$a','of=$s'],['unit=$u','unit=$s'],['unit=$u','unit="$u"']])assert.equal(make().tell(base.replace(...change)).ok,false);
 const w=make();w.load(base+'\n@b w.legend.axis of=$s name=other order=10 kind=linear unit=$v\n@v w.legend.unit name=metre of=$b factor=1 offset=0');
 assert.equal(w.applyPatch({replace:{id:'a',attrs:{of:'$s',name:'length',order:0,kind:'linear',unit:'$v'}}}).ok,false);
 assert.equal(w.get('a').attrs.unit[0],'$u');
});
test('affine alternative units are finite positive-factor data, with signed offsets',()=>{
 for(const [factor,offset,ok] of [[100,0,true],[0.01,-273.15,true],[0,0,false],[-1,0,false],['Infinity',0,false],[1,'NaN',false]]){
  const w=make();w.load(base);assert.equal(w.tell(`@alt w.legend.unit name=alternate of=$a factor=${factor} offset=${offset}`).ok,ok);
 }
});
test('axis names/orders and unit names are unique within an owner, not globally',()=>{
 for(const [name,order,ok] of [['length',10,false],['other',0,false],['other',10,true]])assert.equal(make().tell(base+`\n@b w.legend.axis of=$s name=${name} order=${order} kind=linear unit=$v\n@v w.legend.unit name=metre of=$b factor=1 offset=0`).ok,ok);
 assert.equal(make().tell(base+'\n@v w.legend.unit name=metre of=$a factor=1 offset=0').ok,false);
 const second=base.replaceAll('@s ','@t ').replaceAll('$s','$t').replaceAll('@a ','@b ').replaceAll('$a','$b').replaceAll('@u ','@v ').replaceAll('$u','$v');
 assert.equal(make().tell(base+'\n'+second).ok,true);
});
test('graph spaces reject numerical axes; referenced declarations cannot be removed or invalidated',()=>{
 assert.equal(make().tell(base.replace('form=axes','form=graph')).ok,false);
 const w=make();w.load(base);for(const id of ['s','a','u'])assert.equal(w.retract(id).ok,false);
 assert.equal(w.applyPatch({replace:{id:'s',attrs:{name:'distance',form:'graph',version:1}}}).ok,false);
 assert.equal(w.check().ok,true);assert.equal(make().tell('@graph w.legend.space name=structure version=1 form=graph').ok,true);
});
test('space guards and unit ownership work through module aliases',()=>{
 const w=new World();w.load('@use core.use world=w.legend as=app.legend');
 w.load(base.replaceAll('w.legend','app.legend'));assert.equal(w.tell('@v app.legend.unit name=metre of=$a factor=1 offset=0').ok,false);
});
test('shared legend declarations enforce owner uniqueness across namespaces',()=>{
 const w=make();w.load('@s w.legend.space name=distance form=axes version=1');
 const text='@a w.legend.axis of=$::s name=length order=0 kind=linear unit=$u\n@u w.legend.unit name=metre of=$a factor=1 offset=0';
 assert.equal(w.tell(text,{ns:'A'}).ok,true);
 assert.equal(w.tell(text,{ns:'B'}).ok,false);
 const duplicate=w.tell('@other w.legend.unit name=metre of=$A::a factor=1 offset=0',{ns:'B'});
 assert.equal(duplicate.ok,false);assert.ok(duplicate.violations.some(v=>v.kind==='deny'&&v.why.includes('duplicate unit')));
 assert.equal(w.check().ok,true);
 const other='@s w.legend.space name=distance form=axes version=1\n'+text.replace('$::s','$s');
 assert.equal(w.tell(other,{ns:'C'}).ok,true,'another owner allows the same vocabulary');
});
