# B2B Implementation Plan

**Date:** 2026-04-09  
**Status:** In progress — critical DB bug blocks all org-scoped features

---

## Goal

Complete B2B logic: link teachers to organizations, secure invite system, CSV import preview, real financial metrics.

---

## Task 1: User ↔ Organization DB Schema

**Files:** `backend/apps/auth/models.py`, `backend/apps/admin/models.py`, `backend/fix_db.py`

Add to `User`:
```python
organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
organization = relationship("Organization", back_populates="teachers")
```

Add to `Organization`:
```python
teachers = relationship("User", back_populates="organization")
```

Add to `fix_db.py` columns_to_add:
```python
("users", "organization_id", "INTEGER")
```

---

## Task 2: Fix Data Leak in Org Stats

**File:** `backend/apps/admin/router.py` — `get_org_stats` function

Current bug: queries all users, not filtered by org.  
Fix: add `User.organization_id == org_id` to the query filter.

---

## Task 3: CSV Import — Org Association + Preview

**Backend:** `backend/apps/admin/router.py` — `import_csv`  
On user create: `user.organization_id = org_id`, `org.used_seats += 1`

**Frontend:** `front/src/pages/dashboard/BulkImportModal.tsx`  
Add Papa Parse preview step before submission (see [08-b2b-tools.md](../todo/08-b2b-tools.md)).

---

## Task 4: Invite System

**Model:** `InviteToken` — UUID token, org_id, expires_at, max_uses, uses_count  
**API:** 4 endpoints (create, list, revoke, register-with-invite)  
**Frontend:** invite generation UI in AdminPanel + `/join/{token}` registration page

See [08-b2b-tools.md](../todo/08-b2b-tools.md) for full spec.

---

## Task 5: Real Financial Metrics

**File:** `backend/apps/admin/router.py`, `front/src/pages/dashboard/AdminPanel.tsx`

Replace hardcoded MRR/ARR/churn/LTV values with aggregated queries on the `payments` table.

```sql
-- MRR: sum of active monthly payments in the current month
SELECT SUM(amount) FROM payments
WHERE status = 'paid'
AND date >= date_trunc('month', CURRENT_DATE);
```
