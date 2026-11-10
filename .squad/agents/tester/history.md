# Project Context

- **Owner:** Eyad Selmy
- **Project:** trade-imports-plants-prototype — a stubbed copy of the DEFRA plants-frontend used for design prototyping. Current mission: remediate Git Insights Hub security-scan issues (see .squad/skills/scan-remediation/SKILL.md).
- **Stack:** Node 24 (npm pinned 11.19.0 via packageManager), Hapi + @hapi/* plugins, Nunjucks + GOV.UK Frontend + MoJ Frontend, webpack/Sass client, Vitest unit tests, Playwright fit/ specs, convict config, Redis/catbox (stubbed: prototype runs with no backend)
- **Created:** 2026-11-06T15:28:37Z

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- 2026-11-06 (#5): Node 24 via nvm + `npx -y npm@11.19.0`; baseline failures on main: 2 lint:js errors in .squad/templates/ralph-triage.js and overrides.test.js `.mcp.json`. App starts with `PORT=3199 npm start`, /health 200.
