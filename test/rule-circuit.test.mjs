import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, serialize, World } from '../tools/lib-under-test.mjs';

const arithmetic = `
@profile std.compile.rule act=double terminal=example.numeric.terminal call=example.numeric.call action=save-number
@terminal.type core.type of=example.numeric.terminal extends=std.compile.terminal closed=true
@call.type core.type of=example.numeric.call extends=std.compile.call closed=true
@numeric.argument core.slot of=example.numeric.call key=arg.value kind=number present=true
@save.action core.action name=save-number param=value when=$recorder add=$save.effect
@recorder example.numeric.recorder ready=true
@save.effect example.numeric.result number=?value
@r std.request act=double mood=do
@t std.request.target request=$r mode=new kind=number
@c std.request.constraint request=$r target=$t concept=operand operator=eq character=requirement polarity=positive value=?value
@calculate core.calc out=?double fn=mul args=?value args=2
@emit.call example.numeric.call action=save-number order=1 arg.value=?double
@emit.terminal example.numeric.terminal request=$r cover=$t cover=$c call=$emit.call
@lower core.rule when=$r when=$t when=$c with=$calculate then=$emit.call then=$emit.terminal
@ready example.numeric.recorder ready=true
`;

const arithmeticRequest = `
@request std.request act=double mood=do source=$source
@source std.request.source text="Double 7"
@target std.request.target request=$request mode=new kind=number
@size std.request.constraint request=$request target=$target concept=operand operator=eq character=requirement polarity=positive value=7
`;

function setup(declarations) {
  const world = new World();
  world.use('std.compile');
  world.load(declarations);
  return world;
}

function compilation(world, text) {
  const output = parse(world.compileRequest(text));
  const result = output.find((wire) => wire.type === 'std.compile.result');
  const calls = (result?.attrs.call || []).map((ref) => output.find((wire) => wire.id === ref.slice(1)));
  return { result, calls, evidence: output.filter((wire) => wire.type === 'std.compile.evidence') };
}

test('a declared numeric transformation compiles input graph and executes observed action', () => {
  const world = setup(arithmetic);
  const before = world.version;
  const { result, calls, evidence } = compilation(world, arithmeticRequest);
  assert.equal(result.attrs.status[0], 'compiled', result.attrs.reason?.[0]);
  assert.equal(world.version, before);
  assert.equal(world.ofType('example.numeric.result').length, 0);
  assert.equal(calls[0].attrs['arg.value'][0], '14');
  assert.ok(evidence.some((proof) => proof.attrs.rule.includes('"lower"') && proof.attrs.support.includes('"size"')));
  assert.equal(world.act(calls).ok, true);
  assert.deepEqual(world.ofType('example.numeric.result').map((wire) => wire.attrs.number[0]), ['14']);
  assert.equal(world.undo().ok, true);
  assert.equal(world.ofType('example.numeric.result').length, 0);
});

test('an interval circuit preserves call order and action guards inspect actual state', () => {
  const world = setup(`
@profile std.compile.rule act=book terminal=example.booking.terminal call=example.booking.call action=reserve-room action=record-notice
@terminal.type core.type of=example.booking.terminal extends=std.compile.terminal closed=true
@call.type core.type of=example.booking.call extends=std.compile.call closed=true
@call.start core.slot of=example.booking.call key=arg.start kind=time.clock present=true
@call.end core.slot of=example.booking.call key=arg.end kind=time.clock present=true

@reserve core.action name=reserve-room param=start param=end when=$available if=$opens if=$closes add=$reservation
@available example.availability opens=?opens closes=?closes
@opens core.check fn=gte args=?start args=?opens
@closes core.check fn=lte args=?end args=?closes
@reservation example.reservation start=?start end=?end
@notice core.action name=record-notice param=start param=end when=$confirmed add=$record
@confirmed example.reservation start=?start end=?end
@record example.notice start=?start end=?end

@r std.request act=book mood=do
@t std.request.target request=$r mode=new kind=room.reservation
@start.pattern std.request.constraint request=$r target=$t concept=start operator=eq character=requirement polarity=positive value=?start
@duration.pattern std.request.constraint request=$r target=$t concept=duration operator=eq character=requirement polarity=positive value=?duration
@calculate core.calc out=?end fn=time_add args=?start args=?duration
@announce example.booking.call action=record-notice order=2 arg.start=?start arg.end=?end
@hold example.booking.call action=reserve-room order=1 arg.start=?start arg.end=?end
@emit example.booking.terminal request=$r cover=$t cover=$start.pattern cover=$duration.pattern call=$announce call=$hold
@lower core.rule when=$r when=$t when=$start.pattern when=$duration.pattern with=$calculate then=$announce then=$hold then=$emit
@open example.availability opens=09:00 closes=12:00
`);
  const text = `
@request std.request act=book mood=do source=$source
@source std.request.source text="Book the room for 45 minutes at 10:30"
@target std.request.target request=$request mode=new kind=room.reservation
@offset std.request.constraint request=$request target=$target concept=duration operator=eq character=requirement polarity=positive value=45min
@begin std.request.constraint request=$request target=$target concept=start operator=eq character=requirement polarity=positive value=10:30
`;
  const { result, calls } = compilation(world, text);
  assert.equal(result.attrs.status[0], 'compiled', result.attrs.reason?.[0]);
  assert.deepEqual(calls.map((call) => call.attrs.action[0]), ['reserve-room', 'record-notice']);
  assert.equal(world.act(calls).ok, true);
  assert.equal(world.ofType('example.reservation')[0].attrs.end[0], '11:15');
  assert.equal(world.ofType('example.notice')[0].attrs.end[0], '11:15');
  assert.equal(world.undo().ok, true);
  assert.equal(world.ofType('example.reservation').length, 0);
  assert.equal(world.ofType('example.notice').length, 0);
  world.revise('open', { closes: '11:00' });
  assert.equal(world.act(calls).ok, false);
  assert.equal(world.ofType('example.reservation').length, 0);
});

