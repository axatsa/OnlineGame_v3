---
name: debugger
description: Use when the user provides an error, exception, stack trace, failing test, or “it doesn’t work”. Diagnose and propose minimal fixes with verification steps.
---

# Debugger Skill

## Goal
Diagnose the root cause and propose the smallest safe fix.

## Instructions
1. Parse the error:
   - error type/message
   - file + line
   - call chain
2. Generate 2–4 hypotheses ranked by likelihood.
3. Inspect relevant files/logs if tools are available.
4. Propose a minimal patch:
   - what to change
   - why it fixes root cause
5. Provide verification:
   - command to run (tests/build)
   - expected outcome

## Constraints
- Prefer minimal diff.
- Do not suggest destructive actions (delete/reset) unless clearly necessary and explicitly warned.

## Output format
- Diagnosis
- Likely root cause
- Minimal fix (patch/diff or steps)
- How to verify