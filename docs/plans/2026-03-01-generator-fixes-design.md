# Design Document: Generator Language Consistency & StoryBook Performance Fixes

- **Date**: 2026-03-01
- **Status**: Approved
- **Priority**: High

## 1. Problem Statement
The current implementation of educational material generators (Math, Quiz, Assignment) suffers from language mixing (English headers with Russian/Uzbek content) due to weak prompt instructions. Additionally, the StoryBook generation feature frequently fails with a 500 Internal Server Error because generating 10 high-quality AI images sequentially exceeds the server's timeout threshold.

## 2. Proposed Solution: Approach 1 (Parallel & Strict)

### 2.1. Strict Language Enforcement
We will transition from embedding language instructions in the "topic" string to a dedicated system-level parameter.

- **Backend Changes**:
    - Update `openai_service.py` functions to accept a `language` parameter.
    - Inject the language into the `SYSTEM_PROMPT` to enforce strict adherence: *"All generated text must be in the specified language ({language}). Header keys (q, a, title) are reserved, but their values must be translated."*
- **Frontend Changes**:
    - Modify `Generator.tsx` and `Library.tsx` to send the `language` field explicitly in the API requests.

### 2.2. Parallel StoryBook Illustration
We will optimize the bottleneck in `gemini_service.py` where images are currently generated one by one.

- **Architecture Change**:
    - Transform `generate_storybook` and its child functions into `async` functions.
    - Implement `asyncio.gather()` to dispatch all 10 image generation requests to the Gemini API simultaneously.
    - This reduces latency from ~70s to ~15s, staying within the standard 29s/60s timeout limits.

## 3. Component Details

### 3.1. API Endpoints (Modified Requests)
- `POST /api/generate/math` -> ADDED `language: string`
- `POST /api/generate/quiz` -> ADDED `language: string`
- `POST /api/generate/assignment` -> ADDED `language: string`
- `POST /api/library/generate` -> CONTINUES TO USE `language: string` (already present, but prompts need tightening)

### 3.2. Prompt Templates
Updated templates will include specific "Language Locking" instructions in the system role message.

## 4. Verification Plan
- **Automated**: Mock API calls to verify that `language` parameters are correctly passed.
- **Manual**: Generate a "Math" layout in Uzbek and verify 100% Uzbek content. Generate a StoryBook and verify it completes without a 500 timeout error.
