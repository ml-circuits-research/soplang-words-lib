// Bounded rectangular placement. Domain worlds supply directional relationships,
// geometry and applicability rules, observation ownership, native fields and goals.
import { parse, quote, str, serialize } from './parser.mjs';
import { solveProblem, readProblem, violation, PREDICATES } from './problem.mjs';
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
// The method's predicates that hold in this context: one declared flow= holds only when the context observes that flow
// (the container's declared reading direction: "after" is right of the anchor in a left-to-right flow, below it in a
// downward one).
const predicatesOf = (world, method, context) => world.ofType('std.placement.predicate')
  .filter(p => ref(p, 'method') === method.id && (get(p, 'flow') === undefined || literal(p, 'flow') === literal(context, 'flow')));
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
// A direction's slot (the declared position at the clearance) as a std.problem: on the relation's axis the subject
// stays at the slot (the declared clearance), across it the subject may move along the anchor's side (its centre
// within the anchor's extent) to keep apart from the observed peers (soft, the peer predicate), at a soft cost per
// unit of distance from the declared alignment (the relation's alignWeight, 1 by default), on the frame (hard).
// The grid of the free coordinate passes through the slot, so an unobstructed subject lands on it exactly.
function slotProblem({slot,direction,anchor,frame,peers,peerDecl,alignWeight,grid,avoided=[]}) {
  const gx=number(direction,'gap_x'), gy=number(direction,'gap_y'), lines=[], refs={var:[],box:[],constraint:[]};
  const add=(kind,id,text)=>{lines.push('@'+id+' std.problem.'+kind+' '+text);refs[kind].push('$'+id);};
  const n=v=>String(+(+v).toFixed(6));
  const free=(axis,start,extent,lo,hi)=>{ // the slot's coordinate on a free axis, on a grid through it
    const at=slot[axis], low=Math.max(lo,anchor[start]-slot[extent]/2), high=Math.min(hi,anchor[start]+anchor[extent]-slot[extent]/2);
    if (!(low<=at&&at<=high)) return `min=${n(at)} max=${n(at)}`;
    return `min=${n(at-Math.floor((at-low)/grid)*grid)} max=${n(at+Math.floor((high-at)/grid)*grid)} step=${n(grid)}`;
  };
  const fx=frame?[frame.x,frame.x+frame.width-slot.width]:[-Infinity,Infinity], fy=frame?[frame.y,frame.y+frame.height-slot.height]:[-Infinity,Infinity];
  // The axis the direction moves along stays at the declared slot; when the subject's kind keeps out of observed
  // regions (avoided) and the slot meets one, it may also move further away from the anchor, on the grid, as far as
  // clearing those regions needs, a soft cost pulling it back to the slot: the search steers around a region instead
  // of rejecting the direction.
  // Only as far as clearing the avoided regions the declared slot meets needs (the slot itself when it meets none).
  const away=(axis,g,extent,lo,hi)=>{
    const at=slot[axis], cross=axis==='x'?['y','height']:['x','width'];
    const meets=avoided.filter(r=>r[axis]<at+slot[extent]&&at<r[axis]+r[extent]&&r[cross[0]]<slot[cross[0]]+slot[cross[1]]&&slot[cross[0]]<r[cross[0]]+r[cross[1]]);
    if (!meets.length || g===0) return `min=${n(at)} max=${n(at)}`;
    const need=g>0?Math.max(...meets.map(r=>r[axis]+r[extent]-at)):Math.max(...meets.map(r=>at+slot[extent]-r[axis]));
    const far=g>0?Math.min(Number.isFinite(hi)?hi:Infinity,at+need):Math.max(Number.isFinite(lo)?lo:-Infinity,at-need);
    const steps=Math.ceil(Math.abs(far-at)/grid);
    if (!(steps>=1)) return `min=${n(at)} max=${n(at)}`;
    return g>0?`min=${n(at)} max=${n(Math.min(at+steps*grid,Number.isFinite(hi)?hi:Infinity))} step=${n(grid)}`:`min=${n(Math.max(at-steps*grid,Number.isFinite(lo)?lo:-Infinity))} max=${n(at)} step=${n(grid)}`;
  };
  add('var','vx',gx!==0||gy===0?'name=x '+away('x',gx,'width',...fx):'name=x '+free('x','x','width',...fx));
  add('var','vy',gy!==0||gx===0?'name=y '+away('y',gy,'height',...fy):'name=y '+free('y','y','height',...fy));
  add('box','subject',`name=subject x=x y=y w=${n(slot.width)} h=${n(slot.height)}`);
  add('box','slot',`name=slot x=${n(slot.x)} y=${n(slot.y)} w=${n(slot.width)} h=${n(slot.height)}`);
  add('constraint','align',`name=align predicate=align a=subject b=slot axis=${gx!==0?'y':'x'} edge=0.5 strength=soft weight=${n(alignWeight)}`);
  if (frame) { add('box','frame',`name=frame x=${n(frame.x)} y=${n(frame.y)} w=${n(frame.width)} h=${n(frame.height)}`); add('constraint','contain','name=contain predicate=inside a=subject b=frame strength=hard'); }
  if (avoided.length && (gx!==0||gy!==0)) add('constraint','close',`name=close predicate=align a=subject b=slot axis=${gx!==0?'x':'y'} edge=0.5 strength=soft weight=${n(alignWeight)}`);
  avoided.forEach((r,i)=>{
    add('box','avoid'+i,`name=avoid${i} x=${n(r.x)} y=${n(r.y)} w=${n(r.width)} h=${n(r.height)}`);
    add('constraint','keepout'+i,`name=keepout${i} predicate=apart a=subject b=avoid${i} gap=0 strength=hard`);
  });
  peers.forEach((peer,i)=>{
    add('box','peer'+i,`name=peer${i} x=${n(peer.x)} y=${n(peer.y)} w=${n(peer.width)} h=${n(peer.height)}`);
    add('constraint','apart'+i,`name=apart${i} predicate=${get(peerDecl,'predicate')??'apart'} a=subject b=peer${i} gap=${n(peer.gap??(number(peerDecl,'gap')||0))} strength=soft weight=${n(Number.isFinite(number(peerDecl,'weight'))?number(peerDecl,'weight'):100)}`);
  });
  return `@problem std.problem.request budget=2000 ${[...refs.var.map(r=>'var='+r),...refs.box.map(r=>'box='+r),...refs.constraint.map(r=>'constraint='+r)].join(' ')}\n${lines.join('\n')}`;
}
// The fallback shift: the closest place on the stated side when the declared slot leaves the frame (an anchor at the
// page edge) or meets a region the subject avoids. On the direction's axis the subject may come in from the slot
// (clamped to the frame) toward the anchor while its centre stays at least one unit on the stated side of the
// anchor's centre; across it the subject may move over the whole frame; it keeps the clearance from the anchor and
// out of the avoided regions (hard), apart from the peers (soft), and soft terms pull it back to the declared slot on
// both axes. Null when no such place exists (the subject is wider than the room on that side of the anchor's centre).
function shiftProblem({slot,direction,anchor,frame,peers,peerDecl,alignWeight,grid,avoided=[],clearance=0}) {
  const gx=number(direction,'gap_x'), gy=number(direction,'gap_y');
  if (!frame || (gx===0)===(gy===0)) return null;
  const [axis,extent,cross,crossExtent,sign]=gx!==0?['x','width','y','height',Math.sign(gx)]:['y','height','x','width',Math.sign(gy)];
  const n=v=>String(+(+v).toFixed(6)), lines=[], refs={var:[],box:[],constraint:[]};
  const add=(kind,id,text)=>{lines.push('@'+id+' std.problem.'+kind+' '+text);refs[kind].push('$'+id);};
  const lo=frame[axis], hi=frame[axis]+frame[extent]-slot[extent], clo=frame[cross], chi=frame[cross]+frame[crossExtent]-slot[crossExtent];
  if (hi<lo || chi<clo) return null;
  const centre=anchor[axis]+anchor[extent]/2, at=Math.min(hi,Math.max(lo,slot[axis]));
  let along;
  if (sign<0) { const top=Math.min(hi,centre-slot[extent]/2-1); if (top<at) return null; along=`min=${n(at)} max=${n(at+Math.floor((top-at)/grid)*grid)}`; }
  else { const bottom=Math.max(lo,centre-slot[extent]/2+1); if (bottom>at) return null; along=`min=${n(at-Math.floor((at-bottom)/grid)*grid)} max=${n(at)}`; }
  const c=Math.min(chi,Math.max(clo,slot[cross])), across=`min=${n(c-Math.floor((c-clo)/grid)*grid)} max=${n(c+Math.floor((chi-c)/grid)*grid)}`;
  add('var','v'+axis,`name=${axis} ${along} step=${n(grid)}`);
  add('var','v'+cross,`name=${cross} ${across} step=${n(grid)}`);
  add('box','subject',`name=subject x=x y=y w=${n(slot.width)} h=${n(slot.height)}`);
  add('box','slot',`name=slot x=${n(slot.x)} y=${n(slot.y)} w=${n(slot.width)} h=${n(slot.height)}`);
  add('box','anchor',`name=anchor x=${n(anchor.x)} y=${n(anchor.y)} w=${n(anchor.width)} h=${n(anchor.height)}`);
  add('box','frame',`name=frame x=${n(frame.x)} y=${n(frame.y)} w=${n(frame.width)} h=${n(frame.height)}`);
  add('constraint','contain','name=contain predicate=inside a=subject b=frame strength=hard');
  add('constraint','clear',`name=clear predicate=apart a=subject b=anchor gap=${n(clearance)} strength=hard`);
  add('constraint','along',`name=along predicate=align a=subject b=slot axis=${axis} edge=0.5 strength=soft weight=${n(alignWeight)}`);
  add('constraint','across',`name=across predicate=align a=subject b=slot axis=${cross} edge=0.5 strength=soft weight=${n(alignWeight)}`);
  avoided.forEach((r,i)=>{
    add('box','avoid'+i,`name=avoid${i} x=${n(r.x)} y=${n(r.y)} w=${n(r.width)} h=${n(r.height)}`);
    add('constraint','keepout'+i,`name=keepout${i} predicate=apart a=subject b=avoid${i} gap=0 strength=hard`);
  });
  peers.forEach((peer,i)=>{
    add('box','peer'+i,`name=peer${i} x=${n(peer.x)} y=${n(peer.y)} w=${n(peer.width)} h=${n(peer.height)}`);
    add('constraint','apart'+i,`name=apart${i} predicate=${get(peerDecl,'predicate')??'apart'} a=subject b=peer${i} gap=${n(peer.gap??(number(peerDecl,'gap')||0))} strength=soft weight=${n(Number.isFinite(number(peerDecl,'weight'))?number(peerDecl,'weight'):100)}`);
  });
  return `@problem std.problem.request budget=2000 ${[...refs.var.map(r=>'var='+r),...refs.box.map(r=>'box='+r),...refs.constraint.map(r=>'constraint='+r)].join(' ')}\n${lines.join('\n')}`;
}
const then=(value,next)=>value&&typeof value.then==='function'?value.then(next):next(value);
const settleAll=(values,next)=>values.some(v=>v&&typeof v.then==='function')?Promise.all(values).then(next):next(values);

