# ClassPlay — TODO: Задачи для разработки

> Дата: 30 марта 2026  
> Объём: 4 спринта  
> Исключено из задач: система оплаты (Stripe/Payme) и email-регистрация — реализуются отдельно

---

## Краткое ТЗ (техническое задание)

ClassPlay — SaaS-платформа для учителей: AI-генераторы заданий, интерактивные игры на смарт-борде и детская библиотека.

**Цель блока задач:** привести продукт к состоянию, пригодному для B2C/B2B продаж, без касания системы оплаты и email-верификации.

**Стек:**
- Frontend: React + TypeScript, React Query, Vite
- Backend: Python FastAPI, SQLAlchemy, PostgreSQL
- Infra: Docker Compose, Nginx

---

## Структура задач

| Файл | Описание | Приоритет | Статус |
|------|----------|-----------|--------|
| [01-security-reliability.md](./01-security-reliability.md) | Безопасность и надёжность | 🔴 Высокий | ✅ Готово |
| [02-ux-onboarding.md](./02-ux-onboarding.md) | UX / Онбординг / Дашборд | 🟡 Средний | ⏳ В плане |
| [03-dark-theme.md](./03-dark-theme.md) | Тёмная тема | 🟡 Средний | 🟠 В процессе (CSS ок) |
| [04-generation-history.md](./04-generation-history.md) | История генераций и Избранное | 🟡 Средний | ⏳ В плане |
| [05-content-editor.md](./05-content-editor.md) | Редактор результата + Шаблоны | 🟡 Средний | ⏳ В плане |
| [06-batch-generation.md](./06-batch-generation.md) | Batch-генерация | 🟠 Ниже среднего | ⏳ В плане |
| [07-import-export.md](./07-import-export.md) | Импорт слов + Google Drive | 🟠 Ниже среднего | ⏳ В плане |
| [08-b2b-tools.md](./08-b2b-tools.md) | B2B: Школьный дашборд + Invite + CSV | 🟡 Средний | 🟠 Частично |
| [09-tech-debt.md](./09-tech-debt.md) | Технический долг (i18n, тесты, Sentry) | 🔴 Высокий | ✅ Готово |
| [10-demo-mode.md](./10-demo-mode.md) | Demo без регистрации + Лендинг доработка | 🟡 Средний | ⏳ В плане |

---

## Что НЕ входит в эти задачи

- ❌ Stripe / Payme / Click оплата
- ❌ Self-registration + email верификация
- ❌ Forgot password через email
- ❌ Welcome email

---

## Порядок выполнения

```
Sprint 1 → 01-security-reliability + 09-tech-debt (критический долг)
Sprint 2 → 02-ux-onboarding + 03-dark-theme + 04-generation-history
Sprint 3 → 05-content-editor + 06-batch-generation + 08-b2b-tools
Sprint 4 → 07-import-export + 10-demo-mode
```
