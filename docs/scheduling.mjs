// A larger completion problem, used by the solver example, the tests and the benchmark.
export const scheduling = `
@k_room core.slot of=meeting key=room required=true type=room
@k_time core.slot of=meeting key=time required=true enum=t1 enum=t2 enum=t3 enum=t4

@m meeting room=$r people=?n
@r room capacity=?cap
@t_fit core.check fn=gt args=?n args=?cap
@room_fits core.deny when=$m when=$r if=$t_fit why="room too small"

@ma meeting room=?rr time=?t
@mb meeting room=?rr time=?t
@t_other core.check fn=neq args=?ma args=?mb
@no_double_booking core.deny when=$ma when=$mb if=$t_other why="room already booked"

@pa meeting time=?pt with=?who
@pb meeting time=?pt with=?who
@t_other2 core.check fn=neq args=?pa args=?pb
@one_place_at_a_time core.deny when=$pa when=$pb if=$t_other2 why="a person cannot attend two meetings at once"
`;

/**
 * `meetings` meetings over `rooms` rooms of capacity 4, 8, 12, ... Each meeting has an
 * owner of its own and one more participant, so some pairs of meetings cannot overlap.
 * `load` is the share of the room-and-time slots that the meetings need (4 times per room).
 */
export function instance({ meetings = 10, rooms = 3, seed = 1 } = {}) {
  let x = seed >>> 0;
  const rnd = (n) => { // mulberry32
    x = (x + 0x6d2b79f5) >>> 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) % n);
  };
  const lines = [];
  for (let r = 0; r < rooms; r++) lines.push(`@room${r} room capacity=${4 + r * 4}`);
  for (let m = 0; m < meetings; m++) {
    lines.push(`@mt${m} meeting people=${2 + rnd(rooms * 4 - 1)} with=p${m} with=p${rnd(meetings)}`);
  }
  return lines.join('\n');
}
