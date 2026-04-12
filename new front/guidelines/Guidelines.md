# ClassPlay — UI Guidelines (new front)

This is a prototype/alternative frontend built with a no-code UI tool (Figma Make).

---

## Layout

- Use flexbox and grid by default. Avoid absolute positioning unless there is no other option.
- All layouts must be responsive. Target breakpoints: mobile 375px, tablet 768px, desktop 1280px.
- Smartboard is the primary target — design for 1920×1080 touch screens with large interactive elements.

---

## Design Tokens

**Colors:**
- Primary: `#991B1B` (Deep Burgundy)
- Sidebar background: `#0F172A` (Slate-900)
- Page background: `#F8FAFC` (Slate-50)
- Card surface: `#FFFFFF`
- Border: `#E2E8F0`

**Typography:**
- UI text: Inter, 14px base
- Large headings: Merriweather (serif), loaded via Google Fonts
- Date format: `Apr 9` (abbreviated month + day, no year unless cross-year)

---

## Components

**Buttons:**
- Primary: filled Burgundy, used for the single main action per section
- Secondary: outlined Burgundy, transparent background, for supporting actions
- Tertiary: text-only, Burgundy color, for low-emphasis actions
- Never show more than one primary button per section

**Dropdowns vs Segmented Controls:**
- Use segmented pill controls (not dropdowns) when there are 3–6 fixed options (e.g., grade level, difficulty)
- Use a dropdown only when there are 7+ options or options are dynamic

**Chips / Tags:**
- Always show chips in sets of 3 or more
- Never use a chip group with fewer than 3 items — use a toggle or radio group instead

**Bottom Toolbar (mobile):**
- Maximum 4 items
- Never combine a floating action button with the bottom toolbar

---

## Code Style

- Keep files small. Extract helper functions and sub-components into their own files.
- Refactor as you go — do not let components grow beyond ~200 lines without splitting.
- All component files: PascalCase. All utility files: camelCase.
