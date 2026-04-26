# ClassPlay — Development Tasks

**Platform:** SaaS для учителей — AI-генераторы контента, интерактивные игры, детская библиотека.  
**Goal:** Продукт готов к B2C и B2B продажам.  
**Stack:** React + TypeScript, FastAPI, SQLite → PostgreSQL, Docker

**Обновлено:** 26.04.2026

---

## Task Status

| # | Файл | Область | Приоритет | Статус |
|---|------|---------|-----------|--------|
| 01 | [01-security-reliability.md](./01-security-reliability.md) | Безопасность, rate limits, backups | Critical | ✅ Готово — HTTPS не подтверждён в prod |
| 02 | [02-ux-onboarding.md](./02-ux-onboarding.md) | Онбординг, дашборд | Medium | ✅ Готово |
| 03 | [03-dark-theme.md](./03-dark-theme.md) | Тёмная тема | Medium | ✅ Готово |
| 04 | [04-generation-history.md](./04-generation-history.md) | История генераций, избранное | Medium | ✅ Готово |
| 05 | [05-content-editor.md](./05-content-editor.md) | Редактор результатов, шаблоны | Medium | ✅ Готово |
| 06 | [06-batch-generation.md](./06-batch-generation.md) | Пакетная генерация (ZIP) | Low | ✅ Готово |
| 07 | [07-import-export.md](./07-import-export.md) | Импорт слов, Google Drive | Low | 7.1 ✅ — 7.2 Google Drive не начато |
| 08 | [08-b2b-tools.md](./08-b2b-tools.md) | Org–User связь, инвайты, CSV | Critical | ✅ Готово + org_admin роль |
| 09 | [09-tech-debt.md](./09-tech-debt.md) | i18n, Sentry, API версионирование, тесты | High | ✅ Готово |
| 10 | [10-demo-mode.md](./10-demo-mode.md) | Демо-режим, FAQ/отзывы на лендинге | Medium | ✅ Готово |

---

## Активные задачи (не вошедшие в спринты выше)

| Задача | Статус |
|--------|--------|
| MathPuzzle: таймер + streak + результаты | ✅ Готово (26.04.2026) |
| AnalyticsPage для учителей | ✅ Готово (26.04.2026) |
| Роль org_admin + OrgAdminDashboard | ✅ Готово (26.04.2026) |
| Загрузка материалов (PDF/DOCX/TXT) | ✅ Готово |
| 4 новые игры (Hangman/Spelling/Math/WordTranslate) | ✅ Готово |
| Pagination в /generate/history | 🔴 В очереди |
| WordTranslate: режим множественного выбора | 🔴 В очереди |
| Admin Phase 4: Quick Analytics + Finance View | 🔴 В очереди |

---

## Критические баги

~~Все критические баги Sprint 1 исправлены (2026-04-12).~~  
~~Исправлен data leak в get_org_stats (2026-04-26).~~

**Активных критических багов нет.**
