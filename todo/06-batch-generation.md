# ⚡ Задача 06: Batch-генерация

**Приоритет:** 🟠 Ниже среднего (Sprint 3)  
**Оценка:** ~2–3 дня  
**Исполнитель:** Frontend + Backend

---

## Контекст

Учителям часто нужно несколько вариантов одного задания (для разных рядов, для разных уровней). Сейчас нужно кликать 5 раз вручную.

---

## Подзадачи

### 6.1 Backend: Batch-эндпоинт

**Файл:** `backend/app/routers/generate_batch.py`

**Что делать:**
- Новый POST `/api/generate/batch`
- Принимает: `feature`, `params` (те же что обычно), `count` (2–5)
- Запускает `asyncio.gather()` для параллельной генерации всех вариантов
- Квота токенов: считать всё суммой

```python
@router.post("/batch")
async def batch_generate(request: BatchRequest, user: User = Depends(...)):
    tasks = [generate_single(request.params) for _ in range(request.count)]
    results = await asyncio.gather(*tasks)
    return {"variants": results}
```

**Ограничение:** максимум 5 в одном запросе, минимум 2.

---

### 6.2 Frontend: UI для batch

**Файлы:** каждый генератор (Quiz, Math, Assignment)

**Что делать:**
- Под основными настройками — чекбокс «Создать несколько вариантов»
- При включении появляется ползунок/радио: 2 / 3 / 4 / 5 вариантов
- Кнопка «Генерировать 3 варианта» (с учётом счётчика)
- Результат — табы: «Вариант 1», «Вариант 2», «Вариант 3»
- Кнопка «Скачать все» → архив ZIP с N DOCX-файлами

---

### 6.3 ZIP-архив скачивания

**Файл:** `backend/app/utils/docx_batch.py`

**Что делать:**
- Использовать библиотеку `zipfile` (стандартная)
- Собрать все DOCX в BytesIO объекты, сложить в ZIP
- Вернуть как `StreamingResponse` с `media_type="application/zip"`

```python
import zipfile, io

def create_zip(docx_files: list[tuple[str, bytes]]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as zf:
        for filename, content in docx_files:
            zf.writestr(filename, content)
    return buffer.getvalue()
```

---

## Definition of Done

- [ ] Чекбокс «несколько вариантов» есть в Quiz, Math, Assignment
- [ ] Backend возвращает N вариантов параллельно
- [ ] Результат разделён по табам
- [ ] ZIP-скачивание работает
- [ ] Batch учитывается в квоте токенов
