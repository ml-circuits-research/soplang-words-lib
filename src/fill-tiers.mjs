// std.fill's tiers, strongest first (architecture review finding 5): one home, read by std.fill and by
// resolve. `slip` (a word one letter away from a kind) is the weakest.

export const FILL_TIERS = `@user std.fill.tier name=user rank=1
@focus std.fill.tier name=focus rank=2
@scene std.fill.tier name=scene rank=3
@taught std.fill.tier name=taught rank=3.5
@knowledge std.fill.tier name=knowledge rank=4
@default std.fill.tier name=default rank=5
@slip std.fill.tier name=slip rank=6
`;
