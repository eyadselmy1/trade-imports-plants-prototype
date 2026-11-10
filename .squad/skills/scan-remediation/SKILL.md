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
- Oldest first, **ONE ISSUE AT A TIME**. Finish an issue (CI follow-up done, or handed to a
  human) before starting the next. Agents may work in parallel _within_ an issue, never on two
  fix branches at once in the same working folder.
- Issues with the same root cause (same package, or same bug pattern across files) may be
  fixed in one PR that references all of them.

## Issue structure

Body: severity/category/effort line, **Summary**, **Location** (file:line link pinned to
the scanned commit), **Fix** (suggested steps), **Acceptance criteria**, **References**
(CWE/CVE), scan ID and commit. Treat as a starting point, not instructions. Locate the
same code at HEAD of the default branch.

`<default>` below means the repo's default branch:
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`.

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
   from the latest `origin/<default>`. Minimal root-cause fix (e.g. parameterised queries, not
   escaping; real auth checks, not hidden routes). Dependencies: lowest patched version,
   update lockfile, check for breaking changes. No refactors, reformatting or unrelated
   behaviour changes.
4. **Build, run, test — Tester.** Follow "Validation" below.
   - Always run the repo's existing test suites locally, BEFORE (baseline) and AFTER the
     fix, before anything is pushed. After must pass, or fail only on tests that already
     failed before. CI is extra evidence, never a substitute.
   - Add a regression test proving the vulnerability is closed where a framework exists.
   - Needs env vars / DB / Docker / credentials you lack → ASK the human. Don't invent
     values or stub. If something cannot run, state exactly what was and wasn't verified.
   - A new failure → back to the fix author with the failing check and log excerpt.
5. **Security re-scan — Security.** Follow "Security re-scan" below. The original finding
   must be gone and no new finding introduced. Otherwise → back to the fix author.
6. **Review — Reviewer (never the author).** Check against Acceptance criteria, no new
   vulnerability, no secrets, in scope, and complete validation and re-scan tables with no
   unexplained new failure or finding. Reject → a different agent revises.
7. **Pull request — Lead.** DRAFT PR against `<default>`.
   - Title: `fix(security): <short description> (#<issue-number>)`
   - Body: fill [pr-template.md](pr-template.md) (next to this file) into
     `.squad/.scratch/scan-<n>/pr-body.md`, then
     `gh pr create --draft --base <default> --title "<title>" --body-file <that file>`.
     Every section is filled or says `n/a` with a reason; none is deleted.
   - Only fix-related files. **No `.squad/` changes on fix branches.**
   - Comment on the issue with the PR link.
8. **CI follow-up — Tester + Lead.** Follow "CI follow-up loop" below. Then check
   "Definition of done" and remove `remediation-in-progress`. The PR stays a draft;
   humans mark it ready.

## Repo profile

The checks a fix must pass are whatever this repo's CI runs on a pull request. Build the
profile once per repo, record it under "Repo-specific rules" below (on the default
checkout, never a fix branch), and reuse it. Refresh it when the CI config has changed
since the recorded commit (`git log -1 --format=%h -- .github/workflows`).

1. Read the CI config: `.github/workflows/*.yml` (jobs triggered by `pull_request`), or
   `azure-pipelines.yml`, `.gitlab-ci.yml`, `Jenkinsfile`. Not GitHub Actions → the
   `gh run` commands below don't apply; use `gh pr checks` if it reports there, else ask
   the human how to read CI results.
2. Read the repo's own instructions: `README`, `CONTRIBUTING`, `AGENTS.md`/`CLAUDE.md`,
   and the manifest (`package.json` scripts, `Makefile`, `pyproject.toml`, `*.csproj`,
   `pom.xml`, `build.gradle`, `go.mod`).
3. Toolchain: version files (`.nvmrc`, `.node-version`, `.tool-versions`,
   `.python-version`, `global.json`, `rust-toolchain*`) and package-manager pins; match
   what CI's `setup-*` steps use.
4. Record a table: CI workflow / job | local command(s) | needs (Docker, browser,
   service, env var **names** only) | runs locally? yes/no. Include the app-start command
   and the endpoints/pages CI's smoke or boot job asserts.

## Validation

Run by the Tester in step 4, and again for every iteration of the CI loop.

1. **Preflight** — fail early and tell the human exactly what is missing:
   - `gh auth status` and `gh run list --limit 1` (proves Actions read access).
   - `gh repo set-default --view` names the repo the issues live in; empty → ask the
     human which remote, then `gh repo set-default <owner>/<repo>`.
   - Toolchain versions match the profile.
   - `docker info` and browser installs, only if a profile check needs them.
   - A free port for the app.
2. **CI baseline** — the latest completed run of each PR workflow on `<default>`:
   - `gh run list --branch <default> --workflow <file> --status completed --limit 1 --json databaseId,conclusion,headSha,url`
   - Failed jobs: `gh run view <id> --json jobs -q '.jobs[] | select(.conclusion=="failure") | .name'`
3. **Local baseline** — the profile checks, including every local test suite, in a clean
   worktree of `origin/<default>`.
4. **After** — the same checks and test suites in the fix worktree, plus the new
   regression test. Run locally before every push, including each CI-loop iteration.
5. Order cheap to expensive: install → format → lint → unit tests → dependency audit →
   build → container build → app start + smoke → browser/e2e. Run each check on its own
   so one failure doesn't hide the rest.
6. **Run the app** with the repo's start command and the non-secret env CI uses for its
   smoke job. Hit the same endpoints CI asserts (not just `/health`), then stop it.
7. Save output to `.squad/.scratch/scan-<n>/{baseline,after}/<check>.log` (git-ignored).
8. **Pass** = every check and test that passed at baseline still passes locally. Only a
   check that genuinely cannot run here (missing Docker, service or credential) may be
   marked "CI only"; the CI loop is then its only evidence. Unit tests are never "CI only".
9. Validation table for the PR body: check | CI job | baseline | after | where run
   (local / CI / not run + why).

## Security re-scan

Run by Security in step 5, and again for every iteration of the CI loop. It repeats the
scanner's own kinds of check (SAST, secrets, dependencies) on the fix, so a fix can't
swap one vulnerability for another.

1. **Tools** — record in the repo profile which of these run here, and how:
   - SAST: Semgrep — `semgrep scan --config p/default --metrics off --baseline-commit origin/<default> --json -o <out>`
     (`--baseline-commit` reports only findings the branch adds).
   - Secrets: gitleaks — `gitleaks git --log-opts="origin/<default>..HEAD" --redact --no-banner --report-path <out>`.
   - Dependencies: OSV-Scanner — `osv-scanner scan source -r --format json . > <out>`, on the
     baseline worktree and the fix worktree; plus the repo's own audit command from the profile.
   - Not installed → the same tool's official container image if Docker is available;
     otherwise ask the human once whether to install it, and record the answer. A scan
     that cannot run is marked "not run + why"; Security then reviews the diff by hand
     for the same classes of issue and says so.
2. **Original finding** — re-check it directly: the same rule ID, advisory or pattern at
   the issue's location (or the dependency version) no longer reports.
3. **Pass** = original finding gone, and no new finding (any severity) that the baseline
   did not have. A new finding → treat as a failed check caused by the fix.
4. Save output to `.squad/.scratch/scan-<n>/security/` (git-ignored). Secret reports stay
   redacted; never quote a value.
5. Re-scan table for the PR body: scan | tool | baseline | after | new findings.

## CI follow-up loop

After each push to the fix branch (step 7, and every iteration below):

1. **Watch** — `gh pr checks <pr> --watch --interval 30`.
   No checks within ~5 minutes → `gh run list --branch <branch>`. `action_required`, a
   workflow that skips drafts, or none triggered → note it on the PR and the issue, add
   `needs-human-review`, and stop. Never change workflows to make them run.
2. **All green** → update the validation table (`gh pr edit <pr> --body-file <file>`),
   comment on the issue, done.
3. **A check failed** → gather evidence:
   - `gh run list --branch <branch> --limit 5 --json databaseId,workflowName,conclusion,headSha`
   - `gh run view <id> --json jobs` then `gh run view <id> --log-failed`
   - Reports if needed: `gh run download <id> -n <artifact> -D .squad/.scratch/scan-<n>/ci`
   - Compare with `git diff origin/<default>...HEAD --stat`.
4. **Classify each failed job** (Security + Tester), with evidence:
   - **CAUSED BY THE FIX** — fails in a file, package or behaviour the diff touches, or
     passes in the CI baseline and fails here with an error that points at the change.
     → reproduce locally if possible, then revise (step 3; a different agent if the
     Reviewer rejected), re-run Validation and Security re-scan, Reviewer re-checks the
     delta, push a new commit (never force-push), back to 1.
   - **PRE-EXISTING** — the same job fails the same way in the CI baseline. → record it
     in the PR body; don't fix it in this PR.
   - **FLAKY / INFRA** — unrelated to the diff, passes locally, and the log shows a
     timeout, network, runner or rate-limit error. → `gh run rerun <id> --failed` once.
     Fails again the same way → treat as PRE-EXISTING and say so.
   - **UNSURE** → treat as CAUSED BY THE FIX for one iteration; still unsure → hand to
     a human.
5. **Limit** — at most 3 revise iterations. Still red → comment on the PR and the issue
   with each attempt, the failing jobs and the evidence; add `needs-human-review`; stop.
6. CI logs can contain secrets: quote only the failing assertion or error line, never
   paste raw logs into comments, PRs or `.squad/`.

## Definition of done

The same for every repo and every issue. Lead checks it before removing
`remediation-in-progress`; Ralph does not move to the next issue until it holds. An issue
is done in exactly one of two ways.

**A. Fixed — a draft PR, where ALL of these are true:**

- [ ] Draft PR against `<default>`, from `fix/scan-<n>-<slug>`, titled
      `fix(security): … (#<n>)`, body filled from `pr-template.md` with no section deleted.
- [ ] Only fix-related files changed; no `.squad/` files; no secret values anywhere.
- [ ] Original finding no longer reports (Security re-scan step 2).
- [ ] Regression test added, or the PR says why no framework allows one.
- [ ] No new security finding versus baseline; every scan run or marked "not run + why".
- [ ] Every check that passed at baseline still passes; validation table complete.
- [ ] CI concluded: green, or every failed job classified PRE-EXISTING or FLAKY with
      evidence in the PR body. No CAUSED BY THE FIX failure left open.
- [ ] Reviewer (not the author) approved the final commit.
- [ ] Each acceptance criterion marked met / not met with a reason.
- [ ] Issue commented with the PR link and a one-paragraph summary.
- [ ] PR still a draft; `remediation-in-progress` removed.
- [ ] New recipes or false-positive patterns recorded in "Learned patterns".

**B. Handed to a human, where ALL of these are true:**

- [ ] `needs-human-review` added (+ `scan-false-positive` for a false positive or placeholder).
- [ ] Issue comment with the classification, evidence (file, line, why), what was tried,
      and the options or checklist for the human.
- [ ] Any open fix PR is left as a draft with its state explained; nothing merged or closed.
- [ ] `remediation-in-progress` removed.

Anything else is not done. If neither can be reached, B is the fallback.

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
   and tests. Use `pr-template.md`, including its "Secret findings only" section: it states
   the PR does **NOT** revoke the credential and that the value is **still in git history**.
3. ALWAYS add `needs-human-review` (+ `scan-false-positive` if placeholder) and comment with
   classification, evidence and this checklist:
   - [ ] Confirm whether the credential is real
   - [ ] If real: revoke and rotate it FIRST, before merging anything
   - [ ] Purge it from git history (git filter-repo / BFG). This is a human-only task.
   - [ ] Decide whether to add a CI secret scanner (for example, gitleaks)
         Never rewrite history, force-push, or attempt to revoke/rotate credentials.

## Guardrails

- Never push to `<default>`, force-push, rewrite history, merge PRs, close issues, mark a
  PR ready, or change CI/CD workflows or branch protection. Suggest these in comments.
- The only CI action allowed is `gh run rerun --failed` once per flaky job on the fix
  branch's own run. Never dispatch workflows or re-run runs on other branches.
- Never print, log or commit secret values.
- Never edit Squad-owned files (`.squad/templates/`, `.github/agents/`, `.github/skills/`,
  etc.) to make a finding go away. Findings in Squad templates/docs are almost always
  documentation examples: classify and hand to a human.
- Build/test failures unrelated to the fix → note on the issue, keep out of the PR.
- Record recurring knowledge (build/run/test recipes, false-positive patterns, fixes that
  worked) in agent `history.md` and this skill's "Learned patterns" section.

## Repo-specific rules (trade-imports-plants-prototype)

<!-- Everything above this heading is repo-agnostic. To use this skill in another repo,
copy this folder (SKILL.md + pr-template.md) and replace only this section. -->

- Branch naming `fix/scan-<n>-<slug>` is approved for scan fixes and overrides the AGENTS.md
  branch list for this purpose only (user decision 2026-11-06).
- Fixes touching real-service files (anything not in `overrides.json` → `ours`, e.g.
  `package.json`, `package-lock.json`, `src/server/app/services/**`) are made here on the
  `fix/scan-*` branch; the PR body must flag that the change should also be raised upstream
  in plants-frontend, since the weekly sync may overwrite it.
- Install only with the pinned npm (`packageManager` in `package.json`, npm 11.19.0). Never
  bare `npm install` / `npm ci`. `--no-verify` is allowed on commit and push.
- Use `npm run designer:where -- <paths>` to confirm file ownership before editing.

### Repo profile (recorded 2026-11-10, workflows at current HEAD)

Toolchain: `. ~/.nvm/nvm.sh && nvm use` (`.nvmrc` → 24.22.1); npm as `npx -y npm@11.19.0 <cmd>`.
PR workflow: `.github/workflows/check-pull-request.yml` ("Check Pull Request").

| CI job                 | Local command(s)                                                                                                                                                                                                                                                                                               | Needs    | Local?                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| `pr-validator`         | `run build:frontend`, `run format:check`, `run lint:js`, `run lint:scss`, `run lint:arch`, `test`                                                                                                                                                                                                              | —        | yes                               |
| `pr-validator` (image) | `docker build --tag trade-imports-plants-prototype .`                                                                                                                                                                                                                                                          | Docker   | if Docker                         |
| `boot-check`           | `docker run` with `NODE_ENV=production STUB_MODE=true SESSION_COOKIE_SECURE=false PORT=<p>`; `/health` 200, `/` 200, `/high-risk-plants` → `/auth/sign-in`, stub sign-in reaches chooser, `/examples/high-risk-plants/submitted` 200; again with a throwaway `PROTOTYPE_PASSWORD` (every page → password page) | Docker   | if Docker                         |
| `security-audit`       | `run security-audit` (audit-ci, `high: true`)                                                                                                                                                                                                                                                                  | —        | yes                               |
| `playwright` (FIT)     | `run playwright:install`, then `run test:fit`                                                                                                                                                                                                                                                                  | Chromium | yes                               |
| `walkthroughs`         | `run designer:walkthrough -- --ci --fast` (reported, never gating)                                                                                                                                                                                                                                             | Chromium | yes                               |
| `release-canary`       | `run new:set -- plants-working --from high-risk-plants …`, `designer:format`, `designer:check -- --set plants-working --full`; throw away after                                                                                                                                                                | —        | yes, in a throwaway worktree only |

No Docker → app smoke without it: `PORT=3199 STUB_MODE=true SESSION_COOKIE_SECURE=false npm start`,
then the same curl checks as `boot-check`; mark the image jobs "CI only".

Security tools (2026-11-10, this machine): `semgrep` and `gitleaks` installed via Homebrew;
`osv-scanner` not installed (container image or ask the human). Repo audit: `run security-audit`.

PR body "Repo-specific notes": state whether the change must also be raised upstream in
plants-frontend (see the second rule above).

## Learned patterns

<!-- Append: build/run/test recipes, false-positive patterns, fixes that worked. -->

- **Toolchain (2026-11-06, #5):** system Node is 22; use `. ~/.nvm/nvm.sh && nvm use` (`.nvmrc` →
  24.22.1) and run npm as `npx -y npm@11.19.0 <cmd>` (nvm's bundled npm is 11.19.1, not the pin).
- **Clean fix branches:** create them as a worktree from `origin/main`
  (`git worktree add -b fix/scan-<n>-<slug> ../tipp-scan-<n> origin/main`) so uncommitted `.squad/`
  state on the main checkout can never leak in; `npx -y npm@11.19.0 ci` there.
- **Verify recipe:** see "Repo profile" above. Also `npm ls <pkg>` and `npm audit --json` for
  dependency fixes; `npm test`'s pretest builds the frontend.
- **Known baseline failures on `main` (check the CI baseline first; this list may be stale):** `lint:js` 2 errors in
  `.squad/templates/ralph-triage.js`; `scripts/sync-upstream/overrides.test.js` "no path deleted is still
  tracked" (`.mcp.json`). Commit fix branches with `--no-verify` (AGENTS.md rule 9) and list them in the PR.
- **Transitive dependency CVEs:** if parent semver ranges already allow the patched version, a
  lockfile-only `npm update <pkg>` is the minimal fix. `package-lock.json` is a `patched` entry in
  `overrides.json` — update its `why` so the weekly sync keeps the bump, and flag the upstream fix in the PR.
- **Regression tests for ReDoS/quadratic parsing:** build a tiny `Hapi.server()` with the affected
  route option, `server.inject` a crafted payload, assert status + an elapsed bound with ≥4× margin;
  prove it fails on the old version by temporarily swapping the package in `node_modules`.
