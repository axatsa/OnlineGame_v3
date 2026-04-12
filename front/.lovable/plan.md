# ClassPlay — UI Design System

## Design Foundation

**Primary color:** Deep Burgundy `#991B1B`  
**Sidebar / headings:** Slate-900 `#0F172A`  
**Backgrounds:** Slate-50 `#F8FAFC` (page), white (card surfaces)  
**Borders:** subtle, soft shadows  
**Typography:** Inter (UI text), Merriweather (large headings, loaded via Google Fonts)  
**Target device:** Smartboard — large touch targets, big buttons, readable at distance  
**Animations:** Framer Motion for page transitions, hover states, loading spinners

---

## Screen: Login

Split layout:
- **Left half:** Deep Burgundy background with geometric pattern, large white "ClassPlay" logo centered
- **Right half:** white form — email/password fields, Burgundy "Sign In" button, "Log in as Super Admin" link

Role routing: regular login → Teacher Dashboard, admin link → Super Admin Panel.

---

## Screen: Super Admin Panel

Dark sidebar layout (Slate-900):
- Navigation: Overview, Students, Teachers, Settings — icons + labels
- Collapsible on mobile

Main content: teacher/student management tables with zebra-striped rows, status badges (Active / Blocked), edit/delete actions.

"Add Teacher" / "Add Organization" buttons in Burgundy, top-right corner.

---

## Screen: Teacher Dashboard

Sticky white header: logo left, navigation pills (Generators / Tools / Games) center, profile avatar right.

Hero section: serif heading "Welcome back, [Name]".

3-column Bento grid (large touch-friendly cards):
- AI Generators — create math problems, quizzes, crosswords, assignments, Jeopardy
- Classroom Tools — roulette, timer, other utilities
- Games Library — interactive Smartboard games

"My Class" widget: active class name and grade, quick stats.

Activity chart (Recharts) below the grid.

---

## Screen: Generator Interface

Split screen:
- **Left:** settings panel with pill-shaped segmented controls (grade, subject, difficulty, language). Batch toggle + count selector.
- **Right:** A4 paper preview on gray background showing sample output.

Floating toolbar pill: Print / Download / Edit icons.

"Generate" button with animated loading spinner during API call.

---

## Screen: Games Library

Grid of game cards — cover image, title, "PLAY" button.  
Framer Motion scale-up on card hover.  
Available games: Tug of War, Jeopardy, Memory Matrix, Balance Scales, Word Search, Crossword.

---

## Navigation

React Router with role-based routing (`teacher`, `super_admin`).  
Protected routes via `ProtectedRoute` HOC.  
Framer Motion page transitions between all screens.
