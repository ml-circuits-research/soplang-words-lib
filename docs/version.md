# sopworld 0.136.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.136.0 |
| Build | c6e1d3f01bff |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 995.2 kB, 290.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 993.1 kB, 289.6 kB gzipped |
| Modules bundled | 64 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.136.0'
build     // { version: '0.136.0', hash: 'c6e1d3f01bff', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
