// Lossless instance persistence: ordinary queryable facts and a typed implementation projection.
// No consumer, domain, action interpretation, storage API or rendering code belongs here.
import {parse,serialize,quote,str} from './parser.mjs';
import {World} from './world.mjs';
export const INSTANCE_STATE_FORMAT='sop.instance-state/3';
const COMPACT_INSTANCE_STATE_FORMAT='sop.instance-state/2';
const LEGACY_INSTANCE_STATE_FORMAT='sop.instance-state/1';
const IDENT=/^[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_][A-Za-z0-9_-]*)*$/;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const scalar=x=>x===null||typeof x==='string'||typeof x==='boolean'||typeof x==='number'&&Number.isFinite(x);
const token=x=>typeof x==='string'?quote(x):Object.is(x,-0)?'-0':String(x);
const utf8hex=value=>Array.from(new TextEncoder().encode(value),b=>b.toString(16).padStart(2,'0')).join('');
const objectWireId=(id,format=INSTANCE_STATE_FORMAT)=>format===INSTANCE_STATE_FORMAT?'item.'+(IDENT.test(id)&&!id.startsWith('escaped.')?id:'escaped.u'+utf8hex(id)):'instance.item.u'+utf8hex(id);
const fieldKey=key=>'field.'+(IDENT.test(key)&&!key.startsWith('escaped.')?key:'escaped.u'+utf8hex(key));
const decodedField=key=>{need(key.startsWith('field.'),'record-key');const name=key.slice(6);if(!name.startsWith('escaped.u'))return name;const hex=name.slice(9);need(/^(?:[a-f0-9]{2})*$/.test(hex),'record-key');const value=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(hex.match(/../g)??[],pair=>parseInt(pair,16)));need(fieldKey(value)===key,'record-key');return value;};
function validateData(data,limits){let count=0,bytes=0;const active=new Set();const walk=(x,depth=0)=>{need(++count<=limits.maxNodes*4&&depth<=limits.maxDepth,'input-budget');if(typeof x==='string'){bytes+=x.length;need(bytes<=limits.maxBytes,'byte-budget');return;}if(scalar(x))return;need(x&&typeof x==='object'&&!active.has(x),'cyclic-or-invalid-value');const array=Array.isArray(x);need(array||plain(x),'value-prototype');const ds=Object.getOwnPropertyDescriptors(x),keys=Reflect.ownKeys(ds);if(array)need(keys.length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.hasOwn(ds,String(i))).every(Boolean),'sparse-array');active.add(x);for(const key of keys){if(array&&key==='length')continue;const d=ds[key];need(typeof key==='string'&&d.enumerable&&Object.hasOwn(d,'value'),'accessor-property');bytes+=key.length;need(bytes<=limits.maxBytes,'byte-budget');walk(d.value,depth+1);}active.delete(x);};walk(data);}
const need=(ok,reason)=>{if(!ok)throw new TypeError('instance-state:'+reason);};
const identifier=x=>typeof x==='string'&&IDENT.test(x)&&!x.startsWith('core.');
const shape=(x,keys)=>plain(x)&&Object.keys(x).every(k=>keys.includes(k));
const descriptor=(x)=>{need(shape(x,['instanceId','world','schemaVersion','revision','objects','projection','metadata']),'descriptor');for(const key of ['instanceId','world','schemaVersion'])need(typeof x[key]==='string'&&x[key].length>0,'identity');need(typeof x.revision==='string'||Number.isSafeInteger(x.revision)&&x.revision>=0,'revision');need(Array.isArray(x.objects),'objects');};
const limitsOf=({maxNodes=100000,maxDepth=64,maxBytes=32000000}={})=>{need([maxNodes,maxDepth,maxBytes].every(n=>Number.isSafeInteger(n)&&n>0),'limits');return {maxNodes,maxDepth,maxBytes};};
/** objects: [{id,type,attributes:{key:[literal,...]},relations:{key:[localId,...]},metadata?}].
 * The projection is structured tool data: containers are SOP nodes and scalar members are direct literals.
 * It is not an inference source or a substitute for the application's declared facts/schema. */
