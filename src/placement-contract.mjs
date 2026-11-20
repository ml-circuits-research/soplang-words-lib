// The native method consumes these declared roles. The supplying world owns the
// geometry vocabulary, observations, applicability, candidate family and costs.
const types = {
  context: {request:'ref!',instance:'string!',revision:'string!',scope:'string!',frame:'string!',container:'string!',bounds:'ref'},
  method: {directionType:'atom!',boxType:'atom!',relationType:'atom!',policyType:'atom!',effectiveType:'atom!',measurementType:'atom!',peerRelation:'atom!',gapMetric:'atom!',containRelation:'atom',containEvidence:'atom',objective:'ref!',search:'atom',grid:'number',relax:'atom'},
  predicate: {method:'ref!',relation:'atom!',predicate:'atom!',gap:'number',clearance:'number',strength:'atom',weight:'number',share:'number',
    align:'atom',edge:'number',alignWeight:'number',region:'atom',held:'boolean',fit:'number',relaxWeight:'number',pull:'number'},
  tool: {act:'atom!',operation:'atom!',xKey:'atom!',yKey:'atom!',originX:'number!',originY:'number!',kindKey:'atom',idsKey:'atom',containerKey:'atom',sizeKey:'atom'},
  region: {entity:'string!',kind:'atom!',name:'string',min_x:'number!',min_y:'number!',max_x:'number!',max_y:'number!',holds:'string*',instance:'string',revision:'string',frame:'string',scope:'string'},
  kind: {binding:'ref!',concept:'atom!',native:'atom!',width:'number!',height:'number!',originX:'number',originY:'number'},
  argument: {binding:'ref!',key:'atom!',value:'any!'},
  identity: {box:'ref!',concept:'atom*',source:'string!',container:'string!',name:'string',peer:'boolean'},
  cost: {evaluator:'ref!',metric:'atom!'},
  contribution: {candidate:'ref!',evaluator:'ref!',value:'number!'},
  result: {status:'atom!',reason:'atom',call:'ref*',conflict:'atom*',relaxed:'atom*',provider:'atom',instance:'string',revision:'string',scope:'string',frame:'string',choice:'ref',alternative:'ref*'},
  option: {anchor:'string!',subject:'string',source:'string!',direction:'atom!',x:'number!',y:'number!',minX:'number!',minY:'number!',maxX:'number!',maxY:'number!',status:'atom!',reason:'atom',cost:'number*',evidence:'ref*'},
};
const rows = ['@std.placement.module core.module name=std.placement imports=std.request imports=std.objective ' +
  Object.keys(types).map(name=>'exports=std.placement.'+name).join(' ')];
for (const [name, fields] of Object.entries(types)) {
  const type = 'std.placement.' + name;
  rows.push('@'+type+'.type core.type of='+type+' closed=true');
  for (const [key, spec] of Object.entries(fields)) {
    rows.push('@'+type+'.slot.'+key+' core.slot of='+type+' key='+key+' kind='+spec.replace(/[!*]/,'')+
      (spec.endsWith('!')?' present=true':'')+(spec.endsWith('*')?' many=true':''));
  }
}
rows.push(`@std.placement.input std.placement.contribution candidate=?trial evaluator=?metric value=?v
@std.placement.output std.objective.measurement candidate=?trial evaluator=?metric value=?v
@std.placement.score core.rule when=$std.placement.input then=$std.placement.output`);
export const placementContract = {text: rows.join('\n'), fns:{}};
