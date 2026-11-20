# sopworld 0.244.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.244.0 |
| Build | dd5631c1776c |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1803.0 kB, 504.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1799.4 kB, 503.7 kB gzipped |
| Modules bundled | 114 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.244.0'
build     // { version: '0.244.0', hash: 'dd5631c1776c', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
