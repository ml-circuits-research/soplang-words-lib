// Small demonstration worlds, shared by the examples and the tests.

export const mechanics = `
# one acceleration per body: a second wire about the same body is the same wire
@k_acc core.slot of=acceleration key=of id=true

@b body mass=?m
@f force on=$b magnitude=?F
@a acceleration of=$b magnitude=?A
@c_div core.calc out=?A fn=div args=?F args=?m
@newton2 core.rule when=$b when=$f with=$c_div then=$a

@b0 body mass=?m0
@t_mass core.check fn=lte args=?m0 args=0
@positive_mass core.deny when=$b0 if=$t_mass why="mass must be positive"
`;

export const family = `
@p1 parent of=?x child=?y
@anc1 ancestor of=?x desc=?y
@base core.rule when=$p1 then=$anc1

@p2 parent of=?x child=?y
@a2 ancestor of=?y desc=?z
@anc2 ancestor of=?x desc=?z
@step core.rule when=$p2 when=$a2 then=$anc2

@a3 ancestor of=?x desc=?x
@no_loops core.deny when=$a3 why="nobody is their own ancestor"
`;

export const garden = `
@ab_rain core.abducible of=rain
@ab_spr core.abducible of=sprinkler

@r rain place=?p
@w_rain wet place=?p
@rain_wets core.rule when=$r then=$w_rain

@s sprinkler place=?p
@w_spr wet place=?p
@sprinkler_wets core.rule when=$s then=$w_spr

@w wet place=?p
@sl slippery place=?p
@wet_slips core.rule when=$w then=$sl

@s0 sprinkler place=?p
@win season name=winter
@no_winter_sprinkler core.deny when=$s0 when=$win why="sprinklers are off in winter"
`;

export const meetings = `
@k_room   core.slot of=meeting key=room required=true type=room ask="Which room?"
@k_time   core.slot of=meeting key=time required=true enum=10:00 enum=14:00 ask="What time?"
@k_people core.slot of=meeting key=people required=true ask="How many people?"
@k_dur    core.slot of=meeting key=duration required=true default=30
@k_title  core.slot of=meeting key=title
@t_meeting core.type of=meeting closed=true

@small room capacity=4
@big   room capacity=12

@m meeting room=$r people=?n
@r room capacity=?cap
@t_fit core.check fn=gt args=?n args=?cap
@room_fits core.deny when=$m when=$r if=$t_fit why="room too small"

@ma meeting room=?rr time=?t
@mb meeting room=?rr time=?t
@t_other core.check fn=neq args=?ma args=?mb
@no_double_booking core.deny when=$ma when=$mb if=$t_other why="room already booked at that time"

# a fully specified meeting produces a confirmation wire
@mc meeting room=?room time=?time
@conf confirmation for=$mc
@confirm core.rule when=$mc then=$conf
`;

// Diagnosis: a value of an open key can be assumed (key-level abducible).
export const clinic = `
@k_cond core.slot of=patient key=condition enum=flu enum=allergy ask="What is the diagnosis?"
@ab_cond core.abducible of=patient key=condition

@p1 patient condition=flu
@s1 symptom of=$p1 kind=fever
@flu_fever core.rule when=$p1 then=$s1

@p2 patient condition=flu
@s2 symptom of=$p2 kind=cough
@flu_cough core.rule when=$p2 then=$s2

@p3 patient condition=allergy
@s3 symptom of=$p3 kind=cough
@allergy_cough core.rule when=$p3 then=$s3

@p4 patient condition=allergy season=winter
@no_winter_allergy core.deny when=$p4 why="pollen allergy does not occur in winter"
`;

// Digital twin of a tank: one current reading per tank, alarms derived from it.
export const plant = `
@k_reading core.slot of=reading key=of id=true type=tank
@k_alarm   core.slot of=alarm key=of id=true

@r reading of=$t level=?l
@t tank capacity=?c
@c_pct core.calc out=?pct fn=div args=?l args=?c
@t_high core.check fn=gte args=?pct args=0.9
@al alarm of=$t kind=high_level
@high_level core.rule when=$r when=$t with=$c_pct if=$t_high then=$al

@r2 reading of=$t2 level=?l2
@t2 tank capacity=?c2
@t_over core.check fn=gt args=?l2 args=?c2
@impossible_level core.deny when=$r2 when=$t2 if=$t_over why="level above capacity: sensor fault"

@pu pump of=?t3 state=on
@va valve of=?t3 state=closed
@dead_head core.deny when=$pu when=$va why="pump running against a closed valve"
`;

// A procedure: steps in order, the next step is derived, skipping is refused.
export const procedure = `
@k_done core.slot of=done key=step id=true type=step

@s0 step first=true
@d0 done step=$s0
@rdy0 ready step=$s0
@first_ready core.rule when=$s0 not=$d0 then=$rdy0

@s step after=?prev
@dp done step=?prev
@ds done step=$s
@rdy ready step=$s
@next_ready core.rule when=$s when=$dp not=$ds then=$rdy

@d done step=$x
@x step after=?before
@db done step=?before
@in_order core.deny when=$d when=$x not=$db why="the previous step is not done"
`;

// Modules for composition: two independent matrices and facts that bridge them.
export const library = {
  garden,
  geo: `
@f forecast region=?r kind=rain
@pl place name=?p in=?r
@rn rain place=?p
@rain_over_region core.rule when=$f when=$pl then=$rn
`,
};
