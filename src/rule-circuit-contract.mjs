export const ruleCircuitContracts = {
  'std.compile': {
    text: `
@std.compile.module core.module name=std.compile version=0.211.0 imports=std.request exports=std.compile.rule exports=std.compile.terminal exports=std.compile.call exports=std.compile.result exports=std.compile.evidence
@std.compile.rule.type core.type of=std.compile.rule closed=true
@std.compile.rule.act core.slot of=std.compile.rule key=act kind=atom present=true
@std.compile.rule.terminal core.slot of=std.compile.rule key=terminal kind=atom present=true
@std.compile.rule.call core.slot of=std.compile.rule key=call kind=atom present=true
@std.compile.rule.action core.slot of=std.compile.rule key=action kind=atom many=true present=true
@std.compile.terminal.type core.type of=std.compile.terminal closed=true
@std.compile.terminal.request core.slot of=std.compile.terminal key=request kind=ref to=std.request present=true
@std.compile.terminal.cover core.slot of=std.compile.terminal key=cover kind=ref many=true
@std.compile.terminal.call core.slot of=std.compile.terminal key=call kind=ref to=std.compile.call many=true present=true
@std.compile.call.type core.type of=std.compile.call closed=true
@std.compile.call.action core.slot of=std.compile.call key=action kind=atom present=true
@std.compile.call.order core.slot of=std.compile.call key=order kind=integer min=1 max=9007199254740991 present=true
@std.compile.result.type core.type of=std.compile.result closed=true
@std.compile.result.status core.slot of=std.compile.result key=status kind=atom enum=compiled enum=unavailable enum=not-applicable present=true
@std.compile.result.reason core.slot of=std.compile.result key=reason kind=atom
@std.compile.result.call core.slot of=std.compile.result key=call kind=ref to=std.compile.call many=true
@std.compile.result.evidence core.slot of=std.compile.result key=evidence kind=ref to=std.compile.evidence many=true
@std.compile.evidence.type core.type of=std.compile.evidence closed=true
@std.compile.evidence.wire core.slot of=std.compile.evidence key=wire kind=string present=true
@std.compile.evidence.rule core.slot of=std.compile.evidence key=rule kind=string present=true
@std.compile.evidence.support core.slot of=std.compile.evidence key=support kind=string many=true
`, fns: {},
  },
};
