# sopworld 0.224.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.224.0 |
| Build | 3c57fc711951 |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1651.4 kB, 462.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1648.0 kB, 461.9 kB gzipped |
| Modules bundled | 108 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.224.0'
build     // { version: '0.224.0', hash: '3c57fc711951', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
