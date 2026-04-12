# Task 08: B2B Tools — Org–User Link, Invite System, CSV Import

**Priority:** Critical (Sprint 1)  
**Status:** Partial — UI exists, critical DB bug unresolved

---

## Critical Bug

`users` table has no `organization_id` field.  
`get_org_stats` in `backend/apps/admin/router.py` currently returns ALL teachers in the system — not just those belonging to the requested organization.  
CSV import creates users without linking them to any org.  
This is a data leak between clients. **Must be fixed before any live demo.**

---

## 8.1 Fix: Link User to Organization

**Files:** `backend/apps/auth/models.py`, `backend/apps/admin/models.py`, `backend/apps/admin/router.py`, `backend/fix_db.py`

Add to `User` model:
```python
organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
organization = relationship("Organization", back_populates="teachers")
```

Add to `Organization` model:
```python
teachers = relationship("User", back_populates="organization")
```

Update `fix_db.py`:
```python
# Add to columns_to_add list:
("users", "organization_id", "INTEGER")
```

Fix `get_org_stats` — filter `User` query by `organization_id == org_id`.  
Fix `import_csv` — set `user.organization_id = org_id` on create, increment `org.used_seats`.

---

## 8.2 Organization Stats Dashboard (UI exists, needs data fix)

**File:** `front/src/pages/dashboard/AdminPanel.tsx` (OrgStatsModal)

UI is done. After the 8.1 fix, the endpoint will return correct data:
```json
{
  "org_name": "School #15",
  "total_teachers": 12,
  "active_last_7_days": 8,
  "total_generations": 340,
  "teachers": [
    { "name": "Ivanova A.A.", "generations_30d": 45, "last_active": "2026-03-29" }
  ]
}
```

---

## 8.3 Invite Link System

**Files:** `backend/apps/admin/models.py`, `backend/apps/admin/router.py`, `backend/apps/auth/router.py`, `front/src/pages/dashboard/AdminPanel.tsx`, `front/src/pages/auth/JoinWithInvite.tsx`

### InviteToken model
```python
class InviteToken(Base):
    __tablename__ = "invite_tokens"
    token      = Column(String, unique=True)   # UUID
    org_id     = Column(Integer, ForeignKey("organizations.id"))
    expires_at = Column(DateTime)              # +7 days from creation
    max_uses   = Column(Integer, default=30)
    uses_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### API
```
POST   /api/v1/admin/organizations/{org_id}/invites    — generate token
GET    /api/v1/admin/organizations/{org_id}/invites    — list active tokens
DELETE /api/v1/admin/invites/{token_id}                — revoke token
POST   /api/v1/auth/register-with-invite               — register via invite link
```

Registration link format: `https://classplay.uz/join/{token}`  
On registration: user is auto-linked to the org, `uses_count` is incremented.

### Frontend (AdminPanel)
- "Generate Invite" button per organization
- List of active invite links with expiry dates
- "Copy link" button

---

## 8.4 CSV Bulk Import — Add Preview Step

**File:** `front/src/pages/dashboard/BulkImportModal.tsx`

Drag & drop and upload are already implemented.  
Missing: preview step before submission.

Add client-side CSV parsing with Papa Parse:
1. User uploads file → parse in browser
2. Show preview table: name / email / validation errors
3. "Confirm & Upload" button only after preview

---

## Definition of Done

- [x] `organization_id` added to `users` table
- [x] `get_org_stats` returns only teachers of the requested org
- [x] CSV import links teachers to the correct org
- [x] BulkImportModal shows CSV preview before upload
- [x] CSV import creates users and returns list with temporary passwords
- [x] Duplicate emails are skipped with a warning message
- [x] InviteToken model, API endpoints, and frontend UI implemented
- [x] Registration via invite link works and links user to org
