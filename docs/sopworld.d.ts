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
export interface RetainedRevision { readonly owner: string; readonly revision: string; readonly definition: unknown }
export interface Snapshot { format: 'sopworld'; version: number; log: object[]; retained?: readonly RetainedRevision[]; /** with toJSON({ since }): the base the log continues */ base?: { length: number; last: string | null }; /** with toJSON({ timeline: true }) */ timeline?: { marks: { label?: string; seq: number; retained?: readonly RetainedRevision[]; /** a position in log */ at?: number; log?: object[]; whole?: boolean }[]; redo: object[][] } }
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
export interface ChangeOptions extends Budgeted { dry?: boolean; strict?: boolean; /** instance fact admission: no schema declarations, patterns/templates or imports */ factsOnly?: boolean; /** the namespace of the facts told */ ns?: string; /** how sure this statement is (default: told): one tier, or one per key ({ kind: "default" }) */ tier?: string | Record<string, string> }
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

export interface KnowledgeProjectionCatalog {
  world(id: string): Promise<{ schema: string; depends: readonly string[] } | null | undefined>;
  readText(path: string): Promise<string>;
  wireSource(type: string, selection: { keys: string[] }): Promise<string>;
}
export class World {
  /** Compile request SOP against this world and return a SOP circuit or a reason. */
  compileRequest(sop: string): string;
  compileRequest(sop: string, options: { catalog: KnowledgeProjectionCatalog }): Promise<string>;
  compileToolInput(sop: string): string;
  constructor(options?: WorldOptions);
  wires: Map<string, Wire>;
  /** a token for the content: kept by forks being born and by statements that add nothing; new after any change */
  readonly version: number;
  options: WorldOptions;
  fns: Record<string, Fn>;
  /** the matrix wires by id */
  matrix: Map<string, Wire>;
  /** what the matrix says about a type: parent, lineage, closed, keys with all their attributes */
  semanticLinks(): { ok: boolean; links: Array<{ id: string; key: string; value: string; target: string }>; violations: Array<{ kind: string; id: string; key: string; why: string }> };
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
  rewind(mark: Mark, options?: { only?: string | { type?: string; prefix?: string }; budget?: { steps?: number; ms?: number } }): { violations?: Violation[]; ok: boolean; removed: string[]; added: string[]; changed: Difference['changed'] };
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
  retainRevision(owner: string, revision: string, definition: unknown, options?: { dry?: boolean; budget?: { steps?: number; ms?: number } }): { ok: boolean; created: boolean; retained?: RetainedRevision; violations: Violation[] };
  retainedRevision(owner: string, revision: string): RetainedRevision | null;
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
export function valueText(value: unknown): string;
export function quote(text: string): string;
export function induce(examples: { when: string | Wire[]; then?: string | Wire[] }[], options?: { name?: string; kind?: 'rule' | 'deny'; why?: string; tolerant?: boolean; distinct?: boolean; negatives?: { when: string | Wire[] }[]; budget?: Budget }): { text: string | null; budget?: BudgetViolation; skipped: { index: number; why: string }[]; calcs: object[]; tests: object[]; coversNegative: number[]; variables: number; examples: number };
export function adopt(world: World, explanation: Explanation): { ok: boolean; results: Result[] };
export function induceRule(examples: { when: string | Wire[]; then: string | Wire[] }[], options?: { name?: string }): string;
export function induceSlots(wires: string | Wire[], options?: { enumMax?: number; prefix?: string }): string;
export function abduce(world: World, goal: string | Wire[], options?: { maxDepth?: number; max?: number; maxAssumptions?: number; maxCandidates?: number }): Explanation[];
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
export function actReply(world: World, request: { action: string; args?: Record<string, unknown> }, result: object, options?: { templates?: Record<string, string> }): string;

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
export const TURN_STAGES: { name: string; after?: string; per?: string; on_empty?: string; when?: string; providers: string[] }[];
export function turnFlow(world: World, readings: object[], options?: { providers?: Record<string, (ctx: any) => unknown>; reply?: (world: World, request: object, result: object) => string; confirmed?: boolean; stages?: { name: string; after?: string; per?: string; on_empty?: string; when?: string; providers: string[] }[]; load?: (need: unknown, world: World) => void }): ReturnType<typeof turn> & { trace: { stage: string; provider?: string; yielded?: unknown; empty?: string; skipped?: string }[]; stage?: string };

/** a grammar world's lexicon (g.word), rules (g.rule, with ? * + expanded) and coordinating words (g.coord) */
export interface GrammarProduction { id: string; attrs: Record<string, string[]> }
export interface GrammarLexeme { cat: string; lemma?: string; feat?: Record<string, unknown>; origin?: string }
export interface GrammarOptions { types?: { rule?: string; word?: string | null; coord?: string | null }; classes?: Record<string, string>; lexicon?: Record<string, GrammarLexeme | GrammarLexeme[]>; digits?: string; productions?: GrammarProduction[] }
export function grammarOf(world: World, options?: GrammarOptions): { lex: Map<string, { cat: string; lemma: string; feat: Record<string, unknown>; origin?: string }[]>; rules: Map<string, string[][]>; coord: Set<string>; multi: string[]; digits?: string };
export interface RequestGraphToken { kind: 'literal' | 'string' | 'ref'; value: string }
export interface RequestGraphNode { id: string; type: string; attrs: Record<string, RequestGraphToken[]> }
export function serializeRequestGraph(input: string | { request: string; nodes: RequestGraphNode[] }, options?: { budget?: number }): { ok: true; request: string; wires: string; world: World; issues: [] } | { ok: false; issues: { reason: string }[] };
export interface GrammarRequestCandidate { request: string; wires: string; evidence: { unit: 'unicode-scalar'; command: [number, number][]; nodes: { id: string; source: string; ranges: [number, number][] }[] }; origins: { origin: string; binding: string; wire: string; type: string; metadata: Record<string, string[]>; ranges: [number, number][] }[]; coverage: { complete: true; terminal: string | null } }
export function readGrammarRequests(world: World, text: string, options?: { compiled?: ReturnType<typeof compileGrammarOverlay>; profile?: { rules: Record<string, CompositionJSON>; guards: Record<string, { left: CompositionJSON; right: CompositionJSON }[]> }; start?: string; terminalPunctuation?: readonly string[]; max?: number; budget?: number; sourceBudget?: number; compositionBudget?: number; bridgeBudget?: number }): { candidates: GrammarRequestCandidate[]; failures: { reason: string; index?: number; [key: string]: unknown }[]; coverage: { complete: boolean } };
export type GrammarOverlayTypes = Record<'binding' | 'feature' | 'filter' | 'rule' | 'map' | 'node' | 'step' | 'agreement', string>;
export function compileGrammarOverlay(world: World, options?: { types?: GrammarOverlayTypes; budget?: number; maxDepth?: number }): { ok: false; issues: { reason: string; id?: string }[] } | { ok: true; source: { world: World; stamp: number }; grammar: GrammarOptions; composition: { rules: Record<string, CompositionJSON>; lexical: Record<string, CompositionJSON>; guards: Record<string, { left: CompositionJSON; right: CompositionJSON }[]> }; provenance: Record<string, { binding: string; wire: string; type: string; metadata: Record<string, string[]> }>; issues: [] };
/** Declarative parse-tree composition; candidates are proposals, not semantic validation. */
export type CompositionJSON = null | boolean | number | string | CompositionJSON[] | { [key: string]: CompositionJSON };
/** Apply existing composition templates directly to indexed semantic JSON contexts. */
export function projectTemplates(jobs: { template: string; context: CompositionJSON }[], options?: { templates?: Record<string, CompositionJSON>; guards?: Record<string, { left: CompositionJSON; right: CompositionJSON }[]>; budget?: number; maxDepth?: number }): { candidates: { index: number; value: CompositionJSON }[]; failures: { index?: number; reason: string }[]; truncated?: true };
export function composeParses(parses: { tree: object }[] & { truncated?: boolean }, options?: { rules?: Record<string, CompositionJSON>; lexical?: Record<string, CompositionJSON>; guards?: Record<string, { left: CompositionJSON; right: CompositionJSON }[]>; budget?: number; maxDepth?: number }): { candidates: { index: number; value: CompositionJSON }[]; failures: { index?: number; reason: string }[]; truncated?: true };
/** text parsed with a grammar world: every complete parse of `start`, best first */
export function parseText(world: World, text: string, options?: { start?: string; max?: number; budget?: number; alternations?: boolean | object; sourceSpans?: boolean; sourceBudget?: number; reportLimits?: boolean } & GrammarOptions): { tree: object & { sourceRanges?: [number, number][] }; size: number }[] & { tokens: string[]; limits?: { pruned: boolean; reasons: string[] }; unknown?: { word: string; at: number }[]; truncated?: true; steps?: number; applied?: string[]; normalised?: string; mode?: string; source?: { text: string; unit: 'unicode-scalar' } & ({ status: 'exact'; tokenRanges: [number, number][][] } | { status: 'unavailable'; tokenRanges: null; reason: 'unaligned-alternation' | 'invalid-budget' | 'invalid-unicode' | 'unsupported-case-mapping' | 'token-alignment' | 'budget' }) };
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
export function arbitrate(world: World, request: { action: string; args?: Record<string, unknown> }, options?: { pass?: 'exact' | 'spelling' | 'view'; resolves?: (world: string, words: string[]) => boolean; words?: string[] | string; coverage?: (world: string, words: unknown) => number; active?: string; criteria?: { name: string; measure: string; dir: string }[] }): { verdicts: { world: string; verdict: 'own' | 'decline' | 'refuse'; why: string }[]; owner: string | null; ambiguous?: string[]; pass: string };
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
export function dictionary(options: { read: ((prefix: string) => string | null) | ((prefix: string) => string | null)[]; prefix?: number; fold?: (s: string) => string }): Dictionary;
export function realise(m: Morph, template: string, roles: Record<string, string>, options?: { dictionary?: Dictionary; base?: Record<string, string>; agree?: string[]; sentence?: boolean }): string | null;
export function templateFor(m: Morph, act: string, shape?: string | null): string | null;
/** std.motion: the change points of states over time, from rules and events (pure, seeded). */
/** Play a plan through the host's clock; returns cancel(). */
export function motionRun(plan: { t: number; key: string; value: string }[], apply: (key: string, value: string, t: number) => void, clock?: { setTimeout(f: () => void, t: number): unknown; clearTimeout(h: unknown): void }): () => void;
/** std.plan: a fact store over published worlds (facts merged by identity, lazy per type). */
export interface FactStore { facts(type: string): { type: string; attrs: Record<string, string[]>; n: number }[]; index(type: string, key: string): Map<string, object[]>; kindsOf(world: string): Record<string, string> | null }
export function factStore(worlds: { id: string; schemaText: string; shards: { text: string }[] }[]): FactStore;
/** A working copy of a live world for planning. */
export class PlanLive { constructor(options?: { world?: string | null; things?: { id: string; kind: string; attrs?: Record<string, unknown>; members?: string[] }[]; history?: object[]; kinds?: Record<string, string> | null; store?: FactStore | null }); world: string | null; things: Map<string, object>; history: object[] }
export interface PlanResult { method?: string; methods: string[]; acts: object[]; lines: string[]; explain: string[]; requests: { action: string; args: Record<string, unknown> }[]; skipped: string[]; effects: object[]; asks: string[]; refused?: boolean; tried?: { method: string; why: string }[]; truncated?: boolean }
export function planner(store: FactStore, options?: { chain?: { type: string; keys: string[] }[]; prefix?: string; roles?: string; about?: string[]; seed?: number | null; chooseLimit?: number }): { methods: object[]; isA(a: string, b: string): boolean; plan(goal: { act: string; roles?: Record<string, unknown> }, live?: PlanLive, options?: { fixed?: Record<string, unknown> }): PlanResult };
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
export interface SchemaDescription { kinds: { type: string; words?: string[]; keys?: { key: string; value?: string | null; many?: boolean; enum?: string[]; join?: { type: string; by?: string | null } | null; text?: string; words?: string[] }[] }[]; words?: { text: string; means: string }[] }
export interface TypedWorld { world: World; slots: Map<string, { expects: 'thing' | 'value' | 'number' | 'name' | 'title' | 'text'; of?: string; by?: string; values?: string[] }>; lexicon: Map<string, object[]>; counts: { kinds: number; keys: number; things: number; values: number; words: number } }
export function schemaOf(world: World): SchemaDescription;
export function typedWorldFor(schema: World | SchemaDescription, knowledge?: World | null, options?: { max?: number; text?: Record<string, 'name' | 'title' | 'text'>; words?: { text: string; means: string }[]; things?: { id: string; label?: string; kind: string; attrs?: Record<string, unknown> }[] }): TypedWorld;
export function fitsSlot(typed: TypedWorld, type: string, key: string, text: string, options?: { skip?: string[]; self?: string[]; lemma?: (word: string) => string[] }): { ok: boolean; code?: 'empty' | 'fragment' | 'type'; as?: string; id?: string; value?: unknown; why?: string };
export function freeTextType(key: string, given?: string): string;
export interface ReaderCandidate { frame: object; unread: string[]; repaired?: { from: string; to: string; confident?: boolean }[]; cost?: number; specificity?: number }
export type Reader = (world: World, text: string, options?: object) => ReaderCandidate[];
export const READERS: { types: Reader; frames: Reader; canonical: Reader };
export function moodOf(world: World | null, text: string, options?: { lang?: string; acts?: (word: string) => boolean; things?: (word: string) => boolean; detail?: boolean }): 'question' | 'imperative' | 'statement' | 'fragment' | 'wish' | { mood: string; by: string };
export function confidentTypo(from: string, to: string): boolean;
export function readText(world: World, text: string, options?: { reader?: 'types' | 'frames' | 'canonical' | Reader; lang?: string; actWords?: string[]; [option: string]: unknown }): { candidates: ReaderCandidate[]; best: object | null; unread: string[]; repaired: { from: string; to: string; confident?: boolean }[]; named?: { from: string; to: string; confident?: boolean }[]; mood: string; complete: boolean; why?: string };
export function senseOf(world: World, id: string | null | undefined): { act?: string; en?: string; pos?: string };
export function readFrames(world: World, text: string, options?: { lang?: string; morph?: object; dictionary?: object; senses?: (id: string) => { act?: string; acts?: string[]; en?: string; pos?: string }; max?: number; lexicons?: Record<string, string[]>; needs?: (name: string | undefined) => boolean; open?: boolean }): { best: { frame: string; en: string; act: string; mode: string | null; roles: Record<string, { text?: string; words?: object[]; en?: string; value?: number | string; rel?: string; item?: string; fixed?: boolean; open?: string }>; args: Record<string, unknown>; verb?: object; score: number } | null; frames: object[]; tokens: string[] };
export function listMeant(world: World, options?: { type?: string; name?: string; sort?: string }): Wire | null;
export function listSums(world: World, list: string | Wire, options?: { itemType?: string; link?: string; priceOf?: (entry: Wire) => number | undefined; all?: boolean; tendered?: number }): { list?: string; entries?: { id: string; text: string; quantity: number; price?: number; amount?: number }[]; total?: number | null; missing?: string[]; currency?: string | null; budget?: number; left?: number; affordable?: boolean; tendered?: number; change?: number; short?: number; why?: string };
export function readStatement(world: World, text: string, options?: { type?: string; self?: string[]; copula?: string[]; have?: string[]; skip?: string[]; numbers?: Record<string, number>; number?: string; lang?: string }): { mood: string; facts: { key: string; value?: unknown; values?: string[] }[]; unread: string[]; why?: string };
export function tellStatement(world: World, text: string, options?: { type?: string; subject?: string; tier?: string; [option: string]: unknown }): { mood: string; facts: { key: string; value?: unknown; values?: string[] }[]; unread: string[]; why?: string; told?: object };
export function describeThing(world: World, id: string): { key: string; values: string[] }[];
export function readAboutSelf(world: World, text: string, options?: { subject?: string; self?: string[]; [option: string]: unknown }): ReturnType<typeof readByTypes>;
export function cycleOf(world: World, member: string, options?: { type?: string; cycle?: string }): { cycle: string; members: string[]; at: number } | null;
export function cycleAdd(world: World, member: string, steps: number, options?: { type?: string; cycle?: string }): string | null;
export function cycleDiff(world: World, from: string, to: string, options?: { type?: string; cycle?: string }): number | null;
export function statedDay(world: World, text: string, options?: { cycle?: string; today?: string[]; type?: string }): string | null;
export function readClock(text: string, options?: { words?: object }): number | null;
export function expandRecurrence(rule: string | { freq: string; interval?: number; byday?: string[]; bymonthday?: number[]; until?: string; count?: number }, start: string, options?: { from?: string; to?: string; max?: number }): string[];
export function writeClock(minutes: number, options?: { ampm?: boolean; words?: object }): string;
export function contrastOf(world: World, kind: string, options?: { type?: string; up?: string[]; skip?: Set<string>; max?: number }): { kind?: string; type?: string; parents?: string[]; siblings?: string[]; contrasts?: { key: string; value: string; share: number; others: Record<string, number> }[]; why?: string };
export function outlineOf(parts: { x: number; y: number; w?: number; h?: number }[]): { x: number; y: number }[];
export interface WorldSet { worlds: Map<string, { name: string; kinds: string[]; imports: string[]; world: World }>; schema: World; language: World | null; typed: TypedWorld; bindings: Record<string, object>; verbs: Record<string, string>; verbActs: Record<string, string[]>; session: Set<string>; steps: { world: string }[]; redo: { world: string }[] }
export function loadWorldSet(loader: (name: string) => string | null, options?: { names?: string[]; language?: World | null; knowledge?: World | null; bindings?: Record<string, object>; verbs?: Record<string, string>; session?: string[] }): WorldSet;
export function readTurn(set: WorldSet, text: string, context?: { lang?: string; active?: string; criteria?: object[]; morph?: object; dictionary?: object; reply?: (world: World, request: object, result: object) => string; replies?: string; replyDictionary?: object; replyNames?: Record<string, string>; wordOf?: (type: string, lang: string) => string | undefined; readers?: ((set: WorldSet, text: string, context: object) => { request?: { action: string; args: Record<string, unknown>; host?: boolean }; unread?: string[]; literal?: number }[])[]; frames?: boolean; hostActs?: string[]; onHost?: (request: object, set: WorldSet) => { reply?: string; status?: string; effects?: object[] }; budget?: { ms?: number }; rewrites?: Rewrite[] | ((clause: string, info: { set: WorldSet; index: number; clauses: string[] }) => Rewrite[]); previous?: string[]; stop?: string[]; intentCriteria?: object[]; intentWorld?: World; whole?: string[]; dry?: boolean }): { status: 'done' | 'ask' | 'not-understood' | 'refused' | string; reading: { frame: string | null; act?: string; roles?: object; unread: string[]; mood: string; complete: boolean }; request?: { action: string; args: Record<string, unknown> }; owner?: string; reply: string; changed?: { world: string; type: string; id?: string }[]; asks?: object[]; effects?: object[]; clauses?: string[]; results?: object[]; rewrites?: { said: string; as: string; via: string; changed: boolean; why: string; order: RewriteChoice[] }[]; plans?: object[] };
/** A host's rewrite of a clause: another reading of what was said. */
export interface Rewrite { text: string; cost?: number; explains?: string[]; via?: string }
/** A rewrite measured for std.decide kind intent. */
export interface RewriteChoice { text: string; via: string; cost: number; issues: number; uncovered: number; unfilled: number; absent: number; previous: number; reading?: object }
/** Choose among a clause and its rewrites by std.decide kind intent; a rewrite wins only when it reads strictly better. */
export function chooseRewrite(text: string, rewrites: Rewrite[], options: { read: (text: string) => { issues: number; unfilled?: number; absent?: number }; stop?: string[] | Set<string>; previous?: string[]; world?: World | null; criteria?: object[] }): { chosen: RewriteChoice; self: RewriteChoice; changed: boolean; order: RewriteChoice[]; why: string };
/** One constraint of a w.request request. */
export interface RequestConstraint { on: 'kind' | 'count' | 'size' | 'extent' | 'attribute' | 'place' | 'manner' | 'layout' | 'with' | 'about' | 'length'; want: 'yes' | 'no' | 'not_all'; value?: string | number | null; of?: string; attribute?: string; relation?: string; number?: number; min?: number; max?: number; bound?: 'exact' | 'min' | 'max' | 'range' | 'about'; exclusive?: boolean; amount?: string; step?: 'up' | 'down'; unit?: string; plural?: boolean; all?: boolean; definite?: boolean; indefinite?: boolean; world?: boolean; words: string; origin?: 'said' | 'default' | 'reaction'; cue?: string }
/** A live w.request: what one message asked. `facts` (not enumerable) is the host's flat shape. */
export interface Request { act: string | null; mode?: string | null; target: string | null; refers: 'kind' | 'thing' | 'last' | 'all' | 'named' | null; refersAt?: number; named?: { ids: string[]; words: string; at: number; prep?: string }[]; mentions?: { kind: string; words: string; at: number; unit?: boolean; world?: boolean; none?: boolean }[]; question?: boolean; statement?: boolean; actFrom?: string; continues?: unknown; text: string; constraints: RequestConstraint[]; reactions: { value: string; step?: string; cue: string; words: string }[]; unread: string[]; unreadAt?: { text: string; n: number }[]; used?: string[]; revises?: string | null; readonly facts: { key: string; value?: unknown; neg?: boolean; all?: boolean; n?: number; min?: number; max?: number; unit?: string; step?: string; of?: string; attribute?: string }[] }
/** The state of a dialogue a revision reads. */
export interface RequestDialogue { last: Request | null; result?: { count?: number; kinds?: Record<string, number>; things?: string[]; layout?: string | null } | null; previous?: Request | null; seed?: number; previousSeed?: number; previousVary?: boolean; revisions?: unknown; lastRun?: { made: string[] } | null; corrections?: { on: string; step?: string; value?: unknown }[]; lastPlan?: RequestPlan | null }
/** A plan of a request: the acts with their roles filled, what was assumed, what is not honoured. */
export interface RequestPlan { ok: boolean; act: string | null; target: string | null; roles: Record<string, unknown>; steps: { action: string; args: Record<string, unknown>; item?: boolean; link?: boolean }[]; assumed: { key: string; value: unknown; from: string; because?: string }[]; structure?: "cut" | "fill"; reference?: boolean; sense?: 'change'; whole?: 'world'; asOne?: string; ask?: boolean; replies?: { reply: string; roles: Record<string, unknown> }[]; notHonoured: { on: string; words: string; why: string; code: string; value?: unknown }[]; seed: number; sources: string[]; bounds?: { count: [number, number] | null; not: string[] }; rejected?: { place: string | null; label: string; why: string[]; hard: boolean }[]; cannot?: { why: string; words?: string }[]; reasoning?: { candidates: number; depth: number; ticks: number; exhausted: boolean; induced: { of: string; n: number; pattern: Record<string, unknown> }[]; soft: string[]; derived: number; chosen?: string } | null }
/** The order in which a gap is filled. */
export const REQUEST_SOURCES: readonly string[];
/** The constraint keys of w.request. */
export const REQUEST_KEYS: readonly string[];
/** The catalog types whose names are values of an attribute. */
export const VALUE_TYPES: Readonly<Record<string, string[]>>;
/** The sources of an assumption the reply says by default (all but a tool parameter's declared default). */
export const ASSUMED_SAY: readonly string[];
/** At most this many assumptions are said in one reply (sayRequest option `sayMax`). */
export const ASSUMED_MAX: number;
/** Read one message into a live w.request from the language world's cues and the world's kinds, slots and words. */
export function readRequest(world: World, text: string, ctx?: { language?: World | null; lang?: string; catalog?: unknown; dialogue?: { last?: Request | null }; state?: World | null; kinds?: string[]; values?: Record<string, { attribute: string; value: string }[]>; valueTypes?: Record<string, string[]>; verbs?: Record<string, string>; spell?: boolean | SpellOptions }): Request & { spell?: { repairs: SpellRepair[]; asks: SpellAsk[] } };
/** The request as w.request wires. */
export function requestWires(request: Request, options?: { id?: string }): string;
/** A turn against the dialogue: a new request, or the last one revised by w.dialogue.revision facts. */
export function reviseRequest(dialogue: RequestDialogue | null, request: Request, opts?: { revisions?: unknown; catalog?: unknown; live?: World | null }): { sort: 'request' | 'reaction'; reaction: string | null; does: { does: string; on?: string; direction?: string; replaces?: boolean; reply?: string }[]; request: Request | null; replace: boolean; seed: number; vary?: boolean; reply?: string | null; undo?: boolean };
/** The things of a world's state (wires of a std.schema.thing type), never its declaration or knowledge rows. */
export function stateIds(live: World, view?: FactView | null, ids?: string[] | null): string[];
/** What a live world declares it can do. */
export function capabilitiesOf(live: World, opts?: { catalog?: unknown[] }): { honours: { act: string; on: Set<string>; of: string[] }[]; kinds: Map<string, Set<string>>; joined: Map<string, { acts: Set<string>; world?: string; from: string; standIn?: string }> };
export function declares(live: World, act: string, kind: string, opts?: { catalog?: unknown[] }): boolean;
export function honoursKind(h: { of: string[] }, kind: string, opts?: { live?: World; catalog?: unknown[] }): boolean;
/** Plan a request from the world's declared capabilities, filling every gap from the sources in order. */
export function planRequest(live: World, request: Request, opts?: { catalog?: unknown; dialogue?: RequestDialogue | Partial<RequestDialogue> | null; sources?: readonly string[]; seed?: number; vary?: boolean; replace?: string[]; ticks?: number; candidates?: number; reason?: boolean }): RequestPlan;
/** Run a plan's steps through the world's own act; the things of `replace` are removed first. */
export function runWorldPlan(live: World, plan: RequestPlan, options?: { replace?: string[]; catalog?: unknown }): WorldRun;
export interface WorldRun { ok: boolean; made: string[]; failed?: { step: object; why: string }; result: { things: string[]; items: string[]; count: number; kinds: Record<string, number>; whole: string | null; layout: string | null; links: number } }
/** A thing of a tool's view. */
export interface ViewThing { id: string; kind: string | undefined; attrs: Record<string, unknown> }
/** What changed between two views. */
export interface StateDiff { added: ViewThing[]; removed: ViewThing[]; changed: { id: string; kind: string | undefined; key: string; from: unknown; to: unknown; was?: string; by?: 'call'; as?: string; unsaid?: boolean }[]; redone?: { id: string; was: string; kind: string | undefined; keys: string[] }[]; same?: boolean }
/** A tool parameter as declared by std.tool.param. */
export interface ToolParam { op?: string; name?: string; kind?: string; default?: unknown; names?: Map<string, string>; type?: string; accepts?: string[]; scale?: string; by?: string; order?: string; min?: number; max?: number; required?: boolean }
/** The std.tool.* declarations of a world. */
export interface ToolBindings { ops: Map<string, { name: string; world?: string; params: string[]; effects: string[]; doc?: string }>; params: Map<string, Map<string, ToolParam>>; binds: { i: number; id?: string; act: string; of: string[]; op: string; args: { name: string; sources: string[] }[]; needs: { name: string; args: string[]; kinds?: string[] }[]; makes: string[]; removes: string[]; changes: string[] }[]; customs: Map<string, { name: string; kind: string; in: string[]; out?: string; fails?: string }>; problems: { bind: number; why: string; code: string }[]; catalog: unknown[] }
/** A timeline of plan runs: one entry per plan (a revision replaces the last). */
export interface ToolTimeline { done: object[]; undone: object[] }
/** The tool's operations by op name, its custom constraints and searches, its view and (optionally) snapshot / restore. */
export type ToolPrimitives = Record<string, ((args: Record<string, unknown>, view?: ViewThing[] | Record<string, unknown>[]) => unknown)> & { view?: () => unknown; snapshot?: () => unknown; restore?: (s: unknown) => void };
/** The result of a plan run through a tool binding. */
export interface ToolRun { ok: boolean; diff: StateDiff; same?: boolean; replaced: string[]; calls: { op: string; args: Record<string, unknown>; steps: number[] }[]; assumed: { key: string; value: unknown; from: string; was?: unknown; by?: string; because?: string; op?: string }[]; translated: { key: string; was: unknown; value: unknown; by: string }[]; failed?: { code: string; reply: string | null; roles: Record<string, unknown>; because?: object[]; op?: string; detail?: string }; result: { things: string[]; items: string[]; count: number; kinds: Record<string, number>; whole: string | null; layout: string | null; links: number; present: number }; step: string; question?: string; undo?: boolean; redo?: boolean; entry?: object }
/** Run a plan: through a world's own act (a World first), or through its tool binding (primitives, view, timeline). */
export function runPlan(live: World, plan: RequestPlan, options?: { replace?: string[]; /** the sources whose kinds the world joins (std.schema.kinds): the acts find them there, as capabilitiesOf does */ catalog?: unknown }): WorldRun;
export function runPlan(plan: RequestPlan | { act: 'undo' | 'redo' } | { act?: string; question: string; ok?: boolean; steps?: unknown[] }, bindings: ToolBindings | null, primitives: ToolPrimitives, opts?: { view?: unknown; timeline?: ToolTimeline | null; replace?: boolean; request?: Request | null; live?: World | null; catalog?: unknown }): ToolRun;
/** The source forms of a binding argument. */
export const TOOL_ARG_SOURCES: readonly string[];
/** The questions the door answers with facts of the live world. */
export const WORLD_QUESTIONS: readonly string[];
/** Up to this many things in the view, askWorld's state answer names each thing's said attributes. */
export const STATE_FEW: number;
/** The std.tool.* declarations of a world, checked. */
export function toolBindings(live: World, opts?: { catalog?: unknown }): ToolBindings;
/** A new timeline. */
export function toolTimeline(): ToolTimeline;
/** The acts a tool world offers (honoured and bound). */
export function toolCapabilities(live: World, bindings?: ToolBindings | null, opts?: { catalog?: unknown[] }): { act: string; kinds: string[]; on: string[]; op: string }[];
/** A value as a parameter takes it, translated by knowledge (range, kind lineage, ordered scale). */
export function nearestAccepted(value: unknown, param: ToolParam | undefined, opts?: { live?: World | null; catalog?: unknown; look?: (() => Map<string, ViewThing>) | null; toward?: { from: string; dir: "up" | "down" } | null }): { value?: unknown; translated?: boolean; was?: unknown; by?: string; refused?: boolean; values?: string[] };
/** A tool's state as a Map of things. */
export function readView(view: unknown): Map<string, ViewThing>;
/** What changed between two views. */
export function stateDiff(before: unknown, after: unknown, opts?: { match?: boolean; keys?: Iterable<string> | string | null }): StateDiff;
/** The tool's state told into a fork of the declarations. */
export function mirrorState(live: World, view: unknown, options?: { catalog?: unknown }): { world: World; skipped: string[] };
/** Facts of the live world for a question (capabilities, state), as reply facts. */
export function askWorld(question: string, request: Request | null, opts?: { live?: World | null; bindings?: ToolBindings | null; view?: unknown; catalog?: unknown; /** a state answer names the said attributes up to this many things (default STATE_FEW) */ few?: number; /** attribute keys named in a state answer (default VALUE_TYPES) */ valueTypes?: Record<string, string[]> }): { facts: { reply: string; fallback?: string[]; roles: Record<string, unknown> }[]; capabilities?: { act: string; kinds: string[]; on: string[]; op: string }[] };
/** A session over a tool world: read, revise, plan, run, say, with no code per world. */
export function toolSession(live: World, primitives: ToolPrimitives, opts?: { language?: World | null; catalog?: unknown; revisions?: unknown; lang?: string; seed?: number; mirror?: boolean; bindings?: ToolBindings | null }): { say(text: string): { request: Request; revision: object | null; plan: RequestPlan | null; run: ToolRun | null; reply: { facts: object[]; text: string; missing: string[] } }; timeline: ToolTimeline; dialogue: RequestDialogue; bindings: ToolBindings };
/** A kind and its parents (the world's lineage, the catalog's k.kinds.parent; with `drawn`, what it is drawn as first). */
export function kindLineage(kind: string, opts?: { live?: World | null; catalog?: unknown; drawn?: boolean }): string[];
export function joinedKinds(live: World, catalog?: unknown): Map<string, { acts: Set<string>; world?: string; from: string; as?: string; standIn?: string }>;
/** What a thing can be (0.162.0): the kinds the world makes whose lineage holds the kind named, or, for a word for the world itself (`world: true`), one of its declared kinds. Plain names. */
export function canBe(live: World, predicate: { of: string; world?: boolean }, catalog?: unknown): string[];
/** The value a conditional expectation (k.expect.when) gives a key of a thing of a kind. */
export function expectedValue(kind: string, key: string, known?: Record<string, unknown>, opts?: { live?: World | null; catalog?: unknown; sources?: string[]; lineage?: string[] | null }): { value: unknown; min?: number; max?: number; typical?: number; from: string; because: string[]; of?: string } | null;
/** The row types of conditional expectations (k.expect.value, k.expect.when). */
export const EXPECT_TYPES: readonly string[];
/** The first n items of a structure, kept connected (breadth first along the links). */
export function cutToCount<T>(items: T[], links: { a: T; b: T }[], n: number): { keep: T[]; drop: T[]; links: { a: T; b: T }[] };
/** The kinds to add to reach n, in the proportions there are. */
export function fillToCount(kinds: string[], n: number, opts?: { pool?: string[] | null; notAll?: boolean }): string[];
/** The kinds with a second kind of the pool when all are one. */
export function notAllOneKind(kinds: string[], pool?: string[]): string[];
/** The reply of a request as reply facts and their text. */
export function sayRequest(request: Request, outcome?: Partial<RequestPlan> & { run?: { result: object } | ToolRun | null; revised?: boolean; reply?: string | null; capabilities?: { act: string; kinds: string[]; on: string[] }[]; answer?: { reply: string; roles: Record<string, unknown> }[] }, opts?: string | { language?: World | null; lang?: string; dictionary?: unknown; say?: string[] }): { facts: { reply: string; roles: Record<string, unknown>; from?: string; code?: string }[]; text: string; missing: string[] };
/** The world as facts: (thing, attribute, value) and (thing, relation, thing), indexed, kept per world version. */
export interface FactView { version: number; depth: number; readonly size: number; thing(id: string): { id: string; type: string; kinds: string[]; attrs: Map<string, unknown[]>; rels: { relation: string; to: string | null; value?: unknown; joins?: { type: string; by: string } }[] } | undefined; ids(): string[]; ofKind(kind: string): string[]; values(id: string, key: string): unknown[]; related(id: string, relation?: string): (string | null)[]; inbound(id: string, relation?: string): string[]; attributes(id?: string): { thing: string; attribute: string; value: unknown }[]; relations(id?: string): { thing: string; relation: string; to: string | null }[] }
/** The bounds of the reasoning cycle of planRequest. */
export const REASONING: Readonly<{ candidates: number; depth: number; ticks: number; induceMin: number; correctionsMin: number; flatten: number; look: number }>;
/** The catalog types read as facts of kinds. */
export const KIND_FACTS: readonly { type: string; by: string; key?: string; value?: string; parent?: string }[];
/** The constraints deduction checks on a simulated state. */
export const REASON_RULES: readonly { name: string; hard?: boolean; soft?: number; step?: number; needs?: readonly string[]; via?: readonly string[]; holds?: readonly string[] }[];
/** One flat view of any world as facts, built from the last view by the changes since. */
export function factsOf(world: World): FactView;
/** What the catalog says of each kind, as (kind, attribute, value). */
export function kindFactsOf(catalog: World | World[] | null, types?: readonly { type: string; by: string; key?: string; value?: string; parent?: string }[]): Map<string, { attribute: string; value: string; from: string }[]>;
/** Forward chaining to depth 2 and the constraints of REASON_RULES on the things given. */
export function deduceState(view: FactView | { thing(id: string): unknown; related(id: string, relation?: string): unknown[] }, ids: string[], opts?: { rules?: readonly object[]; catalog?: unknown; kindFacts?: Map<string, { attribute: string; value: string }[]>; depth?: number; budget?: { ticks: number; used: number }; bounds?: { count?: [number, number] | null; not?: string[]; items?: string[] }; required?: (thing: object) => string[]; placeable?: (id: string) => boolean }): { hard: { rule: string; thing: string | null; why: string }[]; soft: { rule: string; thing: string | null; why: string; cost: number }[]; derived: { thing: string; attribute: string; value: string; depth: number }[]; cost: number; ticks: number; exhausted: boolean };
/** Anti-unification (one step) of the things of a type: the attribute values all of them share. */
export function induceStyle(view: FactView, types: string | string[], options?: { except?: Set<string>; min?: number; keys?: ((type: string) => string[]) | null }): { of: string; n: number; pattern: Record<string, unknown> } | null;
/** Anti-unification of a session's last corrections. */
export function induceCorrections(list: { on: string; step?: string; value?: unknown }[] | null | undefined, options?: { min?: number }): { on: string; step?: string; value?: unknown; n: number } | null;
export function turnScope(set: WorldSet, owner: string): (change: { world: string; type: string }) => boolean;
export interface Pending { key: string; ask?: string; thing?: string; type?: string; value?: string; confirm?: { action: string; args: Record<string, unknown> }; text: string }
export interface Session { set: WorldSet; context: object; pending: Pending | null; turns: object[]; say(text: string): ReturnType<typeof readTurn> & { pending: Pending | null; facts?: object[] }; snapshot(): object; restore(data: object): Session }
export function openSession(set: WorldSet, context?: { lang?: string; replies?: string; replyDictionary?: object; [option: string]: unknown }): Session;
export function referentOf(set: WorldSet, words: string, options?: { lang?: string }): { thing: Wire; type: string } | null;
export const KIT_REPLIES: Record<string, { roles: string[]; en: string; many?: string }>;
export function snapshotSet(set: WorldSet): { format: 'sopworld-set'; worlds: Record<string, object>; steps: { world: string }[]; redo: { world: string }[]; focus: string | null };
export function restoreSet(set: WorldSet, data: ReturnType<typeof snapshotSet>): WorldSet;
export function whyTurn(set: WorldSet, result: object, context?: { lang?: string; replies?: string; replyDictionary?: object }): { said: string; facts: { thing: string; type: string; key: string; value: string; tier: string; how: string }[] };
export function cutPoints(world: World, options?: { lang?: string }): { joiners: Set<string>; wh: Set<string> };
export function clauses(world: World, text: string, options: { lang?: string; read: (text: string) => { literal?: number; captured?: number } | null; whole?: string[] }): { text: string; reading: object }[] | null;
export function replyFrom(language: World | null, key: string, roles: Record<string, unknown>, options?: { lang?: string; type?: string; dictionary?: object; count?: string }): string | null;
export function countClass(language: World | null, n: number | string, options?: { lang?: string; type?: string }): string;
export function arrangementOf(world: World, text: string, options?: { lang?: string }): { text: string; layout: string | null; relation: string | null; direction: string | null; reverse: boolean; diagramLayout: string | null; as: string | null } | null;
export interface DiagramResult { kind: string; form: string; layout: string; topic: string; fill: string; text: string; nodes: { id: string; label: string; role: string; shape: string | null; x: number; y: number }[]; edges: { from: string; to: string }[]; groups: { id: string; label: string; members: string[] }[]; told?: object }
export function composeDiagram(world: World, options: { kind: string; topic: string; seed?: number; max?: number; id?: string; frame?: { x: number; y: number; w: number; h: number }; into?: World; layout?: string }): DiagramResult | { why: string };
export function sampleDiagram(world: World, options?: { seed?: number; kinds?: string[]; max?: number; id?: string; frame?: { x: number; y: number; w: number; h: number }; into?: World }): DiagramResult | { why: string };
export function diagramTopics(world: World, kind: string, options?: { min?: number; max?: number; limit?: number }): { topic: string; nodes: number; fill: string }[];
export function diagramKinds(world: World): { name: string; form: string; layout: string[]; edges: string; roles: string[]; fills: { kind: string; type: string; key: string; gives: string; topic: string | null }[] }[];
export function arrange(nodes: { id: string; w?: number; h?: number }[], layout?: 'row' | 'column' | 'circle' | 'grid' | 'layers' | 'radial' | 'scatter' | 'path', options?: { points?: ({ x: number; y: number } | [number, number])[]; closed?: boolean; edges?: [string, string][]; frame?: { x: number; y: number; w: number; h: number }; gap?: number; direction?: 'right' | 'down'; reverse?: boolean; seed?: number }): Map<string, { x: number; y: number; w: number; h: number }>;
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
export function solveChoices(vars: string[], options: { domain: (v: string, partial: Record<string, unknown>) => unknown[]; ok?: (partial: Record<string, unknown>, v?: string) => boolean; weight?: (v: string, value: unknown, partial: Record<string, unknown>) => number; seed?: number | null; limit?: number }): { values?: Record<string, unknown>; nodes: number; why?: string; deepest?: string | null };
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
/** The related cases of a case (perturbations along axes): up along kinds or keys, down to other members, only the valid ones. */
export function relatedCases(world: World, kase: { frame: object; text?: string; langFrame?: string; roles?: Record<string, string | string[]> }, options?: { variants?: Map<string, { alternation: string; canonical: string[] }>; lang?: string; operators?: { name: string; from: string; to: string }[]; senses?: (word: string) => Wire[]; alternations?: { name: string; from: string; to: string }[]; edges?: Record<string, string>; distance?: number; axes?: string[]; known?: (string | object)[]; read?: object; n?: number; seed?: number }): { frame: object; text?: string; distance: number; axes: string[]; via?: string; valid: boolean; why?: string }[];
/** The ancestors of a thing in the layered graph of abstraction: name -> { level, dim }. */
export function ancestorsOf(world: World, id: string, options?: { depth?: number; edges?: Record<string, string> }): Map<string, { level: number; dim: string }>;
/** The chain of kinds of a thing, nearest first. */
export function kindChain(world: World, id: string, depth?: number): string[][];
/** A fix judged on the case alone and on its valid related cases by distance. */
export function judgeOnRelated(answer: (text: string | undefined, frame: object) => unknown, kase: { frame: object; text?: string }, related: object[]): { case: boolean; byDistance: Record<string, { pass: number; of: number }>; share: number | null };
/** The near words of a word through word senses (k.words.sense): synonyms 1, kinds 2 and more. */
export function nearWords(world: World, word: string, options?: { senses?: (word: string) => Wire[] }): { word: string; cost: number; via: string }[];
/** The canonical form of a text by the language world's alternation rules. */
export function normalise(world: World, text: string, options?: { byRule?: 'order'; classes?: Map<string, Set<string>>; rules?: { name: string; from: string; to: string; mode?: string }[]; type?: string; lemma?: (word: string) => string[]; max?: number }): { text: string; applied: string[]; mode?: string };
/** The alternation rules a world holds. */
export function alternationsOf(world: World, type?: string): { name: string; from: string; to: string; mode?: string }[];
/** Reading rules induced from cases (anti-unification), judged on held-out cases and related cases. */
export function learnRules(world: World, cases: { text: string; frame: object }[], options?: { heldOut?: { text: string; frame: object }[]; related?: (kase: object) => object[]; admit?: number; min?: number }): { text?: string; support?: string[]; train?: { pass: number; of: number }; heldOut?: { pass: number; of: number }; admitted: boolean; why?: string }[];
/** Two world schemas aligned by structure; what one has and the other lacks is offered. */
export function alignWorlds(a: World, b: World, options?: { min?: number }): { map: Record<string, string>; slots: Record<string, Record<string, string>>; score: number; offers: { to: { type: string; key: string }; what: string; value: unknown; from: { type: string; key: string } }[] };
/** A story then a question: quantities held by owners follow the story; the question is read against them. */
export function storyState(text: string, options?: { self?: string[]; one?: string[]; negations?: string[]; more?: string[]; fewer?: string[]; times?: Record<string, number>; than?: string[]; start?: string[]; most?: string[]; least?: string[]; prior?: object; verbs?: Record<string, 'set' | 'add' | 'remove' | 'give'>; numbers?: Record<string, number>; pronouns?: string[]; question?: string[]; all?: string[]; skip?: string[] }): { state: Record<string, Record<string, number>>; steps: object[]; answers: { question: string; answer: number | string | null; owner?: string; item: string; why: string }[]; refused: { sentence: string; why: string }[]; unread: string[]; starts: Record<string, number>; unknown: Record<string, boolean>; focus: { owner: string | null; item: string | null } };
/** A word changed by a language world's ordered suffix rules, irregular forms first. */
export function inflectBy(world: World, word: string, op?: string, options?: { types?: { rule?: string; irregular?: string; form?: string }; vowels?: string; register?: string; all?: boolean; set?: string }): string | string[];
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
export function delexicalise(world: World, text: string, options?: { senses?: (word: string) => object[] }): string[];
/** The inverse of the form operators at read time: clauses, fillers dropped, alternations undone. */
export function canonicalise(world: World, text: string, options?: { fillers?: string[]; splitters?: string[]; rules?: object[]; classes?: Map<string, Set<string>>; type?: string }): { clauses: { text: string; applied: string[]; mode?: string }[]; dropped: string[] };
/** canonicalise, then read each clause by types. */
export function readCanonical(world: World, text: string, options?: { fillers?: string[]; splitters?: string[]; read?: object }): { text: string; mode?: string; applied: string[]; frame: object | null; unread: string[]; near?: object[] }[];
/** The filler words of learnt edits. */
export function fillersFrom(edits: { operators: { edit: string; family?: string }[] }): string[];
/** The word classes a world holds for patterns ({x:wh}). */
export function wordClassesOf(world: World, type?: string): Map<string, Set<string>>;
/** One way to choose: candidates ordered by the criteria declared for their kind (std.decide), every loss explained. */
export function choose<T extends object>(world: World | null, kind: string, candidates: T[], options?: { criteria?: { name: string; measure: string; dir: 'hard' | 'min' | 'max' }[]; seed?: number | null }): { best: T | null; order: T[]; ranked: { index: number; place: number; lostTo?: number; on?: string; why: string }[]; criteria: object[] };
/** RANKING's measures in the order std.decide (kind score) or the world declares. */
export function rankingOf(world: World | null): object[];
/** The order of a choice kind's criteria learnt from cases, admitted only when held-out cases do not drop. */
export function learnRanking(world: World | null, kind: string, cases: { candidates: object[]; expected: number }[], options?: { heldOut?: { candidates: object[]; expected: number }[] }): { current?: string[]; best?: string[]; admitted?: boolean; train?: object; heldOut?: object; facts?: string; why?: string };
/** Cells with expectations run through a host, each result a ledger row. */
export function experiment(cells: { id: string; input: unknown; expect: unknown; set?: string; class?: string }[], run: (input: any, config: any) => unknown, options?: { config?: object; name?: string; judge?: (got: unknown, expect: unknown, cell: object) => boolean; stage?: (got: unknown, cell: object) => string; source?: string }): object[];
/** Configurations × sets: a table, what each configuration buys against the baseline, failures by cause. */
export function ablation(cells: { id: string; input: unknown; expect: unknown; set?: string; class?: string }[], run: (input: any, config: any) => unknown, configs: Record<string, object>, options?: { baseline?: string; signals?: [string, (row: object) => boolean][]; judge?: (got: unknown, expect: unknown, cell: object) => boolean; stage?: (got: unknown, cell: object) => string }): { rows: object[]; table: Record<string, Record<string, { pass: number; of: number }>>; buys: Record<string, { gains: string[]; losses: string[] }>; causes: Record<string, { key: string; rows: number }[]>; baseline: string };
/** Several readers as parallel voices, pooled and combined by std.decide (kind ensemble), with a confidence. */
export function readEnsemble(world: World, text: string, options?: { readers?: Record<string, (world: World, text: string) => { frame: object; unread?: number; cost?: number; specificity?: number }[]>; read?: object; canonical?: object; threshold?: number; seed?: number; weights?: Record<string, number> }): { frame: object | null; confidence: number; voices: string[]; candidates: object[]; ranked?: object[]; ask?: object[] };
/** The library's own reading voices. */
export function defaultReaders(read?: object, canonical?: object): Record<string, (world: World, text: string) => object[]>;
/** The risk–coverage curve of a reader with a confidence. */
export function calibrate(rows: { confidence: number; correct: boolean }[], options?: { method?: 'isotonic' | 'platt'; iterations?: number }): { method: string; p: (score: number) => number | null; steps?: { lo: number; hi: number; p: number; n: number }[]; params?: { a: number; b: number }; brier: { before: number | null; after: number | null } };
export function riskCoverage(rows: { confidence: number; correct: boolean }[]): { threshold: number; coverage: number; risk: number }[];
/** A word's type signature at three levels: [fine, middle, coarse]. */
export function signatureOf(world: World, token: string, options?: { closed?: string[]; lemma?: (w: string) => string[] }): [string, string, string];
/** A sentence as chunks: adjacent content words merged, the signature its head's. */
export function chunk(world: World, text: string, options?: { closed?: string[] }): { words: string[]; sig: [string, string, string]; content: boolean }[];
/** Sentence patterns over chunk signatures, with their coverage. */
export function minePatterns(world: World, sentences: string[], options?: { level?: 0 | 1 | 2; closed?: string[] }): { patterns: { pattern: string; count: number; example: string }[]; sentences: number; at80: number; at95: number };
/** A reader learnt from mined patterns: a voice for readEnsemble. */
export function patternReader(world: World, cases: { text: string; frame: object }[], options?: { level?: 0 | 1 | 2; closed?: string[] }): (world: World, text: string) => { frame: object; unread: number; cost: number; specificity: number }[];
/** Run-on, noisy requests cut into clauses where they read best. */
export function splitRunOn(world: World, text: string, options?: { openers?: string[]; splitters?: string[]; fillers?: string[]; read?: object; reader?: (world: World, text: string) => { best: object | null; unread?: string[]; frames?: object[] }; unreadCost?: number }): { text: string; frame: object | null; unread: string[] }[];
/** "a, b and c". */
export function joinList(items: string[], options?: { and?: string; sep?: string }): string;
/** A fact as one clause, from the language world's facts; null without a subject. */
export function narrationOf(world: World): Map<string, { narrate: boolean; salience: number; form: string | null }>;
export function phraseOf(world: World, fact: { type: string; attrs: Record<string, string[]> }, options?: { key?: string; lang?: string; names?: Set<string> }): { text: string; key: string; phrasing: string } | null;
export function realiseFrame(world: World, frame: string, roles?: Record<string, string | string[]>, options?: { lang?: string; pick?: number; optional?: boolean | string[]; det?: string | null }): string | null;
export function paraphrasesOf(world: World, options?: { lang?: string }): Map<string, { alternation: string; canonical: string[] }>;
export function clauseOf(world: World, fact: { type: string; attrs: Record<string, string[]> }, options?: { parts?: number; lang?: string; names?: Set<string>; quiet?: string[]; words?: Record<string, string> }): string | null;
/** The sentence of an act from the language world's act template whose slots equal the roles. */
export function actSentence(world: World, act: string, roles: Record<string, unknown>, options?: { mode?: string | null; lang?: string }): string | null;
/** summarizeLog's frames as one sentence. */
export function renderFrames(frames: object[], options?: { world?: World; say?: (frame: object) => string; failed?: number | object[]; max?: number; words?: Record<string, string> }): string;
/** The k.genres genre a document type names, or null. */
export function genreOf(world: World, type: string): string | null;
/** The topics a world can compose about: names that at least `min` facts name. */
export function topicIndex(world: World, options?: { types?: string[]; min?: number }): { topic: string; type: string; facts: number }[];
/** Topics drawn by interest, seeded. */
export function randomTopics(world: World, options?: { seed?: number; count?: number; types?: string[]; min?: number }): string[];
/** A typed world from a session's things and the values each attribute can take. */
/** The free roles of a refused reading re-read by type; every content word placed, else null. */
/** Every assignment of content tokens to the typed slots of each pattern; a reading has exactly one. */
/** A reply judged against expected values (number words accepted) and an unchanged state. */
export function judgeReply(reply: string, expected: unknown, options?: { numberWords?: Record<string, string>; before?: unknown; after?: unknown; question?: boolean }): boolean;
/** Results as a degree × dimension table. */
export function tabulate(results: { degree: number; dim?: string; dims?: string[]; pass: boolean }[]): Record<string, { pass: number; of: number }>;
/** A degree × dimension table as text. */
export function tableText(table: Record<string, { pass: number; of: number }>): string;
/** A verbless continuation: the previous act reused with the roles the message gives. */
export function resolveEllipsis(world: World, text: string, previous: { act: string; args: Record<string, unknown> }, options?: { pronouns?: string[]; skip?: string[]; lang?: string; dirKey?: string; more?: string[]; small?: string[]; positions?: Record<string, number | 'middle'>; fold?: (word: string) => string }): { act: string; args: Record<string, unknown>; reused: true; changed: string[]; relative?: { more?: boolean; small?: boolean } } | null;

export interface SpellOptions { worlds?: World[]; dialogue?: { words?: string[]; last?: { text?: string } | null; history?: string[] }; lang?: string; language?: World | null; lexicon?: Iterable<string>; dictionary?: Iterable<string>; protect?: Iterable<string>; sources?: readonly { source: string; prior: number }[]; bounds?: Partial<typeof SPELL> }
export interface SpellRepair { from: string; to: string; source: 'world' | 'worlds' | 'dialogue' | 'dictionary'; cost: number; at: number }
export interface SpellAsk { from: string; at: number; candidates: { word: string; source: string; cost: number }[] }
/** Contextual, deterministic spell repair by the words of the live worlds, the dialogue and the language. */
export function repairWords(tokens: string[] | string, options?: SpellOptions): { tokens: string[]; repairs: SpellRepair[]; asks: SpellAsk[] };
export function editCost(a: string, b: string, max?: number): number;
export function worldWords(world: World): Set<string>;
export function languageWords(language: World | null | undefined, lang?: string): Set<string>;
export const SPELL: Readonly<{ minLength: number; maxCostShort: number; maxCostLong: number; margin: number; top: number; maxWords: number; recent: number }>;
export const SPELL_SOURCES: readonly { source: string; prior: number }[];
export const SPELL_COSTS: Readonly<{ near: number; accent: number; doubled: number; swap: number; other: number }>;

export function inspectRequest(world: World, id: string, options?: { family?: string; budget?: { steps?: number; ms?: number } }): { ok: boolean; issues: Array<{ kind: string; id?: string; why?: string; [key: string]: unknown }> };

export function calibrateReference(world: World, id: string, options?: { family?: string; budget?: { steps?: number; ms?: number } }): { ok: boolean; snapshot?: { readonly format: 'sop.reference.calibration'; readonly schemaVersion: 1; readonly method: 'median'; readonly value: number; readonly unit: string; readonly reference: { readonly id: string; readonly version: string; readonly property: string; readonly unit: string }; readonly samples: ReadonlyArray<{ readonly id: string; readonly value: number; readonly token: string; readonly unit: string; readonly provenance?: string }>; readonly evidence: ReadonlyArray<{ readonly id: string; readonly type: string; readonly attrs: Readonly<Record<string, readonly string[]>> }> }; issues: Array<{ kind: string; [key: string]: unknown }> };

/** Capture and retain an explicitly framed numerical legend space. Native point slots remain separate. */
export function retainPointSpace(world: World, id: string, options?: { family?: string; dry?: boolean; budget?: { steps?: number; ms?: number } }): { ok: boolean; created: boolean; retained?: RetainedRevision; violations: Array<{ kind: string; [key: string]: unknown }> };

/** Assess only exact native property tokens using correlated immutable trace evidence. */
export function assessPropertyChange(world: World, options: { request: string; step: string; before: string; after: string; expectation: string; source: string; sourceType: string; key: string; owner: string; revision: string; family?: string; replyFamily?: string; dry?: boolean; budget?: {steps?: number; ms?: number} }): {ok: boolean; created: boolean; retained?: RetainedRevision; assessment?: Record<string, unknown>; claim?: {type: string; attrs: Record<string,string[]>}; violations: Array<{kind: string; [key: string]: unknown}>};

export function assessExistenceChange(world: World, options: { request: string; step: string; before: string; after: string; expectation: string; owner: string; revision: string; family?: string; replyFamily?: string; dry?: boolean; budget?: {steps?: number; ms?: number} }): {ok: boolean; created: boolean; retained?: RetainedRevision; assessment?: Record<string, unknown>; claim?: {type: string; attrs: Record<string,string[]>}; violations: Array<{kind: string; [key: string]: unknown}>};

export interface PreparedRequestBatch { readonly entries: ReadonlyArray<{readonly id:string; readonly request:string; readonly wires:string; readonly after:ReadonlyArray<string>}>; readonly layers:ReadonlyArray<ReadonlyArray<string>>; }
export function prepareRequestBatch(input:{entries:Array<{id:string;request:string;wires:string;after:string[]}>},options?:{budget?:number;graphBudget?:number}):{ok:boolean;plan?:PreparedRequestBatch;issues:Array<{reason:string;id?:string}>};
export function requestBatchFrontier(plan:PreparedRequestBatch,outcomes?:Array<{id:string;status:'confirmed'|'unverified'|'refused'|'failed'|'unknown'}>,options?:{budget?:number}):{ok:boolean;ready:string[];waiting:string[];blocked:Array<{id:string;dependencies:string[]}>;complete:Array<{id:string;status:string}>;issues:Array<{reason:string}>};


export type RequestTruth = 'true' | 'false' | 'unknown';
export interface RequestBindingContext { instanceId: string; scope: string; version: string; }
export interface RequestHistoricalSubject { id: string | number; source: string; sourceType: string; version: string; }
export interface RequestGroundBinding { context: RequestBindingContext; subject: RequestHistoricalSubject; }
/** Graph truth only; callback semantics and population coverage are trusted. */
export function evaluateRequestPredicates(world: World, request: string, options?: {
  family?: string; selector?: string; budget?: number; maxDepth?: number;
  bindings?: Record<string, RequestGroundBinding>;
  evaluateConstraint?: (input: Readonly<Record<string, unknown>>) => { truth: RequestTruth; evidence: unknown[]; reason?: string };
  resolvePopulation?: (input: Readonly<Record<string, unknown>>) => { context: RequestBindingContext; complete: boolean; subjects: RequestHistoricalSubject[]; evidence: unknown[] };
}): { ok: boolean; truth: RequestTruth; request: string | null; sourceStamp: number; evidence: unknown[]; reasons: unknown[]; unknownReasons: unknown[]; trace: unknown[]; failures: unknown[]; provenance: unknown; steps: number; trust: string };


/** Resolve explicit target populations without parsing text or executing effects. */
export function resolveRequestTargets(world: World, request: string, options?: {
  family?: string; budget?: number; bindings?: Record<string, RequestGroundBinding>;
  populations?: Record<string, { kind: string; context: RequestBindingContext; complete: boolean; subjects: RequestHistoricalSubject[]; evidence: unknown[] }>;
  policies?: Record<string, 'one' | 'all'>;
  evaluateTarget?: (input: Readonly<Record<string, unknown>>) => { truth: RequestTruth; evidence: unknown[]; reason?: string };
  evaluateConstraint?: (input: Readonly<Record<string, unknown>>) => { truth: RequestTruth; evidence: unknown[]; reason?: string };
}): { ok: boolean; request: string | null; sourceStamp?: number; targets: Array<Record<string, unknown>>; steps: number; trust?: string; issues?: unknown[] };


export type RequestRevisionIdentity = { owner: string; revision: string };
export type RequestRevisionInput = RequestRevisionIdentity & (
  { graph: { request: string; nodes: RequestGraphNode[] } } |
  { base: RequestRevisionIdentity; changes: { put: RequestGraphNode[]; remove: string[] } }
);
/** Retain an explicit validated graph version, preserving its historical parent. */
export function retainRequestRevision(world: World, input: RequestRevisionInput, options?: { budget?: number; graphBudget?: number; retentionBudget?: number; dry?: boolean }): {
  ok: boolean; created: boolean; retained?: RetainedRevision; graph?: { request: string; nodes: RequestGraphNode[] }; wires?: string;
  steps?: number; limits?: { copy: number; perGraph: number; retention: number }; issues?: { reason: string }[]; violations?: Array<Record<string, unknown>>;
};

export type SelectiveCalibrationRow = {id:string;source:string} & ({eligible:true;score:number;correct:boolean}|{eligible:false;score:number|null;correct:null});
export interface SelectiveAdmissionPolicy {minFitAccepted:number;minEvaluationAccepted:number;maxErrorRate:number;}
export interface SelectiveAdmissionMetrics {total:number;eligible:number;ineligible:number;accepted:number;abstained:number;correct:number;wrong:number;coverage:number;risk:number|null;}
export interface SelectiveAdmissionReport {threshold:number|null;approved:boolean;reason:string;fit:SelectiveAdmissionMetrics;evaluation:SelectiveAdmissionMetrics;}
/** Empirical source-disjoint selective admission, not an individual probability. */
export function retainSelectiveCalibration(world:World,input:{owner:string;revision:string;identity:Record<string,unknown>;scope:string;policy:SelectiveAdmissionPolicy;fitRows:SelectiveCalibrationRow[];evaluationRows:SelectiveCalibrationRow[]},options?:{dry?:boolean;budget?:{steps?:number;ms?:number}}):{ok:boolean;created:boolean;retained?:RetainedRevision;calibration?:SelectiveAdmissionReport;issues?:Array<{reason?:string;[key:string]:unknown}>;violations?:Array<{kind:string;[key:string]:unknown}>};
export function assessSelectiveCalibration(world:World,reference:{owner:string;revision:string},candidate:{identity:Record<string,unknown>;scope:string;score:number|null;eligible:boolean},options?:{budget?:{steps?:number;ms?:number}}):{ok:boolean;admitted:boolean;reason:string;calibration?:{owner:string;revision:string};threshold?:number|null;policy?:SelectiveAdmissionPolicy;fit?:SelectiveAdmissionMetrics;evaluation?:SelectiveAdmissionMetrics;scope?:string;trust?:string;issues?:unknown[]};

/** Strict rooted graph equality under local node ID renaming; no logical, intent or effect proof. */
export function compareRequestGraphs(left:{request:string;nodes:RequestGraphNode[]},right:{request:string;nodes:RequestGraphNode[]},options?:{budget?:number;graphBudget?:number;maxNodes?:number}):{ok:boolean;equal:boolean|null;reason:string;mapping:Readonly<Record<string,string>>|null;steps:number};


/** Explicit trusted correlation; independent population and host version namespaces. */
export interface ContextTargetBindingDefinition {
  format: 'sop.context-target.binding'; schemaVersion: 1;
  graph: RequestRevisionIdentity & {target:string};
  evidence: RequestRevisionIdentity & {phase:'before'|'after';member:string};
  membership: RequestRevisionIdentity;
  witness: {authority:string;graphRequest:string;traceRequest:string;step:string;invocation:string;
    context:RequestBindingContext;population:{source:string;scope:string;version:string}};
}
/** Historical lookup only; no conversational selection, live identity or execution. */
export function lookupContextTargetBinding(world:World,reference:RequestRevisionIdentity,options?:{budget?:number;graphBudget?:number}):{
  ok:boolean;status:'bound-historically'|'unknown';historicalOnly:true;liveBinding:null;
  binding?:Readonly<RequestGroundBinding>|null;canonicalKind?:string|null;reference?:RequestRevisionIdentity;
  graph?:Readonly<Record<string,unknown>>;evidence?:Readonly<Record<string,unknown>>;
  membership?:Readonly<Record<string,unknown>>;witness?:Readonly<ContextTargetBindingDefinition['witness']>;
  steps:number;limits:{copyAndLookup:number;perGraph:number};trust?:string;issues?:Array<{reason:string}>;
};

/** Portable, queryable SOP instance facts; the implementation projection is typed SOP data. */
export interface InstanceStateObject { id: string; type: string; attributes?: Record<string, unknown[]>; relations?: Record<string, string[]>; metadata?: unknown; }
export interface InstanceState { instanceId: string; world: string; schemaVersion: string; revision: string | number; objects: InstanceStateObject[]; projection: unknown; metadata?: unknown; }
export interface InstanceStateLimits { maxNodes?: number; maxDepth?: number; maxBytes?: number; }
export const INSTANCE_STATE_FORMAT: 'sop.instance-state/2';
export function serializeInstanceState(input: InstanceState, options?: InstanceStateLimits): string;
export function readInstanceState(wires: string, options?: InstanceStateLimits): InstanceState;
export function instanceStateWorld(wires: string, options?: InstanceStateLimits & { schema?: string; includeArchive?: boolean }): World;
