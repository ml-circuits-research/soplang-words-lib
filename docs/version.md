# sopworld 0.193.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.193.0 |
| Build | 880ba8cf3531 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1459.5 kB, 414.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1456.5 kB, 414.2 kB gzipped |
| Modules bundled | 84 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.193.0'
build     // { version: '0.193.0', hash: '880ba8cf3531', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
