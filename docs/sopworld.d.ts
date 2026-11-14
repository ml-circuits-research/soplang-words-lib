export interface Wire {
  id: string;
  type: string;
  attrs: Record<string, string[]>;
  pattern: boolean;
  meta?: { seq: number; told?: boolean; via?: string; from?: string[]; depth: number; fills?: Fill[] };
}
export interface Fill { key: string; value: string; via: string; from?: string[] }
export interface Violation {
  kind: 'deny' | 'conflict' | 'domain' | 'cardinality' | 'unknown-key' | 'dangling-ref' | 'duplicate-id'
    | 'variable' | 'schema' | 'depth' | 'budget' | 'unknown-wire' | 'dead-end' | 'unsupported'
    | 'guard' | 'refused' | 'error' | 'unknown-action' | 'nothing-to-undo';
  why?: string; id?: string; key?: string; value?: string; rule?: string; wires?: string[];
  have?: string; want?: string; via?: string; allowed?: string[];
  /** the told wires this refusal rests on */
  support?: string[];
  /** those wires as they were when the change was refused */
  involved?: { id: string; type: string; attrs: Record<string, string[]> }[];
  /** for a deny: the values of its variables */
  bindings?: Record<string, string>;
  /** for a deny or a guard: its variables as data (strings as text, plain numbers as numbers) */
  vars?: Record<string, string | number>;
  /** for a refusal of queued tells in an action: the tells involved */
  queued?: { index: number; ids: string[] }[];
}
export interface Result {
  ok: boolean;
  added: string[];
  derived: string[];
  filled: { id: string; key: string; value: string; via: string }[];
  merged: { id: string; into: string }[];
  removed: string[];
  violations: Violation[];
  /** default assumptions that were dropped to accept this change */
  revised?: { id: string; key: string; value: string }[];
  /** soft violations this change recorded as core.issue wires */
  issues?: Issue[];
}
export interface Issue { id: string; rule?: string; about: string[]; key?: string; why?: string }
export interface OpenKey { id: string; type: string; key: string; ask?: string }
export interface Candidate { value: string; source: 'default' | 'enum' | 'wire' | 'range'; count: number }
export interface Question { type?: string; seek?: string; where?: Record<string, string | number>; /** keys the wire has no value for (core.absent=) */ absent?: string[]; about?: string; mode?: 'value' | 'list' | 'count' | 'exists' | 'check' | 'abduce'; /** for mode=check: the value to check, when it is not in where */ value?: string | number }
export type WordMeaning =
  | { kind: 'action'; name: string }
  | { kind: 'type'; type: string }
  | { kind: 'key'; type: string; key: string }
  | { kind: 'value'; type: string; key: string; value: string };
export type Template = string | ((parts: { verb: string; args: { key: string; role?: string; text: string; value: string }[] }) => string);
export interface Example {
  tool: { kind: 'action'; name: string } | { kind: 'type'; type: string } | { kind: 'question'; type: string; key: string };
  text: string;
  frame: Frame;
  expect: { action: string; args: Record<string, string> } | { type: string; attrs: Record<string, string>; refer: Record<string, { type: string; where: Record<string, string> }> } | { question: Question };
}
export interface Frame {
  verb?: string;
  args?: (string | { word: string; role?: string })[];
  numbers?: (number | string)[];
  question?: boolean;
  mode?: string;
  ns?: string;
  /** a bag of words with no verb or order (loose words) */
  words?: string[];
  /** marks the front end sets for a follow-up */
  anaphor?: boolean;
  correction?: boolean;
  other?: boolean;
}
export interface Reading {
  reading: { word: string; as: string }[];
  used: string[];
  unused: string[];
  unresolved: string[];
  verb?: string;
  /** words read as a near known word */
  assumes?: { word: string; read: string }[];
  /** for a follow-up: what came from the previous frame or statement */
  inherited?: { verb?: string; words: string[]; wire?: string };
  replaced?: string[];
  /** for loose words: the word read as the verb, or the tool implied */
  verbWord?: string;
  implied?: string;
}
export interface ScoreCandidate {
  /** a statement; references named in `refer` are resolved against the state */
  wires?: string | Wire[];
  refer?: Record<string, { type?: string; where?: Record<string, string>; absent?: string[]; ns?: string; /** ids it is not */ not?: string[] }>;
  /** a change to a told wire (a follow-up) */
  revise?: { id: string; values: Record<string, string> };
  action?: string;
  args?: Record<string, string>;
  question?: Question | Wire | string;
  ns?: string;
  /** for an action the matrix does not declare: the type its arguments are keys of (fallback judgement) */
  of?: string;
  /** one message read as several parts, judged in order */
  parts?: ScoreCandidate[];
  split?: number;
}
export interface Scored {
  index: number;
  ok: boolean;
  violations: Violation[];
  referents: { name: string; ids: string[]; unique: boolean; fits?: string[] }[];
  lacks: { referent?: string; type?: string; id?: string; key?: string; action?: string; ask?: string }[];
  assumes: ({ id: string; key: string; value: string } | { word: string; read: string })[];
  action?: { available: boolean; status: string; missing?: { key: string; ask?: string }[] };
  answer?: QueryResult;
  words?: { used: string[]; unused: string[]; unresolved: string[] };
  /** a part of a split; `unread` when interpret found no reading for its frame */
  parts?: (Scored & { unread?: boolean })[];
  split?: number;
  judged: boolean;
  judgedBy: 'statement' | 'action' | 'question' | 'referents' | 'slots' | 'denies' | 'fallback' | 'parts' | null;
  checks?: ('referents' | 'slots' | 'denies')[];
  place: number;
  why: string;
  lostTo?: number;
  on?: string;
}
export interface Criterion {
  name: string;
  /** lower is better */
  measure: (scored: Scored) => number;
  say: (scored: Scored) => string;
}
/** order scored readings best first, explaining every place */
export declare function rank(scored: Scored[], criteria?: Criterion[]): { order: number[]; ranked: { index: number; place: number; why: string; lostTo?: number; on?: string }[] };
export declare const RANKING: Criterion[];
export interface Veto {
  answer: boolean;
  index: number | null;
  reasons: { reason: 'nothing' | 'inconsistent' | 'no-referent' | 'ambiguous' | 'action-unavailable' | 'words-left-out' | 'too-few-words' | 'tie'; why: string; [k: string]: unknown }[];
  ask: { key?: string; ask?: string; id?: string; action?: string }[];
  read: { word: string; read: string }[];
}
export interface VetoOptions { minWords?: number; leftOut?: number; criteria?: Criterion[] }
/** answer with the top reading, or not, and why */
export declare function veto(result: { candidates: Scored[]; order: number[] } | Scored[], options?: VetoOptions): Veto;
export interface QueryResult {
  /** 'budget': the call ran out of budget; `site`, `steps` and `why` say where */
  status: 'supported' | 'conflicting' | 'ambiguous' | 'missing' | 'refused' | 'no' | 'unknown' | 'budget' | 'unsupported';
  reason?: string;
  /** for an open key that may be assumed: the values that would make the rest of the question hold, cheapest first */
  howto?: { value: string; cost: number; fills: { id?: string; key: string; value: string }[]; assume: Wire[] }[];
  /** when the answer came from supposing a wire: that wire as the rules left it, and what they set */
  supposed?: { type: string; attrs: Record<string, string[]>; set: Record<string, string | string[]>; fills: { key: string; value: string; via: string; from: string[]; tier: string }[] };
  /** the weakest tier under the answer, and the assumptions it rests on */
  tier?: string; rests?: Cell[];
  /** ids of the standing core.issue wires about this key the answer rests on (soft bounds) */
  issues?: string[];
  /** issues of soft denies about wires the answer rests on: advice, the status stays */
  advice?: { issue: string; why: string }[];
  site?: string; steps?: number; why?: string;
  value?: string; values?: string[];
  /** mode=check: the value checked, and when the answer is 'no', the values the world has */
  checked?: string; actual?: string[];
  alternatives?: { value: string; from: string[] }[];
  missing?: { id?: string; type?: string; key: string; ask?: string }[];
  violations?: Violation[];
  from: string[]; via?: string[]; wires: string[];
  answer?: { ok: boolean; id?: string; question?: string; violations?: Violation[] };
}
export interface ActResult {
  /** what the action changed (when done): what it told and what rules derived from it */
  diff?: Difference; ok: boolean; status: 'done' | 'missing' | 'refused' | 'error' | 'unsupported' | 'budget'; value?: string; result?: unknown; missing?: { action: string; key: string; ask?: string }[]; violations?: Violation[] }
