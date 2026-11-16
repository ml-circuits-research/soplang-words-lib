# PSys2 consumer integration

Only the new reader integration and its development/evaluation provenance remain here.
The owner retired the old PSys2 execution path; its legend adapters, typed-reader sample,
legacy dialogue matrices, recorded answer fixtures and replay runner were removed.
Their historical results remain in Git and worker-log.md, not as current acceptance gates.

`reader/` contains the declared grammar/profile adapters, source-pinned integration
configuration, reader corpus and evidence records used by the new request path.
Generic mechanisms remain in the library; application-specific vocabulary and source
joins remain consumer configuration. The library never imports this directory.

Run the active source suite with `npm test`; reader integration tests are under `test/`.
