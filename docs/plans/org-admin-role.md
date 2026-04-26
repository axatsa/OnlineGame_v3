# Роль org_admin — Реализация

**Дата:** 26.04.2026  
**Статус:** ✅ Завершено

---

## Цель

Когда организация покупает тариф SCHOOL ($49/мес), её представителю нужна собственная панель — видеть учителей, добавлять новых, блокировать, генерировать инвайты. До этого `contact_person` в Organization было просто строкой, не аккаунтом. Super admin делал всё вручную.

---

## Что может org_admin

| Действие | Эндпоинт |
|----------|----------|
| Видеть статистику организации | `GET /org-admin/me` |
| Список своих учителей | `GET /org-admin/teachers` |
| Добавить учителя | `POST /org-admin/teachers` |
| Заблокировать / разблокировать | `POST /org-admin/teachers/{id}/toggle-block` |
| Удалить учителя | `DELETE /org-admin/teachers/{id}` |
| Инвайт-ссылка | `POST /org-admin/invite` |
| Написать super admin в Telegram | `GET /org-admin/contact` |

**Не может:** менять планы учителей, видеть другие орги, заходить в `/admin`.

---

## Реализованные файлы

### Backend

| Файл | Изменение |
|------|-----------|
| `backend/apps/auth/dependencies.py` | `require_org_admin()` — проверяет роль и `organization_id` |
| `backend/apps/org_admin/router.py` | ✅ Новый роутер (6 эндпоинтов) |
| `backend/apps/admin/router.py` | `promote`, `demote`, `set-token-limit`, фильтр включает `org_admin` |
| `backend/main.py` | Зарегистрирован `org_admin_router` с префиксом `/api/v1` |

### Frontend

| Файл | Изменение |
|------|-----------|
| `front/src/context/AuthContext.tsx` | Тип `role` включает `"org_admin"`, `GET /auth/me` при инициализации |
| `front/src/components/common/ProtectedRoute.tsx` | `allowedRoles` тип расширен, редирект на roleHome |
| `front/src/pages/auth/Login.tsx` | Редирект `org_admin → /org-admin` |
| `front/src/pages/dashboard/OrgAdminDashboard.tsx` | ✅ Новая страница (~700 строк) |
| `front/src/App.tsx` | Lazy import + route `/org-admin`, обновлены `/profile`, `/history`, `/analytics` |
| `front/src/pages/dashboard/AdminPanel.tsx` | Бейдж ORG ADMIN, кнопки promote/demote, токен-лимит, admin_telegram |
| `front/src/api/adminService.ts` | `promoteToOrgAdmin`, `demoteFromOrgAdmin`, `setOrgTokenLimit` |

---

## Пользовательский флоу

```
Super admin → AdminPanel → Учителя → строка учителя
  → кнопка "Сделать адм.орги" (если есть organization_id)
  → POST /admin/teachers/{id}/promote
  → роль меняется на org_admin
  → пользователь должен перезайти

Org admin → Login → роль = "org_admin"
  → редирект на /org-admin
  → видит статистику орги + список своих учителей
  → может добавлять/блокировать/удалять + генерировать инвайты
  → кнопка "Настройки" → /profile (смена пароля)
  → кнопка "Купить план" → модалка PRO/SCHOOL → /checkout?plan=...
  → кнопка "Написать в Telegram" → если admin_telegram настроен в SystemSettings
```

---

## Лимиты токенов

- По умолчанию: 30 000 токенов/месяц (план Free)
- Super admin может установить лимит для всей орги сразу через AdminPanel → кнопка "Токены" в строке организации
- Org admin видит лимит каждого учителя в таблице
- Org admin не может сам изменить лимиты — только написать super admin в Telegram

---

## Безопасность

- `require_org_admin()` проверяет: роль в `("super_admin", "org_admin")` AND `organization_id is not None`
- Все запросы к `/org-admin/*` дополнительно фильтруют по `teacher.organization_id == user.organization_id`
- org_admin не может видеть/изменять учителей других организаций
- Super admin может всё (его role проходит `require_org_admin`)
