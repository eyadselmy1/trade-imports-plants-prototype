# Squad Decisions

## Active Decisions

### 2026-11-06T15:28:37Z: Security-scan remediation workflow (team-wide, permanent)

**By:** Eyad Selmy (via Copilot)
**What:** The team's mission is remediating Git Insights Hub (`gih-security-scan`) issues. The full workflow — scope (`gih-security-scan` + `severity:critical`, skip `needs-human-review` / `remediation-in-progress` / open linked PR / human assignee), oldest-first one-issue-at-a-time queue, Lead triage → Security review (CONFIRMED / NOT AN ISSUE / UNCLEAR-TOO BIG, always commented) → minimal root-cause fix on `fix/scan-<n>-<slug>` → Tester before/after build, run and tests with regression test → independent Reviewer → Lead opens DRAFT PR (`fix(security): <desc> (#<n>)`, `Fixes #<n>`, full evidence body, no `.squad/` files), the secret-issue path (classify PLACEHOLDER / LIKELY REAL / ALREADY REMOVED, never print values, always `needs-human-review` + human checklist), team labels, and guardrails — is canonical in `.squad/skills/scan-remediation/SKILL.md`. Every session and Ralph's watch mode must follow it.
**Also decided:**

- Scan-fix branches use `fix/scan-<n>-<slug>`, overriding the AGENTS.md branch list for this purpose only.
- Fixes touching real-service files (not in `overrides.json` `ours`, e.g. `package.json`) are made here; the PR body must flag that they should also go upstream to plants-frontend.
- Never merge PRs, close issues, push to `main`, force-push, rewrite history, or change CI/CD or branch protection. Never edit Squad-owned files to silence a finding.
  **Why:** Scanner findings can be false positives, already fixed, or harmless; humans must review and merge every change.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
