// Romanian read by the frames of w.lang.ro (reviewer 08:15): PSys2's real Romanian turns with the English
// the owner meant (glossed by hand), compared on MEANING: the act, and the thing named. The English gloss
// gives the reference act through its verb (k.actions.verb text= act=) and its content words; the Romanian
// reading gives the act of its frame and the reference words of its roles (through the lemmas' senses).
//   node tools/bench-ro-frames.mjs [--rows] [--hand]   (--hand: the hand dictionary alone)
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { morphOf, dictionary, fold, readFrames } from '../src/index.mjs';
import { catalogWorld, worldsDir, psys2Dir } from './worlds.mjs';

const COMMIT = '23f283a6c061cd83053419505a88726de78eb256'; // PSys2, the real set of 2026-11-15
const dir = psys2Dir();
try { execFileSync('git', ['-C', dir, 'cat-file', '-e', `${COMMIT}^{commit}`]); } catch { execFileSync('git', ['-C', dir, 'fetch', '-q', 'origin']); }
const show = (f) => execFileSync('git', ['-C', dir, 'show', `${COMMIT}:${f}`], { maxBuffer: 1 << 26 }).toString();
const gold = new Map(show('training/eval/ro-en-meaning/gold-real.tsv').split('\n').filter(Boolean).map((l) => l.split('\t')).map(([id, en]) => [`real#${id}`, en]));
const ro = show('training/eval/ro-en-meaning/real-ro.tsv').split('\n').filter(Boolean).map((l) => l.split('\t')).map(([id, tab, src, text]) => ({ id, tab, src, text }));

const T = ['class', 'ending', 'irregular', 'vowel', 'fold', 'split', 'template', 'det', 'pron', 'prep', 'numeral', 'particle', 'frame', 'part', 'phrase', 'lex'].map((x) => `w.lang.ro.${x}`);
const w = await catalogWorld({ 'w.lang.ro': T, 'k.actions': ['k.actions.verb'] });
const m = morphOf(w, { types: { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', template: 'w.lang.ro.template', vowel: 'w.lang.ro.vowel' } });
const file = (dir) => (l) => (existsSync(`${worldsDir()}docs/worlds/w.lang.ro/${dir}/${l}.tsv`) ? readFileSync(`${worldsDir()}docs/worlds/w.lang.ro/${dir}/${l}.tsv`, 'utf8') : '');
const twoDicts = !process.argv.includes('--hand'); // the hand dictionary (with senses) first, then the UniMorph-derived lemmas (morphology only)
const d = dictionary({ read: twoDicts ? [file('dictionary'), file('dictionary-unimorph')] : file('dictionary'), fold: (s) => fold(m, s) });

// the reference meaning of an English gloss: the act of its first verb that k.actions knows, and its content words
// a verb may say several acts (make: make and change): the gloss's act is any of them (knowledge worker, 14:45 b)
const verbs = new Map(); for (const v of w.ofType('k.actions.verb')) { const t = String(v.attrs.text[0]).replace(/^"|"$/g, ''); (verbs.get(t) ?? verbs.set(t, new Set()).get(t)).add(String(v.attrs.act[0]).replace(/^"|"$/g, '')); }
const STOP = new Set('a an the one some and of to on in at with it me my i you your please more less bit little very this that these those be is are was'.split(' '));
const forms = (x) => { const b = x.replace(/'s$/, ''); return [b, b.replace(/ies$/, 'y'), b.replace(/es$/, ''), b.replace(/s$/, '')]; }; // every singular a plural may come from: crocodiles -> crocodile, not only crocodil
const refOf = (en) => { const ws = en.toLowerCase().match(/[a-z']+/g) || []; const vi = ws.findIndex((x) => verbs.has(x)); return { acts: vi >= 0 ? verbs.get(ws[vi]) : null, words: new Set(ws.filter((x, i) => i !== vi && !STOP.has(x)).flatMap(forms)) }; };

const rows = ro.filter((r) => gold.has(r.id) && r.text);
let read = 0, act = 0, both = 0, refActs = 0, noVerb = 0;
const lines = [];
for (const r of rows) {
  const ref = refOf(gold.get(r.id)), got = readFrames(w, r.text, { morph: m, dictionary: d }).best;
  if (ref.acts) refActs++; else noVerb++;
  if (!got) { lines.push(`-     ${r.text}  ||  ${gold.get(r.id)}`); continue; }
  read++;
  const actOk = !!ref.acts && ref.acts.has(got.act); // a gloss with no verb ("more to the right") has no act to compare: not counted wrong
  const thing = got.roles.thing?.words?.map((x) => x.en).filter(Boolean).flatMap((x) => forms(x.split(' ').pop())) ?? [];
  const thingOk = !got.roles.thing || thing.some((x) => ref.words.has(x));
  if (actOk) act++;
  if (actOk && thingOk) both++;
  lines.push(`${actOk && thingOk ? 'ok   ' : actOk ? 'act  ' : ref.acts ? 'wrong' : 'noref'} ${r.text}  ->  ${got.act} ${Object.entries(got.roles).map(([k, v]) => `${k}=${v.en ?? v.value ?? v.item ?? v.rel}`).join(' ')}  ||  ${gold.get(r.id)}`);
}
const pct = (x, n) => `${x}/${n} (${n ? Math.round((100 * x) / n) : 0} %)`;
console.log(`real Romanian turns with a gloss: ${rows.length}; glosses with an act k.actions knows: ${refActs}`);
console.log(`read by a frame: ${pct(read, rows.length)}; act right: ${pct(act, refActs)} of the glosses with an act (${noVerb} glosses have no verb); act and thing right: ${pct(both, refActs)}`);
if (process.argv.includes('--rows')) console.log(lines.join('\n'));