function perform(world, request, nodes, context, method, provider, solve=false) {
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
  const trials=[], jobs=[];
  let serial=0;
  const declared=predicatesOf(world,method,context);
  const relationDecl=one(declared.filter(p=>get(p,'relation')===relName&&get(p,'region')===undefined));
  const peerDecl=one(declared.filter(p=>get(p,'relation')===get(method,'peerRelation')&&get(p,'region')===undefined));
  const grid=Number.isFinite(number(method,'grid'))?number(method,'grid'):Math.max(1,Math.min(...(frameBounds?[geometry(frameBounds).width,geometry(frameBounds).height]:[400]))/40);
  // The observed regions the subject's kind keeps out of (std.placement.kind avoids=: the water of a river for a house).
  const avoids=new Set((kind.attrs.avoids??[]).map(raw=>raw.startsWith('"')?str(raw):raw));
  const avoided=avoids.size?regionsOf(world,context).filter(r=>avoids.has(r.kind)&&r.geometry):[];
  const frame=frameBounds&&geometry(frameBounds), contexts=[];
  const alignWeight=Number.isFinite(number(relationDecl,'alignWeight'))?number(relationDecl,'alignWeight'):1;
  // One place to try: a direction's slot for a subject of a size (the declared slot problem, or the shift problem of
  // a fallback); a fallback's place is always searched.
  const job=(ctx,direction,size,fallback)=>{
    const slot=position(direction,ctx.anchor.geometry,size,ctx.clearance);
    const spec={slot,direction,anchor:ctx.anchor.geometry,frame,peers:ctx.peers,peerDecl,alignWeight,grid,avoided:avoided.map(r=>r.geometry),clearance:ctx.clearance};
    const text=fallback?.shift?shiftProblem(spec):(solve||fallback)?slotProblem(spec):null;
    return {...ctx,direction,slot,drawn:fallback?.drawn,fallback:fallback?.stage,answer:text?solveProblem(text,{provider}):null};
  };
  for (const anchor of anchors) for (const moving of subjects) {
    if (anchor===moving) continue;
    if (!anchor.geometry || moving && !moving.geometry) return unavailable('incomplete-geometry');
    // The container the subject lies in: its own when it moves; for a new one the anchor's when the tool can make into
    // it (containerKey) or it is the context's, else the context's. An anchor inside a container the subject is not in
    // (a node inside a diagram group) is measured by its observed box; the subject keeps apart from its own peers.
    const home=moving?moving.container:(anchor.container===literal(context,'container')||get(tool,'containerKey'))?anchor.container:literal(context,'container');
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
    for (const other of rows) if (other!==moving && other.peer && other.container===home) addPair(other.box,get(method,'peerRelation'));
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
    // The peers to keep apart from, each at the largest clearance the domain world gives that pair (its spacing profile).
    const peers=rows.filter(o=>o!==moving&&o!==anchor&&o.peer&&o.geometry&&o.container===home).map(o=>{
      const kept=policies.filter(w=>fieldsMatch(w,{subject:subjectEntity,object:entity(o.box),kind:get(method,'peerRelation')})).map(w=>number(w,'clearance')).filter(Number.isFinite);
      return {...o.geometry,gap:kept.length?Math.max(...kept):undefined};
    });
    const ctx={anchor,moving,model,pairs,subjectEntity,peers,size,clearance:number(gap,'clearance')};
    contexts.push(ctx);
    for (const direction of directions) jobs.push(job(ctx,direction,size));
  }
  // Phase two: each direction's place (the solved one, or the declared slot when the problem has no solution, so
  // the trial below shows why) is admitted and measured by the domain world.
  let provided;
  function admit({anchor,moving,direction,slot,model,pairs,subjectEntity,drawn,fallback},answer) {
    const id='placement.option.'+(++serial);
    let p=slot;
    if (answer) {
      const rows=parse(answer), result=rows.find(w=>w.type==='std.problem.result');
      provided=get(result,'provider')??provided;
      if (get(result,'status')==='solved') {
        const value=Object.fromEntries(rows.filter(w=>w.type==='std.problem.assignment'&&(result.attrs.assignment??[]).includes('$'+w.id)).map(w=>[get(w,'var'),number(w,'value')]));
        p={...slot,x:value.x,y:value.y};
      } else if (fallback) return; // a fallback place the search cannot find offers nothing to show
    }
    const originX=number(kind,'originX'), originY=number(kind,'originY');
    const x=p.x+p.width*(Number.isFinite(originX)?originX:number(tool,'originX'));
    const y=p.y+p.height*(Number.isFinite(originY)?originY:number(tool,'originY'));
    if (![x,y,p.x,p.y].every(Number.isFinite)) return unavailable('invalid-coordinates');
    const option={id,anchor,moving,direction,x,y,bounds:p,evidence:[],status:'feasible',...(drawn!==undefined?{drawn}:{})};
    options.push(option);
    // A place inside a region the subject's kind avoids is rejected, whatever it costs otherwise.
    if (avoided.some(r=>p.x<r.geometry.x+r.geometry.width&&r.geometry.x<p.x+p.width&&p.y<r.geometry.y+r.geometry.height&&r.geometry.y<p.y+p.height)) {
      option.status='rejected'; option.reason='avoided-region'; return;
    }
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
      option.status='rejected'; return;
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
    if (option.status==='rejected') return;
    totals.set('rank',number(direction,'rank'));
    const contributions=[];
    for (const {metric,evaluator} of costs) {
      if (!totals.has(metric) && !basePolicies.some(policy=>get(policy,'metric')===metric)) return unavailable('unknown-metric');
      contributions.push(wire('placement.cost.'+contributions.length,'std.placement.contribution',
        {candidate:'$'+id,evaluator:'$'+evaluator,value:totals.get(metric)??0}));
    }
    trials.push({id,wires:serialize(contributions)});
  }
  function finish(fallback) {
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
    if (chosen.drawn!==undefined && !put(get(tool,'sizeKey'),String(chosen.drawn))) return unavailable('argument-collision');
    if (creation && get(tool,'containerKey') && !put(get(tool,'containerKey'),quote(chosen.anchor.container))) return unavailable('argument-collision');
    const operation=get(tool,'operation');
    if (!validName(operation)) return unavailable('invalid-operation');
    return {chosen,options,call:wire('placement.call',operation,args),...(provided?{provider:provided}:{}),...(fallback?{fallback}:{})};
  }
  // Admit a stage's places; the best feasible one wins, else the next stage.
  const run=(list,stage,next)=>settleAll(list.map(j=>j.answer),(answers)=>{
    for (const [k,j] of list.entries()) { const fatal=admit(j,answers[k]); if (fatal) return fatal; }
    return trials.length?finish(stage):next();
  });
  // When no declared place on the stated side is feasible (it leaves the frame, or meets a region the subject
  // avoids), the method's declared fallbacks are tried in their declared order, each solved as std.problem, and the
  // result names the one used (fallback=):
  // - shrink: the subject drawn smaller, at its declared slots, in steps (shrinkStep, 0.1 by default) down to the
  //   declared minimum share (minShare) of its size, when its tool can say a size (sizeKey) and it is new;
  // - shift: the closest place whose centre stays on the stated side of the anchor's centre (shiftProblem);
  // - side: the declared directions of another relation (fallbackDirections, near: the other sides of the anchor),
  //   in their declared rank, at the same clearance.
  const stages=(method.attrs.fallback??[]).map(v=>v.startsWith('"')?str(v):v);
  function fallback(i) { // bounded: one call per declared fallback stage
    if (i>=stages.length) return unavailable('no-feasible-placement');
    const stage=stages[i], next=()=>fallback(i+1);
    if (stage==='shift') return run(contexts.flatMap(c=>directions.map(d=>job(c,d,c.size,{stage,shift:true}))).filter(j=>j.answer),stage,next);
    if (stage==='side') {
      const others=world.ofType(get(method,'directionType')).filter(d=>get(d,'relation')===get(method,'fallbackDirections')&&
        !directions.some(s=>get(s,'name')===get(d,'name'))).sort((a,b)=>number(a,'rank')-number(b,'rank'));
      return run(contexts.flatMap(c=>others.map(d=>job(c,d,c.size,{stage}))),stage,next);
    }
    if (stage==='shrink') {
      const least=number(method,'minShare'), by=number(method,'shrinkStep')>0?Math.max(0.05,number(method,'shrinkStep')):0.1;
      if (!creation || !get(tool,'sizeKey') || !(least>0&&least<1)) return next();
      const shares=[];
      for (let k=1; 1-k*by>=least-1e-9; k++) shares.push(1-k*by);
      const attempt=k=>k>=shares.length // bounded: one call per share (shrinkStep is at least 0.05: at most 20)
        ?next():run(contexts.flatMap(c=>{
        const side=Math.max(c.size.width,c.size.height), drawn=Math.max(1,Math.floor(side*shares[k]));
        const size={width:c.size.width*drawn/side,height:c.size.height*drawn/side};
        return directions.map(d=>job(c,d,size,{stage,drawn}));
      }),stage,()=>attempt(k+1));
      return attempt(0);
    }
    return unavailable('unknown-fallback');
  }
  return run(jobs,undefined,()=>fallback(0));
}

