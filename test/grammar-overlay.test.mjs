import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, parseText, composeParses, compileGrammarOverlay } from '../tools/lib-under-test.mjs';
const types=Object.fromEntries(['binding','feature','filter','rule','map','node','step','agreement'].map(role=>[role,`toy.${role}`]));
// Invented minimal language. All words and meanings are provider data.
const declarations=`
@b toy.binding name=names source_type=v.item text_key=text cat=N
@f toy.feature binding=names key=kind from_key=kind
@r toy.rule name=message lhs=M rhs=N
@mr toy.map name=message rule=message root=message
@ml toy.map name=lexical cat=N root=lexical
@nr toy.node name=message kind=copy
@sr0 toy.step of=message at=0 key=children
@sr1 toy.step of=message at=1 index=0
@nl toy.node name=lexical kind=copy
@sl0 toy.step of=lexical at=0 key=node
@sl1 toy.step of=lexical at=1 key=feat
@a v.item text=ko kind=vessel core.source="invented toy"`;
const make=(text=declarations)=>{const w=new World();w.load(text);return w;};
const compile=text=>compileGrammarOverlay(make(text),{types});
const read=(w,compiled,text='ko')=>{const parsed=parseText(w,text,{...compiled.grammar,start:'M',sourceSpans:true});return {parsed,composed:composeParses(parsed,compiled.composition)};};

test('overlay resolves symbolic production IDs, snapshots grammar and preserves lexical origins without feature pollution',()=>{
 const w=make(declarations+'\n@a2 v.item text=ko kind=vessel core.source=other');const c=compileGrammarOverlay(w,{types});assert.equal(c.ok,true,JSON.stringify(c.issues));
 assert.deepEqual(Object.keys(c.composition.rules),['r']);assert.equal(c.source.world,w);assert.equal(c.source.stamp,w.stamp);
 const {parsed,composed}=read(w,c);assert.equal(parsed.length,2);assert.equal(composed.candidates.length,2);
 assert.deepEqual(new Set(parsed.map(p=>c.provenance[p.tree.children[0].origin].wire)),new Set(['a','a2']));
 assert.deepEqual(composed.candidates.map(c=>c.value),[{kind:'vessel'},{kind:'vessel'}]);
 assert.deepEqual(c.provenance[parsed[0].tree.children[0].origin].metadata['core.source'].length,1);
 w.load('@evil toy.rule name=evil lhs=M rhs=N');assert.equal(read(w,c).parsed.length,2,'snapshot is authoritative; ambient new productions are not merged');
 assert.notEqual(c.source.stamp,w.stamp,'consumer can detect stale source world');
 const quoted=compile(declarations.replace('lhs=M rhs=N','lhs="M" rhs="N"'));
 assert.equal(quoted.ok,true);assert.equal(read(quoted.source.world,quoted).parsed.length,1,'decoded identifiers match the validated snapshot');
 const underscored=compile(declarations.replaceAll('cat=N','cat=N_KIND').replace('lhs=M rhs=N','lhs=M_KIND rhs=N_KIND'));
 assert.equal(underscored.ok,true);assert.equal(parseText(underscored.source.world,'ko',{...underscored.grammar,start:'M_KIND'}).length,1);
});

test('provider filters constrain emitted aliases; repeated features preserve alternatives and text-key copies stay paired',()=>{
 const text=declarations.replace('from_key=kind','from_key=text')+'\n@filter toy.filter binding=names key=text value="ko"\n@a2 v.item text=ko text=ka kind=unused';
 const c=compile(text);assert.equal(c.ok,true);assert.equal(c.grammar.lexicon.ka,undefined);assert.ok(c.grammar.lexicon.ko.every(e=>e.feat.kind==='ko'));
 const repeated=compile(declarations.replace('kind=vessel','kind=vessel kind=container'));assert.equal(repeated.ok,true);assert.deepEqual(new Set(repeated.grammar.lexicon.ko.map(e=>e.feat.kind)),new Set(['vessel','container']));
 const restricted=compile(declarations.replace('cat=N\n@f','cat=N source_id=a\n@f')+'\n@a2 v.item text=other kind=other');assert.equal(restricted.ok,true);assert.equal(restricted.grammar.lexicon.other,undefined);
 const core=compile(declarations.replaceAll('v.item','core.word').replace('cat=N\n@f','cat=N source_id=a\n@f')+'\n@a2 core.word text=other kind=other');assert.equal(core.ok,true);assert.equal(core.grammar.lexicon.other,undefined,'source_id applies uniformly, including core.word');
});

test('compiler declines missing providers/features, unknown fields, references and incomplete mappings',()=>{
 for(const text of [declarations.replace('@a v.item','@a missing.item'),declarations.replace(' kind=vessel',''),declarations+'\n@bad toy.filter binding=names key=text value=ko operator=negate',declarations.replace('binding=names key=kind','binding=absent key=kind'),declarations.replace('cat=N root=lexical','cat=Other root=lexical'),declarations.replace('rhs=N','rhs=Missing')])assert.equal(compile(text).ok,false,text);
 assert.equal(compileGrammarOverlay(make(),{types:null}).ok,false);
 assert.equal(compile(declarations.replace('from_key=kind','from_key=toString')).issues[0].reason,'missing-provider-feature');
 assert.equal(compile(declarations+'\n@missing v.item kind=other').issues[0].reason,'missing-provider-text');
 assert.equal(compile(declarations.replace('cat=N\n@f','cat=N source_id=absent\n@f')).issues[0].reason,'missing-provider');
 assert.equal(compile(declarations+'\n@f2 toy.feature binding=names key=kind value=other').issues[0].reason,'invalid-feature');
 assert.equal(compile(declarations.replace('from_key=kind','from_key=kind value=other')).issues[0].reason,'invalid-feature');
 assert.equal(compile(declarations.replace('rule=message root=message','rule=message cat=N root=message')).issues[0].reason,'invalid-map-selector');
});

