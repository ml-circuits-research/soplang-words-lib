// Seeded sampling in rules: rand, rand_between and sample_key (builtins), with an aggregate choosing the drawn option.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, builtins } from '../src/index.mjs';

const pool = `
  @d draw seed=?seed
  @o option of=$d name=?name weight=?w
  @k core.calc out=?key fn=sample_key args=?seed args=?name args=?w
  @keyed option.key draw=$d name=?name key=?key
  @rk core.rule when=$d when=$o with=$k then=$keyed
  @dk draw
  @ok option.key draw=$dk name=?n key=?key
  @best core.calc out=?pick fn=argmax over=$ok args=?key pick=?n ties=first
  @chosen draw core.on=$dk picked=?pick
  @rp core.rule when=$dk with=$best then=$chosen
`;

function pick(seed, options) {
  const w = new World();
  w.load(pool);
  w.tell(`@d1 draw seed=${seed}\n` + options.map(([name, weight], i) => `@o${i} option of=$d1 name=${name} weight=${weight}`).join('\n'));
  return w.get('d1').attrs.picked[0];
}

test('rand is a float in [0, 1), the same for the same arguments, different for other salts', () => {
  const a = Number(builtins.rand(['7', 'tree'])), b = Number(builtins.rand(['7', 'tree'])), c = Number(builtins.rand(['7', 'house']));
  assert.ok(a >= 0 && a < 1);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(builtins.rand(['7', '"tree"']), builtins.rand(['7', 'tree']), 'a string and an atom of the same text draw alike');
  assert.equal(builtins.rand(['7.0', 'x']), builtins.rand(['7', 'x']), 'a number draws by its value');
  assert.equal(builtins.rand([]), undefined);
});

test('rand_between stays on its grid and range, keeps the unit, covers the range', () => {
  const seen = new Set();
  for (let s = 0; s < 400; s++) {
    const v = builtins.rand_between([String(s), 'sales', '100', '900', '50']);
    const n = Number(v);
    assert.ok(n >= 100 && n <= 900 && (n - 100) % 50 === 0, v);
    seen.add(n);
  }
  assert.equal(seen.size, 17, 'every grid value is drawn');
  assert.match(builtins.rand_between(['1', 't', '-5C', '30C']), /^-?\d+C$/);
  assert.equal(builtins.rand_between(['1', 't', '5', '1']) <= 5, true, 'lo and hi in either order');
  assert.equal(builtins.rand_between(['1', 't', '1kg', '5m']), undefined, 'two units do not make a range');
});

test('sample_key with argmax draws an option in proportion to its weight, the same for the same seed', () => {
  const options = [['meadow', 6], ['farm', 3], ['beach', 1]];
  assert.equal(pick(42, options), pick(42, options), 'reproducible from the seed');
  const counts = { meadow: 0, farm: 0, beach: 0 };
  for (let s = 1; s <= 300; s++) counts[pick(s, options)]++;
  assert.ok(counts.meadow > counts.farm && counts.farm > counts.beach && counts.beach > 0, JSON.stringify(counts));
  assert.ok(Math.abs(counts.meadow / 300 - 0.6) < 0.1, JSON.stringify(counts));
  assert.equal(builtins.sample_key(['1', 'x', '0']), undefined, 'a zero weight is never drawn');
});
