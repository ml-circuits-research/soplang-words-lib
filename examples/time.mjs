// State over time: a balance changed by events, read back as of an earlier point.
import { World, format } from '../src/index.mjs';
import { ledger } from './ledger.mjs';

const w = new World();
w.load(ledger);
const show = (label) => console.log(label.padEnd(34), format(w.get('acc')), '| warnings:', w.ofType('warning').length);

w.load('@acc account name=ana balance=100');           show('opened with 100');
w.load('@d1 deposit account=ana amount=50');            show('deposit 50');
w.load('@w1 withdrawal account=ana amount=140');        show('withdrawal 140');
console.log('withdrawal 500 ->', w.tell('@w2 withdrawal account=ana amount=500').violations[0].why);
console.log('balance as of the deposit:', w.query({ type: 'account', seek: 'balance', where: { name: 'ana' } }, { at: w.seqOf('d1') }).value);
console.log('where the balance comes from:', JSON.stringify(w.explain('acc').fills[0]));
w.retract('w1');                                        show('the withdrawal is retracted');
w.fill('acc', 'balance', '12');                         show('someone states the balance is 12');
