# Pyrefly Implementation

Phase: implement

Triggers:
- ready task

Requires:
- implementation plan

Outputs:
- code changes
- test changes

Gates:
- Architecture fit checked (required): architecture-fit
- Regression considered (required): regression-considered

Instructions:
- Keep the change local to the architecture phase that owns the data.
- Use existing `pyrefly_types` helpers before manually matching on `Type`.
- Use explicit panics for unreachable states instead of silent fallbacks.
- Put Rust imports at the top of the file unless a name collision requires an
  inline path.
- Add or update the targeted regression test selected during planning.
