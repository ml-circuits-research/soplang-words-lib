import { quote, serialize, str } from './parser.mjs';
import { rank } from './rank.mjs';

const prefix='std.choice.';
const schema={
 request:{policy:'kind=atom present=true',option:'type=std.choice.option many=true'},
 option:{measurement:'type=std.choice.measurement many=true present=true'},
 measurement:{metric:'kind=atom present=true',value:'kind=number present=true'},
 result:{request:'type=std.choice.request present=true',status:'kind=atom enum=selected enum=unavailable present=true',
  reason:'kind=atom',option:'type=std.choice.option',alternative:'type=std.choice.option many=true',
  tie:'type=std.choice.option many=true',assessment:'type=std.choice.assessment many=true'},
 assessment:{option:'type=std.choice.option present=true',status:'kind=atom enum=selected enum=available enum=denied present=true',
  rank:'kind=integer min=1',criterion:'kind=atom',why:'kind=string'},
};
export const choiceContract={text:[
 '@choice.module core.module name=std.choice '+Object.keys(schema).map(kind=>'exports='+prefix+kind).join(' '),
 ...Object.entries(schema).flatMap(([kind,keys])=>{
  const type=prefix+kind;
  return ['@'+type+'.type core.type of='+type+' closed=true',
   ...Object.entries(keys).map(([key,spec])=>'@'+type+'.'+key+' core.slot of='+type+' key='+key+' '+spec)];
 }),
].join('\n'),fns:{}};

const field=(wire,key)=>wire.attrs[key]?.[0];
const own=(row,keys)=>Object.keys(row.attrs).every(key=>keys.includes(key));
const atom=token=>typeof token==='string'&&/^[A-Za-z_][\w.:-]*$/.test(token);
const number=token=>typeof token==='string'&&/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token);
const ref=token=>typeof token==='string'&&token.startsWith('$')?token.slice(1):undefined;
const wire=(id,type,attributes)=>({id,type:prefix+type,attrs:Object.fromEntries(Object.entries(attributes)
 .filter(([,value])=>value!==undefined).map(([key,value])=>[key,[].concat(value)]))});

function criteriaFor(world,policy){
 const candidates=world.ofType('std.decide.criterion').filter(row=>str(field(row,'of'))===policy);
 if(!candidates.length||candidates.length>16)return null;
 const criteria=candidates.map(row=>({
  order:Number(field(row,'n')),name:str(field(row,'name')),metric:str(field(row,'measure')),direction:str(field(row,'dir')),
 }));
 if(criteria.some(({order,name,metric,direction})=>!Number.isSafeInteger(order)||order<1||!atom(name)||!atom(metric)||!['min','max','hard'].includes(direction))||
   new Set(criteria.map(row=>row.order)).size!==criteria.length||new Set(criteria.map(row=>row.name)).size!==criteria.length)return null;
 return criteria.sort((a,b)=>a.order-b.order);
}

export function compileChoice(world,wires){
 const fail=reason=>'@compile.result std.compile.result status=unavailable reason='+reason+'\n';
 const requests=wires.filter(row=>row.type===prefix+'request');
 const byId=new Map(wires.map(row=>[row.id,row]));
 if(requests.length!==1||byId.size!==wires.length||
    wires.some(row=>row.pattern||row.id.startsWith('choice.output.')||world.has(row.id)||world.matrix.has(row.id)))return fail('choice-identity');
 if(!world.schema(prefix+'request')?.closed||!world.schema(prefix+'option')?.closed||!world.schema(prefix+'measurement')?.closed)return fail('choice-contract');
 const [request]=requests;
 if(!own(request,['policy','option'])||request.attrs.policy?.length!==1||!atom(field(request,'policy')))return fail('invalid-choice-request');
 const options=request.attrs.option??[],policy=criteriaFor(world,field(request,'policy'));
 if(!policy)return fail('choice-policy');
 if(options.length>240)return fail('choice-budget');
 const metrics=new Set(policy.map(row=>row.metric));
 const seen=new Set([request.id]),available=[],denied=[];
 function take(token,type,keys){
  const row=byId.get(ref(token));
  if(!row||seen.has(row.id)||row.type!==prefix+type||!own(row,keys))return null;
  seen.add(row.id);return row;
 }
 for(const token of options){
  const option=take(token,'option',['measurement']);
  if(!option||option.attrs.measurement?.length!==metrics.size)return fail('invalid-choice-option');
  const values=new Map();
  for(const binding of option.attrs.measurement){
   const measure=take(binding,'measurement',['metric','value']);
   if(!measure||measure.attrs.metric?.length!==1||measure.attrs.value?.length!==1)return fail('invalid-choice-measurement');
   const key=field(measure,'metric'),raw=field(measure,'value'),value=Number(raw);
   if(!metrics.has(key)||values.has(key)||!number(raw)||!Number.isFinite(value))return fail('invalid-choice-measurement');
   values.set(key,value);
  }
  const hard=policy.find(({direction,metric})=>direction==='hard'&&values.get(metric)!==0);
  if(hard)denied.push({token,hard});
  else available.push({token,values});
 }
 if(seen.size!==wires.length)return fail('unowned-choice-wire');
 const admitted=world.fork().tell(wires,{factsOnly:true});
 if(!admitted.ok)return fail(admitted.violations.some(row=>row.kind==='budget')?'budget':'invalid-choice-facts');

 const soft=policy.filter(row=>row.direction!=='hard');
 const criteria=soft.map(({name,metric,direction})=>({
  name,measure:row=>(direction==='min'?1:-1)*row.values.get(metric),say:row=>name+' '+row.values.get(metric),
 }));
 const {order,ranked}=rank(available,criteria),best=available[order[0]];
 const assessments=order.map((index,position)=>wire('choice.output.assessment.'+position,'assessment',{
  option:available[index].token,status:position===0?'selected':'available',rank:String(position+1),
  criterion:ranked[index].on,why:quote(ranked[index].why),
 }));
 for(const {token,hard} of denied)assessments.push(wire('choice.output.assessment.'+assessments.length,'assessment',{
  option:token,status:'denied',criterion:hard.name,
 }));
 const result=wire('choice.output.result','result',{
  request:'$'+request.id,status:best?'selected':'unavailable',reason:best?undefined:denied.length?'hard-exclusion':'no-candidates',
  option:best?.token,alternative:order.slice(1).map(index=>available[index].token),
  tie:order.slice(1).filter(index=>soft.every(({metric})=>best.values.get(metric)===available[index].values.get(metric)))
   .map(index=>available[index].token),
  assessment:assessments.map(row=>'$'+row.id),
 });
 return serialize([result,...assessments]);
}
