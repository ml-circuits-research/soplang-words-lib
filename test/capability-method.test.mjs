import assert from 'node:assert/strict';
import { test } from 'node:test';
import { World, parse, str } from '../tools/lib-under-test.mjs';
import { decodeCapabilityCall } from '../src/internal/capability-call.mjs';

function source({complete=true,missing=false}={}) {
  const world = new World();
  world.use('std.capability');
  world.load(`
@scope std.capability.scope instance="example" version="3" newId="new-cell" clock=100 population="all-cells" populationComplete=${complete}
@make.mode std.capability.mode act=make target=new
@change.mode std.capability.mode act=change target=existing requireResult=true selector=true
@create std.capability.operation scope=$scope name="cell.make" act=make on="cell" order=0 eligible=true
@edit std.capability.operation scope=$scope name="cell.change" act=change on="cell" order=1 eligible=true
@limited std.capability.operation scope=$scope name="cell.tweak" act=change on="cell" order=2 eligible=true
@create.kind std.capability.parameter operation=$create name="shape" kind=string enum="small"
@create.id std.capability.parameter operation=$create name="reserve" kind=string required=true
@edit.id std.capability.parameter operation=$edit name="cell" kind=string required=true
@edit.level std.capability.parameter operation=$edit name="level" kind=integer min=0 max=100
@edit.samples std.capability.parameter operation=$edit name="samples" kind=array
@limited.id std.capability.parameter operation=$limited name="cell" kind=string required=true
@limited.level std.capability.parameter operation=$limited name="level" kind=integer min=10 max=20
@mapping std.capability.target scope=$scope canonical=small.cell label="small" operation=$create
@level std.capability.property scope=$scope concept=reading on="cell" parameter="level" binding="cell.reading" order=0
@panels std.capability.property scope=$scope concept=samples on="cell" parameter="samples" codec=number.list order=1
@shape.seed std.capability.seed parameter="shape" source=kind phase=initial order=0 required=true
@reserve.seed std.capability.seed parameter="reserve" source=fresh.id phase=initial order=1
@cell.seed std.capability.seed parameter="cell" source=target.id phase=initial order=2
@first std.capability.object scope=$scope id="first" source="cell-a" version="3" on="cell" kind="small" name="Left" order=0
@last std.capability.object scope=$scope id="last" source="cell-b" version="3" on="cell" kind="small" name="Right" order=1
@first.reading std.capability.field object=$first binding="cell.reading" key="reading" value=10
${missing?'':'@last.reading std.capability.field object=$last binding="cell.reading" key="reading" value=20'}
`);
  return world;
}

function compile(world, extra = '', target = '') {
  const input = `
@r std.request act=change mood=do source=$source
@source std.request.source text="Change the cell"
@t std.request.target request=$r mode=existing kind=small.cell ${target}
@reading std.request.constraint request=$r target=$t concept=reading operator=eq character=requirement polarity=positive value=15
@samples std.request.constraint request=$r target=$t concept=samples operator=eq character=requirement polarity=positive value="[3,3,8]"
${extra}
`;
  const circuit = world.compileRequest(input + '\n@context std.capability.context request=$r scope=$scope');
  const wires = parse(circuit);
  const byId = new Map(wires.map((wire) => [wire.id, wire]));
  const dereference = (token) => byId.get(token.slice(1));
  const result = wires[0];
  const call = result.attrs.call && dereference(result.attrs.call[0]);
  const args = Object.fromEntries((call?.attrs.argument || []).map((token) => {
    const arg = dereference(token);
    return [str(arg.attrs.name[0]), arg.attrs.value[0]];
  }));
  return { result, call, args, dereference, circuit };
}

test('capability selection follows observed recency, focus, names, and declared selector binding', () => {
  const world = source();
  assert.equal(compile(world).args.cell, '"last"');
  assert.equal(compile(world, '', 'name="Left"').args.cell, '"first"');
  assert.equal(compile(world, '@condition std.request.constraint request=$r target=$t concept=reading operator=eq character=requirement polarity=positive value=10',
    'selector=$condition').args.cell, '"first"');
  world.fill('scope', 'focus', '"first"');
  assert.equal(compile(world).args.cell, '"first"');
});

