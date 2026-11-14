export { World } from './world.mjs';
export { parse, format, serialize, tokenize, str, quote, readValue, writeValue, SopError } from './parser.mjs';
export { unify, walk } from './unify.mjs';
export { abduce, adopt } from './abduce.mjs';
export { induce, induceRule, induceSlots } from './induce.mjs';
export { builtins, quantity } from './builtins.mjs';
export { solvers, Problem, Sat, toDimacs, toASP } from './solve.mjs';

export { GRAMMAR, MODIFIERS, SCHEMA_TYPES } from './matrix.mjs';
export { rank, RANKING, veto } from './rank.mjs';
export { aggregates } from './builtins.mjs';
export { PatternIndex } from './patterns.mjs';
export { schemaCard, schemaExamples, actReply, schemaGrid, gridTests } from './schema-words.mjs';
export { createCatalog, createCatalogs, bundleReader, bundleThenRead, listOf, loadBundles } from './knowledge.mjs';
export { turn, route, turnFlow, arbitrate } from './turn.mjs';
export { parseText, grammarOf, nounPhrase, grammarView, viewDiff, grammarCheck } from './grammar.mjs';
export { resolve } from './resolve.mjs';
export { needsOf } from './std.mjs';
export { segment, actWords } from './segment.mjs';
export { dialogueTurn, focusLog } from './dialogue.mjs';
export { motionPlan, motionRun } from './motion.mjs';
export { readMotion, planMotionFacts, splitText } from './motion-facts.mjs';
export { sample, diversity } from './sample.mjs';
export { placeFor, boxesOf, relationsOf } from './space.mjs';
export { actsOf, summarizeLog, summarizeText, overlap } from './summarize.mjs';
export { compose, interestOf, measuresOf, shapeShare, interestModel } from './compose.mjs';
export { readStory, storyPlan, STORY_RELATIONS } from './story.mjs';
export { writeDocument, readDocument } from './document.mjs';
export { discourseRealiser, discourseTemplates } from './realise.mjs';
export { readByTypes, typedLexicon, nearWords } from './readtypes.mjs';
export { cousins, kindChain, judgeFix } from './cousins.mjs';
export { normalise, alternationsOf } from './alternate.mjs';
export { learnRules } from './learn.mjs';
export { alignWorlds } from './align.mjs';
export { planner, factStore, PlanLive, readMethods, PLAN_LIMITS, solveChoices } from './plan.mjs';
export { morphOf, generate, analyse, fold, splitClitics, dictionary, realise, templateFor } from './morph.mjs';
export { ledgerAppend, ledgerGroups, ledgerKey, stageOf, STAGES } from './ledger.mjs';
export const version = '0.77.0';
/**
 * Which build this is. In the single-file build (docs/sopworld.mjs, docs/sopworld.js)
 * tools/build.mjs fills in `hash`, a fingerprint of the bundled sources, and `date`,
 * the day that fingerprint was first built; from the sources both are null.
 */
export const build = { version, hash: null, date: null };
