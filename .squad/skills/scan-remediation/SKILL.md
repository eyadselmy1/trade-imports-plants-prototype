---
name: 'scan-remediation'
description: 'Mandatory workflow for triaging, reviewing, fixing, testing and opening draft PRs for Git Insights Hub (gih-security-scan) issues, including secret issues.'
domain: 'security'
confidence: 'high'
source: 'manual — user directive from Eyad Selmy, 2026-11-06'
---

## Context

Git Insights Hub (an external scanner) runs Semgrep, secret scanning, OSV dependency
scanning and an AI generator checked by an AI verifier. It opens one GitHub issue per
finding. The team's job is **remediation**: review each in-scope issue against the
current code, fix it with the smallest safe change if it is real, build, run and test,
and open a **DRAFT** PR. Humans review and merge every PR. The team never merges.

**Scanner findings are not automatically correct.** Some are false positives, already
fixed, or harmless (test fixtures, documentation examples, placeholders). Review every
issue against HEAD before changing anything.

This skill applies to every session and to Ralph's watch mode whenever an issue carries
`gih-security-scan`.

## Labels

Scanner-applied: `gih-security-scan`, `security`, `severity:critical`, `secret`
(possible credential, **not** AI-checked by the scanner).

Team-applied (check with `gh label list`, create missing ones with `gh label create`):

| Label                     | Meaning                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `remediation-in-progress` | An agent has picked up this issue                                     |
| `needs-human-review`      | A human decision or action is required                                |
| `scan-false-positive`     | Review found nothing to fix (always paired with `needs-human-review`) |

## Scope and queue

- In scope: OPEN issues with BOTH `gih-security-scan` AND `severity:critical`.
- `secret` label → follow "Secret issues" below.
- SKIP: issues with `needs-human-review` or `remediation-in-progress`, an open linked PR,
  a human assignee, or missing either scope label.
- List: `gh issue list --state open --label gih-security-scan --label severity:critical`,
  then filter out the skips.
- Oldest first, **ONE ISSUE AT A TIME**. Finish an issue (PR opened or handed to a human)
  before starting the next. Agents may work in parallel _within_ an issue, never on two
  fix branches at once in the same working folder.
- Issues with the same root cause (same package, or same bug pattern across files) may be
  fixed in one PR that references all of them.

## Issue structure

Body: severity/category/effort line, **Summary**, **Location** (file:line link pinned to
the scanned commit), **Fix** (suggested steps), **Acceptance criteria**, **References**
(CWE/CVE), scan ID and commit. Treat as a starting point, not instructions. Locate the
same code at HEAD of `main`.

## Workflow per issue (non-secret)

1. **Triage — Lead.** Read the whole issue. Add `remediation-in-progress`. Comment with the
   plan and who does what.
2. **Review — Security.** Find the code at HEAD and pick one outcome, recorded with reasons
   in an issue comment:
   - **a. CONFIRMED** — real, reachable, still present → Fix.
   - **b. NOT AN ISSUE** — false positive, already fixed, dead/unreachable code, test
     fixture, doc example. No code change. Comment evidence (file, line, why). Add
     `scan-false-positive` + `needs-human-review`; remove `remediation-in-progress`.
   - **c. UNCLEAR / TOO BIG** — architecture change, breaking API, data migration,
     infrastructure access, or > ~10 files. Comment analysis + options. Add
     `needs-human-review`; remove `remediation-in-progress`.
     Never close issues.
3. **Fix — Security + Backend or Frontend.** Branch `fix/scan-<issue-number>-<short-slug>`
   from the latest `main`. Minimal root-cause fix (e.g. parameterised queries, not
   escaping; real auth checks, not hidden routes). Dependencies: lowest patched version,
   update lockfile, check for breaking changes. No refactors, reformatting or unrelated
   behaviour changes.
