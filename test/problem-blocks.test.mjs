// The internal search of a problem too large to enumerate whole: block coordinate search over the variables of
// each box, every hard constraint kept, the answer disclosed as reason=block-search.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {solveProblem,parse} from '../tools/lib-under-test.mjs';

function packet(n,{hardApart=false}={}) {
  const lines=[],refs=[];
  const add=(kind,id,text)=>{lines.push('@'+id+' std.problem.'+kind+' '+text);refs.push(kind.replace(/^/,'')+'=$'+id);};
  add('box','frame','name=frame x=0 y=0 w=800 h=600');add('box','peer','name=peer x=300 y=200 w=200 h=200');add('box','centre','name=centre x=360 y=40 w=80 h=80');
  for(let i=0;i<n;i++){
    add('var','vx'+i,`name=x${i} min=0 max=720 step=10`);add('var','vy'+i,`name=y${i} min=0 max=520 step=10`);
    add('box','s'+i,`name=s${i} x=x${i} y=y${i} w=80 h=80`);
    add('constraint','in'+i,`name=in${i} predicate=inside a=s${i} b=frame strength=hard`);
    add('constraint','off'+i,`name=off${i} predicate=apart a=s${i} b=peer gap=10 strength=hard`);
    add('constraint','cx'+i,`name=cx${i} predicate=align a=s${i} b=centre axis=x strength=soft weight=1`);
    add('constraint','cy'+i,`name=cy${i} predicate=align a=s${i} b=centre axis=y strength=soft weight=1`);
    for(let j=0;j<i;j++)add('constraint',`apart${i}.${j}`,`name=apart${i}.${j} predicate=apart a=s${i} b=s${j} gap=10 strength=${hardApart?'hard':'soft weight=1000'}`);
  }
  const order=k=>refs.filter(r=>r.startsWith(k+'='));
  return `@problem std.problem.request budget=5000 ${[...order('var'),...order('box'),...order('constraint')].join(' ')}\n${lines.join('\n')}`;
}
const solve=sop=>{const rows=parse(solveProblem(sop)),result=rows.find(w=>w.type==='std.problem.result');
  return {result,value:Object.fromEntries(rows.filter(w=>w.type==='std.problem.assignment'&&(result.attrs.assignment??[]).includes('$'+w.id)).map(w=>[w.attrs.var[0],Number(w.attrs.value[0])]))};};
const overlaps=(p,q,g=0)=>p.x<q.x+q.w+g&&q.x<p.x+p.w+g&&p.y<q.y+q.h+g&&q.y<p.y+p.h+g;

test('several boxes too many to enumerate are placed by block search, apart and near the centre',()=>{
  for(const n of [2,4]){
    const {result,value}=solve(packet(n,{hardApart:true}));
    assert.equal(result.attrs.status[0],'solved');assert.equal(result.attrs.provider[0],'internal');assert.equal(result.attrs.reason[0],'block-search');
    const boxes=[...Array(n).keys()].map(i=>({x:value['x'+i],y:value['y'+i],w:80,h:80}));
    for(const b of boxes)assert.ok(!overlaps(b,{x:300,y:200,w:200,h:200},10)&&b.x>=0&&b.y>=0&&b.x+80<=800&&b.y+80<=600);
    for(let i=0;i<n;i++)for(let j=0;j<i;j++)assert.ok(!overlaps(boxes[i],boxes[j],10),JSON.stringify(boxes));
    assert.ok(boxes.every(b=>b.y<=200),'pulled toward the centre box at the top '+JSON.stringify(boxes));
  }
});
test('a single box is still enumerated exhaustively',()=>{
  const {result}=solve(packet(1));
  assert.equal(result.attrs.status[0],'solved');assert.equal(result.attrs.reason,undefined);
});
