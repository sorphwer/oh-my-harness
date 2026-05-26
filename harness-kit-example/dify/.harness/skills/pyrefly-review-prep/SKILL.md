# Pyrefly Review Prep

Phase: review

Triggers:
- before PR
- handoff

Requires:
- test evidence

Outputs:
- review summary

Gates:
- Verify before completion (required): needs-tests

Instructions:
- Summarize the semantics or user-visible behavior first.
- Include targeted test and formatting/linting evidence.
- Call out any verification that could not run.
- Avoid a laundry list of file edits unless the reviewer needs it.
