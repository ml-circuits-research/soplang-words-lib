import { interpretationContract } from './interpretation-method.mjs';
import { placementContract } from './placement-contract.mjs';
import { replyExistenceValidator } from './reply-existence.mjs';
import { replyPropertyValidator } from './reply-property.mjs';
import { traceInputValidator, traceGraphValidator } from './trace-contracts.mjs';
import { requestValidator } from './request-contracts.mjs';
import { ruleCircuitContracts } from './rule-circuit-contract.mjs';
import { capabilityContracts } from './capability-contract.mjs';
// Opt-in structural contracts. These schemas validate records; they do not establish
// the truth, licensing suitability or semantic correctness of the recorded evidence.
// Each module owns its namespace and can be imported independently through core.use.
export const CONTRACT_MODULES = {
  ...ruleCircuitContracts,
  ...capabilityContracts,
  'std.interpret': interpretationContract,
  'std.placement': placementContract,
  'std.instance': {
    text: `
@std.instance.module core.module name=std.instance version=0.208.0 exports=std.instance.snapshot exports=std.instance.object exports=std.instance.record exports=std.instance.sequence exports=std.instance.value
@std.instance.snapshot.type core.type of=std.instance.snapshot closed=true
@std.instance.snapshot.format core.slot of=std.instance.snapshot key=format kind=string present=true
@std.instance.snapshot.instance core.slot of=std.instance.snapshot key=instance kind=string present=true
@std.instance.snapshot.world core.slot of=std.instance.snapshot key=world kind=string present=true
@std.instance.snapshot.schema core.slot of=std.instance.snapshot key=schema kind=string present=true
@std.instance.snapshot.revision core.slot of=std.instance.snapshot key=revision kind=any present=true
@std.instance.snapshot.object core.slot of=std.instance.snapshot key=object kind=ref to=std.instance.object many=true
@std.instance.snapshot.projection core.slot of=std.instance.snapshot key=projection kind=any present=true
@std.instance.snapshot.metadata core.slot of=std.instance.snapshot key=metadata kind=any
@std.instance.object.type core.type of=std.instance.object closed=true
@std.instance.object.id core.slot of=std.instance.object key=id kind=string present=true
@std.instance.object.fact core.slot of=std.instance.object key=fact kind=ref present=true
@std.instance.object.attribute core.slot of=std.instance.object key=attribute kind=string many=true
@std.instance.object.relation core.slot of=std.instance.object key=relation kind=string many=true
@std.instance.object.metadata core.slot of=std.instance.object key=metadata kind=any
@std.instance.record.type core.type of=std.instance.record closed=false
@std.instance.sequence.type core.type of=std.instance.sequence closed=true
@std.instance.sequence.item core.slot of=std.instance.sequence key=item kind=any many=true
@std.instance.value.type core.type of=std.instance.value closed=false
`, fns: {},
  },
  'std.source': {
    text: `
@std.source.module core.module name=std.source version=0.169.0 exports=std.source
@std.source.type core.type of=std.source closed=true
@std.source.name core.slot of=std.source key=name kind=string present=true
@std.source.version core.slot of=std.source key=version kind=string present=true
@std.source.status core.slot of=std.source key=status kind=atom enum=illustrative enum=published present=true
@std.source.license core.slot of=std.source key=license kind=string
@std.source.url core.slot of=std.source key=url kind=string
@std.source.digest core.slot of=std.source key=digest kind=string
`, fns: {},
  },
  'std.import': {
    text: `
@std.import.module core.module name=std.import version=0.169.0 exports=std.import.mapping
@std.import.mapping.type core.type of=std.import.mapping closed=true
@std.import.mapping.name core.slot of=std.import.mapping key=name kind=string present=true
@std.import.mapping.version core.slot of=std.import.mapping key=version kind=string present=true
@std.import.mapping.description core.slot of=std.import.mapping key=description kind=string
@std.import.mapping.digest core.slot of=std.import.mapping key=digest kind=string
`, fns: {},
  },
  'std.provenance': {
    text: `
@std.provenance.module core.module name=std.provenance version=0.169.0 imports=std.source imports=std.import exports=std.provenance
@std.provenance.type core.type of=std.provenance closed=true
@std.provenance.source core.slot of=std.provenance key=source kind=ref to=std.source present=true
@std.provenance.record core.slot of=std.provenance key=record kind=string present=true
@std.provenance.mapping core.slot of=std.provenance key=mapping kind=ref to=std.import.mapping present=true
`, fns: {},
  },
  'std.knowledge': {
    text: `
@std.knowledge.module core.module name=std.knowledge version=0.169.0 imports=std.provenance exports=std.knowledge.parent
@std.knowledge.parent.type core.type of=std.knowledge.parent closed=true
@std.knowledge.parent.child core.slot of=std.knowledge.parent key=child kind=atom present=true
@std.knowledge.parent.parent core.slot of=std.knowledge.parent key=parent kind=atom present=true
@std.knowledge.parent.provenance core.slot of=std.knowledge.parent key=provenance kind=ref to=std.provenance present=true
@std.knowledge.parent.status core.slot of=std.knowledge.parent key=status kind=atom enum=candidate enum=accepted enum=rejected present=true
`, fns: {},
  },
  'std.objective': {
    text: `
@std.objective.module core.module name=std.objective version=0.170.0 exports=std.objective exports=std.objective.term exports=std.objective.evaluator exports=std.objective.candidate exports=std.objective.measurement
@std.objective.type core.type of=std.objective closed=true
@std.objective.order core.slot of=std.objective key=order kind=atom enum=lexicographic present=true
@std.objective.direction core.slot of=std.objective key=direction kind=atom enum=minimise enum=maximise present=true
@std.objective.terms core.slot of=std.objective key=term kind=ref to=std.objective.term many=true present=true
@std.objective.term.type core.type of=std.objective.term closed=true
@std.objective.term.evaluator core.slot of=std.objective.term key=evaluator kind=atom present=true
@std.objective.term.normalisation core.slot of=std.objective.term key=normalisation kind=atom enum=declared.by.evaluator present=true
@std.objective.term.weight core.slot of=std.objective.term key=weight kind=number min=0 present=true
@std.objective.term.priority core.slot of=std.objective.term key=priority kind=integer min=0 max=9007199254740991 present=true
@std.objective.evaluator.type core.type of=std.objective.evaluator closed=true
@std.objective.evaluator.normalisation core.slot of=std.objective.evaluator key=normalisation kind=atom present=true
@std.objective.evaluator.version core.slot of=std.objective.evaluator key=version kind=atom present=true
@std.objective.candidate.type core.type of=std.objective.candidate closed=true
@std.objective.measurement.type core.type of=std.objective.measurement closed=true
@std.objective.measurement.candidate core.slot of=std.objective.measurement key=candidate kind=ref to=std.objective.candidate present=true
@std.objective.measurement.evaluator core.slot of=std.objective.measurement key=evaluator kind=ref to=std.objective.evaluator present=true
@std.objective.measurement.value core.slot of=std.objective.measurement key=value kind=number present=true
`, fns: {},
  },
  'std.trace': {
    text: `
@std.trace.module core.module name=std.trace version=0.195.0 exports=std.trace.subject exports=std.trace.presence exports=std.trace.population exports=std.trace.request exports=std.trace.input exports=std.trace.step exports=std.trace.observation exports=std.trace.reply exports=std.trace.undo exports=std.trace.correction
@std.trace.subject.type core.type of=std.trace.subject closed=true
@std.trace.subject.source core.slot of=std.trace.subject key=source kind=string present=true
@std.trace.subject.version core.slot of=std.trace.subject key=version kind=string present=true
@std.trace.subject.source.type core.slot of=std.trace.subject key=source.type kind=atom present=true
@std.trace.presence.type core.type of=std.trace.presence closed=true
@std.trace.presence.source core.slot of=std.trace.presence key=source kind=string present=true
@std.trace.presence.source.type core.slot of=std.trace.presence key=source.type kind=atom present=true
@std.trace.presence.scope core.slot of=std.trace.presence key=scope kind=string present=true
@std.trace.presence.desired core.slot of=std.trace.presence key=desired kind=atom enum=present enum=absent present=true
@std.trace.population.type core.type of=std.trace.population closed=true
@std.trace.population.step core.slot of=std.trace.population key=step kind=ref to=std.trace.step present=true
@std.trace.population.invocation core.slot of=std.trace.population key=invocation kind=string present=true
@std.trace.population.phase core.slot of=std.trace.population key=phase kind=atom enum=before enum=after present=true
@std.trace.population.source core.slot of=std.trace.population key=source kind=string present=true
@std.trace.population.version core.slot of=std.trace.population key=version kind=string present=true
@std.trace.population.scope core.slot of=std.trace.population key=scope kind=string present=true
@std.trace.population.coverage core.slot of=std.trace.population key=coverage kind=atom enum=complete enum=partial present=true
@std.trace.population.semantics core.slot of=std.trace.population key=semantics kind=atom enum=lifecycle enum=view present=true
@std.trace.population.member core.slot of=std.trace.population key=member kind=ref to=std.trace.subject many=true
@std.trace.step.population core.slot of=std.trace.step key=population kind=ref to=std.trace.population many=true
@std.trace.step.presence core.slot of=std.trace.step key=presence kind=ref to=std.trace.presence many=true
@std.trace.request.type core.type of=std.trace.request closed=true
@std.trace.request.message core.slot of=std.trace.request key=message kind=string present=true
@std.trace.input.type core.type of=std.trace.input closed=true
@std.trace.input.source core.slot of=std.trace.input key=source kind=string present=true
@std.trace.input.version core.slot of=std.trace.input key=version kind=string present=true
@std.trace.input.source.type core.slot of=std.trace.input key=source.type kind=atom present=true
@std.trace.input.key core.slot of=std.trace.input key=key kind=atom present=true
@std.trace.input.values core.slot of=std.trace.input key=values kind=json present=true
@std.trace.input.valid.function core.function name=std.trace.input.valid out.kind=boolean pure=true
@std.trace.input.valid.arg core.function.arg of=$std.trace.input.valid.function name=input kind=ref
@std.trace.input.validation core.validate on=std.trace.input fn=std.trace.input.valid why="trace values must be a JSON array of canonical concrete SOP value tokens"
@std.trace.step.type core.type of=std.trace.step closed=true
@std.trace.step.operation core.slot of=std.trace.step key=operation kind=string present=true
@std.trace.step.operation.version core.slot of=std.trace.step key=operation.version kind=string present=true
@std.trace.step.invocation core.slot of=std.trace.step key=invocation kind=string present=true
@std.trace.step.request core.slot of=std.trace.step key=request kind=ref to=std.trace.request present=true
@std.trace.step.act core.slot of=std.trace.step key=act kind=atom
@std.trace.step.status core.slot of=std.trace.step key=status kind=atom enum=planned enum=confirmed enum=refused enum=unknown enum=partial present=true
@std.trace.step.input core.slot of=std.trace.step key=input kind=ref to=std.trace.input many=true
@std.trace.step.result core.slot of=std.trace.step key=result kind=ref to=std.trace.input many=true
@std.trace.step.depends core.slot of=std.trace.step key=depends kind=ref to=std.trace.step many=true
@std.trace.observation.type core.type of=std.trace.observation closed=true
@std.trace.observation.step core.slot of=std.trace.observation key=step kind=ref to=std.trace.step present=true
@std.trace.observation.invocation core.slot of=std.trace.observation key=invocation kind=string present=true
@std.trace.observation.phase core.slot of=std.trace.observation key=phase kind=atom enum=before enum=after present=true
@std.trace.observation.input core.slot of=std.trace.observation key=input kind=ref to=std.trace.input many=true present=true
@std.trace.reply.type core.type of=std.trace.reply closed=true
@std.trace.reply.request core.slot of=std.trace.reply key=request kind=ref to=std.trace.request present=true
@std.trace.reply.step core.slot of=std.trace.reply key=step kind=ref to=std.trace.step many=true
@std.trace.reply.text core.slot of=std.trace.reply key=text kind=string present=true
@std.trace.undo.type core.type of=std.trace.undo closed=true
@std.trace.undo.target core.slot of=std.trace.undo key=target kind=ref to=std.trace.step present=true
@std.trace.undo.execution core.slot of=std.trace.undo key=execution kind=ref to=std.trace.step present=true
@std.trace.undo.observation core.slot of=std.trace.undo key=observation kind=ref to=std.trace.observation many=true
@std.trace.correction.type core.type of=std.trace.correction closed=true
@std.trace.correction.target core.slot of=std.trace.correction key=target kind=ref to=std.trace.step present=true
@std.trace.correction.replacement core.slot of=std.trace.correction key=replacement kind=ref to=std.trace.step present=true
@std.trace.graph.valid.function core.function name=std.trace.graph.valid out.kind=boolean pure=true
@std.trace.graph.valid.arg core.function.arg of=$std.trace.graph.valid.function name=request kind=ref
@std.trace.graph.validation core.validate on=std.trace.request fn=std.trace.graph.valid why="invalid trace dependencies, invocation correlation, reply ownership or replacement lineage"
`, fns: { 'std.trace.input.valid': traceInputValidator, 'std.trace.graph.valid': traceGraphValidator },
  },
  'std.reply': {
    text: `
@std.reply.module core.module name=std.reply version=0.195.0 exports=std.reply.property exports=std.reply.existence
@std.reply.existence.type core.type of=std.reply.existence closed=true
@std.reply.existence.owner core.slot of=std.reply.existence key=owner kind=string present=true
@std.reply.existence.revision core.slot of=std.reply.existence key=revision kind=string present=true
@std.reply.existence.status core.slot of=std.reply.existence key=status kind=atom enum=made enum=removed enum=unchanged enum=unconfirmed present=true
@std.reply.existence.valid.function core.function name=std.reply.existence.valid out.kind=boolean pure=true
@std.reply.existence.valid.arg core.function.arg of=$std.reply.existence.valid.function name=claim kind=ref
@std.reply.existence.validation core.validate on=std.reply.existence fn=std.reply.existence.valid why="existence claim must match retained correlated population evidence"
@std.reply.property.type core.type of=std.reply.property closed=true
@std.reply.property.owner core.slot of=std.reply.property key=owner kind=string present=true
@std.reply.property.revision core.slot of=std.reply.property key=revision kind=string present=true
@std.reply.property.status core.slot of=std.reply.property key=status kind=atom enum=changed enum=unchanged enum=unconfirmed present=true
@std.reply.property.valid.function core.function name=std.reply.property.valid out.kind=boolean pure=true
@std.reply.property.valid.arg core.function.arg of=$std.reply.property.valid.function name=claim kind=ref
@std.reply.property.validation core.validate on=std.reply.property fn=std.reply.property.valid why="property claim must match its retained correlated evidence and recomputed assessment"
`, fns: { 'std.reply.property.valid': replyPropertyValidator, 'std.reply.existence.valid': replyExistenceValidator },
  },
  'std.change': {
    text: `
@std.change.module core.module name=std.change version=0.179.0 exports=std.change.policy
@std.change.policy.type core.type of=std.change.policy closed=true
@std.change.policy.kind core.slot of=std.change.policy key=kind kind=atom present=true
@std.change.policy.concept core.slot of=std.change.policy key=concept kind=atom present=true
@std.change.policy.anchor core.slot of=std.change.policy key=anchor kind=atom present=true
@std.change.policy.unit core.slot of=std.change.policy key=unit kind=atom present=true
`, fns: {},
  },
  'std.reference': {
    text: `
@std.reference.module core.module name=std.reference version=0.171.0 imports=std.provenance exports=std.reference.set exports=std.reference.sample
@std.reference.set.type core.type of=std.reference.set closed=true
@std.reference.set.version core.slot of=std.reference.set key=version kind=string present=true
@std.reference.set.property core.slot of=std.reference.set key=property kind=atom present=true
@std.reference.set.unit core.slot of=std.reference.set key=unit kind=atom present=true
@std.reference.set.member core.slot of=std.reference.set key=member kind=ref to=std.reference.sample many=true present=true
@std.reference.sample.type core.type of=std.reference.sample closed=true
@std.reference.sample.value core.slot of=std.reference.sample key=value kind=number present=true
@std.reference.sample.unit core.slot of=std.reference.sample key=unit kind=atom present=true
@std.reference.sample.provenance core.slot of=std.reference.sample key=provenance kind=ref to=std.provenance
@std.reference.p.sample std.reference.sample unit=?sample.unit
@std.reference.p.set std.reference.set member=$std.reference.p.sample unit=?set.unit
# Compare unit identifiers lexically, not as numbers or clock tokens.
@std.reference.c.sample.label core.calc out=?sample.label fn=concat args=identifier. args=?sample.unit
@std.reference.c.set.label core.calc out=?set.label fn=concat args=identifier. args=?set.unit
@std.reference.c.unit core.check fn=neq args=?sample.label args=?set.label
@std.reference.d.unit core.deny when=$std.reference.p.set when=$std.reference.p.sample with=$std.reference.c.sample.label with=$std.reference.c.set.label if=$std.reference.c.unit why="reference sample unit must match the set unit"
`, fns: {},
  },
  'w.legend': {
    text: `
@w.legend.module core.module name=w.legend version=0.186.0 exports=w.legend.act exports=w.legend.condition exports=w.legend.space exports=w.legend.axis exports=w.legend.unit exports=w.legend.concept exports=w.legend.degree exports=w.legend.relation exports=w.legend.role exports=w.legend.frame
@w.legend.link.is core.schema.link on=core.type key=is target=w.legend.concept by=name
@w.legend.link.means core.schema.link on=core.slot key=means target=w.legend.concept by=name
@w.legend.link.space core.schema.link on=core.slot key=space target=w.legend.space by=name
@w.legend.frame.type core.type of=w.legend.frame closed=true shared=true
@w.legend.frame.name core.slot of=w.legend.frame key=name kind=atom present=true
@w.legend.frame.version core.slot of=w.legend.frame key=version kind=string present=true
@w.legend.space.frame core.slot of=w.legend.space key=frame kind=ref to=w.legend.frame
@w.legend.space.type core.type of=w.legend.space closed=true
@w.legend.axis.type core.type of=w.legend.axis closed=true shared=true
@w.legend.unit.type core.type of=w.legend.unit closed=true shared=true
@w.legend.space.name core.slot of=w.legend.space key=name kind=atom present=true
@w.legend.space.version core.slot of=w.legend.space key=version kind=string present=true
@w.legend.space.form core.slot of=w.legend.space key=form kind=atom enum=axes enum=graph present=true
@w.legend.axis.of core.slot of=w.legend.axis key=of kind=ref to=w.legend.space present=true
@w.legend.axis.name core.slot of=w.legend.axis key=name kind=atom present=true
@w.legend.axis.order core.slot of=w.legend.axis key=order kind=integer min=0 max=9007199254740991 present=true
@w.legend.axis.kind core.slot of=w.legend.axis key=kind kind=atom enum=linear enum=angle present=true
@w.legend.axis.unit core.slot of=w.legend.axis key=unit kind=ref to=w.legend.unit present=true
@w.legend.axis.min core.slot of=w.legend.axis key=min kind=number
@w.legend.axis.max core.slot of=w.legend.axis key=max kind=number
@w.legend.axis.weight core.slot of=w.legend.axis key=weight kind=number
@w.legend.axis.normalisation core.slot of=w.legend.axis key=normalisation kind=number
@w.legend.axis.period core.slot of=w.legend.axis key=period kind=number
@w.legend.axis.scale core.slot of=w.legend.axis key=scale kind=atom enum=ratio enum=interval
@w.legend.axis.step core.slot of=w.legend.axis key=step kind=number
@w.legend.unit.name core.slot of=w.legend.unit key=name kind=atom present=true
@w.legend.unit.of core.slot of=w.legend.unit key=of kind=ref to=w.legend.axis present=true
@w.legend.unit.factor core.slot of=w.legend.unit key=factor kind=number present=true
@w.legend.unit.offset core.slot of=w.legend.unit key=offset kind=number present=true
@w.legend.guard.graph.axis.p0 w.legend.space form=graph
@w.legend.guard.graph.axis.p1 w.legend.axis of=$w.legend.guard.graph.axis.p0
@w.legend.guard.graph.axis.deny core.deny when=$w.legend.guard.graph.axis.p0 when=$w.legend.guard.graph.axis.p1  why="invalid legend axis"
@w.legend.guard.positive.weight.p0 w.legend.axis weight=?v
@w.legend.guard.positive.weight.c0 core.check fn=lte args=?v args=0
@w.legend.guard.positive.weight.deny core.deny when=$w.legend.guard.positive.weight.p0 if=$w.legend.guard.positive.weight.c0 why="invalid legend weight"
@w.legend.guard.positive.normalisation.p0 w.legend.axis normalisation=?v
@w.legend.guard.positive.normalisation.c0 core.check fn=lte args=?v args=0
@w.legend.guard.positive.normalisation.deny core.deny when=$w.legend.guard.positive.normalisation.p0 if=$w.legend.guard.positive.normalisation.c0 why="invalid legend normalisation"
@w.legend.guard.positive.period.p0 w.legend.axis period=?v
@w.legend.guard.positive.period.c0 core.check fn=lte args=?v args=0
@w.legend.guard.positive.period.deny core.deny when=$w.legend.guard.positive.period.p0 if=$w.legend.guard.positive.period.c0 why="invalid legend period"
@w.legend.guard.positive.factor.p0 w.legend.unit factor=?v
@w.legend.guard.positive.factor.c0 core.check fn=lte args=?v args=0
@w.legend.guard.positive.factor.deny core.deny when=$w.legend.guard.positive.factor.p0 if=$w.legend.guard.positive.factor.c0 why="invalid legend factor"
@w.legend.guard.bounds.p0 w.legend.axis min=?lo max=?hi
@w.legend.guard.bounds.c0 core.check fn=gte args=?lo args=?hi
@w.legend.guard.bounds.deny core.deny when=$w.legend.guard.bounds.p0 if=$w.legend.guard.bounds.c0 why="invalid legend bounds"
@w.legend.guard.angle.period.p0 w.legend.axis kind=angle core.absent=period
@w.legend.guard.angle.period.deny core.deny when=$w.legend.guard.angle.period.p0  why="invalid legend period"
@w.legend.guard.linear.period.p0 w.legend.axis kind=linear period=?v
@w.legend.guard.linear.period.deny core.deny when=$w.legend.guard.linear.period.p0  why="invalid legend period"
@w.legend.guard.step.scale.p0 w.legend.axis step=?v core.absent=scale
@w.legend.guard.step.scale.deny core.deny when=$w.legend.guard.step.scale.p0  why="invalid legend scale"
@w.legend.guard.scale.step.p0 w.legend.axis scale=?s core.absent=step
@w.legend.guard.scale.step.deny core.deny when=$w.legend.guard.scale.step.p0  why="invalid legend step"
@w.legend.guard.step.ratio.p0 w.legend.axis scale=ratio step=?v
@w.legend.guard.step.ratio.c0 core.check fn=lte args=?v args=1
@w.legend.guard.step.ratio.deny core.deny when=$w.legend.guard.step.ratio.p0 if=$w.legend.guard.step.ratio.c0 why="invalid legend ratio"
@w.legend.guard.step.interval.p0 w.legend.axis scale=interval step=?v
@w.legend.guard.step.interval.c0 core.check fn=lte args=?v args=0
@w.legend.guard.step.interval.deny core.deny when=$w.legend.guard.step.interval.p0 if=$w.legend.guard.step.interval.c0 why="invalid legend interval"
@w.legend.unique.axis.name.a w.legend.axis of=?space name=?value
@w.legend.unique.axis.name.b w.legend.axis of=?space name=?value
@w.legend.unique.axis.name.ca core.calc out=?left fn=concat args=identity. args=?w.legend.unique.axis.name.a
@w.legend.unique.axis.name.cb core.calc out=?right fn=concat args=identity. args=?w.legend.unique.axis.name.b
@w.legend.unique.axis.name.different core.check fn=neq args=?left args=?right
@w.legend.unique.axis.name.deny core.deny when=$w.legend.unique.axis.name.a when=$w.legend.unique.axis.name.b with=$w.legend.unique.axis.name.ca with=$w.legend.unique.axis.name.cb if=$w.legend.unique.axis.name.different why="duplicate axis name within owner"
@w.legend.unique.axis.order.a w.legend.axis of=?space order=?value
@w.legend.unique.axis.order.b w.legend.axis of=?space order=?value
@w.legend.unique.axis.order.ca core.calc out=?left fn=concat args=identity. args=?w.legend.unique.axis.order.a
@w.legend.unique.axis.order.cb core.calc out=?right fn=concat args=identity. args=?w.legend.unique.axis.order.b
@w.legend.unique.axis.order.different core.check fn=neq args=?left args=?right
@w.legend.unique.axis.order.deny core.deny when=$w.legend.unique.axis.order.a when=$w.legend.unique.axis.order.b with=$w.legend.unique.axis.order.ca with=$w.legend.unique.axis.order.cb if=$w.legend.unique.axis.order.different why="duplicate axis order within owner"
@w.legend.unique.unit.name.a w.legend.unit of=?space name=?value
@w.legend.unique.unit.name.b w.legend.unit of=?space name=?value
@w.legend.unique.unit.name.ca core.calc out=?left fn=concat args=identity. args=?w.legend.unique.unit.name.a
@w.legend.unique.unit.name.cb core.calc out=?right fn=concat args=identity. args=?w.legend.unique.unit.name.b
@w.legend.unique.unit.name.different core.check fn=neq args=?left args=?right
@w.legend.unique.unit.name.deny core.deny when=$w.legend.unique.unit.name.a when=$w.legend.unique.unit.name.b with=$w.legend.unique.unit.name.ca with=$w.legend.unique.unit.name.cb if=$w.legend.unique.unit.name.different why="duplicate unit name within owner"
@w.legend.canonical.axis w.legend.axis unit=$w.legend.canonical.unit
@w.legend.canonical.unit w.legend.unit factor=?factor offset=?offset
@w.legend.canonical.allowed w.legend.unit of=$w.legend.canonical.axis
@w.legend.canonical.identity core.calc out=?w.legend.canonical.allowed fn=concat args=?w.legend.canonical.unit
@w.legend.canonical.factor core.check fn=neq args=?factor args=1
@w.legend.canonical.offset core.check fn=neq args=?offset args=0
@w.legend.canonical.deny.owner core.deny when=$w.legend.canonical.axis when=$w.legend.canonical.unit with=$w.legend.canonical.identity not=$w.legend.canonical.allowed why="canonical unit must belong to its axis"
@w.legend.canonical.deny.factor core.deny when=$w.legend.canonical.axis when=$w.legend.canonical.unit if=$w.legend.canonical.factor why="canonical unit factor must equal one"
@w.legend.canonical.deny.offset core.deny when=$w.legend.canonical.axis when=$w.legend.canonical.unit if=$w.legend.canonical.offset why="canonical unit offset must equal zero"
@w.legend.concept.type core.type of=w.legend.concept closed=true shared=true
@w.legend.concept.name core.slot of=w.legend.concept key=name kind=atom present=true
@w.legend.concept.group core.slot of=w.legend.concept key=group kind=atom
@w.legend.concept.question core.slot of=w.legend.concept key=question kind=string
@w.legend.concept.specialises core.slot of=w.legend.concept key=specialises kind=ref to=w.legend.concept
@w.legend.degree.type core.type of=w.legend.degree closed=true shared=true
@w.legend.degree.word core.slot of=w.legend.degree key=word kind=atom present=true
@w.legend.degree.direction core.slot of=w.legend.degree key=direction kind=atom enum=up enum=down present=true
@w.legend.degree.factor core.slot of=w.legend.degree key=factor kind=number present=true
@w.legend.relation.type core.type of=w.legend.relation closed=true shared=true
@w.legend.relation.name core.slot of=w.legend.relation key=name kind=atom present=true
@w.legend.relation.space core.slot of=w.legend.relation key=space kind=ref to=w.legend.space
@w.legend.relation.inverse core.slot of=w.legend.relation key=inverse kind=ref to=w.legend.relation
@w.legend.relation.test core.slot of=w.legend.relation key=test kind=atom
@w.legend.role.type core.type of=w.legend.role closed=true shared=true
@w.legend.role.name core.slot of=w.legend.role key=name kind=atom present=true
@w.legend.role.of core.slot of=w.legend.role key=of kind=ref type=w.legend.act type=w.legend.relation present=true
@w.legend.factor.p w.legend.degree factor=?factor
@w.legend.factor.c core.check fn=lte args=?factor args=0
@w.legend.factor.d core.deny when=$w.legend.factor.p if=$w.legend.factor.c why="degree factor must be positive"
@w.legend.ancestor.type core.type of=w.legend.ancestor closed=true shared=true transient=true
@w.legend.ancestor.child core.slot of=w.legend.ancestor key=child kind=ref to=w.legend.concept present=true
@w.legend.ancestor.parent core.slot of=w.legend.ancestor key=parent kind=ref to=w.legend.concept present=true
@w.legend.ancestor.p w.legend.concept specialises=$w.legend.ancestor.q
@w.legend.ancestor.q w.legend.concept
@w.legend.ancestor.edge w.legend.ancestor child=$w.legend.ancestor.p parent=$w.legend.ancestor.q
@w.legend.ancestor.direct core.rule when=$w.legend.ancestor.p when=$w.legend.ancestor.q then=$w.legend.ancestor.edge
@w.legend.ancestor.left w.legend.ancestor child=?child parent=?middle
@w.legend.ancestor.right w.legend.ancestor child=?middle parent=?parent
@w.legend.ancestor.transitive w.legend.ancestor child=?child parent=?parent
@w.legend.ancestor.close core.rule when=$w.legend.ancestor.left when=$w.legend.ancestor.right then=$w.legend.ancestor.transitive
@w.legend.ancestor.cycle w.legend.ancestor child=?same parent=?same
@w.legend.ancestor.deny core.deny when=$w.legend.ancestor.cycle why="concept specialisation must be acyclic"
@w.legend.roles.a w.legend.role of=?owner name=?role
@w.legend.roles.b w.legend.role of=?owner name=?role
@w.legend.roles.ca core.calc out=?left fn=concat args=identity. args=?w.legend.roles.a
@w.legend.roles.cb core.calc out=?right fn=concat args=identity. args=?w.legend.roles.b
@w.legend.roles.different core.check fn=neq args=?left args=?right
@w.legend.roles.unique core.deny when=$w.legend.roles.a when=$w.legend.roles.b with=$w.legend.roles.ca with=$w.legend.roles.cb if=$w.legend.roles.different why="role name must be unique within owner"
@w.legend.roles.record w.legend.role of=$w.legend.roles.act name=?role
@w.legend.roles.act w.legend.act
@w.legend.roles.allowed w.legend.act role=?role
@w.legend.roles.identity core.calc out=?w.legend.roles.allowed fn=concat args=?w.legend.roles.act
@w.legend.roles.member core.deny when=$w.legend.roles.record when=$w.legend.roles.act with=$w.legend.roles.identity not=$w.legend.roles.allowed why="role record must name a declared act role"
@w.legend.inverse.a w.legend.relation inverse=$w.legend.inverse.b
@w.legend.inverse.b w.legend.relation inverse=$w.legend.inverse.c
@w.legend.inverse.c w.legend.relation
@w.legend.inverse.ca core.calc out=?left fn=concat args=identity. args=?w.legend.inverse.a
@w.legend.inverse.cc core.calc out=?right fn=concat args=identity. args=?w.legend.inverse.c
@w.legend.inverse.different core.check fn=neq args=?left args=?right
@w.legend.inverse.deny core.deny when=$w.legend.inverse.a when=$w.legend.inverse.b when=$w.legend.inverse.c with=$w.legend.inverse.ca with=$w.legend.inverse.cc if=$w.legend.inverse.different why="declared inverse relations must agree"
@w.legend.inverse.space.a w.legend.relation inverse=$w.legend.inverse.space.b space=?a
@w.legend.inverse.space.b w.legend.relation space=?b
@w.legend.inverse.space.ca core.calc out=?left fn=concat args=identity. args=?a
@w.legend.inverse.space.cb core.calc out=?right fn=concat args=identity. args=?b
@w.legend.inverse.space.different core.check fn=neq args=?left args=?right
@w.legend.inverse.space.deny core.deny when=$w.legend.inverse.space.a when=$w.legend.inverse.space.b with=$w.legend.inverse.space.ca with=$w.legend.inverse.space.cb if=$w.legend.inverse.space.different why="inverse relations must use the same declared space"
@w.legend.act.type core.type of=w.legend.act closed=true
@w.legend.condition.type core.type of=w.legend.condition closed=true
@w.legend.act.name core.slot of=w.legend.act key=name kind=atom present=true
@w.legend.act.change core.slot of=w.legend.act key=change kind=atom enum=appear enum=disappear enum=quality enum=relation present=true
@w.legend.act.role core.slot of=w.legend.act key=role kind=atom many=true present=true
@w.legend.act.before core.slot of=w.legend.act key=before kind=ref to=w.legend.condition many=true
@w.legend.act.after core.slot of=w.legend.act key=after kind=ref to=w.legend.condition many=true present=true
@w.legend.condition.kind core.slot of=w.legend.condition key=kind kind=atom enum=exists enum=absent enum=has enum=holds present=true
@w.legend.condition.object core.slot of=w.legend.condition key=object kind=atom present=true
@w.legend.condition.quality core.slot of=w.legend.condition key=quality kind=atom
@w.legend.condition.goal core.slot of=w.legend.condition key=goal kind=atom
@w.legend.variant.exists.quality.p w.legend.condition kind=exists quality=?value
@w.legend.variant.exists.quality.deny core.deny when=$w.legend.variant.exists.quality.p why="exists condition forbids quality"
@w.legend.variant.exists.goal.p w.legend.condition kind=exists goal=?value
@w.legend.variant.exists.goal.deny core.deny when=$w.legend.variant.exists.goal.p why="exists condition forbids goal"
@w.legend.variant.absent.quality.p w.legend.condition kind=absent quality=?value
@w.legend.variant.absent.quality.deny core.deny when=$w.legend.variant.absent.quality.p why="absent condition forbids quality"
@w.legend.variant.absent.goal.p w.legend.condition kind=absent goal=?value
@w.legend.variant.absent.goal.deny core.deny when=$w.legend.variant.absent.goal.p why="absent condition forbids goal"
@w.legend.variant.has.quality.p w.legend.condition kind=has core.absent=quality
@w.legend.variant.has.quality.deny core.deny when=$w.legend.variant.has.quality.p why="has condition requires quality"
@w.legend.variant.has.goal.p w.legend.condition kind=has goal=?value
@w.legend.variant.has.goal.deny core.deny when=$w.legend.variant.has.goal.p why="has condition forbids goal"
@w.legend.variant.holds.quality.p w.legend.condition kind=holds quality=?value
@w.legend.variant.holds.quality.deny core.deny when=$w.legend.variant.holds.quality.p why="holds condition forbids quality"
@w.legend.variant.holds.goal.p w.legend.condition kind=holds core.absent=goal
@w.legend.variant.holds.goal.deny core.deny when=$w.legend.variant.holds.goal.p why="holds condition requires goal"
@w.legend.role.before.object.owner w.legend.act before=$w.legend.role.before.object.condition
@w.legend.role.before.object.condition w.legend.condition object=?role
@w.legend.role.before.object.allowed w.legend.act role=?role
@w.legend.role.before.object.same core.calc out=?w.legend.role.before.object.allowed fn=concat args=?w.legend.role.before.object.owner
@w.legend.role.before.object.deny core.deny when=$w.legend.role.before.object.owner when=$w.legend.role.before.object.condition with=$w.legend.role.before.object.same not=$w.legend.role.before.object.allowed why="condition object must name a role of its owning act"
@w.legend.role.before.quality.owner w.legend.act before=$w.legend.role.before.quality.condition
@w.legend.role.before.quality.condition w.legend.condition quality=?role
@w.legend.role.before.quality.allowed w.legend.act role=?role
@w.legend.role.before.quality.same core.calc out=?w.legend.role.before.quality.allowed fn=concat args=?w.legend.role.before.quality.owner
@w.legend.role.before.quality.deny core.deny when=$w.legend.role.before.quality.owner when=$w.legend.role.before.quality.condition with=$w.legend.role.before.quality.same not=$w.legend.role.before.quality.allowed why="condition quality must name a role of its owning act"
@w.legend.role.before.goal.owner w.legend.act before=$w.legend.role.before.goal.condition
@w.legend.role.before.goal.condition w.legend.condition goal=?role
@w.legend.role.before.goal.allowed w.legend.act role=?role
@w.legend.role.before.goal.same core.calc out=?w.legend.role.before.goal.allowed fn=concat args=?w.legend.role.before.goal.owner
@w.legend.role.before.goal.deny core.deny when=$w.legend.role.before.goal.owner when=$w.legend.role.before.goal.condition with=$w.legend.role.before.goal.same not=$w.legend.role.before.goal.allowed why="condition goal must name a role of its owning act"
@w.legend.role.after.object.owner w.legend.act after=$w.legend.role.after.object.condition
@w.legend.role.after.object.condition w.legend.condition object=?role
@w.legend.role.after.object.allowed w.legend.act role=?role
@w.legend.role.after.object.same core.calc out=?w.legend.role.after.object.allowed fn=concat args=?w.legend.role.after.object.owner
@w.legend.role.after.object.deny core.deny when=$w.legend.role.after.object.owner when=$w.legend.role.after.object.condition with=$w.legend.role.after.object.same not=$w.legend.role.after.object.allowed why="condition object must name a role of its owning act"
@w.legend.role.after.quality.owner w.legend.act after=$w.legend.role.after.quality.condition
@w.legend.role.after.quality.condition w.legend.condition quality=?role
@w.legend.role.after.quality.allowed w.legend.act role=?role
@w.legend.role.after.quality.same core.calc out=?w.legend.role.after.quality.allowed fn=concat args=?w.legend.role.after.quality.owner
@w.legend.role.after.quality.deny core.deny when=$w.legend.role.after.quality.owner when=$w.legend.role.after.quality.condition with=$w.legend.role.after.quality.same not=$w.legend.role.after.quality.allowed why="condition quality must name a role of its owning act"
@w.legend.role.after.goal.owner w.legend.act after=$w.legend.role.after.goal.condition
@w.legend.role.after.goal.condition w.legend.condition goal=?role
@w.legend.role.after.goal.allowed w.legend.act role=?role
@w.legend.role.after.goal.same core.calc out=?w.legend.role.after.goal.allowed fn=concat args=?w.legend.role.after.goal.owner
@w.legend.role.after.goal.deny core.deny when=$w.legend.role.after.goal.owner when=$w.legend.role.after.goal.condition with=$w.legend.role.after.goal.same not=$w.legend.role.after.goal.allowed why="condition goal must name a role of its owning act"
`, fns: {},
  },
  'std.request': {
    text: `
@std.request.module core.module name=std.request version=0.198.0 exports=std.request.query exports=std.request exports=std.request.source exports=std.request.target exports=std.request.constraint exports=std.request.not exports=std.request.group exports=std.request.quant exports=std.request.value
@std.request.type core.type of=std.request closed=true
@std.request.act core.slot of=std.request key=act kind=atom present=true
@std.request.mood core.slot of=std.request key=mood kind=atom enum=do enum=propose enum=check enum=ask present=true
@std.request.source core.slot of=std.request key=source kind=ref to=std.request.source present=true
@std.request.source.type core.type of=std.request.source closed=true
@std.request.source.text core.slot of=std.request.source key=text kind=string present=true
@std.request.query core.slot of=std.request key=query kind=ref to=std.request.query many=true
@std.request.query.type core.type of=std.request.query closed=true
@std.request.query.request core.slot of=std.request.query key=request kind=ref to=std.request present=true
@std.request.query.target core.slot of=std.request.query key=target kind=ref to=std.request.target present=true
@std.request.query.operation core.slot of=std.request.query key=operation kind=atom enum=values enum=count enum=exists enum=members present=true
@std.request.query.concept core.slot of=std.request.query key=concept kind=atom
@std.request.query.source core.slot of=std.request.query key=source kind=ref to=std.request.source
@std.request.query.source.start core.slot of=std.request.query key=source.start kind=integer min=0 max=9007199254740991
@std.request.query.source.end core.slot of=std.request.query key=source.end kind=integer min=0 max=9007199254740991
@std.request.target.type core.type of=std.request.target closed=true
@std.request.target.request core.slot of=std.request.target key=request kind=ref to=std.request present=true
@std.request.target.mode core.slot of=std.request.target key=mode kind=atom enum=new enum=existing enum=bound present=true
@std.request.target.kind core.slot of=std.request.target key=kind kind=atom
@std.request.target.name core.slot of=std.request.target key=name kind=string
@std.request.target.determiner core.slot of=std.request.target key=determiner kind=atom enum=definite enum=indefinite
@std.request.target.selector core.slot of=std.request.target key=selector kind=ref type=std.request.constraint type=std.request.not type=std.request.group type=std.request.quant
@std.request.root core.slot of=std.request key=root kind=ref type=std.request.constraint type=std.request.not type=std.request.group type=std.request.quant
@std.request.constraint.type core.type of=std.request.constraint closed=true
@std.request.constraint.request core.slot of=std.request.constraint key=request kind=ref to=std.request present=true
@std.request.constraint.target core.slot of=std.request.constraint key=target kind=ref to=std.request.target present=true
@std.request.constraint.concept core.slot of=std.request.constraint key=concept kind=atom present=true
@std.request.constraint.operator core.slot of=std.request.constraint key=operator kind=atom enum=eq enum=less.equal enum=greater.equal enum=degree enum=region enum=relation enum=same enum=occurred enum=delta enum=factor present=true
@std.request.constraint.character core.slot of=std.request.constraint key=character kind=atom enum=requirement enum=preference enum=assumption present=true
@std.request.constraint.polarity core.slot of=std.request.constraint key=polarity kind=atom enum=positive enum=negative present=true
@std.request.constraint.scope core.slot of=std.request.constraint key=scope kind=atom enum=each enum=group
@std.request.constraint.source core.slot of=std.request.constraint key=source kind=ref to=std.request.source
@std.request.constraint.source.start core.slot of=std.request.constraint key=source.start kind=integer min=0 max=9007199254740991
@std.request.constraint.source.end core.slot of=std.request.constraint key=source.end kind=integer min=0 max=9007199254740991
@std.request.constraint.value core.slot of=std.request.constraint key=value
@std.request.constraint.relation core.slot of=std.request.constraint key=relation kind=atom
@std.request.constraint.goal core.slot of=std.request.constraint key=goal kind=ref to=std.request.target
@std.request.constraint.act core.slot of=std.request.constraint key=act kind=atom
@std.request.constraint.phase core.slot of=std.request.constraint key=phase kind=atom enum=result
@std.request.constraint.unit core.slot of=std.request.constraint key=unit kind=atom
@std.request.constraint.baseline core.slot of=std.request.constraint key=baseline kind=atom enum=before
@std.request.constraint.anchor core.slot of=std.request.constraint key=anchor kind=atom
@std.request.constraint.measure core.slot of=std.request.constraint key=measure kind=number
@std.request.constraint.from core.slot of=std.request.constraint key=from kind=atom
@std.request.constraint.to core.slot of=std.request.constraint key=to kind=atom
@std.request.not.type core.type of=std.request.not closed=true
@std.request.not.request core.slot of=std.request.not key=request kind=ref to=std.request present=true
@std.request.not.of core.slot of=std.request.not key=of kind=ref type=std.request.constraint type=std.request.not type=std.request.group type=std.request.quant present=true
@std.request.group.type core.type of=std.request.group closed=true
@std.request.group.request core.slot of=std.request.group key=request kind=ref to=std.request present=true
@std.request.group.operator core.slot of=std.request.group key=operator kind=atom enum=and enum=or present=true
@std.request.group.member core.slot of=std.request.group key=member kind=ref type=std.request.constraint type=std.request.not type=std.request.group type=std.request.quant many=true present=true
@std.request.quant.type core.type of=std.request.quant closed=true
@std.request.quant.request core.slot of=std.request.quant key=request kind=ref to=std.request present=true
@std.request.quant.kind core.slot of=std.request.quant key=kind kind=atom enum=all enum=any enum=each enum=none present=true
@std.request.quant.target core.slot of=std.request.quant key=target kind=ref to=std.request.target present=true
@std.request.quant.bind core.slot of=std.request.quant key=bind kind=ref to=std.request.target present=true
@std.request.quant.body core.slot of=std.request.quant key=body kind=ref type=std.request.constraint type=std.request.not type=std.request.group type=std.request.quant present=true
@std.request.value.type core.type of=std.request.value closed=true
@std.request.value.target core.slot of=std.request.value key=target kind=ref to=std.request.target present=true
@std.request.value.concept core.slot of=std.request.value key=concept kind=atom present=true
@std.request.valid.function core.function name=std.request.valid out.kind=boolean pure=true
@std.request.valid.arg core.function.arg of=$std.request.valid.function name=request kind=ref
@std.request.validation core.validate on=std.request fn=std.request.valid why="request graph is invalid; inspectRequest reports structural issues"
`, fns: { 'std.request.valid': requestValidator },
  },
};
