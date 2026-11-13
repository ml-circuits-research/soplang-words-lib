// The standard function pack (Round 17) and a space world written with it and rules only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { space, items } from '../examples/space.mjs';

const calc = (w, fn, args) => w.fns[fn](args.map(String), w);

test('std pack: opt-in by core.use; declared, pure; each function', () => {
  const w = new World();
  assert.equal(w.fns.median, undefined, 'not there before core.use');
  w.load('@u1 core.use world=std.numbers\n@u2 core.use world=std.order\n@u3 core.use world=std.boxes');
  assert.deepEqual(w.functions().map((f) => [f.name, f.pure, f.registered]).filter(([, p, r]) => !p || !r), [], 'all pure and registered');
  assert.deepEqual(w.functions().map((f) => f.name), ['average', 'median', 'rank_in', 'nth_smallest', 'nth_largest', 'centre_x', 'centre_y', 'overlaps', 'contains_box', 'box_distance']);
  assert.deepEqual(w.warnings, []);
  assert.deepEqual([calc(w, 'average', [2, 4, 9]), calc(w, 'median', [5, 1, 3]), calc(w, 'median', [4, 1, 3, 2])], ['5', '3', '2.5']);
  assert.deepEqual([calc(w, 'rank_in', [7, 3, 9, 1]), calc(w, 'nth_smallest', [2, 30, 10, 20]), calc(w, 'nth_largest', [1, 30, 10, 20])], ['3', '20', '30']);
  assert.deepEqual([calc(w, 'centre_x', [10, 20]), calc(w, 'centre_y', [0, 5])], ['20', '2.5']);
  assert.deepEqual([calc(w, 'overlaps', [0, 0, 10, 10, 5, 5, 10, 10]), calc(w, 'overlaps', [0, 0, 10, 10, 10, 0, 5, 5])], [true, false], 'touching edges do not overlap');
  assert.deepEqual([calc(w, 'contains_box', [0, 0, 10, 10, 2, 2, 3, 3]), calc(w, 'contains_box', [0, 0, 10, 10, 8, 8, 3, 3])], [true, false]);
  assert.equal(calc(w, 'box_distance', [0, 0, 2, 2, 3, 4, 2, 2]), '5');
  // the declarations check their use: a check needs a boolean, arguments their number
  assert.throws(() => w.load('@p pair a=?a b=?b\n@k core.check fn=median args=?a args=?b\n@d core.deny when=$p if=$k'), /returns number, not boolean/);
  assert.throws(() => w.load('@q pair a=?a\n@c core.calc out=?m fn=average args=?a\n@t pair core.on=$q m=?m\n@r core.rule when=$q with=$c then=$t'), /it takes 2 to 8/);
});

test('std pack: a host function or a host module of the same name wins', () => {
  const w = new World({ fns: { median: () => 'mine' } });
  w.load('@u core.use world=std.numbers');
  assert.equal(w.fns.median([]), 'mine');
  const v = new World({ library: { 'std.numbers': '@f core.function name=only_mine out.kind=number' } });
  v.load('@u core.use world=std.numbers');
  assert.deepEqual([v.fns.average, v.functions().map((f) => f.name)], [undefined, ['only_mine']]);
});

test('space: five items in a frame; the middle one, left of, in a row; all from the pack and rules', () => {
  const w = new World();
  w.load(space);
  w.tell(items);
  const name = (ref) => w.get(ref.slice(1)).attrs.name[0];
  assert.deepEqual(w.ofType('middle').map((m) => name(m.attrs.item[0])), ['lamp']);
  assert.deepEqual(w.ofType('left_of').filter((l) => name(l.attrs.b[0]) === 'lamp').map((l) => name(l.attrs.a[0])).sort(), ['book', 'cup']);
  assert.equal(w.ofType('in_a_row').length, 1);
  // moving an item down breaks the row; a sixth item has no single middle place, so none
  w.revise('i5', 'y', '80');
  assert.equal(w.ofType('in_a_row').length, 0);
  w.tell('@i6 item in=shelf name=pen x=95 y=40 w=2 h=8');
  assert.deepEqual(w.ofType('middle').length, 0);
  // relative position by query: what is left of the clock
  const left = w.ask('@l left_of a=?a b=$i4').map((r) => r.a);
  assert.deepEqual(left.map((x) => name(x)).sort(), ['book', 'cup', 'lamp']);
});
