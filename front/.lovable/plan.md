

# ClassPlay — SaaS Platform for Teachers & Admins

## Design Foundation
- **Color System**: Deep Burgundy (#991B1B) primary, Slate-900 (#0F172A) sidebar/headings, Slate-50 (#F8FAFC) backgrounds, white surfaces with subtle borders and soft shadows
- **Typography**: Inter for UI text, serif font (Merriweather via Google Fonts) for large headings
- **Touch-Friendly UI**: Large buttons, cards, and interactive elements optimized for Smartboard use
- **Animations**: Framer Motion for page transitions, hover states, and loading spinners
- **Thompson School logo** embedded as the app's branding asset

## Screen 1: Login Screen (Split Layout)
- Left half: Deep Burgundy background with geometric pattern overlay, large white "ClassPlay" logo centered
- Right half: Clean white form with Email/Password inputs, large Burgundy "Sign In" button, and "Log in as Super Admin" link
- Role-based routing: regular login → Teacher Dashboard, admin link → Super Admin Panel

## Screen 2: Super Admin Panel (Dark Sidebar Layout)
- **Dark Sidebar** (Slate-900): Navigation links for Overview, Students, Teachers, Settings with icons, collapsible on mobile
- **Student Management Table**: Zebra-striped rows, columns for Name, Grade, Email, Status (green/red badges), Actions (edit/delete icons)
- **"Add Student" button** (Burgundy) in top-right corner
- Clean header with admin profile info

## Screen 3: Teacher Dashboard (Bento Grid Layout)
- **Sticky white header**: Logo on left, navigation pills (Generators, Tools, Games) in center, profile avatar on right
- **Hero section**: "Welcome back, [Teacher Name]" with serif heading
- **3-column Bento Grid** with large, touch-friendly cards:
  - "AI Generators" (Sparkles icon) — Create math & crosswords
  - "Classroom Tools" (Dices icon) — Roulette & Timer
  - "Games Library" (Gamepad icon) — Interactive Smartboard games
- **"My Class" widget**: Shows AI context info (e.g., "Grade 3B, Loves Space")

## Screen 4: Generator Interface (Split Screen)
- **Left settings panel**: Segmented pill-shaped controls (not dropdowns) for Grade (1–5), Subject, and Difficulty selection
- **Right preview area**: Realistic A4 paper preview on gray background showing sample generated math problems
- **Floating toolbar pill**: Print, Download, Edit action icons
- "Generate" button with animated loading spinner state

## Screen 5: Games Library (EduGames Style)
- Grid of colorful game cards with cover image placeholders, title, star ratings, and large "PLAY" button
- Framer Motion hover effect: subtle scale-up on card hover
- Responsive grid layout

## Navigation & State Management
- All views managed via React Router with role-based state (no backend — mock data throughout)
- Smooth Framer Motion page transitions between all screens
- Sidebar collapsible on mobile for Admin view

