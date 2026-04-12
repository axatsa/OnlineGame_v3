# Sprint 2: UX & Trust

**Date:** 2026-04-09  
**Status:** Done

---

## Goal

Improve first-time teacher experience through onboarding and real dashboard data. Increase landing page conversion with social proof.

---

## Task 1: Onboarding Backend

Added `onboarding_completed = Column(Boolean, default=False)` to `User` model.  
`fix_db.py` updated to add the column.  
Endpoint: `POST /api/v1/auth/onboarding-complete`

---

## Task 2: Onboarding Frontend

`OnboardingModal.tsx` — 4-step modal.  
Shown in `TeacherDashboard.tsx` when `user.onboarding_completed === false`.  
`AuthContext` updates user state after completion API call.

---

## Task 3: Teacher Stats API

`GET /api/v1/stats/me` — real counters from `generation_logs`.  
`TeacherDashboard.tsx` uses Recharts BarChart for the activity graph.

---

## Task 4: Landing Page Polish

`front/src/pages/Landing.tsx`:
- Testimonials section (4 cards, `whileInView` animation)
- FAQ accordion (`AnimatePresence`)

`front/index.html`:
- OG meta tags: title, description, image, URL
- Twitter card meta tags

---

## Definition of Done

- [x] Onboarding works for new users
- [x] Dashboard shows real data from generation_logs
- [x] Landing has testimonials and FAQ
- [x] No regressions in B2B logic