export function serializeInstanceState(input,options={}){
 const limits=limitsOf(options);validateData(input,limits);descriptor(input);const nodes=[],seen=new Set(),byId=new Map();let sequence=0;
 const add=node=>{need(nodes.length<limits.maxNodes,'node-budget');nodes.push(node);return node.id;};
 // bounded: each value is charged to maxNodes and recursion is limited by maxDepth.
 const value=(data,depth=0)=>{
  need(depth<=limits.maxDepth,'depth-budget');if(scalar(data))return token(data);
  need(data&&typeof data==='object'&&!seen.has(data),'cyclic-or-invalid-value');const array=Array.isArray(data);need(array||plain(data),'value-prototype');
  const id='v'+sequence++,own=Reflect.ownKeys(data),keys=array?Array.from({length:data.length},(_,i)=>String(i)):own,attrs={};
  need(own.every(k=>typeof k==='string'),'symbol-property');if(array)need(own.length===data.length+1&&keys.every(k=>Object.hasOwn(data,k)),'sparse-array');seen.add(data);
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(data,key);need(d&&d.enumerable&&Object.hasOwn(d,'value'),'accessor-property');const encoded=value(d.value,depth+1);if(array)(attrs.item??=[]).push(encoded);else attrs[fieldKey(key)]=[encoded];}
  seen.delete(data);add({id,type:array?'std.instance.sequence':'std.instance.record',attrs});return '$'+id;
 };
 for(const [index,object]of input.objects.entries()){need(shape(object,['id','type','attributes','relations','metadata'])&&typeof object.id==='string'&&object.id.length>0&&identifier(object.type)&&!object.type.startsWith('std.instance.'),'object');need(!byId.has(object.id),'duplicate-object-id');byId.set(object.id,objectWireId(object.id));}
 const objects=[];
 for(const [index,object]of input.objects.entries()){
  const attrs={},attributes=object.attributes??{},relations=object.relations??{};need(plain(attributes)&&plain(relations),'object-fields');
  for(const [key,values]of Object.entries(attributes)){need(identifier(key)&&Array.isArray(values)&&!Object.hasOwn(relations,key),'attribute');attrs[key]=values.map(v=>scalar(v)?token(v):value(v));}
  for(const [key,targets]of Object.entries(relations)){need(identifier(key)&&Array.isArray(targets)&&targets.every(t=>byId.has(t)),'relation-target');attrs[key]=targets.map(t=>'$'+byId.get(t));}
  const fact=add({id:byId.get(object.id),type:object.type,attrs}),id='instance.object.'+index;
  const fields={id:[quote(object.id)],fact:['$'+fact],attribute:Object.keys(attributes).map(quote),relation:Object.keys(relations).map(quote)};
  if(object.metadata!==undefined)fields.metadata=[value(object.metadata)];
  add({id,type:'std.instance.object',attrs:fields});objects.push('$'+id);
 }
 const projection=value(input.projection);
 add({id:'instance.snapshot',type:'std.instance.snapshot',attrs:{format:[quote(INSTANCE_STATE_FORMAT)],instance:[quote(input.instanceId)],world:[quote(input.world)],schema:[quote(input.schemaVersion)],revision:[token(input.revision)],object:objects,projection:[projection],...(input.metadata!==undefined?{metadata:[value(input.metadata)]}:{})}});
 const wires=serialize(nodes);need(wires.length<=limits.maxBytes,'byte-budget');return wires;
}
/** Restore bytes, local identities and explicit relations without selecting values or completing missing facts.
 * The caller must validate the implementation projection against these facts before using a tool cache. */
