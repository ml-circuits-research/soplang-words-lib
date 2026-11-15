# sopworld 0.152.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.152.1 |
| Build | bd462d623804 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1213.5 kB, 351.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1210.7 kB, 351.0 kB gzipped |
| Modules bundled | 70 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.152.1'
build     // { version: '0.152.1', hash: 'bd462d623804', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
