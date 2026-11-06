# 0002. Public GitHub repo

**Status:** Accepted · **Date:** 2026-11-04

**Context:** The code is hosted on GitHub. Public or private decides which security tools are free.

**Decision:** The repo is public.

**Consequences:**
- CodeQL code scanning, secret scanning and push protection are free.
- Anyone can read the code, issues and full commit history. A secret committed even once is exposed and must be rotated right away.
- Never put customer data or private notes in the repo.
- PRs from forks run CI without secrets. Never use `pull_request_target` to get around that.
