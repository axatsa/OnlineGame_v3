# 🏢 Задача 08: B2B инструменты — Школьный дашборд, Invite и CSV

**Приоритет:** 🔴 Высокий (Sprint 1 — СРОЧНО)  
**Оценка:** ~6–8 дней  
**Исполнитель:** Frontend + Backend  
**Статус:** 🟠 Частично — UI готов, но данные некорректны (критический баг в БД)

---

## Контекст

Для продажи лицензий школам нужны инструменты управления: директор должен видеть активность своих учителей, IT-отдел должен иметь возможность массово добавить пользователей, суперадмин — генерировать invite-ссылки.

> ⚠️ **КРИТИЧЕСКИЙ БАГ:** В таблице `users` отсутствует поле `organization_id`. Текущий `get_org_stats` показывает ВСЕХ учителей системы, а не только из конкретной школы. CSV-импорт не привязывает учителей к организации. Это утечка данных между клиентами — нужно исправить до первой демонстрации!

---

## Подзадачи

### 8.1 ИСПРАВИТЬ: Связать User ↔ Organization (КРИТИЧНО!)

**Файлы:** `backend/apps/auth/models.py`, `backend/apps/admin/models.py`, `backend/apps/admin/router.py`, `backend/fix_db.py`

**Что делать:**
- Добавить в `User` модель:
  ```python
  organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
  organization = relationship("Organization", back_populates="teachers")
  ```
- Добавить в `Organization` модель:
  ```python
  teachers = relationship("User", back_populates="organization")
  ```
- Обновить `fix_db.py` → добавить `ALTER TABLE users ADD COLUMN organization_id INTEGER`
- Исправить `get_org_stats` — фильтровать `User` по `organization_id == org_id`
- Обновить `import_csv` — при создании пользователя задавать `user.organization_id = org_id`
- При изменении `used_seats` — инкрементировать счётчик в `Organization`

---

### 8.2 Школьный дашборд (для суперадмина) — UI готов, данные неверны

**Файлы:** `front/src/pages/dashboard/OrgStatsModal.tsx`, `backend/apps/admin/router.py`

**Статус:** UI (OrgStatsModal.tsx) готов. После исправления 8.1 данные будут корректными.

Ответ после фикса:
```json
{
  "org_name": "Школа №15",
  "total_teachers": 12,
  "active_last_7_days": 8,
  "total_generations": 340,
  "teachers": [
    { "name": "Иванова А.А.", "generations_30d": 45, "last_active": "2026-03-29" },
    ...
  ]
}
```

---

### 8.3 Invite-ссылка для школы

**Файлы:** `backend/apps/admin/models.py`, `backend/apps/admin/router.py`, `backend/apps/auth/router.py`, `front/src/pages/dashboard/AdminPanel.tsx`

**Модель:**
```python
class InviteToken(Base):
    __tablename__ = "invite_tokens"
    token = Column(String, unique=True, index=True)  # UUID
    org_id = Column(Integer, ForeignKey("organizations.id"))
    expires_at = Column(DateTime)  # +7 дней от создания
    max_uses = Column(Integer, default=30)
    uses_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Backend API:**
```
POST /api/v1/admin/organizations/{org_id}/invites      → создать токен
GET  /api/v1/admin/organizations/{org_id}/invites      → список
DELETE /api/v1/admin/invites/{token_id}               → отозвать
POST /api/v1/auth/register-with-invite                → регистрация по ссылке
```

**Ссылка:** `https://classplay.app/join/{token}`  
При регистрации по ссылке → пользователь автоматически привязывается к org + декрементируется счётчик.

**Frontend:**
- В OrgsView добавить: кнопка «Создать инвайт» + список активных ссылок
- Кнопка «Копировать ссылку» (clipboard)

---

### 8.4 Bulk import учителей (CSV) — UI готов, нужно добавить Preview

**Файл:** `front/src/pages/dashboard/BulkImportModal.tsx`

**Статус:** Drag & drop и upload реализованы. Нужен Preview-шаг.

**Что улучшить:**
- Читать CSV на клиенте (`FileReader` + `Papa Parse`) до отправки на сервер
- Показывать предпросмотр: таблица имён/email с валидационными ошибками
- Кнопка «Подтвердить и загрузить» — только после просмотра

---

## Definition of Done

- [ ] `organization_id` добавлен в `users` таблицу, учителя корректно привязаны
- [ ] `get_org_stats` возвращает данные только по учителям данной организации
- [ ] CSV импорт привязывает учителей к организации
- [ ] `BulkImportModal` показывает preview CSV перед загрузкой
- [x] CSV импорт создаёт пользователей и возвращает список с паролями
- [x] Дубликаты по email пропускаются с сообщением
- [ ] InviteToken: модель, API и Frontend UI реализованы
- [ ] Регистрация по инвайт-ссылке работает и привязывает к org
