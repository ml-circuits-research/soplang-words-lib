// The second application, extended (reviewer 16:45 item 2): the published w.seating on the host kit alone, in English
// and in Romanian, with a text loop. PSys2's probe B (its questions.md Q24) is the acceptance list (test/seating-app.test.mjs).
//   node examples/seating-app.mjs [en|ro]        a scripted session
//   node examples/seating-app.mjs ro -           read lines from stdin
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { loadWorldSet, openSession, morphOf, dictionary, fold } from '../src/index.mjs';
import { worldText, catalogWorld, worldsDir } from '../tools/worlds.mjs';

const EN = ['frame', 'part', 'phrase', 'lex', 'det', 'numeral', 'prep', 'wh', 'aux', 'pron', 'answer', 'template', 'inflect', 'irregular', 'onset', 'reply', 'fn', 'joiner', 'anaphor', 'ordinal'];
const RO = ['class', 'ending', 'irregular', 'vowel', 'fold', 'split', 'det', 'pron', 'prep', 'numeral', 'particle', 'frame', 'part', 'phrase', 'lex', 'reply', 'joiner', 'wh', 'aux', 'answer'];

/** The seating app in a language: { set, session, context }, or null when the published worlds cannot be read. */
export async function seatingApp(lang = 'en') {
  if (!worldsDir()) return null;
  if (lang === 'en') {
    const language = await catalogWorld({ 'w.lang.en': EN.map((x) => `w.lang.en.${x}`), 'k.actions': ['k.actions.verb'] });
    const set = loadWorldSet(worldText, { names: ['w.seating'], language });
    return { set, context: { lang: 'w.lang.en' }, session: openSession(set) };
  }
  const language = await catalogWorld({ 'w.lang.ro': RO.map((x) => `w.lang.ro.${x}`), 'w.lang.en': ['w.lang.en.template'], 'k.actions': ['k.actions.verb'] });
  const morph = morphOf(language, { types: { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', vowel: 'w.lang.ro.vowel' } });
  const file = (dir) => (l) => { const f = `${worldsDir()}docs/worlds/w.lang.ro/${dir}/${l}.tsv`; return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
  const dict = dictionary({ read: [file('dictionary'), file('dictionary-unimorph')], fold: (s) => fold(morph, s) });
  // a kind's word in Romanian: the host's, until a language world maps kinds to its lemmas (Q79)
  const words = { 'w.seating.table': 'masă', 'w.seating.guest': 'invitat', 'w.seating.seat': 'loc', name: 'nume' };
  const set = loadWorldSet(worldText, { names: ['w.seating'], language });
  const context = { lang: 'w.lang.ro', morph, dictionary: dict, replyDictionary: dict, wordOf: (t) => words[t] };
  return { set, context, session: openSession(set, context) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lang = process.argv[2] === 'ro' ? 'ro' : 'en';
  const app = await seatingApp(lang);
  if (!app) { console.log('the published worlds cannot be read here'); process.exit(0); }
  const say = (text) => { const r = app.session.say(text); console.log(`> ${text}\n  ${r.reply}  [${r.status}${r.reading?.unread?.length ? `; unread: ${r.reading.unread.join(' ')}` : ''}]`); };
  if (process.argv[3] === '-') { const rl = createInterface({ input: process.stdin }); for await (const line of rl) if (line.trim()) say(line.trim()); }
  else for (const t of lang === 'ro'
    ? ['adaugă o masă numită familie', 'adaugă o masă rotundă numită copii', 'adaugă două mese', 'șterge masa familie', 'anulează', 'adaugă o masă albastră']
    : ['add a table called family', 'add a round table called kids', 'add 2 tables', 'red and blue', 'add a guest called Ann at table 1', 'add a guest called Ann', 'make table 2 blue', 'remove Ann', 'undo', 'add a table for 4']) say(t);
}
