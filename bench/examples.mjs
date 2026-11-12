// R9.4: world.examples on 300 items, 40 people, 6 EN words; every example read back.
// `node bench/examples.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const w = new World();
w.load(`@k1 core.slot of=item key=name id=true
  @k2 core.slot of=order key=item kind=ref to=item required=true
  @k6 core.slot of=person key=name id=true
  @k5 core.slot of=meeting key=with type=person required=true
  @k4 core.slot of=meeting key=day enum=mon enum=tue enum=wed required=true
  @a core.action name=reserve param=item when=$it set=$r
  @it item name=?item stock=?s
  @r item core.on=$it reserved=yes`);
w.tell(Array.from({length:300},(_, i)=>`@i${i} item name=n${i} stock=1`).join('\n'));
w.tell(Array.from({length:40},(_, i)=>`@p${i} person name=q${i}`).join('\n'));
w.tell(`@w1 core.word text=book means=reserve  @w2 core.word text=order means=order
  @w3 core.word text=meet means=meeting  @w4 core.word text=with means=meeting.with
  @w5 core.word text=monday means=mon of=meeting.day @w6 core.word text=stock means=item.stock`);
const t=[];for(let i=0;i<21;i++){const s=process.hrtime.bigint();w.examples();t.push(Number(process.hrtime.bigint()-s)/1e6);}
t.sort((a,b)=>a-b);const ex=w.examples();
let ok=0;for(const e of ex){ if(w.interpret(e.frame).candidates.length) ok++; }
console.log(`${ex.length} examples in ${t[10].toFixed(3)} ms; ${ok} read back with candidates`);
