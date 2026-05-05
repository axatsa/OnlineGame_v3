# ClassPlay v3 — Remaining Work & Technical Debt

**Last Updated:** 2026-05-04
**Status:** Most high/medium priority items complete; focused on Admin Phase 4 + student features

---

## Quick Summary

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| 🔴 High | 3 | 3 | 0 |
| 🟡 Medium | 4 | 3 | 1 |
| 🔵 Low | 4 | 2 | 2 |
| ⚪ Deferred | 3 | 0 | 3 |

**Recently completed (2026-05-02 → 05-04):**
- ✅ KaTeX math rendering — all game components + RichTextRenderer rewrite
- ✅ Gemini model auto-discovery + MATH_FORMAT_INSTRUCTION in all generations
- ✅ Telegram bot OTP flow (replaced /login)
- ✅ Gemini Vision receipt auto-verification
- ✅ Prices updated to UZS (sums)
- ✅ BigInteger fix for telegram_user_id
- ✅ land_faq_title i18n key fix
- ✅ Dead code removal (StudentDashboard, TokenUsageBar)
- ✅ Type safety in AdminPanel.tsx (13+ interfaces)
- ✅ Generator.tsx refactored (1786 lines → domain components)
- ✅ Landing.tsx refactored (713 lines → 11 section components)

---

## 🔴 HIGH PRIORITY ✅ ALL COMPLETED

### 1. Remove StudentDashboard.tsx ✅ DONE (2026-05-02)
### 2. Remove TokenUsageBar.tsx ✅ DONE (2026-05-02)
### 3. Fix Type Safety in AdminPanel.tsx ✅ DONE (2026-05-02)

---

## 🟡 MEDIUM PRIORITY

### 4. Refactor Generator.tsx ✅ DONE (2026-05-02)
Extracted into domain-based form + preview components.

### 5. Refactor AdminPanel.tsx — TODO
- **File:** `front/src/pages/dashboard/AdminPanel.tsx`
- **Lines:** ~2400 — monolithic: user management, class management, org settings, analytics
- **Proposed structure:**
  ```
  components/admin/
    ├── UserManagement/
    ├── ClassManagement/
    ├── AdminStats.tsx
    └── AdminSettings.tsx
  pages/dashboard/AdminPanel.tsx (orchestrator, ~100 lines)
  ```
- **Effort:** 6–8 hours

### 6. Refactor Landing.tsx ✅ DONE (2026-05-02)
Split into 11 section components.

### 7. Create Proper API Response Interfaces — TODO
- **Scope:** `front/src/lib/api.ts` and `front/src/types/`
- **Action:** Create `types/responses.ts` — typed interfaces for all backend responses
- **Effort:** 3–4 hours

---

## 🔵 LOW PRIORITY

### 8. Generate Game Cover Images — TODO
- **Games missing covers:** Hangman, SpellingBee, MathPuzzle, WordTranslate
- **Approach:** Custom SVG illustrations or DALL-E generation
- **Effort:** 2–3 hours (design dependency)

### 9. Add Book Progress Indicator — TODO
- **File:** `front/src/pages/library/Library.tsx`
- **Feature:** Progress bar or percentage badge on book cards
- **Effort:** 1–2 hours

### 10. Pagination in /generate/history ✅ PARTIALLY DONE
- Backend supports `offset` param; frontend hardcoded at limit=100
- **Remaining:** Add infinite scroll or page controls in `History.tsx`
- **Effort:** 1 hour

### 11. WordTranslate Multiple Choice Mode — TODO
- **File:** `front/src/pages/games/WordTranslate.tsx`
- **Feature:** Quiz mode with 4 options (already exists in separate branch of UI)
- **Effort:** 2 hours

---

## ⚪ DEFERRED — Blocked/Future

### 12. Voice Changer in SpellingBee
5 presets exist; advanced voice pitch/speed/accent customisation requires audio infrastructure.

### 13. Admin Panel Phase 4
- Finance View: colour-coded Active/Expiring/Expired status on org rows
- Quick Analytics: 4 pie charts (plans, statuses, payments, orgs)
- Audit Logs: target filter, count by type, quick view modal
- Export improvements: `expires_at`, seat usage %, subscription plans
- **Effort:** 8–12 hours total

### 14. Student Multiplayer Sessions
- Real-time game sessions (teacher launches → students join with code, like Kahoot)
- WebSocket infrastructure required
- **Effort:** 20+ hours

---

## Recommended Execution Order (Next Sprint)

### Quick wins (< 1 day)
1. Pagination in `/generate/history` (1 hour)
2. WordTranslate multiple choice mode (2 hours)
3. Book progress indicator on library cards (1 hour)

### Medium effort (2–3 days)
4. Admin Phase 4 — Quick Analytics pie charts
5. Admin Phase 4 — Finance View
6. API response interfaces

### Large effort (1 week)
7. AdminPanel.tsx refactor
8. Game cover images

---

## Verification Checklist

After each task, verify:
- [ ] `npm run build` in `/front` — zero TypeScript errors
- [ ] No unused imports in modified files
- [ ] Dev server runs without warnings
- [ ] Related routes work in browser
- [ ] No regression in existing features

---

## Notes for Developers

- **AI routing:** `openai_service.py` is the entry point → delegates to `gemini_service.py` (primary); OpenAI is fallback
- **Math in AI output:** All generations include `MATH_FORMAT_INSTRUCTION`; frontend renders via KaTeX through `RichTextRenderer`
- **Bot auth:** Session-based state machine in `sessions.py`; steps: `idle | waiting_email | waiting_otp | waiting_name | waiting_screenshot`
- **Payment flow:** Telegram bot → receipt screenshot → Gemini Vision auto-verify (≥85%) → activate; else admin manual review
- **Navigation:** All back-button navigation uses `navigate(-1)` for better UX
- **localStorage:** Targeted key removal instead of `clear()` to avoid affecting other apps
- **Type Safety:** Prefer interfaces over `any` casts
- **i18n:** `t('key')` for all UI strings; no hardcoded text
- **File Naming:** PascalCase for React components, camelCase for utilities