export function readInstanceState(wires,options={}){
 const limits=limitsOf(options);need(typeof wires==='string'&&wires.length<=limits.maxBytes,'byte-budget');const nodes=parse(wires);need(nodes.length<=limits.maxNodes,'node-budget');need(nodes.every(n=>!n.pattern&&!n.legacy),'pattern');const byId=new Map(nodes.map(n=>[n.id,n]));need(byId.size===nodes.length,'duplicate-wire-id');
 const used=new Set(),active=new Set();let visits=0;
 const one=(node,key)=>{need(Array.isArray(node?.attrs?.[key])&&node.attrs[key].length===1,'single-'+key);return node.attrs[key][0];};
 const reference=raw=>{need(typeof raw==='string'&&raw[0]==='$'&&byId.has(raw.slice(1)),'reference');return byId.get(raw.slice(1));};
 const keys=(node,allowed)=>need(Object.keys(node.attrs).every(key=>allowed.includes(key)),'unknown-node-field');
 const literal=raw=>{need(typeof raw==='string'&&raw[0]!=='$'&&raw[0]!=='?','literal');let value;try{value=JSON.parse(raw);}catch{throw new TypeError('instance-state:literal');}need(scalar(value),'literal-type');return value;};
 // bounded: maxNodes visits, maxDepth and the active set prevent unbounded graph traversal.
 // bounded: maxDepth, maxNodes and the active-reference set constrain the complete typed value graph.
 const readCompact=(raw,depth=0)=>{
  need(depth<=limits.maxDepth,'value-budget');if(raw[0]!=='$')return literal(raw);
  const node=reference(raw);need(++visits<=limits.maxNodes&&!active.has(node.id),'cyclic-or-invalid-value');used.add(node.id);active.add(node.id);let result;
  if(node.type==='std.instance.sequence'){keys(node,['item']);result=(node.attrs.item??[]).map(item=>readCompact(item,depth+1));}
  else{need(node.type==='std.instance.record','value-kind');const pairs=Object.entries(node.attrs).map(([key,values])=>{need(values.length===1,'record-multiplicity');return [decodedField(key),readCompact(values[0],depth+1)];});need(new Set(pairs.map(([key])=>key)).size===pairs.length,'duplicate-object-key');result=Object.fromEntries(pairs);}
  active.delete(node.id);return result;
 };
 // bounded: legacy values retain maxDepth/maxNodes validation and an active-reference cycle guard.
 const value=(node,depth=0)=>{
  need(depth<=limits.maxDepth&&++visits<=limits.maxNodes,'value-budget');need(node?.type==='std.instance.value'&&!active.has(node.id),'cyclic-or-invalid-value');used.add(node.id);keys(node,['kind','value','member','key','index']);const kind=str(one(node,'kind'));if(format===COMPACT_INSTANCE_STATE_FORMAT)need(!node.attrs.index&&(kind==='object'||!node.attrs.key),'compact-location');active.add(node.id);let result;
  if(['null','string','number','boolean'].includes(kind)){if(format===COMPACT_INSTANCE_STATE_FORMAT)need(!node.attrs.key&&!node.attrs.index,'scalar-location');need(!node.attrs.member,'scalar-members');if(kind==='null'){need(!node.attrs.value,'null-value');result=null;}else{result=literal(one(node,'value'));need(typeof result===kind,'scalar-type');}}
  else{need(kind==='array'||kind==='object','value-kind');need(!node.attrs.value,'container-value');
   if(format===LEGACY_INSTANCE_STATE_FORMAT){const members=(node.attrs.member??[]).map(reference);if(kind==='array'){need(members.every((n,i)=>!n.attrs.key&&literal(one(n,'index'))===i),'array-order');result=members.map(n=>value(n,depth+1));}else{const names=members.map(n=>{need(!n.attrs.index,'object-index');const key=literal(one(n,'key'));need(typeof key==='string','object-key');return key;});need(new Set(names).size===names.length,'duplicate-object-key');result=Object.fromEntries(members.map((n,i)=>[names[i],value(n,depth+1)]));}}
   else{need(!node.attrs.index,'compact-index');const members=node.attrs.member??[],read=raw=>raw[0]==='$'?value(reference(raw),depth+1):literal(raw);if(kind==='array'){need(!node.attrs.key,'array-key');result=members.map(read);}else{const names=(node.attrs.key??[]).map(literal);need(names.length===members.length&&names.every(k=>typeof k==='string'),'object-keys');need(new Set(names).size===names.length,'duplicate-object-key');result=Object.fromEntries(members.map((raw,i)=>[names[i],read(raw)]));}}
  }
  active.delete(node.id);return result;
 };
 const roots=nodes.filter(n=>n.type==='std.instance.snapshot');need(roots.length===1,'one-snapshot');const root=roots[0];used.add(root.id);keys(root,['format','instance','world','schema','revision','object','projection','metadata']);const format=str(one(root,'format'));need([INSTANCE_STATE_FORMAT,COMPACT_INSTANCE_STATE_FORMAT,LEGACY_INSTANCE_STATE_FORMAT].includes(format),'format');
 const descriptors=(root.attrs.object??[]).map(reference),factIds=new Map(),nativeIds=new Set();
 for(const object of descriptors){need(object.type==='std.instance.object','object-descriptor');keys(object,['id','fact','attribute','relation','metadata']);used.add(object.id);const id=literal(one(object,'id')),fact=reference(one(object,'fact'));need(typeof id==='string'&&id.length>0&&!nativeIds.has(id)&&!factIds.has(fact.id)&&fact.id===objectWireId(id,format)&&identifier(fact.type)&&!fact.type.startsWith('std.instance.'),'object-identity');nativeIds.add(id);factIds.set(fact.id,id);}
 const objects=descriptors.map(object=>{const fact=reference(one(object,'fact'));used.add(fact.id);const attributes={},relations={},attrKeys=(object.attrs.attribute??[]).map(literal),relKeys=(object.attrs.relation??[]).map(literal);need([...attrKeys,...relKeys].every(identifier)&&new Set([...attrKeys,...relKeys]).size===attrKeys.length+relKeys.length,'object-keys');need(Object.keys(fact.attrs).every(k=>attrKeys.includes(k)||relKeys.includes(k)),'undeclared-object-field');
  for(const key of attrKeys)attributes[key]=(fact.attrs[key]??[]).map(raw=>format===INSTANCE_STATE_FORMAT?readCompact(raw):raw[0]==='$'?value(reference(raw)):literal(raw));
  for(const key of relKeys)relations[key]=(fact.attrs[key]??[]).map(raw=>{const target=reference(raw);need(factIds.has(target.id),'foreign-object-reference');return factIds.get(target.id);});
  return {id:literal(one(object,'id')),type:fact.type,attributes,relations,...(object.attrs.metadata?{metadata:format===INSTANCE_STATE_FORMAT?readCompact(one(object,'metadata')):value(reference(one(object,'metadata')))}:{})};
 });
 const result={instanceId:literal(one(root,'instance')),world:literal(one(root,'world')),schemaVersion:literal(one(root,'schema')),revision:literal(one(root,'revision')),objects,projection:format===INSTANCE_STATE_FORMAT?readCompact(one(root,'projection')):value(reference(one(root,'projection'))),...(root.attrs.metadata?{metadata:format===INSTANCE_STATE_FORMAT?readCompact(one(root,'metadata')):value(reference(one(root,'metadata')))}:{})};descriptor(result);need(nodes.every(n=>used.has(n.id)),'unowned-wire');return result;
}
/** A semantic SOP world: ordinary facts and their actual local reference closure.
 * Archive descriptors, implementation projection, and observation metadata stay in the carrier.
 * includeArchive is an explicit diagnostic opt-in, never the default inference context. */
export function instanceStateWorld(wires,{schema='',includeArchive=false,...options}={}){
 readInstanceState(wires,options);
 const nodes=parse(wires),byId=new Map(nodes.map(node=>[node.id,node])),selected=new Set();
 if(includeArchive)for(const node of nodes)selected.add(node.id);
 else{
  const pending=nodes.filter(node=>node.type==='std.instance.object').map(node=>str(node.attrs.fact[0]).slice(1));
  // bounded: each node expands once; queued references are bounded by the validated maxBytes input.
  while(pending.length){const id=pending.pop();if(selected.has(id))continue;const node=byId.get(id);need(node,'semantic-reference');selected.add(id);
   for(const values of Object.values(node.attrs))for(const value of values)if(value[0]==='$')pending.push(value.slice(1));
  }
 }
 const world=new World();need(world.load('@instance.module core.use world=std.instance').ok,'instance-schema');if(schema)need(world.load(schema).ok,'schema');need(world.load(serialize(nodes.filter(node=>selected.has(node.id)))).ok,'facts');return world;
}
