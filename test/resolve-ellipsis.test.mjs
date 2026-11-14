// Discourse ellipsis (reviewer 03:20, PSys2's Q15 item 5a): a verbless continuation reuses the previous act with
// the roles it gives, read by type; a message that names an act is not an ellipsis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, resolveEllipsis } from '../tools/lib-under-test.mjs';

test('resolveEllipsis: "it to the top right" moves the same thing again; a new thing replaces it; an act word stops it', () => {
  const w = new World();
  w.load('@acts core.use world=std.acts\n@art std.schema.world name=art doc=x\n@t core.type of=shape extends=std.schema.thing\n@s1 core.slot of=shape key=place enum=top_right enum=bottom_left enum=up enum=down\n@k std.schema.kind of=shape world=art acts=make acts=place');
  w.tell('@c1 shape name=cat  @t1 shape name=tree');
  const prev = { act: 'place', args: { thing: 'c1', place: 'bottom_left' } };
  assert.deepEqual(resolveEllipsis(w, 'it to the top right', prev, { skip: ['to', 'the', 'and', 'still'] }), { act: 'place', args: { thing: 'c1', place: 'top right' }, reused: true, changed: ['place'] });
  assert.deepEqual(resolveEllipsis(w, 'and still up', prev, { skip: ['to', 'the', 'and', 'still'] }).args.place, 'up');
  assert.equal(resolveEllipsis(w, 'the tree too', prev, { skip: ['the', 'too'] }).args.thing, 't1');
  assert.equal(resolveEllipsis(w, 'make a tree', prev, { skip: ['a'] }), null, 'it names an act');
  assert.equal(resolveEllipsis(w, 'hello', prev), null, 'no role given');
});

test('resolveEllipsis: relative continuations from real turns: more to the left, a bit lower, not the first one but the middle one', () => {
  const w = new World();
  w.tell(`@h1 house name=house1 x=10  @h2 house name=house2 x=50  @h3 house name=house3 x=90
@d w.lang.en.lex name=acts.dir item=left item=right item=lower item=higher
@o1 w.lang.en.ordinal text=first value=1  @o2 w.lang.en.ordinal text=second value=2  @n w.lang.en.neg text=not text=no`);
  const prev = { act: 'place', args: { thing: 'h1', dir: 'left' } }, O = { skip: ['a', 'the', 'one', 'to'] };
  assert.deepEqual(resolveEllipsis(w, 'more to the left', prev, O), { act: 'place', args: { thing: 'h1', dir: 'left' }, reused: true, changed: ['dir'], relative: { more: true } });
  assert.deepEqual(resolveEllipsis(w, 'a bit lower', prev, O).relative, { small: true });
  assert.equal(resolveEllipsis(w, 'a bit lower', prev, O).args.dir, 'lower');
  assert.equal(resolveEllipsis(w, 'not the first one, the middle one', prev, O).args.thing, 'h2', 'the negated clause is the one rejected');
  assert.equal(resolveEllipsis(w, 'the last', prev, O).args.thing, 'h3');
  assert.deepEqual(resolveEllipsis(w, 'even more', prev, O).changed, ['dir'], 'the same direction again');
  const ro = new World();
  ro.tell('@h1 house name=casa1 x=1  @d w.lang.ro.lex name=acts.dir item="la stânga" item="mai jos"');
  const r = resolveEllipsis(ro, 'și mai la stânga', prev, { lang: 'w.lang.ro', more: ['mai', 'și'] });
  assert.deepEqual([r.args.dir, r.relative.more], ['la stânga', true], 'another language: its own directions and words of more');
});
