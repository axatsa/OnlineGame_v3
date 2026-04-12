# Task 05: Result Editor & Templates

**Priority:** Medium (Sprint 3)  
**Status:** Done

---

## What was built

### Inline Result Editor

After generation, the user can edit the result before downloading.  
Changes persist until the DOCX is downloaded.  
Implemented in `front/src/pages/tools/ResultEditor.tsx`.

### Templates

`Template` model added to `backend/apps/generator/models.py`.  
CRUD API in `backend/apps/generator/router.py`.  
Templates visible in every generator in `Generator.tsx` — can load a saved template to pre-fill the form.  
System templates (at least 6) seeded via `backend/seed.py`.

### API

```
GET    /api/v1/templates           — all templates for current user (+ system ones)
POST   /api/v1/templates           — save new template
DELETE /api/v1/templates/{id}      — delete template
```

---

## Definition of Done

- [x] Editor opens after generation of any content type
- [x] Edits are reflected in the downloaded DOCX
- [x] `Template` model in DB
- [x] Templates API (GET / POST / DELETE)
- [x] Templates shown in each generator
- [x] Custom templates can be created and loaded later
- [x] At least 6 system templates exist
