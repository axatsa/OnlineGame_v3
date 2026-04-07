# 🔧 Задача 09: Технический долг

**Приоритет:** 🔴 Высокий (Sprint 1–2, параллельно с другими)  
**Оценка:** ~5–7 дней (разбить на несколько PR)  
**Исполнитель:** Frontend + Backend

---

## Контекст

Накопленный технический долг замедляет разработку и ухудшает UX. Задачи этого раздела нужно делать постепенно, не блокируя остальные фичи.

---

## Подзадачи

### 9.1 Унификация i18n (мультиязычность)

**Файлы:** `front/src/i18n.ts`, `front/src/context/LangContext.tsx`, все компоненты

**Проблема:** Два параллельных решения — `LangContext` (свой) и `i18next`. Часть строк переведена через одно, часть через другое.

**Что делать:**
- Выбрать одно решение (рекомендуется оставить `i18next` — более зрелое)
- Перенести все ключи из `LangContext` в файлы переводов `i18n/ru.json` и `i18n/uz.json`
- Заменить все `useLang()` вызовы на `useTranslation()` из `react-i18next`
- Удалить `LangContext.tsx` и всё связанное
- Проверить все страницы на наличие жёстко вшитых строк

---

### 9.2 Error Boundary на всех генераторах

**Файл:** `front/src/components/ErrorBoundary.tsx`

**Проблема:** При ошибке API — белый экран. Пользователь не понимает что делать.

**Что делать:**
- Создать `ErrorBoundary` класс-компонент (React требует class для этого)
- Показывать дружелюбный UI: иконка ошибки + текст + кнопки «Попробовать снова» / «Сообщить об ошибке»
- Обернуть все генераторы:
  ```tsx
  <ErrorBoundary fallback={<GeneratorError onRetry={reset} />}>
    <QuizGenerator />
  </ErrorBoundary>
  ```
- Добавить также try/catch в async-функции с toast-уведомлениями вместо console.error

---

### 9.3 Фикс: activeClass при перезагрузке страницы

**Файл:** `front/src/context/ClassContext.tsx` (или аналог)

**Проблема:** При обновлении страницы `activeClass` кратковременно null → генераторы падают с ошибкой.

**Что делать:**
- Сохранять `activeClassId` в `localStorage`
- При инициализации: сначала читать из localStorage, потом загружать список классов и восстанавливать
- Показывать состояние загрузки (`isLoadingClass: true`) пока данные не пришли
- В генераторах: если `isLoadingClass` — показывать skeleton/spinner, не пытаться делать запрос

---

### 9.4 Покрытие тестами (минимум)

**Файлы:** `front/src/__tests__/`, `backend/tests/`

**Что написать (приоритет):**

**Backend:**
- `test_quota_check.py` — проверка что при лимите 0 возвращается 402
- `test_rate_limit.py` — 31 запрос → 429
- `test_generation_log.py` — после генерации запись сохраняется в БД

**Frontend:**
- `ClassContext.test.tsx` — activeClass восстанавливается из localStorage
- `ErrorBoundary.test.tsx` — показывает fallback при ошибке рендера
- `QuizGenerator.test.tsx` — форма валидирует пустые поля

**Инструменты:**
- Backend: `pytest` + `httpx`
- Frontend: `vitest` + `@testing-library/react`

---

### 9.5 Логирование ошибок (Sentry)

**Файлы:** `backend/app/main.py`, `front/src/main.tsx`

**Что делать:**

**Backend:**
```python
import sentry_sdk
sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)
```

**Frontend:**
```typescript
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

- Добавить `SENTRY_DSN` в `.env.example`
- В prod — обязательно, в dev — опционально

---

### 9.6 API версионирование

**Файл:** `backend/app/main.py`, все роутеры

**Что делать:**
- Добавить префикс `/api/v1/` ко всем роутерам
- Оставить старые пути как deprecated alias (redirect) для обратной совместимости
- Обновить все fetch-вызовы на фронте

```python
app.include_router(quiz_router, prefix="/api/v1/generate")
# Deprecated alias:
app.include_router(quiz_router, prefix="/api/generate", deprecated=True)
```

---

## Definition of Done

- [x] Только один способ переводов (`i18next`), `LangContext` удалён
- [x] `ErrorBoundary` на всех генераторах, нет белых экранов
- [x] При перезагрузке страницы `activeClass` восстанавливается < 500мс
- [ ] Минимум 6 тестов из списка выше — зелёные
- [x] Sentry настроен и получает ошибки в prod
- [x] Все API-пути используют `/api/v1/`
