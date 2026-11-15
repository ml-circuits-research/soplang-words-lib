# sopworld 0.127.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.127.0 |
| Build | 678957b65c2e |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 932.7 kB, 271.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 930.8 kB, 271.1 kB gzipped |
| Modules bundled | 60 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.127.0'
build     // { version: '0.127.0', hash: '678957b65c2e', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
