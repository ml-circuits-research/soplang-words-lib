// std.decide's own criteria (reviewer 01:00: one way to choose; architecture review finding 4): data that
// `choose` reads directly and std.mjs offers as the module std.decide, so no import order changes a choice.

export const DECIDE_TEXT = String.raw`
@k.crit.of core.slot of=std.decide.criterion key=of required=true id=true
@k.crit.n core.slot of=std.decide.criterion key=n required=true id=true kind=integer min=1
@k.crit.name core.slot of=std.decide.criterion key=name required=true
@k.crit.measure core.slot of=std.decide.criterion key=measure required=true
@k.crit.dir core.slot of=std.decide.criterion key=dir required=true enum=hard enum=min enum=max
@k.crit.about core.slot of=std.decide.criterion key=about
@std.decide.c.reading.1 std.decide.criterion of=reading n=1 name=consistent measure=violations dir=hard about="consistent with the world, types fit"
@std.decide.c.reading.2 std.decide.criterion of=reading n=2 name=coverage measure=unread dir=min about="nothing said left unread"
@std.decide.c.reading.3 std.decide.criterion of=reading n=3 name=roles measure=missing dir=min about="every role filled"
@std.decide.c.reading.4 std.decide.criterion of=reading n=4 name=cost measure=cost dir=min about="the fewest and cheapest assumptions (defaults, near words, operators, guesses)"
@std.decide.c.reading.5 std.decide.criterion of=reading n=5 name=specificity measure=specificity dir=max about="the more specific rule or frame"
@std.decide.c.reading.6 std.decide.criterion of=reading n=6 name=prior measure=prior dir=max about="typicality, interest, focus"
@std.decide.c.template.1 std.decide.criterion of=template n=1 name=fills measure=unfilled dir=hard about="every slot filled"
@std.decide.c.template.2 std.decide.criterion of=template n=2 name=fresh measure=used dir=min about="not said before in the text"
@std.decide.c.template.3 std.decide.criterion of=template n=3 name=specificity measure=specificity dir=max about="the template with more slots says more"
@std.decide.c.template.4 std.decide.criterion of=template n=4 name=prior measure=prior dir=max
@std.decide.c.word.1 std.decide.criterion of=word n=1 name=fits measure=misfit dir=hard about="of the slot's type"
@std.decide.c.word.2 std.decide.criterion of=word n=2 name=cost measure=cost dir=min about="synonym 1, kind 2, further kinds 3"
@std.decide.c.word.3 std.decide.criterion of=word n=3 name=prior measure=prior dir=max about="frequency"
@std.decide.c.rule.1 std.decide.criterion of=rule n=1 name=matches measure=misfit dir=hard
@std.decide.c.rule.2 std.decide.criterion of=rule n=2 name=specificity measure=specificity dir=max about="more literal words"
@std.decide.c.rule.3 std.decide.criterion of=rule n=3 name=order measure=n dir=min about="the order the language world tells"
@std.decide.c.parse.1 std.decide.criterion of=parse n=1 name=priority measure=prio dir=max about="the grammar rule's priority"
@std.decide.c.parse.2 std.decide.criterion of=parse n=2 name=specificity measure=lits dir=max about="more literal words"
@std.decide.c.parse.3 std.decide.criterion of=parse n=3 name=size measure=size dir=min about="the smaller tree"
@std.decide.c.parse.4 std.decide.criterion of=parse n=4 name=depth measure=depth dir=min
@std.decide.c.score.1 std.decide.criterion of=score n=1 name=consistent measure=consistent dir=hard about="the order world.score ranks readings in (RANKING)"
@std.decide.c.score.2 std.decide.criterion of=score n=2 name=referents measure=referents dir=min
@std.decide.c.score.3 std.decide.criterion of=score n=3 name=lacks measure=lacks dir=min
@std.decide.c.score.4 std.decide.criterion of=score n=4 name=words measure=words dir=min
@std.decide.c.score.5 std.decide.criterion of=score n=5 name=assumes measure=assumes dir=min
@std.decide.c.ensemble.1 std.decide.criterion of=ensemble n=1 name=coverage measure=unread dir=min about="content words left unconsumed by its best reader: an incomplete reading loses first (reviewer 03:20)"
@std.decide.c.ensemble.2 std.decide.criterion of=ensemble n=2 name=agreement measure=agreement dir=max about="how many readers proposed it"
@std.decide.c.world.1 std.decide.criterion of=world n=1 name=coverage measure=coverage dir=max about="the words of the request the world's reading consumes (reviewer 03:20)"
@std.decide.c.world.3 std.decide.criterion of=world n=3 name=priority measure=priority dir=max
@std.decide.c.ensemble.3 std.decide.criterion of=ensemble n=3 name=cost measure=cost dir=min about="the assumptions of its cheapest reader"
@std.decide.c.ensemble.4 std.decide.criterion of=ensemble n=4 name=specificity measure=specificity dir=max
@std.decide.c.fact.1 std.decide.criterion of=fact n=1 name=unsaid measure=said dir=hard
@std.decide.c.fact.2 std.decide.criterion of=fact n=2 name=about_topic measure=aboutTopic dir=max about="a fact about the topic itself before one that only names it among its values"
@std.decide.c.fact.3 std.decide.criterion of=fact n=3 name=interest measure=interest dir=max about="k.interest"
@std.decide.c.frame.1 std.decide.criterion of=frame n=1 name=score measure=score dir=max about="a language frame's priority with the words of known sense (readFrames)"
@std.decide.c.related.1 std.decide.criterion of=related n=1 name=valid measure=valid dir=max about="a related case the world answers and reads back first (relatedCases)"
@std.decide.c.related.2 std.decide.criterion of=related n=2 name=distance measure=distance dir=min
@std.decide.c.alignment.1 std.decide.criterion of=alignment n=1 name=fit measure=fit dir=max about="the share of slots that match, references to paired types counting a quarter more (alignWorlds)"
@std.decide.c.contrast.1 std.decide.criterion of=contrast n=1 name=rare measure=share dir=min about="the kind's value fewest of its siblings hold (contrastOf)"
`;