export interface Assignment { id: string; key: string; value: string }
/** Changes judged as a whole: wires to tell and values to fill, or just the fills. */
export type Patch = Assignment[] | { wires?: string | Wire[]; fills?: Assignment[]; /** replace what the key holds */ sets?: Assignment[]; /** wire ids to retract */ retract?: string[]; /** replace in place: the wire keeps its id and gets exactly these keys */ replace?: { id: string; type?: string; attrs: Record<string, string | number | (string | number)[]> } | { id: string; type?: string; attrs: Record<string, string | number | (string | number)[]> }[] };
export interface SolveReport { reason?: string; status: 'sat' | 'unsat' | 'unknown'; assignment?: Assignment[]; stats: { [name: string]: number | BudgetViolation | undefined; budget?: BudgetViolation }; solver?: string }
export interface SolveOptions { preset?: Map<number, string>; budget?: number }
export interface Solver {
  name: string;
  solve(problem: Problem, options?: SolveOptions): SolveReport;
  solveAsync?(problem: Problem, options?: SolveOptions): Promise<SolveReport>;
}
export interface Literal { v: number; value: string }
export interface ProblemData {
  variables: { index: number; name: string; domain: string[] }[];
  nogoods: Literal[][];
  preset?: Literal[];
}
export class Problem {
  constructor(world: World);
  variables: { index: number; id: string; key: string; type: string; domain: string[] }[];
  readonly nogoods: Literal[][];
  monotone: boolean;
  stats: { oracle: number };
  indexOf(id: string, key: string): number;
  push(index: number, value: string): { ok: boolean; culprits?: number[] };
  pop(): void;
  reset(): void;
  verify(values: (string | undefined)[]): { ok: boolean; culprits?: number[] };
  toAssignment(values: (string | undefined)[]): Assignment[];
  toJSON(): ProblemData;
}
export class Sat {
  constructor(variables: number);
  conflicts: number; decisions: number; learned: number;
  addClause(literals: number[]): boolean;
  /** true: satisfiable, false: unsatisfiable, null: budget of conflicts exhausted */
  solve(budget?: number): boolean | null;
  model(): boolean[];
}
type MaybePromise<T> = T | Promise<T>;
export const solvers: {
  backtrack(): Solver;
  cdcl(): Solver;
  external(options: { name?: string; run: (data: ProblemData) => MaybePromise<(string | undefined)[] | null>; maxRounds?: number }): Solver;
  dimacs(options: { exec: (cnf: string) => MaybePromise<string>; name?: string }): Solver;
  clingo(options: { exec: (program: string) => MaybePromise<string>; name?: string }): Solver;
};
export function toDimacs(data: ProblemData): { text: string; lit: number[][] };
export function toASP(data: ProblemData): string;
export function quantity(value: string): { n: number; unit: string } | null;
export const version: string;
/** which build this is: the version, a fingerprint of the bundled sources and the day it was built (null when run from src/) */
export const build: { version: string; hash: string | null; date: string | null };
export interface NextStep {
  fills: (OpenKey & { value: string; kind: 'forced' | 'default' })[];
  questions: Wire[];
  dead: OpenKey[];
  /** assumptions a host may want confirmed */
  review?: Cell[];
}
export interface Explanation { assume: Wire[]; fills: { id: string; key: string; value: string }[]; text: string; cost: number }
export interface StepResult extends Result { questions: Wire[]; dead: OpenKey[]; pending: object[] }
export interface WorldEvent { seq: number; op: string; [key: string]: unknown }
export interface Snapshot { format: 'sopworld'; version: number; log: object[]; /** with toJSON({ since }): the base the log continues */ base?: { length: number; last: string | null }; /** with toJSON({ timeline: true }) */ timeline?: { marks: { label?: string; seq: number; /** a position in log */ at?: number; log?: object[]; whole?: boolean }[]; redo: object[][] } }
export type Fn = (args: string[], world: World) => string | number | boolean | undefined;
export interface WorldOptions {
  /** for authors: advice at load (a kind with the shape of another module's, a rule already in a module), as warnings of kind 'advice' */
  advise?: boolean;
  fns?: Record<string, Fn>; maxDepth?: number; maxSteps?: number;
  lookahead?: boolean; strict?: boolean; searchBudget?: number;
  library?: Record<string, string>;
  solver?: Solver;
  /** wire types and key names used for questions, answers and requests */
  vocabulary?: Partial<Record<'question' | 'answer' | 'request' | 'type' | 'seek' | 'about' | 'mode' | 'where' | 'action' | 'arg' | 'to' | 'value' | 'status' | 'via' | 'from', string>>;
  /** functions an action runs: (context, args) => value */
  actions?: Record<string, (context: any, args: Record<string, string>) => unknown>;
  /** functions that compute a key on demand: (context) => value */
  producers?: Record<string, (context: any) => unknown>;
  /** the namespace of every statement of this world */
  ns?: string;
  /** facts the host keeps itself: facts[type](where) returns wires of that type ({ id, ...keys }); never stored, forked or logged */
  facts?: Record<string, (where: Record<string, string>, world: World) => ({ id: string; attrs?: Record<string, unknown>; [key: string]: unknown })[]>;
  /** how a reason writes a value: ?n:name calls filters[name](value, { world, name }) */
  filters?: Record<string, (value: string | number, context: { world: World; name: string }) => string>;
  /** the dictionary forms of a token, for interpret */
  lemma?: (token: string) => string | string[];
  /** allow `fns` to replace built-ins: true, or the names */
  override?: boolean | string[];
  /** decimals kept in derived numbers (default: 12 significant digits) */
  decimals?: number;
  /** the budget of every call that does not give its own */
  budget?: Budget;
  rank?: <T>(items: T[], context: { kind: 'value' | 'explanation'; world: World; id?: string; key?: string }) => T[] | void;
}
/** Steps one call may take (default 5,000,000) and an optional wall-clock limit. */
export interface Budget { steps?: number; ms?: number }
export type Site = 'match' | 'chase' | 'negation' | 'aggregate' | 'fluent' | 'withdraw' | 'validate' | 'complete' | 'ground' | 'solve' | 'abduce' | 'induce';
/** How a call that ran out of budget says so. */
export interface BudgetViolation { kind: 'budget'; site: Site; steps: number; why: string }
export interface Stats { steps: number; limit: number; exhausted: boolean; site: Site | null; sites: Record<Site, number>; ms: number }
export interface Budgeted { budget?: Budget }
export interface ChangeOptions extends Budgeted { dry?: boolean; strict?: boolean; /** the namespace of the facts told */ ns?: string; /** how sure this statement is (default: told): one tier, or one per key ({ kind: "default" }) */ tier?: string | Record<string, string> }
export interface Description {
  types: Record<string, { count: number; instances: string[] }>;
  wires: Record<string, { type: string; tier: string; via?: string; keys: Record<string, { value: string | string[]; tier: string }> }>;
  open: OpenKey[];
  assumed: { id: string; key: string | null; value?: string; tier: string; dependants: number }[];
  issues: { id: string; rule?: string; about: string[]; key?: string; why?: string }[];
  changes: WorldEvent[];
}
export interface Difference {
  same: boolean;
  added: { id: string; type: string; tier: string }[];
  removed: { id: string; type: string; tier: string }[];
  changed: { id: string; key: string; from?: string | string[]; fromTier?: string; to?: string | string[]; toTier?: string }[];
}
export interface Cell { id: string; key: string | null; value?: string; tier: string }
export interface Assumption extends Cell { cost?: number; dependants: { id: string; key: string | null }[] }

