// Baseline control: a hand-written, per-family compiler with small bounded searches.
// This is the "current state of the art" in the library style: candidate generation
// + checks + first/best pick, a little custom code per domain. It sets the bar the
// external technologies have to beat on generality, not on raw speed.
//
// Output: elementary state wires — creation facts (draw.thing, cal.event),
// assignments (store.put) and one state change (x.set) — nothing else.
import { wires, attr, num, of, instanceOf } from '../common/lib.mjs';

const DAY = 480;
const COLOUR = { sun: 'yellow', boat: 'brown', tree: 'green', house: 'red', circle: 'blue', lake: 'blue', rectangle: 'green' };

export const compile = (caseDef) => {
  try {
    const intent = readIntent(caseDef.intent);
    const objects = instanceOf(caseDef.world);
    if (intent.act === 'change') return changeOne(intent, objects);
    if (caseDef.family === 'draw') return makeDraw(intent, objects);
    if (caseDef.family === 'cal') return makeCal(intent, objects);
    if (caseDef.family === 'store') return assignStore(intent, objects);
    return { ok: false, reason: 'unknown-family' };
  } catch (e) {
    return { ok: false, reason: 'error: ' + String(e.message).split('\n')[0] };
  }
};

const sop = (lines) => ({ ok: true, sop: lines.join('\n') + '\n' });
const refuse = (reason, detail) => ({ ok: false, reason: 'no-solution: ' + reason + (detail ? ' (' + detail + ')' : '') });

const readIntent = (text) => {
  const ws = wires(text);
  const option = (k) => of(ws, 'x.option').find((o) => attr(o, 'key') === k);
  return {
    act: attr(of(ws, 'x.intent')[0], 'act'),
    note: attr(of(ws, 'x.intent')[0], 'note'),
    targets: of(ws, 'x.target'),
    rels: of(ws, 'x.rel'),
    option,
  };
};

const facts = (objects, type) => [...objects.values()].filter((t) => t.type === type);
const rectOf = (t) => ({ x: num(t, 'x'), y: num(t, 'y'), w: num(t, 'w'), h: num(t, 'h') });
const byName = (objects, id) => objects.get(id) || [...objects.values()].find((t) => t.attrs.name?.[0] === id);
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// ---- one state change: recolour an existing object ------------------------
function changeOne(intent, objects) {
  const t = intent.targets[0];
  const value = intent.option('colour') && attr(intent.option('colour'), 'value');
  const cands = facts(objects, 'draw.thing').filter((o) =>
    (!attr(t, 'kind') || attr(o, 'kind') === attr(t, 'kind')) &&
    (!attr(t, 'colour') || attr(o, 'colour') === attr(t, 'colour')));
  if (!value || !cands.length) return refuse('change: nothing matches', attr(t, 'kind'));
  return sop([`@n1 x.set object=${cands[0].id} key=colour value=${value}`]);
}

// ---- drawing -------------------------------------------------------------
function makeDraw(intent, objects) {
  const placed = facts(objects, 'draw.thing').map((t) => ({ id: t.id, ...rectOf(t) }));
  const lines = [];
  for (const t of intent.targets.filter((x) => attr(x, 'mode') === 'new')) {
    const kind = attr(t, 'kind'), w = num(t, 'w') || 40, h = num(t, 'h') || 40;
    const count = num(t, 'count') || 1;
    for (let c = 0; c < count; c++) {
      const rel = intent.rels.find((r) => attr(r, 'target') === '$' + t.id);
      const at = pickSpot(objects, placed, rel, w, h);
      if (!at) return refuse('draw', kind + (rel ? ' ' + attr(rel, 'kind') + ' ' + attr(rel, 'anchor') : ''));
      placed.push({ id: 'n' + (lines.length + 1), ...at, w, h });
      lines.push(`@n${lines.length + 1} draw.thing kind=${kind} x=${at.x} y=${at.y} w=${w} h=${h} colour=${COLOUR[kind] || 'green'}`);
    }
  }
  return lines.length ? sop(lines) : refuse('draw: nothing to make');
}

