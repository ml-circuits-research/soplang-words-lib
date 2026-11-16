# Reader review questions

## RDR1 — Target selection versus required result

The owner's “Change the colour of the green bird to yellow.” identifies an existing bird by its current green colour and asks for a yellow result. The published target schema has only kind/name/determiner, and ordinary constraints do not distinguish selection from result. Two colour constraints on the target would assert incompatible results. Proposed direction, coordinated by the primary worker: a target-owned selector graph separate from the desired result graph, preserving source spans and rejecting cross-context node sharing. The primary worker published this structural representation in 0.183.0 (a92e4cc); semantic label updates and review remain pending.

## RDR2 — Non-action dialogue and missing context

The English session contains objections/frustration and contextual fragments. An action envelope with an invented act would hide a missing dialogue contract. The source inventory retains every such turn and its session position. Which explicit non-action reading records should carry objections/clarifications, and which context snapshot should a fragment label reference? Until specified, these rows are pending rather than a fabricated request or a no-reading acceptance target.

## RDR3 — Corpus review and source language metadata

The complete imported evidence is 205 rows, with seven proposed request descriptions in the first increment. The app-selected language is contradicted by actual text in the later mixed session; the manifest explicitly lists English turns and preserves selected-language metadata. Existing hand glosses are included as attributed human/agent-reviewed translations, but their legacy parser readings are discarded. Please review the proposed labels, area attribution and contextual expectations; unknown tab names remain outside-scope or unassigned rather than guessed. Independently authored holdout semantics require separate approval; structural validity alone is insufficient.

## RDR4 — Textual labels versus canonical value identities

The initial literal-only profile caused a real coverage regression for multiword provider names. The corrected property-name profile declares every provider name as a string, including single-word names. This matches the published colour/shape name fields and the consumer's decoded-name lookup; native RGB values are resolved and retained separately. It does not guess token type from spelling or change generic serialization.

Please review this family-specific label contract. Future numeric/identity-valued provider families still need explicit token-kind declarations and cannot silently use this text-name profile. Exhaustive published colour-name coverage and unchanged decoded-value/effect checks are required before adoption.

## General request composition review

The new declarative compiler executes all four currently graphable frame licences together, with explicit existing/new modes, separate selectors/results and relational goals. Please review the authoritative `w.reader.en.requests` joins and the source-exact spatial preposition admission, including refusal of incomplete multiword fragments. Lifecycle acts deliberately do not invent an existence concept.

Remaining shared data obligations: quantity/head NP composition with declared units/baselines/anchors for increment; question construction/mood; coordination with explicit request dependencies; quantified binding; and dialogue-context reference records. Propose source-backed constructions across these families rather than example-specific rules. The consumer currently refuses numeric-index role paths pending exact array context reconstruction; lower-level projection already supports them. Native capabilities and request batching must not be presented as proof these English constructions are implemented.
