# ClassPlay — Development Tasks

**Platform:** SaaS for teachers — AI content generators, interactive smartboard games, children's library.  
**Goal:** Bring the product to a state ready for B2C and B2B sales.  
**Stack:** React + TypeScript, FastAPI, PostgreSQL, Docker

---

## Task Status

| # | File | Area | Priority | Status |
|---|------|------|----------|--------|
| 01 | [01-security-reliability.md](./01-security-reliability.md) | Security, rate limits, backups | Critical | Mostly done — HTTPS not confirmed in prod |
| 02 | [02-ux-onboarding.md](./02-ux-onboarding.md) | Onboarding, dashboard | Medium | Done |
| 03 | [03-dark-theme.md](./03-dark-theme.md) | Dark mode | Medium | Done |
| 04 | [04-generation-history.md](./04-generation-history.md) | Generation history, favorites | Medium | Done |
| 05 | [05-content-editor.md](./05-content-editor.md) | Result editor, templates | Medium | Done |
| 06 | [06-batch-generation.md](./06-batch-generation.md) | Batch generation (ZIP) | Low | Done |
| 07 | [07-import-export.md](./07-import-export.md) | Custom word import, Google Drive | Low | Not started |
| 08 | [08-b2b-tools.md](./08-b2b-tools.md) | Org–User link, invite system, CSV | Critical | Done |
| 09 | [09-tech-debt.md](./09-tech-debt.md) | i18n, Sentry, API versioning, tests | High | Mostly done — no automated tests |
| 10 | [10-demo-mode.md](./10-demo-mode.md) | Demo mode, landing FAQ/reviews | Medium | Done |

---

## Critical Bugs (as of 2026-04-09)

~~**Critical bugs resolved as of 2026-04-12.**~~ All Sprint 1 tasks are complete.

---

## Out of Scope (not in these tasks)

- Stripe / Payme / Click payment integration
- Self-registration with email verification
- Forgot password via email
- Welcome email

---

## Sprint Order

```
Sprint 1 (urgent)  →  08: User↔Org fix + invite system  |  01: HTTPS in prod
Sprint 2           →  02: Onboarding  |  10: Reviews + FAQ on landing
Sprint 3           →  05: Templates   |  06: Batch  |  real financial metrics
Sprint 4           →  07: Google Drive  |  SEO  |  Telegram leads
```