export class World {
  constructor(options?: WorldOptions);
  wires: Map<string, Wire>;
  /** a token for the content: kept by forks being born and by statements that add nothing; new after any change */
  readonly version: number;
  options: WorldOptions;
  fns: Record<string, Fn>;
  /** the matrix wires by id */
  matrix: Map<string, Wire>;
  /** what the matrix says about a type: parent, lineage, closed, keys with all their attributes */
  schema(type: string): { type: string; extends: string | null; lineage: string[]; closed: boolean; keys: Record<string, Record<string, unknown>>; [attr: string]: unknown } | null;
  log: object[];
  tell(input: string | Wire[], options?: ChangeOptions): Result;
  fill(id: string, key: string, value: string | number, options?: ChangeOptions): Result;
  load(input: string | Wire[]): Result;
  use(name: string): Result;
  retract(id: string, options?: Budgeted): Result;
  replace(id: string, input: string | Wire[], options?: Budgeted): Result;
  step(input: string | Wire[], options?: Budgeted & { defaults?: boolean; choose?: boolean; strict?: boolean }): StepResult;
  answer(question: Wire, value: string | number): Result;
  /** shares the state until one of the two worlds changes; copies nothing */
  fork(): World;
  /** add a host function; a 'function' with a built-in's name needs { override: true } */
  register(kind: 'function' | 'action' | 'producer' | 'filter', name: string, fn: Function, options?: { override?: boolean | string[] }): this;
  /** the host's lemma function for interpret: fn(token) gives the dictionary forms of a token */
  register(kind: 'lemma', fn: (token: string) => string | string[]): this;
  actions: Record<string, Function>;
  producers: Record<string, Function>;
  /** for functions: say why no result can be given, before returning nothing */
  cannot(reason: string): void;
  /** a summary of the world as plain data */
  describe(options?: { about?: string; depth?: number; since?: number; last?: number }): Description;
  /** what is different in another world (a fork on which something was tried) */
  diff(other: World): Difference;
  static diff(a: World, b: World): Difference;
  /** replace a told value (or several: revise(id, { key: value })) with everything that follows; lists what gave way */
  revise(id: string, key: string, value: string | number, options?: Budgeted): Result & { revised?: Cell[] };
  revise(id: string, values: Record<string, string | number>, options?: Budgeted): Result & { revised?: Cell[] };
  /** take back the last n statements (a patch counts as one); the world is rebuilt from the rest */
  undo(n?: number, options?: Budgeted): { ok: boolean; undone: object[]; removed: string[]; added: string[]; changed: Difference['changed']; violations: Violation[] };
  /** make the told facts of a type (or with { prefix }, of an id prefix) equal to a list, in one transaction */
  sync(collection: string | { type?: string; prefix?: string }, input: string | Wire[], options?: Budgeted & { strict?: boolean; tier?: string; ns?: string }): Result & { told?: string[]; replaced?: string[]; retracted?: string[]; same?: string[] };
  /** tell again what the last undo (or the last n) took back */
  redo(n?: number, options?: Budgeted): { ok: boolean; redone: object[]; removed: string[]; added: string[]; changed: Difference['changed']; violations: Violation[] };
  /** a point to come back to; costs nothing until the world changes */
  mark(label?: string): Mark;
  /** the open marks, oldest first */
  marks(): { label?: string; seq: number; mark: Mark }[];
  /** make the world exactly what it was at the mark */
  /** only: take back one unit (a type, or { prefix }), keeping everything else */
  rewind(mark: Mark, options?: { only?: string | { type?: string; prefix?: string } }): { violations?: Violation[]; ok: boolean; removed: string[]; added: string[]; changed: Difference['changed'] };
  /** the facts as they were stated, without what rules, defaults or searches added */
  told(): Wire[];
  /** how solid a value is: told, derived, forced, default, guessed, or a tier the matrix declares */
  tier(id: string, key?: string): string | undefined;
  /** everything weaker than derived, weakest first, with the cells that rest on each */
  /** ids: only what these wires rest on */
  assumptions(ids?: string | string[]): Assumption[];
  /** things that still work and will not, such as a pattern declared the old way (`?id type ...`) */
  warnings: { kind: string; id: string; why: string }[];
  /** steps of the last call, per site, and whether its budget ran out */
  stats(): Stats;
  on(listener: (events: WorldEvent[], world: World) => void): () => void;
  /** timeline: also the open marks and the redo stack */
  toJSON(options?: { timeline?: boolean; /** only what came after this world's log */ since?: World }): Snapshot;
  static fromJSON(data: Snapshot, options?: WorldOptions & { /** the base a snapshot with since= was written against */ base?: World }): World;
  get(id: string): Wire | undefined;
  has(id: string): boolean;
  resolve(id: string): string;
  ofType(type: string): Wire[];
  ask(query: string | Wire[], options?: Budgeted & { at?: number; /** only this namespace */ ns?: string; /** match on the world as it would be with this patch */ given?: Patch }): Record<string, string>[] & { budget?: BudgetViolation };
  holds(query: string | Wire[], options?: Budgeted): boolean;
  open(id?: string): OpenKey[];
  suggest(id: string, key: string, options?: Budgeted & { deep?: boolean }): Candidate[] & { budget?: BudgetViolation };
  /** `review: true` adds the assumptions a host may want confirmed (a pass over every value) */
  next(options?: Budgeted & { review?: boolean }): NextStep & { budget?: BudgetViolation };
  /** cheap: is there an empty slot that completion could fill (a default, or a closed domain for a required key)? */
  canComplete(id?: string): boolean;
  complete(options?: Budgeted & { defaults?: boolean; choose?: boolean }): { filled: object[]; questions: Wire[]; dead: OpenKey[]; pending: object[]; budget?: BudgetViolation };
  /** `budget` is the solver's own search budget; `limit` is the step budget of the call */
  solve(options?: { solver?: Solver; budget?: number; limit?: Budget }): Assignment[] | null;
  solveReport(options?: { solver?: Solver; budget?: number; limit?: Budget }): SolveReport;
  solveAsync(options?: { solver?: Solver; budget?: number }): Promise<SolveReport>;
  satisfiable(options?: { solver?: Solver; budget?: number; limit?: Budget }): boolean;
  apply(assignment: Assignment[], options?: Budgeted & { via?: string }): Result;
  /** would these changes be accepted together? Applied in one scratch transaction and undone. */
  /** with query/ask: also answer on the world with the patch (answer, rows); nothing changes */
  check(patch: Patch, options?: Budgeted & { strict?: boolean; query?: Question | Wire | string; ask?: string | Wire[] }): Result & { answer?: QueryResult; rows?: Record<string, string>[] };
  /** without a patch: validate the whole world; every violation, and the standing issues */
  check(patch?: undefined, options?: { strict?: boolean }): { ok: boolean; violations: Violation[]; issues: { id: string; rule?: string; about: string[]; key?: string; kind?: string; type?: string; value?: string; why?: string }[] };
  /** Declares a type complete: a by= join to it that finds no target is refused from now on. Returns the joins still open to it. */
  closeType(type: string): { id: string; key?: string; kind?: string; type?: string; value?: string; why?: string }[];
  /** check wires from somewhere else against a matrix */
  static audit(wires: string | Wire[], matrix?: string | Wire[], options?: WorldOptions): { ok: boolean; violations: Violation[]; issues: object[]; world: World };
  /** apply several changes that must hold together: all or nothing */
  applyPatch(patch: Patch, options?: Budgeted & { strict?: boolean }): Result;
  query(question: Question | Wire | string, options?: Budgeted & { record?: boolean; suppose?: boolean; at?: number; /** only this namespace */ ns?: string; /** answer on the world as it would be with this patch */ given?: Patch }): QueryResult;
  /** the core.word entries of the world, by text */
  words(): Map<string, { id: string; means: string; of?: string; meanings: WordMeaning[] }[]>;
  /** read a frame into candidates for score; nothing invented */
  interpret(frame: Frame | Frame[] | Frame[][], options?: Budgeted & { limit?: number; id?: string; ns?: string; /** read unknown words as the nearest known ones (default true) */ near?: boolean; /** a follow-up to this frame, or to the last told statement */ previous?: Frame | { frame: Frame; ids?: string[] } | 'told' }): { candidates: (ScoreCandidate & Reading)[]; unresolved: string[]; dropped: number; budget?: Violation };
  /** example sentences from the tools, slots and words, with the host's templates */
  examples(templates?: { action?: Template; statement?: Template; question?: Template }, options?: { per?: number; all?: boolean; sample?: number }): Example[];
  /** answer with the top reading of score, or not, and why */
  veto(result: { candidates: Scored[]; order: number[] } | Scored[], options?: VetoOptions): Veto;
  /** the modules of the matrix */
  modules(): { name: string; version?: string; imports: string[]; exports?: string[] }[];
  /** the host functions the matrix declares (core.function) */
  functions(): { name: string; out: { kind?: string }; pure: boolean; doc?: string; args: { name: string; kind?: string; optional: boolean; doc?: string }[]; registered: boolean }[];
  /** judge candidate readings against the world; nothing is told */
  score(candidates: ScoreCandidate[], options?: Budgeted & { criteria?: Criterion[] }): { candidates: Scored[]; order: number[] };
  /** run fn against the world as it was at a point of the sequence */
  asOf<T>(at: number, fn: (world: World) => T, options?: Budgeted): T | undefined;
  seqOf(id: string): number | undefined;
  compare(idA: string, idB: string): number;
  act(request: { action: string; args?: Record<string, string | number | string[]> } | Wire | string, options?: Budgeted & { message?: string }): ActResult;
  /** the requests of one sentence, all or nothing: one step for undo; `failed` is the index of the request that was not done */
  act(requests: ({ action: string; args?: Record<string, string | number | string[]> } | Wire | string)[], options?: Budgeted): { ok: boolean; status: ActResult['status']; results: ActResult[]; failed?: number; missing?: ActResult['missing']; violations: Violation[] };
  trial<T>(fn: (world: World) => T, options?: Budgeted): T | undefined;
  stamp: number;
  abduce(goal: string | Wire[], options?: Budgeted & { maxDepth?: number; max?: number; maxAssumptions?: number }): Explanation[] & { budget?: BudgetViolation };
  explain(id: string): object | null;
  history(): WorldEvent[];
  /** why a wire, or one of its values, is what it is: the chain back to what was told */
  why(id: string, key?: string): { id: string; key?: string; steps: { id: string; key?: string; value?: string | string[]; wire?: string; tier?: string; how: 'told' | 'action' | 'rule' | 'aggregate' | 'default' | 'open'; rule?: string; action?: string; choice?: { key: string; value: string; tier?: string; source?: string }; from?: string[] }[] } | null;
  toSOP(options?: { schema?: boolean; derived?: boolean; provenance?: boolean }): string;
}
/** Thrown for text that is not SOP Lang; says where. */
export interface SyntaxProblem { message: string; offset: number; line: number; column: number }
export class SopError extends Error { line?: number; column?: number; offset?: number; /** every error of the text, in order */ errors: SyntaxProblem[] }
export type Bindings = object;
export interface Mark { world: World; seq: number; label?: string }
/** match two values (atom, ?variable, $reference); the bindings, or null */
export function unify(a: string, b: string, bindings?: Bindings): Bindings | null;
/** what a value stands for under bindings */
export function walk(term: string, bindings: Bindings): string;
/** for each matrix wire type, the attributes it reads (a name ending in '.' is a prefix) */
export const GRAMMAR: Record<string, string[]>;
/** attributes that may stand on any pattern or template */
export const MODIFIERS: Record<string, 'pattern' | 'template'>;
/** the types that make a wire a matrix wire */
export const SCHEMA_TYPES: Set<string>;
/** the aggregate functions of core.calc ... over= */
export const aggregates: Record<string, Function>;
/** `anonymous`: a declaration may leave out its `@id` (queries) */
/** `lenient`: read what versions before 0.6.1 read (an id twice in one text, non-JSON escapes, a quote or backslash in an atom) */
export function parse(text: string, options?: { anonymous?: boolean; lenient?: boolean }): Wire[];
/** `canonical`: entries on their own lines, sorted by key, strings in one spelling */
export function format(wire: Wire, options?: { multiline?: boolean; canonical?: boolean }): string;
/** wires as a text, each followed by a line end */
export function serialize(wires: Wire[], options?: { multiline?: boolean; canonical?: boolean }): string;
export interface Value { kind: 'atom' | 'string' | 'ref' | 'var'; v: string }
/** a value token as data */
export function readValue(token: string): Value;
/** the token of a value given as data */
export function writeValue(value: Value): string;
export function tokenize(text: string, options?: { lenient?: boolean }): { t: string; line: number; column: number; offset: number }[];
export function str(value: string): string;
export function quote(text: string): string;
export function induce(examples: { when: string | Wire[]; then?: string | Wire[] }[], options?: { name?: string; kind?: 'rule' | 'deny'; why?: string; tolerant?: boolean; distinct?: boolean; negatives?: { when: string | Wire[] }[]; budget?: Budget }): { text: string | null; budget?: BudgetViolation; skipped: { index: number; why: string }[]; calcs: object[]; tests: object[]; coversNegative: number[]; variables: number; examples: number };
export function adopt(world: World, explanation: Explanation): { ok: boolean; results: Result[] };
export function induceRule(examples: { when: string | Wire[]; then: string | Wire[] }[], options?: { name?: string }): string;
export function induceSlots(wires: string | Wire[], options?: { enumMax?: number; prefix?: string }): string;
export function abduce(world: World, goal: string | Wire[], options?: object): Explanation[];
export const builtins: Record<string, Fn>;

