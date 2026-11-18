// Bounded rectangular placement. Domain worlds supply directional relationships,
// geometry and applicability rules, observation ownership, native fields and goals.
import { quote, str, serialize } from './parser.mjs';
import { evaluateObjective } from './objective.mjs';

const fields = ['instance','revision','frame','scope'];
const get = (w,k) => w?.attrs[k]?.[0];
const ref = (w,k) => get(w,k)?.slice(1);
const literal = (w,k) => str(get(w,k));
const attrs = entries => Object.fromEntries(Object.entries(entries).filter(([,v])=>v!==undefined).map(([k,v])=>[k,Array.isArray(v)?v:[String(v)]]));
const wire = (id,type,values) => ({id,type,attrs:attrs(values)});
const scopeOf = w => Object.fromEntries(fields.map(k=>[k,get(w,k)]));
const sameScope = (a,b) => fields.every(k=>literal(a,k)===literal(b,k));
const one = rows => rows.length===1 ? rows[0] : undefined;
const number = (w,k) => Number(get(w,k));
const entity = w => get(w,'entity');
const fieldsMatch = (fact, criteria) => Object.entries(criteria).every(([k,v])=>get(fact,k)===v);
const validName = value => typeof value==='string' && /^[A-Za-z_][\w-]*(?:\.[\w-]+)*$/.test(value);
const LIMIT = 128;

