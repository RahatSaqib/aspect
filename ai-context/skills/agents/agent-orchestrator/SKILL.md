---
name: agent-orchestrator
description: >-
  Coordinates autonomous multi-role delivery for Aspect (PM, architecture, backend,
  frontend, security, QA). Use when the user wants end-to-end autonomous work, a full
  feature pipeline, or explicitly asks to run architecture/frontend/backend/QA/security/PM agents together.
---

# Agent Orchestrator

Runs the Aspect delivery pipeline autonomously until acceptance criteria pass or a human blocker is reported.

## When to activate

- User asks for autonomous / multi-agent / full-pipeline delivery
- Ticket spans API + web + tests + security
- User names multiple roles (e.g. "backend + frontend + QA")

## Pipeline

Copy and update this checklist each iteration:

```
Pipeline:
- [ ] 1. PM — scope, acceptance criteria, risks
- [ ] 2. Architecture — approach, boundaries, tradeoffs
- [ ] 3a. Backend — implement + verify (parallel when possible)
- [ ] 3b. Frontend — implement + verify (parallel when possible)
- [ ] 4. Security — review + required fixes
- [ ] 5. QA — test plan, run tests, regressions
- [ ] 6. PM — ship decision or next iteration
```

### Execution rules

1. **Do not stop at planning** — each role that owns code must implement, run checks, and hand off.
2. **Read role skills** before acting as that role (under `ai-context/skills/agents/`):
   - `agent-pm/SKILL.md`, `agent-architecture/SKILL.md`, `agent-backend/SKILL.md`, `agent-frontend/SKILL.md`, `agent-security/SKILL.md`, `agent-qa/SKILL.md`
3. **Parallelize** backend and frontend when architecture shows no ordering dependency.
4. **Domain skills** — delegate to `ai-context/skills/` when touching DB, auth, dates, migrations, reports, True Connect, etc.
5. **Node 14.19.0** for API commands (see `AGENTS.md`); never reinstall bcrypt or native deps from a newer Node.
6. **Scope** — minimal diff; no drive-by refactors.
7. **Loop** — if QA or security fails, re-run affected roles and repeat from step 4 until PM signs off or reports `BLOCKERS`.

### Using Cursor subagents (Task tool)

When work is large or exploratory:

| Need | Subagent |
|------|----------|
| Codebase search / "where is X" | `explore` |
| Git, yarn, migrations, tests | `shell` |
| CI failure on a PR | `ci-investigator` |

Pass each subagent: ticket context, acceptance criteria, files in scope, and the handoff format below.

## Handoff contract (all roles)

Every role ends with this structure:

```markdown
## ROLE: <name>

### CONTEXT
<what was understood>

### PLAN
<what this role did or will do>

### CHANGES
<files touched, APIs/contracts, migrations>

### RISKS
<technical, product, security, rollout>

### NEXT_ACTIONS
<concrete tasks for the next role(s)>

### BLOCKERS
<empty, or what needs a human>
```

## Starting a run

If the user did not provide a ticket:

1. Ask only for: goal, acceptance criteria (or infer from ticket link), and constraints (branch, deadline, out of scope).
2. Otherwise infer from branch name, open files, and `git diff`.

## Final deliverable

After PM sign-off, summarize for the user:

- What shipped (user-facing)
- Files / endpoints / UI touched
- Tests run and results
- Security notes
- Follow-ups (if any)
- How to verify manually

## Stopping conditions

Stop looping when:

- All acceptance criteria are met and tests pass, or
- `BLOCKERS` requires human input (permissions, product decision, missing credentials, `db:reseed`, production deploy)

Do not commit or open PRs unless the user asked.
