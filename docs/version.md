# sopworld 0.237.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.237.0 |
| Build | 46d3264498fa |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1764.0 kB, 493.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1760.5 kB, 493.2 kB gzipped |
| Modules bundled | 111 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.237.0'
build     // { version: '0.237.0', hash: '46d3264498fa', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
