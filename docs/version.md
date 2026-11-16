# sopworld 0.185.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.185.0 |
| Build | e1c306c2e513 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1406.9 kB, 400.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1404.0 kB, 400.3 kB gzipped |
| Modules bundled | 78 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.185.0'
build     // { version: '0.185.0', hash: 'e1c306c2e513', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
