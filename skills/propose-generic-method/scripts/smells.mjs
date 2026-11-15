// The patch-smell hints over a change in git: node skills/propose-generic-method/scripts/smells.mjs [range] [honest.jsonl] [world ids...]
// range: a git range (default HEAD~1..HEAD); honest.jsonl: known turns (the honest list); world ids: ids generic code
// must not name. Run it in the repository the change is in. Each hint is answered in the review, not obeyed blindly.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { changeOfDiff, smellsOf } from '../../lib/smells.mjs';
import { readHonest } from '../../lib/honest.mjs';
const [range = 'HEAD~1..HEAD', honest, ...worldIds] = process.argv.slice(2);
const change = changeOfDiff(execFileSync('git', ['diff', '-U0', range], { maxBuffer: 1 << 28 }).toString());
const turns = honest ? readHonest(readFileSync(honest, 'utf8')).map((r) => r.turn) : [];
const smells = smellsOf(change, { turns, worldIds });
console.log(`${range}: ${change.files.length} files; ${smells.length} hint(s)`);
for (const s of smells) console.log(`  ${s.smell}: ${s.at}   (${s.why})`);