/** An index of sentence patterns by the words they need: only the patterns a sentence can match are handed out. */
export class PatternIndex<P extends { id: string; kind?: string; needs?: (string | string[])[] } = { id: string; kind?: string; needs?: (string | string[])[] }> {
  constructor(patterns?: P[], options?: { normalize?: (word: string) => string });
  add(pattern: P): this;
  readonly size: number;
  /** the patterns every set of whose needed words meets the sentence, in the order added */
  candidates(tokens: string | string[], options?: { kind?: string | string[] }): (P & { at: number })[];
  stats(): { patterns: number; words: number; open: number; perSentence: number };
}

/** the card of each world declared with std.schema (or of one) */
export function schemaCard(world: World, name?: string): { world: string; doc?: string; kinds: { kind: string; words?: string[]; acts: string[]; attrs: object[]; limit?: number; open?: boolean; from?: string }[] }[];
/** example sentences per act and kind, with the request each should become */
export function schemaExamples(world: World, name?: string, options?: { per?: number }): { world: string; act: string; kind: string; text: string; request: { action: string; args: Record<string, unknown> } }[];
/** the reply for an act, from its result: what was done, or why not and what is possible */
export function actReply(world: World, request: { action: string; args?: Record<string, unknown> }, result: object): string;

/** a catalog of knowledge worlds: find what a word needs, read it once through the host's reader, tell it into a world (schemas first) */
export function createCatalog(options: { index: { worlds: { id: string; schema?: string; depends?: string[]; shards?: { id: string; path: string }[] }[] }; vocab?: Record<string, string[]>; read: (path: string) => string | null | Promise<string | null>; cache?: { get(path: string): string | undefined; set(path: string, text: string): void }; lemma?: (word: string) => string[] }): {
  shardsOf(word: string): string[];
  plan(shards: string | string[]): string[];
  fetch(word: string): Promise<{ path: string; text: string }[]>;
  into(world: World, word: string): Promise<{ word: string; shards: string[]; told: string[]; ok: boolean; violations: Violation[] }>;
  intoSync(world: World, word: string): { word: string; shards: string[]; told: string[]; ok: boolean; violations: Violation[] };
  textSync(path: string): string;
  shardsOfWorld(id: string): string[];
  worlds(): string[];
};
/** a read(path) over an offline bundle written by tools/build-bundle.mjs */
export function bundleReader(bundle: { files: Record<string, string> }): (path: string) => string | null;
/** Several catalogs at once, the first wins; each fact keeps its catalog in its source; conflicts reported. */
export function createCatalogs(list: { name: string; index: object; vocab?: Record<string, string[]>; read: (path: string) => string | null | Promise<string | null>; cache?: object; lemma?: (word: string) => string[] }[], options?: { lemma?: (word: string) => string[] }): {
  catalogs(): string[];
  shardsOf(word: string): string[];
  into(world: World, word: string): Promise<{ word: string; shards: string[]; told: string[]; ok: boolean; violations: object[]; conflicts: { id: string; kept: string; dropped: string; path: string; keys: string[] }[] }>;
  intoSync(world: World, word: string): { word: string; shards: string[]; told: string[]; ok: boolean; violations: object[]; conflicts: { id: string; kept: string; dropped: string; path: string; keys: string[] }[] };
};

