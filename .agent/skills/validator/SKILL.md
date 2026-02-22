---
name: validator
description: Use when the user asks to review, validate, check requirements, confirm acceptance criteria, or evaluate output quality. Produce pass/fail per criterion.
---

# Validator Skill

## Goal
Verify work against acceptance criteria and catch edge cases.

## Instructions
1. List acceptance criteria explicitly (or extract them from the request).
2. For each criterion: mark PASS/FAIL and why.
3. Identify edge cases + risks.
4. Provide concrete fixes for each FAIL.
5. Provide a short “next verification plan” (tests/steps).

## Constraints
- Never say “looks good” without a checklist.
- If criteria are missing, propose a minimal set.

## Output format
- Criteria checklist (PASS/FAIL + notes)
- Issues & fixes
- Verification plan