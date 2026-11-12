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
// words and unit words, each with means= (and of= for a value of a slot). Declared in the
// order a host wants them in examples: the most usual form first.
export const words = `
@w_buy  core.word lang=en text=buy text=get means=line
@w_pen  core.word lang=en text=pen text=pens means=pen of=item.name
@w_ink  core.word lang=en text=ink text=inks means=ink of=item.name
@w_pad  core.word lang=en text=pad text=pads means=pad of=item.name
@w_one  core.word lang=en text=one text=a means=1 of=line.qty
@w_two  core.word lang=en text=two means=2 of=line.qty
@w_three core.word lang=en text=three means=3 of=line.qty
@w_piece core.word lang=en text=piece text=pieces means=piece of=line.unit
@w_box  core.word lang=en text=box text=boxes means=box of=line.unit
@w_price core.word lang=en text=price means=item.price
@r_buy  core.word lang=ro text=cumpără means=line
@r_pen  core.word lang=ro text=pix text=pixuri means=pen of=item.name
@r_ink  core.word lang=ro text=cerneală means=ink of=item.name
@r_one  core.word lang=ro text=un text=o means=1 of=line.qty
@r_two  core.word lang=ro text=două text=doi means=2 of=line.qty
@r_box  core.word lang=ro text=cutie text=cutii means=box of=line.unit
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
    [{ lang: 'en', verb: 'buy', args: ['two', 'pens'] }, { lang: 'en', args: ['one', 'ink'] }],
    [{ lang: 'en', verb: 'buy', args: ['two', 'pens', 'one', 'ink'] }],
  ])));
  console.log('cumpără două cutii de pixuri:\n   ', show(w, w.interpret({ lang: 'ro', verb: 'cumpără', args: ['două', 'cutii', 'pixuri'] })));
  console.log('buy a pnes (a typo):\n   ', show(w, w.interpret({ lang: 'en', verb: 'buy', args: ['a', 'pnes'] })));
  console.log('pens two buy (loose words):\n   ', show(w, w.interpret({ lang: 'en', words: ['pens', 'two', 'buy'] })));
  console.log('examples (en):', w.examples('en', { statement: '{verb} {qty} {unit} {item}' }, { all: true, per: 2 }).map((e) => e.text).join(' / '));
}
