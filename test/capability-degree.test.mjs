// Degree words and factors compile into tool values: a declared std.capability.degree scale applied to the
// value the operation would otherwise choose (std.capability.base, an argument, the declared default) or to
// the target's observed value. An invented example world: cells with a numeric level.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { World, parse, str } from '../tools/lib-under-test.mjs';

function source(extra = '') {
  const world = new World();
  world.use('std.capability');
  world.load(`
@scope std.capability.scope instance="example" version="1" newId="new-cell"
@make.mode std.capability.mode act=make target=new
@change.mode std.capability.mode act=change target=existing requireResult=true
@create std.capability.operation scope=$scope name="cell.make" act=make on="cell" order=0 eligible=true
@edit std.capability.operation scope=$scope name="cell.change" act=change on="cell" order=1 eligible=true
@create.shape std.capability.parameter operation=$create name="shape" kind=string
@create.level std.capability.parameter operation=$create name="level" kind=number min=1 max=500 default=40
@edit.id std.capability.parameter operation=$edit name="cell" kind=string required=true
@edit.level std.capability.parameter operation=$edit name="level" kind=number min=1 max=500
@mapping std.capability.target scope=$scope canonical=example.cell label="cell" operation=$create
@edit.mapping std.capability.target scope=$scope canonical=example.cell label="cell" operation=$edit
@level std.capability.property scope=$scope concept=level on="cell" parameter="level" binding="cell.level" order=0
@shape.seed std.capability.seed parameter="shape" source=label phase=initial order=0
@cell.seed std.capability.seed parameter="cell" source=target.id phase=initial order=1
@high std.capability.degree concept=level label="high" factor=1.5
@low std.capability.degree concept=level label="low" factor=0.5
@higher std.capability.degree concept=level label="higher" factor=1.25
@first std.capability.object scope=$scope id="first" source="cell-a" version="1" on="cell" kind="cell" order=0
@first.level std.capability.field object=$first binding="cell.level" key="level" value=20
${extra}`);
  return world;
}

function compile(world, act, condition) {
  const circuit = world.compileRequest(`
@source std.request.source text="a cell request"
@r std.request act=${act} mood=do source=$source
@t std.request.target request=$r mode=${act === 'make' ? 'new' : 'existing'} kind=example.cell
${condition ? `@c std.request.constraint request=$r target=$t concept=level ${condition} character=requirement` : ''}
@context std.capability.context request=$r scope=$scope`);
  const wires = parse(circuit), byId = new Map(wires.map((wire) => [wire.id, wire]));
  const result = wires[0], call = result.attrs.call && byId.get(result.attrs.call[0].slice(1));
  const args = Object.fromEntries((call?.attrs.argument || []).map((token) => {
    const arg = byId.get(token.slice(1));
    return [str(arg.attrs.name[0]), JSON.parse(arg.attrs.value[0])];
  }));
  return { result, args, skipped: (result.attrs.skipped || []).map(str), support: (result.attrs.support || []).map(str) };
}

test('a degree word scales the value the tool would choose for a new object', () => {
  const plain = compile(source(), 'make');
  assert.equal(plain.args.level, 40);
  const high = compile(source(), 'make', 'operator=degree value=high polarity=positive');
  assert.equal(high.args.level, 60, 'the declared default, times the factor');
  assert.deepEqual(high.skipped, []);
  assert.ok(high.support.includes('high'));
  assert.equal(compile(source(), 'make', 'operator=degree value=low polarity=positive').args.level, 20);
  // A measured or declared base for this operation and kind takes precedence over the declared default.
  const measured = '@measured std.capability.base scope=$scope operation="cell.make" kind=example.cell parameter="level" value=100';
  const based = compile(source(measured), 'make', 'operator=degree value=high polarity=positive');
  assert.equal(based.args.level, 150);
  assert.ok(based.support.includes('measured'));
  const otherKind = '@other std.capability.base operation="cell.make" kind=example.other parameter="level" value=100';
  assert.equal(compile(source(otherKind), 'make', 'operator=degree value=high polarity=positive').args.level, 60);
});

test('a degree or a factor on an existing object scales its observed value', () => {
  const higher = compile(source(), 'change', 'operator=degree value=higher polarity=positive');
  assert.equal(higher.args.cell, 'first');
  assert.equal(higher.args.level, 25);
  assert.ok(higher.support.includes('first.level'));
  assert.equal(compile(source(), 'change', 'operator=factor value=2 baseline=before polarity=positive').args.level, 40);
});

test('an undeclared, ambiguous, negative or out-of-range degree stays unapplied', () => {
  for (const [extra, condition] of [
    ['', 'operator=degree value=enormous polarity=positive'],
    ['@high.again std.capability.degree concept=level label="high" factor=3', 'operator=degree value=high polarity=positive'],
    ['', 'operator=degree value=high polarity=negative'],
    ['@huge std.capability.degree concept=level label="huge" factor=20', 'operator=degree value=huge polarity=positive'],
    ['@none std.capability.degree concept=level label="none" factor=0', 'operator=degree value=none polarity=positive'],
  ]) {
    const compiled = compile(source(extra), 'make', condition);
    assert.equal(compiled.args.level, 40, condition);
    assert.equal(compiled.skipped.length, 1, condition);
  }
  // Without an observed value an existing object has no base for a factor.
  const world = source();
  world.retract('first.level');
  assert.equal(compile(world, 'change', 'operator=factor value=2 baseline=before polarity=positive').result.attrs.status[0], 'unavailable');
});

test('a degree names an absolute literal when the property resolves values through the lookup table', () => {
  const world = source('@big.literal std.capability.value concept=level label="high" value=300');
  world.fill('level', 'codec', 'lookup');
  const compiled = compile(world, 'make', 'operator=degree value=high polarity=positive');
  assert.equal(compiled.args.level, 300);
  assert.ok(compiled.support.includes('big.literal'));
});

test('an integer parameter receives a rounded degree value', () => {
  const world = source();
  world.load('@create.count std.capability.parameter operation=$create name="steps" kind=integer default=3\n@steps std.capability.property scope=$scope concept=steps on="cell" parameter="steps" order=1\n@more std.capability.degree concept=steps label="many" factor=1.5');
  const circuit = world.compileRequest(`
@source std.request.source text="a cell with many steps"
@r std.request act=make mood=do source=$source
@t std.request.target request=$r mode=new kind=example.cell
@c std.request.constraint request=$r target=$t concept=steps operator=degree value=many polarity=positive character=requirement
@context std.capability.context request=$r scope=$scope`);
  assert.match(circuit, /name="steps" value=5\b/);
});
