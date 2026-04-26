# B2B Implementation Plan

**Date:** 2026-04-09  
**Updated:** 2026-04-26  
**Status:** ✅ Завершено

---

## Goal

Complete B2B logic: link teachers to organizations, secure invite system, CSV import preview, real financial metrics, org admin dashboard.

---

## ✅ Task 1: User ↔ Organization DB Schema

**Files:** `backend/apps/auth/models.py`, `backend/apps/admin/models.py`, `backend/fix_db.py`

```python
# User model
organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
organization = relationship("Organization", back_populates="teachers")
```

**Статус:** ✅ Завершено

---

## ✅ Task 2: Fix Data Leak in Org Stats

**File:** `backend/apps/admin/router.py` — `get_org_stats`

Добавлен фильтр `User.organization_id == org_id`.

**Статус:** ✅ Завершено

---

## ✅ Task 3: CSV Import — Org Association + Preview

**Backend:** `user.organization_id = org_id`, `org.used_seats += 1` при импорте  
**Frontend:** `BulkImportModal.tsx` с Papa Parse preview

**Статус:** ✅ Завершено

---

## ✅ Task 4: Invite System

**Model:** `InviteToken` — UUID token, org_id, expires_at, max_uses, uses_count  
**API:** 4 эндпоинта (create, list, revoke, register-with-invite)  
**Frontend:** Генерация инвайтов в AdminPanel + страница `/register?invite={token}`

**Дополнение (26.04.2026):** Org admin тоже может генерировать инвайты через `POST /org-admin/invite`.

**Статус:** ✅ Завершено

---

## ✅ Task 5: Real Financial Metrics

**File:** `backend/apps/admin/router.py`, `front/src/pages/dashboard/AdminPanel.tsx`

Реальные данные из таблицы `payments` вместо хардкода.

**Статус:** ✅ Завершено

---

## ✅ Task 6: Роль org_admin (новое, 26.04.2026)

Полная реализация описана в [org-admin-role.md](./org-admin-role.md).

**Backend:**
- `backend/apps/org_admin/router.py` — все эндпоинты org_admin
- `POST /admin/teachers/{id}/promote` и `/demote`
- `POST /admin/organizations/{id}/set-token-limit`

**Frontend:**
- `OrgAdminDashboard.tsx` — полная панель управления
- Promote/demote кнопки в AdminPanel
- Корректные редиректы по ролям

**Статус:** ✅ Завершено

---

## Оставшееся (низкий приоритет)

- [ ] Admin Phase 4: Finance View с цветными статусами
- [ ] Admin Phase 4: Quick Analytics (pie charts)
- [ ] Экспорт с полными данными подписки
