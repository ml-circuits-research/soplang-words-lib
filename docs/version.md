# sopworld 0.55.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.55.0 |
| Build | ba4e730aa89e |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 646.5 kB, 183.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 645.8 kB, 183.5 kB gzipped |
| Modules bundled | 32 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.55.0'
build     // { version: '0.55.0', hash: 'ba4e730aa89e', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
