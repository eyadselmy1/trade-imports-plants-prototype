<!-- scan-remediation PR body. Fill every section, or write "n/a — <reason>". Never delete a section. Never paste a secret value or raw CI log. -->

Fixes #<issue-number>

> Draft opened by Squad. A human must review, mark it ready and merge.

## Finding

- **Scan:** Git Insights Hub, scan `<scan-id>` at commit `<sha>`
- **Type:** <CWE / CVE / GHSA>, severity <severity>
- **Location at HEAD of `<default>`:** `<file>:<line>` (or package and version)

## Why it was confirmed

<Evidence it is real, reachable and still present at HEAD.>

## Root cause

<One or two sentences.>

## What changed

- <file — change>

## Regression test

<Test name and file, and how it was shown to fail before the fix. Or why no framework allows one.>

## Validation

| Check | CI job | Baseline | After | Where run |
| ----- | ------ | -------- | ----- | --------- |
|       |        |          |       |           |

## Security re-scan

| Scan             | Tool | Baseline | After | New findings |
| ---------------- | ---- | -------- | ----- | ------------ |
| Original finding |      | present  |       | —            |
| SAST             |      |          |       |              |
| Secrets          |      |          |       |              |
| Dependencies     |      |          |       |              |

## CI

Iterations: <n> of 3

| Run | Job | Result | Classification | Evidence |
| --- | --- | ------ | -------------- | -------- |
|     |     |        |                |          |

## Acceptance criteria

- [ ] <criterion copied from the issue> — met / not met: <why>

## Residual risk

<What is still exposed, if anything.>

## Secret findings only

- Classification: <PLACEHOLDER / LIKELY REAL / ALREADY REMOVED>
- This PR does **NOT** revoke or rotate the credential.
- The value is **still in git history**; purging it is a human-only task.

## Repo-specific notes

<From the skill's "Repo-specific rules" section.>

## Review

- Fix by: <agent>. Reviewed by: <agent> (not the author).
