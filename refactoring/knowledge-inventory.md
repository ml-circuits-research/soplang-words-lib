# Published knowledge inventory for the book

Read-only snapshot: `2c94c3d8acb476a272d621d0502a6bc94f0ffb42`. Catalog version: `e490927e0696`.
Reproduce from the library root: `python3 refactoring/audit-knowledge-inventory.py`.

Method: count @ declarations in shards listed by docs/worlds/index.json, checked against each shard wire count. Schema declarations, unpublished directories, generated vocabulary indexes and derived runtime facts are excluded. Counts are declaration occurrences, not unique concepts. Exact name= lookup below is a lexical candidate search, not sense resolution or a coverage verdict. An absent exact name may have a synonym or an inherited realisation. No data is imported or changed.

Published worlds: 36. Shard declarations: 422835. Declarations carrying core.source: 422835. Audit vocabulary: 36 singular names.

## Counts by declaration type

| Type | Occurrences |
|---|---|
| `core.word` | 5436 |
| `k.actions.act` | 19 |
| `k.actions.action` | 192 |
| `k.actions.family` | 20 |
| `k.actions.marking` | 90 |
| `k.actions.member` | 39 |
| `k.actions.role` | 65 |
| `k.actions.similar` | 453 |
| `k.actions.verb` | 331 |
| `k.animals.animal` | 401 |
| `k.animals.class` | 13 |
| `k.attributes.aspect` | 8 |
| `k.attributes.attribute` | 28 |
| `k.attributes.drawn` | 2207 |
| `k.attributes.family` | 19 |
| `k.attributes.found` | 60 |
| `k.attributes.kind` | 26 |
| `k.attributes.narration` | 1188 |
| `k.attributes.number` | 975 |
| `k.attributes.range` | 56 |
| `k.attributes.same` | 3624 |
| `k.attributes.shows` | 192 |
| `k.attributes.switch` | 9 |
| `k.attributes.thing` | 1310 |
| `k.attributes.typical` | 153 |
| `k.attributes.usage` | 338 |
| `k.body.part` | 91 |
| `k.body.sense` | 5 |
| `k.charts.encoding` | 14 |
| `k.charts.kind` | 9 |
| `k.charts.rank` | 45 |
| `k.charts.relationship` | 7 |
| `k.charts.rule` | 15 |
| `k.charts.source` | 5 |
| `k.colours.basic` | 11 |
| `k.colours.colour` | 215 |
| `k.colours.mix` | 25 |
| `k.commonsense.lives` | 32 |
| `k.commonsense.thing` | 1180 |
| `k.diagrams.fill` | 25 |
| `k.diagrams.kind` | 10 |
| `k.diagrams.shape` | 23 |
| `k.diagrams.source` | 10 |
| `k.diagrams.topic` | 3568 |
| `k.expect.amount` | 9 |
| `k.expect.make` | 84 |
| `k.expect.part` | 1163 |
| `k.expect.scale` | 5 |
| `k.faces.canon` | 1 |
| `k.faces.colour` | 45 |
| `k.faces.expression` | 7 |
| `k.faces.part` | 1265 |
| `k.faces.point` | 8938 |
| `k.faces.preset` | 14 |
| `k.faces.slot` | 70 |
| `k.faces.variant` | 528 |
| `k.feelings.feeling` | 30 |
| `k.food.food` | 229 |
| `k.genres.genre` | 10 |
| `k.genres.move` | 46 |
| `k.genres.part` | 44 |
| `k.genres.register` | 6 |
| `k.genres.source` | 24 |
| `k.genres.step` | 100 |
| `k.geo.city` | 1753 |
| `k.geo.continent` | 14 |
| `k.geo.country` | 720 |
| `k.geo.desert` | 75 |
| `k.geo.group` | 8 |
| `k.geo.island` | 1382 |
| `k.geo.lake` | 100 |
| `k.geo.mountain` | 627 |
| `k.geo.range` | 216 |
| `k.geo.region` | 43 |
| `k.geo.river` | 1128 |
| `k.geo.sea` | 94 |
| `k.interest.appraisal` | 4 |
| `k.interest.feature` | 21 |
| `k.interest.measure` | 20 |
| `k.interest.source` | 23 |
| `k.kinds.argument` | 19 |
| `k.kinds.cast` | 213 |
| `k.kinds.constraint` | 6 |
| `k.kinds.form` | 45 |
| `k.kinds.parent` | 14443 |
| `k.kinds.relation` | 1114 |
| `k.kinds.role` | 45 |
| `k.kinds.sensitivity` | 86 |
| `k.kinds.structure` | 7 |
| `k.layouts.anchor` | 225 |
| `k.layouts.joins` | 178 |
| `k.layouts.layout` | 19 |
| `k.layouts.outline` | 50 |
| `k.layouts.outline_point` | 851 |
| `k.layouts.relation` | 96 |
| `k.layouts.slot` | 52 |
| `k.motion.event` | 2 |
| `k.motion.field` | 4 |
| `k.motion.layer` | 4 |
| `k.motion.letters` | 11 |
| `k.motion.rule` | 17 |
| `k.motion.set` | 24 |
| `k.motion.splitter` | 1 |
| `k.motion.step` | 17 |
| `k.motion.viseme` | 7 |
| `k.motion.when` | 12 |
| `k.music.chord` | 209 |
| `k.music.interval` | 16 |
| `k.music.key` | 30 |
| `k.music.note` | 35 |
| `k.music.scale` | 90 |
| `k.objects.keyword` | 1509 |
| `k.objects.object` | 2212 |
| `k.objects.part` | 27904 |
| `k.objects.point` | 271165 |
| `k.objects.stand_in` | 345 |
| `k.parts.called` | 91 |
| `k.parts.inherited` | 370 |
| `k.parts.usual` | 432 |
| `k.parts.whole` | 307 |
| `k.people.given_name` | 2990 |
| `k.people.kind` | 23 |
| `k.people.role` | 127 |
| `k.procedures.arg` | 210 |
| `k.procedures.binding` | 145 |
| `k.procedures.condition` | 50 |
| `k.procedures.goal` | 46 |
| `k.procedures.howto` | 23 |
| `k.procedures.howto_step` | 143 |
| `k.procedures.match` | 124 |
| `k.procedures.method` | 29 |
| `k.procedures.step` | 75 |
| `k.scenes.has` | 1088 |
| `k.scenes.scene` | 61 |
| `k.scenes.thing` | 2398 |
| `k.shapes.shape` | 59 |
| `k.space.body` | 28 |
| `k.space.kind` | 11 |
| `k.story.constraint` | 21 |
| `k.story.element` | 11 |
| `k.story.goal` | 4 |
| `k.story.obstacle` | 16 |
| `k.story.source` | 12 |
| `k.time.before` | 400 |
| `k.time.clock_phrase` | 14 |
| `k.time.cycle` | 9 |
| `k.time.duration` | 35 |
| `k.time.during` | 75 |
| `k.time.hour` | 24 |
| `k.time.month` | 12 |
| `k.time.part_of_day` | 4 |
| `k.time.season` | 4 |
| `k.time.season_in` | 16 |
| `k.time.span` | 5 |
| `k.time.stage` | 16 |
| `k.time.weekday` | 7 |
| `k.time.zone` | 312 |
| `k.units.currency` | 194 |
| `k.units.measure` | 297 |
| `k.units.quantity` | 8 |
| `k.units.unit` | 50 |
| `k.values.comparative` | 94 |
| `k.values.direction` | 18 |
| `k.values.fill` | 5 |
| `k.values.position` | 13 |
| `k.values.reply` | 2 |
| `k.values.scale` | 14 |
| `k.values.set_word` | 19 |
| `k.values.shade` | 6 |
| `k.values.step` | 47 |
| `k.wearables.place` | 15 |
| `k.wearables.wearable` | 105 |
| `k.words.frequency` | 11293 |
| `k.words.sense` | 29520 |
| `w.lang.en.alternation` | 368 |
| `w.lang.en.alternation_case` | 35 |
| `w.lang.en.alternation_family` | 18 |
| `w.lang.en.anaphor` | 14 |
| `w.lang.en.answer` | 3 |
| `w.lang.en.arrangement` | 67 |
| `w.lang.en.aux` | 14 |
| `w.lang.en.calc` | 48 |
| `w.lang.en.cat` | 69 |
| `w.lang.en.choice` | 1 |
| `w.lang.en.class` | 40 |
| `w.lang.en.closed` | 290 |
| `w.lang.en.construction` | 80 |
| `w.lang.en.contraction` | 20 |
| `w.lang.en.contraction.ending` | 6 |
| `w.lang.en.coord.param` | 3 |
| `w.lang.en.coord.sep` | 3 |
| `w.lang.en.copula` | 8 |
| `w.lang.en.correction` | 13 |
| `w.lang.en.correction.lead` | 1 |
| `w.lang.en.count` | 2 |
| `w.lang.en.cue` | 107 |
| `w.lang.en.det` | 33 |
| `w.lang.en.discourse` | 133 |
| `w.lang.en.ellipsis.lead` | 19 |
| `w.lang.en.ellipsis.param` | 6 |
| `w.lang.en.ellipsis.repeat` | 10 |
| `w.lang.en.ellipsis.starter` | 27 |
| `w.lang.en.ellipsis.trail` | 4 |
| `w.lang.en.ending` | 51 |
| `w.lang.en.feeling_reply` | 30 |
| `w.lang.en.fixed` | 153 |
| `w.lang.en.fn` | 61 |
| `w.lang.en.frame` | 499 |
| `w.lang.en.frame_lead` | 10 |
| `w.lang.en.imperative.lead` | 1 |
| `w.lang.en.inflect` | 57 |
| `w.lang.en.irregular` | 257 |
| `w.lang.en.irregular_form` | 807 |
| `w.lang.en.joiner` | 7 |
| `w.lang.en.joiner.keep` | 1 |
| `w.lang.en.lex` | 34 |
| `w.lang.en.mode_map` | 2 |
| `w.lang.en.neg` | 3 |
| `w.lang.en.neg.imperative` | 1 |
| `w.lang.en.neg.imperative.skip` | 1 |
| `w.lang.en.noun.exception` | 31 |
| `w.lang.en.number` | 222 |
| `w.lang.en.numeral` | 13 |
| `w.lang.en.onset` | 19 |
| `w.lang.en.ordinal` | 11 |
| `w.lang.en.other` | 5 |
| `w.lang.en.part` | 2731 |
| `w.lang.en.partitive` | 11 |
| `w.lang.en.phrase` | 81 |
| `w.lang.en.phrasing` | 60 |
| `w.lang.en.prep` | 72 |
| `w.lang.en.prep.time` | 14 |
| `w.lang.en.pron` | 33 |
| `w.lang.en.relpron` | 3 |
| `w.lang.en.reply` | 130 |
| `w.lang.en.role_map` | 58 |
| `w.lang.en.rule` | 108 |
| `w.lang.en.skip` | 7 |
| `w.lang.en.slot` | 35 |
| `w.lang.en.template` | 46 |
| `w.lang.en.variant` | 54 |
| `w.lang.en.wh` | 11 |
| `w.lang.en.word` | 60 |
| `w.lang.ro.class` | 45 |
| `w.lang.ro.count` | 3 |
| `w.lang.ro.det` | 69 |
| `w.lang.ro.ending` | 341 |
| `w.lang.ro.fill` | 29 |
| `w.lang.ro.fn` | 44 |
| `w.lang.ro.fold` | 29 |
| `w.lang.ro.frame` | 48 |
| `w.lang.ro.irregular` | 313 |
| `w.lang.ro.lex` | 6 |
| `w.lang.ro.numeral` | 32 |
| `w.lang.ro.part` | 301 |
| `w.lang.ro.particle` | 48 |
| `w.lang.ro.phrase` | 7 |
| `w.lang.ro.prep` | 31 |
| `w.lang.ro.pron` | 65 |
| `w.lang.ro.reply` | 145 |
| `w.lang.ro.request` | 49 |
| `w.lang.ro.split` | 1 |
| `w.lang.ro.syntax` | 15 |
| `w.lang.ro.template` | 3 |
| `w.lang.ro.vowel` | 1 |

