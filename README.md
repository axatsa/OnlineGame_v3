# ClassPlay

AI-powered educational gaming platform for teachers. Generate lessons, launch interactive games, and track student progress — all in one place.

**Live:** [classplay.uz](https://classplay.uz)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Math Rendering | KaTeX |
| Charts | Recharts |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 15 + SQLAlchemy 2.x |
| Auth | JWT (python-jose) + bcrypt |
| AI | Gemini (primary, key rotation + model auto-discovery) + OpenAI fallback |
| Email | SMTP (Gmail App Password) |
| Payments | Payme · Click · Manual (Telegram bot approval) |
| Bot | python-telegram-bot v21 (OTP auth + payment flow) |
| Deployment | Docker Compose + Traefik (Let's Encrypt) |

---

## Features

### AI Generators (8 types)

| Generator | Output |
|-----------|--------|
| Math Problems | Arithmetic, equations, word problems |
| Quiz | Multiple-choice with distractors |
| Crossword | Auto-grid from word list |
| Assignment | Written task with rubric |
| Jeopardy | Board game format, multi-answer support |
| Hangman | Word list + 4-step progressive hints |
| SpellingBee | Word list with TTS pronunciation |
| Storybook | AI-illustrated multi-page story |

All generators support:
- Custom materials (PDF/DOCX/TXT upload)
- Language selection (RU/UZ/EN)
- Class context injection
- **LaTeX math formatting** (`\(\frac{2}{3}\)`, `x²`, `\(\sqrt{x}\)`) — rendered via KaTeX

### Games (10 total)

| Game | Description |
|------|-------------|
| Jeopardy | Category board, buzzer, all correct answers shown |
| Crossword | Auto-generated grid, timer |
| Word Search | Find words in letter grid |
| Memory Matrix | Card flip matching |
| Tug of War | Team vs team quiz battle |
| Balance Scales | Math equation balancing |
| Hangman | SVG hangman + 4 progressive hints |
| SpellingBee | TTS pronunciation + 5 voice presets |
| MathPuzzle | Timer, streak multiplier, results screen |
| WordTranslate | Flip-card vocabulary practice |

### Telegram Bot

Zero-friction auth: user opens bot → enters email → receives OTP → picks plan → uploads receipt screenshot → **Gemini Vision auto-verifies** the receipt and activates subscription.

- New users: email not found → asks name → auto-registers account
- OTP: 6-digit code, 10-min expiry, max 3 attempts
- Auto-verification: Gemini Vision checks amount + card number + status; confidence ≥ 85% → auto-approve; lower → queued for admin review

### Book Library
- AI-generated illustrated storybooks
- Page-flip reader with progress bar + percentage button
- Reading position persisted in localStorage
- Export to PDF

### User Materials
- Upload PDF / DOCX / TXT (up to 5 MB)
- AI uses uploaded content for generation
- Limits: Free = 5 files, Pro = 30, School = 100

### Analytics
- Activity chart (14 days), game type distribution, top topics
- Token usage with live data from subscription API
- Streak counter
- Accessible in Profile → Analytics tab (optimised for electronic boards)

### B2B / Organisations
- `org_admin` role — manage teachers, seats, invites
- Organisation dashboard with license usage, teacher table, invite links
- Super admin: promote/demote org_admin, set token limits per org

### Roles

| Role | Access |
|------|--------|
| `teacher` | Dashboard, all generators, games, library, history, profile |
| `org_admin` | All teacher pages + `/org-admin` management panel |
| `super_admin` | Full admin panel at `/admin` |

---

## Running Locally

### Requirements
- Node.js 18+
- Python 3.12+
- PostgreSQL 15+

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL, SECRET_KEY, GEMINI_API_KEYS
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd front
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

App opens at `http://localhost:5173`.

### Telegram Bot (optional)

```bash
cd telegram_bot
pip install -r requirements.txt
# Set TELEGRAM_BOT_TOKEN and BACKEND_URL in .env
python bot.py
```

---

## Project Structure

```
OnlineGame_v3/
├── backend/
│   ├── apps/
│   │   ├── auth/          # JWT login, OTP bot endpoints, password reset
│   │   ├── classes/       # Class groups, students
│   │   ├── generator/     # AI generation endpoints + token quota
│   │   ├── gamification/  # Activity completion, streaks
│   │   ├── library/       # AI storybooks
│   │   ├── payments/      # Payme/Click/manual, subscription tiers, Telegram bot payment
│   │   ├── org_admin/     # Org management API
│   │   └── admin/         # Super admin panel API
│   ├── services/
│   │   ├── gemini_service.py    # Primary AI: key rotation, model auto-discovery, math format
│   │   ├── openai_service.py    # AI generation router (delegates to gemini_service)
│   │   ├── vision_service.py    # Gemini Vision receipt verification
│   │   └── email_service.py     # SMTP + OTP emails
│   └── main.py
│
├── front/
│   └── src/
│       ├── pages/
│       │   ├── auth/           # Login, Register, ForgotPassword
│       │   ├── dashboard/      # TeacherDashboard, Profile (+ Analytics tab), OrgAdminDashboard
│       │   ├── games/          # 10 game components (all with KaTeX rendering)
│       │   ├── tools/          # Generator, Tools, ResultEditor
│       │   └── library/        # GamesLibrary, BookReaderFlip
│       ├── components/
│       │   ├── common/         # RichTextRenderer (KaTeX math), AIGeneratingOverlay
│       │   ├── generator/      # Form + Preview components per game type
│       │   ├── landing/        # 11 landing page section components
│       │   └── Onboarding/     # OnboardingModal
│       └── context/
│           ├── AuthContext.tsx
│           ├── ClassContext.tsx
│           └── ThemeContext.tsx
│
├── telegram_bot/
│   ├── bot.py                  # Main bot + universal text message router
│   ├── handlers/
│   │   ├── auth.py             # OTP flow: email → OTP / name → auto-register
│   │   ├── start.py            # /start → ask for email if not authed
│   │   └── payment.py          # /pay → plan selection → screenshot → auto-verify
│   └── utils/
│       ├── sessions.py         # In-memory session with step state machine
│       └── api.py              # Backend API calls (OTP, register, payment)
│
└── docs/                       # Plans, roadmap, changelog, deployment guides
```

---

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://user:pass@localhost/classplay
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI — Gemini (primary)
GEMINI_API_KEYS=key1,key2,key3     # comma-separated; rotated automatically
GEMINI_VISION_KEY=key_for_vision   # dedicated key for receipt verification

# AI — OpenAI (fallback)
OPENAI_API_KEY=sk-...

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

# Payments
PAYME_MERCHANT_ID=...
PAYME_SECRET_KEY=...
CLICK_SERVICE_ID=...
CLICK_MERCHANT_ID=...
CLICK_SECRET_KEY=...
PAYMENT_CARD_NUMBER=4444 4444 4444 4444
PAYMENT_HOLDER=Your Name
PLAN_PRO_PRICE_TIYIN=19000000      # 190,000 sum
PLAN_SCHOOL_PRICE_TIYIN=62000000   # 620,000 sum

# Telegram bot
TELEGRAM_BOT_TOKEN=...
TELEGRAM_GROUP_ID=...
TELEGRAM_BOT_URL=https://t.me/your_bot

# Limits
DEFAULT_TOKEN_LIMIT=30000
PLAN_FREE_TOKEN_LIMIT=30000
PLAN_PRO_TOKEN_LIMIT=300000
PLAN_SCHOOL_TOKEN_LIMIT=1500000
RATE_LIMIT_PER_HOUR=30
GLOBAL_RPM_LIMIT=70
GEMINI_KEY_COOLDOWN_SECONDS=600
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Subscription Tiers

| Feature | Free | Pro (190 000 сум/мес) | School (620 000 сум/мес) |
|---------|------|----------------------|--------------------------|
| Token limit | 30 000 | 300 000 | 1 500 000 |
| Material uploads | 5 | 30 | 100 |
| Teacher seats | 1 | 1 | Unlimited (org) |
| Org admin panel | — | — | ✓ |

---

## AI — Gemini Key & Model Rotation

The platform uses **all available Gemini models** simultaneously to maximise quota:

- On startup: fetches all `generateContent`-capable models via `/v1beta/models`, cached 3 hours
- **Priority order**: Gemma-3-27b-it (large output) → Gemini 2.5 Flash → Gemini 2.0 Flash → Gemini 1.5 Flash → ...
- On 429 (quota exhausted): tries all models for current key before rotating to next key
- On 503/500: immediate key rotation with cooldown (default 600s)
- All generations include `MATH_FORMAT_INSTRUCTION` → AI outputs proper LaTeX notation

---

## Deployment

See [`docs/DEPLOY_HTTPS.md`](docs/DEPLOY_HTTPS.md) for Traefik + Let's Encrypt setup.

```bash
# Production
docker compose -f docker-compose.prod.yml up -d --build
```

Services: `db` (PostgreSQL 15) · `backend` (FastAPI) · `frontend` (React/Nginx) · `telegram_bot`
