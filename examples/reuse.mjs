// Reuse (Round 23, items 3 and 4): the strongest candidates the detector found, done.
// 1. The board game: chess and tic-tac-toe in PSys2 declare the same game keys (user,
//    level, seed), the same move keys (by, n) and the same "no move after the game is
//    over"; here one `board` module holds them and each game adds only what is its own.
// 2. The parameterised world: one `list` module instantiated as tasks, shopping, playlist.
// 3. "A reference must exist" (the same deny in seven PSys2 tab worlds) is one slot
//    attribute in SOP Lang: `core.slot ... type=<kind>` refuses a reference to nothing.
// A module is instantiated under another name by renaming its prefix (`instance` below):
// `core.use` loads a module once, under its own name (see Q29). `node examples/reuse.mjs`
import { World } from '../src/index.mjs';

/** The module text with its prefix renamed and its words given: one instance of a parameterised world. */
export const instance = (text, from, to, words = {}) => Object.entries(words).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v), text.replace(new RegExp(`(^|[\\s$@=])${from.replace('.', '\\.')}\\.`, 'gm'), `$1${to}.`));

// ---- 1. the board game ----------------------------------------------------------------
export const board = String.raw`
@board.k.user core.slot of=board.game key=user {players}
@board.k.level core.slot of=board.game key=level enum=easy enum=hard
@board.k.seed core.slot of=board.game key=seed kind=integer
@board.k.by core.slot of=board.move key=by {players} required=true
@board.k.n core.slot of=board.move key=n kind=integer min=1 required=true
@board.k.n.one core.type of=board.move unique=n

# whose turn: the first player when the number of moves is even, else the other
@board.g board.game
@board.m board.move
@board.c core.calc out=?c fn=count over=$board.m
@board.even core.check fn=eq args=?r args=0
@board.odd core.check fn=eq args=?r args=1
@board.mod core.calc out=?r fn=mod args=?c args=2
@board.t1 board.turn of=$board.g player={first}
@board.t2 board.turn of=$board.g player={second}
@board.r.t1 core.rule when=$board.g with=$board.c with=$board.mod if=$board.even then=$board.t1
@board.r.t2 core.rule when=$board.g with=$board.c with=$board.mod if=$board.odd then=$board.t2

# no move after the game is over (a result exists), and a move in turn
@board.om board.move n=?n
@board.ow board.result winner=?w
@board.after core.check fn=after args=$board.om args=$board.ow
@board.d.over core.deny when=$board.om when=$board.ow if=$board.after why="The game is over."
`;
const PLAYERS = (a, b) => ({ players: `enum=${a} enum=${b}`, first: a, second: b });
export const tictactoe = instance(board, 'board', 'ttt', PLAYERS('X', 'O')) + String.raw`
@ttt.k.at core.slot of=ttt.move key=at kind=integer min=0 max=8 required=true
@ttt.k.at.one core.type of=ttt.move unique=n unique=at
`;
export const chess = instance(board, 'board', 'chess', PLAYERS('white', 'black')) + String.raw`
@chess.k.from core.slot of=chess.move key=from required=true
@chess.k.to core.slot of=chess.move key=to required=true
`;

// ---- 2. one list, three worlds --------------------------------------------------------
export const list = String.raw`
@list.t core.type of=list.item closed=true
@list.k.title core.slot of=list.item key=title required=true
@list.k.done core.slot of=list.item key=done enum=yes
@list.k.n core.slot of=list.item key={amount} kind=integer min=1
@list.w1 core.word text={item} means=list.item
@list.w2 core.word text={items} means=list.item
@list.open list.item core.absent=done
@list.count core.aggregate over=$list.open count=?n then=$list.left
@list.left list.status open=?n
`;
export const tasks = instance(list, 'list', 'tasks', { item: 'task', items: 'tasks', amount: 'priority' });
export const shopping = instance(list, 'list', 'shopping', { item: 'thing', items: 'things', amount: 'quantity' });
export const playlist = instance(list, 'list', 'playlist', { item: 'song', items: 'songs', amount: 'plays' });

export function makeGames() { const w = new World(); w.load([tictactoe, chess].join('\n')); return w; }
export function makeLists() { const w = new World(); w.load([tasks, shopping, playlist].join('\n')); return w; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const g = makeGames();
  g.tell('@t ttt.game user=X level=easy  @c chess.game user=white level=hard');
  g.tell('@m1 ttt.move by=X n=1 at=4  @c1 chess.move by=white n=1 from=e2 to=e4');
  console.log('turns:', g.ofType('ttt.turn').map((x) => x.attrs.player[0]), g.ofType('chess.turn').map((x) => x.attrs.player[0]));
  g.tell('@r ttt.result winner=X');
  console.log('a move after the end:', g.tell('@m2 ttt.move by=O n=2 at=0').violations[0]?.why);
  const l = makeLists();
  l.tell('@a tasks.item title="wash up"  @b shopping.item title=milk quantity=2  @c playlist.item title=Song plays=3 done=yes');
  console.log('open:', ['tasks', 'shopping', 'playlist'].map((n) => `${n} ${l.ofType(`${n}.status`)[0]?.attrs.open[0] ?? 0}`).join(', '));
  console.log('words:', [...l.words().keys()].join(', '));
}
