# 📥 Задача 07: Импорт слов и Google Drive экспорт

**Приоритет:** 🟠 Ниже среднего (Sprint 4)  
**Оценка:** ~3–4 дня  
**Исполнитель:** Frontend + Backend

---

## Контекст

Для кроссворда и филворда учителя часто хотят использовать свои слова (из учебника), а не AI-генерацию. Также полезна кнопка «Сохранить в Google Drive» рядом с Download DOCX.

---

## Подзадачи

### 7.1 Импорт своих слов для кроссворда / филворда

**Файлы:** `front/src/pages/generators/CrosswordGenerator.tsx`, `front/src/pages/generators/PhilwordGenerator.tsx`

**Что делать:**

**Вариант A — Ввод вручную:**
- Добавить textarea: «Введите слова через запятую или с новой строки»
- Переключатель: «AI-генерация» / «Свои слова»

**Вариант B — Загрузка CSV:**
- Кнопка «Загрузить CSV»
- Формат файла: одно слово (и опционально определение) на строку
  ```
  кошка,домашнее животное
  собака,лучший друг человека
  ```
- Парсинг на фронте через `FileReader` + `Papa Parse`
- Передача в API вместо темы

**Backend:**
- Если в запросе есть `custom_words: list[str]` — пропустить AI, сразу строить сетку
- В кроссворде: `custom_clues: dict[str, str]` (слово → определение)

---

### 7.2 Google Drive экспорт

**Файлы:** `front/src/utils/googleDrive.ts`, кнопка в каждом генераторе

**Что делать:**
- Использовать Google Drive API v3 через Google Identity Services (OAuth2)
- При нажатии «Сохранить в Drive»:
  1. Если пользователь не авторизован в Google → показать popup OAuth
  2. Получить DOCX-файл (тот же blob что скачивается)
  3. Загрузить через `multipart/form-data` в Drive API

```typescript
async function uploadToDrive(filename: string, blob: Blob) {
  const token = await getGoogleToken(); // OAuth2
  const metadata = { name: filename, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);
  
  await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}
```

**Требования:**
- В Google Cloud Console: создать OAuth Client ID (Web application)
- Scope: `https://www.googleapis.com/auth/drive.file`
- Добавить `VITE_GOOGLE_CLIENT_ID` в `.env`

**Fallback:** если клиент-id не настроен — кнопка не отображается.

---

## Definition of Done

- [ ] Кроссворд и Филворд принимают свои слова (textarea)
- [ ] CSV загрузка работает и парсится корректно
- [ ] Кнопка «Сохранить в Drive» есть рядом с «Скачать DOCX»
- [ ] OAuth flow работает в браузере
- [ ] Файл появляется в Google Drive после нажатия
