// PSys2's legend wires (`@<type> core.type`, `@<type>.<key> core.key value= card=`) as the plain description
// typedWorldFor takes. Joins to knowledge are named by the host (PSys2's legends do not say them):
// { '<type>.<key>': { type, by } }. Mapping code only; the library does not import it.
import { parse } from '../../../src/index.mjs';

const bare = (v) => String(v ?? '').replace(/^"|"$/g, '').replace(/^\$/, '');

export function describeLegend(text, { joins = {} } = {}) {
  const wires = parse(text).filter((w) => w.id);
  const types = wires.filter((w) => w.type === 'core.type').map((w) => w.id);
  const kinds = types.map((type) => ({
    type,
    words: [type.split('.').pop().replace(/_/g, ' ')],
    keys: wires.filter((w) => w.type === 'core.key' && w.id.startsWith(`${type}.`) && !w.id.slice(type.length + 1).includes('.')).map((w) => {
      const key = w.id.slice(type.length + 1), value = bare(w.attrs.value?.[0] ?? 'string');
      return { key, value: value.startsWith('core.') ? 'string' : value, many: bare(w.attrs.card?.[0]) === 'many', join: joins[w.id] ?? null, words: [key.replace(/_/g, ' ')] };
    }),
  }));
  return { kinds, words: [] };
}
