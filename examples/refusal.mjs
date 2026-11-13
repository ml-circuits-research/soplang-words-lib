// Refusable readings (Round 19, item 5): a router has several readings of one sentence and
// drops those the present state would refuse, with the reason, before choosing. score is
// the dry run: nothing is applied. `node examples/refusal.mjs`
import { World } from '../src/index.mjs';

export const GAMES = String.raw`
@k1 core.slot of=game key=name id=true
@k2 core.slot of=game key=state enum=running enum=over
@g game name=hangman state=running
@gs game core.on=$g guess=?l
@guess core.action name=guess param=l when=$g set=$gs
@k3 core.slot of=hangman_word key=word required=true ask="Which word?"
@hw hangman_word word=?x
@run game name=hangman state=running
@nogame core.deny when=$hw not=$run why="no game of hangman runs"
@k4 core.slot of=draw key=thing required=true ask="What shall I draw?"
`;

// "hangman cat": a guess in a running game, a new word for the game, or a drawing of a cat
export const READINGS = [{ action: 'guess', args: { l: 'a' } }, { action: 'hangman_word', args: { word: 'cat' } }, { action: 'draw', args: { thing: 'cat' } }, { action: 'draw', args: {} }];

/** The readings the world would take now, and the ones it would refuse, with the reason. */
export function sift(w, readings) {
  const kept = [], dropped = [];
  for (const c of w.score(readings).candidates) {
    if (c.ok) kept.push({ reading: readings[c.index ?? kept.length + dropped.length], lacks: c.lacks.map((l) => l.ask || l.key) });
    else dropped.push({ reading: readings[c.index ?? kept.length + dropped.length], by: c.judgedBy, why: c.violations[0].why });
  }
  return { kept, dropped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = new World();
  w.load(GAMES);
  console.log('no game:', JSON.stringify(sift(w, READINGS).dropped.map((d) => [d.reading.action, d.why])));
  w.tell('@g1 game name=hangman state=running');
  console.log('a game runs:', JSON.stringify(sift(w, READINGS).kept.map((k) => [k.reading.action, k.lacks])));
}
