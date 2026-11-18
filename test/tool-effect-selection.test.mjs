import test from 'node:test';
import assert from 'node:assert/strict';
import {World,parse} from '../tools/lib-under-test.mjs';

const declarations = `
@terminal core.type of=toy.move.terminal extends=std.compile.terminal closed=true
@call core.type of=toy.move.call extends=std.compile.call closed=true
@x core.slot of=toy.move.call key=arg.x kind=number present=true
@y core.slot of=toy.move.call key=arg.y kind=number present=true
@descriptor core.type of=toy.interface closed=true
@effect core.slot of=toy.interface key=effect kind=atom present=true
@frame core.slot of=toy.interface key=frame kind=atom present=true
@action core.slot of=toy.interface key=action kind=atom present=true
@left toy.point tag=first x=20 y=40
@right toy.point tag=second x=60 y=40
@request.pattern std.request act=place mood=do
@target.pattern std.request.target request=$request.pattern mode=existing kind=selection
@shape.pattern std.request.constraint request=$request.pattern target=$target.pattern concept=effect operator=eq polarity=positive character=requirement value=?effect
@frame.pattern std.request.constraint request=$request.pattern target=$target.pattern concept=frame operator=eq polarity=positive character=requirement value=?frame
@x.pattern std.request.constraint request=$request.pattern target=$target.pattern concept=x operator=eq polarity=positive character=requirement value=?x
@y.pattern std.request.constraint request=$request.pattern target=$target.pattern concept=y operator=eq polarity=positive character=requirement value=?y
@tool.pattern toy.interface effect=?effect frame=?frame action=?action
@invoke toy.move.call action=?action order=1 arg.x=?x arg.y=?y
@complete toy.move.terminal request=$request.pattern cover=$target.pattern cover=$shape.pattern cover=$frame.pattern cover=$x.pattern cover=$y.pattern call=$invoke
@bind core.rule when=$request.pattern when=$target.pattern when=$shape.pattern when=$frame.pattern when=$x.pattern when=$y.pattern when=$tool.pattern then=$invoke then=$complete
`;
const axesOf=w=>['x','y'].map(axis=>Number(w.attrs[axis][0]));
function request(frame) {
 return `@r std.request act=place mood=do source=$s
@s std.request.source text="Move the selection to (100,80) keeping its offsets."
@t std.request.target request=$r mode=existing kind=selection\n`+
 Object.entries({effect:'preserve-offsets',frame,x:100,y:80}).map(([key,value])=>
 `@v.${key} std.request.constraint request=$r target=$t concept=${key} operator=eq polarity=positive character=requirement value=${value}`).join('\n');
}
function interfaceFor(name,effect,frame) {
 const preserve=effect==='preserve-offsets';
 const axes=['x','y'];
 const calculations=preserve?axes.flatMap(axis=>[
  ['sum','add',`?a${axis} ?b${axis}`],['mean','div',`?sum${axis} 2`],
  ['shift','sub',`?${axis} ?mean${axis}`],['left','add',`?a${axis} ?shift${axis}`],['right','add',`?b${axis} ?shift${axis}`],
 ].map(([role,fn,args])=>({id:name+'.'+role+axis,line:`core.calc out=?${role}${axis} fn=${fn} ${args.split(' ').map(arg=>'args='+arg).join(' ')}`}))):[];
 return [
  `@${name}.description toy.interface action=${name} effect=${effect} frame=${frame}`,
  `@${name}.a toy.point tag=first x=?ax y=?ay`,`@${name}.b toy.point tag=second x=?bx y=?by`,
  ...calculations.map(c=>'@'+c.id+' '+c.line),
  `@${name}.left toy.point core.on=$${name}.a x=?${preserve?'leftx':'x'} y=?${preserve?'lefty':'y'}`,
  `@${name}.right toy.point core.on=$${name}.b x=?${preserve?'rightx':'x'} y=?${preserve?'righty':'y'}`,
  `@${name}.tool core.action name=${name} param=x param=y when=$${name}.a when=$${name}.b ${calculations.map(c=>'with=$'+c.id).join(' ')} set=$${name}.left set=$${name}.right`,
 ].join('\n');
}
test('a rule joins desired effect and frame against interchangeable tool declarations with the same call signature',()=>{
 for(const provider of ['translate','second-provider']){
  const world=new World();
  world.use('std.compile');
  world.load(declarations+'\n'+
   `@method std.compile.rule act=place terminal=toy.move.terminal call=toy.move.call action=collapse action=${provider}\n`+
   interfaceFor('collapse','coincide','canvas')+'\n'+interfaceFor(provider,'preserve-offsets','canvas'));
  const compile=frame=>parse(world.compileRequest(request(frame)));
  const wrong=compile('page');
  assert.equal(wrong.some(w=>w.type==='toy.move.call'),false);
  const result=compile('canvas');
  const calls=result.filter(w=>w.type==='toy.move.call');
  assert.equal(calls.length,1,JSON.stringify(result));
  assert.equal(calls[0].attrs.action[0],provider);
  assert.equal(world.act(calls).ok,true);
  const positions=()=>['left','right'].map(id=>axesOf(world.get(id)));
  assert.deepEqual(positions(),[[80,80],[120,80]]);
  assert.equal(world.undo().ok,true);
  assert.deepEqual(positions(),[[20,40],[60,40]]);
 }
});
