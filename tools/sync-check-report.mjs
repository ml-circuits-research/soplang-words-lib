// node --import ./tools/sync-check-report.mjs --test ...: with SOPWORLD_SYNC_CHECK=1 and SOPWORLD_SYNC_CHECK_LOG=<file>,
// each test process appends the number of incremental-versus-full checks it made (src/sync.mjs) to <file>.
import { appendFileSync } from 'node:fs';
const log = process.env.SOPWORLD_SYNC_CHECK_LOG;
if (log) process.on('exit', () => { const c = globalThis.__sopworldSyncChecks; if (c) appendFileSync(log, JSON.stringify(c) + '\n'); });
