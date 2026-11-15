// A second, tiny application on the host kit alone (reviewer 13:50 item 6): two published worlds (w.list, w.tasks),
// the English language world's frames, and a text loop. Nothing here is PSys2's; reuse is tested by something else.
//   node examples/lists-app.mjs                 a scripted session
//   node examples/lists-app.mjs -               read lines from stdin
import { createInterface } from 'node:readline';
import { loadWorldSet, readTurn } from '../src/index.mjs';
import { worldText, catalogWorld, worldsDir } from '../tools/worlds.mjs';

export async function listsApp() {
  if (!worldsDir()) return null;
  const language = await catalogWorld({ 'w.lang.en': ['w.lang.en.frame', 'w.lang.en.part', 'w.lang.en.phrase', 'w.lang.en.lex', 'w.lang.en.det', 'w.lang.en.numeral', 'w.lang.en.prep', 'w.lang.en.wh', 'w.lang.en.aux', 'w.lang.en.pron'], 'k.actions': ['k.actions.verb'] });
  // how the frames that need entries map onto w.list (until the language world says it: a knowledge ask)
  const bindings = { entries: { kind: 'w.list.item', thing: 'text', amount: 'quantity', place: 'list', placeKind: 'w.list.list', placeKey: ['name', 'sort'] } };
  return loadWorldSet(worldText, { names: ['w.list', 'w.tasks'], language, bindings });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const set = await listsApp();
  if (!set) { console.log('the published worlds cannot be read here'); process.exit(0); }
  const say = (text) => { const r = readTurn(set, text); console.log(`> ${text}\n  ${r.reply}  [${r.status}${r.reading?.unread?.length ? `; unread: ${r.reading.unread.join(' ')}` : ''}]`); };
  if (process.argv[2] === '-') { const rl = createInterface({ input: process.stdin }); for await (const line of rl) if (line.trim()) say(line.trim()); }
  else for (const t of ['make a shopping list', 'add milk to my shopping list', 'add 2 apples to the shopping list', 'make a purple dragon', 'I have two kids']) say(t);
}
