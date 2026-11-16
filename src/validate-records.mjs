import { str } from './parser.mjs';

// Explicit final-state invariants may read other records. They run uncached even
// when the matching parent itself was not touched by the transaction.
export function validateRecords(world, res) {
  for (const d of world._compiled().validators) {
    world._b.tick('validate');
    const fail = (id, why) => res.violations.push({ kind: 'validation', rule: d.id, ...(id ? { id } : {}), fn: d.fn, why });
    const fn = world.fns[d.fn];
    if (typeof fn !== 'function') { fail(null, 'validator function is not registered'); continue; }
    for (const record of world.ofType(d.on)) {
      world._b.tick('validate');
      const stamp = world.stamp;
      world._runningValidator = d.id;
      world._validatorMutation = false;
      let result, error;
      try {
        result = fn(['$' + record.id], world, { tick: () => world._b.tick('validate') });
      } catch (e) {
        if (e === world._b.signal) throw e;
        error = e instanceof Error ? e.message : String(e);
      } finally {
        world._runningValidator = null;
      }
      if (world._validatorMutation || world.stamp !== stamp) fail(record.id, 'validator attempted to mutate the world');
      else if (error !== undefined) fail(record.id, `validator threw: ${error}`);
      else if (result !== true) {
        if (result instanceof Promise) result.catch(() => {}); // reject async results without unhandled rejection
        fail(record.id, result === false ? (d.why ? str(d.why) : 'validator returned false') : 'validator must synchronously return a boolean');
      }
    }
  }
}