function geometry(box) {
  const x=number(box,'min_x'), y=number(box,'min_y');
  const width=number(box,'max_x')-x, height=number(box,'max_y')-y;
  return [x,y,width,height].every(Number.isFinite) && width>0 && height>0 ? {x,y,width,height} : null;
}
function observed(world, method, context) {
  const byEntity=new Map(), boxType=get(method,'boxType');
  for (const identity of world.ofType('std.placement.identity')) {
    const box=world.get(ref(identity,'box'));
    if (!box || box.type!==boxType || !sameScope(box,context)) continue;
    const id=literal(box,'entity'), source=literal(identity,'source'), container=literal(identity,'container');
    const peer=get(identity,'peer')==='true', previous=byEntity.get(id);
    if (previous && (previous.box.id!==box.id || previous.source!==source || previous.container!==container || previous.peer!==peer)) return null;
    const entry=previous ?? {box,source,container,peer,concepts:new Set(),names:new Set(),geometry:geometry(box)};
    for (const concept of identity.attrs.concept??[]) entry.concepts.add(concept);
    if (get(identity,'name')!==undefined) entry.names.add(literal(identity,'name'));
    byEntity.set(id,entry);
  }
  return [...byEntity.values()];
}
function matches(object,target) {
  return object.concepts.has(get(target,'kind')) && (get(target,'name')===undefined ||
    object.names.has(literal(target,'name')) || literal(object.box,'entity')===literal(target,'name'));
}
function position(direction,anchor,size,gap) {
  const axis=(key,extent) => anchor[key]+anchor[extent]*number(direction,'anchor_'+key)-
    size[extent]*number(direction,'subject_'+key)+gap*number(direction,'gap_'+key);
  return {x:axis('x','width'),y:axis('y','height'),...size};
}
function trialFailure(result) {
  const violations=result.violations??[];
  if (violations.some(v=>v.kind==='budget')) return 'budget';
  if (violations.length && violations.every(v=>v.kind==='deny')) return 'hard-condition';
  return 'invalid-trial';
}
function perform(world, request, nodes, context, method) {
  const options=[], unavailable=reason=>({reason,options});
  const targets=nodes.filter(w=>w.type==='std.request.target');
  const relation=one(nodes.filter(w=>w.type==='std.request.constraint'));
  if (!relation ||
      nodes.some(w=>!['std.request','std.request.source','std.request.target','std.request.constraint'].includes(w.type)) ||
      targets.length!==2 || targets.some(t=>t.attrs.selector) || get(request,'mood')!=='do' ||
      get(relation,'operator')!=='relation' || get(relation,'polarity')!=='positive' ||
      ['from','to','unit','measure','anchor','baseline','phase'].some(k=>relation.attrs[k])) return unavailable('request-shape');
  const subject=targets.find(t=>t.id===ref(relation,'target')), anchorTarget=targets.find(t=>t.id===ref(relation,'goal'));
  if (!subject || !anchorTarget || subject===anchorTarget || get(anchorTarget,'mode')!=='existing' ||
      !['existing','new'].includes(get(subject,'mode'))) return unavailable('request-targets');
  const creation=get(subject,'mode')==='new';
  if (creation && get(subject,'name')!==undefined) return unavailable('unbound-name');
  const kinds=world.ofType('std.placement.kind').filter(k=>get(k,'concept')===get(subject,'kind') &&
    get(world.get(ref(k,'binding')),'act')===get(request,'act'));
  const kind=one(kinds), tool=kind && world.get(ref(kind,'binding'));
  if (!tool || (creation ? !get(tool,'kindKey') : !get(tool,'idsKey'))) return unavailable('tool-binding');
  const rows=observed(world,method,context);
  if (!rows || rows.some(r=>r.peer&&!r.geometry)) return unavailable('incomplete-geometry');
  const anchors=rows.filter(o=>matches(o,anchorTarget));
  const subjects=creation?[null]:rows.filter(o=>matches(o,subject));
  if (!anchors.length || !subjects.length) return unavailable('unbound-target');
  const relName=get(relation,'relation'), directions=world.ofType(get(method,'directionType')).filter(d=>get(d,'relation')===relName);
  if (!directions.length) return unavailable('undeclared-relation');
  if (anchors.length*subjects.length*directions.length>LIMIT || rows.length>512) return unavailable('budget');
  const frameBounds=ref(context,'bounds') && world.get(ref(context,'bounds'));
  if (ref(context,'bounds') && (!frameBounds || !sameScope(frameBounds,context)||!geometry(frameBounds))) return unavailable('invalid-frame');
  const objectiveId=ref(method,'objective'), objective=world.get(objectiveId);
  if (!objective) return unavailable('missing-objective');
  const costs=[];
  for (const termRef of objective.attrs.term??[]) {
    const term=world.get(termRef.slice(1));
    if (!term || number(term,'weight')===0) continue;
    const evaluator=get(term,'evaluator');
    const cost=one(world.ofType('std.placement.cost').filter(c=>ref(c,'evaluator')===evaluator));
    if (!cost) return unavailable('missing-cost-binding');
    if (!costs.some(c=>c.evaluator===evaluator)) costs.push({metric:get(cost,'metric'),evaluator});
  }
  if (!costs.length) return unavailable('empty-objective');
  const metadata=scopeOf(context);
  const basePolicies=world.ofType(get(method,'policyType'));
  const trials=[];
  let serial=0;
  for (const anchor of anchors) for (const moving of subjects) {
    if (anchor===moving) continue;
    if (!anchor.geometry || moving && !moving.geometry) return unavailable('incomplete-geometry');
    if (moving ? moving.container!==anchor.container : anchor.container!==literal(context,'container') && !get(tool,'containerKey')) continue;
    const size=moving?{width:moving.geometry.width,height:moving.geometry.height}:{width:number(kind,'width'),height:number(kind,'height')};
    if (![size.width,size.height].every(n=>Number.isFinite(n)&&n>0)) return unavailable('unknown-extent');
    const model=world.fork(), subjectEntity=moving?entity(moving.box):quote('compiled.proposal');
    if (!moving && rows.some(row=>entity(row.box)===subjectEntity)) return unavailable('identity-conflict');
    const pairs=[], knownPairs=new Set();
    const relationRows=world.ofType(get(method,'relationType')).filter(w=>sameScope(w,context));
    function addPair(other,relationKind,evidence) {
      const object=entity(other), key=JSON.stringify([subjectEntity,object,relationKind]);
      if (knownPairs.has(key)) return;
      knownPairs.add(key);
      const pair={subject:subjectEntity,object,kind:relationKind,...(evidence?{evidence}:{})};
      pairs.push(pair);
    }
    addPair(anchor.box,relName);
    for (const other of rows) if (other!==moving && other.peer && other.container===anchor.container) addPair(other.box,get(method,'peerRelation'));
    if (frameBounds) {
      if (!get(method,'containRelation') || !get(method,'containEvidence')) return unavailable('missing-containment-policy');
      addPair(frameBounds,get(method,'containRelation'),get(method,'containEvidence'));
    }
    const relationWires=pairs.filter(pair=>!relationRows.some(w=>fieldsMatch(w,pair))).map((pair,i)=>
      wire('placement.pair.'+i,get(method,'relationType'),{...metadata,...pair}));
    if (relationWires.some(r=>model.has(r.id))) return unavailable('identity-conflict');
    const loaded=model.tell(relationWires,{factsOnly:true});
    if (!loaded.ok) return unavailable(trialFailure(loaded));
    const policies=model.ofType(get(method,'effectiveType')).filter(w=>sameScope(w,context));
    const gap=one(policies.filter(w=>fieldsMatch(w,{...pairs[0],metric:get(method,'gapMetric')})));
    if (!gap || !Number.isFinite(number(gap,'clearance'))) return unavailable('missing-gap-policy');
    for (const direction of directions) {
      const id='placement.option.'+(++serial), p=position(direction,anchor.geometry,size,number(gap,'clearance'));
      const originX=number(kind,'originX'), originY=number(kind,'originY');
      const x=p.x+p.width*(Number.isFinite(originX)?originX:number(tool,'originX'));
      const y=p.y+p.height*(Number.isFinite(originY)?originY:number(tool,'originY'));
      if (![x,y,p.x,p.y].every(Number.isFinite)) return unavailable('invalid-coordinates');
      const option={id,anchor,moving,direction,x,y,bounds:p,evidence:[],status:'feasible'};
      options.push(option);
      const trial=model.fork();
      const boxAttrs={min_x:p.x,min_y:p.y,max_x:p.x+p.width,max_y:p.y+p.height};
      const admission=moving?trial.revise(moving.box.id,boxAttrs):trial.tell([
        wire('placement.proposed.box',get(method,'boxType'),{...metadata,entity:subjectEntity,evidence:'bounds',...boxAttrs})],{factsOnly:true});
      if (!admission.ok) {
        option.reason=trialFailure(admission);
        if (option.reason!=='hard-condition') return unavailable(option.reason);
        const seen=new Set();
        for (const violation of admission.violations) for (const fact of violation.involved??[]) {
          if (fact.type===get(method,'measurementType') && sameScope(fact,context) && !seen.has(fact.id)) {
            option.evidence.push(fact);
            seen.add(fact.id);
          }
        }
        option.status='rejected'; continue;
      }
      const measurements=trial.ofType(get(method,'measurementType')).filter(w=>sameScope(w,context));
      const totals=new Map();
      for (const pair of pairs) {
        const expected=basePolicies.filter(rule=>get(rule,'relation')===pair.kind);
        if (!expected.length) return unavailable('missing-relation-policy');
        for (const rule of expected) {
          const metric=get(rule,'metric'), m=one(measurements.filter(w=>fieldsMatch(w,{subject:pair.subject,object:pair.object,kind:pair.kind,metric})));
          if (!m || !Number.isFinite(number(m,'value')) || !Number.isFinite(number(m,'weight'))) return unavailable('missing-measurement');
          option.evidence.push(m);
          if (get(m,'hard')==='true' && number(m,'value')>0) { option.status='rejected'; option.reason='hard-condition'; }
          totals.set(metric,(totals.get(metric)??0)+number(m,'value')*number(m,'weight'));
        }
      }
      if (option.status==='rejected') continue;
      totals.set('rank',number(direction,'rank'));
      const contributions=[];
      for (const {metric,evaluator} of costs) {
        if (!totals.has(metric) && !basePolicies.some(policy=>get(policy,'metric')===metric)) return unavailable('unknown-metric');
        contributions.push(wire('placement.cost.'+contributions.length,'std.placement.contribution',
          {candidate:'$'+id,evaluator:'$'+evaluator,value:totals.get(metric)??0}));
      }
      trials.push({id,wires:serialize(contributions)});
    }
  }
  if (!trials.length) return unavailable('no-feasible-placement');
  const ranking=evaluateObjective(world,objectiveId,trials);
  if (ranking.status!=='optimal') return unavailable(ranking.status);
  for (const item of ranking.ranked) options.find(o=>o.id===item.id).vector=item.vector;
  const chosen=options.find(o=>o.id===ranking.best[0].id);
  const args=Object.create(null);
  const put=(key,value)=>{if (!validName(key)||Object.hasOwn(args,key)) return false;args[key]=value;return true;};
  for (const arg of world.ofType('std.placement.argument').filter(w=>ref(w,'binding')===kind.id)) {
    if (!put(get(arg,'key'),get(arg,'value'))) return unavailable('argument-collision');
  }
  if (!put(get(tool,'xKey'),String(chosen.x)) || !put(get(tool,'yKey'),String(chosen.y)) ||
      !(creation?put(get(tool,'kindKey'),quote(literal(kind,'native'))):put(get(tool,'idsKey'),quote(literal(chosen.moving.box,'entity'))))) return unavailable('argument-collision');
  if (creation && get(tool,'containerKey') && !put(get(tool,'containerKey'),quote(chosen.anchor.container))) return unavailable('argument-collision');
  const operation=get(tool,'operation');
  if (!validName(operation)) return unavailable('invalid-operation');
  return {chosen,options,call:wire('placement.call',operation,args)};
}