export function placementCircuit(world,request,nodes,context,provider) {
  const methods=world.ofType('std.placement.method');
  const method=methods.length===1?methods[0]:null;
  // A request with several relations or subjects, a relation with declared predicates but no declared directions,
  // with a declared fit, or whose declared region the anchor has, takes the general path. A method declared
  // search=problem solves every placement as std.problem: one relation with declared directions keeps its ranked
  // directions and clearance, each direction's place solved as its own problem (slotProblem); any other request takes
  // the general path.
  const relations=nodes.filter(w=>w.type==='std.request.constraint'&&get(w,'operator')==='relation');
  const search=get(method,'search')==='problem';
  const directed=relations.length===1&&world.ofType(get(method,'directionType')).some(d=>get(d,'relation')===get(relations[0],'relation'));
  const general=method&&((search&&!directed)||relations.length>1||nodes.filter(w=>w.type==='std.request.target').length>2||
    nodes.some(isCount)||relations.some(r=>needsProblem(world,method,context,nodes,r)));
  const result=!method?{reason:'method-binding',options:[]}:general?problemPlacement(world,request,nodes,context,method,provider):perform(world,request,nodes,context,method,provider,search);
  return result&&typeof result.then==='function'?result.then(r=>summarise(r,context)):summarise(result,context);
}

