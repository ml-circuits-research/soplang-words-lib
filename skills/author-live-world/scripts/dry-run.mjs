// Dry run of author-live-world over the invented example worlds of examples/request-app.mjs: do the declarations
// cover the acts (kinds, actions, honours), which value lists should be joins and which words belong in the language
// world, then the properties generated from the declarations alone (every request key x every kind an act honours x
// world) and the request properties P1-P11 the declarations enable. A control world that honours a key nothing
// takes shows that the check bites. node skills/author-live-world/scripts/dry-run.mjs
import { SKETCH, NOTES, GARDEN, exampleWorld, requestLanguage, requestKinds } from '../../../examples/request-app.mjs';
import { coverageOf, generatedProperties, enabledProperties } from '../../lib/declarations.mjs';
import { smellsOf } from '../../lib/smells.mjs';

const language = await requestLanguage(), kinds = await requestKinds();
const catalog = [language, kinds].filter(Boolean);
if (!language) console.log('(the published worlds cannot be read here: properties run without the catalog\'s scale and kind facts)');
const CONTROL = `${NOTES}\n@h.ctl std.schema.honours world=notes act=make on=layout of=note\n`;
for (const [name, text] of [['sketch', SKETCH], ['notes', NOTES], ['garden', GARDEN], ['control (notes + honours layout, no slot)', CONTROL]]) {
  const w = exampleWorld(text), cov = coverageOf(w), g = generatedProperties(w, { catalog });
  const by = (l) => cov.filter((x) => x.level === l);
  console.log(`-- ${name}`);
  console.log(`  coverage: ${by('error').length} errors, ${by('gap').length} gaps, ${by('advice').length} advice`);
  for (const x of [...by('error'), ...by('gap'), ...by('advice')].slice(0, 6)) console.log(`    ${x.level}: ${x.what}`);
  console.log(`  generated properties (key x kind x world): ${g.held}/${g.cells} hold; ${g.failed.length} silently dropped; ${g.gaps.length} honoured but named (declaration promises what nothing takes)`);
  for (const x of g.gaps.slice(0, 4)) console.log(`    gap: ${x.act} ${x.of} on=${x.on} -> ${x.code}`);
  for (const x of g.failed.slice(0, 4)) console.log(`    FAIL: ${x.act} ${x.of} on=${x.on}: ${x.why}`);
  console.log(`  request properties enabled by the declarations: ${enabledProperties(w).join(' ') || 'none'}`);
  const smells = smellsOf({ world: text });
  console.log(`  smells in the world text: ${smells.length ? [...new Set(smells.map((s) => s.smell))].join(', ') : 'none'}`);
}