export function placementCircuit(world,request,nodes,context) {
  const methods=world.ofType('std.placement.method');
  const result=methods.length===1?perform(world,request,nodes,context,methods[0]):{reason:'method-binding',options:[]};
  const measurements=[];
  function evidenceRefs(option) {
    return option.evidence.map((measurement,index)=>{
      const id=option.id+'.measure.'+index;
      measurements.push({id,type:measurement.type,attrs:measurement.attrs});
      return '$'+id;
    });
  }
  const alternatives=result.options.map(o=>wire(o.id,'std.placement.option',{
    anchor:entity(o.anchor.box),source:quote(o.anchor.source),subject:o.moving&&entity(o.moving.box)||undefined,
    direction:get(o.direction,'name'),x:o.x,y:o.y,minX:o.bounds.x,minY:o.bounds.y,maxX:o.bounds.x+o.bounds.width,maxY:o.bounds.y+o.bounds.height,status:o.status,reason:o.reason,cost:o.vector?.map(String),evidence:evidenceRefs(o)}));
  const summary=wire('placement.result','std.placement.result',{...scopeOf(context),status:result.call?'compiled':'unavailable',
    reason:result.reason,call:result.call?'$'+result.call.id:undefined,choice:result.chosen?'$'+result.chosen.id:undefined,alternative:alternatives.map(w=>'$'+w.id)});
  return serialize([summary,...(result.call?[result.call]:[]),...alternatives,...measurements]);
}