function needsProblem(world,method,context,nodes,relation) {
  const name=get(relation,'relation'), declared=predicatesOf(world,method,context).filter(p=>get(p,'relation')===name);
  if (!declared.length) return false;
  // Fitting a subject to its place is done only by the general path.
  if (declared.some(p=>get(p,'fit')!==undefined) || !world.ofType(get(method,'directionType')).some(d=>get(d,'relation')===name)) return true;
  const goal=nodes.find(w=>w.id===ref(relation,'goal')), rows=goal&&observed(world,method,context);
  if (!rows) return false;
  const entities=new Set(rows.filter(o=>matches(o,goal)).map(o=>literal(o.box,'entity')));
  return regionsOf(world,context).some(r=>entities.has(r.entity)&&declared.some(p=>get(p,'region')===r.kind));
}

// The regions of observed things (std.placement.region: a part of a thing's box where others go, such as the
// water of a lake or the surface of a table, with the kinds it usually holds), in the scope of the context.
function regionsOf(world,context) {
  return world.ofType('std.placement.region').filter(r=>fields.every(k=>r.attrs[k]===undefined||literal(r,k)===literal(context,k))).map(r=>{
    const x=number(r,'min_x'), y=number(r,'min_y'), width=number(r,'max_x')-x, height=number(r,'max_y')-y;
    return {entity:literal(r,'entity'),kind:get(r,'kind'),holds:(r.attrs.holds??[]).map(str),
      geometry:[x,y,width,height].every(Number.isFinite)&&width>=0&&height>=0?{x,y,width,height}:null};
  });
}

