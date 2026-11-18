import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, parse } from '../tools/lib-under-test.mjs';

const modules = {
  fixture: `@fixture core.module name=fixture imports=data exports=input exports=result
    @input core.type of=fixture.input closed=true
    @input.key core.slot of=fixture.input key=label kind=string
    @result core.type of=fixture.result closed=true
    @result.key core.slot of=fixture.result key=label kind=string
    @result.evidence core.slot of=fixture.result key=evidence kind=ref to=data.row
    @p fixture.input label=?label
    @d data.row label=?label
    @r fixture.result label=?label evidence=$d
    @rule core.rule when=$p when=$d then=$r`,
  data: `@data core.module name=data exports=row
    @row core.type of=data.row closed=true
    @row.label core.slot of=data.row key=label kind=string
    @row.kind core.slot of=data.row key=kind kind=string`,
};
const policy = (id = 'profile', key = 'label') => `@${id} std.knowledge.profile module=fixture input=$${id}.seed read=$${id}.lookup select=$${id}.output
  @${id}.seed std.knowledge.input param=subject type=fixture.input key=label
  @${id}.lookup std.knowledge.read param=subject type=data.row key=${key}
  @${id}.output std.knowledge.select param=subject type=fixture.result key=label`;
const request = `@q std.knowledge.request profile=$profile binding=$b
  @b std.knowledge.binding param=subject value="fox"`;
const setup = (source = '@a data.row label="fox" kind="mammal" core.source="catalog 1"\n@broad data.row label="bear" kind="fox"') => {
  const world = new World();
  world.use('std.knowledge');
  world.load(policy());
  const loaded = [];
  const catalog = {
    async world(id) { return {schema: id, depends: id === 'fixture' ? ['data'] : []}; },
    async readText(id) { loaded.push(id); return modules[id]; },
    async wireSource(type, options) { loaded.push([type, options.keys]); return source; },
  };
  return {world, catalog, loaded};
};

test('declared knowledge projection uses lazy selectors and returns only derived rows with source facts', async () => {
  const {world, catalog, loaded} = setup();
  for (let i = 0; i < 2; i++) {
    const result = parse(await world.compileRequest(request, {catalog}));
    assert.deepEqual(result.map(w => w.type), ['data.row','fixture.result']);
    assert.equal(result[0].attrs['core.source'][0], '"catalog 1"');
    assert.deepEqual(result[1].attrs, {label:['"fox"'], evidence:['$a']});
  }
  assert.deepEqual(loaded.filter(item => typeof item === 'string').sort(), ['data','fixture']);
  assert.deepEqual(loaded.filter(Array.isArray), [['data.row',['fox']],['data.row',['fox']]]);
  assert.equal(world.has('a'), false);
  assert.equal(world.has('q'), false);
});

test('a different authored selector controls the evidence and optional values skip lookups', async () => {
  const {world, catalog, loaded} = setup();
  world.load(policy('secondary', 'kind'));
  assert.equal(await world.compileRequest(request.replace('$profile','$secondary'), {catalog}), '');
  loaded.length = 0;
  assert.equal(await world.compileRequest('@q std.knowledge.request profile=$profile', {catalog}), '');
  assert.deepEqual(loaded, []);
});

test('knowledge projection refuses injected declarations, unknown bindings and untrusted profiles', async () => {
  const {world, catalog, loaded} = setup('@injected core.rule when=$p then=$r');
  assert.match(await world.compileRequest(request.replace('param=subject','param=unknown'), {catalog}), /knowledge-request/);
  assert.match(await world.compileRequest(request.replace('$profile','$missing'), {catalog}), /knowledge-request/);
  assert.deepEqual(loaded, []);
  assert.match(await world.compileRequest(request, {catalog}), /knowledge-source/);
});
