# sopworld 0.228.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.228.0 |
| Build | 879b70c3d468 |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1689.4 kB, 473.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1686.1 kB, 473.0 kB gzipped |
| Modules bundled | 110 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.228.0'
build     // { version: '0.228.0', hash: '879b70c3d468', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
