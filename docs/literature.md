# The library and the literature

One line per concept: what the library does, the established term and reference, and where the
library differs. SOP Lang's own vocabulary is in the glossary, with its standard equivalents.

| Library | Established term and reference | Difference |
| --- | --- | --- |
| `relatedCases`, `judgeOnRelated`, `generalisationTest` | metamorphic testing (Chen, Cheung and Yiu 1998); behavioural testing with invariance and directional tests, CheckList (Ribeiro et al. 2020); contrast sets (Gardner et al. 2020) | perturbations come from the world's graph of kinds and the language world; the world computes the expected answer (docs/generalisation.md) |
| `delexicalise` | delexicalisation in dialogue state tracking and NLG (Henderson, Thomson and Young 2014; Wen et al. 2015) | values are replaced by their types from the world's typed lexicon, not by slot names of a fixed ontology |
| `resolveEllipsis` | ellipsis and fragment (non-sentential utterance) resolution (Fernández, Ginzburg and Lappin 2007) | only verbless continuations of the previous act, with roles read by type |
| `paraphrasesOf`, `realiseFrame` | paraphrase generation (Madnani and Dorr 2010) | paraphrases are declared by the language world as frame pairs, not learnt from corpora |
| `learnRanking` | learning to rank (Liu 2009) | a search over the order of a few declared criteria (a lexicographic ranking), not a learnt scoring function |
| `calibrate`, after the deprecated alias is removed | probability calibration: Platt scaling (Platt 1999), isotonic regression (Zadrozny and Elkan 2002) | to map `readEnsemble` scores to probabilities for its confidence threshold |
| std.plan | hierarchical task network planning: methods, tasks, decomposition; SHOP2 (Nau et al. 2003) | methods and choice points are world facts; choice points are ranked by std.decide |
| std.compose, summarize, realise, morph | the NLG pipeline (Reiter and Dale 2000): document planning (content determination, document structuring), microplanning (lexicalisation, aggregation, referring expressions), surface realisation | content determination reads narration and interest facts, document structure comes from genres, lexicalisation from the language world's templates and phrasings |
| `alignWorlds` | structure mapping (Gentner 1983); the Structure-Mapping Engine (Falkenhainer, Forbus and Gentner 1989) | two world schemas are aligned by the signatures of their slots, and pairings whose references map to paired types score more (a form of systematicity); what one has and the other lacks is offered, never told |
| std.decide costs | weighted abduction, interpretation as abduction (Hobbs, Stickel, Appelt and Martin 1993) | criteria are compared in order (lexicographically), not summed as one cost |
| tiers | evidence and provenance levels; default reasoning (Reiter 1980); truth maintenance (Doyle 1979) | every value carries a rank of how it got there (told, derived, forced, default, guessed); a derived value takes the weakest tier of its sources; ranks, not probabilities |
| `induce`, `learnRules` | anti-unification, least general generalisation (Plotkin 1970); rule induction in inductive logic programming (Muggleton 1991) | generalisation lifts fillers to their kind in the world before anti-unifying, and rules are admitted on held-out and related cases |
| `signatureOf`, `chunk`, `minePatterns` | supertagging (Bangalore and Joshi 1999); word classes (Brown et al. 1992); cascaded finite-state chunking (Abney 1996; FASTUS, Hobbs et al. 1997) | signatures are types from the world's lexicon; patterns are mined from a corpus and counted for coverage |
| `readEnsemble`, `riskCoverage` | ensembles with reranking (Charniak and Johnson 2005); selective prediction and risk-coverage curves (Geifman and El-Yaniv 2017) | the readers' agreement is the confidence, ranked by std.decide criteria rather than a trained reranker |
| `interestOf` | the appraisal model of interest (Silvia 2005, 2006): novelty-complexity and coping potential | the appraisals, features and weight ranges are a knowledge world (`k.interest`), measured on the facts of a world |
| std.motion | rule-based scheduling of nonverbal behaviour, such as blinks and visemes (the Behavior Markup Language, Kopp et al. 2006) | schedules are world rules over time, not an animation timeline format |

## References

- Abney, S. (1996). Partial parsing via finite-state cascades. *Natural Language Engineering* 2(4).
- Bangalore, S. and Joshi, A. K. (1999). Supertagging: an approach to almost parsing. *Computational Linguistics* 25(2).
- Brown, P. F. et al. (1992). Class-based n-gram models of natural language. *Computational Linguistics* 18(4).
- Charniak, E. and Johnson, M. (2005). Coarse-to-fine n-best parsing and MaxEnt discriminative reranking. ACL.
- Chen, T. Y., Cheung, S. C. and Yiu, S. M. (1998). Metamorphic testing: a new approach for generating next test cases. Technical report HKUST-CS98-01.
- Doyle, J. (1979). A truth maintenance system. *Artificial Intelligence* 12(3).
- Falkenhainer, B., Forbus, K. D. and Gentner, D. (1989). The structure-mapping engine. *Artificial Intelligence* 41(1).
- Fernández, R., Ginzburg, J. and Lappin, S. (2007). Classifying non-sentential utterances in dialogue. *Computational Linguistics* 33(3).
- Gardner, M. et al. (2020). Evaluating models' local decision boundaries via contrast sets. Findings of EMNLP.
- Geifman, Y. and El-Yaniv, R. (2017). Selective classification for deep neural networks. NeurIPS.
- Gentner, D. (1983). Structure-mapping: a theoretical framework for analogy. *Cognitive Science* 7(2).
- Henderson, M., Thomson, B. and Young, S. (2014). Word-based dialog state tracking with recurrent neural networks. SIGDIAL.
- Hobbs, J. R., Stickel, M., Appelt, D. and Martin, P. (1993). Interpretation as abduction. *Artificial Intelligence* 63.
- Hobbs, J. R. et al. (1997). FASTUS: a cascaded finite-state transducer for extracting information from natural-language text. In *Finite-State Language Processing*, MIT Press.
- Kopp, S. et al. (2006). Towards a common framework for multimodal generation: the Behavior Markup Language. IVA.
- Liu, T.-Y. (2009). Learning to rank for information retrieval. *Foundations and Trends in Information Retrieval* 3(3).
- Madnani, N. and Dorr, B. J. (2010). Generating phrasal and sentential paraphrases: a survey of data-driven methods. *Computational Linguistics* 36(3).
- Muggleton, S. (1991). Inductive logic programming. *New Generation Computing* 8(4).
- Nau, D. et al. (2003). SHOP2: an HTN planning system. *Journal of Artificial Intelligence Research* 20.
- Platt, J. (1999). Probabilistic outputs for support vector machines and comparisons to regularized likelihood methods. In *Advances in Large Margin Classifiers*.
- Plotkin, G. D. (1970). A note on inductive generalization. *Machine Intelligence* 5.
- Reiter, E. and Dale, R. (2000). *Building Natural Language Generation Systems*. Cambridge University Press.
- Reiter, R. (1980). A logic for default reasoning. *Artificial Intelligence* 13.
- Ribeiro, M. T., Wu, T., Guestrin, C. and Singh, S. (2020). Beyond accuracy: behavioral testing of NLP models with CheckList. ACL.
- Silvia, P. J. (2005). What is interesting? Exploring the appraisal structure of interest. *Emotion* 5(1).
- Silvia, P. J. (2006). *Exploring the Psychology of Interest*. Oxford University Press.
- Wen, T.-H. et al. (2015). Semantically conditioned LSTM-based natural language generation for spoken dialogue systems. EMNLP.
- Zadrozny, B. and Elkan, C. (2002). Transforming classifier scores into accurate multiclass probability estimates. KDD.
