# Task 06: Batch Generation

**Priority:** Low (Sprint 3)  
**Status:** Done

---

## What was built

Teachers can generate multiple variants of the same assignment in one click and download them as a ZIP archive.

### Backend

Endpoint: `POST /api/v1/generate/batch`  
Accepts: `tool_type`, `params`, `count` (2 / 3 / 5 / 10)  
Returns: `StreamingResponse` with a ZIP archive.

ZIP creation is handled in `backend/apps/generator/batch_utils.py` — formats each variant as a text file and packs with `zipfile`.

Batch generation counts toward the user's monthly token quota (total tokens, not per-request).

### Frontend

In `Generator.tsx` sidebar: toggle "Batch generation" + variant count selector.  
On submit: downloads ZIP automatically.

---

## Definition of Done

- [x] Batch toggle available in Quiz, Math, Assignment generators
- [x] Backend returns N variants in a ZIP
- [x] ZIP download works in the browser
- [x] Token quota counts batch usage correctly
