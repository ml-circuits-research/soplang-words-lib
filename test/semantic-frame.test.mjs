import assert from 'node:assert/strict';
import { test } from 'node:test';
import { World, parse, str, serializeRequestGraph, prepareRequestBatch, FRAME_FORMAT, inspectFrame, bindFrame, frameToRequests, completeFragment, capabilityTable } from '../tools/lib-under-test.mjs';

// An invented board of tiles and lamps; one property row per concept and source type is the whole binding.
const BOARD = `
@scope std.capability.scope instance="board" version="1" newId="n1" clock=1 population="all" populationComplete=true
@make.mode std.capability.mode act=make target=new
@change.mode std.capability.mode act=change target=existing requireResult=true selector=true
@tile.make std.capability.operation scope=$scope name="tile.make" act=make on="tile" order=0 eligible=true
@tile.change std.capability.operation scope=$scope name="tile.change" act=change on="tile" order=1 eligible=true
@lamp.change std.capability.operation scope=$scope name="lamp.change" act=change on="lamp" order=2 eligible=true
@tile.make.shape std.capability.parameter operation=$tile.make name="shape" kind=string
@tile.make.hue std.capability.parameter operation=$tile.make name="hue" kind=string
@tile.change.id std.capability.parameter operation=$tile.change name="id" kind=string required=true
@tile.change.hue std.capability.parameter operation=$tile.change name="hue" kind=string
@lamp.change.id std.capability.parameter operation=$lamp.change name="id" kind=string required=true
@lamp.change.glow std.capability.parameter operation=$lamp.change name="glow" kind=string
@square std.capability.target scope=$scope canonical=board.square label="square" operation=$tile.make
@lamp std.capability.target scope=$scope canonical=board.lamp label="lamp" operation=$lamp.change
@hue std.capability.property scope=$scope concept=colour on="tile" parameter="hue" order=0
@glow std.capability.property scope=$scope concept=colour on="lamp" parameter="glow" order=1
@repeat std.capability.repeat scope=$scope on="tile" act=make concept=count max=8
@shape.seed std.capability.seed parameter="shape" source=kind phase=initial order=0
@id.seed std.capability.seed parameter="id" source=target.id phase=initial order=1
@t1 std.capability.object scope=$scope id="t1" source="t1" version="1" on="tile" kind="square" name="Start" order=0
@l1 std.capability.object scope=$scope id="l1" source="l1" version="1" on="lamp" kind="lamp" name="Hall" order=1
`;
function board() { const w = new World(); w.use('std.capability'); w.load(BOARD); return w; }
const table = (w) => ({ ...capabilityTable(w, 'scope'), amounts: [{ name: 'some', typical: 3 }, { name: 'few', typical: 3 }] });

const frame = (text, clauses, extra = {}) => ({ format: FRAME_FORMAT, text, clauses, ...extra });
const make = (text, m, roles = {}) => ({ span: text, action: { act: 'make', mood: 'do' }, mentions: [m], ...roles });

test('one colour concept binds to the parameter each source type declares for it', () => {
  const w = board();
  const f = frame('make the hall lamp red', [{ span: 'make the hall lamp red', action: { act: 'change', mood: 'do', predicate: 'make' },
    mentions: [{ head: 'lamp', name: 'Hall', determiner: 'definite', reference: 'name' }],
    attributes: [{ theme: 0, concept: 'colour', value: 'red', value_span: 'red', value_type: 'colour', operator: 'eq' }] }]);
  assert.ok(inspectFrame(f).ok);
  const binding = bindFrame(f, table(w));
  assert.deepEqual(binding.bound.find((r) => r.role === 'attribute').bound, { on: 'lamp', parameter: 'glow' });
  const { entries, disclosed } = frameToRequests(f, { binding });
  assert.equal(disclosed.length, 0);
  assert.ok(prepareRequestBatch({ entries }).ok);
  const out = parse(w.compileRequest(entries[0].wires + `\n@context std.capability.context request=$${entries[0].request} scope=$scope`));
  assert.equal(out[0].attrs.status[0], 'compiled');
  const call = out.find((x) => x.type === 'std.capability.call');
  assert.equal(str(call.attrs.operation[0]), 'lamp.change');
  const args = Object.fromEntries(call.attrs.argument.map((a) => out.find((x) => '$' + x.id === a)).map((a) => [str(a.attrs.name[0]), str(a.attrs.value[0])]));
  assert.equal(args.glow, 'red');
});