test('an extra obligation, terminal injection and ambiguous complete circuits fail explicitly', () => {
  const world = setup(arithmetic);
  const uncovered = compilation(world, arithmeticRequest +
    '@limit std.request.constraint request=$request target=$target concept=limit operator=less.equal character=requirement polarity=positive value=15');
  assert.equal(uncovered.result.attrs.status[0], 'unavailable');
  assert.equal(uncovered.result.attrs.reason[0], 'incomplete-coverage');
  const injected = compilation(world, arithmeticRequest +
    '@prebuilt example.numeric.terminal request=$request cover=$target cover=$size call=$prebuilt.call\n' +
    '@prebuilt.call example.numeric.call action=save-number order=1 arg.value=900');
  assert.equal(injected.result.attrs.status[0], 'unavailable');
  assert.deepEqual(injected.calls, []);

  world.load(`
@other.r std.request act=double mood=do
@other.t std.request.target request=$other.r mode=new kind=number
@other.c std.request.constraint request=$other.r target=$other.t concept=operand operator=eq character=requirement polarity=positive value=?value
@other.calculate core.calc out=?quad fn=mul args=?value args=4
@other.call example.numeric.call action=save-number order=1 arg.value=?quad
@other.terminal example.numeric.terminal request=$other.r cover=$other.t cover=$other.c call=$other.call
@other.recipe core.rule when=$other.r when=$other.t when=$other.c with=$other.calculate then=$other.call then=$other.terminal
`);
  const ambiguous = compilation(world, arithmeticRequest);
  assert.equal(ambiguous.result.attrs.reason[0], 'ambiguous-derivations');
  assert.deepEqual(ambiguous.calls, []);
  assert.equal(world.ofType('example.numeric.result').length, 0);
});

test('two readings compile independently and the usable reading supplies the only executable circuit',()=>{
  const world=setup(arithmetic);
  world.use('std.interpret');
  const nodes=parse(arithmeticRequest);
  const option=(prefix,act)=>{
    const mapped=nodes.map(w=>({...w,id:prefix+w.id,attrs:Object.fromEntries(Object.entries(w.attrs).map(([key,values])=>
      [key,values.map(v=>v.startsWith('$')?'$'+prefix+v.slice(1):key==='act'?act:v)]))}));
    return '@'+prefix+' std.interpret.proposal request=$'+prefix+'request '+mapped.map(w=>'member=$'+w.id).join(' ')+'\n'+serialize(mapped);
  };
  const packet='@alternatives std.interpret.input proposal=$one proposal=$two\n'+option('one','unbound')+'\n'+option('two','double');
  const output=parse(world.compileRequest(packet));
  assert.equal(output[0].attrs.status[0],'compiled',JSON.stringify(output));
  const readings=output.filter(w=>w.type==='std.interpret.reading');
  assert.deepEqual(readings.map(w=>w.attrs.status[0]),['not-applicable','compiled']);
  assert.equal(output[0].attrs.choice[0],'$'+readings[1].id);
  const calls=output.filter(w=>w.type==='example.numeric.call');
  assert.equal(calls.length,1);
  assert.equal(world.ofType('example.numeric.result').length,0);
  assert.equal(world.act(calls).ok,true);
  assert.equal(world.ofType('example.numeric.result')[0].attrs.number[0],'14');
  const mismatch=packet.replace('Double 7','Double 8');
  assert.equal(parse(world.compileRequest(mismatch))[0].attrs.reason[0],'source-mismatch');
});