/** one request pipeline: dry-run the readings, apply the first the world takes (one sentence, one undo step), or fall back (ask, elsewhere, a named guess) */
export function turn(world: World, readings: ({ action: string; args?: Record<string, unknown> } | { action: string; args?: Record<string, unknown> }[] | { requests: { action: string; args?: Record<string, unknown> }[] })[], options?: { reply?: (world: World, request: object, result: object) => string; load?: (need: { of: string; type: string; from?: string }, world: World) => void }): {
  status: 'done' | 'ask' | 'elsewhere' | 'unknown' | 'nothing'; reading?: number; results?: object[]; diff?: { added: object[]; removed: object[]; changed: object[] };
  why?: { id: string; key: string; steps: object[] }[]; guesses?: object[]; replies?: string[]; question?: string; missing?: object[]; reason?: object; guess?: object; dropped: object[];
};

/** the worlds of the schemas scored for a request: their cards, the thing named, a dry run, the host's own signal; best first */
export function route(world: World, request: { action: string; args?: Record<string, unknown> }, options?: { scores?: Record<string, number> }): { world: string; score: number; why: string[] }[];

/** the coverage grid: world × kind × act cases run on a world with one thing of each kind, with what came of each */
export function schemaGrid(world: World, name?: string, options?: { per?: number }): { world: string; act: string; kind: string; text: string; request: { action: string; args: Record<string, unknown> }; expect: { ok: boolean; added?: string[]; removed?: number; changed?: string[]; status?: string; why?: string } }[];
/** a node:test file for grid cases */
export function gridTests(cases: object[], options?: { importFrom?: string; make?: string }): string;

/** the stages of the request pipeline a failure is filed under */
export const STAGES: string[];
/** the key of a ledger row: source, text and world */
export function ledgerKey(row: object): string;
/** the rows of `add` new to `rows` (append-only) */
export function ledgerAppend<R extends object>(rows: R[], add: R[]): R[];
/** rows grouped by stage, class and the first cause signal that holds; largest first */
export function ledgerGroups(rows: object[], options?: { signals?: [string, (row: any) => boolean][]; examples?: number }): { key: string; stage: string; class: string; cause: string; count: number; examples: object[] }[];
/** the stage a turn result failed at, or null when it was done */
export function stageOf(result: object): string | null;

/** the request pipeline as data: runs the stages a world declares with std.turn; providers are functions of a context */
export function turnFlow(world: World, readings: object[], options?: { providers?: Record<string, (ctx: any) => unknown>; reply?: (world: World, request: object, result: object) => string; confirmed?: boolean }): ReturnType<typeof turn> & { trace: { stage: string; provider?: string; yielded?: unknown; empty?: string; skipped?: string }[]; stage?: string };

