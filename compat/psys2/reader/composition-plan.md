# First symbolic composition boundary

SOP-BERT remains the primary reader. The symbolic path is a fallback and an explainer; both paths propose general request graphs and must pass instance resolution. Neither agreement with the symbolic path nor a valid graph proves the intended reading.

## Development scope

The first family was selected from development labels `owner-en-2026-11-15:005`, `:011`, `:012`, `:013` and `:014`: explicit assignment of a property to an existing target. These five rows contain four distinct texts. They are proposed labels, not approved semantic gold. The two creation labels are outside this increment. Published knowledge may initially support only the colour cases; size requires a declared degree interpretation, and fill requires its own value-domain binding. Do not derive those meanings from test expectations.

Existing `acts.change.of` declares attribute, thing and value roles, but its unrestricted word captures do not establish canonical concept identity or compatible value domains. Its output is therefore not a ready request graph. The knowledge repository owns the grammar, lexical bindings and semantic declarations; the library owns their general evaluation.

## Declarative composition

`composeParses(parses, {rules, lexical, budget, maxDepth})` evaluates each returned `parseText` tree independently. A production is selected by exact rule ID; lexical nodes use their declared category. Ordinary JSON objects and arrays assemble semantic records. `{$get: ['children', 0, 'kind']}` reads a composed child field, while `{$get: ['node', 'feat', 'kind']}` reads a declared lexical feature. `{$literal: value}` quotes JSON, including reserved keys. Paths access own properties only.

Every child must have a mapping. A declaration may explicitly acknowledge grammatical material with `{$literal: null}`. Missing declarations, absent features, unmapped coordination or invalid templates reject that tree with a reason. All surviving alternatives retain their parse indices; none is merged, ranked or called a complete understanding. An author can still write an incorrect mapping or ignore a meaningful child: structural evaluation cannot certify that knowledge claim.

The mechanism copies evidence rather than fabricating it. `node.sourceRanges` comes from published original Unicode scalar provenance. A request adapter may emit a single interval only for justified contiguous evidence. Disjoint evidence remains in explanations or requires a separately justified representation; taking its bounding interval would falsely include ignored material. Unaligned rewrites cannot supply exact evidence.

Evaluation bounds both traversal and JSON copying. Budget exhaustion retains already composed candidates and marks truncation. The parser's truncation marker propagates. The parser may also cap alternatives; an unmarked result is not a proof of semantic exhaustiveness.

## Knowledge and request adapter

The knowledge author will publish language productions plus lexical bindings into existing source worlds. Bindings name the source type, text key, category and literal/copied feature fields. Vocabulary remains in its owning worlds. A mapping-fact tree may compile to the JSON template interface; no executable callbacks or generated sentence rules are required.

The bounded request adapter will require explicit act/mood, existing-target identity/determiner, property concept and a value with declared operator and compatible concept. It will build ordinary published `std.request` wires, validate them with `inspectRequest`, and return candidates for instance resolution. Target-selection constraints and desired-result constraints remain separate. No legacy request keys are silently translated into the new graph.

Source-token coverage alone is insufficient: the grammar tokenizer drops punctuation. A reader must explicitly account for relevant punctuation and unresolved material before claiming an interpretation; a question mark cannot disappear and turn a question into an imperative. This generic transducer makes no such completeness claim.

## Development probes before a reader claim

Use independently selected development variants to vary the object, property and value, including concepts outside drawing. Preserve alternative lexical meanings. Unknown values or incompatible property/value concepts must not produce a guessed request. Negation, questions and unsupported coordination must decline until explicit semantics exist. A selector's current colour and the desired colour must not become two result constraints. Case, punctuation, multiword lexical evidence and missing source alignment must retain honest provenance.

These are planned probes, not achieved reader-coverage results. The initial mechanism tests use an invented language and test binding preservation, alternative retention, failure reasons and resource limits. No heldout sentence or reviewer concern selects these rules.

## Equality guards for declared composition agreements

The generic mechanism now accepts `guards[productionWireId] = [{left, right}]`,
using the same binding templates as composition. It validates all guard declarations
before producing candidates, then compares each production's operands after its
children compose and before accepting its parent template. Missing bindings fail;
unequal JSON values report a distinct rejection. Objects compare by key/value
structure independent of insertion order, arrays remain ordered, and primitive types
do not coerce. Declaration checks, copying and comparison share the composition
budget. No property compatibility rule or domain concept is inferred by this API.

The knowledge adapter still needs to resolve symbolic rule names to actual production
wire IDs and compile agreement-node references to templates. This mechanism change
alone does not make the pending English overlay an executable reader or resolve
instances in a domain world.

## Validated SOP overlay compiler

The generic compiler reads all eight declaration roles through caller-supplied type
identities. It emits an authoritative, decoded production snapshot, lexical entries
with scalar origin IDs, detached source provenance, semantic templates and equality
guards. Every declared provider must be available; source identity restrictions and
text filters apply uniformly. Repeated semantic fields remain bounded alternatives,
and text-key features stay paired with their emitted aliases. No domain vocabulary
is copied into the library.