## Replay vocabulary and candidate evidence

Vocabulary is extracted manually from reviews/replay-owner-2026-11-16.md (drawing turns 1–51) and reviews/replay-owner-2026-11-14-15.md (diagram/document/scene turns). Kind changes and parts stay separate: curly is a hair quality; bearded involves a part. Named labels such as results and work done are instance identifiers, not new universal kinds. This list audits the named entities, not every relation or language construction in those files.

| Name | Exact-name candidates; sample evidence |
|---|---|
| duck | k.animals.animal: 3, k.attributes.drawn: 1, k.attributes.same: 1, k.commonsense.thing: 3, k.diagrams.topic: 1, k.kinds.parent: 8, k.objects.object: 1, k.scenes.thing: 1; `k.animals.animal.duck` (docs/worlds/k.animals/shards/birds.sop:8); `k.animals.psys2.duck` (docs/worlds/k.animals/shards/psys2.sop:21) |
| bird | k.animals.class: 1, k.attributes.drawn: 1, k.attributes.number: 1, k.attributes.same: 1, k.attributes.thing: 1, k.commonsense.thing: 2, k.diagrams.topic: 4, k.kinds.parent: 3, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 1, k.parts.inherited: 1, k.parts.whole: 1, k.scenes.thing: 1; `k.animals.class.bird` (docs/worlds/k.animals/shards/classes.sop:7); `k.attributes.drawn.bird` (docs/worlds/k.attributes/shards/drawn-hand.sop:28) |
| swing | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 1, k.kinds.parent: 5, k.objects.object: 1, k.scenes.thing: 1; `k.attributes.drawn.swing` (docs/worlds/k.attributes/shards/drawn-mulberry.sop:838); `k.attributes.same.swing.thing` (docs/worlds/k.attributes/shards/same-s.sop:436) |
| seat | k.attributes.drawn: 1, k.attributes.same: 1, k.diagrams.topic: 1, k.kinds.parent: 36, k.layouts.anchor: 17, k.objects.object: 1, k.objects.part: 18, k.procedures.binding: 1, k.scenes.thing: 1; `k.attributes.drawn.seat` (docs/worlds/k.attributes/shards/drawn-noto.sop:642); `k.attributes.same.seat.thing` (docs/worlds/k.attributes/shards/same-s.sop:116) |
| child | k.attributes.same: 1, k.attributes.thing: 1, k.diagrams.topic: 1, k.faces.preset: 1, k.kinds.parent: 1, k.layouts.slot: 1, k.people.kind: 2, k.scenes.thing: 1; `k.attributes.same.child.person` (docs/worlds/k.attributes/shards/same-c.sop:197); `k.attributes.thing.abilities.child` (docs/worlds/k.attributes/shards/things-abilities.sop:29) |
| grandfather | k.attributes.same: 1, k.diagrams.topic: 1, k.kinds.parent: 1, k.people.kind: 3, k.people.role: 1; `k.attributes.same.grandfather.person` (docs/worlds/k.attributes/shards/same-g.sop:86); `k.diagrams.topic.cc0_1_0.grandfather` (docs/worlds/k.diagrams/shards/topics-cc0-1-0.sop:343) |
| girl | k.attributes.same: 1, k.diagrams.topic: 1, k.faces.preset: 1, k.kinds.parent: 1, k.people.kind: 3; `k.attributes.same.girl.person` (docs/worlds/k.attributes/shards/same-g.sop:45); `k.diagrams.topic.cc0_1_0.girl` (docs/worlds/k.diagrams/shards/topics-cc0-1-0.sop:331) |
| robot | k.attributes.drawn: 1, k.attributes.number: 1, k.attributes.same: 1, k.attributes.thing: 1, k.diagrams.topic: 1, k.faces.preset: 1, k.kinds.parent: 3, k.objects.object: 1, k.parts.usual: 1, k.scenes.thing: 1; `k.attributes.drawn.robot` (docs/worlds/k.attributes/shards/drawn-hand.sop:243); `k.attributes.number.robot` (docs/worlds/k.attributes/shards/numbers-p-z.sop:133) |
| man | k.attributes.same: 1, k.diagrams.topic: 2, k.faces.preset: 1, k.kinds.parent: 2, k.people.kind: 2; `k.attributes.same.man.person` (docs/worlds/k.attributes/shards/same-m.sop:36); `k.diagrams.topic.cc0_1_0.man` (docs/worlds/k.diagrams/shards/topics-cc0-1-0.sop:464) |
| boy | k.attributes.same: 1, k.diagrams.topic: 1, k.faces.preset: 1, k.kinds.parent: 1, k.people.kind: 3; `k.attributes.same.boy.person` (docs/worlds/k.attributes/shards/same-b.sop:252); `k.diagrams.topic.cc0_1_0.boy` (docs/worlds/k.diagrams/shards/topics-cc0-1-0.sop:104) |
| woman | k.attributes.same: 1, k.diagrams.topic: 2, k.faces.preset: 1, k.kinds.parent: 2, k.people.kind: 2; `k.attributes.same.woman.person` (docs/worlds/k.attributes/shards/same-w.sop:108); `k.diagrams.topic.cc0_1_0.woman` (docs/worlds/k.diagrams/shards/topics-cc0-1-0.sop:1147) |
| hair | k.attributes.same: 1, k.body.part: 1, k.faces.part: 14, k.kinds.parent: 5, k.objects.part: 6, k.wearables.place: 1; `k.attributes.same.hair.body_part` (docs/worlds/k.attributes/shards/same-h.sop:6); `k.body.part.hair` (docs/worlds/k.body/shards/core.sop:8) |
| beard | k.faces.part: 6, k.faces.slot: 4, k.kinds.parent: 1, k.layouts.slot: 1, k.objects.part: 2; `k.faces.micah.slot.beard` (docs/worlds/k.faces/shards/micah-slots.sop:8); `k.faces.personas.slot.beard` (docs/worlds/k.faces/shards/personas-slots.sop:11) |
| flower | k.actions.similar: 1, k.attributes.drawn: 1, k.attributes.number: 1, k.attributes.same: 1, k.attributes.thing: 1, k.commonsense.thing: 1, k.diagrams.topic: 3, k.kinds.parent: 5, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 5, k.parts.usual: 1, k.scenes.thing: 1, k.time.stage: 1; `k.actions.similar.flower.bloom` (docs/worlds/k.actions/shards/actions-body-social-nature.sop:169); `k.attributes.drawn.flower` (docs/worlds/k.attributes/shards/drawn-hand.sop:110) |
| petal | k.attributes.number: 1, k.attributes.same: 1, k.kinds.parent: 9, k.objects.part: 1; `k.attributes.number.petal` (docs/worlds/k.attributes/shards/numbers-p-z.sop:38); `k.attributes.same.petal.thing` (docs/worlds/k.attributes/shards/same-p.sop:124) |
| grass | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 1, k.commonsense.thing: 1, k.diagrams.topic: 2, k.kinds.parent: 5, k.objects.object: 1, k.objects.part: 6, k.parts.usual: 1, k.scenes.thing: 1; `k.attributes.drawn.grass` (docs/worlds/k.attributes/shards/drawn-mulberry.sop:408); `k.attributes.same.grass.plant` (docs/worlds/k.attributes/shards/same-g.sop:93) |
| lake | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 1, k.diagrams.topic: 2, k.kinds.parent: 3, k.objects.object: 1, k.objects.part: 1, k.scenes.scene: 1, k.scenes.thing: 1; `k.attributes.drawn.lake` (docs/worlds/k.attributes/shards/drawn-hand.sop:159); `k.attributes.same.lake.thing` (docs/worlds/k.attributes/shards/same-l.sop:17) |
| pond | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 1, k.kinds.parent: 3, k.objects.object: 1, k.scenes.scene: 1, k.scenes.thing: 1; `k.attributes.drawn.pond` (docs/worlds/k.attributes/shards/drawn-mulberry.sop:669); `k.attributes.same.pond.thing` (docs/worlds/k.attributes/shards/same-p.sop:237) |
| water | k.actions.action: 1, k.attributes.same: 1, k.attributes.thing: 1, k.commonsense.thing: 2, k.food.food: 1, k.kinds.parent: 8, k.layouts.anchor: 8, k.layouts.slot: 1, k.objects.object: 1, k.objects.part: 16, k.scenes.thing: 1; `k.actions.action.water` (docs/worlds/k.actions/shards/actions-make-change.sop:48); `k.attributes.same.water.food` (docs/worlds/k.attributes/shards/same-w.sop:36) |
| sky | k.attributes.kind: 1, k.attributes.same: 1, k.attributes.thing: 2, k.diagrams.topic: 1, k.kinds.parent: 3, k.layouts.slot: 1, k.objects.part: 14; `k.attributes.kind.sky` (docs/worlds/k.attributes/shards/attributes.sop:109); `k.attributes.same.sky.thing` (docs/worlds/k.attributes/shards/same-s.sop:211) |
| ground | k.layouts.slot: 1, k.objects.part: 27; `k.layouts.slot.landscape.ground` (docs/worlds/k.layouts/shards/layouts.sop:129); `k.objects.hay.ground` (docs/worlds/k.objects/shards/food-2.sop:232) |
| cloud | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 1, k.commonsense.thing: 1, k.diagrams.topic: 2, k.kinds.parent: 3, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 9, k.scenes.thing: 1; `k.attributes.drawn.cloud` (docs/worlds/k.attributes/shards/drawn-hand.sop:72); `k.attributes.same.cloud.thing` (docs/worlds/k.attributes/shards/same-c.sop:278) |
| sun | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 2, k.attributes.usage: 1, k.commonsense.thing: 1, k.diagrams.topic: 2, k.kinds.parent: 5, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 16, k.parts.whole: 1, k.scenes.thing: 1; `k.attributes.drawn.sun` (docs/worlds/k.attributes/shards/drawn-hand.sop:289); `k.attributes.same.sun.body_in_space` (docs/worlds/k.attributes/shards/same-s.sop:393) |
| house | k.attributes.drawn: 1, k.attributes.number: 1, k.attributes.same: 1, k.attributes.thing: 2, k.commonsense.thing: 1, k.diagrams.topic: 2, k.kinds.parent: 6, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 3, k.parts.inherited: 1, k.parts.usual: 1, k.parts.whole: 1, k.scenes.thing: 1; `k.attributes.drawn.house` (docs/worlds/k.attributes/shards/drawn-hand.sop:141); `k.attributes.number.house` (docs/worlds/k.attributes/shards/numbers-g-o.sop:86) |
| fish | k.animals.class: 1, k.attributes.drawn: 1, k.attributes.number: 1, k.attributes.same: 1, k.attributes.thing: 1, k.commonsense.thing: 1, k.diagrams.topic: 2, k.kinds.parent: 3, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 4, k.parts.whole: 1, k.scenes.thing: 1; `k.animals.class.fish` (docs/worlds/k.animals/shards/classes.sop:8); `k.attributes.drawn.fish` (docs/worlds/k.attributes/shards/drawn-hand.sop:106) |
| water plant | k.objects.stand_in: 1; `k.objects.hand.kind.water_plant` (docs/worlds/k.objects/shards/stand-ins-hand.sop:143) |
| level | No exact name= candidate in the published shards; sense/alias/part lookup still required. |
| node | k.kinds.role: 1; `k.kinds.role.graph.node` (docs/worlds/k.kinds/shards/structures.sop:42) |
| arrow | k.attributes.drawn: 1, k.attributes.same: 2, k.layouts.outline: 1, k.objects.object: 1, k.objects.part: 6, k.scenes.thing: 1, k.shapes.shape: 1; `k.attributes.drawn.arrow` (docs/worlds/k.attributes/shards/drawn-openmoji.sop:8); `k.attributes.same.arrow.shape` (docs/worlds/k.attributes/shards/same-a.sop:92) |
| hexagon | k.attributes.same: 1, k.kinds.parent: 1, k.layouts.outline: 1, k.objects.part: 1, k.shapes.shape: 3; `k.attributes.same.hexagon.shape` (docs/worlds/k.attributes/shards/same-h.sop:96); `k.kinds.parent.hexagon.polygon` (docs/worlds/k.kinds/shards/wordnet-2.sop:877) |
| circle | k.attributes.same: 1, k.kinds.parent: 3, k.layouts.outline: 1, k.objects.part: 1, k.shapes.shape: 1; `k.attributes.same.circle.shape` (docs/worlds/k.attributes/shards/same-c.sop:241); `k.kinds.parent.circle.theater` (docs/worlds/k.kinds/shards/part_of-wordnet-1.sop:951) |
| letter | k.attributes.drawn: 1, k.attributes.same: 1, k.attributes.thing: 1, k.attributes.usage: 1, k.diagrams.topic: 1, k.genres.genre: 1, k.kinds.parent: 3, k.objects.object: 1, k.objects.part: 2, k.scenes.thing: 1; `k.attributes.drawn.letter` (docs/worlds/k.attributes/shards/drawn-mulberry.sop:511); `k.attributes.same.letter.thing` (docs/worlds/k.attributes/shards/same-l.sop:70) |
| story | k.diagrams.topic: 1, k.genres.genre: 1; `k.diagrams.topic.cc0_1_0.story` (docs/worlds/k.diagrams/shards/topics-cc0-1-0.sop:740); `k.genres.genre.story` (docs/worlds/k.genres/shards/story.sop:6) |
| chapter | No exact name= candidate in the published shards; sense/alias/part lookup still required. |
| narrator | No exact name= candidate in the published shards; sense/alias/part lookup still required. |
| frog | k.animals.animal: 3, k.attributes.drawn: 1, k.attributes.number: 1, k.attributes.same: 1, k.attributes.thing: 2, k.commonsense.thing: 4, k.diagrams.topic: 2, k.kinds.parent: 6, k.objects.object: 1, k.parts.usual: 1, k.scenes.thing: 1, k.time.stage: 1; `k.animals.psys2.frog` (docs/worlds/k.animals/shards/psys2.sop:39); `k.animals.animal.frog` (docs/worlds/k.animals/shards/reptiles-and-amphibians.sop:15) |

## Remaining semantic verification

The inventory locates candidates, not fulfilled requirements. For each selected sense, the migration ledger must still verify inherited kinds, required parts/cardinalities, functional support roles, region extents/layers, editable realisations, quality measurements and provenance validity. In particular a swing picture does not establish a seat support relation; a grandfather label does not establish visible distinguishing features; lake/pond/water cannot be merged just because the replay used them for one region. These are explicit open checks, not claims that the source lacks every such fact.