test('template graph rejects duplicate/sparse paths, invalid roots, cycles, attachments and orphan nodes',()=>{
 const invalid=[
  declarations+'\n@dup toy.step of=message at=0 key=node',
  declarations.replace('of=message at=1','of=message at=3'),
  declarations.replace('at=1 index=0','at=1 index=0 key=kind'),
  declarations.replace('name=message kind=copy','name=message kind=object parent=lexical field=x').replace('name=lexical kind=copy','name=lexical kind=object parent=message field=y').replace(/^@s[^\n]*$/gm,''),
  declarations+'\n@orphan toy.node name=orphan kind=null',
  declarations.replace('name=message kind=copy','name=message kind=copy parent=lexical field=x'),
  declarations.replace('of=message at=0 key=children','of=message at=0 key=unknown'),
 ];
 for(const text of invalid)assert.equal(compile(text).ok,false,text);
 const object=declarations.replace('name=lexical kind=copy','name=lexical kind=object').replace(/^@sl[^\n]*$/gm,'')+'\n@x toy.node name=x kind=literal parent=lexical field=kind value=vessel';
 assert.equal(compile(object).ok,true);
 assert.equal(compile(object+'\n@y toy.node name=y kind=null parent=lexical field=kind').issues[0].reason,'duplicate-field');
 const array=object.replace('name=lexical kind=object','name=lexical kind=array').replace('field=kind','index=1');assert.equal(compile(array).issues[0].reason,'sparse-array');
 assert.equal(compileGrammarOverlay(make(),{types,budget:1}).issues[0].reason,'budget');
});

test('agreement declarations compile to precomposition equality guards with no domain inference',()=>{
 const text=declarations+'\n@expect toy.feature binding=names key=expected value=vessel\n@a2 v.item text=ka kind=other\n@left toy.node name=left kind=copy\n@right toy.node name=right kind=copy\n@l0 toy.step of=left at=0 key=children\n@l1 toy.step of=left at=1 index=0\n@l2 toy.step of=left at=2 key=kind\n@q0 toy.step of=right at=0 key=children\n@q1 toy.step of=right at=1 index=0\n@q2 toy.step of=right at=2 key=expected\n@g toy.agreement rule=message left=left right=right';
 const c=compile(text);assert.equal(c.ok,true,JSON.stringify(c.issues));assert.equal(read(c.source.world,c).composed.candidates.length,1);
 assert.equal(read(c.source.world,c,'ka').composed.failures[0].reason,'guard-rejected');
 assert.equal(compile(text.replace('rule=message left=','rule=absent left=')).ok,false);
});

test('compilation records exact source instance and fact/schema revision, with rollback preserving freshness',()=>{
 const w=make();w.load('@limit core.slot of=v.item key=kind enum=vessel');const c=compileGrammarOverlay(w,{types});assert.equal(c.ok,true);
 const before=w.stamp;assert.equal(w.tell('@bad v.item text=ka kind=other').ok,false);assert.equal(w.stamp,before);assert.equal(c.source.stamp,w.stamp);
 const fork=w.fork();assert.notEqual(c.source.world,fork,'a fork is not the compiled source even when revisions coincide');
 w.load('@extra core.type of=v.extra');assert.notEqual(c.source.stamp,w.stamp,'schema changes invalidate the source revision');
});

test('source-identity features preserve exact provider senses across aliases and filtered families',()=>{
 const text=declarations.replace('from_key=kind','from_id=true')+'\n@a2 v.item text=ko text=ka kind=vessel';
 const c=compile(text);assert.equal(c.ok,true,JSON.stringify(c));
 assert.deepEqual(new Set(c.grammar.lexicon.ko.map(x=>x.feat.kind)),new Set(['a','a2']));
 assert.deepEqual(c.grammar.lexicon.ka.map(x=>x.feat.kind),['a2']);
 for(const item of c.grammar.lexicon.ko)assert.equal(item.feat.kind,c.provenance[item.origin].wire);
 const filtered=compile(text+'\n@filter toy.filter binding=names key=text value=ka');assert.equal(filtered.ok,true);assert.equal(filtered.grammar.lexicon.ko,undefined);assert.equal(filtered.grammar.lexicon.ka[0].feat.kind,'a2');
 const core=compile(text.replaceAll('v.item','core.word'));assert.equal(core.ok,true);assert.deepEqual(new Set(core.grammar.lexicon.ko.map(x=>x.feat.kind)),new Set(['a','a2']));
 const restricted=compile(text.replace('cat=N\n@f','cat=N source_id=a\n@f'));assert.equal(restricted.ok,true);assert.deepEqual(restricted.grammar.lexicon.ko.map(x=>x.feat.kind),['a']);
 for(const declaration of ['from_id=false','from_id=anything','from_id=true value=literal','from_id=true from_key=kind','from_id=true from_id=false'])assert.equal(compile(declarations.replace('from_key=kind',declaration)).ok,false,declaration);
 assert.equal(compileGrammarOverlay(make(text),{types,budget:1}).ok,false);
});
