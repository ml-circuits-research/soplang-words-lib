// The reader core on word descriptions written for pattern generation: a small shop whose
// operations, arguments and units are described with core.word, then read back with
// interpret, splits, score, rank and veto. `node examples/reader.mjs`
import { World } from '../src/index.mjs';

export const shop = `
@k_item core.slot of=item key=name id=true
@k_line_item core.slot of=line key=item kind=ref to=item required=true ask="Which item?"
@k_line_qty core.slot of=line key=qty kind=integer min=1 default=1
@k_line_unit core.slot of=line key=unit enum=piece enum=box default=piece
@k_price core.slot of=item key=price kind=number
`;

export const items = `
@pen item name=pen price=2 stock=40
@ink item name=ink price=5 stock=3
@pad item name=pad price=4 stock=0
`;

// The descriptions: an operation word, argument words (several forms of one word), number
// words, unit words and synonyms, each with means= (and of= for a value of a slot). Declared in the
// order a host wants them in examples: the most usual form first. All in one language,
// the matrix's own: translation is the host's, outside the world.
export const words = `
@w_buy  core.word text=buy text=get means=line
@w_pen  core.word text=pen text=pens means=pen of=item.name
@w_ink  core.word text=ink text=inks means=ink of=item.name
@w_pad  core.word text=pad text=pads means=pad of=item.name
@w_one  core.word text=one text=a means=1 of=line.qty
@w_two  core.word text=two means=2 of=line.qty
@w_three core.word text=three means=3 of=line.qty
@w_piece core.word text=piece text=pieces means=piece of=line.unit
@w_box  core.word text=box text=boxes means=box of=line.unit
@w_price core.word text=price means=item.price
@w_purchase core.word text=purchase means=line
@w_biro core.word text=biro text=biros means=pen of=item.name
@w_pair core.word text=pair text=couple means=2 of=line.qty
@w_carton core.word text=carton text=cartons means=box of=line.unit
`;

export function makeShop() {
  const w = new World();
  w.load(shop);
  w.tell(items);
  w.tell(words);
  return w;
}

const show = (w, r) => {
  const s = w.score(r.candidates);
  const top = r.candidates[s.order[0]];
  const v = w.veto(s);
  const parts = top ? (top.parts || [top]).map((p) => `${p.wires} ${JSON.stringify(p.refer?.r1?.where || {})}`).join(' + ') : '-';
  return `${parts}\n    ${v.answer ? 'answer' : 'not understood: ' + v.reasons.map((x) => x.why).join('; ')}${s.order.length > 1 ? `; next: ${s.candidates[s.order[1]].why}` : ''}`;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeShop();
  console.log('words declared:', w.ofType('core.word').length, '— warnings:', w.warnings.length);
  // "buy two pens and one ink": two frames (the second takes the verb), or one
  console.log('buy two pens and one ink:\n   ', show(w, w.interpret([
    [{ verb: 'buy', args: ['two', 'pens'] }, { args: ['one', 'ink'] }],
    [{ verb: 'buy', args: ['two', 'pens', 'one', 'ink'] }],
  ])));
  console.log('purchase a pair of cartons of biros (synonyms):\n   ', show(w, w.interpret({ verb: 'purchase', args: ['pair', 'cartons', 'biros'] })));
  console.log('buy a pnes (a typo):\n   ', show(w, w.interpret({ verb: 'buy', args: ['a', 'pnes'] })));
  console.log('pens two buy (loose words):\n   ', show(w, w.interpret({ words: ['pens', 'two', 'buy'] })));
  console.log('examples:', w.examples({ statement: '{verb} {qty} {unit} {item}' }, { all: true, per: 2 }).map((e) => e.text).join(' / '));
}
