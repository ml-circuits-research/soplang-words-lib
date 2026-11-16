import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World } from '../tools/lib-under-test.mjs';
const make = () => { const w = new World(); w.load('@use core.use world=w.legend'); return w; };
const c = '@c w.legend.condition kind=has object=patient quality=attribute';
const a = '@a w.legend.act name=alter change=quality role=patient role=attribute after=$c';
test('book act declarations load directly with typed conditions', () => {
 const text = readFileSync(new URL('../books/sop-worlds-teorie.md', import.meta.url), 'utf8');
 const fixture = text.match(/```sop\n(@condition.result[\s\S]*?)\n```/)[1];
 const w=make(); w.load(fixture); assert.equal(w.check().ok,true);
 assert.equal(w.ofType('w.legend.act').length,4);
});
test('condition variants require exactly their role arguments', () => {
 for (const kind of ['exists','absent','has','holds']) {
  const extra = kind==='has' ? ' quality=attribute' : kind==='holds' ? ' goal=target' : '';
  const valid=`@c w.legend.condition kind=${kind} object=patient${extra}`;
  const w=make(); w.load(valid);
  for (const bad of [valid.replace(' object=patient',''),valid+' unknown=value',valid.replace(`kind=${kind}`,'kind=guess'),
   ...(extra ? [valid.replace(extra,'')] : []), valid+(kind==='has'?' goal=target':' quality=other')]) {
   assert.equal(make().tell(bad).ok,false,bad);
  }
 }
});
test('act fields and typed condition targets reject incomplete and malformed records', () => {
 for (const bad of [a.replace(' name=alter',''),a.replace(' change=quality',''),a.replace(' role=patient role=attribute',''),a.replace(' after=$c',''),a.replace('$c','$a'),a.replace('$c','$missing'),a.replace('$c','"$c"'),a+' after="prose"',a.replace('quality','mystery')]) {
  const w=make(); assert.equal(w.tell(`${c}\n${bad}`).ok,false,bad); assert.equal(w.has('c'),false);
 }
});
test('all role arguments are checked against each owning act, not other acts', () => {
 for (const phase of ['before','after']) for (const field of ['object','quality','goal']) {
  const kind=field==='quality'?'has':field==='goal'?'holds':'exists';
  const condition=`@c w.legend.condition kind=${kind} object=patient`+(field==='object'?'':` ${field}=target`);
  const w=make(); w.load(`${condition}\n@other w.legend.act name=valid change=quality role=patient role=target after=$c`);
  const bad=`@bad w.legend.act name=custom change=relation role=${field==='object'?'other':'patient'} ${phase}=$c after=$c`;
  assert.equal(w.tell(bad).ok,false,bad); assert.equal(w.has('bad'),false);
 }
});
test('shared conditions and owner edits preserve transactional role integrity', () => {
 const w=make();w.load(`${c}\n${a}\n@b w.legend.act name=second change=quality role=patient role=attribute after=$c`);
 assert.equal(w.applyPatch({replace:{id:'a',attrs:{name:'alter',change:'quality',role:['patient'],after:'$c'}}}).ok,false);
 assert.equal(w.applyPatch({replace:{id:'c',attrs:{kind:'has',object:'patient',quality:'unbound'}}}).ok,false);
 assert.equal(w.retract('c').ok,false); assert.equal(w.check().ok,true);
});
test('orphan conditions are reusable declarations and custom role names are allowed', () => {
 const w=make(); w.load('@c w.legend.condition kind=holds object=origin goal=destination');
 w.load('@a w.legend.act name=link change=relation role=origin role=destination after=$c after=$c');
 assert.deepEqual(w.get('a').attrs.after,['$c']); assert.equal(w.check().ok,true);
});
test('identity guards survive module qualification and aliases', () => {
 for (const alias of [false,true]) for (const prefix of [false,true]) {
  const w=new World();w.load(`@use core.use world=w.legend${alias?' as=app.legend':''} prefix=${prefix}`);
  const ns=alias?'app.legend':'w.legend';
  w.load(`@c ${ns}.condition kind=exists object=subject\n@valid ${ns}.act name=custom change=appear role=subject after=$c`);
  assert.equal(w.tell(`@invalid ${ns}.act name=other change=appear role=unbound after=$c`).ok,false,`${alias}/${prefix}`);
 }
});
