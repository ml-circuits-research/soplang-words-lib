# sopworld 0.148.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.148.0 |
| Build | fe4d3c943918 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1036.0 kB, 302.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1033.8 kB, 301.6 kB gzipped |
| Modules bundled | 65 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.148.0'
build     // { version: '0.148.0', hash: 'fe4d3c943918', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