function summarise(result,context) {
  const measurements=[];
  function evidenceRefs(option) {
    return option.evidence.map((measurement,index)=>{
      const id=option.id+'.measure.'+index;
      measurements.push({id,type:measurement.type,attrs:measurement.attrs});
      return '$'+id;
    });
  }
  const calls=result.calls??(result.call?[result.call]:[]);
  const alternatives=result.options.map(o=>wire(o.id,'std.placement.option',{
    anchor:entity(o.anchor.box),source:quote(o.anchor.source),subject:o.moving&&entity(o.moving.box)||undefined,
    direction:get(o.direction,'name'),x:o.x,y:o.y,minX:o.bounds.x,minY:o.bounds.y,maxX:o.bounds.x+o.bounds.width,maxY:o.bounds.y+o.bounds.height,status:o.status,reason:o.reason,cost:o.vector?.map(String),evidence:evidenceRefs(o)}));
  const summary=wire('placement.result','std.placement.result',{...scopeOf(context),status:calls.length?'compiled':'unavailable',
    reason:result.reason,call:calls.map(c=>'$'+c.id),conflict:result.conflict,relaxed:result.relaxed,fallback:result.fallback,provider:result.provider,choice:result.chosen?'$'+result.chosen.id:undefined,alternative:alternatives.map(w=>'$'+w.id)});
  return serialize([summary,...calls,...alternatives,...measurements]);
}

