// The actions of kids.tasks on the library's action context. The entries are wires; an
// action finds them, tells new ones, replaces or retracts them, all in one transaction.
const norm = (s) => String(s ?? '').replace(/^"|"$/g, '').toLowerCase().replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ').trim();
const clean = (s) => norm(s).replace(/^(my|the|a|an|some|our)\s+/, '');
const split = (s) => [...new Set(String(s ?? '').replace(/^"|"$/g, '').split(/\s*,\s*|\s+and\s+/).map(clean).filter(Boolean))];
const listName = (raw) => {
  const n = norm(raw).replace(/^(my|the|a|an|our)\s+/, '').replace(/\s+list$/, '');
  if (!n || /^(to do|todo|to-do|tasks?|things to do|chores?)$/.test(n)) return 'to-do';
  if (/^(shopping|shop|grocery|groceries)$/.test(n)) return 'shopping';
  return /^reminders?$/.test(n) ? 'reminders' : n;
};
const q = JSON.stringify;
const within = (a, b) => ` ${a} `.includes(` ${b} `);

/** The entries, oldest first, as { id, list, text, done }; of one list when a name is given. */
const entries = (ctx, list) => ctx.find('kids.tasks.entry')
  .map((w) => ({ id: w.id, list: norm(ctx.val(w, 'list')), text: norm(ctx.val(w, 'text')), done: ctx.val(w, 'progress') === 'done' }))
  .filter((e) => list === undefined || e.list === list);
/** Entries that a text names: the exact ones, else those that contain it or are contained in it. */
const named = (items, text) => {
  const exact = items.filter((e) => e.text === text);
  return exact.length ? exact : items.filter((e) => within(e.text, text) || within(text, e.text));
};
const missing = (value) => ({ status: 'missing', ...(value === undefined ? {} : { value }) });
const ambiguous = (found) => ({ status: 'ambiguous', alternatives: found.map((e) => `${e.text} (${e.list})`) });

function addTo(ctx, list, item) {
  const have = entries(ctx, list).map((e) => e.text);
  const added = split(item).filter((text) => !have.includes(text));
  for (const text of added) ctx.tell(`@task_${ctx.world.seq + 1} kids.tasks.entry list=${q(list)} text=${q(text)} progress=todo`);
  return split(item).length ? { value: list, ...(added.length ? { values: added } : {}) } : missing(list);
}

export const fns = {
  add: (ctx, { item, list }) => addTo(ctx, listName(list), item),
  remind: (ctx, { item }) => addTo(ctx, 'reminders', item),
  remove(ctx, { item, list }) {
    const name = list === undefined ? undefined : listName(list);
    const removed = [];
    let where = name;
    for (const text of split(item)) {
      const found = named(entries(ctx, name), text);
      if (found.length > 1) return ambiguous(found);
      if (!found.length) continue;
      ctx.retract(found[0].id);
      removed.push(found[0].text);
      where = found[0].list;
    }
    return removed.length ? { value: where, values: removed } : missing(name);
  },
  done(ctx, { item, list }) {
    const name = list === undefined ? undefined : listName(list);
    let found = named(entries(ctx, name), clean(item));
    if (!clean(item) || !found.length) return missing(name);
    if (found.some((e) => !e.done)) found = found.filter((e) => !e.done);
    if (found.length > 1) return ambiguous(found);
    if (found[0].done) return { value: found[0].list };
    ctx.fill(found[0].id, 'progress', 'done');
    return { value: found[0].list, values: [found[0].text] };
  },
  check(ctx, { item }) {
    const found = named(entries(ctx), clean(item));
    const done = found.find((e) => e.done);
    if (!found.length) return missing();
    return done ? { value: done.list, values: [done.text] } : { ...missing(found[0].list), values: [found[0].text] };
  },
  has(ctx, { item, list }) {
    const [hit] = named(entries(ctx, listName(list)), clean(item));
    return hit ? { value: hit.list, values: [hit.text] } : missing(listName(list));
  },
  show: (ctx, { list }) => fns.pending(ctx, { list }),
  pending(ctx, { list }) {
    const items = entries(ctx, listName(list)), todo = items.filter((e) => !e.done).map((e) => e.text);
    return items.length ? { value: listName(list), ...(todo.length ? { values: todo } : {}) } : missing(listName(list));
  },
  count: (ctx, { list }) => (entries(ctx, listName(list)).length ? { value: entries(ctx, listName(list)).length } : missing(0)),
  countPending(ctx, { list }) {
    const items = entries(ctx, listName(list));
    return items.length ? { value: items.filter((e) => !e.done).length } : missing(0);
  },
  clear(ctx, { list }) {
    const items = entries(ctx, listName(list));
    for (const e of items) ctx.retract(e.id);
    return items.length ? { value: items.length } : {};
  },
  lists(ctx) {
    const names = [...new Set(entries(ctx).map((e) => e.list))];
    return names.length ? { values: names.map((n) => `${n} (${entries(ctx, n).length})`) } : missing();
  },
  notDone: () => ({}),
};
