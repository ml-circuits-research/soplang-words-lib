# sopworld 0.225.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.225.0 |
| Build | c8f43d1e1cac |
| Built | 2026-11-19 |
| `sopworld.mjs` (ES module) | 1661.9 kB, 465.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1658.6 kB, 465.2 kB gzipped |
| Modules bundled | 109 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.225.0'
build     // { version: '0.225.0', hash: 'c8f43d1e1cac', date: '2026-11-19' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