/** a grammar world's lexicon (g.word), rules (g.rule, with ? * + expanded) and coordinating words (g.coord) */
export interface GrammarOptions { types?: { rule?: string; word?: string; coord?: string }; classes?: Record<string, string>; lexicon?: Record<string, { cat: string; lemma?: string; feat?: Record<string, unknown> } | { cat: string; lemma?: string; feat?: Record<string, unknown> }[]>; digits?: string }
export function grammarOf(world: World, options?: GrammarOptions): { lex: Map<string, { cat: string; lemma: string; feat: Record<string, unknown> }[]>; rules: Map<string, string[][]>; coord: Set<string>; multi: string[]; digits?: string };
/** text parsed with a grammar world: every complete parse of `start`, best first */
export function parseText(world: World, text: string, options?: { start?: string; max?: number; budget?: number; alternations?: boolean | object } & GrammarOptions): { tree: object; size: number }[] & { tokens: string[]; unknown?: { word: string; at: number }[]; truncated?: true; steps?: number; applied?: string[]; normalised?: string; mode?: string };
/** a noun phrase node read as roles */
export function nounPhrase(node: object, cats?: { det?: string; num?: string; mod?: string; head?: string; pp?: string; ord?: string; name?: string; pron?: string }): { span: [number, number]; rule?: string; quant?: string; det?: string; num?: string; ord?: string; name?: string; pron?: string; mods?: string[]; head?: string; lemma?: string; pp?: object[]; parts?: object[]; coord?: object[] };
/** The words of a view: `text` of the wires of `type` whose `in=` names it. */
export function grammarView(world: World, type: string, view?: string): string[];
/** Which words two views disagree on. */
export function viewDiff(world: World, type: string, a: string, b: string): { only: Record<string, string[]>; both: string[] };
/** The things a noun phrase names, and how sure: tier user / scene / focus / slip; or why not. */
export function resolve(world: World, phrase: string | object, options?: { grammar?: object; cats?: Record<string, string>; focus?: string | string[]; inside?: string; focusFor?: 'any' | 'pronoun' }): { ids: string[]; tier?: 'user' | 'scene' | 'focus' | 'slip'; how?: string[]; why?: string; which?: string[]; kind?: string; unknown?: { word: string; at: number }[]; failure?: 'unknown-word' | 'unread' | 'unknown-kind' | 'none' | 'no-number' | 'no-focus' | 'ambiguous'; ask?: boolean; guess?: { word: string; ids: string[] } };
/** The typed needs of a world or view (std.schema.needs), each with whether it is loaded. */
export function needsOf(world: World, scope?: { world?: string; view?: string }): { of: string; type: string; from?: string; loaded: boolean }[];

