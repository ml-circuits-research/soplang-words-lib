import test from 'node:test';
import assert from 'node:assert/strict';

const bundle = process.env.SOPWORLD_BUNDLE === '1';
const { World, serialize, parse } = await import(bundle ? '../docs/sopworld.mjs' : '../src/index.mjs');

const schema = `@acts core.use world=std.acts
@w std.schema.world name=notes
@t core.type of=note extends=std.schema.thing closed=true
@s core.slot of=note key=text kind=string
@k std.schema.kind of=note world=notes acts=make acts=change`;

test('make and change store text values the same way, whether given plain or as a quoted literal', () => {
  const w = new World();
  assert.equal(w.load(schema).ok, true);
  assert.equal(w.act({ action: 'make', args: { kind: 'note', text: 'two words' } }).ok, true);
  assert.equal(w.act({ action: 'make', args: { kind: 'note', text: '"two words"' } }).ok, true);
  const [a, b] = w.ofType('note');
  assert.deepEqual([a.attrs.text[0], b.attrs.text[0]], ['"two words"', '"two words"']);
  assert.equal(w.act({ action: 'change', args: { thing: a.id, attr: 'text', value: 'three more words' } }).ok, true);
  assert.equal(w.act({ action: 'change', args: { thing: b.id, attr: 'text', value: '"three more words"' } }).ok, true);
  const text = serialize(w.ofType('note'));
  assert.equal(parse(text).length, 2);
  assert.deepEqual(w.ofType('note').map((n) => n.attrs.text[0]), ['"three more words"', '"three more words"']);
});

test('concat joins the texts of its values, not their quotes', () => {
  const w = new World();
  w.load(`@p item name=?n
@c core.calc out=?l fn=concat args=?n args=" and " args=more
@o label of=$p text=?l
@r core.rule when=$p with=$c then=$o`);
  w.tell('@i item name=tea');
  assert.equal(w.ofType('label')[0].attrs.text[0], 'tea and more');
});

test('a list changes every value of a many-valued key in one step', () => {
  const w = new World();
  w.load(`@acts core.use world=std.acts
@w std.schema.world name=team
@p core.type of=member extends=std.schema.thing closed=true
@n core.slot of=member key=name kind=atom
@g core.type of=group extends=std.schema.thing closed=true
@m core.slot of=group key=member type=member many=true
@k1 std.schema.kind of=member world=team acts=make
@k2 std.schema.kind of=group world=team acts=make acts=change`);
  for (const name of ['ana', 'bo', 'cy']) w.act({ action: 'make', args: { kind: 'member', name } });
  const [a, b, c] = w.ofType('member').map((m) => '$' + m.id);
  w.act({ action: 'make', args: { kind: 'group', member: [a] } });
  const g = w.ofType('group')[0].id;
  assert.equal(w.act({ action: 'change', args: { thing: g, attr: 'member', value: [b, c] } }).ok, true);
  assert.deepEqual(w.get(g).attrs.member, [b, c]);
  assert.equal(w.undo().ok !== false, true);
  assert.deepEqual(w.get(g).attrs.member, [a]);
});
