# sopworld 0.184.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.184.0 |
| Build | cb50100fc6be |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1402.2 kB, 399.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1399.3 kB, 398.8 kB gzipped |
| Modules bundled | 77 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.184.0'
build     // { version: '0.184.0', hash: 'cb50100fc6be', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
