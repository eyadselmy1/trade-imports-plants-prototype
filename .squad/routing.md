# Work Routing

How to decide who handles what.

## Routing Table

| Work Type                                                        | Route To | Examples                                      |
| ---------------------------------------------------------------- | -------- | --------------------------------------------- |
| Security-scan triage, labels, issue comments, draft PRs          | Lead     | `gih-security-scan` issue queue               |
| Finding review, classification, fix design, secret issues        | Security | CWE/CVE review, PLACEHOLDER vs LIKELY REAL    |
| Hapi server, config, auth/session, dependency bumps              | Backend  | `@hapi/*` upgrades, lockfile, env reads       |
| Nunjucks templates, GOV.UK/MoJ Frontend, client JS/Sass, webpack | Frontend | XSS/escaping, CSP-related fixes               |
| Build, run, before/after tests, regression tests                 | Tester   | `npm test`, `npm run lint`, Playwright `fit/` |
| Independent PR review vs acceptance criteria                     | Reviewer | Every scan-fix PR (never the author)          |
| Unmatched work or ownership disputes                             | Lead     | —                                             |

Preset installation adds concrete routes for the configured team. Add or edit rows
here only when their agent names also exist in the casting registry.

## Issue Routing

| Label               | Action                                                                                                                                                                                             | Who                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `squad`             | Triage: analyze issue, assign `squad:{member}` label                                                                                                                                               | Lead                                                          |
| `squad:{name}`      | Pick up issue and complete the work                                                                                                                                                                | Named member                                                  |
| `gih-security-scan` | Triage, then follow `.squad/skills/scan-remediation/SKILL.md` (in scope only with `severity:critical`; skip if `needs-human-review`, `remediation-in-progress`, open linked PR, or human assignee) | Lead → Security → Backend/Frontend → Tester → Reviewer → Lead |

### Security-scan issues (`gih-security-scan`)

**Mandatory for every session and Ralph's watch mode.** These issues always go to the
**Lead** for triage, then follow `.squad/skills/scan-remediation/SKILL.md` exactly:
oldest first, one issue at a time, review against HEAD before any change, draft PRs only,
never merge or close, never print secret values. Issues labelled `secret` take the
skill's "Secret issues" path. Scan issues are NOT eligible for the generic eager/parallel
rules below.

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work. _Exception:_ `gih-security-scan` work is strictly one issue at a time (see above).
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.