test('capability ranking retains alternatives and repeated ordered array parameters', () => {
  const { result, call, args, dereference } = compile(source());
  assert.equal(result.attrs.status[0], 'compiled');
  assert.equal(call.attrs.operation[0], '"cell.change"');
  assert.equal(args.level, '15');
  const members = dereference(args.samples).attrs.member.map(dereference);
  assert.deepEqual(members.map((wire) => [wire.attrs.index[0], wire.attrs.value[0]]), [['0', '3'], ['1', '3'], ['2', '8']]);
  const ranked = result.attrs.alternative.map(dereference);
  assert.deepEqual(ranked.map((row) => [str(row.attrs.operation[0]), row.attrs.applied[0]]),
    [['cell.change', '2'], ['cell.tweak', '1']]);
  assert.deepEqual(result.attrs.covered.map(str), ['reading', 'samples']);
});

test('a compiled request supplies mechanical tool inputs without a host re-encoding its arguments', () => {
  const world = source();
  const input = world.compileToolInput(compile(world).circuit);
  const { operation, args } = decodeCapabilityCall(parse(input));
  assert.equal(operation, 'cell.change');
  assert.deepEqual(args, { cell: 'last', level: 15, samples: [3, 3, 8] });
});

test('complete coverage and live occupancy guards apply by authored policy', () => {
  const world = source();
  world.load(`
@complete std.capability.guard operation="cell.change" when=incomplete.coverage reason=need-all
@locked std.capability.guard operation="cell.change" when=active.signal signal=locked reason=occupied
`);
  const extra = '@note std.request.constraint request=$r target=$t concept=ignored operator=eq character=requirement polarity=positive value=27';
  assert.equal(compile(world, extra).result.attrs.reason[0], 'need-all');
  assert.equal(compile(world).result.attrs.status[0], 'compiled');
  world.load('@observed std.capability.signal scope=$scope name=locked');
  assert.equal(compile(world).result.attrs.reason[0], 'occupied');
});

test('a scoped preference breaks a tie in coverage and a hard guard selects the equally capable alternative',()=>{
 const world=source();
 world.load(`@tweak.samples std.capability.parameter operation=$limited name="samples" kind=array
@scope2 std.capability.scope instance="other" version="1"
@unrelated std.capability.preference scope=$scope2 operation=$limited weight=500`);
 assert.equal(str(compile(world).call.attrs.operation[0]),'cell.change');
 world.load('@user.choice std.capability.preference scope=$scope operation=$limited weight=3');
 let result=compile(world);
 assert.equal(str(result.call.attrs.operation[0]),'cell.tweak');
 assert.ok(result.result.attrs.support.map(str).includes('user.choice'));
 world.load('@lock std.capability.guard operation="cell.tweak" when=active.signal signal=locked reason=occupied\n@live std.capability.signal scope=$scope name=locked');
 result=compile(world);
 assert.equal(str(result.call.attrs.operation[0]),'cell.change');
 assert.ok(result.result.attrs.alternative.map(result.dereference).some(row=>row.attrs.reason?.[0]==='occupied'));
});

test('strict selectors join declared lookup values and retain all considered observations', () => {
  const world = source();
  world.fill('change.mode', 'selectorUnique', 'true');
  world.fill('level', 'codec', 'lookup');
  world.load('@one std.capability.value concept=reading label="low" value=10\n@set std.capability.value concept=reading label="15" value=15');
  const selector = '@condition std.request.constraint request=$r target=$t concept=reading operator=eq character=assumption polarity=positive value="low"';
  const run = () => compile(world, selector, 'selector=$condition');
  const compiled = run();
  assert.equal(compiled.args.cell, '"first"');
  assert.deepEqual(compiled.result.attrs.selection.map(compiled.dereference).map(row => row.attrs.status[0]), ['match', 'mismatch']);
  assert.ok(compiled.result.attrs.support.includes('"one"'));
  world.retract('last.reading');
  const unknown = run();
  assert.equal(unknown.result.attrs.reason[0], 'target');
  assert.deepEqual(unknown.result.attrs.selection.map(unknown.dereference).map(row => row.attrs.status[0]), ['match', 'unknown']);
  world.load('@another std.capability.value concept=reading label="low" value=20');
  assert.equal(run().result.attrs.reason[0], 'value');
});

