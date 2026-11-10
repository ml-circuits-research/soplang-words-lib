// Terms are strings:
//   ?x     variable
//   $?p    reference to the wire bound to variable ?p (a pattern or template of the same rule)
//   $id    reference to a known wire
//   other  constant (atom or quoted string); bare wire ids are constants too
//
// A substitution is a persistent linked list of bindings { k, v, next } ending in EMPTY.
// unify returns null when the terms cannot be made equal, so a substitution is always truthy. Binding allocates one small node and shares the rest, which is what makes
// backtracking over many partial matches cheap.

export const EMPTY = Object.freeze({ k: null, v: null, next: null });

export const isVar = (t) => t[0] === '?';
export const isRef = (t) => t[0] === '$';
export const hasVar = (t) => t[0] === '?' || (t[0] === '$' && t[1] === '?');

function lookup(s, k) {
  for (let n = s; n; n = n.next) if (n.k === k) return n.v;
  return undefined;
}

export function walk(t, s) {
  if (t[0] === '?') {
    const b = lookup(s, t);
    return b === undefined ? t : walk(b, s);
  }
  if (t[0] === '$' && t[1] === '?') {
    const v = walk(t.slice(1), s);
    return v[0] === '$' ? v : '$' + v;
  }
  return t;
}

/** Returns an extended substitution, or null when the terms cannot be made equal. */
export function unify(a, b, s = EMPTY) {
  a = walk(a, s);
  b = walk(b, s);
  if (a === b) return s;
  if (a[0] === '?') return { k: a, v: b, next: s };
  if (b[0] === '?') return { k: b, v: a, next: s };
  if (a[0] === '$' && b[0] === '$' && (a[1] === '?' || b[1] === '?')) {
    return unify(a.slice(1), b.slice(1), s);
  }
  return null;
}

/** The variables bound by a substitution. */
export function bound(s) {
  const out = [];
  for (let n = s; n && n.k !== null; n = n.next) out.push(n.k);
  return out;
}