// The general path: every relation of the request, every new or moved subject, the observed peers and the
// frame become one std.problem, solved together by the configured provider (the internal search, or Z3).
// Which predicate a relation means, its gap, strength and weight, the alignment it keeps (align, edge,
// alignWeight: a soft term), the region of the anchor it goes to (region, held) and the share of that place a
// subject may take (fit: a larger one is drawn smaller when the tool has a sizeKey) are std.placement.predicate
// facts of the method; nothing here names a relation.
// The directional predicates: the axis each measures its distance on, and the side of the anchor the subject is on.
const SIDE = { left: ['x', -1], right: ['x', 1], above: ['y', -1], below: ['y', 1] };
function problemPlacement(world, request, nodes, context, method, provider) {
  const unavailable = (reason, extra = {}) => ({ reason, options: [], ...extra });
  const targets = nodes.filter(w => w.type === 'std.request.target');
  const relations = nodes.filter(w => w.type === 'std.request.constraint' && get(w, 'operator') === 'relation');
  if (!relations.length || get(request, 'mood') !== 'do' || relations.some(r => get(r, 'polarity') !== 'positive') ||
      nodes.some(w => !['std.request', 'std.request.source', 'std.request.target', 'std.request.constraint'].includes(w.type)) ||
      nodes.some(w => w.type === 'std.request.constraint' && get(w, 'operator') !== 'relation' && !isCount(w))) return unavailable('request-shape');
  // A count on a new subject ("three houses near the lake") makes that many subjects, each with the subject's
  // relations, all in the one problem (kept apart from each other like peers).
  const counts = new Map();
  for (const c of nodes.filter(isCount)) {
    const n = Number(get(c, 'value')), target = targets.find(t => t.id === ref(c, 'target'));
    if (!Number.isInteger(n) || n < 1 || n > MAX_COUNT || !target || get(target, 'mode') !== 'new' || counts.has(target.id) || get(c, 'polarity') === 'negative') return unavailable('request-count');
    counts.set(target.id, n);
  }
  const rows = observed(world, method, context);
  if (!rows || rows.some(r => r.peer && !r.geometry)) return unavailable('incomplete-geometry');
  const frameBox = ref(context, 'bounds') && world.get(ref(context, 'bounds')), frame = frameBox && sameScope(frameBox, context) && geometry(frameBox);
  if (!frame) return unavailable('missing-frame');
  const declared = predicatesOf(world, method, context);
  const plain = (relation) => one(declared.filter(p => get(p, 'relation') === relation && get(p, 'region') === undefined));
  const regions = regionsOf(world, context);
  // The declaration a relation takes for its anchor and subject: one whose region the anchor has (holding the
  // subject's kind when it says held=true), in the order declared; else the one without a region.
  const declaration = (relation, anchorRow, native) => {
    for (const decl of declared.filter(p => get(p, 'relation') === relation && get(p, 'region') !== undefined)) {
      const region = regions.find(r => r.entity === literal(anchorRow.box, 'entity') && r.kind === get(decl, 'region') && r.geometry &&
        (get(decl, 'held') !== 'true' || r.holds.includes(native)));
      if (region) return { decl, region };
    }
    const decl = plain(relation);
    return decl ? { decl } : null;
  };
  const byId = new Map(targets.map(t => [t.id, t])), subjects = [], candidates = new Map();
  const name = (prefix, i) => prefix + i;
  for (const relation of relations) {
    const subject = byId.get(ref(relation, 'target')), goal = byId.get(ref(relation, 'goal'));
    if (!subject || !goal || subject === goal || get(goal, 'mode') !== 'existing') return unavailable('request-targets');
    if (!declared.some(p => get(p, 'relation') === get(relation, 'relation'))) return unavailable('undeclared-relation');
    // Every observed thing the goal may denote is a candidate anchor, most recent first.
    if (!candidates.has(goal.id)) {
      const matched = rows.filter(o => matches(o, goal) && o.geometry).reverse();
      if (!matched.length) return unavailable('unbound-target');
      candidates.set(goal.id, { rows: matched, box: name('anchor', candidates.size) });
    }
    if (!subjects.some(s => s.target === subject)) {
      const creation = get(subject, 'mode') === 'new';
      const kind = one(world.ofType('std.placement.kind').filter(k => get(k, 'concept') === get(subject, 'kind') && get(world.get(ref(k, 'binding')), 'act') === get(request, 'act')));
      const tool = kind && world.get(ref(kind, 'binding'));
      if (!tool || (creation ? !get(tool, 'kindKey') : !get(tool, 'idsKey'))) return unavailable('tool-binding');
      const moving = creation ? null : one(rows.filter(o => matches(o, subject)));
      if (!creation && !moving?.geometry) return unavailable('unbound-target');
      const size = moving ? { width: moving.geometry.width, height: moving.geometry.height } : { width: number(kind, 'width'), height: number(kind, 'height') };
      if (![size.width, size.height].every(n => Number.isFinite(n) && n > 0)) return unavailable('unknown-extent');
      for (let copy = 0; copy < (counts.get(subject.id) ?? 1); copy++) subjects.push({ target: subject, creation, kind, tool, moving, size, i: subjects.length, copy });
    }
  }
  if (subjects.length > 16 || rows.length > 512) return unavailable('budget');
  if (!get(method, 'containRelation') || !get(method, 'peerRelation') || !plain(get(method, 'containRelation')) || !plain(get(method, 'peerRelation'))) return unavailable('missing-relation-policy');
  // A goal that denotes several observed things ("the tree" with two trees) is tried with each of them: every
  // combination of candidate anchors, at most ANCHOR_COMBINATIONS, is its own problem.
  const goals = [...candidates.entries()];
  if (goals.reduce((n, [, c]) => n * c.rows.length, 1) > ANCHOR_COMBINATIONS) return unavailable('ambiguous-anchor');
  let combinations = [new Map()];
  for (const [id, c] of goals) combinations = combinations.flatMap(m => c.rows.map(row => new Map([...m, [id, { row, box: c.box }]])));
  const ambiguous = new Set(goals.filter(([, c]) => c.rows.length > 1).map(([id]) => id));
  const allSubjects = subjects;
  const prepare = (anchors) => {
  const subjects = allSubjects.map(x => ({ ...x, size: { ...x.size } }));
  // Each relation's declaration and the box it is measured against (the anchor's, or its region's).
  const uses = [];
  for (const relation of relations) for (const s of subjects.filter(x => x.target.id === ref(relation, 'target'))) {
    const a = anchors.get(ref(relation, 'goal'));
    const chosen = declaration(get(relation, 'relation'), a.row, literal(s.kind, 'native'));
    if (!chosen) return { failure: unavailable('undeclared-relation') };
    uses.push({ relation, s, a, ...chosen });
  }
  // A relation declared pair=sides ("between A and B") is said once for each of two anchors of one subject: from where
  // the anchors are, across the larger of their horizontal and vertical separations, the subject is on the side of each
  // anchor that faces the other (right of the first and left of the second, or below and above), each side measured
  // by the method's plain declaration of that directional predicate.
  for (const s of subjects) {
    const paired = uses.filter(u => u.s === s && get(u.decl, 'pair') === 'sides');
    if (!paired.length) continue;
    if (paired.length !== 2 || paired[0].a.row === paired[1].a.row) return { failure: unavailable('paired-relation-anchors') };
    const centre = (g) => [g.x + g.width / 2, g.y + g.height / 2], [ax, ay] = centre(paired[0].a.row.geometry), [bx, by] = centre(paired[1].a.row.geometry);
    const dx = bx - ax, dy = by - ay;
    const sides = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? ['right', 'left'] : ['left', 'right']) : (dy >= 0 ? ['below', 'above'] : ['above', 'below']);
    for (const [k, use] of paired.entries()) {
      const decl = one(declared.filter(p => get(p, 'predicate') === sides[k] && get(p, 'region') === undefined && get(p, 'pair') === undefined));
      if (!decl) return { failure: unavailable('paired-relation-sides') };
      use.decl = decl; delete use.region;
    }
  }
  // A subject larger than the declared share (fit) of the place it goes to is drawn smaller, when its tool can say
  // a size (sizeKey: the larger side of its box); its largest side stays a whole number.
  for (const s of subjects) {
    if (!get(s.tool, 'sizeKey') || s.moving) continue;
    let scale = 1;
    for (const use of uses.filter(u => u.s === s && Number.isFinite(number(u.decl, 'fit')))) {
      const fit = number(use.decl, 'fit'), place = use.region?.geometry ?? use.a.row.geometry;
      if (place.width > 0) scale = Math.min(scale, fit * place.width / s.size.width);
      if (place.height > 0) scale = Math.min(scale, fit * place.height / s.size.height);
    }
    if (scale >= 1) continue;
    const side = Math.max(s.size.width, s.size.height), drawn = Math.max(1, Math.floor(side * scale));
    s.size = { width: s.size.width * drawn / side, height: s.size.height * drawn / side };
    s.drawn = drawn;
  }
  const grid = Number.isFinite(number(method, 'grid')) ? number(method, 'grid') : Math.max(1, Math.min(frame.width, frame.height) / 40);
  // The packet of the declared problem; relaxed, the distance bound (gap) of each relation whose predicate has a
  // gap-free core (PREDICATES[p].core: left without its bound, apart for near) becomes a soft term over that core.
  const build = (relaxed) => {
  const lines = [], refs = { var: [], box: [], constraint: [] }, softened = [];
  const add = (kind, id, text) => { lines.push('@' + id + ' std.problem.' + kind + ' ' + text); refs[kind].push('$' + id); };
  const fixed = (id, g) => add('box', id, `name=${id} x=${g.x} y=${g.y} w=${g.width} h=${g.height}`);
  fixed('frame', frame);
  for (const s of subjects) {
    add('var', 'vx' + s.i, `name=x${s.i} min=${frame.x} max=${frame.x + frame.width - s.size.width} step=${grid}`);
    add('var', 'vy' + s.i, `name=y${s.i} min=${frame.y} max=${frame.y + frame.height - s.size.height} step=${grid}`);
    add('box', 'subject' + s.i, `name=subject${s.i} x=x${s.i} y=y${s.i} w=${s.size.width} h=${s.size.height}`);
  }
  for (const a of anchors.values()) fixed(a.box, a.row.geometry);
  const constraint = (id, decl, a, b) => {
    const gap = get(decl, 'gap'), strength = get(decl, 'strength') ?? 'hard', weight = get(decl, 'weight'), share = get(decl, 'share');
    add('constraint', id, `name=${id} predicate=${get(decl, 'predicate')} a=${a} b=${b}${gap !== undefined ? ' gap=' + gap : ''}${share !== undefined ? ' share=' + share : ''} strength=${strength}${weight !== undefined ? ' weight=' + weight : ''}`);
  };
  uses.forEach((use, n) => {
    let target = use.a.box;
    const place = use.region?.geometry ?? use.a.row.geometry;
    if (use.region) { target = 'region' + n; fixed(target, use.region.geometry); }
    // clearance: a directional relation keeps at least that distance from its anchor: it is measured against the
    // anchor grown by the clearance, and its declared gap (the most) counts from the anchor itself.
    const side = SIDE[get(use.decl, 'predicate')], clearance = side && number(use.decl, 'clearance') > 0 ? number(use.decl, 'clearance') : 0;
    let decl = use.decl, measured = target;
    if (clearance) {
      measured = 'clear' + n;
      fixed(measured, { x: place.x - clearance, y: place.y - clearance, width: place.width + 2 * clearance, height: place.height + 2 * clearance });
      const gap = get(use.decl, 'gap');
      decl = { ...use.decl, attrs: { ...use.decl.attrs, ...(gap !== undefined ? { gap: [String(Math.max(0, Number(gap) - clearance))] } : {}) } };
    }
    const core = PREDICATES[get(decl, 'predicate')]?.core;
    const soften = relaxed && core && get(decl, 'gap') !== undefined && (get(decl, 'strength') ?? 'hard') === 'hard';
    if (soften) {
      add('constraint', 'relation' + n, `name=relation${n} predicate=${core} a=subject${use.s.i} b=${measured} strength=hard`);
      add('constraint', 'bound' + n, `name=bound${n} predicate=${get(decl, 'predicate')} a=subject${use.s.i} b=${measured} gap=${get(decl, 'gap')} strength=soft weight=${get(decl, 'relaxWeight') ?? 1}`);
      softened.push({ name: 'bound' + n, relation: get(use.relation, 'relation') });
    } else constraint('relation' + n, decl, 'subject' + use.s.i, measured);
    // pull: a soft term that keeps the subject close to its anchor along the relation's direction: its distance
    // from the slot at the clearance (left of the anchor: ending the clearance before it), at the declared weight per
    // unit of distance. The cost is never negative and does not depend on where the anchor is, so placements
    // against different candidate anchors compare by closeness.
    // A relation whose distance bound is softened (relax=gap) is already drawn toward its anchor by that bound.
    const pull = number(use.decl, 'pull');
    if (pull > 0 && side && !soften) {
      const [axis, sign] = side, size = axis === 'x' ? use.s.size.width : use.s.size.height, start = axis === 'x' ? place.x : place.y, extent = axis === 'x' ? place.width : place.height;
      const at = sign < 0 ? start - clearance - size : start + extent + clearance;
      fixed('slot' + n, axis === 'x' ? { x: at, y: place.y, width: use.s.size.width, height: use.s.size.height } : { x: place.x, y: at, width: use.s.size.width, height: use.s.size.height });
      add('constraint', 'pull' + n, `name=pull${n} predicate=align a=subject${use.s.i} b=slot${n} axis=${axis} edge=0 strength=soft weight=${pull}`);
    }
    const axis = get(use.decl, 'align');
    if (axis) add('constraint', 'align' + n, `name=align${n} predicate=align a=subject${use.s.i} b=${target} axis=${axis} edge=${get(use.decl, 'edge') ?? 0.5} strength=soft weight=${get(use.decl, 'alignWeight') ?? 1}`);
  });
  const contain = plain(get(method, 'containRelation')), peer = plain(get(method, 'peerRelation'));
  const anchorRows = new Set([...anchors.values()].map(a => a.row));
  let peers = 0;
  for (const s of subjects) {
    constraint('contain' + s.i, contain, 'subject' + s.i, 'frame');
    for (const other of rows) {
      if (other === s.moving || !other.peer || !other.geometry || anchorRows.has(other) || subjects.some(x => x.moving === other)) continue;
      const id = 'peer' + (peers++); fixed(id, other.geometry); constraint('apart.' + s.i + '.' + id, peer, 'subject' + s.i, id);
    }
    for (const t of subjects) if (t.i > s.i) constraint('apart.' + s.i + '.subject' + t.i, peer, 'subject' + s.i, 'subject' + t.i);
    // What holds the subject up: it keeps out of every observed region whose kind its kind avoids (std.placement.kind
    // avoids=: the water of a river or a lake for a house), a hard constraint, except a region a relation puts it into.
    const avoided = new Set((s.kind.attrs.avoids ?? []).map(raw => raw.startsWith('"') ? str(raw) : raw));
    if (avoided.size) regions.forEach((r, k) => {
      if (!avoided.has(r.kind) || !r.geometry || uses.some(u => u.s === s && u.region === r)) return;
      const id = 'keepout' + s.i + 'r' + k; fixed(id, r.geometry);
      add('constraint', 'avoid.' + s.i + '.' + k, `name=avoid.${s.i}.${k} predicate=apart a=subject${s.i} b=${id} gap=0 strength=hard`);
    });
  }
  const packet = `@problem std.problem.request budget=3000 ${refs.var.map(r => 'var=' + r).join(' ')} ${refs.box.map(r => 'box=' + r).join(' ')} ${refs.constraint.map(r => 'constraint=' + r).join(' ')}\n${lines.join('\n')}`;
  return { packet, softened };
  };
  const decide = (answerText, problem) => {
    const answer = parse(answerText), result = answer.find(w => w.type === 'std.problem.result');
    const status = get(result, 'status');
    if (status !== 'solved') return unavailable('search-' + status, { conflict: result.attrs.conflict, provider: get(result, 'provider') });
    const value = Object.fromEntries(answer.filter(w => w.type === 'std.problem.assignment').filter(w => (result.attrs.assignment ?? []).includes('$' + w.id)).map(w => [get(w, 'var'), number(w, 'value')]));
    // The relations whose declared distance the placement could not keep (relaxed problems only).
    let relaxed;
    if (problem.softened.length) {
      const { model } = readProblem(parse(problem.packet));
      relaxed = [...new Set(problem.softened.filter(b => violation(model, model.soft.find(c => c.name === b.name), value) > 0).map(b => b.relation))];
    }
    const calls = [], options = [];
    for (const s of subjects) {
      const args = Object.create(null), put = (key, v) => { if (!validName(key) || Object.hasOwn(args, key)) return false; args[key] = v; return true; };
      for (const arg of world.ofType('std.placement.argument').filter(w => ref(w, 'binding') === s.kind.id)) if (!put(get(arg, 'key'), get(arg, 'value'))) return unavailable('argument-collision');
      const originX = number(s.kind, 'originX'), originY = number(s.kind, 'originY');
      const x = value['x' + s.i] + s.size.width * (Number.isFinite(originX) ? originX : number(s.tool, 'originX'));
      const y = value['y' + s.i] + s.size.height * (Number.isFinite(originY) ? originY : number(s.tool, 'originY'));
      if (!put(get(s.tool, 'xKey'), String(x)) || !put(get(s.tool, 'yKey'), String(y)) ||
          !(s.creation ? put(get(s.tool, 'kindKey'), quote(literal(s.kind, 'native'))) : put(get(s.tool, 'idsKey'), quote(literal(s.moving.box, 'entity'))))) return unavailable('argument-collision');
      if (s.drawn !== undefined && !put(get(s.tool, 'sizeKey'), String(s.drawn))) return unavailable('argument-collision');
      if (s.creation && get(s.tool, 'containerKey') && !put(get(s.tool, 'containerKey'), quote(literal(context, 'container')))) return unavailable('argument-collision');
      if (!validName(get(s.tool, 'operation'))) return unavailable('invalid-operation');
      calls.push(wire('placement.call.' + s.i, get(s.tool, 'operation'), args));
      // The geometry each subject is given, as an option the caller can check against what it observes after.
      const use = uses.find(u => u.s === s && ambiguous.has(ref(u.relation, 'goal'))) ?? uses.find(u => u.s === s);
      options.push({ id: 'placement.option.' + (s.i + 1), anchor: use.a.row, moving: s.moving, direction: wire('placement.relation.' + s.i, 'std.request.relation', { name: get(use.relation, 'relation') }),
        x, y, bounds: { x: value['x' + s.i], y: value['y' + s.i], width: s.size.width, height: s.size.height }, evidence: [], status: 'feasible' });
    }
    return { calls, options, chosen: options[0], provider: get(result, 'provider'), relaxed, cost: number(result, 'cost') ?? 0 };
  };
  return { build, decide };
  };
  // A method declared relax=gap answers a request whose declared distances no placement keeps with the nearest
  // placement that keeps every relation's direction (or separation) instead, and names the relations it relaxed.
  const relax = get(method, 'relax') === 'gap';
  const then = (value, next) => value && typeof value.then === 'function' ? value.then(next) : next(value);
  const attempt = (anchors) => {
    const prepared = prepare(anchors);
    if (prepared.failure) return prepared.failure;
    const declaredProblem = prepared.build(false);
    return then(solveProblem(declaredProblem.packet, { provider }), (answerText) => {
      const first = prepared.decide(answerText, declaredProblem);
      if (first.calls || !relax || !['search-exhausted', 'search-unsatisfiable'].includes(first.reason)) return first;
      const relaxedProblem = prepared.build(true);
      if (!relaxedProblem.softened.length) return first;
      return then(solveProblem(relaxedProblem.packet, { provider }), (text) => {
        const second = prepared.decide(text, relaxedProblem);
        return second.calls ? { ...second, loose: true } : first;
      });
    });
  };
  // Each combination in turn (at most ANCHOR_COMBINATIONS); the best placement keeps every declared distance,
  // then has the least cost; a tie goes to the most recent anchors. The others stay as ranked alternatives.
  const results = [];
  const step = (k) => k === combinations.length ? results : then(attempt(combinations[k]), (r) => { results.push(r); return step(k + 1); });
  return then(step(0), (all) => {
    const solved = all.filter(r => r.calls);
    if (!solved.length) return all[0];
    const ranked = solved.map((r, order) => ({ r, order })).sort((p, q) => (p.r.loose === true) - (q.r.loose === true) || p.r.cost - q.r.cost || p.order - q.order).map(x => x.r);
    const [best, ...others] = ranked;
    const alternatives = others.flatMap((r, k) => r.options.map(o => ({ ...o, id: o.id + '.alternative.' + (k + 1), status: r.loose ? 'relaxed' : 'feasible' })));
    return { ...best, options: [...best.options, ...alternatives] };
  });
}

// The most combinations of candidate anchors one placement request is solved for.
const ANCHOR_COMBINATIONS = 16;
// A declared count on a target (concept=count operator=eq value=N): the number of things the request makes.
const isCount = w => w.type === 'std.request.constraint' && get(w, 'concept') === 'count' && get(w, 'operator') === 'eq';
const MAX_COUNT = 16;