function observe(world, operations, value=10, concept='reading'){
 const request=`@s std.request.source text="Observe the reading"
@r std.request act=inspect mood=ask source=$s ${operations.map((op,i)=>'query=$q'+i).join(' ')}
@t std.request.target request=$r mode=existing kind=small.cell selector=$filter
@filter std.request.constraint request=$r target=$t concept=reading operator=eq character=requirement polarity=positive value=${value}
${operations.map((op,i)=>'@q'+i+' std.request.query request=$r target=$t operation='+op+(op==='values'?' concept='+concept:'')).join('\n')}
@context std.capability.context request=$r scope=$scope`;
 const compiled=world.compileRequest(request),wires=parse(compiled);
 return {compiled,result:wires[0],answers:wires.filter(row=>row.type==='std.capability.query.answer'),wires};
}
test('read-only scoped queries reuse the selector and answer all four projections without selecting a tool',()=>{
 const world=source();
 const before=world.toJSON();
 const {compiled,result,answers,wires}=observe(world,['count','exists','members','values']);
 assert.equal(result.attrs.status[0],'answered',compiled);
 assert.deepEqual(answers.map(row=>row.attrs.value?.[0]),['1','true',undefined,undefined]);
 const found=answers.slice(-2).map(row=>wires.find(member=>'$'+member.id===row.attrs.member[0]));
 assert.deepEqual(found.map(row=>str(row.attrs.name[0])),['Left','Left']);
 assert.deepEqual(found[1].attrs.value,['10']);
 assert.equal(wires.some(wire=>wire.type==='std.capability.call'),false);
 const unsupported=observe(world,['count','values'],10,'unknown.property');
 assert.equal(unsupported.result.attrs.status[0],'partial');
 assert.equal(unsupported.answers[1].attrs.reason[0],'unobserved-query-value');
 assert.deepEqual(world.toJSON(),before);
 const empty=observe(world,['count','exists','members'],25);
 assert.deepEqual(empty.answers.map(row=>row.attrs.value?.[0]),['0','false',undefined]);
 assert.equal(empty.answers[2].attrs.member,undefined);
});
test('a query on a family target (family=true) takes the whole source type, named members by their name',()=>{
 const ask=(family,name)=>{
  const world=source();
  if(family)world.load('@cells.mapping std.capability.target scope=$scope canonical=any.cell label="cell" operation=$create family=true');
  const wires=parse(world.compileRequest(`@s std.request.source text="What reading has the cell?"
@r std.request act=inspect mood=ask source=$s query=$q
@t std.request.target request=$r mode=existing kind=any.cell${name?' name="'+name+'"':''}
@q std.request.query request=$r target=$t operation=values concept=reading
@context std.capability.context request=$r scope=$scope`));
  const answer=wires.find(row=>row.type==='std.capability.query.answer');
  return {answer,members:(answer.attrs.member??[]).map(id=>wires.find(row=>'$'+row.id===id))};
 };
 assert.equal(ask(false).answer.attrs.reason[0],'unbound-query-population','without a family mapping a kind label alone proves nothing');
 const all=ask(true);
 assert.equal(all.answer.attrs.status[0],'answered');
 assert.deepEqual(all.members.map(row=>str(row.attrs.name[0])),['Left','Right']);
 const named=ask(true,'Right');
 assert.deepEqual(named.members.map(row=>str(row.attrs.name[0])),['Right']);
});
test('unknown fields and incomplete populations retain limitations while witnessed existence remains valid',()=>{
 const world=source({complete:false});
 const {result,answers}=observe(world,['count','exists','members']);
 assert.equal(result.attrs.status[0],'partial');
 assert.deepEqual(answers.map(row=>row.attrs.reason?.[0]),['incomplete-query-population',undefined,'incomplete-query-population']);
 assert.equal(answers[1].attrs.value[0],'true');
 assert.equal(answers[1].attrs.complete[0],'false');
 assert.equal(observe(world,['exists'],90).answers[0].attrs.reason[0],'incomplete-query-population');
 const incomplete=source({missing:true});
 assert.equal(observe(incomplete,['count']).answers[0].attrs.reason[0],'incomplete-query-population');
 const missing=observe(incomplete,['values']);
 assert.equal(missing.answers[0].attrs.reason[0],'incomplete-query-population');
});

