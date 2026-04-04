# Tech Debt Resolution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve technical debt by enforcing i18next globally, integrating Sentry error tracking on both ends, and adding API version prefixes.

**Architecture:** We will systematically modify the backend router base paths, then add Sentry SDKs to both apps, and finally eradicate the custom `LangContext` in favor of standard `react-i18next`.

**Tech Stack:** FastAPI, React, i18next, Sentry

---

### Task 1: API Versioning (Backend & Frontend Config)

**Files:**
- Modify: `d:\Projects\OnlineGame_v3\backend\main.py`
- Modify: `d:\Projects\OnlineGame_v3\front\src\lib\api.ts` (assuming this is where base URL is stored)

**Step 1: Update API router prefixes**

Modify `backend/main.py` to route all endpoints inside a `/api/v1/` prefix, keeping the old ones as deprecated alias.

```python
# Before
app.include_router(auth_router)
app.include_router(classes_router)
app.include_router(generator_router)
app.include_router(gamification_router)
app.include_router(library_router)
app.include_router(admin_router)

# After
app.include_router(auth_router, prefix="/api/v1")
app.include_router(classes_router, prefix="/api/v1")
app.include_router(generator_router, prefix="/api/v1")
app.include_router(gamification_router, prefix="/api/v1")
app.include_router(library_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

# Also keep deprecated aliases
app.include_router(auth_router, deprecated=True)
app.include_router(classes_router, deprecated=True)
app.include_router(generator_router, deprecated=True)
app.include_router(gamification_router, deprecated=True)
app.include_router(library_router, deprecated=True)
app.include_router(admin_router, deprecated=True)
```

**Step 2: Start backend to test**
Run: `cd d:\Projects\OnlineGame_v3\backend && uvicorn main:app --reload`
Expected: Server starts successfully without errors.

**Step 3: Test new endpoint**
Run: `curl http://127.0.0.1:8000/health` (Assuming health endpoint)
Expected: Returns 200 JSON response.

**Step 4: Update frontend base URL**
Identify the `axios` or `fetch` config in `front/src/lib/api.ts` and set the baseURL to `/api/v1` (if applicable, or `/api/v1/` instead of `/`).

**Step 5: Commit**
`git commit -am "refactor: api v1 versioning applied"`

---

### Task 2: Backend Sentry Integration

**Files:**
- Modify: `d:\Projects\OnlineGame_v3\backend\requirements.txt`
- Modify: `d:\Projects\OnlineGame_v3\backend\main.py`
- Create: `.env.example` update (Optional but good practice)

**Step 1: Install Sentry**
Run: `cd d:\Projects\OnlineGame_v3\backend && pip install sentry-sdk`

**Step 2: Add requirements**
Add `sentry-sdk==2.0.0` (or latest) to `backend/requirements.txt`

**Step 3: Modify main.py to initialize Sentry**
```python
import sentry_sdk
import os

sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=0.1,
    )
```

**Step 4: Start backend to verify**
Run: `uvicorn main:app`
Expected: Starts cleanly. No import errors.

**Step 5: Commit**
`git commit -am "feat(backend): add sentry basic setup"`

---

### Task 3: Frontend Sentry Integration

**Files:**
- Modify: `d:\Projects\OnlineGame_v3\front\package.json`
- Modify: `d:\Projects\OnlineGame_v3\front\src\main.tsx`

**Step 1: Install Sentry React**
Run: `cd d:\Projects\OnlineGame_v3\front && npm install @sentry/react`

**Step 2: Add Sentry Init to main.tsx**
```tsx
import * as Sentry from "@sentry/react";

Sentry.init({ 
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
});
```

**Step 3: Build to test**
Run: `cd d:\Projects\OnlineGame_v3\front && npm run tsc`
Expected: Passes typescript checks.

**Step 4: Commit**
`git commit -am "feat(front): sentry integration initialized"`

---

### Task 4: UI i18n Unification

**Files:**
- Delete: `d:\Projects\OnlineGame_v3\front\src\context\LangContext.tsx`
- Modify: Multiple (`App.tsx`, `TeacherNavbar.tsx`, `Login.tsx`, etc - approximately 22 files using `LangContext`)

**Step 1: Delete custom context**
Run: `rm d:\Projects\OnlineGame_v3\front\src\context\LangContext.tsx`

**Step 2: Replace imports across all files**
In every file using `useLang()`:
```tsx
// Before
import { useLang } from "@/context/LangContext";
...
const { t, lang, setLang } = useLang();

// After
import { useTranslation } from "react-i18next";
...
const { t, i18n } = useTranslation();
const lang = i18n.language;
const setLang = (l: string) => i18n.changeLanguage(l);
```

**Step 3: Verify with TS check**
Run: `cd d:\Projects\OnlineGame_v3\front && npm run tsc`
Expected: Ensure no missing `LangContext` module errors. (Iterate if missed files).

**Step 4: Commit**
`git commit -am "refactor: unified i18n via react-i18next"`
