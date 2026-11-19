# baseline: the hand-written control

No external technology. One small bounded search per family, in the style the library
uses today: candidate generation, checks, first/best pick — `pickSpot` grids the
anchor region for `on`/`in`, tries the four sides for `near`, and clusters toward the
page centre when no relation binds; the calendar scans minutes from the earliest
allowed start; storage is first-fit-decreasing over shelves with the pair pre-placed.

158 lines, deterministic, 0 ms per case, 14/14 compiled. Never mechanically invalid
— but its choices are context-shaped: the first free spot, the first free minute,
the first shelf. In the blind agent judging it came last of the four on quality
(8.5/10): the boat lands flush against the lake's top-left and the sun in the
page's top-left corner. Valid, tellOk-sanctioned, and exactly the look of an answer
that satisfied a constraint instead of an intent.

Its role is the reference point: any technology that cannot beat this on generality
is not worth carrying. All three external ones did.
