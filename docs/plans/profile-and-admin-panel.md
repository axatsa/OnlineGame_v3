# Teacher Profile & Admin Panel Improvements

**Date:** 2026-04-07  
**Status:** Implemented

---

## Teacher Profile

### What was added

**User summary section:** avatar placeholder, full name, email, role, "Member since" date.  
**Edit Profile modal:** update full name.  
**Statistics grid:**
- Total resources generated (from `SavedResource` + `GenerationLog`)
- AI usage: tokens used this month / monthly limit (progress bar)
- Classes: number of active classes and students

**API:** `GET /api/v1/users/me/stats` aggregates data from `SavedResource`, `TokenUsage`, and `ClassGroup`.

DB changes in `backend/apps/auth/models.py`:
- Added `created_at = Column(DateTime, default=func.now())`
- Added `is_active = Column(Boolean, default=True)`

---

## Cross-Device Access (Smart Board → PC)

Teachers generate materials on interactive whiteboards but need to print from a separate computer.

Three solutions implemented:
1. **QR Code:** "Share" button on each history item shows a QR code linking to the material
2. **Send to email:** One-click button to email PDF/DOCX to the teacher's registered address
3. **Persistent history:** Teachers know they can log in on any device and access "My Materials"

---

## Super Admin Panel

### New capabilities

**Teacher management:**
- Create teacher account manually (modal)
- Edit name, email, and token limit (modal)
- Block / Unblock toggle (`is_active` field)
- Reset password (admin sets a new one)

**Organization management:**
- Full CRUD: create, edit, delete organization
- Fields: name, license seats, expiry date

**UI improvements:**
- Status badges (Active / Blocked) on teacher rows
- Filter teachers by organization and status

### API changes (`backend/apps/admin/router.py`)

```
PATCH  /api/v1/admin/teachers/{user_id}               — update info and limits
POST   /api/v1/admin/teachers/{user_id}/toggle-status  — block / unblock
POST   /api/v1/admin/teachers/{user_id}/reset-password — set new password
PUT    /api/v1/admin/organizations/{org_id}             — update org details
DELETE /api/v1/admin/organizations/{org_id}             — delete org
```

### Frontend files

- `front/src/pages/dashboard/AdminPanel.tsx` — updated with new actions
- `front/src/components/admin/TeacherFormModal.tsx` — new
- `front/src/components/admin/OrgFormModal.tsx` — new
- `front/src/pages/dashboard/Profile.tsx` — updated with stats and edit mode
