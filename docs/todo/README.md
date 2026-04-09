# ClassPlay — TODO: Задачи для разработки

> Обновлено: 9 апреля 2026  
> Объём: 4 спринта  
> Исключено из задач: система оплаты (Stripe/Payme) и email-регистрация — реализуются отдельно

---

## Краткое ТЗ (техническое задание)

ClassPlay — SaaS-платформа для учителей: AI-генераторы заданий, интерактивные игры на смарт-борде и детская библиотека.

**Цель блока задач:** привести продукт к состоянию, пригодному для B2C/B2B продаж.

**Стек:**
- Frontend: React + TypeScript, React Query, Vite
- Backend: Python FastAPI, SQLAlchemy, PostgreSQL
- Infra: Docker Compose, Nginx

---

## Структура задач

| Файл | Описание | Приоритет | Статус |
|------|----------|-----------|--------|
| [01-security-reliability.md](./01-security-reliability.md) | Безопасность и надёжность | 🔴 Высокий | 🟡 Почти готово (HTTPS не подтверждён в prod) |
| [02-ux-onboarding.md](./02-ux-onboarding.md) | UX / Онбординг / Дашборд | 🟡 Средний | ❌ Не начато |
| [03-dark-theme.md](./03-dark-theme.md) | Тёмная тема | 🟡 Средний | ✅ Готово |
| [04-generation-history.md](./04-generation-history.md) | История генераций и Избранное | 🟡 Средний | ✅ Готово |
| [05-content-editor.md](./05-content-editor.md) | Редактор результата + Шаблоны | 🟡 Средний | 🟠 В процессе (редактор есть, шаблонов нет) |
| [06-batch-generation.md](./06-batch-generation.md) | Batch-генерация | 🟠 Ниже среднего | ❌ Не начато |
| [07-import-export.md](./07-import-export.md) | Импорт слов + Google Drive | 🟠 Ниже среднего | ❌ Не начато |
| [08-b2b-tools.md](./08-b2b-tools.md) | B2B: Школьный дашборд + Invite + CSV | 🔴 Высокий | 🟠 Частично (UI есть, но User↔Org не связаны!) |
| [09-tech-debt.md](./09-tech-debt.md) | Технический долг (i18n, тесты, Sentry) | 🔴 Высокий | 🟡 Почти готово (нет автотестов) |
| [10-demo-mode.md](./10-demo-mode.md) | Demo без регистрации + Лендинг доработка | 🟡 Средний | 🟠 Частично (demo работает, нет отзывов и FAQ) |

---

## ⚠️ Критические баги (обнаружены 2026-04-09)

> **СРОЧНО:** В таблице `users` отсутствует поле `organization_id`. Статистика организаций показывает ВСЕХ учителей системы — утечка данных между клиентами!  
> **СРОЧНО:** Финансовые метрики (MRR, ARR, чурн, LTV) в AdminPanel — захардкожены, не из БД.

---

## Что НЕ входит в эти задачи

- ❌ Stripe / Payme / Click оплата
- ❌ Self-registration + email верификация
- ❌ Forgot password через email
- ❌ Welcome email

---

## Порядок выполнения (актуально на 2026-04-09)

```
Sprint 1 (СРОЧНО) → 08: User↔Org связь + InviteLink + 01: HTTPS в prod
Sprint 2           → 02: Онбординг + 10: Отзывы и FAQ на лендинге
Sprint 3           → 05: Шаблоны + 06: Batch генерация + реальные финансы
Sprint 4           → 07: Google Drive + SEO + Telegram-лиды
```
