# Interface Conventions

harness-kit does not have a product frontend in the current MVP. The first interface is a local compiler function, followed later by a CLI. This file records conventions for any human-facing surface that gets added.

## Current Interface

v0 exposes:

```ts
compile(yamlPath: string, outDir: string): Promise<void>
```

This API is intentionally plain. It lets tests exercise the compiler before the project commits to CLI shape, command name, install flow, or package publishing.

## Future CLI Principles

- Keep commands literal: `compile`, `check`, `watch`, `init`.
- Prefer explicit paths over implicit global state.
- Print file paths relative to the current working directory when possible.
- Fail with actionable messages that name the yaml path, fragment id, or output path involved.
- Do not require network access for compile, check, or watch.
- Do not call an LLM unless the user explicitly invokes an authoring command.

## Documentation UI

The generated `.harness/` folder is itself a reading interface. Generated docs should be:

- concrete to the target project
- free of skeleton placeholders
- consistent in terminology
- short enough for agents to load selectively
- linked by relative paths that work in a plain repository browser

## Command Output Conventions

When the CLI exists:

- Successful compile: print the output folder and count of written files.
- Check success: print that the generated output matches expected output.
- Validation failure: print yaml path and schema path.
- Unknown id: print the missing id and the pool that was searched.
- Render failure: print the doc id and output path.
- Emit failure: print the file path that could not be written.

## V1 Boundaries

- No terminal UI framework.
- No web dashboard.
- No interactive wizard before the compiler is proven.
- No spinner or animated output in CI mode.
- No remote template gallery in the deterministic compile path.

