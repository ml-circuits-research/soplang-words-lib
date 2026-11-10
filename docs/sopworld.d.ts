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
export interface Question { type?: string; seek?: string; where?: Record<string, string | number>; about?: string; mode?: 'value' | 'list' | 'count' | 'exists' }
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
  alternatives?: { value: string; from: string[] }[];
  missing?: { id?: string; type?: string; key: string; ask?: string }[];
  violations?: Violation[];
  from: string[]; via?: string[]; wires: string[];
  answer?: { ok: boolean; id?: string; question?: string; violations?: Violation[] };
}
export interface ActResult { ok: boolean; status: 'done' | 'missing' | 'refused' | 'error' | 'unsupported' | 'budget'; value?: string; result?: unknown; missing?: { action: string; key: string; ask?: string }[]; violations?: Violation[] }
export interface Assignment { id: string; key: string; value: string }
/** Changes judged as a whole: wires to tell and values to fill, or just the fills. */
export type Patch = Assignment[] | { wires?: string | Wire[]; fills?: Assignment[]; /** replace what the key holds */ sets?: Assignment[]; /** wire ids to retract */ retract?: string[] };
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
export interface Snapshot { format: 'sopworld'; version: number; log: object[] }
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
export interface ChangeOptions extends Budgeted { dry?: boolean; strict?: boolean; /** how sure this statement is (default: told) */ tier?: string }
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
  register(kind: 'function' | 'action' | 'producer', name: string, fn: Function, options?: { override?: boolean | string[] }): this;
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
  /** a point to come back to; costs nothing until the world changes */
  mark(): { world: World; seq: number };
  /** make the world exactly what it was at the mark */
  rewind(mark: { world: World; seq: number }): { ok: boolean; removed: string[]; added: string[]; changed: Difference['changed'] };
  /** the facts as they were stated, without what rules, defaults or searches added */
  told(): Wire[];
  /** how solid a value is: told, derived, forced, default, guessed, or a tier the matrix declares */
  tier(id: string, key?: string): string | undefined;
  /** everything weaker than derived, weakest first, with the cells that rest on each */
  assumptions(): Assumption[];
  /** things that still work and will not, such as a pattern declared the old way (`?id type ...`) */
  warnings: { kind: string; id: string; why: string }[];
  /** steps of the last call, per site, and whether its budget ran out */
  stats(): Stats;
  on(listener: (events: WorldEvent[], world: World) => void): () => void;
  toJSON(): Snapshot;
  static fromJSON(data: Snapshot, options?: WorldOptions): World;
  get(id: string): Wire | undefined;
  has(id: string): boolean;
  resolve(id: string): string;
  ofType(type: string): Wire[];
  ask(query: string | Wire[], options?: Budgeted & { at?: number }): Record<string, string>[] & { budget?: BudgetViolation };
  holds(query: string | Wire[], options?: Budgeted): boolean;
  open(id?: string): OpenKey[];
  suggest(id: string, key: string, options?: Budgeted & { deep?: boolean }): Candidate[] & { budget?: BudgetViolation };
  next(options?: Budgeted): NextStep & { budget?: BudgetViolation };
  complete(options?: Budgeted & { defaults?: boolean; choose?: boolean }): { filled: object[]; questions: Wire[]; dead: OpenKey[]; pending: object[]; budget?: BudgetViolation };
  /** `budget` is the solver's own search budget; `limit` is the step budget of the call */
  solve(options?: { solver?: Solver; budget?: number; limit?: Budget }): Assignment[] | null;
  solveReport(options?: { solver?: Solver; budget?: number; limit?: Budget }): SolveReport;
  solveAsync(options?: { solver?: Solver; budget?: number }): Promise<SolveReport>;
  satisfiable(options?: { solver?: Solver; budget?: number; limit?: Budget }): boolean;
  apply(assignment: Assignment[], options?: Budgeted & { via?: string }): Result;
  /** would these changes be accepted together? Applied in one scratch transaction and undone. */
  check(patch: Patch, options?: Budgeted & { strict?: boolean }): Result;
  /** without a patch: validate the whole world; every violation, and the standing issues */
  check(): { ok: boolean; violations: Violation[]; issues: { id: string; rule?: string; about: string[]; key?: string; why?: string }[] };
  /** check wires from somewhere else against a matrix */
  static audit(wires: string | Wire[], matrix?: string | Wire[], options?: WorldOptions): { ok: boolean; violations: Violation[]; issues: object[]; world: World };
  /** apply several changes that must hold together: all or nothing */
  applyPatch(patch: Patch, options?: Budgeted & { strict?: boolean }): Result;
  query(question: Question | Wire | string, options?: Budgeted & { record?: boolean; suppose?: boolean; at?: number }): QueryResult;
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