test('unbound roles are disclosed and the bound rest still compiles (partial execution)', () => {
  const w = board();
  const f = frame('add some irregular blue squares on the left', [make('add some irregular blue squares on the left',
    { head: 'square', determiner: 'indefinite', reference: 'new', quantity: { vague: 'some' }, modifiers: ['irregular'] },
    { attributes: [{ theme: 0, concept: 'colour', value: 'blue', operator: 'eq' }], spatial: [{ theme: 0, region: 'left' }] })]);
  const binding = bindFrame(f, table(w));
  assert.equal(binding.complete, false);
  const { entries, disclosed, notes } = frameToRequests(f, { binding });
  assert.deepEqual(disclosed.map((d) => d.role).sort(), ['modifier', 'region']);
  assert.match(notes[0].note, /some read as 3/);
  const out = parse(w.compileRequest(entries[0].wires + `\n@context std.capability.context request=$${entries[0].request} scope=$scope`));
  assert.equal(out[0].attrs.status[0], 'compiled');
  assert.equal(out[0].attrs.repeat[0], '3');
});

test('coordination gives one request per theme; a sequence orders clauses; anaphora takes its antecedent kind', () => {
  const w = board();
  const coord = frame('add a square and the hall lamp', [{ action: { act: 'make' }, mentions: [{ head: 'square', reference: 'new' }, { head: 'square', reference: 'new', quantity: { number: 2 } }] }]);
  const a = frameToRequests(coord, { binding: bindFrame(coord, table(w)) });
  assert.equal(a.entries.length, 2);
  const seq = frame('add a square. make it red', [
    make('add a square', { head: 'square', reference: 'new', determiner: 'indefinite' }),
    { span: 'make it red', action: { act: 'change' }, mentions: [{ reference: 'anaphora', antecedent: { clause: 0, mention: 0 } }], attributes: [{ theme: 0, concept: 'colour', value: 'red' }] }],
  { structure: { relations: [{ type: 'sequence', from: 0, to: 1 }] } });
  const b = frameToRequests(seq, { binding: bindFrame(seq, table(w)) });
  assert.deepEqual(b.entries.map((e) => e.after), [[], ['f0.0']]);
  assert.match(b.entries[1].wires, /kind=board\.square mode|mode=existing kind=board\.square/);
  const plan = prepareRequestBatch({ entries: b.entries });
  assert.ok(plan.ok);
  assert.deepEqual(plan.plan.layers, [['f0.0'], ['f1.0']]);
});

test('a fragment completes the previous frame; frame roles are optional request slots', () => {
  const previous = frame('make the hall lamp red', [{ action: { act: 'change' }, mentions: [{ head: 'lamp', name: 'Hall', reference: 'name' }], attributes: [{ theme: 0, concept: 'colour', value: 'red' }] }]);
  const done = completeFragment(frame('and blue instead', [{ fragment: 'replaces', mentions: [], attributes: [{ concept: 'colour', value: 'blue' }] }], { previous: { text: previous.text, frame: previous } }));
  assert.equal(done.clauses[0].action.act, 'change');
  assert.deepEqual(done.clauses[0].attributes.map((x) => x.value), ['blue']);
  const more = completeFragment(frame('more', [{ fragment: 'more' }], { previous: { frame: previous } }));
  assert.equal(more.clauses[0].attributes[0].step, 'more');
  // extended slots validate; extended:false writes only the older contract
  const f = frame('make the roof of the house blue', [{ action: { act: 'change', predicate: 'make' }, mentions: [{ head: 'roof', reference: 'description', possessor: 1 }, { head: 'house', role: 'possessor', reference: 'description' }], attributes: [{ theme: 0, concept: 'colour', value: 'blue' }] }]);
  const ext = frameToRequests(f);
  assert.ok(serializeRequestGraph(ext.entries[0].wires).ok);
  assert.match(ext.entries[0].wires, /of=\$/);
  const base = frameToRequests(f, { extended: false });
  assert.doesNotMatch(base.entries[0].wires, /of=|head=|role=|predicate=/);
  assert.equal(base.disclosed[0].role, 'possessor');
  assert.ok(serializeRequestGraph(base.entries[0].wires).ok);
});

test('frame inspection reports bank and index errors', () => {
  const bad = frame('x', [{ action: { act: 'fly' }, mentions: [{ head: 'a', possessor: 0 }], attributes: [{ theme: 3, concept: 'colour' }] }]);
  const reasons = inspectFrame(bad).issues.map((i) => i.reason);
  assert.ok(reasons.includes('not-in-bank:act'));
  assert.ok(reasons.includes('own-possessor'));
  assert.ok(reasons.includes('mention-index'));
});
