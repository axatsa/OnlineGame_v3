# Task 02: UX — Onboarding & Dashboard

**Priority:** Medium (Sprint 2)  
**Status:** Done

---

## What was built

**Onboarding:** 4-step modal shown on first login. Triggered in `TeacherDashboard.tsx` when `user.onboarding_completed === false`. Completion call: `POST /auth/onboarding-complete` — sets flag in `users` table.

**Dashboard:** Shows real data from `generation_logs` via `GET /stats/me`. Activity chart uses Recharts (bars by day). No hardcoded placeholder numbers.

**Files:**
- `front/src/components/Onboarding/OnboardingModal.tsx`
- `front/src/context/AuthContext.tsx` — updates user state after onboarding
- `front/src/pages/dashboard/TeacherDashboard.tsx`
- `backend/apps/auth/models.py` — `onboarding_completed: bool`
- `backend/apps/auth/router.py` — `POST /auth/onboarding-complete`
- `backend/apps/generator/router.py` — `GET /stats/me`

---

## Definition of Done

- [x] Onboarding shown on first login
- [x] `onboarding_completed` flag saved in DB
- [x] Dashboard shows real stats from `generation_logs`
- [x] Activity chart works
- [x] No placeholder zeros where data exists
