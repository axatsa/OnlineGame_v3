# ClassPlay — Roadmap разработки

**Актуально на:** 2026-05-04

---

## ✅ ЗАВЕРШЕНО — Сессия 03–04 мая 2026

### KaTeX — рендеринг математики
- ✅ Установлен KaTeX + @types/katex в frontend
- ✅ `RichTextRenderer.tsx` — полная перезапись: поддержка `\(...\)`, `\[...\]`, `$$...$$`, `$...$`, legacy `[FRAC:n:d]`, `x^2 → x²`
- ✅ KaTeX CSS подключён глобально в `main.tsx`
- ✅ Все 6 компонентов с прямым AI-текстом обёрнуты: `Crossword`, `CrosswordPreview`, `MathPuzzle`, `SpellingBee`, `WordTranslate`, `Hangman`
- ✅ Компоненты через RichTextRenderer (Jeopardy, TugOfWar, QuizPreview, AssignmentPreview, MathPreview) получили KaTeX автоматически

### Gemini — авто-обнаружение всех моделей
- ✅ `_discover_text_models()` — запрашивает список всех `generateContent` моделей через API, кешируется 3 часа
- ✅ Приоритет: Gemma-3-27b-it → Gemma-3-12b-it → Gemini 2.5 Flash → Gemini 2.0 Flash → ...
- ✅ На 429: перебирает все модели текущего ключа перед сменой ключа
- ✅ `MATH_FORMAT_INSTRUCTION` добавлена в системный промпт всех генераций
- ✅ `use_math_format=True` во всех вызовах `generate_content()`

---

## ✅ ЗАВЕРШЕНО — Сессия 02–03 мая 2026

### Telegram Bot — OTP авторизация
- ✅ Новые endpoints: `POST /auth/bot/request-otp`, `POST /auth/bot/verify-otp`, `POST /auth/bot/register`
- ✅ Flow: `/start` → запрос email → OTP на почту (или авторегистрация если email не найден)
- ✅ OTP: 6 цифр, 10 мин, макс 3 попытки, хранится в `PasswordResetToken`
- ✅ Новые шаги сессии: `waiting_email | waiting_otp | waiting_name`
- ✅ `/login` команда удалена
- ✅ `email_service.py` — функция `send_otp_email()`

### Gemini Vision — автоверификация чеков
- ✅ `vision_service.py` — `verify_receipt()`: проверяет сумму + номер карты + статус платежа
- ✅ Порог уверенности 85%: выше → авто-одобрение, ниже → ручная проверка админом
- ✅ Интеграция в `/payments/telegram/verify`: при авто-одобрении активирует подписку + уведомляет пользователя
- ✅ `notify_admin_group_auto_approved()` в telegram_service

### Цены в сумах
- ✅ Фронтенд: Free = 0, Pro = 190 000 сум, School = 620 000 сум (ru/uz/en)
- ✅ `Checkout.tsx` — обновлены захардкоженные строки цен
- ✅ `i18n.ts` — обновлены ключи цен во всех 3 языках

### Исправления
- ✅ `BigInteger` для `telegram_user_id` (ранее Integer → переполнение при ID > 2³¹)
- ✅ `land_faq_title` — добавлен ключ локализации во всех 3 языках

---

## ✅ ЗАВЕРШЕНО — Сессия 02 мая 2026

### Рефакторинг и чистка кода
- ✅ Удалён `StudentDashboard.tsx` (мёртвый компонент)
- ✅ Удалён `TokenUsageBar.tsx` (мёртвый компонент)
- ✅ Исправлена типобезопасность в `AdminPanel.tsx` — добавлены 13+ TypeScript интерфейсов
- ✅ Рефакторинг `Generator.tsx` (1786 строк → domain-based компоненты)
- ✅ Рефакторинг `Landing.tsx` (713 строк → 11 секционных компонентов)
- ✅ Исправлены дублирующиеся ключи i18n

---

## ✅ ЗАВЕРШЕНО — Сессия 27 апреля 2026

