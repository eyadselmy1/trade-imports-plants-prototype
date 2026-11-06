# Squad Team

> trade-imports-plants-prototype

## Coordinator

| Name  | Role        | Notes                                              |
| ----- | ----------- | -------------------------------------------------- |
| Squad | Coordinator | Routes work, enforces handoffs and reviewer gates. |

## Members

| Name         | Role                    | Charter                               | Status      |
| ------------ | ----------------------- | ------------------------------------- | ----------- |
| Lead         | Lead / Triage           | .squad/agents/lead/charter.md         | 🏗️ Active   |
| Security     | Security Engineer       | .squad/agents/security/charter.md     | 🔒 Active   |
| Backend      | Backend Dev             | .squad/agents/backend/charter.md      | 🔧 Active   |
| Frontend     | Frontend Dev            | .squad/agents/frontend/charter.md     | ⚛️ Active   |
| Tester       | Tester                  | .squad/agents/tester/charter.md       | 🧪 Active   |
| Reviewer     | Reviewer                | .squad/agents/reviewer/charter.md     | 🔎 Active   |
| Scribe       | Durable Decision Merger | .squad/agents/scribe/charter.md       | 📋 Silent   |
| Ralph        | Work Monitor            | .squad/agents/ralph/charter.md        | 🔄 Monitor  |
| Rai          | RAI Reviewer            | .squad/agents/Rai/charter.md          | 🛡️ RAI      |
| Fact Checker | Fact Checker            | .squad/agents/fact-checker/charter.md | 🔍 Verifier |

## Coding Agent

<!-- copilot-auto-assign: false -->

| Name     | Role         | Charter | Status          |
| -------- | ------------ | ------- | --------------- |
| @copilot | Coding Agent | —       | 🤖 Coding Agent |

### Capabilities

**🟢 Good fit — auto-route when enabled:**

- Bug fixes with clear reproduction steps
- Test coverage (adding missing tests, fixing flaky tests)
- Lint/format fixes and code style cleanup
- Dependency updates and version bumps
- Small isolated features with clear specs
- Boilerplate/scaffolding generation
- Documentation fixes and README updates

**🟡 Needs review — route to @copilot but flag for squad member PR review:**

- Medium features with clear specs and acceptance criteria
- Refactoring with existing test coverage
- API endpoint additions following established patterns
- Migration scripts with well-defined schemas

**🔴 Not suitable — route to squad member instead:**

- Architecture decisions and system design
- Multi-system integration requiring coordination
- Ambiguous requirements needing clarification
- Security-critical changes (auth, encryption, access control)
- Performance-critical paths requiring benchmarking
- Changes requiring cross-team discussion

## Project Context

- **Project:** trade-imports-plants-prototype
- **Owner:** Eyad Selmy
- **Created:** 2026-11-06
- **Mission:** Remediate Git Insights Hub security-scan issues (`gih-security-scan` + `severity:critical`). Workflow: `.squad/skills/scan-remediation/SKILL.md`.
- **Stack:** Node 24 (npm pinned 11.19.0), Hapi, Nunjucks + GOV.UK/MoJ Frontend, webpack/Sass, Vitest, Playwright (`fit/`). Runs with all services stubbed.
- **Repo contract:** `AGENTS.md` (ownership via `overrides.json`, pinned npm, `--no-verify` allowed on commit and push, no force-push).
