// State over time: an account whose balance is changed by events.
export const ledger = `
@k1 core.slot of=account key=name id=true
@k2 core.slot of=account key=balance kind=number min=0 ask="What is the balance?"

# balance is a state; three kinds of event change it
@f_balance core.fluent of=account key=balance
@e_in    core.effect on=deposit    fluent=$f_balance op=add amount=amount where.name=account
@e_out   core.effect on=withdrawal fluent=$f_balance op=sub amount=amount where.name=account
@e_audit core.effect on=audit      fluent=$f_balance op=set amount=found  where.name=account

# rules read the current value like any other key
?a account balance=?b
@c_low core.check fn=lt args=?b args=20
@w_low warning for=$a kind=low_balance
@low core.rule when=$a if=$c_low then=$w_low
`;
