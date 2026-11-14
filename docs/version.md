# sopworld 0.70.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.70.0 |
| Build | 7c231fb8f1ec |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 732.6 kB, 209.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 731.6 kB, 209.5 kB gzipped |
| Modules bundled | 39 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.70.0'
build     // { version: '0.70.0', hash: '7c231fb8f1ec', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