// A kind that no kind parameter accepts (one another operation of the same source type creates, such as a catalog
// import) is denoted by an observed kind equal to one of its labels, never by the shared source type alone; a member
// the user named with a label ("the box" for a rectangle named Box) is a fallback only when no member has the kind.
test('an existing target whose kind no enum accepts matches members of that observed kind, then user-named ones', () => {
  const extra = (objects) => {
    const world = source();
    world.load(`@catalog std.capability.operation scope=$scope name="cell.import" act=make on="cell" order=3 eligible=true
@catalog.name std.capability.parameter operation=$catalog name="thing" kind=string required=true
@box.mapping std.capability.target scope=$scope canonical=box.cell label="box" operation=$catalog
${objects}`);
    return world;
  };
  const change = (world) => {
    const circuit = world.compileRequest(`
@r std.request act=change mood=do source=$source
@source std.request.source text="Change the box"
@t std.request.target request=$r mode=existing kind=box.cell
@reading std.request.constraint request=$r target=$t concept=reading operator=eq character=requirement polarity=positive value=15
@context std.capability.context request=$r scope=$scope`);
    const wires = parse(circuit), byId = new Map(wires.map((w) => [w.id, w])), result = wires[0];
    const call = result.attrs.call && byId.get(result.attrs.call[0].slice(1));
    const cell = (call?.attrs.argument || []).map((t) => byId.get(t.slice(1))).find((a) => str(a.attrs.name[0]) === 'cell');
    return { status: result.attrs.status[0], cell: cell && cell.attrs.value[0] };
  };
  assert.notEqual(change(extra('')).status, 'compiled', 'the source type alone does not make a small cell the box');
  assert.equal(change(extra('@crate std.capability.object scope=$scope id="crate" source="cell-c" version="3" on="cell" kind="box" order=0')).cell, '"crate"');
  assert.equal(change(extra('@named std.capability.object scope=$scope id="named" source="cell-d" version="3" on="cell" kind="square" name="Box" order=0')).cell, '"named"');
  const whole = extra('');
  whole.load('@cells.mapping std.capability.target scope=$scope canonical=box.cell label="cells" operation=$catalog family=true');
  assert.equal(change(whole).cell, '"last"', 'a family mapping names the whole source type');
  assert.equal(change(extra(`@crate std.capability.object scope=$scope id="crate" source="cell-c" version="3" on="cell" kind="box" order=0
@named std.capability.object scope=$scope id="named" source="cell-d" version="3" on="cell" kind="square" name="Box" order=1`)).cell, '"crate"', 'the observed kind wins over a name');
});

test('a count with no parameter makes the call that many times when the family declares it repeatable', () => {
  const ask = (n, declared) => {
    const world = source();
    if (declared) world.load('@cells.repeat std.capability.repeat scope=$scope on="cell" act=make concept=count max=16');
    const rows = parse(world.compileRequest(`
@r std.request act=make mood=do source=$source
@source std.request.source text="make cells"
@t std.request.target request=$r mode=new kind=small.cell
@n std.request.constraint request=$r target=$t concept=count operator=eq character=requirement polarity=positive value=${n}
@context std.capability.context request=$r scope=$scope`));
    return rows[0];
  };
  const counted = ask(3, true);
  assert.equal(counted.attrs.status[0], 'compiled');
  assert.equal(counted.attrs.repeat[0], '3');
  assert.deepEqual(counted.attrs.covered.map(str), ['n']);
  assert.ok(counted.attrs.support.map(str).includes('cells.repeat'));
  assert.equal(ask(1, true).attrs.repeat, undefined, 'one is the call itself');
  const undeclared = ask(3, false);
  assert.equal(undeclared.attrs.repeat, undefined);
  assert.deepEqual(undeclared.attrs.skipped.map(str), ['count 3'], 'without the declaration the count stays unapplied');
  assert.deepEqual(ask(40, true).attrs.skipped.map(str), ['count 40'], 'beyond the declared maximum it stays unapplied');
});
