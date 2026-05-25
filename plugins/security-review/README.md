# security-review

Threat modeling, security review, and fixing validated findings.

## Contributes

- `skills/threat-model` — enumerate assets, actors, and abuse cases for a given surface.
- `skills/security-scan` — review code/config for the OWASP-style classes that actually matter for this surface.
- `skills/fix-security-finding` — apply a fix that closes the validated finding without regressing other invariants.

## When to include

Any project that handles authentication, untrusted input, secrets, or PII. Pair with `backend` for server-side surfaces.
