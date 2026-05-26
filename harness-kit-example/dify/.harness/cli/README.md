# Existing Project Setup

This `.harness` directory is checked into the working tree as project-specific
agent guidance. Do not reapply a generated ZIP baseline over it without first
checking the diff.

Useful orientation commands from the repository root:

```sh
test -f BUCK && echo buck || echo cargo
test -d "$(sl root 2>/dev/null)/.sl" && echo sapling || echo git
cargo test <test_name>
python3 test.py --no-test --no-conformance --no-jsonschema
```

Use `buck test pyrefly:pyrefly_library -- <test_name>` instead of Cargo in an
internal Buck checkout.
