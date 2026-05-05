# Changelog — ClassPlay

---

## Сессия 03–04 мая 2026

### KaTeX — рендеринг математики на фронтенде

**Установлен KaTeX.** `npm install katex @types/katex`. CSS подключён глобально в `main.tsx`.

**`RichTextRenderer.tsx` полностью переписан.** Теперь парсит:
- `\(...\)` — inline LaTeX (дроби, корни, степени)
- `\[...\]` — block LaTeX (выровнено по центру)
- `$$...$$` и `$...$` — альтернативные нотации
- `[FRAC:n:d]` — обратная совместимость со старым форматом
- `x^2` → `x²` — plain-text экспоненты (без KaTeX)

**6 компонентов игр обёрнуты в `<RichTextRenderer>`:**
- `Crossword.tsx`, `CrosswordPreview.tsx` — подсказки кроссворда
- `MathPuzzle.tsx` — задание, ответ, правило последовательности
- `SpellingBee.tsx` — определение, пример предложения
- `WordTranslate.tsx` — слово, перевод, пример (карточки и режим выбора)
- `Hangman.tsx` — основная подсказка, прогрессивные подсказки

Компоненты через RichTextRenderer (Jeopardy, TugOfWar, QuizPreview, AssignmentPreview, MathPreview) получили KaTeX автоматически без изменений.

---

### Gemini — авто-обнаружение всех моделей + MATH_FORMAT_INSTRUCTION

**Авто-обнаружение моделей.** `_discover_text_models(api_key)` делает `GET /v1beta/models`, фильтрует `generateContent`-совместимые, кеширует на 3 часа. Сортировка по приоритету: Gemma-3-27b-it первый (неограниченные выходные токены), далее Gemini 2.5 Flash, 2.0 Flash, 1.5 Flash, 1.5 Pro и т.д.

**Ротация на 429.** При исчерпании квоты: перебирает все модели текущего ключа → переходит к следующему ключу → начинает с приоритетной модели.

**`MATH_FORMAT_INSTRUCTION`.** Системная инструкция с правилами форматирования математики добавлена в системный промпт всех генераций: дроби через `\(\frac{n}{d}\)`, степени через Unicode `²³`, корни через `\(\sqrt{x}\)`.

**`use_math_format=True`** включён во всех вызовах `generate_content()` в `openai_service.py`.

---

## Сессия 02–03 мая 2026

### Telegram Bot — OTP авторизация (замена /login)

**Новые backend-эндпоинты** в `backend/apps/auth/router.py`:

`POST /api/v1/auth/bot/request-otp` — находит пользователя по email, генерирует 6-значный код, сохраняет в `PasswordResetToken` (срок 10 мин), отправляет письмо. Возвращает `{exists: bool, name: str}`.

`POST /api/v1/auth/bot/verify-otp` — проверяет код, помечает токен использованным, возвращает JWT. Попытки отслеживаются в сессии бота (макс 3).

`POST /api/v1/auth/bot/register` — создаёт пользователя (роль `teacher`, случайный 32-символьный пароль, лимит 30000 токенов, тариф free), возвращает JWT.

**`email_service.py`** — добавлена функция `send_otp_email(email, code)` с тем же SMTP-паттерном что и `send_reset_email()`.

**Сессия бота** (`sessions.py`) — добавлены поля: `step` (новые значения: `waiting_email | waiting_otp | waiting_name`), `email`, `otp_attempts`.

**`api.py`** — добавлены `request_otp(email)`, `verify_otp(email, code)`, `register_bot_user(email, full_name)`.

**`auth.py`** (bot handler) — полная перезапись: `handle_email_input()`, `handle_otp_input()` (с лимитом 3 попыток), `handle_name_input()`.

**`start.py`** — если пользователь не авторизован → `session.step = "waiting_email"` + просьба ввести email (без кнопок).

**`bot.py`** — добавлен универсальный `MessageHandler(filters.TEXT)` → `handle_text_message()`, который роутит по `session.step`. Команда `/login` удалена.

---

### Gemini Vision — автоверификация чеков

**`vision_service.py`** (новый файл). `verify_receipt(image_path, expected_amount_uzs, card_number)` использует `GEMINI_VISION_KEY`, отправляет скриншот + структурированный промпт. Проверяет: сумма совпадает ли с ожидаемой, номер карты присутствует, статус "успешно". Возвращает `{auto_approve: bool, confidence: float, reason: str}`.

**Интеграция в `/payments/telegram/verify`.** При `auto_approve=True` (confidence ≥ 0.85): статус платежа → `completed`, подписка активируется, пользователь получает Telegram-уведомление. При низкой уверенности — платёж остаётся в очереди для ручной проверки.

**`telegram_service.py`** — добавлена `notify_admin_group_auto_approved()` с информацией об авто-одобрении.

