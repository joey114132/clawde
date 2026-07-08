# Security Policy

Clawde is a cosmetic desktop/terminal mascot — it doesn't handle credentials or
network data beyond an optional, opt-in leaderboard. Still, if you find a
security issue, we'd like to know.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem. Instead:

1. Use GitHub's [private vulnerability reporting](https://github.com/joey114132/clawde/security/advisories/new)
   on this repository, **or**
2. Contact the maintainer via [@joey114132](https://github.com/joey114132).

Include what you found, how to reproduce it, and the affected surface (terminal,
GNOME extension, or desktop app). We'll acknowledge your report and work on a fix.

## Scope notes

- The **desktop app** installers are currently **unsigned**; that's a known
  limitation, not a vulnerability (see the README/release notes).
- The **leaderboard** uses a public, anon Supabase key by design; it is meant to
  be public and is protected by row-level security.

## Supported versions

Only the latest release is supported. Please upgrade before reporting.
