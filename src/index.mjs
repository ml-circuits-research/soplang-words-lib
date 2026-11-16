export { World } from './world.mjs';
export { parse, format, serialize, tokenize, str, quote, readValue, writeValue, valueText, SopError } from './parser.mjs';
export { unify, walk } from './unify.mjs';
export { abduce, adopt } from './abduce.mjs';
export { induce, induceRule, induceSlots } from './induce.mjs';
export { builtins, quantity } from './builtins.mjs';
export { solvers, Problem, Sat, toDimacs, toASP } from './solve.mjs';

export { GRAMMAR, MODIFIERS, SCHEMA_TYPES } from './matrix.mjs';
export { rank, RANKING, choose, rankingOf, learnRanking } from './rank.mjs';
export { aggregates } from './builtins.mjs';
export { PatternIndex } from './patterns.mjs';
export { schemaCard, schemaExamples, actReply, schemaGrid, gridTests } from './schema-words.mjs';
export { createCatalog, createCatalogs, bundleReader, bundleThenRead, listOf, loadBundles } from './knowledge.mjs';
export { turn, TURN_STAGES, turnFlow, arbitrate } from './turn.mjs';
export { compileGrammarOverlay } from './grammar-overlay.mjs';
export { composeParses } from './grammar-compose.mjs';
export { parseText, grammarOf, nounPhrase, grammarView, viewDiff, grammarCheck } from './grammar.mjs';
export { resolve } from './resolve.mjs';
export { needsOf } from './std.mjs';
export { segment, actWords } from './segment.mjs';
export { dialogueTurn, focusLog, resolveEllipsis } from './dialogue.mjs';
export { readMotion, planMotionFacts, splitText, motionRun } from './motion-facts.mjs';
export { sample, diversity } from './sample.mjs';
export { placeFor, boxesOf, relationsOf, arrange, arrangementOf, outlineOf } from './space.mjs';
export { composeDiagram, sampleDiagram, diagramTopics, diagramKinds } from './diagram.mjs';
export { actsOf, summarizeLog, summarizeText, overlap } from './summarize.mjs';
export { compose, interestOf, measuresOf, shapeShare, interestModel } from './compose.mjs';
export { readStory, storyPlan, STORY_RELATIONS } from './story.mjs';
export { writeDocument, readDocument } from './document.mjs';
export { discourseRealiser, discourseTemplates } from './realise.mjs';
export { readByTypes, typedLexicon, nearWords } from './readtypes.mjs';
export { relatedCases, judgeOnRelated, kindChain, ancestorsOf } from './related-cases.mjs';
export { normalise, alternationsOf, wordClassesOf, canonicalise, fillersFrom, readCanonical, splitRunOn } from './alternate.mjs';
export { experiment, ablation } from './experiment.mjs';
export { readEnsemble, defaultReaders, riskCoverage, calibrate } from './ensemble.mjs';
export { signatureOf, chunk, minePatterns, patternReader } from './signature.mjs';
export { joinList, clauseOf, actSentence, renderFrames, phraseOf, narrationOf, realiseFrame, paraphrasesOf } from './say.mjs';
export { genreOf, topicIndex, randomTopics, judgeReply, tabulate, tableText } from './handover.mjs';
export { learnRules, learnFormOperators, formOperator, formEdits, learnFormEdits, familyOf, delexicalise } from './learn.mjs';
export { alignWorlds } from './align.mjs';
export { storyState } from './story-focus.mjs';
export { planner, factStore, PlanLive, readMethods, PLAN_LIMITS, solveChoices } from './plan.mjs';
export { inflectBy, articleFor, morphOf, generate, analyse, fold, splitClitics, dictionary, realise, templateFor } from './morph.mjs';
export { ledgerAppend, ledgerGroups, ledgerKey, stageOf, STAGES } from './ledger.mjs';
export const version = '0.190.0';
/**
 * Which build this is. In the single-file build (docs/sopworld.mjs, docs/sopworld.js)
 * tools/build.mjs fills in `hash`, a fingerprint of the bundled sources, and `date`,
 * the day that fingerprint was first built; from the sources both are null.
 */
export const build = { version, hash: null, date: null };
export { typedWorldFor, schemaOf, fitsSlot, freeTextType } from './typed.mjs';
export { readFrames, senseOf } from './frames.mjs';
export { readText, moodOf, READERS, confidentTypo } from './reader.mjs';
export { listMeant, listSums } from './lists.mjs';
export { readStatement, tellStatement, describeThing, readAboutSelf } from './statements.mjs';
export { cycleOf, cycleAdd, cycleDiff, statedDay, readClock, writeClock, expandRecurrence } from './cycles.mjs';
export { contrastOf } from './contrast.mjs';
export { chooseRewrite } from './rewrite.mjs';
export { loadWorldSet, readTurn, turnScope, openSession, replyFrom, referentOf, countClass, snapshotSet, restoreSet, whyTurn, KIT_REPLIES } from './kit.mjs';
export { clauses, cutPoints } from './clauses.mjs';
export { readRequest, reviseRequest, planRequest, runWorldPlan, sayRequest, requestWires, capabilitiesOf, canBe, declares, honoursKind, stateIds, ASSUMED_SAY, ASSUMED_MAX, REQUEST_SOURCES, REQUEST_KEYS, VALUE_TYPES } from './request.mjs';
export { runPlan, toolBindings, toolTimeline, toolSession, toolCapabilities, nearestAccepted, stateDiff, mirrorState, askWorld, readView, WORLD_QUESTIONS, STATE_FEW, TOOL_ARG_SOURCES } from './tool.mjs';
export { kindLineage, joinedKinds, expectedValue, cutToCount, fillToCount, notAllOneKind, EXPECT_TYPES } from './expect.mjs';
export { repairWords, editCost, worldWords, languageWords, SPELL, SPELL_SOURCES, SPELL_COSTS } from './spell.mjs';
export { factsOf, kindFactsOf, deduceState, induceStyle, induceCorrections, REASONING, KIND_FACTS, REASON_RULES } from './reason.mjs';

export { inspectRequest } from './request-contracts.mjs';

export { retainPointSpace } from './point-space.mjs';
export { calibrateReference } from './reference-calibration.mjs';
