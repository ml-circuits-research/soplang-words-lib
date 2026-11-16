// Opt-in structural contracts. These schemas validate records; they do not establish
// the truth, licensing suitability or semantic correctness of the recorded evidence.
// Each module owns its namespace and can be imported independently through core.use.
export const CONTRACT_MODULES = {
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
@std.objective.module core.module name=std.objective version=0.170.0 exports=std.objective exports=std.objective.term
@std.objective.type core.type of=std.objective closed=true
@std.objective.order core.slot of=std.objective key=order kind=atom enum=lexicographic present=true
@std.objective.direction core.slot of=std.objective key=direction kind=atom enum=minimise enum=maximise present=true
@std.objective.terms core.slot of=std.objective key=term kind=ref to=std.objective.term many=true present=true
@std.objective.term.type core.type of=std.objective.term closed=true
@std.objective.term.evaluator core.slot of=std.objective.term key=evaluator kind=atom present=true
@std.objective.term.normalisation core.slot of=std.objective.term key=normalisation kind=atom enum=declared.by.evaluator present=true
@std.objective.term.weight core.slot of=std.objective.term key=weight kind=number min=0 present=true
@std.objective.term.priority core.slot of=std.objective.term key=priority kind=integer min=0 max=9007199254740991 present=true
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
};
