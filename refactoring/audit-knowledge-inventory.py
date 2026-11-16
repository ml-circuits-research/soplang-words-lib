"""Read-only declaration audit; run from the library repository root."""
import collections
import json
import re
import subprocess
from pathlib import Path

root = Path('../sop-knowledge-worlds')
revision = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
catalog = json.loads((root / 'docs/worlds/index.json').read_text())
# Named concepts extracted from the two owner replay documents, singularised.
# This is an explicit audit vocabulary, not an automatic semantic parser.
names = ['duck', 'bird', 'swing', 'seat', 'child', 'grandfather', 'girl', 'robot',
         'man', 'boy', 'woman', 'hair', 'beard', 'flower', 'petal', 'grass',
         'lake', 'pond', 'water', 'sky', 'ground', 'cloud', 'sun', 'house',
         'fish', 'water plant', 'level', 'node', 'arrow', 'hexagon', 'circle',
         'letter', 'story', 'chapter', 'narrator', 'frog']
counts = collections.Counter()
hits = {name: [] for name in names}
world_counts = {}
source_count = 0
for world in catalog['worlds']:
    total = 0
    for shard in world['shards']:
        path = Path('docs/worlds') / shard['path']
        found = 0
        for number, line in enumerate((root / path).read_text().splitlines(), 1):
            match = re.match(r'^@(\S+)\s+(\S+)(?:\s|$)', line)
            if not match:
                continue
            identifier, kind = match.groups()
            counts[kind] += 1
            found += 1
            source_count += bool(re.search(r'\bcore\.source=', line))
            name_match = re.search(r'(?:^|\s)name=(?:"([^"]*)"|([^\s]+))', line)
            name = next((v for v in name_match.groups() if v is not None), '') if name_match else ''
            if name in hits and not kind.startswith('core.'):
                hits[name].append((kind, identifier, str(path), number))
        assert found == shard['wires'], (path, found, shard['wires'])
        total += found
    world_counts[world['id']] = total
print('# Published knowledge inventory for the book')
print(f'\nRead-only snapshot: `{revision}`. Catalog version: `{catalog["version"]}`.')
print('Reproduce from the library root: `python3 refactoring/audit-knowledge-inventory.py`.')
print('\nMethod: count @ declarations in shards listed by docs/worlds/index.json, checked against each shard wire count. Schema declarations, unpublished directories, generated vocabulary indexes and derived runtime facts are excluded. Counts are declaration occurrences, not unique concepts. Exact name= lookup below is a lexical candidate search, not sense resolution or a coverage verdict. An absent exact name may have a synonym or an inherited realisation. No data is imported or changed.')
print(f'\nPublished worlds: {len(catalog["worlds"])}. Shard declarations: {sum(counts.values())}. Declarations carrying core.source: {source_count}. Audit vocabulary: {len(names)} singular names.')
print('\n## Counts by declaration type\n\n| Type | Occurrences |\n|---|---|')
for kind, count in sorted(counts.items()):
    print(f'| `{kind}` | {count} |')
print('\n## Replay vocabulary and candidate evidence\n')
print('Vocabulary is extracted manually from reviews/replay-owner-2026-11-16.md (drawing turns 1–51) and reviews/replay-owner-2026-11-14-15.md (diagram/document/scene turns). Kind changes and parts stay separate: curly is a hair quality; bearded involves a part. Named labels such as results and work done are instance identifiers, not new universal kinds. This list audits the named entities, not every relation or language construction in those files.')
print('\n| Name | Exact-name candidates; sample evidence |\n|---|---|')
for name, matches in hits.items():
    kinds = collections.Counter(m[0] for m in matches)
    samples = '; '.join(f'`{m[1]}` ({m[2]}:{m[3]})' for m in matches[:2])
    summary = ', '.join(f'{k}: {n}' for k,n in sorted(kinds.items()))
    print(f'| {name} | {summary}; {samples} |' if matches else f'| {name} | No exact name= candidate in the published shards; sense/alias/part lookup still required. |')
print('\n## Remaining semantic verification\n\nThe inventory locates candidates, not fulfilled requirements. For each selected sense, the migration ledger must still verify inherited kinds, required parts/cardinalities, functional support roles, region extents/layers, editable realisations, quality measurements and provenance validity. In particular a swing picture does not establish a seat support relation; a grandfather label does not establish visible distinguishing features; lake/pond/water cannot be merged just because the replay used them for one region. These are explicit open checks, not claims that the source lacks every such fact.')
