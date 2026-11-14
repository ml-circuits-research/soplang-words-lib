# sopworld 0.64.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.64.0 |
| Build | e691166458ff |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 693.3 kB, 197.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 692.4 kB, 197.7 kB gzipped |
| Modules bundled | 37 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.64.0'
build     // { version: '0.64.0', hash: 'e691166458ff', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
