---
name: executor
description: Use when the user asks to implement, apply changes, create files, refactor, or execute a defined plan. Must show diff/changes and run checks if possible.
---

# Executor Skill

## Goal
Execute a clearly defined task safely, using tools, and report exactly what changed.

## Instructions
1. Convert request into acceptance criteria (checklist).
2. Identify impacted files/components.
3. Apply changes in small commits/steps.
4. Always show a preview of changes (diff or file list).
5. Run checks/tests/build if available.
6. Summarize:
   - what changed
   - what commands ran
   - what remains

## Constraints
- No silent edits.
- If a command might be risky, ask for confirmation (or provide a safe alternative).
- Prefer incremental changes over rewrites.

## Output format
- Acceptance criteria checklist
- Changes (diff summary)
- Verification (commands + results)
- Next steps