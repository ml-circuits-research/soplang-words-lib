# sopworld 0.203.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.203.0 |
| Build | 4311affaf970 |
| Built | 2026-11-17 |
| `sopworld.mjs` (ES module) | 1517.9 kB, 428.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1514.6 kB, 427.8 kB gzipped |
| Modules bundled | 93 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.203.0'
build     // { version: '0.203.0', hash: '4311affaf970', date: '2026-11-17' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
