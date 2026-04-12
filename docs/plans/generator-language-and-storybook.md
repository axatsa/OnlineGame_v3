# Generator: Language Consistency & StoryBook Performance

**Date:** 2026-03-01  
**Status:** Implemented

---

## Problems Solved

**Language mixing:** Generators (Math, Quiz, Assignment) were producing English headers with Uzbek/Russian content because the language instruction was embedded in the topic string rather than enforced at the system level.

**StoryBook timeouts:** Generating 10 AI images sequentially took ~70s, exceeding the server timeout. This caused frequent 500 errors.

---

## Solutions

### Strict Language Enforcement

Added a `language` parameter to all generator endpoints:
- `POST /api/v1/generate/math`
- `POST /api/v1/generate/quiz`
- `POST /api/v1/generate/assignment`

`language` is injected into the system prompt in `backend/services/openai_service.py`:
> "All generated text must be in {language}. Header keys (q, a, title) are reserved technical keys — their values must be in {language}."

Frontend sends `language` explicitly from `Generator.tsx` and `Library.tsx`.

### Parallel StoryBook Illustration

`generate_storybook` in `backend/services/openai_service.py` is async.  
All 10 image generation calls dispatched simultaneously via `asyncio.gather()`.  
Latency reduced from ~70s to ~15s, well within the 60s timeout limit.

---

## Files Changed

- `backend/services/openai_service.py` — `language` param + async image generation
- `front/src/pages/tools/Generator.tsx` — sends `language` field
- `front/src/pages/library/Library.tsx` — sends `language` field
