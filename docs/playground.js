// Playground: one world in the page, driven by the single-file build.
import { World, format, solvers, version } from './sopworld.mjs';
import * as worlds from './worlds.mjs';
import { scheduling, instance } from './scheduling.mjs';

const presets = {
  meetings: {
    label: 'Meetings: completion in a dialogue',
    matrix: worlds.meetings,
    facts: '@m0 meeting room=$big time=10:00 people=8 duration=60\n@m1 meeting people=9',
    query: '?c confirmation for=?m',
    goal: '',
  },
  mechanics: {
    label: 'Mechanics: deduction with units',
    matrix: worlds.mechanics,
    facts: '@b1 body mass=2kg\n@f1 force on=$b1 magnitude=10N\n@a1 acceleration of=$b1',
    query: '?a acceleration of=?body magnitude=?value',
    goal: '',
  },
  garden: {
    label: 'Garden: abduction',
    matrix: worlds.garden,
    facts: '@now season name=summer',
    query: '?w wet place=?p',
    goal: '?g slippery place=lawn',
  },
  clinic: {
    label: 'Clinic: diagnosis of an open key',
    matrix: worlds.clinic,
    facts: '@ion patient name=ion',
    query: '?s symptom of=?who kind=?kind',
    goal: '?a symptom of=$ion kind=cough\n?b symptom of=$ion kind=fever',
  },
  plant: {
    label: 'Plant: digital twin',
    matrix: worlds.plant,
    facts: '@t1 tank capacity=100\n@r1 reading of=$t1 level=95',
    query: '?a alarm of=?tank kind=?kind',
    goal: '',
  },
  procedure: {
    label: 'Procedure: what is ready next',
    matrix: worlds.procedure,
    facts: '@mix step name=mix first=true\n@bake step name=bake after=$mix\n@cool step name=cool after=$bake',
    query: '?r ready step=?s',
    goal: '',
  },
  scheduling: {
    label: 'Scheduling: a search problem for the solvers',
    matrix: scheduling,
    facts: instance({ meetings: 8, rooms: 3 }),
    query: '?m meeting room=?room time=?time',
    goal: '',
  },
};

const $ = (id) => document.getElementById(id);
const ui = {
  preset: $('preset'), solver: $('solver'), matrix: $('matrix'), facts: $('facts'), query: $('query'),
  state: $('state'), open: $('open'), log: $('log'), status: $('status'),
};
let world = null;

function note(title, value, ok = true) {
  const entry = document.createElement('div');
  entry.className = `entry ${ok ? 'good' : 'bad'}`;
  const head = document.createElement('strong');
  head.textContent = title;
  const body = document.createElement('pre');
  body.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 1);
  entry.append(head, body);
  ui.log.prepend(entry);
}

function describe(r) {
  if (!r.ok) return r.violations.map((v) => `${v.kind}${v.rule ? ' ' + v.rule : ''}: ${v.why || `${v.id || ''} ${v.key || ''} ${v.value || ''}`.trim()}${v.support ? `  (rests on ${v.support.join(', ')})` : ''}`).join('\n');
  const parts = [];
  if (r.added?.length) parts.push(`added ${r.added.join(', ')}`);
  if (r.derived?.length) parts.push(`derived ${r.derived.length} wire(s)`);
  if (r.filled?.length) parts.push('filled ' + r.filled.map((f) => `${f.id}.${f.key}=${f.value}${f.kind ? ` (${f.kind})` : f.via ? ` via ${f.via}` : ''}`).join(', '));
  if (r.removed?.length) parts.push(`removed ${r.removed.join(', ')}`);
  if (r.revised?.length) parts.push('assumptions dropped ' + r.revised.map((f) => `${f.id}.${f.key}=${f.value}`).join(', '));
  return parts.join('\n') || 'nothing changed';
}

function render() {
  ui.state.textContent = world.toSOP({ provenance: true }) || '(no facts yet)';
  ui.open.replaceChildren();
  const next = world.next();
  const row = (text, options, onPick) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = text;
    li.append(label);
    for (const value of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = value;
      b.addEventListener('click', () => onPick(value));
      li.append(b);
    }
    ui.open.append(li);
  };
  for (const f of next.fills) row(`${f.id}.${f.key} ${f.kind === 'forced' ? 'must be' : 'is assumed to be'}`, [f.value], (v) => act(`fill ${f.id}.${f.key}`, () => world.fill(f.id, f.key, v, { via: f.kind === 'forced' ? 'core.complete' : 'core.default' })));
  for (const q of next.questions) {
    const about = q.attrs.about[0].slice(1), key = q.attrs.seek[0];
    row(`${about}.${key}? ${q.attrs.text ? q.attrs.text[0].slice(1, -1) : ''}`, q.attrs.option || [], (v) => act(`answer ${about}.${key}`, () => world.answer(q, v)));
  }
  for (const d of next.dead) row(`${d.id}.${d.key} has no consistent value`, [], () => {});
  if (!ui.open.children.length) row('nothing is open', [], () => {});
  ui.status.textContent = `sopworld ${version} · ${world.wires.size} facts · ${world.schema.size} matrix wires · solver ${world.options.solver.name}`;
}

function act(title, fn) {
  try {
    const r = fn();
    note(title, describe(r), r.ok !== false);
  } catch (e) {
    note(title, e.message, false);
  }
  render();
}

function start() {
  world = new World({ library: worlds.library, solver: solvers[ui.solver.value]() });
  ui.log.replaceChildren();
  act('load matrix', () => world.tell(ui.matrix.value));
}

function choose(name) {
  const p = presets[name];
  ui.matrix.value = p.matrix.trim();
  ui.facts.value = p.facts;
  ui.query.value = p.goal || p.query;
  ui.query.dataset.query = p.query;
  ui.query.dataset.goal = p.goal;
  start();
}

for (const [name, p] of Object.entries(presets)) ui.preset.append(new Option(p.label, name));
ui.preset.addEventListener('change', () => choose(ui.preset.value));
ui.solver.addEventListener('change', start);
$('load').addEventListener('click', start);
$('tell').addEventListener('click', () => act('tell', () => world.tell(ui.facts.value)));
$('complete').addEventListener('click', () => act('complete', () => {
  const c = world.complete({ defaults: true });
  return { ok: true, filled: c.filled };
}));
$('solve').addEventListener('click', () => {
  const t = performance.now();
  const r = world.solveReport();
  note(`solve: ${r.status} in ${(performance.now() - t).toFixed(0)} ms`, { assignment: (r.assignment || []).map((f) => `${f.id}.${f.key}=${f.value}`), stats: r.stats }, r.status !== 'unsat');
});
$('choose').addEventListener('click', () => act('choose a full solution', () => {
  const c = world.complete({ defaults: true, choose: true });
  return { ok: true, filled: c.filled };
}));
$('ask').addEventListener('click', () => {
  try { note('ask', world.ask(ui.query.value)); } catch (e) { note('ask', e.message, false); }
});
$('abduce').addEventListener('click', () => {
  try { note('abduce', world.abduce(ui.query.value).map((e) => ({ assume: e.text.split('\n'), cost: e.cost }))); } catch (e) { note('abduce', e.message, false); }
});
$('retract').addEventListener('click', () => act(`retract ${ui.query.value.trim()}`, () => world.retract(ui.query.value.trim())));
$('explain').addEventListener('click', () => note(`explain ${ui.query.value.trim()}`, world.explain(ui.query.value.trim()) || 'no such wire'));

choose('meetings');
window.playground = { get world() { return world; }, presets };
