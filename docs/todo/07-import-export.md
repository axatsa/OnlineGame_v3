# Task 07: Custom Word Import & Google Drive Export

**Priority:** Low (Sprint 4)  
**Status:** Not started

---

## 7.1 Custom Words for Crossword / Word Search

**Files:** `front/src/pages/tools/Generator.tsx`, `backend/apps/generator/router.py`

### Frontend

Add a toggle "AI generation / My words" in the generator sidebar.

- **Manual input:** textarea — words separated by commas or newlines
- **CSV upload:** button to upload a file, parsed client-side with Papa Parse

CSV format:
```
cat,domestic animal
dog,man's best friend
```

### Backend

If the request contains `custom_words: list[str]` — skip AI, build the grid directly.  
For crossword: also accept `custom_clues: dict[str, str]` (word → definition).

---

## 7.2 Google Drive Export

**File:** `front/src/utils/googleDrive.ts`

Add a "Save to Drive" button next to "Download DOCX" in the result editor.

Flow:
1. If user is not Google-authorized — show OAuth popup
2. Get the DOCX blob (same as local download)
3. Upload via `multipart/form-data` to Google Drive API v3

Required setup:
- Google Cloud Console: create an OAuth 2.0 Web Client ID
- Scope: `https://www.googleapis.com/auth/drive.file`
- Add `VITE_GOOGLE_CLIENT_ID` to `.env`
- If `VITE_GOOGLE_CLIENT_ID` is not set — button is hidden

---

## Definition of Done

- [ ] Crossword and Word Search accept custom word input (textarea)
- [ ] CSV upload parses and passes words to the generator
- [ ] "Save to Drive" button appears in result editor
- [ ] OAuth flow works in the browser
- [ ] File appears in Google Drive after upload
