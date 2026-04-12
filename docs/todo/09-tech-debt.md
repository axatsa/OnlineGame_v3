# Task 09: Technical Debt

**Priority:** High (Sprint 1–2, parallel)  
**Status:** Mostly done — automated tests missing

---

## 9.1 i18n Unification
**Status: Done**

`react-i18next` is the single translation solution. `LangContext` was removed.  
Translations available in RU and UZ.  
All components use `useTranslation()` from `react-i18next`.

---

## 9.2 Error Boundaries
**Status: Done**

`ErrorBoundary` component in `front/src/components/common/`.  
Wraps all generators. Shows toast notification instead of white screen on error.

---

## 9.3 Active Class Persistence
**Status: Done**

`activeClassId` stored in `localStorage` in `ClassContext.tsx`.  
Restored in under 500ms on page reload.

---

## 9.4 Automated Tests
**Status: Not done — 0 tests exist**

### Backend (pytest + httpx)

| File | What to test |
|------|--------------|
| `backend/tests/test_quota_check.py` | Token limit 0 → 402 response |
| `backend/tests/test_rate_limit.py` | 31 requests in one hour → 429 |
| `backend/tests/test_b2b.py` | Create invite token → register with it → user linked to org |

### Frontend (vitest + @testing-library/react)

| File | What to test |
|------|--------------|
| `ClassContext.test.tsx` | `activeClass` restored from localStorage on mount |
| `QuizGenerator.test.tsx` | Form validation rejects empty fields |

---

## 9.5 Sentry
**Status: Done**

Backend: `sentry_sdk.init()` in `backend/main.py`, reads `SENTRY_DSN` from env (skipped if empty).  
Frontend: `@sentry/react` initialized in `front/src/main.tsx` with `VITE_SENTRY_DSN`.

---

## 9.6 API Versioning
**Status: Done**

All routes under `/api/v1/` prefix.  
Old paths kept as deprecated aliases for backward compatibility.

---

## Definition of Done

- [x] Single i18n solution (`react-i18next`)
- [x] `ErrorBoundary` on all generators
- [x] `activeClass` restored from localStorage on reload
- [ ] At least 5 automated tests passing (not started)
- [x] Sentry configured on both frontend and backend
- [x] All API routes under `/api/v1/`
