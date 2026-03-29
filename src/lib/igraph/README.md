# igraph integration

This project links the local igraph source tree from:

- `/Users/imt/Documents/igraph-main 2`

The linked source is available inside this website project at:

- `vendor/igraph-source`

The frontend wrapper entry is:

- `src/lib/igraph/index.ts`

Important:

- The linked igraph source is the upstream C library source tree, not a browser-ready npm package.
- It is available in this project for later use, inspection, and integration work.
- To use igraph directly in the website runtime, the next step will need one of these approaches:
  - compile igraph to WebAssembly and load it in the browser
  - expose igraph through a local Python/C/C++ backend service
  - replace runtime usage with a JS graph library while keeping igraph for offline analysis
