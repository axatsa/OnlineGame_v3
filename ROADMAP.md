# ClassPlay — Roadmap разработки

---

## ✅ ЗАВЕРШЕНО — Сессия 26.04.2026

### Роль org_admin — B2B управление организациями
- ✅ `require_org_admin()` dependency в `backend/apps/auth/dependencies.py`
- ✅ Новый роутер `backend/apps/org_admin/router.py` (6 эндпоинтов: /me, /teachers, /teachers/{id}/toggle-block, /teachers/{id}, /invite, /contact)
- ✅ Super admin: `POST /admin/teachers/{id}/promote` и `/demote`
- ✅ Super admin: `POST /admin/organizations/{org_id}/set-token-limit`
- ✅ Фильтр учителей в AdminPanel включает `org_admin`
- ✅ `OrgAdminDashboard.tsx` — полная панель управления организацией
- ✅ Модалка "Купить план" (PRO per-seat vs SCHOOL org-wide)
- ✅ Бейдж ORG ADMIN + кнопки promote/demote в AdminPanel
- ✅ Настройка `admin_telegram` в системных настройках AdminPanel
- ✅ Модалка токен-лимита организации (пресеты 30k/50k/100k/200k)
- ✅ `Login.tsx` — редирект org_admin на `/org-admin`
- ✅ `AuthContext.tsx` — `GET /auth/me` при инициализации (свежие данные роли)

### MathPuzzle — таймер и экран результатов
- ✅ Таймер обратного отсчёта 20 сек с анимацией
- ✅ Серия (streak) с множителем ×1/×2/×3
- ✅ Экран результатов: оценка, счёт, таблица по раундам
- ✅ Вызов `POST /gamification/activities/complete` по завершению

### AnalyticsPage — аналитика учителя
- ✅ Новая страница `/analytics` (BarChart, PieChart, топ тем)
- ✅ Живые данные токенов из `/payments/subscription/me`
- ✅ Streak из `activity_by_day`
- ✅ Кнопка "Аналитика" в навигации TeacherDashboard
- ✅ Маршруты `/profile`, `/history`, `/analytics` открыты для `org_admin`

---

## ✅ ЗАВЕРШЕНО — Сессия 26.04.2026 (более ранние задачи)

### Загрузка пользовательских материалов
- ✅ Модель `UserMaterial` + migration
- ✅ `POST /api/v1/materials/upload` — PDF/DOCX/TXT, лимит 5 МБ
- ✅ `GET /api/v1/materials/` + `DELETE /api/v1/materials/{id}`
- ✅ Лимиты: Free=5, Pro=30, School=100
- ✅ `material_id` в 5 генераторах (math, quiz, crossword, assignment, jeopardy)
- ✅ Компонент MaterialUpload, страница /materials, dropdown в Generator.tsx
- ✅ Баннер "Загрузите материал → качество выше" в Generator.tsx
- ✅ Счётчик материалов на карточке TeacherDashboard

### Новые игры (каталог: 6 → 10)
- ✅ Hangman (Виселица) — SVG, алфавит, ru/uz/en
- ✅ SpellingBee (Орфография) — Web Speech API TTS
- ✅ MathPuzzle (Математика) — 3 типа + таймер + streak + результаты
- ✅ WordTranslate (Перевод слов) — flip-карточки
- ✅ Описания всех 10 игр в mock-data.ts
- ✅ Сохранение результатов в историю (все новые игры)

### Производительность
- ✅ 6 DB индексов (generation_logs, token_usage, user_materials, audit_logs)
- ✅ Code splitting (все маршруты через React.lazy + Suspense)

---

## 🔴 ОСТАЛОСЬ — В работе

### Мелкие доделки
- [ ] Режим "множественного выбора" в WordTranslate (сейчас только flip-карточки)
- [ ] Pagination в `/generate/history` (сейчас hardcode limit=100)

### Admin Panel — Phase 4 (не начато)
- [ ] Finance View: цветные статусы Active/Expiring/Expired на орги
- [ ] Quick Analytics: 4 pie chart'а (планы, статусы, платежи, орги)
- [ ] Audit Logs: target filter, count по типу, quick view modal
- [ ] Export: с `expires_at`, seat usage %, планами подписки

---

## 🟡 НЕ НАЧАТО — Следующие этапы

### Аналитика студентов
- Dashboard прогресса студентов по каждой игре
- Отчёты (какие темы слабые)
- Сравнение результатов между студентами

### Мобильная оптимизация
- PWA (offline support, install prompt)
- Touch-оптимизация игр (Hangman, MathPuzzle)

### Мультиплеер
- Реал-тайм баттлы (WebSocket)
- Глобальные лидерборды

### Интеграции
- Google Classroom / Microsoft Teams SSO
- API для третьих платформ

---

## Приоритеты следующей сессии

1. **[ВЫСОКИЙ]** Admin Phase 4 — Quick Analytics (pie charts) — быстро, высокая ценность
2. **[ВЫСОКИЙ]** Admin Phase 4 — Finance View (цветные статусы на орги)
3. **[СРЕДНИЙ]** Pagination в /generate/history
4. **[НИЗКИЙ]** WordTranslate множественный выбор
