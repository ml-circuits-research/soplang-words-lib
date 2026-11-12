// What is local to what: rules, questions, statements, namespaces, worlds, modules
// (docs/language.md, section 12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const SHOP = `
  @k core.slot of=customer key=name id=true
  @o order customer=?n total=?t
  @c customer name=?n
  @link order core.on=$o known=yes
  @r core.rule when=$o when=$c then=$link
  @agent core.type of=agent shared=true
  @k2 core.slot of=agent key=name id=true
`;

test('scope: a variable is local to its rule or question; the same name elsewhere is another variable', () => {
  const w = new World();
  w.load('@p item n=?x\n@t pair a=?x\n@r core.rule when=$p then=$t\n@p2 item m=?x\n@t2 other b=?x\n@r2 core.rule when=$p2 then=$t2');
  w.tell('@i1 item n=1 m=2');
  assert.deepEqual([w.ofType('pair')[0].attrs.a, w.ofType('other')[0].attrs.b], [['1'], ['2']]);
  assert.deepEqual(w.ask('item n=?x'), [{ x: '1' }]);
  assert.deepEqual(w.ask('item m=?x'), [{ x: '2' }]);
});

test('scope: facts in different namespaces are never joined by value nor merged by identity; written references and shared types cross', () => {
  const w = new World();
  w.load(SHOP);
  w.tell('@c1 customer name=ann  @o1 order customer=ann total=3', { ns: 'shop' });
  w.tell('@o1 order customer=ann total=5', { ns: 'other' });
  assert.deepEqual(w.ofType('order').map((o) => [o.id, o.attrs.known?.[0]]), [['shop::o1', 'yes'], ['other::o1', undefined]], 'the customer of one namespace is not the customer of another');
  w.tell('@c9 customer name=ann vip=yes', { ns: 'other' });
  assert.deepEqual([w.has('other::c9'), w.get('other::o1').attrs.known], [true, ['yes']], 'same identity, two namespaces: two wires');
  // a shared type is one across namespaces
  w.tell('@u1 agent name=sam', { ns: 'shop' });
  assert.deepEqual(w.tell('@u2 agent name=sam', { ns: 'other' }).merged, [{ id: 'other::u2', into: 'shop::u1' }]);
  // a reference resolves in its own namespace; another is reached when written out
  assert.equal(w.tell('@x1 note about=$c1', { ns: 'other' }).violations[0].kind, 'dangling-ref');
  assert.equal(w.tell('@x2 note about=$shop::c1', { ns: 'other' }).ok, true);
  assert.equal(w.tell('@x3 note about=$::nothing', { ns: 'other' }).violations[0].kind, 'dangling-ref');
  // questions in a namespace see only it
  assert.deepEqual(w.ask('@x order customer=ann total=?t', { ns: 'shop' }), [{ x: 'shop::o1', t: '3' }]);
  assert.equal(w.query({ type: 'customer', where: { name: 'ann' }, seek: 'vip' }, { ns: 'shop' }).status, 'missing');
  assert.equal(w.query({ type: 'customer', where: { name: 'ann' }, seek: 'vip' }, { ns: 'other' }).value, 'yes');
  // a snapshot, a fork and a mark keep namespaces; sync works inside one
  assert.equal(w.diff(World.fromJSON(w.toJSON())).same, true);
  const s = w.sync('order', '@o1 order customer=ann total=4', { ns: 'shop' });
  assert.deepEqual([s.replaced, s.retracted, w.get('other::o1').attrs.total], [['shop::o1'], [], ['5']]);
});

test('scope: a world given a namespace puts every statement in it; one world never sees another', () => {
  const a = new World({ ns: 'a' });
  a.load(SHOP);
  a.tell('@c1 customer name=ann');
  assert.deepEqual([...a.wires.keys()], ['a::c1']);
  const b = new World();
  b.load(SHOP);
  b.tell('@c1 customer name=ann');
  assert.equal(b.has('a::c1'), false);
});

test('modules: ownership of names, exports, and a warning for keys two modules declare', () => {
  const library = {
    shop: '@m core.module name=shop exports=item\n@k core.slot of=shop.item key=price kind=number\n@s core.slot of=shop.secret key=code\n@ty core.type of=shop.item extends=base.thing',
    base: '@k core.slot of=base.thing key=price kind=number',
    tax: '@p shop.item price=?p\n@c core.calc out=?t fn=mul args=?p args=0.2\n@t shop.item core.on=$p tax=?t\n@r core.rule when=$p with=$c then=$t',
    spy: '@p shop.secret code=?c\n@n note code=?c\n@r core.rule when=$p then=$n',
    bad: '@k core.slot of=shop.item key=colour',
  };
  const w = new World({ library });
  assert.equal(w.use('base').ok, true);
  assert.equal(w.use('shop').ok, true);
  assert.deepEqual(w.warnings.filter((x) => x.kind === 'ambiguous-key').map((x) => [x.type, x.key, x.names]), [['shop.item', 'price', ['shop.item.price', 'base.thing.price']]]);
  assert.equal(w.use('tax').ok, true, 'an exported type may be read');
  assert.match(w.use('spy').violations[0].why, /module spy reads shop\.secret, which module shop does not export/);
  assert.match(w.use('bad').violations[0].why, /module bad declares the slot of type shop\.item, which is not under its own prefix bad/);
  // the host's own matrix is in no module: it reads everything
  assert.equal(w.tell('@p shop.secret code=?c\n@n note code=?c\n@r core.rule when=$p then=$n').ok, true);
});

test('N1: replace in a namespaced world keeps the replaced wire\'s namespace', () => {
  const w = new World({ ns: 'A' });
  w.load('@t core.type\n@t.k core.slot of=t key=k kind=number');
  w.tell('@x t k=1');
  assert.equal(w.replace('A::x', '@x t k=2').ok, true);
  assert.deepEqual([w.has('A::x'), w.has('x'), w.get('A::x').attrs.k], [true, false, ['2']]);
  // a wire of another namespace replaced from this world stays in its own
  w.tell('@y t k=1', { ns: 'B' });
  w.replace('B::y', '@y t k=3');
  assert.deepEqual([w.get('B::y').attrs.k, w.has('A::y')], [['3'], false]);
  // and the log replays the same world
  assert.equal(World.fromJSON(w.toJSON(), { ns: 'A' }).toSOP(), w.toSOP());
});

test('N2: aggregate results belong to the namespace of the wires they count; across namespaces, to the default one', () => {
  const w = new World({ ns: 'A' });
  w.load(`
    @it item cat=?c
    @h have cat=?c n=?n
    @g core.aggregate over=$it by=?c count=?n then=$h
    @hv have cat=?c2 n=?n2
    @lim limit cat=?c2 max=?m
    @big core.check fn=gt args=?n2 args=?m
    @d core.deny when=$hv when=$lim if=$big why="too many ?c2"
  `);
  w.tell('@i1 item cat=x  @i2 item cat=x  @l limit cat=x max=2');
  assert.deepEqual(w.ofType('have').map((x) => [x.id.split('::')[0], x.attrs.n[0]]), [['A', '2']]);
  // the deny joins the result with the namespace's facts
  const r = w.tell('@i3 item cat=x');
  assert.deepEqual([r.ok, r.violations[0]?.why], [false, 'too many x']);
  // a group whose members are in two namespaces: one result, in the default namespace
  const v = new World();
  v.load('@it item cat=?c\n@h have cat=?c n=?n\n@g core.aggregate over=$it by=?c count=?n then=$h');
  v.tell('@a item cat=x', { ns: 'A' });
  v.tell('@b item cat=y', { ns: 'B' });
  assert.deepEqual(v.ofType('have').map((x) => x.id.split('::').length === 2 ? `${x.id.split('::')[0]}:${x.attrs.cat}` : `default:${x.attrs.cat}`).sort(), ['A:x', 'B:y']);
  v.tell('@c item cat=x', { ns: 'B' });
  assert.deepEqual(v.ofType('have').map((x) => `${x.id.includes('::') ? x.id.split('::')[0] : 'default'}:${x.attrs.cat}:${x.attrs.n}`).sort(), ['B:y:1', 'default:x:2']);
});

test('N4: log entries keep the namespace they were told in; a replay and a restore honour it', () => {
  const w = new World({ ns: 'A' });
  w.load('@agent core.type shared=true');
  w.tell('@e.user agent', { ns: '' });
  w.tell('@p1 pet owner=$::e.user');
  w.tell('@b1 pet owner=$::e.user', { ns: 'B' });
  const ids = (x) => [...x.wires.keys()].filter((k) => !k.startsWith('_')).sort();
  assert.deepEqual(ids(w), ['A::p1', 'B::b1', 'e.user']);
  for (const opts of [{ ns: 'A' }, {}, { ns: 'C' }]) assert.deepEqual(ids(World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())), opts)), ids(w), JSON.stringify(opts));
  // undo rebuilds by replay: the default-namespace wire stays where it was
  w.undo();
  assert.deepEqual(ids(w), ['A::p1', 'e.user']);
});
