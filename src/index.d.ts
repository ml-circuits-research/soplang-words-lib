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
export interface Question { type?: string; seek?: string; where?: Record<string, string | number>; about?: string; mode?: 'value' | 'list' | 'count' | 'exists' | 'check' | 'abduce'; /** for mode=check: the value to check, when it is not in where */ value?: string | number }
export type WordMeaning =
  | { kind: 'action'; name: string }
  | { kind: 'type'; type: string }
  | { kind: 'key'; type: string; key: string }
  | { kind: 'value'; type: string; key: string; value: string };
export type Template = string | ((parts: { verb: string; args: { key: string; role?: string; text: string; value: string }[] }) => string);
export interface Example {
  lang: string;
  tool: { kind: 'action'; name: string } | { kind: 'type'; type: string } | { kind: 'question'; type: string; key: string };
  text: string;
  frame: Frame;
  expect: { action: string; args: Record<string, string> } | { type: string; attrs: Record<string, string>; refer: Record<string, { type: string; where: Record<string, string> }> } | { question: Question };
}
export interface Frame {
  lang?: string;
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
  refer?: Record<string, { type?: string; where?: Record<string, string>; ns?: string; /** ids it is not */ not?: string[] }>;
  /** a change to a told wire (a follow-up) */
  revise?: { id: string; values: Record<string, string> };
  action?: string;
  args?: Record<string, string>;
  question?: Question | Wire | string;
  ns?: string;
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
  parts?: Scored[];
  split?: number;
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
  /** ids of the standing core.issue wires the answer rests on */
  issues?: string[];
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
export interface ActResult { ok: boolean; status: 'done' | 'missing' | 'refused' | 'error' | 'unsupported' | 'budget'; value?: string; result?: unknown; missing?: { action: string; key: string; ask?: string }[]; violations?: Violation[] }
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
  /** by language (or '*'): the dictionary forms of a token, for interpret */
  lemmas?: Record<string, (token: string, lang: string) => string | string[]>;
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
  register(kind: 'function' | 'action' | 'producer' | 'filter' | 'lemma', name: string, fn: Function, options?: { override?: boolean | string[] }): this;
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
  check(): { ok: boolean; violations: Violation[]; issues: { id: string; rule?: string; about: string[]; key?: string; why?: string }[] };
  /** check wires from somewhere else against a matrix */
  static audit(wires: string | Wire[], matrix?: string | Wire[], options?: WorldOptions): { ok: boolean; violations: Violation[]; issues: object[]; world: World };
  /** apply several changes that must hold together: all or nothing */
  applyPatch(patch: Patch, options?: Budgeted & { strict?: boolean }): Result;
  query(question: Question | Wire | string, options?: Budgeted & { record?: boolean; suppose?: boolean; at?: number; /** only this namespace */ ns?: string; /** answer on the world as it would be with this patch */ given?: Patch }): QueryResult;
  /** the core.word entries of a language, by text */
  words(lang?: string): Map<string, { id: string; lang: string; means: string; of?: string; meanings: WordMeaning[] }[]>;
  /** read a language-neutral frame into candidates for score; nothing invented */
  interpret(frame: Frame | Frame[] | Frame[][], options?: Budgeted & { limit?: number; id?: string; ns?: string; /** read unknown words as the nearest known ones (default true) */ near?: boolean; /** a follow-up to this frame, or to the last told statement */ previous?: Frame | { frame: Frame; ids?: string[] } | 'told' }): { candidates: (ScoreCandidate & Reading)[]; unresolved: string[]; dropped: number; budget?: Violation };
  /** example sentences from the tools, slots and words, with the host's templates */
  examples(lang: string, templates?: { action?: Template; statement?: Template; question?: Template }, options?: { per?: number; all?: boolean; sample?: number }): Example[];
  /** answer with the top reading of score, or not, and why */
  veto(result: { candidates: Scored[]; order: number[] } | Scored[], options?: VetoOptions): Veto;
  /** judge candidate readings against the world; nothing is told */
  score(candidates: ScoreCandidate[], options?: Budgeted & { criteria?: Criterion[] }): { candidates: Scored[]; order: number[] };
  /** run fn against the world as it was at a point of the sequence */
  asOf<T>(at: number, fn: (world: World) => T, options?: Budgeted): T | undefined;
  seqOf(id: string): number | undefined;
  compare(idA: string, idB: string): number;
  act(request: { action: string; args?: Record<string, string | number | string[]> } | Wire | string, options?: Budgeted): ActResult;
  trial<T>(fn: (world: World) => T, options?: Budgeted): T | undefined;
  stamp: number;
  abduce(goal: string | Wire[], options?: Budgeted & { maxDepth?: number; max?: number; maxAssumptions?: number }): Explanation[] & { budget?: BudgetViolation };
  explain(id: string): object | null;
  history(): WorldEvent[];
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
