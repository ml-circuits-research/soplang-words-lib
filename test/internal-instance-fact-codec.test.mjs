import {test} from 'node:test';
import assert from 'node:assert/strict';
import {instanceFactCodec} from '../src/internal/instance-fact-codec.mjs';
import {World,parse,quote,serialize} from '../tools/lib-under-test.mjs';

const schema=`
@document core.type of=example.document closed=true
@node core.type of=example.node closed=true
@point core.type of=example.point closed=true
@items core.slot of=example.document key=items type=example.node many=true
@items.present core.slot of=example.document key=has.items kind=boolean required=true
@id core.slot of=example.node key=id kind=string id=true required=true
@buddy core.slot of=example.node key=buddy type=example.node by=id kind=string strict=true
@child core.slot of=example.node key=child type=example.node
@at core.slot of=example.node key=at type=example.point kind=atom
@x core.slot of=example.point key=x kind=number required=true
@y core.slot of=example.point key=y kind=number required=true
`;
const open=()=>{
 const world=new World();
 world.load(schema);
 return instanceFactCodec(world,'example.document',{parse,quote,serialize});
};

test('the authored schema sets identities, scalar named joins, and owned ordered records',()=>{
 const adapter=open(),data={items:[{id:'a',buddy:'b',at:{x:0,y:0}},{id:'b',buddy:'a',at:null}]};
 const old=adapter.decode(adapter.encode(data));
 assert.deepEqual(old.data,data);
 const first=old.world.ofType('example.node').find(row=>row.attrs.id[0]==='"a"');
 const reordered=adapter.decode(adapter.encode({items:[...data.items].reverse()}));
 assert.deepEqual(reordered.world.get(first.id).attrs,first.attrs);
 assert.deepEqual(adapter.decode(adapter.encode({items:[]})).data,{items:[]});
 assert.throws(()=>adapter.encode({items:[{id:'a',at:{x:1}}]}),/missing:y/);
 assert.throws(()=>adapter.encode({items:[{id:'a',buddy:'missing'}]}),/facts:/);
});

test('cycles in declared ownership and unreachable facts are refused',()=>{
 const adapter=open(),source=adapter.encode({items:[{id:'a',child:{id:'b'}}]});
 const rows=source.trim().split('\n'),child=rows.find(row=>row.includes('id="b"')),root=rows.find(row=>row.includes('id="a"')).split(' ')[0].slice(1);
 const cyclic=source.replace(child,child+' child=$'+root);
 assert.throws(()=>adapter.decode(cyclic),/ownership-or-reference/);
 const extra=source+'@extra example.point x=1 y=2\n';
 assert.throws(()=>adapter.decode(extra),/unowned-facts/);
 assert.throws(()=>adapter.encode({items:[{id:'a'},{id:'a'}]}),/duplicate-collection/);
});
