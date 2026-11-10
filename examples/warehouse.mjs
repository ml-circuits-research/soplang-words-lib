// A small warehouse, used by the query and action examples and tests.
export const warehouse = `
@t_item  core.type of=item closed=true
@t_shelf core.type of=shelf complete=true
@k1 core.slot of=item key=name kind=atom id=true
@k2 core.slot of=item key=shelf type=shelf ask="Which shelf is it on?"
@k3 core.slot of=item key=stock kind=integer min=0 ask="How many are in stock?"
@k4 core.slot of=item key=price kind=number
@k5 core.slot of=item key=value kind=number

# the value of the stock can be computed when nobody stated it
@p_value core.producer of=item key=value fn=stockValue

# an order line: the total follows from the quantity and the item's price
@k_l1 core.slot of=line key=item kind=atom
@k_l2 core.slot of=line key=qty kind=integer min=1
@l line item=?name qty=?q
@it item name=?name price=?p stock=?have
@c_total core.calc out=?t fn=mul args=?q args=?p
@l_total line item=?name qty=?q total=?t
@line_total core.rule when=$l when=$it with=$c_total then=$l_total
@t_short core.check fn=gt args=?q args=?have
@enough_stock core.deny when=$l when=$it if=$t_short why="not enough in stock"

# taking items out is an action: it runs in one transaction
@a_take core.action name=take fn=take required=item required=count ask.count="How many do you take?"

@s1 shelf row=A
@s2 shelf row=B
`;

// What the matrix names: a producer computes a key when asked, an action changes the world.
export const producers = {
  stockValue: ({ wire, val }) => {
    const stock = val(wire, 'stock'), price = val(wire, 'price');
    return stock === undefined || price === undefined ? undefined : Number(stock) * Number(price);
  },
};

export const actions = {
  take: (ctx, { item, count }) => {
    const [w] = ctx.find('item', { name: item });
    if (!w) return { ok: false, why: `there is no item named ${item}` };
    const left = Number(ctx.val(w, 'stock')) - Number(count);
    ctx.replace(w.id, [{ ...w, attrs: { ...w.attrs, stock: [String(left)] } }]); // refused below zero by the slot
    ctx.tell(`@out_${w.id}_${ctx.world.seq} withdrawal of=$${w.id} count=${count}`);
    return left;
  },
};
