// Each alternative owns a request graph and compiles against the same observed World.
import {serialize,quote,parse,str} from './parser.mjs';

const first=(wire,key)=>wire?.attrs[key]?.[0];
const ref=token=>token?.startsWith('$')?token.slice(1):null;
const unavailable=reason=>'@interpret.result std.interpret.result status=unavailable reason='+reason;
const proposalType='std.interpret.proposal';
export const interpretationContract={text:`
@interpret.module core.module name=std.interpret imports=std.request exports=std.interpret.input exports=std.interpret.proposal exports=std.interpret.result exports=std.interpret.reading
@interpret.input.type core.type of=std.interpret.input closed=true
@interpret.input.options core.slot of=std.interpret.input key=proposal type=std.interpret.proposal many=true present=true
@interpret.proposal.type core.type of=std.interpret.proposal closed=true
@interpret.proposal.request core.slot of=std.interpret.proposal key=request type=std.request present=true
@interpret.proposal.member core.slot of=std.interpret.proposal key=member kind=ref many=true present=true
@interpret.result.type core.type of=std.interpret.result closed=true
@interpret.result.status core.slot of=std.interpret.result key=status kind=atom present=true
@interpret.result.reason core.slot of=std.interpret.result key=reason kind=atom
@interpret.result.reading core.slot of=std.interpret.result key=reading type=std.interpret.reading many=true
@interpret.result.choice core.slot of=std.interpret.result key=choice type=std.interpret.reading
@interpret.result.plan core.slot of=std.interpret.result key=plan kind=ref
@interpret.reading.type core.type of=std.interpret.reading closed=true
@interpret.reading.request core.slot of=std.interpret.reading key=request kind=string present=true
@interpret.reading.status core.slot of=std.interpret.reading key=status kind=atom present=true
@interpret.reading.reason core.slot of=std.interpret.reading key=reason kind=atom
@interpret.reading.skipped core.slot of=std.interpret.reading key=skipped kind=integer
@interpret.reading.preference core.slot of=std.interpret.reading key=preference kind=integer
`,fns:{}};

export function compileInterpretations(world,wires,compileOne){
 const inputs=wires.filter(w=>w.type==='std.interpret.input'),input=inputs[0];
 if(inputs.length!==1||!world.schema(input.type))return unavailable('input-contract');
 const byId=new Map(wires.map(w=>[w.id,w])),options=input.attrs.proposal??[];
 if(!options.length||options.length>16||byId.size!==wires.length)return unavailable('proposal-budget-or-identity');
 if(Object.keys(input.attrs).some(k=>k!=='proposal')||wires.some(w=>w.pattern||world.has(w.id)||world.matrix.has(w.id)))return unavailable('input-identity');
 const used=new Set([input.id]),readings=[];
 let source,chosen;
 for(const id of options){ // bounded: at most 16 isolated compilations of a combined 1024 wires
  const p=byId.get(ref(id));
  if(!p||used.has(p.id)||p.type!==proposalType||Object.keys(p.attrs).some(k=>!['request','member'].includes(k))||p.attrs.request?.length!==1)return unavailable('invalid-proposal');
  used.add(p.id);
  const nodes=[];
  for(const token of p.attrs.member??[]){ // bounded: the global compiler input limit bounds all members
   const node=byId.get(ref(token));
   if(!node||used.has(node.id)||node.type.startsWith('std.interpret.'))return unavailable('proposal-ownership');
   used.add(node.id);nodes.push(node);
  }
  const request=nodes.find(w=>w.type==='std.request'&&w.id===ref(first(p,'request')));
  const sourceNode=nodes.find(w=>w.type==='std.request.source'&&w.id===ref(first(request,'source')));
  const utterance=str(first(sourceNode,'text'));
  if(!utterance||source!==undefined&&utterance!==source)return unavailable('source-mismatch');
  source=utterance;
  const plan=parse(compileOne(world,nodes)),summary=plan[0];
  const status=first(summary,'status'),reason=first(summary,'reason');
  const skipped=summary.attrs.skipped?.length??0;
  const selected=plan.find(w=>w.id===ref(first(summary,'call')));
  const operation=first(selected,'operation');
  const score=operation?Number(first(plan.find(w=>w.type==='std.capability.alternative'&&first(w,'operation')===operation&&first(w,'status')==='available'),'preference')??0):0;
  const reading={id:'interpret.reading.'+readings.length,type:'std.interpret.reading',attrs:{request:[quote(request.id)],status:[status],skipped:[String(skipped)],preference:[String(score)],...(reason?{reason:[reason]}:{})}};
  readings.push(reading);
  if(status==='compiled'&&(!chosen||skipped<chosen.skipped||skipped===chosen.skipped&&score>chosen.score))chosen={reading,plan,skipped,score};
 }
 if(used.size!==wires.length)return unavailable('unowned-wire');
 const result={id:'interpret.result',type:'std.interpret.result',attrs:{status:[chosen?'compiled':'unavailable'],reading:readings.map(w=>'$'+w.id)}};
 if(!chosen){result.attrs.reason=['no-usable-reading'];return serialize([result,...readings]);}
 const mapped=new Map(chosen.plan.map((w,i)=>[w.id,'interpret.plan.'+i]));
 const plan=chosen.plan.map(w=>({...w,id:mapped.get(w.id),attrs:Object.fromEntries(Object.entries(w.attrs).map(([k,values])=>[k,values.map(v=>mapped.has(ref(v))?'$'+mapped.get(ref(v)):v)]))}));
 result.attrs.choice=['$'+chosen.reading.id];result.attrs.plan=['$'+plan[0].id];
 return serialize([result,...readings,...plan]);
}