/** The arbitration contract: own / decline / refuse per declared world for one request. */
export function arbitrate(world: World, request: { action: string; args?: Record<string, unknown> }, options?: { pass?: 'exact' | 'spelling' | 'view'; resolves?: (world: string, words: string[]) => boolean; words?: string[] }): { verdicts: { world: string; verdict: 'own' | 'decline' | 'refuse'; why: string }[]; owner: string | null; ambiguous?: string[]; pass: string };
/** One segmenter that knows the act forms: clauses, one act each. */
export function segment(world: World, text: string, options?: { types?: { joiner?: string; frameLead?: string }; acts?: string[] }): { text: string; from: number; to: number; joiner?: string }[];
/** The words that start an act: action names, core.word texts that mean one, and extra. */
export function actWords(world: World, extra?: string[]): Set<string>;
/** The kind of one turn (why, correction, continuation, list, ellipsis, answer, request). */
export function dialogueTurn(world: World, text: string, options?: { cues?: Record<string, string>; acts?: string[]; last?: { action: string; args?: Record<string, unknown> }; asked?: boolean }): { kind: 'why' | 'correction' | 'continuation' | 'list' | 'ellipsis' | 'answer' | 'request'; rest: string; cue?: string; act?: string; items?: string[]; first?: string };
/** What each turn of a dialogue mentions, in order. */
export function focusLog(world: World, dialogue?: string): { turn: string; in?: string; pos: number; mentions: { kind: string; value: string }[] }[];
/** A read over a bundled subset first, then the catalog's read; .reachable() after a miss. */
export function bundleThenRead(bundle: { files: Record<string, string> }, read: (path: string) => string | null | Promise<string | null>): ((path: string) => string | null | Promise<string | null>) & { reachable(): boolean };
/** The names (or ids) of the loaded wires of a type, optionally with slot = value. */
export function listOf(world: World, type: string, slot?: string, value?: string): string[];
/** World-level bundles: std.schema.world bundle=<name> gets bundles[name] told once. */
export function loadBundles(world: World, bundles: Record<string, string>): { ok: boolean; told: string[]; violations?: object[]; bundle?: string };
/** std.morph: the morphology a language world declares, compiled (classes with inherited cells, a suffix index, folds). */
export interface Morph { classes: Map<string, { name: string; drop: string; alts: string[][]; cells: Map<string, { suffix: string; alt: boolean; feat: Record<string, string> }> }>; index: Map<string, object[]>; irregular: object[]; folds: string[][]; splits: string[]; templates: { act: string; shape: string | null; text: string }[] }
export function morphOf(world: World, options?: { types?: { cls?: string; ending?: string; irregular?: string; fold?: string; split?: string; template?: string } }): Morph;
export function generate(m: Morph, lemma: string, cls: string, features: Record<string, string>): string | null;
export function analyse(m: Morph, form: string, options?: { dictionary?: Dictionary }): { lemma: string; class: string | null; features: Record<string, string>; form: string; exact: boolean }[];
export function fold(m: Morph, text: string): string;
export function splitClitics(m: Morph, word: string): string[];
export interface Dictionary { lookup(lemma: string): { lemma: string; class: string; gender?: string; sense?: string } | null; byFolded(plain: string): { lemma: string; class: string; gender?: string; sense?: string }[]; loaded(): string[] }
export function dictionary(options: { read: (prefix: string) => string | null; prefix?: number; fold?: (s: string) => string }): Dictionary;
export function realise(m: Morph, template: string, roles: Record<string, string>, options?: { dictionary?: Dictionary; base?: Record<string, string>; agree?: string[] }): string | null;
export function templateFor(m: Morph, act: string, shape?: string | null): string | null;
/** std.motion: the change points of states over time, from rules and events (pure, seeded). */
export function motionPlan(world: World, events?: { t: number; type: string; fields?: Record<string, unknown>; stream?: string }[], options?: { seed?: number; until?: number; splitters?: Record<string, (text: string) => string[]>; types?: Record<string, string> }): { t: number; key: string; value: string }[];
/** Play a plan through the host's clock; returns cancel(). */
export function motionRun(plan: { t: number; key: string; value: string }[], apply: (key: string, value: string, t: number) => void, clock?: { setTimeout(f: () => void, t: number): unknown; clearTimeout(h: unknown): void }): () => void;
/** std.plan: a fact store over published worlds (facts merged by identity, lazy per type). */
export interface FactStore { facts(type: string): { type: string; attrs: Record<string, string[]>; n: number }[]; index(type: string, key: string): Map<string, object[]>; kindsOf(world: string): Record<string, string> | null }
export function factStore(worlds: { id: string; schemaText: string; shards: { text: string }[] }[]): FactStore;
/** A working copy of a live world for planning. */
export class PlanLive { constructor(options?: { world?: string | null; things?: { id: string; kind: string; attrs?: Record<string, unknown>; members?: string[] }[]; history?: object[]; kinds?: Record<string, string> | null; store?: FactStore | null }); world: string | null; things: Map<string, object>; history: object[] }
export interface PlanResult { method?: string; methods: string[]; acts: object[]; lines: string[]; explain: string[]; requests: { action: string; args: Record<string, unknown> }[]; skipped: string[]; effects: object[]; asks: string[]; refused?: boolean; tried?: { method: string; why: string }[]; truncated?: boolean }
export function planner(store: FactStore, options?: { chain?: { type: string; keys: string[] }[]; prefix?: string; roles?: string; about?: string[]; seed?: number; chooseLimit?: number }): { methods: object[]; isA(a: string, b: string): boolean; plan(goal: { act: string; roles?: Record<string, unknown> }, live?: PlanLive): PlanResult };
export function readMethods(store: FactStore, prefix?: string): object[];
export const PLAN_LIMITS: { acts: number; depth: number };
/** The full motion format (k.motion) as plain objects. */
export function readMotion(world: World, options?: { style?: string; prefix?: string }): { layers: Map<string, object>; rules: object[]; visemes: Map<string, string>; splitters: Map<string, object>; events: string[]; fields: object[]; steps: object[]; whens: object[]; keys: string[] };
/** Plan the full motion format: segments, emitted events, the state at a time, the change points. */
export function planMotionFacts(motion: object, options?: { events?: { t: number; name: string; fields?: Record<string, unknown> }[]; seed?: number; end?: number; base?: Record<string, string>; features?: (key: string, value: string) => Record<string, string[]>; aliases?: Record<string, string>; splitters?: Record<string, (text: string) => object[]>; keys?: string[] }): { segments: object[]; instances: object[]; emitted: { t: number; name: string; fields: object }[]; stateAt(t: number): Record<string, string>; changes: { t: number; key: string; value: string | null; rule: string | null }[] };
/** The units of a text by a splitter of the facts. */
export function splitText(splitter: object, text: string): { char: string; group: string; class: string; min: number; max: number }[];
/** Checks of a grammar: an optional part that shares words with the next, words the lemma changes away, entries too long. */
export function grammarCheck(world: World, options?: { lemma?: (word: string) => string | string[]; maxWords?: number } & GrammarOptions): { kind: 'optional-shares-words' | 'lemmatised-away' | 'too-many-words'; rule?: string; word?: string; [k: string]: unknown }[];
/** std.sample: random but relevant frames, legal in the current state, seeded. */
export function sample(world: World, options?: { seed?: number; n?: number; mode?: 'one' | 'few' | 'actions'; prefer?: { world?: string; thing?: string }; seen?: { action: string; args?: Record<string, unknown> }[]; realise?: (frame: object) => string; read?: (text: string) => { action: string; args: Record<string, unknown> } | null; fillers?: Record<string, (kind: string, rand: () => number) => unknown> }): { frames: { action: string; args: Record<string, unknown>; world?: string; why: string }[]; tried: number; kept: number; roundTrip?: number };
/** Distinct acts, kinds and attributes of frames. */
export function diversity(frames: { action: string; args: Record<string, unknown> }[]): { frames: number; acts: number; kinds: number; attrs: number };
/** std.summarize: the acts of a world's history. */
export function actsOf(world: World): { act: string; kind: string | null; things: string[]; step: string }[];
/** Aggregate a log of acts into frames, generalised up the chain of kinds, by salience. */
export function summarizeLog(entries: { act: string; kind?: string | null; failed?: boolean; changed?: number }[], options?: { parentOf?: (kind: string) => string | null; length?: 'line' | 'paragraph' | 'bullets'; failed?: 'separate' }): { act: string; kind: string | null; count: number; kinds?: string[]; failed?: boolean; salience: number }[] & { failed?: object[] };
/** An extractive summary of a text. */
export function summarizeText(text: string, options?: { n?: number; words?: number; stop?: string[]; redundancy?: number }): { sentences: { text: string; score: number; at: number }[]; picked: string[] };
/** Unigram recall of a summary against a reference. */
export function overlap(summary: string, reference: string, options?: { stop?: string[] }): number;
/** std.space: the spot for one thing (relative to a thing, in a region, or a default spot), avoiding overlaps. */
export function placeFor(world: World, size?: { w?: number; h?: number }, at?: { rel?: string; ref?: string; region?: string }, options?: { frame?: { x: number; y: number; w: number; h: number }; gap?: number; except?: string }): { x?: number; y?: number; how?: string; overlaps?: boolean; why?: string };
/** The boxes of the things that have a place. */
export function boxesOf(world: World, options?: { except?: string }): { id: string; kind?: string; x: number; y: number; w: number; h: number }[];
/** The relation kinds a schema declares. */
export function relationsOf(world: World, kind?: string): { name: string; kind: string; inverse?: string }[];
/** std.compose: a composition of a genre about a topic, from knowledge, as frames citing their wires. */
export function compose(world: World, topic: string, options?: { quiet?: string[]; memo?: boolean; genre?: string; size?: { chapters?: number; sections?: number; sentences?: number; repeats?: number }; seed?: number; realise?: (frame: object) => string; measures?: (fact: Wire) => Record<string, number>; story?: object }): { genre?: string | null; topic?: string; register?: object | null; parts?: { part: string; heading?: string; layout?: string; relation?: string; moves: object[] }[]; choices?: Record<string, unknown>; nodes?: number; chapters?: { title: string; interest: number; sections: { interest: number; sentences: { move: string; fact: object; about: string; cites: string; text?: string }[] }[] }[]; short?: string[]; why?: string };
/** The interest of a fact by the world's k.interest: novelty x coping x relevance - penalty, explained by feature. */
export function interestOf(world: World, fact: Wire, options?: { topic?: string; said?: Set<string>; moves?: { move: string; type: string }[]; move?: string; since?: number; session?: Set<string>; measures?: Record<string, number>; draw?: number; model?: object }): { score: number; value: Record<string, number>; by: Record<string, number>; measured: Record<string, number>; why?: string };
/** The k.interest measures computed from facts and from the text being written. */
export function measuresOf(world: World, fact: Wire, state?: object): Record<string, number>;
/** The share of a k.interest feature's shape at a measured value. */
export function shapeShare(feature: { shape: string; start_at?: number; peak_at?: number; full_at: number }, x: number): number;
/** The interest model a world holds, or null. */
export function interestModel(world: World): { appraisals: object[]; features: object[] } | null;
/** Choice points solved jointly: a seeded weighted sample among the assignments the constraints allow. */
export function solveChoices(vars: string[], options: { domain: (v: string, partial: Record<string, unknown>) => unknown[]; ok?: (partial: Record<string, unknown>, v?: string) => boolean; weight?: (v: string, value: unknown, partial: Record<string, unknown>) => number; seed?: number; limit?: number }): { values?: Record<string, unknown>; nodes: number; why?: string; deepest?: string | null };
/** The facts a story plan reads, from a world holding k.story and the catalog worlds it names. */
export function readStory(world: World): object;
/** A story plan: k.story's elements solved jointly under its constraints. */
export function storyPlan(kb: object, options?: { seed?: number; soft?: number; fixed?: Record<string, string | string[]>; relations?: Record<string, Function>; limit?: number }): { plan?: Record<string, string | string[]>; soft?: string[]; nodes?: number; why?: string; at?: string | null };
/** What each relation of k.story means over the catalog's facts. */
export const STORY_RELATIONS: Record<string, Function>;
/** A composition by a genre written as a w.document live world through std.acts. */
export function writeDocument(world: World, composition: object, options?: { title?: string; language?: string; realise?: (frame: object, register?: object) => string; slides?: boolean; facts?: (frame: object) => string[] }): { document?: string; made?: string[]; refused?: object[]; why?: string };
/** A w.document document read back in order, with the sources of each sentence. */
export function readDocument(world: World, id: string): { title?: string; genre?: string; parts?: { part?: string; title?: string; sentences: { text: string; move?: string; facts: string[] }[] }[]; why?: string };
/** A realiser of composition frames through a language world's discourse templates. */
export function discourseRealiser(world: World, options?: { seed?: number; type?: string; clause?: (fact: object, world?: World) => string | null; np?: (name: string) => string; inflect?: (word: string, features: Record<string, string>) => string; fill?: (slot: string, frame: object, context: object) => string | null | undefined }): (frame: object, register: string | { name: string } | null, context?: object) => { text: string; template: string } | null;
/** The discourse templates a world holds. */
export function discourseTemplates(world: World, type?: string): { id: string; move: string; register: string; slots: string[]; text: string }[];
/** Type-driven reading: frames from the types of the content words, word order only ranks. */
export function readByTypes(world: World, text: string, options?: { question?: string[]; skip?: string[]; lemma?: (word: string) => string[]; senses?: (word: string) => Wire[]; near?: number }): { near?: { word: string; as: string; cost: number; via: string }[]; frames: { frame: object; score: number; words: string[] }[]; best: { is: string; key?: string; of?: object; value?: string; kind?: string; act?: string; args?: Record<string, string>; answer?: string[] } | null; ambiguous?: boolean; unread: string[] };
/** The world's own typed lexicon: word -> senses (thing, kind, attr, value, act, word). */
export function typedLexicon(world: World): Map<string, object[]>;
/** The cousins of a case: up along kinds or keys, down to other members, only the valid ones. */
export function cousins(world: World, kase: { frame: object; text?: string }, options?: { operators?: { name: string; from: string; to: string }[]; senses?: (word: string) => Wire[]; alternations?: { name: string; from: string; to: string }[]; edges?: Record<string, string>; degree?: number; dims?: string[]; known?: (string | object)[]; read?: object; n?: number; seed?: number }): { frame: object; text?: string; degree: number; dims: string[]; via?: string; valid: boolean; why?: string }[];
/** The ancestors of a thing in the layered graph of abstraction: name -> { level, dim }. */
export function ancestorsOf(world: World, id: string, options?: { depth?: number; edges?: Record<string, string> }): Map<string, { level: number; dim: string }>;
/** The chain of kinds of a thing, nearest first. */
export function kindChain(world: World, id: string, depth?: number): string[][];
/** A fix judged on the case alone and on its valid cousins by degree. */
export function judgeFix(answer: (text: string | undefined, frame: object) => unknown, kase: { frame: object; text?: string }, cousins: object[]): { case: boolean; byDegree: Record<string, { pass: number; of: number }>; share: number | null };
/** The near words of a word through word senses (k.words.sense): synonyms 1, kinds 2 and more. */
export function nearWords(world: World, word: string, options?: { senses?: (word: string) => Wire[] }): { word: string; cost: number; via: string }[];
/** The canonical form of a text by the language world's alternation rules. */
export function normalise(world: World, text: string, options?: { rules?: { name: string; from: string; to: string; mode?: string }[]; type?: string; lemma?: (word: string) => string[]; max?: number }): { text: string; applied: string[]; mode?: string };
/** The alternation rules a world holds. */
export function alternationsOf(world: World, type?: string): { name: string; from: string; to: string; mode?: string }[];
/** Reading rules induced from cases (anti-unification), judged on held-out cases and cousins. */
export function learnRules(world: World, cases: { text: string; frame: object }[], options?: { heldOut?: { text: string; frame: object }[]; cousins?: (kase: object) => object[]; admit?: number; min?: number }): { text?: string; support?: string[]; train?: { pass: number; of: number }; heldOut?: { pass: number; of: number }; admitted: boolean; why?: string }[];
/** Two world schemas aligned by structure; what one has and the other lacks is offered. */
export function alignWorlds(a: World, b: World, options?: { min?: number }): { map: Record<string, string>; slots: Record<string, Record<string, string>>; score: number; offers: { to: { type: string; key: string }; what: string; value: unknown; from: { type: string; key: string } }[] };
/** A story then a question: quantities held by owners follow the story; the question is read against them. */
export function storyState(text: string, options?: { verbs?: Record<string, 'set' | 'add' | 'remove' | 'give'>; numbers?: Record<string, number>; pronouns?: string[]; question?: string[]; all?: string[]; skip?: string[] }): { state: Record<string, Record<string, number>>; steps: object[]; answers: { question: string; answer: number | null; owner?: string; item: string; why: string }[]; unread: string[] };
/** A word changed by a language world's ordered suffix rules, irregular forms first. */
export function inflectBy(world: World, word: string, op?: string, options?: { types?: { rule?: string; irregular?: string }; vowels?: string }): string;
/** The article before a word, by the sound it begins with (onsets, else its first letter). */
export function articleFor(world: World, word: string, options?: { types?: { det?: string; onset?: string }; vowels?: string }): string | null;
/** The form operator of an aligned pair: the shared runs become variables. */
export function formOperator(canonical: string, variant: string, options?: { min?: number; world?: World }): { from: string; to: string } | null;
/** Form operators learnt from aligned pairs, clustered, checked on held-out pairs, with their coverage. */
export function learnFormOperators(pairs: { canonical: string; variant: string }[], options?: { world?: World; heldOut?: { canonical: string; variant: string }[]; normalise?: (rule: object, text: string) => string | null }): { operators: { name: string; from: string; to: string; support: string[]; heldOut: { pass: number; of: number }; admitted: boolean }[]; coverage: { pairs: number; operators: number; at80: number | null; at95: number | null }; unaligned: number };
/** The atomic edits of an aligned pair: each hunk where the words differ. */
export function formEdits(canonical: string, variant: string, options?: { world?: World }): { del: string; ins: string; at: 'start' | 'inside' | 'end' }[];
/** Atomic edits clustered into operators, with their coverage of the edits and of the pairs. */
export function learnFormEdits(pairs: { canonical: string; variant: string }[], options?: { world?: World }): { operators: { edit: string; count: number; family: string }[]; edits: number; families: Record<string, number>; coverage: { at80: number; at95: number; pairsAt80: number; pairsAt95: number } };
/** The family of an edit by its shape alone: filler, extra clause, insertion, deletion, inflection, substitution. */
export function familyOf(edit: string): string;
/** Content words lifted to their types through the world's typed lexicon; function words stay. */
export function liftTokens(world: World, text: string, options?: { senses?: (word: string) => object[] }): string[];
/** The inverse of the form operators at read time: clauses, fillers dropped, alternations undone. */
export function canonicalise(world: World, text: string, options?: { fillers?: string[]; splitters?: string[]; rules?: object[]; classes?: Map<string, Set<string>>; type?: string }): { clauses: { text: string; applied: string[]; mode?: string }[]; dropped: string[] };
/** canonicalise, then read each clause by types. */
export function readCanonical(world: World, text: string, options?: { fillers?: string[]; splitters?: string[]; read?: object }): { text: string; mode?: string; applied: string[]; frame: object | null; unread: string[]; near?: object[] }[];
/** The filler words of learnt edits. */
export function fillersFrom(edits: { operators: { edit: string; family?: string }[] }): string[];
/** The word classes a world holds for patterns ({x:wh}). */
export function wordClassesOf(world: World, type?: string): Map<string, Set<string>>;
/** One way to choose: candidates ordered by the criteria declared for their kind (std.decide), every loss explained. */
export function choose<T extends object>(world: World | null, kind: string, candidates: T[], options?: { criteria?: { name: string; measure: string; dir: 'hard' | 'min' | 'max' }[]; seed?: number }): { best: T | null; order: T[]; ranked: { index: number; place: number; lostTo?: number; on?: string; why: string }[]; criteria: object[] };
