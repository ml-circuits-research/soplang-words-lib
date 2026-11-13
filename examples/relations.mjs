// std.relations (Round 19): things in a picture and the relations kept between them. A
// book on the table and a cup on the book follow the table when it moves; "a lamp on each
// shelf", "the first cup", "put all the cups on the table", "one cup on each shelf".
// Rules, the built-in arithmetic and declared actions only. `node examples/relations.mjs`
import { World } from '../src/index.mjs';

export const scene = `
@table std.relations.box kind=table w=100 h=20
@t.at std.relations.at thing=$table x=0 y=80
@s1 std.relations.box kind=shelf w=40 h=5
@s1.at std.relations.at thing=$s1 x=200 y=20
@s2 std.relations.box kind=shelf w=40 h=5
@s2.at std.relations.at thing=$s2 x=300 y=20
@book std.relations.box kind=book w=20 h=10
@book.on std.relations.keep thing=$book rel=on ref=$table
@cup1 std.relations.box kind=cup w=10 h=10
@cup1.at std.relations.at thing=$cup1 x=150 y=0
@cup2 std.relations.box kind=cup w=10 h=10
@cup2.at std.relations.at thing=$cup2 x=120 y=0
`;

export function makeScene() {
  const w = new World();
  w.load('@use core.use world=std.relations');
  w.tell(scene);
  return w;
}

/** Where a thing is: "x/y", or "-" when it has no place. */
export const at = (w, id) => { const a = w.get(id)?.attrs; return a?.x ? `${a.x[0]}/${a.y[0]}` : '-'; };

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeScene();
  const show = (label, ids) => console.log(label.padEnd(30), ids.map((id) => `${id} ${at(w, id)}`).join('  '));
  w.tell('@cup3 std.relations.box kind=cup w=10 h=10  @cup3.on std.relations.keep thing=$cup3 rel=on ref=$book');
  show('a cup on the book:', ['table', 'book', 'cup3']);
  w.revise('t.at', { x: 50 });
  show('the table moves right:', ['table', 'book', 'cup3']);
  w.tell('@first std.relations.nth kind=cup n=1');
  console.log('the first cup:'.padEnd(30), w.get('first').attrs.item[0]);
  w.tell('@lamps std.relations.each kind=lamp w=6 h=12 rel=on over=shelf');
  console.log('a lamp on each shelf:'.padEnd(30), w.ofType('std.relations.box').filter((b) => b.attrs.kind?.[0] === 'lamp').map((b) => at(w, b.id)).join('  '));
  w.tell('@spread std.relations.spread kind=cup over=shelf');
  const moved = w.act({ action: 'relations.put_pairs', args: { s: '$spread', rel: 'next_to' } });
  if (!moved.ok) console.log(moved.violations);
  show('one cup next to each shelf:', ['cup1', 'cup2', 'cup3']);
  console.log('(cup3, the first from the left, is paired with the first shelf but stays on the book: only told places move)');
}
