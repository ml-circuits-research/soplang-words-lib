// The patch-smell checklist (skills/propose-generic-method/SKILL.md) as hints over a change. A hint is not a verdict:
// each one found is answered in the review ("generic because ..." or "a patch: list the case instead"). Heuristics
// only; the checklist questions that no regex can answer are asked by the reviewer.

import { quotes } from './honest.mjs';
import { VALUE_TYPES, REQUEST_KEYS } from '../../src/index.mjs';

/** Names generic code may compare with: the request keys and the acts of std.acts are declarations, not cases. */
export const VOCABULARY = Object.freeze([...REQUEST_KEYS, 'make', 'remove', 'change', 'place', 'connect', 'group', 'ungroup', 'pick', 'ask', 'copy', 'send', 'show', 'teach', 'forget', 'complete', 'save', 'load', 'undo', 'redo', 'yes', 'no', 'not_all']);

export const SMELLS = Object.freeze({
  sentence: 'a literal sentence (or a run of three words of a known turn) in code or in a world',
  world_id: 'a world id in generic code',
  special_case: 'a special case on one literal value (if x === "...")',
  one_support: 'a rule or operator with one support',
  hides_unread: 'a fallback that hides an unread request (unread cleared, a default act)',
  test_edited: 'a test edited: assertions removed or expectations changed',
  value_list: 'a value list the knowledge already has (join by key instead)',
  literal_operator: 'an operator with more literal words than variables (a phrase, not a form)',
  no_anchor: 'an operator with no literal word: it rewrites any sentence of that length',
  invents_content: 'an operator whose result has a content word its source lacks (fitted to its pairs)',
  fused_filler: 'a filler fused into a form (split it: a skip word of the language world, and the form alone)',
});

const strings = (code) => [...String(code).matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);

/**
 * Hints over a change: `{ code, world, tests, rules, operators }`, all optional.
 * - `code`: added source lines (host or library code); `world`: added SOP text;
 * - `tests`: `{ removed: n, changed: n }` assertion lines removed / changed in test files;
 * - `rules`: `[{ name, support }]`; `operators`: `[{ from, to, support }]`;
 * - `turns`: known turns (failing cases, probes); `worldIds`: the ids of the worlds in play (never in generic code);
 * - `vocabulary`: names generic code may compare with (default `VOCABULARY`); `skip`: the language world's skip words.
 * Returns `[{ smell, why, at }]`.
 */
export function smellsOf(change, { turns = [], worldIds = [], vocabulary = VOCABULARY, skip = [] } = {}) {
  const out = [], hint = (smell, at) => out.push({ smell, why: SMELLS[smell], at });
  const code = String(change.code ?? '').replace(/\/\*[\s\S]*?\*\//g, '').split('\n') // comments are not code
    .filter((l) => !/^\s*(\/\/|\*|\/\*\*?)/.test(l)).map((l) => l.replace(/(^|[\s;,){}])\/\/.*$/, '$1')).join('\n');
  for (const s of strings(code)) {
    if (turns.some((t) => quotes(t, s))) hint('sentence', s); // messages are sentences too: in code only a known turn's words count
    if (worldIds.some((id) => s === id || s.startsWith(`${id}.`))) hint('world_id', s);
  }
  for (const m of String(code).matchAll(/\/((?:\\.|[^/\n])*?(?:[a-z]+ ){2,}[a-z]+(?:\\.|[^/\n])*)\/[gimsuy]*/g)) hint('sentence', m[1]); // a phrase in a regular expression
  const turnWords = new Set(turns.flatMap((t) => String(t).toLowerCase().match(/[\p{L}']{4,}/gu) ?? []));
  for (const m of String(code).matchAll(/===?\s*(['"`])([^'"`]+)\1/g)) { // a phrase, or a word of a known turn that is not the library's own vocabulary
    const v = m[2];
    if (/\s/.test(v.trim()) || (turnWords.has(v.toLowerCase()) && !vocabulary.includes(v))) hint('special_case', v);
  }
  if (/\bunread\s*=\s*\[\s*\]|\bunread\.length\s*=\s*0|\bunread\s*:\s*\[\s*\]/.test(code)) hint('hides_unread', 'unread cleared');
  if (/\bact\s*(\?\?|\|\|)\s*['"`]/.test(code)) hint('hides_unread', 'a default act');
  const world = change.world ?? '';
  for (const s of strings(String(world).replace(/\b(doc|label|title)="(?:\\.|[^"])*"/g, ''))) /* documentation strings are not patterns */ if (s.split(/\s+/).filter(Boolean).length >= 4 || turns.some((t) => quotes(t, s))) hint('sentence', s);
  for (const line of String(world).split('\n')) {
    const m = /\bcore\.slot\b.*\bkey=(\S+)/.exec(line);
    if (m && VALUE_TYPES[m[1]] && /\benum=/.test(line)) hint('value_list', `${m[1]}: ${VALUE_TYPES[m[1]].join(' / ')}`);
  }
  if (change.tests?.removed || change.tests?.changed) hint('test_edited', `${change.tests.removed ?? 0} removed, ${change.tests.changed ?? 0} changed`);
  for (const r of change.rules ?? []) if ((Array.isArray(r.support) ? r.support.length : r.support) < 2) hint('one_support', r.name ?? r.from ?? '?');
  for (const o of change.operators ?? []) {
    const toks = String(o.from).split(/\s+/), vars = toks.filter((t) => /^[{<]/.test(t)).length;
    if ((Array.isArray(o.support) ? o.support.length : o.support) < 2) hint('one_support', o.from);
    if (toks.length - vars > Math.max(1, vars)) hint('literal_operator', o.from);
    const lit = (x) => String(x).split(/\s+/).filter((t) => t && !/^[{<]/.test(t)), stem = (t) => t.replace(/(es|s)$/, '');
    const fromStems = new Set(lit(o.from).map(stem));
    if (lit(o.to ?? '').some((t) => !fromStems.has(stem(t)) && !vocabulary.includes(t))) hint('invents_content', `${o.from} -> ${o.to}`);
    if (lit(o.from).some((t) => skip.includes(t))) hint('fused_filler', o.from);
    if (!lit(o.from).length && !String(o.from).includes('<')) hint('no_anchor', o.from);
  }
  return out;
}

/** A change from a unified diff (git diff): added code and world lines by file, assertion lines removed in tests. */
export function changeOfDiff(diff) {
  const change = { code: '', world: '', tests: { removed: 0, changed: 0 }, files: [] };
  let file = null;
  for (const line of String(diff).split('\n')) {
    const f = /^\+\+\+ b\/(.*)$/.exec(line);
    if (f) { file = f[1]; change.files.push(file); continue; }
    if (!file || line.startsWith('+++') || line.startsWith('---')) continue;
    const isTest = /(^|\/)(test|tests)\/|\.test\.mjs$|tests\.sop$/.test(file);
    if (line.startsWith('-') && isTest && /assert|expect|\bshould\b/.test(line)) change.tests.removed++;
    if (!line.startsWith('+')) continue;
    if (/\.(sop|sop\.md)$/.test(file)) change.world += line.slice(1) + '\n';
    else if (/\.m?js$/.test(file) && !isTest && !/^(docs|examples)\//.test(file)) change.code += line.slice(1) + '\n';
  }
  return change;
}
