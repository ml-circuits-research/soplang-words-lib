// A budget bounds the work of one call. Every loop of the library whose length depends on
// the data ticks it; when it runs out the call stops, the world is put back as it was,
// and the caller gets a `budget` violation instead of a hang.
//
// Steps are counted, not timed, so the same call on the same world always stops at the
// same place. `ms` adds an optional wall-clock limit, checked every 1024 steps.

export const SITES = [
  'match',      // candidates tried while matching patterns (joins)
  'chase',      // wires taken from the agenda and rule firings applied
  'negation',   // rules with negation, a selector or an aggregate evaluated again
  'aggregate',  // matches fed to an aggregate
  'fluent',     // events applied to a state
  'withdraw',   // wires, values and firings taken back
  'validate',   // wires checked against slots and denies
  'complete',   // candidate values tried by suggest, next and complete
  'ground',     // deny matches turned into nogoods for the solvers
  'solve',      // search steps of the solvers
  'abduce',     // goals expanded and explanations verified
  'induce',     // alignments of examples tried
  'interpret',  // placements of words tried by interpret
];

export class Budget {
  constructor(steps = 5000000, ms = 0) {
    this.limit = steps;
    this.steps = 0;
    // a literal, not built from SITES: a budget is made for every call and this keeps it cheap
    this.sites = { match: 0, chase: 0, negation: 0, aggregate: 0, fluent: 0, withdraw: 0, validate: 0, complete: 0, ground: 0, solve: 0, abduce: 0, induce: 0, interpret: 0 };
    this.started = Date.now();
    this.deadline = ms ? this.started + ms : 0;
    this.site = null;                 // where it ran out
    this.signal = { budget: this };   // thrown inside the library, never seen outside it
  }

  tick(site) {
    this.sites[site]++;
    if (++this.steps > this.limit || (this.deadline && (this.steps & 1023) === 0 && Date.now() > this.deadline)) {
      this.site = site;
      throw this.signal;
    }
  }

  get exhausted() { return this.site !== null; }

  violation() {
    return { kind: 'budget', site: this.site, steps: this.steps, why: `the budget of ${this.deadline && this.steps <= this.limit ? `${this.deadline - this.started} ms` : `${this.limit} steps`} ran out in ${this.site}` };
  }

  report() {
    return { steps: this.steps, limit: this.limit, exhausted: this.exhausted, site: this.site, sites: { ...this.sites }, ms: Date.now() - this.started };
  }
}
