# Request predicate evaluation proposal

This mechanism evaluates only the published request graph. It does not read
sentences, resolve vocabulary, choose host instances, mutate an instance, execute
a plan or independently prove a callback's semantic assertion.

The implemented `evaluateRequestPredicates` takes a request world/ID and explicit
callbacks. `evaluateConstraint` evaluates the positive proposition over supplied
ground historical-subject bindings, returning true, false or unknown with its
evidence. The evaluator applies the constraint's polarity, logical negation,
conjunction/disjunction and quantification. A negative constraint therefore does
not ask a callback to invert a value implicitly.

The default context is the result root. An absent result root means conjunction
of result constraints outside every selector closure. No result content is
unknown, so a request lacking predicates cannot become an unsupported success
claim. Selector evaluation must be requested explicitly by target ID; selector
and result evidence remain distinct.

A historical subject identifies its source incarnation, version, source type
and local ID (a nonempty string or safe integer, kept without coercion). Ground
bindings are explicit target-ID mappings to
`{context: {instanceId, scope, version}, subject: {id, source, sourceType, version}}`.
The subject version must match its declared snapshot context. Populations return
`{context, complete, subjects, evidence}` with one declared snapshot context and
matching subject versions. Duplicate source identities within a population,
including conflicting versions, are refused. Independent initial bindings may
name different snapshots explicitly; the evaluator never equates those snapshots. A quantifier's
resolver supplies distinct subjects and an explicit population-completeness
flag. Its bound target shadows only inside its body, including nested bodies;
no bound target escapes to sibling nodes. Shared graph nodes may be evaluated
again under different bindings, never reused across different subjects.

`all` and `each` are universal, `any` existential and `none` negated existential.
On a complete empty population their values are respectively true, true, false
and true. Partial populations cannot establish a universal or an absence, but a
real counterexample refutes a universal and a real existential witness proves
an existential (or refutes `none`). Unknown leaves use strong three-valued logic:
false determines conjunction, true determines disjunction, and negation keeps
unknown unchanged.

Structural inspection and schema validation precede callbacks. Traversal,
population copying, evidence copying and output construction are bounded. Invalid
callback records, missing ground bindings, unavailable populations and exhausted
budgets retain explicit unknown reasons. Any callback change to the world's
stamp invalidates the entire evaluation, including previously decisive branches.
Callbacks must be pure over the same bound context and stable external snapshots:
DAG memoization reuses a node under identical ground bindings. Public world writes
invalidate the result, including temporary writes subsequently rolled back inside
a callback. Direct external mutation of wire internals or other unversioned host
state is unsupported; stamp checks do not prove external purity.

The API options are `evaluateConstraint`, `resolvePopulation`, `bindings`, an
optional `selector` target ID, `family` (default `std.request`), `budget` (default
50,000 steps) and `maxDepth` (default 64). Callbacks receive one frozen data record.
Leaves receive `request`, a positive-polarity `constraint`, `originalPolarity`,
`bindings`, and `context` (`result` or `selector`); return
`{truth: 'true' | 'false' | 'unknown', evidence: [], reason?}`. Population callbacks
receive `request`, `quantifier`, `target`, `bindings` and the evaluation context.
Callbacks are synchronous; promises and malformed/accessor data are unknown.

The result has `ok` (completed evaluation, not semantic success), `truth`,
`evidence`, `reasons`, `unknownReasons`, a per-binding node `trace`, `failures`,
request/root provenance and the source stamp. `ok: false` always has unknown
truth; semantic unknown can have `ok: true`. Every copied datum and callback call
is charged, together with the actual structural/schema-validation step counts.

A successful result trusts callback truth and the resolver's declared coverage;
it is not an independent host assessment or executable request.
