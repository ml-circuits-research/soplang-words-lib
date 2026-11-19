# Authoring instructions (variant agents)

These are the rules a variant-authoring agent follows for every seed it is given.
They exist so every future corpus run starts from the same bar — the previous
human-paraphrase corpus failed on two of them, which is why they are stated as
rules with rough quotas instead of example lists.

For every seed: **12–16 variants** (calendar and other thin editors: 16–20), in
three tiers, written to `<area>.jsonl` as one JSON object per line:

```json
{"seedId": "syn-0042", "tier": "human-equivalent", "text": "…", "surfaces": {"0": "<exact substring>", "1": {"vague": "near the top"}}}
```

- `surfaces` maps EVERY constraint number of the seed to what the text actually
  says: the **exact substring** (verbatim, case-sensitive), or `null` to drop an
  OPTIONAL constraint, or `{"vague": "<phrase>"}` to blur an OPTIONAL one.
- The kind value may be renamed only if a person naturally would
  ("a beach umbrella" -> "an umbrella for the beach").

## Tiers per seed

- **human-equivalent (5–6):** same meaning, all constraints kept. Vary verb,
  register, sentence type (imperative, question, wish, spoken fragment, elliptical).
- **human-complex (3–4):** longer; a harmless reason or discourse flow is welcome;
  every constraint still sayable verbatim.
- **human-simplified (4–6):** drop or blur OPTIONAL constraints only; short and
  elliptical forms. NEVER drop or blur `optional: false` constraints, the act,
  or the kind.

## Diversity rules (measured, not vibes — `matrix.mjs` reports these)

- No word starts more than ~2 of your texts for the whole file; no discourse
  marker more than 3 times total. (The first human corpus had "um" exactly once per
  seed because the instructions enumerated fillers. Enumeration kills diversity.)
- Lengths: at least 10% of texts ≤ 3 words, at least 15% ≥ 14 words.
- Sentence shapes: at least 6 questions, at least 6 spoken-fragment style, at
  least 4 polite-indirect per file.
- One editor request per text (compounds are a separate format and batch).

## Hard validity (the assembler rejects, it never repairs)

- Each claimed surface occurs in the text **exactly once** (more occurrences →
  the example is quarantined).
- No new values: no colours/positions/sizes/numbers absent from the seed.
- Digits stay as written in the seed ("120,90" may become "120, 90", never "one
  hundred twenty").

## Self-check before handover

```
node <skill>/scripts/assemble.mjs --seeds agent-seeds/<area>.jsonl \
     --variants variants/<area>.jsonl --out /tmp/<area>-check.jsonl --report /tmp/<area>-report.json
```

Zero rejected and zero quarantined expected. Fix your own variant lines (never the
seeds) until the report is clean, and leave the validated file in place.
