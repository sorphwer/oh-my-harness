# Pyrefly Orientation

Phase: brainstorm

Triggers:
- new task
- bug report
- GitHub issue

Requires:
- local source context

Outputs:
- affected area
- build tool
- vcs

Gates:
- Environment detected (required): environment-detected
- Architecture fit checked (required): architecture-fit

Instructions:
- Identify whether the work touches exports, bindings, solving, CLI/config,
  errors, module resolution, state, tests, LSP, website, or VS Code extension.
- Detect build mode from the root `BUCK` file before choosing commands.
- Detect Git versus Sapling before source-control commands.
- For issue-driven fixes, read the issue contract before deciding the fix.
