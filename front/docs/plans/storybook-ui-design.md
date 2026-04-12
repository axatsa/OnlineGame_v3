# Storybook UI Design

**Date:** 2026-04-01  
**Status:** Empty — not implemented

This plan was created as a placeholder for a Storybook-based component catalog.  
No implementation was started. Component documentation is currently done inline via code comments and the design system described in `front/.lovable/plan.md`.

If Storybook is added in the future:
- Install: `npx storybook@latest init`
- Each Shadcn/ui wrapper component in `front/src/components/ui/` should have a `.stories.tsx` file
- Game components (`TugOfWar`, `Jeopardy`, etc.) are the most complex and would benefit most from isolated story testing
