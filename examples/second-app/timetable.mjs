// A fourth application written from the documentation alone (01:20 item 3): a classroom
// timetable. Scheduling (a lesson needs a period and a room; no teacher, class or room in
// two places at once; a room must seat the class), people (teachers with days they are
// away), time (periods of a week, ordered), requests through `act` and `resolve`, and the
// rest of the week completed by the solver (`world.complete({ choose: true })`). Built from
// the docs; where they were not enough is listed in docs/reuse-reports/apps.md.
// `node examples/second-app/timetable.mjs`
import { World } from '../../src/index.mjs';

const PERIODS = ['mon1', 'mon2', 'tue1', 'tue2', 'wed1', 'wed2'];

export const SCHOOL = String.raw`
@acts core.use world=std.acts
@school std.schema.world name=school doc="who teaches what, where and when"
@t.teacher core.type of=teacher closed=true
@s.teacher.name core.slot of=teacher key=name required=true
@s.teacher.away core.slot of=teacher key=away many=true enum=mon enum=tue enum=wed
@t.group core.type of=group closed=true
@s.group.name core.slot of=group key=name required=true
@s.group.size core.slot of=group key=size kind=number min=1 required=true
@t.room core.type of=room closed=true
@s.room.name core.slot of=room key=name required=true
@s.room.seats core.slot of=room key=seats kind=number min=1 required=true
@t.period core.type of=period closed=true
@s.period.name core.slot of=period key=name id=true
@s.period.day core.slot of=period key=day required=true
@s.period.n core.slot of=period key=n kind=number required=true
@t.lesson core.type of=lesson extends=std.schema.thing closed=true
@s.lesson.subject core.slot of=lesson key=subject required=true
@s.lesson.group core.slot of=lesson key=group type=group required=true
@s.lesson.teacher core.slot of=lesson key=teacher type=teacher required=true
@s.lesson.room core.slot of=lesson key=room type=room required=true
@s.lesson.at core.slot of=lesson key=at type=period required=true
@a.when std.schema.aspect name=when keys=subject keys=group keys=teacher keys=room keys=at doc="when and where a lesson is"
@k.lesson std.schema.kind of=lesson world=school acts=make acts=change acts=remove acts=show aspects=when
@v.week std.schema.view name=week shows=when

# no teacher, class or room in two lessons of one period
${['teacher', 'group', 'room'].map((k) => `@${k}.a lesson ${k}=?${k}_v at=?${k}_p
@${k}.b lesson ${k}=?${k}_v at=?${k}_p
@${k}.two core.check fn=neq args=$${k}.a args=$${k}.b
@${k}.once core.deny when=$${k}.a when=$${k}.b if=$${k}.two why="the ${k} has another lesson then"`).join('\n')}

# a room seats the class
@fit.g group size=?gs
@fit.r room seats=?rs
@fit.l lesson group=$fit.g room=$fit.r
@fit.small core.check fn=gt args=?gs args=?rs
@fit core.deny when=$fit.g when=$fit.r when=$fit.l if=$fit.small why="the room is too small for the class"

# a teacher is not taught on a day they are away
@away.t teacher away=?d
@away.p period day=?d
@away.l lesson teacher=$away.t at=$away.p
@away core.deny when=$away.t when=$away.p when=$away.l why="the teacher is away that day"

${PERIODS.map((p) => `@${p} period name=${p} day=${p.slice(0, 3)} n=${p.slice(3)}`).join('\n')}
`;

export const PEOPLE = String.raw`
@ana teacher name=ana away=wed
@ben teacher name=ben
@g7a group name=7a size=24
@g7b group name=7b size=30
@lab room name=lab seats=24
@hall room name=hall seats=60
`;

export function makeApp() { const w = new World(); w.load(SCHOOL); w.tell(PEOPLE); return w; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const w = makeApp();
  const say = (label, r) => console.log(label.padEnd(44), r.ok ? 'ok' : `refused: ${r.violations?.[0]?.why ?? r.why}`);
  const lesson = (args) => w.act({ action: 'make', args: { kind: 'lesson', ...args } });
  say('7a maths with ana in the lab, mon1', lesson({ subject: 'maths', group: '$g7a', teacher: '$ana', room: '$lab', at: '$mon1' }));
  say('7b physics with ana in the hall, mon1', lesson({ subject: 'physics', group: '$g7b', teacher: '$ana', room: '$hall', at: '$mon1' }));
  say('7b physics with ben in the lab, mon1', lesson({ subject: 'physics', group: '$g7b', teacher: '$ben', room: '$lab', at: '$mon1' }));
  say('7b physics with ben in the hall, mon1', lesson({ subject: 'physics', group: '$g7b', teacher: '$ben', room: '$hall', at: '$mon1' }));
  say('7a art with ana in the hall, wed1', lesson({ subject: 'art', group: '$g7a', teacher: '$ana', room: '$hall', at: '$wed1' }));
  // the rest of the week: lessons told without a period or a room, the solver places them
  say('four more lessons, no period or room yet', w.act([['history', '$g7a', '$ana'], ['history', '$g7b', '$ana'], ['english', '$g7a', '$ben'], ['english', '$g7b', '$ben']]
    .map(([subject, group, teacher]) => ({ action: 'make', args: { kind: 'lesson', subject, group, teacher } }))));
  const c = w.complete({ choose: true });
  console.log('the solver placed', c.filled.length, 'values; open now:', w.open().length, '; dead ends:', c.dead?.length ?? 0);
  const week = w.act({ action: 'show', args: { thing: 'lesson', set: 'each', view: 'week' } }).result.things;
  for (const t of week.sort((a, b) => String(a.values.at).localeCompare(String(b.values.at)))) console.log(' ', String(t.values.at).slice(1).padEnd(5), t.values.group.slice(2).padEnd(4), String(t.values.subject).padEnd(8), t.values.teacher.slice(1).padEnd(4), t.values.room.slice(1));
}