function pickSpot(objects, placed, rel, w, h) {
  const inPage = (x, y) => x >= 0 && y >= 0 && x + w <= 800 && y + h <= 600;
  const disjoint = (x, y, exclude) => !placed.some((q) => q.id !== exclude && overlap({ x, y, w, h }, q));
  if (!rel) { // no relation: cluster around the page centre, shortest distance first
    let best = null;
    for (let y = 0; y + h <= 600; y += 20) for (let x = 0; x + w <= 800; x += 20) {
      if (!inPage(x, y) || !disjoint(x, y)) continue;
      const d = Math.abs(x + w / 2 - 400) + Math.abs(y + h / 2 - 300);
      if (!best || d < best.d) best = { x, y, d };
    }
    return best && { x: best.x, y: best.y };
  }
  const anchor = byName(objects, attr(rel, 'anchor'));
  if (!anchor) return null;
  const a = rectOf(anchor);
  const relKind = attr(rel, 'kind'), gap = num(rel, 'gap') ?? 40;
  if (relKind === 'on' || relKind === 'in') { // inside the anchor; the anchor is no obstacle
    for (let y = a.y; y + h <= a.y + a.h; y += 5)
      for (let x = a.x; x + w <= a.x + a.w; x += 5)
        if (inPage(x, y) && disjoint(x, y, anchor.id)) return { x, y };
    return null;
  }
  if (relKind === 'near') { // disjoint, with a visible gap of at most `gap`
    const d = Math.max(1, Math.round(gap / 2));
    for (const [x, y] of [
      [a.x - w - d, a.y], [a.x + a.w + d, a.y], [a.x - w - d, a.y + a.h - h], [a.x + a.w + d, a.y + a.h - h],
      [a.x, a.y - h - d], [a.x, a.y + a.h + d], [a.x + a.w - w, a.y - h - d], [a.x + a.w - w, a.y + a.h + d],
    ]) if (inPage(x, y) && disjoint(x, y)) return { x, y };
    for (let y = a.y - h - gap; y <= a.y + a.h; y += 5)
      for (let x = a.x - w - gap; x <= a.x + a.w; x += 5) {
        const dx = Math.max(a.x - (x + w), x - (a.x + a.w), 0), dy = Math.max(a.y - (y + h), y - (a.y + a.h), 0);
        if ((dx > 0) !== (dy > 0) && Math.max(dx, dy) <= gap && inPage(x, y) && disjoint(x, y)) return { x, y };
      }
    return null;
  }
  return null;
}

// ---- calendar -------------------------------------------------------------
function makeCal(intent, objects) {
  const person = intent.option('person') ? attr(intent.option('person'), 'value') : 'Ana';
  const busy = facts(objects, 'cal.event').filter((e) => attr(e, 'person') === person)
    .map((e) => ({ s: num(e, 'start'), e: num(e, 'end') }));
  const minStart = intent.option('start-min') ? Number(attr(intent.option('start-min'), 'value')) : 0;
  const lines = [];
  for (const t of intent.targets) {
    const dur = num(t, 'w') || 30, count = num(t, 'count') || 1;
    for (let c = 0; c < count; c++) {
      const s = earliest(busy, dur, minStart);
      if (s === null) return refuse('schedule', 'person=' + person + ' dur=' + dur);
      busy.push({ s, e: s + dur });
      lines.push(`@n${lines.length + 1} cal.event title="meeting" start=${s} end=${s + dur} person=${person}`);
    }
  }
  return lines.length ? sop(lines) : refuse('cal: nothing to schedule');
}
const earliest = (busy, dur, minStart) => {
  for (let s = minStart; s + dur <= DAY; s += 5)
    if (!busy.some((b) => s < b.e && b.s < s + dur)) return s;
  return null;
};

// ---- storage --------------------------------------------------------------
function assignStore(intent, objects) {
  const shelves = facts(objects, 'store.shelf').map((t) => ({ name: attr(t, 'name'), cap: num(t, 'capacity'), used: 0 }));
  const items = facts(objects, 'store.item').map((t) => ({ name: attr(t, 'name'), size: num(t, 'size') }));
  const pair = intent.option('with-pair') ? attr(intent.option('with-pair'), 'value').split(',') : null;
  const find = (nm) => items.find((i) => i.name === nm);
  const lines = [];
  const put = (item, shelf) => { shelf.used += item.size; lines.push(`@n${lines.length + 1} store.put item=${item.name} shelf=${shelf.name}`); };
  if (pair && pair.every(find)) { // the pair shares a shelf, placed first
    const a = find(pair[0]), b = find(pair[1]);
    const shelf = shelves.find((s) => s.used + a.size + b.size <= s.cap);
    if (!shelf) return refuse('pair-capacity', pair.join('+'));
    put(a, shelf); put(b, shelf);
  }
  for (const item of items.filter((i) => !pair?.includes(i.name)).sort((p, q) => q.size - p.size)) { // first-fit decreasing
    const shelf = shelves.find((s) => s.used + item.size <= s.cap);
    if (!shelf) return refuse('capacity', item.name);
    put(item, shelf);
  }
  return lines.length ? sop(lines) : refuse('store: nothing to assign');
}
