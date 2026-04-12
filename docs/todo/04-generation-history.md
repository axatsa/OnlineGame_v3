# Task 04: Generation History & Favorites

**Priority:** Medium (Sprint 2)  
**Status:** Done

---

## What was built

Every successful generation is saved to `generation_logs` table automatically.  
History is capped at 100 entries per user (oldest are deleted).

### Database model (`generation_logs`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int PK | — |
| `user_id` | int FK | linked to `users` |
| `feature` | str | `"quiz"`, `"math"`, `"crossword"`, `"assignment"`, `"book"` |
| `title` | str | short label (topic/title) |
| `input_params` | JSON | what the user submitted |
| `result_preview` | str | first 200 chars of result |
| `tokens_used` | int | — |
| `is_favorite` | bool | default false |
| `created_at` | datetime | — |

### API

```
GET    /api/v1/history?limit=20&offset=0   — recent items
GET    /api/v1/history/favorites           — favorites only
POST   /api/v1/history/{id}/favorite       — mark as favorite
DELETE /api/v1/history/{id}/favorite       — unmark
DELETE /api/v1/history/{id}                — delete entry
POST   /api/v1/history/{id}/regenerate     — re-run with same params
```

### Frontend

- History sidebar shows last 5 entries with feature icon and topic name
- "All (N)" link opens `HistoryPage.tsx` with full list
- Filters by type: Quiz / Math / Crossword / Assignment
- Tabs: All / Favorites
- Actions per item: Download, Regenerate, Favorite, Delete

Files: `front/src/pages/dashboard/HistoryPage.tsx`, `front/src/hooks/useHistory.ts`

---

## Definition of Done

- [x] Every generation is saved automatically
- [x] Sidebar shows recent items
- [x] History page has type filters and favorites tab
- [x] Regenerate fills the generator form with previous params
- [x] Favorites persist across sessions
