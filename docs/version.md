# sopworld 0.122.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.122.0 |
| Build | ed2923b13e8e |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 923.7 kB, 268.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 921.8 kB, 268.0 kB gzipped |
| Modules bundled | 58 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.122.0'
build     // { version: '0.122.0', hash: 'ed2923b13e8e', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
