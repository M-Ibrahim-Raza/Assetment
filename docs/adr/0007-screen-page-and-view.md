# 0007. Screens split into page and View

**Status:** Accepted · **Date:** 2026-11-09

**Context:** The living prototype ([0006](0006-living-ui-prototype.md)) must always match production.

**Decision:** Every production screen has a page or container that loads data, and a View that only displays it, taking data and callbacks as props. The prototype renders shipped Views with fake data, and its scenarios must `satisfies` the View's props type. To change a shipped screen, fork the View into `prototypes/`, change it, build the change in production, then delete the fork. Each screen exists once, so it can't drift.

**Consequences:**
- A production PR that changes a View's props must update its prototype scenarios, or the type check fails.
- Views are easy to test with props alone. Data hooks move up to the container, which can mean more props.
- The prototype imports production. Production never imports `prototypes/`.
