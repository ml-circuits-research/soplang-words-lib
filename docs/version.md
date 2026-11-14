# sopworld 0.46.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.46.0 |
| Build | b4687144b29e |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 591.9 kB, 167.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 591.4 kB, 167.1 kB gzipped |
| Modules bundled | 28 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.46.0'
build     // { version: '0.46.0', hash: 'b4687144b29e', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
