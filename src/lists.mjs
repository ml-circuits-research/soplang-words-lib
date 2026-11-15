// The sums of a list, computed, never stored (reviewer 09:20 L3; w.list v3: "the total of a list, what is left,
// the change, whether it can be bought"; real turns: "I want a puzzle and I pay 10 lei. What is the change?").
// Language-free and shape-light: the list and entry types and their keys are options, with w.list's names as
// defaults; prices are the application's data (`priceOf`), when an entry carries none.

import { valueText } from './parser.mjs';

const num = (v) => { if (v === undefined || v === null || valueText(v) === '') return undefined; const n = Number(valueText(v)); return Number.isFinite(n) ? n : undefined; };

/**
 * The list a request means when it names none: the one called `name`, else the only list, else the one made last
 * (of `sort` when given). Options: `type` ('w.list.list'), `name`, `sort`. Returns a wire or null.
 */
export function listMeant(world, { type = 'w.list.list', name, sort } = {}) {
  const all = world.ofType(type).filter((l) => !sort || valueText(l.attrs.sort?.[0]) === sort);
  if (name !== undefined) return all.find((l) => valueText(l.attrs.name?.[0]).toLowerCase() === String(name).toLowerCase()) ?? null;
  return all.length ? all[all.length - 1] : null;
}

/**
 * The sums of a list: { list, entries: [{ id, text, quantity, price, amount }], total, missing: [entries with no
 * price], currency, budget?, left?, affordable?, tendered?, change?, short?, why? }. An entry's amount is quantity
 * (1 when none) × price (its own, else `priceOf(entry)`); only open entries count unless `all`. `change` is
 * tendered − total, `short` what is missing when less was tendered; `left` is budget − total. With an entry
 * priced by nothing the total is not known (`why`). Options: `itemType` ('w.list.item'), `link` ('list'),
 * `priceOf(entry) -> number | undefined`, `all`.
 */
export function listSums(world, list, { itemType = 'w.list.item', link = 'list', priceOf, all = false } = {}) {
  const L = typeof list === 'string' ? world.get(list.replace(/^\$/, '')) : list;
  if (!L) return { why: 'no list' };
  const entries = world.ofType(itemType).filter((e) => (e.attrs[link] || []).some((v) => valueText(v).replace(/^\$/, '') === L.id) && (all || valueText(e.attrs.status?.[0] ?? 'open') !== 'done'))
    .map((e) => {
      const quantity = num(e.attrs.quantity?.[0]) ?? 1, price = num(e.attrs.price?.[0]) ?? (priceOf ? priceOf(e) : undefined);
      return { id: e.id, text: valueText(e.attrs.text?.[0] ?? e.id), quantity, price, amount: price === undefined ? undefined : +(quantity * price).toFixed(2) };
    });
  const missing = entries.filter((x) => x.amount === undefined);
  const out = { list: L.id, entries, missing: missing.map((x) => x.text), currency: valueText(L.attrs.currency?.[0] ?? '') || null };
  if (missing.length) return { ...out, total: null, why: `no price for ${missing.map((x) => x.text).join(', ')}` };
  out.total = +entries.reduce((s, x) => s + x.amount, 0).toFixed(2);
  const budget = num(L.attrs.budget?.[0]), tendered = num(L.attrs.tendered?.[0]);
  if (budget !== undefined) Object.assign(out, { budget, left: +(budget - out.total).toFixed(2), affordable: out.total <= budget });
  if (tendered !== undefined) Object.assign(out, tendered >= out.total ? { tendered, change: +(tendered - out.total).toFixed(2) } : { tendered, short: +(out.total - tendered).toFixed(2), why: `${+(out.total - tendered).toFixed(2)} short` });
  return out;
}
