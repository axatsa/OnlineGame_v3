# Task 10: Demo Mode & Landing Page

**Priority:** Medium (Sprint 2)  
**Status:** Done

---

## What was built

### Demo Mode

`/demo` route accessible without authentication.  
IP-based rate limit: 5 requests per day.  
When the limit is reached, a prompt encourages the user to register.  
"Try it" button on the landing page routes to `/demo`.

File: `front/src/pages/DemoGenerator.tsx`

### Landing Page

**Teacher testimonials:** 4 cards with `whileInView` Framer Motion animation.

**FAQ:** Accordion using `AnimatePresence`.

**SEO / Open Graph:** Updated `front/index.html` with `og:title`, `og:description`, `og:image`, and Twitter card meta tags.

Files: `front/src/pages/Landing.tsx`, `front/index.html`

---

## Definition of Done

- [x] `/demo` accessible without login
- [x] 5-request-per-day IP limit enforced
- [x] "Try it" CTA on landing leads to `/demo`
- [x] Registration prompt shown when demo limit is reached
- [x] Testimonials section on landing (at least 4 cards)
- [x] FAQ accordion on landing
- [x] Open Graph meta tags in `index.html`