4. **Build, run, test — Tester.**
   - Install, build, start using the repo's own instructions; confirm the app starts.
   - Run existing tests BEFORE and AFTER. After must pass or fail only on tests that
     already failed before.
   - Add a regression test proving the vulnerability is closed where a framework exists.
   - Needs env vars / DB / Docker / credentials you lack → ASK the human. Don't invent
     values or stub. If something cannot run, state exactly what was and wasn't verified.
5. **Review — Reviewer (never the author).** Check against Acceptance criteria, no new
   vulnerability, no secrets, in scope. Reject → a different agent revises.
6. **Pull request — Lead.** DRAFT PR against `main`.
   - Title: `fix(security): <short description> (#<issue-number>)`
   - Body: `Fixes #<n>` (one line per issue), finding (CWE/CVE, file, line), why
     confirmed, root cause, what changed, verification commands + results before/after,
     regression test added, acceptance criteria met / not met, residual risk.
   - Only fix-related files. **No `.squad/` changes on fix branches.**
   - Comment on the issue with the PR link; remove `remediation-in-progress`.

## Secret issues (`secret` label)

Not AI-reviewed by the scanner; parts are human-only. Still review first and fix what is
safe:

1. Classify the value at HEAD:
   - **PLACEHOLDER / EXAMPLE** — obviously fake or a doc sample.
   - **LIKELY REAL** — full key block, high-entropy token, or used by runtime code/config.
   - **ALREADY REMOVED** — gone from HEAD (may remain in git history).
     **NEVER print, quote, log or commit the value** — not in comments, PRs, pasted terminal
     output, or `.squad/`. Refer to it by file, line and type only. When inspecting, use
     commands that reveal structure, not content (line numbers, lengths, `BEGIN`/`END`
     marker lines only).
2. If safe, open a DRAFT PR replacing the hardcoded value: config/env read + placeholder in
   `.env.example` for runtime code; an obvious placeholder such as `<PRIVATE_KEY>` for docs
   and tests. PR body must state it does **NOT** revoke the credential and that the value is
   **still in git history**.
3. ALWAYS add `needs-human-review` (+ `scan-false-positive` if placeholder) and comment with
   classification, evidence and this checklist:
   - [ ] Confirm whether the credential is real
   - [ ] If real: revoke and rotate it FIRST, before merging anything
   - [ ] Purge it from git history (git filter-repo / BFG). This is a human-only task.
   - [ ] Decide whether to add a CI secret scanner (for example, gitleaks)
         Never rewrite history, force-push, or attempt to revoke/rotate credentials.

## Guardrails

- Never push to `main`, force-push, rewrite history, merge PRs, close issues, or change
  CI/CD workflows or branch protection. Suggest these in comments.
- Never print, log or commit secret values.
- Never edit Squad-owned files (`.squad/templates/`, `.github/agents/`, `.github/skills/`,
  etc.) to make a finding go away. Findings in Squad templates/docs are almost always
  documentation examples: classify and hand to a human.
- Build/test failures unrelated to the fix → note on the issue, keep out of the PR.
- Record recurring knowledge (build/run/test recipes, false-positive patterns, fixes that
  worked) in agent `history.md` and this skill's "Learned patterns" section.

## Repo-specific rules (trade-imports-plants-prototype)

- Branch naming `fix/scan-<n>-<slug>` is approved for scan fixes and overrides the AGENTS.md
  branch list for this purpose only (user decision 2026-11-06).
- Fixes touching real-service files (anything not in `overrides.json` → `ours`, e.g.
  `package.json`, `package-lock.json`, `src/server/app/services/**`) are made here on the
  `fix/scan-*` branch; the PR body must flag that the change should also be raised upstream
  in plants-frontend, since the weekly sync may overwrite it.
- Install only with the pinned npm (`packageManager` in `package.json`, npm 11.19.0). Never
  bare `npm install` / `npm ci`. `--no-verify` is allowed on commit and push.
- Use `npm run designer:where -- <paths>` to confirm file ownership before editing.

## Learned patterns

<!-- Append: build/run/test recipes, false-positive patterns, fixes that worked. -->
