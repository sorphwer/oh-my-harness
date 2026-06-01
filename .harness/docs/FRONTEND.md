# Interface Conventions

harness-kit does not have a product frontend. The current interface is a direct
TypeScript development entrypoint plus the generated `.harness/` document tree.

## Current Interface

Programmatic API:

```ts
compile(yamlPath: string): Promise<string>
```

Development entrypoint:

```bash
npx tsx src/compile.ts <harness.yaml>
```

Example:

```bash
npx tsx src/compile.ts harness.yaml
```

This entrypoint is intentionally plain. It proves compiler behavior before the
project commits to a packaged CLI command name, install flow, or publishing
workflow.

## Generated Documentation UI

The generated `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/` folder is itself
the first reading interface.
Generated docs should be:

- concrete about what is known and what still needs user answers
- free of template variables and unresolved markers
- consistent in terminology
- short enough for agents to load selectively
- linked by relative paths that work in a plain repository browser

## Command Output Conventions

Current success prints the generated output folder and exits 0 after writing
files.

Future command output should:

- print the count of written files on successful compile
- name the yaml path and schema issue on validation failure
- name the missing plugin id on plugin resolution failure
- name the missing template path on template failure
- name the target path on emit failure

## Future CLI Principles

- Defer final command names until the packaged CLI is designed.
- Prefer explicit paths over implicit global state.
- Print file paths relative to the current working directory when possible.
- Do not require network access for compile, check, or watch.
- Do not call an LLM unless the user explicitly invokes an authoring command.

## Boundaries

- No terminal UI framework.
- No web dashboard.
- No interactive wizard before the compiler contract is stable.
- No spinner or animated output in CI mode.
- No remote template gallery in the deterministic compile path.
