# Task 03: Dark Theme

**Priority:** Medium (Sprint 2)  
**Status:** Done

---

## What was built

`ThemeContext` (`front/src/context/ThemeContext.tsx`) manages `isDark` state.  
Choice persisted in `localStorage` under key `classplay_theme`.  
On init: reads `localStorage`, falls back to `prefers-color-scheme`.  
Toggle adds/removes `dark` class on `<html>`.

CSS variables defined in `front/src/index.css`:
- `:root` — light palette
- `.dark` — dark palette (bg, text, border, card)

All main pages and components use CSS variables. No hardcoded color values.

Toggle button (sun/moon icon) placed in the main header.

---

## Definition of Done

- [x] Toggle in header works
- [x] Theme persists across page reloads
- [x] All main pages display correctly in dark mode
- [x] No white islands or invisible text in dark mode