### UX / Навигация
- ✅ Login — раздельные ошибки `user_not_found` / `wrong_password` / `account_blocked` с подсветкой поля
- ✅ Generator — кнопка "Назад" ведёт на `/teacher`
- ✅ TeacherNavbar — новый порядок: Generators → Tools → Games → Library → History → Materials
- ✅ Analytics перенесена в `/profile?tab=analytics`
- ✅ TeacherDashboard — убраны дублирующие графики

### Игры
- ✅ Hangman — прогрессивные подсказки (до 4 штук)
- ✅ SpellingBee — 5 голосовых пресетов, localStorage
- ✅ Jeopardy — все варианты правильного ответа чипами

### Библиотека
- ✅ BookReaderFlip — прогресс-бар + кнопка % + автовосстановление позиции

---

## ✅ ЗАВЕРШЕНО — Сессия 26 апреля 2026

### Роль org_admin — B2B управление организациями
- ✅ `/org-admin` роутер (7 эндпоинтов)
- ✅ Super admin: promote/demote, set-token-limit для орги
- ✅ `OrgAdminDashboard.tsx` — панель управления организацией
- ✅ Модалка "Купить план" (PRO per-seat vs SCHOOL org-wide)

### MathPuzzle
- ✅ Таймер обратного отсчёта + серия (streak ×1/×2/×3) + экран результатов

### AnalyticsPage
- ✅ 4 стат-карточки, BarChart 14 дней, PieChart по типам, топ тем

---

## ✅ ЗАВЕРШЕНО — Сессия 26 апреля 2026 (ранние задачи)

- ✅ Загрузка материалов PDF/DOCX/TXT + лимиты по тарифу
- ✅ Новые игры: Hangman, SpellingBee, MathPuzzle, WordTranslate (каталог: 6 → 10)
- ✅ 6 DB индексов для производительности
- ✅ Code splitting (React.lazy + Suspense)

---

## ✅ ЗАВЕРШЕНО — Сессия 22 апреля 2026

- ✅ Бесплатный тариф без оплаты
- ✅ Страницы восстановления пароля + SMTP
- ✅ Rate limiting на логин и сброс пароля
- ✅ QR-код для публичного просмотра материалов

---

## 🔴 ОСТАЛОСЬ — Текущий бэклог

### Быстрые доделки (< 2 часа каждая)
- [ ] Pagination в `/generate/history` (frontend захардкожен на 100, бэкенд уже поддерживает offset)
- [ ] WordTranslate — режим множественного выбора (сейчас только flip-карточки)

### Admin Panel Phase 4 (не начато)
- [ ] Finance View: цветные статусы Active/Expiring/Expired на органзиации
- [ ] Quick Analytics: 4 pie chart'а (планы, статусы, платежи, орги)
- [ ] Audit Logs: target filter, count по типу, quick view modal
- [ ] Export с `expires_at`, seat usage %, планами подписки

### Рефакторинг (технический долг)
- [ ] `AdminPanel.tsx` (2369 строк → domain-based компоненты)
- [ ] API response interfaces — создать `types/responses.ts`

---

## 🟡 НЕ НАЧАТО — Следующие этапы

### Студенческий режим
- Real-time игровые сессии (учитель запускает → студенты подключаются по коду)
- Dashboard прогресса студентов
- Сравнение результатов между студентами

### Мобильная оптимизация
- PWA (manifest.json, service worker, offline support)
- Touch-оптимизация игр (Hangman, MathPuzzle)

### Уведомления
- Email/Telegram напоминание за 3 дня до истечения подписки
- Telegram уведомление при одобрении платежа (уже для новых платежей, нужно для существующих)

### Интеграции
- Google Classroom / Microsoft Teams SSO
- Экспорт в Moodle / Google Classroom

### Мультиплеер
- Real-time баттлы (WebSocket)
- Глобальные лидерборды

---

## Приоритеты следующей сессии

1. **[ВЫСОКИЙ]** Admin Phase 4 — Quick Analytics (pie charts)
2. **[ВЫСОКИЙ]** Admin Phase 4 — Finance View
3. **[СРЕДНИЙ]** Pagination в /generate/history
4. **[СРЕДНИЙ]** Подписка: email-уведомление за 3 дня до истечения
5. **[НИЗКИЙ]** WordTranslate множественный выбор
