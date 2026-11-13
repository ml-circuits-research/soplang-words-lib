// The library under test: the sources, or the single-file build when SOPWORLD_BUNDLE is set.
const lib = await import(process.env.SOPWORLD_BUNDLE ? '../docs/sopworld.mjs' : '../src/index.mjs');
export const {
  World, parse, format, tokenize, str, quote, SopError, unify, walk, abduce, adopt,
  induce, induceRule, induceSlots, builtins, quantity, solvers, Problem, Sat, toDimacs, toASP, version, build, serialize, readValue, writeValue, GRAMMAR, MODIFIERS, SCHEMA_TYPES, aggregates, rank, RANKING, veto, PatternIndex, schemaCard, schemaExamples, actReply, schemaGrid, gridTests, createCatalog, bundleReader, turn, route, turnFlow, parseText, grammarOf, nounPhrase, grammarView, viewDiff, resolve, ledgerAppend, ledgerGroups, ledgerKey, stageOf, STAGES,
} = lib;
