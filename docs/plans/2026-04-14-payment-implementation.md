# Payment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure payment environment variables and ensure the system is ready for moderation and testing.

**Architecture:** Update the server-side configuration and add a mandatory Public Offer page for payment provider compliance.

**Tech Stack:** FastAPI (Backend), React (Frontend), SSH/SCP (Deployment).

---

### Task 1: Generate and Deploy .env Configuration

**Files:**
- Create: `config/.env.prod` (local template)
- Modify: Remote `.env` on server

**Step 1: Create the local .env.prod template**
Create a file `/Users/axat/Projects/OnlineGame_v3/config/.env.prod` with the consolidated content.

```bash
# Database Configuration
POSTGRES_USER=v3_user
POSTGRES_PASSWORD=v3_password
POSTGRES_DB=v3_db
DATABASE_URL=postgresql://v3_user:v3_password@db:5432/v3_db

# Security
SECRET_KEY=supersecretkeyChangeThisInProduction
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# External Services
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE

# Payment Settings
# WARNING: Do NOT reuse credentials from other projects (e.g. Testora)
PAYMENT_SIMULATE=true
PAYME_MERCHANT_ID=
PAYME_SECRET_KEY=
CLICK_SERVICE_ID=
CLICK_MERCHANT_ID=
CLICK_SECRET_KEY=
PLAN_PRO_PRICE_TIYIN=19000000
PLAN_SCHOOL_PRICE_TIYIN=62000000
FRONTEND_URL=https://thompson.uz
```

**Step 2: Provide deployment command**
Run: `scp -P 1089 /Users/axat/Projects/OnlineGame_v3/config/.env.prod temp@thompson.uz:~/OnlineGame_v3/.env`
Expected: File uploaded successfully.

**Step 3: Commit**
```bash
git add config/.env.prod
git commit -m "config: add production env template for payments"
```

### Task 2: Create Public Offer Page (Compliance)

**Files:**
- Create: `front/src/pages/Legal.tsx`
- Modify: `front/src/App.tsx` (add route)

**Step 1: Implement Legal.tsx with Public Offer text**
Template for the Public Offer in Russian/Uzbek as required by Payme/Click.

**Step 2: Register route in App.tsx**
Add `<Route path="/terms" element={<Legal />} />`.

**Step 3: Commit**
```bash
git add front/src/pages/Legal.tsx front/src/App.tsx
git commit -m "feat: add public offer page for payment compliance"
```

### Task 3: Verify Simulation Flow

**Step 1: Trigger payment on frontend**
Navigate to `/checkout`, select a plan, and verify redirection to `/payment/success` because `PAYMENT_SIMULATE=true`.

**Step 2: Check database**
Verify `UserSubscription` is active for the current user.
