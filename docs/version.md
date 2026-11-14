# sopworld 0.95.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.95.0 |
| Build | 9fe8ffa4be11 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 817.1 kB, 235.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 815.7 kB, 235.0 kB gzipped |
| Modules bundled | 46 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.95.0'
build     // { version: '0.95.0', hash: '9fe8ffa4be11', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
