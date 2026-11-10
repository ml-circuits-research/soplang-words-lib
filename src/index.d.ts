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
    | 'syntax' | 'schema' | 'depth' | 'budget' | 'unknown-wire' | 'dead-end' | 'unsupported';
  why?: string; id?: string; key?: string; value?: string; rule?: string; wires?: string[];
  have?: string; want?: string; via?: string; allowed?: string[];
  /** the told wires this refusal rests on */
  support?: string[];
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
}
export interface OpenKey { id: string; type: string; key: string; ask?: string }
export interface Candidate { value: string; source: 'default' | 'enum' | 'wire' | 'range'; count: number }
export interface Question { type?: string; seek?: string; where?: Record<string, string | number>; about?: string; mode?: 'value' | 'list' | 'count' | 'exists' }
export interface QueryResult {
  status: 'supported' | 'conflicting' | 'missing' | 'refused' | 'no' | 'unknown';
  value?: string; values?: string[];
  alternatives?: { value: string; from: string[] }[];
  missing?: { id?: string; type?: string; key: string; ask?: string }[];
  violations?: Violation[];
  from: string[]; via?: string[]; wires: string[];
  answer?: { ok: boolean; id?: string; question?: string; violations?: Violation[] };
}
export interface ActResult { ok: boolean; status: 'done' | 'missing' | 'refused' | 'error' | 'unsupported'; value?: string; result?: unknown; missing?: { action: string; key: string; ask?: string }[]; violations?: Violation[] }
export interface Assignment { id: string; key: string; value: string }
export interface SolveReport { status: 'sat' | 'unsat' | 'unknown'; assignment?: Assignment[]; stats: Record<string, number>; solver?: string }
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
export interface NextStep {
  fills: (OpenKey & { value: string; kind: 'forced' | 'default' })[];
  questions: Wire[];
  dead: OpenKey[];
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
  rank?: <T>(items: T[], context: { kind: 'value' | 'explanation'; world: World; id?: string; key?: string }) => T[] | void;
}
export interface ChangeOptions { dry?: boolean; strict?: boolean }

export class World {
  constructor(options?: WorldOptions);
  wires: Map<string, Wire>;
  /** the matrix wires by id */
  matrix: Map<string, Wire>;
  /** what the matrix says about a type: parent, lineage, closed, keys with all their attributes */
  schema(type: string): { type: string; extends: string | null; lineage: string[]; closed: boolean; keys: Record<string, Record<string, unknown>>; [attr: string]: unknown } | null;
  log: object[];
  tell(input: string | Wire[], options?: ChangeOptions): Result;
  fill(id: string, key: string, value: string | number, options?: ChangeOptions): Result;
  load(input: string | Wire[]): Result;
  use(name: string): Result;
  retract(id: string): Result;
  replace(id: string, input: string | Wire[]): Result;
  step(input: string | Wire[], options?: { defaults?: boolean; choose?: boolean; strict?: boolean }): StepResult;
  answer(question: Wire, value: string | number): Result;
  fork(): World;
  on(listener: (events: WorldEvent[], world: World) => void): () => void;
  toJSON(): Snapshot;
  static fromJSON(data: Snapshot, options?: WorldOptions): World;
  get(id: string): Wire | undefined;
  has(id: string): boolean;
  resolve(id: string): string;
  ofType(type: string): Wire[];
  ask(query: string | Wire[], options?: { at?: number }): Record<string, string>[];
  holds(query: string | Wire[]): boolean;
  open(id?: string): OpenKey[];
  suggest(id: string, key: string, options?: { deep?: boolean }): Candidate[];
  next(): NextStep;
  complete(options?: { defaults?: boolean; choose?: boolean }): { filled: object[]; questions: Wire[]; dead: OpenKey[]; pending: object[] };
  solve(options?: { solver?: Solver; budget?: number }): Assignment[] | null;
  solveReport(options?: { solver?: Solver; budget?: number }): SolveReport;
  solveAsync(options?: { solver?: Solver; budget?: number }): Promise<SolveReport>;
  satisfiable(options?: { solver?: Solver; budget?: number }): boolean;
  apply(assignment: Assignment[], options?: { via?: string }): Result;
  query(question: Question | Wire | string, options?: { record?: boolean; suppose?: boolean; at?: number }): QueryResult;
  /** run fn against the world as it was at a point of the sequence */
  asOf<T>(at: number, fn: (world: World) => T): T;
  seqOf(id: string): number | undefined;
  compare(idA: string, idB: string): number;
  act(request: { action: string; args?: Record<string, string | number | string[]> } | Wire | string): ActResult;
  trial<T>(fn: (world: World) => T): T;
  stamp: number;
  abduce(goal: string | Wire[], options?: { maxDepth?: number; max?: number; maxAssumptions?: number }): Explanation[];
  explain(id: string): object | null;
  history(): WorldEvent[];
  toSOP(options?: { schema?: boolean; derived?: boolean; provenance?: boolean }): string;
}
export class SopError extends Error {}
export function parse(text: string): Wire[];
export function format(wire: Wire, options?: { multiline?: boolean }): string;
export function tokenize(text: string): { t: string; line: number }[];
export function str(value: string): string;
export function quote(text: string): string;
export function induce(examples: { when: string | Wire[]; then?: string | Wire[] }[], options?: { name?: string; kind?: 'rule' | 'deny'; why?: string; tolerant?: boolean; distinct?: boolean; negatives?: { when: string | Wire[] }[] }): { text: string; skipped: { index: number; why: string }[]; calcs: object[]; tests: object[]; coversNegative: number[]; variables: number; examples: number };
export function adopt(world: World, explanation: Explanation): { ok: boolean; results: Result[] };
export function induceRule(examples: { when: string | Wire[]; then: string | Wire[] }[], options?: { name?: string }): string;
export function induceSlots(wires: string | Wire[], options?: { enumMax?: number; prefix?: string }): string;
export function abduce(world: World, goal: string | Wire[], options?: object): Explanation[];
export const builtins: Record<string, Fn>;
