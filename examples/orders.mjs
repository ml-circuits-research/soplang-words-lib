// Aggregates: an order summarised from its lines, kept up to date as lines come and go.
export const orders = `
@k_sum core.slot of=summary key=of id=true
@k_items core.slot of=summary key=items many=true

?o order customer=?c
?l line of=$o item=?item amount=?a
@c_n     core.calc out=?n     fn=count   over=$l
@c_total core.calc out=?total fn=sum     over=$l args=?a
@c_top   core.calc out=?top   fn=max     over=$l args=?a
@c_which core.calc out=?which fn=argmax  over=$l args=?a pick=?item
@c_all   core.calc out=?all   fn=collect over=$l args=?item
@s summary of=$o lines=?n total=?total largest=?top largest_item=?which items=?all
@summarise core.rule when=$o with=$c_n with=$c_total with=$c_top with=$c_which with=$c_all then=$s

# a constraint over a whole group: an order may not exceed its customer's limit
?o2 order customer=?c2
?cu customer name=?c2 limit=?lim
?l2 line of=$o2 amount=?a2
@c_sum2 core.calc out=?t2 fn=sum over=$l2 args=?a2
@c_over core.check fn=gt args=?t2 args=?lim
@within_limit core.deny when=$o2 when=$cu with=$c_sum2 if=$c_over why="the order exceeds the customer's limit"
`;
