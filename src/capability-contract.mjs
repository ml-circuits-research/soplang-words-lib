const types = {
  context: {
    request: 'kind=ref to=std.request present=true', scope: 'kind=ref to=std.capability.scope present=true',
  },
  scope: {
    instance: 'kind=string present=true', version: 'kind=string present=true', populationComplete: 'kind=boolean', population: 'kind=string', focus: 'kind=string',
    newId: 'kind=string', targetUnique: 'kind=boolean', clock: 'kind=number', unapplied: 'kind=string many=true',
  },
  operation: {
    scope: 'kind=ref to=std.capability.scope present=true', name: 'kind=string present=true',
    act: 'kind=atom present=true', on: 'kind=string present=true', order: 'kind=integer min=0 present=true',
    eligible: 'kind=boolean present=true',
  },
  parameter: {
    operation: 'kind=ref to=std.capability.operation present=true', name: 'kind=string present=true',
    kind: 'kind=atom enum=string enum=boolean enum=number enum=integer enum=array enum=object present=true',
    required: 'kind=boolean', nullable: 'kind=boolean', min: 'kind=number', max: 'kind=number',
    enum: 'kind=any many=true', enumClosed: 'kind=boolean', default: 'kind=any',
  },
  target: {
    scope: 'kind=ref to=std.capability.scope present=true',
    canonical: 'kind=atom present=true', label: 'kind=string present=true',
    operation: 'kind=ref to=std.capability.operation present=true',
    argument: 'kind=ref to=std.capability.arg many=true',
  },
  mode: {
    act: 'kind=atom present=true', target: 'kind=atom enum=new enum=existing present=true',
    requireResult: 'kind=boolean', selector: 'kind=boolean', selectorUnique: 'kind=boolean',
  },
  property: {
    scope: 'kind=ref to=std.capability.scope present=true', concept: 'kind=atom present=true',
    on: 'kind=string present=true', parameter: 'kind=string present=true',
    binding: 'kind=string', codec: 'kind=atom enum=number.list enum=string.list enum=lookup',
    order: 'kind=integer min=0 present=true',
  },
  object: {
    scope: 'kind=ref to=std.capability.scope present=true', id: 'kind=string present=true',
    source: 'kind=string present=true', version: 'kind=string present=true',
    on: 'kind=string present=true', kind: 'kind=string present=true', name: 'kind=string',
    order: 'kind=integer min=0 present=true',
  },
  field: {
    object: 'kind=ref to=std.capability.object present=true', binding: 'kind=string present=true',
    key: 'kind=string present=true', value: 'kind=any many=true',
  },
  value: {
    concept: 'kind=atom present=true', label: 'kind=string present=true', value: 'kind=any present=true',
  },
  degree: {
    concept: 'kind=atom present=true', label: 'kind=string present=true', factor: 'kind=number present=true',
  },
  base: {
    scope: 'kind=ref to=std.capability.scope', operation: 'kind=string present=true', kind: 'kind=atom',
    parameter: 'kind=string present=true', value: 'kind=any present=true',
  },
  seed: {
    scope: 'kind=ref to=std.capability.scope', kind: 'kind=atom',
    operation: 'kind=string', act: 'kind=atom', parameter: 'kind=string present=true',
    source: 'kind=atom enum=value enum=target.id enum=target.list enum=fresh.id enum=target.name enum=label enum=kind enum=name.or.label enum=clock enum=ordinal.list present=true',
    phase: 'kind=atom enum=initial enum=missing present=true', value: 'kind=any', from: 'kind=string',
    required: 'kind=boolean', parameterRequired: 'kind=boolean', unlessParameter: 'kind=string', replace: 'kind=boolean',
    notice: 'kind=string', order: 'kind=integer min=0 present=true',
    whenArgument: 'kind=ref to=std.capability.arg many=true',
  },
  preference: {
    scope: 'kind=ref to=std.capability.scope present=true',
    operation: 'kind=ref to=std.capability.operation present=true',
    weight: 'kind=integer min=-1000 max=1000 present=true',
  },
  guard: {
    operation: 'kind=string present=true', when: 'kind=atom enum=incomplete.coverage enum=active.signal present=true',
    signal: 'kind=atom', reason: 'kind=atom present=true', message: 'kind=string',
  },
  signal: {
    scope: 'kind=ref to=std.capability.scope present=true', name: 'kind=atom present=true',
  },
  arg: { name: 'kind=string present=true', value: 'kind=any present=true' },
  record: { entry: 'kind=ref to=std.capability.arg many=true' },
  list: { member: 'kind=ref to=std.capability.item many=true' },
  item: { index: 'kind=integer min=0 present=true', value: 'kind=any present=true' },
  call: {
    operation: 'kind=string present=true', argument: 'kind=ref to=std.capability.arg many=true',
  },
  alternative: {
    operation: 'kind=string present=true', status: 'kind=atom enum=available enum=unavailable present=true',
    preference: 'kind=integer', support: 'kind=string many=true', applied: 'kind=integer min=0', reason: 'kind=atom',
  },
  selection: {
    id: 'kind=string present=true', status: 'kind=atom enum=match enum=mismatch enum=unknown present=true',
    support: 'kind=string many=true',
  },
  'query.result': {
    status: 'kind=atom enum=answered enum=partial enum=unavailable present=true', reason: 'kind=atom',
    instance: 'kind=string', version: 'kind=string', population: 'kind=string',
    answer: 'kind=ref to=std.capability.query.answer many=true',
  },
  'query.answer': {
    query: 'kind=string present=true', operation: 'kind=atom enum=count enum=exists enum=members enum=values present=true',
    status: 'kind=atom enum=answered enum=unavailable present=true', reason: 'kind=atom', complete: 'kind=boolean present=true',
    kind: 'kind=string', concept: 'kind=atom', value: 'kind=any',
    member: 'kind=ref to=std.capability.query.member many=true',
    selection: 'kind=ref to=std.capability.selection many=true', support: 'kind=string many=true',
  },
  'query.member': {
    query: 'kind=string present=true', id: 'kind=string present=true', source: 'kind=string present=true',
    kind: 'kind=string present=true', on: 'kind=string present=true', name: 'kind=string',
    value: 'kind=any many=true', support: 'kind=string many=true',
  },
  result: {
    status: 'kind=atom enum=compiled enum=unavailable enum=not-applicable present=true', reason: 'kind=atom',
    message: 'kind=string', act: 'kind=atom', kind: 'kind=string', id: 'kind=string', source: 'kind=string',
    instance: 'kind=string', version: 'kind=string', call: 'kind=ref to=std.capability.call',
    alternative: 'kind=ref to=std.capability.alternative many=true', target: 'kind=string many=true',
    selection: 'kind=ref to=std.capability.selection many=true', selector: 'kind=string',
    covered: 'kind=string many=true', skipped: 'kind=string many=true', note: 'kind=string many=true',
    support: 'kind=string many=true',
  },
};

const prefix = 'std.capability.';
const declarations = Object.entries(types).flatMap(([type, fields]) => {
  const id = prefix + type;
  return [
    `@${id}.type core.type of=${id} closed=true`,
    ...Object.entries(fields).map(([key, slots]) => `@${id}.slot.${key} core.slot of=${id} key=${key} ${slots}`),
  ];
});
const module = '@std.capability.module core.module name=std.capability version=0.212.0 imports=std.request ' +
  Object.keys(types).map((type) => 'exports=' + prefix + type).join(' ');

export const capabilityContracts = {
  'std.capability': { text: [module, ...declarations].join('\n'), fns: {} },
};
