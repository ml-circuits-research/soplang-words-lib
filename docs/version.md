# sopworld 0.117.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.117.0 |
| Build | f9fed843f2e2 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 918.7 kB, 266.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 916.8 kB, 266.0 kB gzipped |
| Modules bundled | 54 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.117.0'
build     // { version: '0.117.0', hash: 'f9fed843f2e2', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