**`.env`** — добавлен `GEMINI_VISION_KEY` (отдельный ключ для Vision, не участвует в общей ротации).

---

### Цены в узбекских сумах

**`i18n.ts`** — обновлены ключи цен во всех 3 языках:
- RU: `0 сум / 190 000 сум / 620 000 сум`
- UZ: `0 so'm / 190 000 so'm / 620 000 so'm`
- EN: `0 sum / 190,000 sum / 620,000 sum`

Добавлен ключ `land_faq_title` во все 3 языка (ранее отображался как raw key).

**`Checkout.tsx`** — обновлены захардкоженные строки цен на форматы в сумах.

---

### Исправления

**`BigInteger` для `telegram_user_id`.** Поле в `backend/apps/payments/models.py` изменено с `Column(Integer)` на `Column(BigInteger)`. Telegram User ID может превышать 2³¹ (32-bit) — при попытке сохранить ID `8224701510` PostgreSQL возвращал `NumericValueOutOfRange`. На сервере выполнена миграция: `ALTER TABLE user_payments ALTER COLUMN telegram_user_id TYPE BIGINT;`.

---

## Сессия 02 мая 2026

### Рефакторинг и чистка кода

**Удалены мёртвые компоненты.** `StudentDashboard.tsx` и `TokenUsageBar.tsx` — нигде не импортировались.

**Типобезопасность `AdminPanel.tsx`.** Добавлены 13+ TypeScript интерфейсов (AuditLog, OrgUser, ChartDatum, ApiTeacher, ApiOrg, ApiPayment и др.). Все `as any` касты заменены типизированными интерфейсами.

**Рефакторинг `Generator.tsx`** (1786 строк → domain-based). Извлечены: `MathForm`, `CrosswordForm`, `QuizForm`, `AssignmentForm`, `MathPreview`, `CrosswordPreview`, `QuizPreview`, `AssignmentPreview`, `SegmentedControl`, generator utils.

**Рефакторинг `Landing.tsx`** (713 строк → 29 строк). 11 секционных компонентов: `LandingNavbar`, `HeroSection`, `StatsSection`, `FeaturesSection`, `LeaderboardSection`, `HowItWorksSection`, `GamesSection`, `PricingSection`, `FaqSection`, `CtaSection`, `LandingFooter`.

**Исправлены дублирующиеся ключи i18n** в 3 языках. Исправлен неверный импорт в `UserManagement.tsx`.

---

## Сессия 27 апреля 2026

### UX / Навигация

**Ошибки логина по типу.** Бэкенд возвращает разные коды ошибок: `user_not_found`, `wrong_password`, `account_blocked`. Фронтенд показывает красную рамку и сообщение под конкретным полем. Ошибка сбрасывается при вводе.

**Кнопка "Назад" в генераторе.** Ранее вела на `/` (лендинг), теперь на `/teacher` (дашборд).

**Переупорядочена навигация.** Новый порядок: Generators → Tools → Games → Library → History → Materials. Аналитика убрана из меню.

**Аналитика перенесена в Профиль.** Компонент `AnalyticsPanel` с compact-режимом (7 дней, 2-колоночный layout). Deep-link `?tab=analytics`.

**Дашборд упрощён.** Убраны дублирующие графики. Остался welcome-баннер + bento-grid.

### Игры

**Hangman — прогрессивные подсказки.** Кнопка "Подсказка (1/4)" раскрывает до 4 разных подсказок за игру. Генерируются бэкендом.

**SpellingBee — выбор голоса.** 5 пресетов: Default / Female / Male / Robot / Child. Сохраняется в localStorage.

**Jeopardy — все правильные ответы.** В модалке показываются все варианты через `splitAnswers()`. Бэкенд добавил `answers: string[]` в ответ.

### Библиотека

**Прогресс чтения.** Прогресс-бар + кнопка % + автовосстановление из localStorage (`book-{id}-page`).

---

## Сессия 26 апреля 2026

### Роль org_admin

Новая роль `org_admin` — представитель школы. Backend: 7 эндпоинтов `/org-admin`. Super admin: promote/demote, set-token-limit для орги. Frontend: `OrgAdminDashboard.tsx`, модалка "Купить план".

### MathPuzzle

Таймер 20 сек + серия ×1/×2/×3 + экран результатов с оценкой и таблицей раундов.

### AnalyticsPage

4 стат-карточки + BarChart 14 дней + PieChart типов игр + топ-8 тем. Живые данные токенов из API.

### Загрузка материалов, новые игры, производительность

Материалы PDF/DOCX/TXT с лимитами по тарифу. 4 новые игры (Hangman, SpellingBee, MathPuzzle, WordTranslate). 6 DB индексов. Code splitting.

---

## Сессия 22 апреля 2026

Бесплатный тариф без оплаты. Сброс пароля (SMTP). Rate limiting. QR-код для публичного просмотра. Мобильный вид генератора.
