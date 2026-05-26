# Project Wiki

Durable Pyrefly notes for agents:

- Architecture flows from exports to bindings to solving. Keep fixes in the
  phase that owns the information being changed.
- `pyrefly/lib/alt` contains much of the solving logic.
- `pyrefly/lib/binding` owns binding construction.
- `pyrefly/lib/export` owns export discovery.
- `pyrefly/lib/module` owns import resolution and module finding.
- `pyrefly/lib/state` supports language-server state.
- `pyrefly/lib/test` contains type-checker integration tests.
- `pyrefly/lib/test/lsp` contains lightweight LSP tests.
- `pyrefly/lib/test/lsp/lsp_interaction` is heavyweight; use it only when
  lightweight tests cannot cover the behavior.
- `conformance` is generated from upstream typing conformance tests; do not edit
  it by hand.
