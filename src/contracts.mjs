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
};