The first integration pins the published knowledge declarations at `1c4f32ea` and
checks both declared value domains. It is still a compiler milestone, not an instance
resolver or a request execution path. Compilation is bound to the exact source World
and its rollback-restored `stamp`: inspection found that `world.version` alone does
not change on every schema-only edit. The subsequent bridge must reject stale or
foreign-world compilation, preserve unresolved alternatives and account for ignored
source gaps through an explicit language policy.

## First request-graph bridge

`readGrammarRequests` now projects explicitly declared positive equality assignments
into standalone `std.request` graphs. The bridge requires original source mapping,
complete source coverage under an explicit terminal-punctuation policy, no reported
parser pruning, and no unresolved composition alternatives. It validates every graph
with `inspectRequest`, retains disjoint lexical evidence without inventing a hull,
and preserves per-leaf source origins. Exact knowledge-world identity and mutation
stamp are checked before and after reading.

The compatibility profile is deliberately explicit: imperative mood, existing target,
equality operator, requirement character and positive polarity all come from the
semantic record. Unknown fields, unsupported selectors, negation, quantified or
indefinite target forms and other profiles decline. No target instance or successful
effect is inferred. Local graph IDs belong to each detached candidate; persistent
journals must retain/import the whole graph under their own request identity.

Knowledge pin `ef0a1b27` adds the complete shape-kind provider and explicit constraint
character/polarity. Published-data integration checks the owner development phrase
“Change the colour of the circle to purple.” and a separate shape assignment. These
are request-description checks, not Drawing execution claims or heldout scores.
PSys2 owns instance resolution, host effects, observations and typed reply evidence.

## Schema graph serialization and declared interpretation profiles

`serializeRequestGraph` now consumes schema-named nodes and explicit literal,
string or reference tokens. Actual loaded schema types/slots, local graph closure,
one request root and `inspectRequest` decide structural validity. Selector graphs,
logical result groups and additional targets need no serializer branches. Numeric,
boolean and `none` token spellings retain their lexical identity without coercion.

`readGrammarRequests` accepts this graph directly from composition, or invokes an
optional second `composeParses` mapping with declared variants and equality guards.
`request-profile.mjs` holds the first assignment interpretation, including its
closed-record guard and accepted mood/mode/operator/character/polarity. The library
contains none of those construction restrictions. Selecting this profile through
`ENGLISH_REQUEST_OPTIONS` preserves the initial published overlay path; it does not
claim the overlay can already parse a second construction.

Evidence is keyed by graph node: `{unit, command, nodes: [{id, source, ranges}]}`.
Only verified single contiguous ranges become schema span slots. Disjoint ranges
stay external; caller-supplied spans and foreign source references decline. Profiles
are trusted author interpretations, not semantic proof or live instance resolution.
No heldout sentences or outcomes were read for this mechanism change.

The compatibility profile declares provider names as textual strings uniformly,
including single-word and multiword colour/shape names. These are labels resolved
by the consumer against the owning knowledge family, not reference identities or
numeric native values. Consumers compare decoded labels, then retain the resolved
native value separately. This corrects the initial literal-only profile regression
without a spelling-based quoting guess. Other value families must declare their
own token semantics rather than inherit this name-label profile blindly.

## Direct projection of normalized argument records

`projectTemplates` exposes the same template, safe-copy and equality evaluator as
`composeParses` over indexed `{template, context}` jobs. This addresses the concrete
frame-licence contract: copy a selected object whole, including its selector, while
keeping the result predicate separate; preserve a role array when a marker and an
object share one semantic role. Projection has one call-wide budget and explicit
partial-enumeration reporting. It adds no expression operators or implicit frame
selection, and does not itself validate licences or produce executable effects.

The existing composition traversal and its tested operation counts are unchanged.
The new public entry validates every declaration and each complete semantic context,
so its budget includes work that the earlier parse traversal did not perform. The
preview compatibility profile therefore retains its current bounded wrapper path;
replacing that path merely to remove a wrapper would change resource behavior.
A separately validated frame binder can use direct projection once its versioned
knowledge declarations are selected and compiled. No broader parsing or execution
coverage follows from this mechanism alone.

## Executable licence-to-role adapter

The compatibility adapter in `frames.mjs` now joins the published licence, frame,
part, role-map and semantic-role identities and projects all matching licensed
alternatives with the public template API. The selected frame supplies act, mode
and needs; lexical act is used only to validate the licensed verb-part join. Role
arrays retain marker/argument distinctions, exact source evidence and whole copied
objects/results. Neutral NP qualifiers are not rewritten based on a guessed act.

Knowledge revision `0591f342` supplies the initial five licences. The adapter
explicitly admits the documented version-2 optional target-mode field; absent mode
stays unresolved and unknown values fail. It produces role projections only:
argument typing, unit compatibility, request construction and instance resolution
remain separate obligations. It neither replaces the pinned preview reader nor
claims that a phrase which reaches a role record is an executable request.

The next phrase-data integration can use separate static knowledge views from the
same pin for syntax mappings and frame paths, since both reuse the template node
and step types. A draft smoke of transitive, resultative and oblique composition
confirmed the agreed reading envelope; that draft is not part of this pinned
milestone's acceptance tests or coverage claim.
