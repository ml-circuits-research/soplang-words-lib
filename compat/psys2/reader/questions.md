# Reader review questions

## RDR1 — Target selection versus required result

The owner's “Change the colour of the green bird to yellow.” identifies an existing bird by its current green colour and asks for a yellow result. The published target schema has only kind/name/determiner, and ordinary constraints do not distinguish selection from result. Two colour constraints on the target would assert incompatible results. Proposed direction, coordinated by the primary worker: a target-owned selector graph separate from the desired result graph, preserving source spans and rejecting cross-context node sharing. The primary worker published this structural representation in 0.183.0 (a92e4cc); semantic label updates and review remain pending.

## RDR2 — Non-action dialogue and missing context

The English session contains objections/frustration and contextual fragments. An action envelope with an invented act would hide a missing dialogue contract. The source inventory retains every such turn and its session position. Which explicit non-action reading records should carry objections/clarifications, and which context snapshot should a fragment label reference? Until specified, these rows are pending rather than a fabricated request or a no-reading acceptance target.

## RDR3 — Corpus review and source language metadata

The complete imported evidence is 205 rows, with seven proposed request descriptions in the first increment. The app-selected language is contradicted by actual text in the later mixed session; the manifest explicitly lists English turns and preserves selected-language metadata. Existing hand glosses are included as attributed human/agent-reviewed translations, but their legacy parser readings are discarded. Please review the proposed labels, area attribution and contextual expectations; unknown tab names remain outside-scope or unassigned rather than guessed. Independently authored holdout semantics require separate approval; structural validity alone is insufficient.

## RDR4 — Explicit lexical token kinds in provider mappings

The generic graph serializer distinguishes literal tokens, quoted strings and references. The first property-change compatibility profile declares values as literal tokens, preserving the current single-token canonical colour/shape path. It intentionally refuses multiword provider names instead of reviving the old bridge's spelling-based quoting guess. Direct graph templates already support explicit string tokens.

Should reusable provider mappings declare the canonical value token kind alongside the value, with an explicit distinction between a concept identity and a textual label? Proposed direction: carry a declared token kind from the owning knowledge schema/lexical binding into the composed graph. Do not infer kind from whitespace or convert all values to strings without confirming how request values compare with observed canonical values. This is non-blocking for the current Drawing path; broad string-valued family coverage remains pending this contract.
