# sopworld 0.216.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.216.0 |
| Build | bfd2dd42520d |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1627.7 kB, 456.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1624.4 kB, 456.2 kB gzipped |
| Modules bundled | 107 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.216.0'
build     // { version: '0.216.0', hash: 'bfd2dd42520d', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
