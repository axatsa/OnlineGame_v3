# ClassPlay

AI-powered educational platform for teachers. Generate interactive content, run classroom games, and track student progress — all in one place.

**Live:** [classplay.uz](https://classplay.uz) · **Bot:** [@ClassPlayEdu_Purchase_Bot](https://t.me/ClassPlayEdu_Purchase_Bot)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Math rendering | KaTeX (via `RichTextRenderer` component) |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 15 + SQLAlchemy 2.x |
| Auth | JWT (python-jose) + bcrypt |
| AI | Gemini API (primary) — key rotation + model auto-discovery |
| Email | SMTP via Gmail App Password |
| Payments | Payme · Click · Manual (Telegram screenshot + Gemini Vision verify) |
| Bot | python-telegram-bot v21 |
| Deployment | Docker Compose on VPS (`temp@thompson.uz -p 1089`) behind Traefik + Let's Encrypt |

---

## Roles & Access

### `teacher` (default on registration)
- Full access to: Dashboard, Generator, Tools, Games Library, Book Library, History, Profile
- Can upload materials (PDF/DOCX/TXT) to use in generation
- Manages own class groups and students
- Limited by monthly token quota (based on subscription plan)
- Cannot access admin panels

### `org_admin`
- Everything a teacher has, **plus**:
- `/org-admin` dashboard: view all teachers in organisation, manage seats, send invite links
- See licence usage (seats used / total)
- Cannot promote other users or change plan prices

### `super_admin`
- Full `/admin` panel: user management, organisation management, financial reporting, AI monitoring
- Can promote/demote `org_admin`, adjust token limits per user, view all generation logs
- Token quota is **bypassed** (`tokens_limit = -1` = unlimited)
- Cannot be created via registration — must be set directly in DB (`role = 'super_admin'`)

> Role is stored in `users.role` column. Default: `"teacher"`. Possible values: `"teacher"`, `"super_admin"`. `org_admin` is handled via `Organisation.admin_user_id` FK, not the role column.

---

## Subscription Plans

| Feature | Free | Pro | School |
|---------|------|-----|--------|
| Price | — | 190 000 сум/мес | 620 000 сум/мес |
| Monthly token limit | 30 000 | 300 000 | 1 500 000 |
| Material uploads | 5 files | 30 files | 100 files |
| AI storybooks/day | 2 | 10 | 50 |
| Teacher seats (org) | 1 | 1 | Unlimited |
| Org admin panel | — | — | ✓ |

**Token quota logic:**
- Quota resets every 30 days from the `tokens_reset_at` timestamp (not calendar month)
- On plan expiry → token limit is reset back to free tier (30 000) automatically on next API call
- `super_admin` is always exempt from quota checks
- Free users who somehow have a higher limit get it capped to 30 000

**Plan activation conditions:**
- Payme/Click → webhook received, signature verified, amount matches `PLAN_PRICES_TIYIN` → `_activate_subscription()` called
- Telegram manual → user sends receipt screenshot → Gemini Vision verifies amount + card number + status (confidence ≥ 85% → auto-approve; < 85% → queued for admin review in Telegram group)
- Admin can manually activate any plan via the `/admin` panel

**Priority queue for AI generation:** `school` > `pro` > `free` — higher plans bypass queue during high load.

---

## AI Generators

All generators go through `backend/apps/generator/router.py` → `services/openai_service.py` → `services/gemini_service.py`.

Before generation:
1. `check_token_quota()` — raises 429 if user is over limit
2. `priority_guard()` — school/pro users skip queue
3. Generation attempt with up to **3 retries**, 2 s delay between attempts
4. `increment_token_usage()` — logs tokens consumed

All AI output uses `MATH_FORMAT_INSTRUCTION` — Gemini formats math in LaTeX: `\(\frac{2}{3}\)`, `x^{2}`, `\(\sqrt{x}\)`, rendered via KaTeX in the browser.

### Generator page (`/generator`)

| Type | Endpoint | Key inputs | Output |
|------|----------|-----------|--------|
| Math problems | `POST /generate/math` | topic, difficulty, count, language | `[{q, a}]` |
| Quiz | `POST /generate/quiz` | topic, count, language, material | `[{q, a, options[]}]` |
| Assignment | `POST /generate/assignment` | topic, grade, subject, language | `{title, intro, questions[]}` |
| Crossword | `POST /generate/crossword` | topic, word_count, language | `{words[], grid[][], width, height}` |

Features on Generator page:
- **Edit** generated content before export
- **Download DOCX** — `cleanMathForExport()` strips LaTeX to plain text (e.g. `\(\frac{a}{b}\)` → `a/b`)
- **Print** — opens `_blank` popup with formatted layout
- **Save to profile** — stores in `saved_resources` table
- **QR code** — appears immediately after generation; URL `/share/{log_id}` links to `generation_logs` record; students can open it on their device

### Tools page (`/tools`)

| Tool | Endpoint | Output |
|------|----------|--------|
| Jeopardy board | `POST /generate/jeopardy` | `{categories[], questions[][]}` |
| Hangman | `POST /generate/hangman` | `{words[], hints[][4]}` |
| SpellingBee | `POST /generate/spelling` | `{words[], definitions[]}` |
| Math Puzzle | `POST /generate/math-puzzle` | `[{q, a}]` |
| Word Translate | `POST /generate/word-pairs` | `[{word, translation}]` |

Each tool also has **Download DOCX** and **Print** buttons with the same LaTeX cleaning pipeline.

**Material injection:** if a user uploads a file, its text is extracted and appended to the AI prompt as context. Supported: PDF (pypdf), DOCX (python-docx), TXT. Max 5 MB.

**Language support:** RU / UZ / EN — passed to prompts, AI responds in selected language.

---

## Games

All 10 games are at `/games/*`. Launched from the Games Library (`/games/library`). Games use content generated by the Tools/Generator or generate it on-the-fly via the same endpoints.

| Game | Route | How it works |
|------|-------|-------------|
| Jeopardy (Своя игра) | `/games/jeopardy` | 5 categories × 5 questions (100–500 pts). Teacher clicks a cell → question shown → manually awards points to winning team. |
| Tug of War | `/games/tug-of-war` | 2 teams. AI generates 20 questions. Correct answer pulls rope toward your side. First team to pull rope to their edge wins. |
| Memory Matrix | `/games/memory` | Grid of face-down card pairs (term + definition). Flip 2 per turn — match = stays open. Find all pairs. |
| Balance Scales | `/games/scales` | Target number on one scale. Player taps math expression cards to add them to the other side — must reach exact target. |
| Word Search | `/games/word-search` | AI generates word list; hidden in a letter grid. Click-drag to highlight words. |
| Crossword | `/games/crossword` | AI generates clues + auto-layout grid. Click cell or clue, type letters. "Check" highlights correct/wrong. |
| Hangman | `/games/hangman` | Guess word letter by letter. 4 progressive hints. SVG hangman drawing appears on wrong guesses. |
| SpellingBee | `/games/spelling` | Word is read aloud via TTS (5 voice presets). Player types what they heard. |
| Math Puzzle | `/games/math-puzzle` | Timed math questions. Streak multiplier for consecutive correct answers. |
| Word Translate | `/games/word-translate` | Flip-card vocabulary pairs. |

**Live sessions** (`/games/session/*`): Quiz and Assignment content can be launched as a multiplayer session where students join via PIN/link and answer on their own devices in real time. Results tracked in `game_sessions` + `session_answers` tables.

---

## Telegram Bot

Zero-friction auth and payment flow. Entry point: `telegram_bot/bot.py`.

### Auth flow (OTP)
1. User sends `/start` → bot asks for email
2. User enters email → if found: OTP sent to email (6-digit, 10 min expiry, max 3 attempts); if not found: bot asks for name → auto-registers account → OTP sent
3. User enters OTP → JWT token stored in bot session → user is authenticated

### Payment flow
1. Authenticated user sends `/pay` → bot shows plan menu (Pro / School)
2. User selects plan → bot shows price + payment card number
3. User makes bank transfer → sends screenshot
4. Gemini Vision checks: amount correct? card number visible? status "success"?
   - Confidence ≥ 85% → auto-activate subscription
   - Confidence < 85% → forwarded to admin Telegram group for manual review
5. Admin approves/rejects via inline buttons in the group

### Session state machine
States per user (in-memory `sessions.py`):
`IDLE` → `WAITING_EMAIL` → `WAITING_OTP` / `WAITING_NAME` → `AUTHENTICATED` → `WAITING_PAYMENT_PLAN` → `WAITING_SCREENSHOT`

---

## Book Library

Route: `/library/books`

- AI generates illustrated multi-page storybooks via `POST /library/generate`
- Each page: text + image (base64 JPEG from Gemini)
- Daily limit enforced: Free = 2/day, Pro = 10/day, School = 50/day
- Page-flip reader with progress bar
- Reading position stored in `localStorage`
- Export to PDF via html2canvas + jsPDF

---

## Gamification System

For student engagement in live sessions.

**XP (never spent, never reset):**
- Base: 25 XP per activity
- Daily cap: 300 XP (resets 00:00 UTC+5)
- Used for level calculation: `XP_needed(level) = 100 × level^1.5`

**Coins (spendable):**
- Base: 6 coins per activity
- Daily cap: 60 coins
- Spent in the class shop (teacher creates items)

**Anti-abuse — diminishing returns per game per day:**
| Attempt | Reward |
|---------|--------|
| 1st | 100% |
| 2nd | 70% |
| 3rd | 40% |
| 4th | 10% |
| 5th+ | 0% |

**Variety bonus:** +5% XP per unique activity type that day (max +20%).

**Season system:** Schools = quarter seasons. Learning centres = monthly. Rankings reset per season; global XP is permanent.

**Leaderboard:** top 3 + student's own rank + 3 above/below. Class-scoped only.

---

## Sharing & QR Codes

After generating content, a QR code appears in the preview panel pointing to:
```
https://classplay.uz/share/{generation_log_id}
```
This calls `GET /api/v1/generate/public/history/{log_id}` — **no auth required**, returns raw content for display. Students can scan the QR and view the material on their phone. No account needed.

The share page (`/share/:logId`) renders content based on `generator_type`:
- Array → numbered list with options + answers
- `{problems:[]}` → math problems
- `{pages:[]}` → book reader
- Supports Print + Download HTML + Download PDF

---

## AI Infrastructure

### Gemini key rotation (`services/gemini_service.py`)

- Multiple API keys loaded from `GEMINI_API_KEYS` (comma-separated)
- On startup: fetches all available `generateContent`-capable models via `/v1beta/models`, cached 3 hours
- **Model priority:** Gemma-3-27b-it → Gemini 2.5 Flash → Gemini 2.0 Flash → Gemini 1.5 Flash → others
- On 429: tries all models on current key, then rotates to next key
- On 503/500: immediate rotation, key enters cooldown (`GEMINI_KEY_COOLDOWN_SECONDS`, default 600 s)
- `has_available_keys()` check before each call; if no keys available → wait 5 s and retry

### Request pipeline
1. `openai_service._get_completion()` — 3 attempts with 2 s delay
2. Calls `gemini_service.generate_content(prompt, system_instruction, temperature=0.7, use_math_format=True)`
3. `use_math_format=True` appends `MATH_FORMAT_INSTRUCTION` to system prompt → LaTeX output
4. Response parsed via `_parse_json()` — handles markdown code fences, extracts JSON
5. If all attempts fail → returns `(None, 0)` → endpoint raises 503

### Receipt verification (`services/vision_service.py`)
- Separate `GEMINI_VISION_KEY` for image analysis
- Sends payment screenshot to Gemini Vision with structured prompt
- Returns: `{verified: bool, confidence: float, amount: int, reason: str}`

---

## Project Structure

```
OnlineGame_v3/
├── backend/
│   ├── apps/
│   │   ├── auth/           # JWT auth, OTP endpoints, password reset, email verify
│   │   ├── classes/        # Class groups, student roster
│   │   ├── generator/      # All AI generation endpoints + quota checks + generation logs
│   │   ├── gamification/   # XP, coins, leaderboard, shop, seasons
│   │   ├── library/        # AI storybooks + saved resources
│   │   ├── payments/       # Payme/Click webhooks, subscription activation, Telegram payment
│   │   ├── sessions/       # Live game sessions, student answers, real-time scoring
│   │   ├── org_admin/      # Org management API (seats, invites, teacher list)
│   │   └── admin/          # Super admin API (users, orgs, finances, AI monitoring)
│   ├── services/
│   │   ├── gemini_service.py    # Gemini API: key rotation, model discovery, math format
│   │   ├── openai_service.py    # Generation router (delegates to gemini, handles retries)
│   │   ├── vision_service.py    # Gemini Vision for receipt verification
│   │   └── email_service.py     # SMTP OTP + notifications
│   ├── scripts/
│   │   ├── fix_db.py            # Schema migrations (ALTER TABLE IF NOT EXISTS)
│   │   ├── seed.py              # Seed sample data
│   │   ├── seed_users.py        # Seed test users
│   │   └── seed_gamification.py # Seed gamification data
│   └── main.py                  # App entry point, router registration, startup schema sync
│
├── front/src/
│   ├── pages/
│   │   ├── auth/           # Login, Register, ForgotPassword
│   │   ├── dashboard/      # TeacherDashboard, OrgAdminDashboard, Profile + Analytics
│   │   ├── games/          # 10 game components (all with KaTeX math rendering)
│   │   ├── tools/          # Generator, Tools, ResultEditor
│   │   ├── library/        # GamesLibrary, BookReaderFlip
│   │   └── public/         # ShareResource (QR landing), StudentGame, JoinSession
│   ├── components/
│   │   ├── common/         # RichTextRenderer (KaTeX), ResourceQRCode, AIGeneratingOverlay
│   │   ├── generator/      # Form + Preview components per content type
│   │   ├── landing/        # Landing page sections
│   │   └── Onboarding/     # OnboardingModal
│   ├── lib/
│   │   ├── games-config.ts      # GAMES_CONFIG array — all 10 games (id, route, howToPlay)
│   │   ├── generatorExport.ts   # downloadDOCX() + cleanMathForExport() (LaTeX → plain text)
│   │   └── crossword.ts         # Crossword grid layout algorithm
│   └── i18n.ts              # All UI strings in RU / UZ / EN
│
├── telegram_bot/
│   ├── bot.py               # Bot entry point, message router
│   ├── handlers/
│   │   ├── auth.py          # OTP flow + auto-registration
│   │   ├── start.py         # /start command
│   │   └── payment.py       # Plan selection + screenshot receipt flow
│   └── utils/
│       ├── sessions.py      # In-memory state machine per user
│       └── api.py           # Backend API calls
│
├── migrations/
│   └── telegram_payments.sql  # Telegram payment table migration
│
├── docker-compose.prod.yml    # Production: db + backend + frontend + telegram_bot
├── deploy.sh                  # Full deploy script (pull → rebuild → migrate → seed)
└── docs/
    └── DEPLOY_HTTPS.md        # Traefik / Certbot HTTPS setup guide
```

---

## Running Locally

**Requirements:** Node 18+, Python 3.12+, PostgreSQL 15+

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill DATABASE_URL, SECRET_KEY, GEMINI_API_KEYS
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd front
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000/api/v1
npm run dev            # → http://localhost:5173

# Telegram bot (optional)
cd telegram_bot
pip install -r requirements.txt
# set TELEGRAM_BOT_TOKEN + BACKEND_URL in .env
python bot.py
```

---

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://user:pass@localhost/classplay
SECRET_KEY=<openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI — Gemini (primary, comma-separated keys)
GEMINI_API_KEYS=AIza...,AIza...,AIza...
GEMINI_VISION_KEY=AIza...          # dedicated key for receipt verification

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx      # Gmail App Password

# Payments
PAYME_MERCHANT_ID=...
PAYME_SECRET_KEY=...
CLICK_SERVICE_ID=...
CLICK_MERCHANT_ID=...
CLICK_SECRET_KEY=...
PAYMENT_CARD_NUMBER=4444 4444 4444 4444
PAYMENT_HOLDER=Your Name
PLAN_PRO_PRICE_TIYIN=19000000      # 190 000 сум
PLAN_SCHOOL_PRICE_TIYIN=62000000   # 620 000 сум

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_GROUP_ID=...              # admin group for payment review
TELEGRAM_BOT_URL=https://t.me/your_bot

# Quota limits
DEFAULT_TOKEN_LIMIT=30000
PLAN_FREE_TOKEN_LIMIT=30000
PLAN_PRO_TOKEN_LIMIT=300000
PLAN_SCHOOL_TOKEN_LIMIT=1500000
RATE_LIMIT_PER_HOUR=30
GLOBAL_RPM_LIMIT=70
GEMINI_KEY_COOLDOWN_SECONDS=600

# Postgres (used in docker-compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DB=classplay
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Deployment

Production server: `temp@thompson.uz -p 1089`, project at `/home/temp/OnlineGame_v3`.

```bash
# Full deploy (pull + rebuild + migrate + seed)
ssh temp@thompson.uz -p 1089
cd /home/temp/OnlineGame_v3
bash deploy.sh
```

`deploy.sh` steps:
1. `git fetch origin main && git reset --hard origin/main`
2. `docker compose -f docker-compose.prod.yml down --remove-orphans`
3. `docker compose -f docker-compose.prod.yml up -d --build --force-recreate`
4. Wait for PostgreSQL ready
5. `python scripts/fix_db.py` — schema sync (ALTER TABLE IF NOT EXISTS)
6. Apply `migrations/telegram_payments.sql`
7. Run seeds: `seed_users.py`, `seed.py`, `seed_gamification.py`

Docker containers:
- `online_games_db_prod` — PostgreSQL 15
- `online_games_backend_prod` — FastAPI (port 8000 internal)
- `online_games_frontend_prod` — React/Nginx (serves static + proxies /api)
- `online_games_telegram_bot` — Telegram bot

See [`docs/DEPLOY_HTTPS.md`](docs/DEPLOY_HTTPS.md) for Traefik + Let's Encrypt HTTPS setup.

---

## Key API Endpoints

```
POST /api/v1/auth/login              # email + password → JWT
POST /api/v1/auth/register           # create teacher account
POST /api/v1/auth/otp/verify         # Telegram bot OTP verification

GET  /api/v1/generate/history        # user's generation logs (auth required)
POST /api/v1/generate/math           # generate math problems
POST /api/v1/generate/quiz           # generate quiz
POST /api/v1/generate/crossword      # generate crossword
POST /api/v1/generate/assignment     # generate assignment
POST /api/v1/generate/jeopardy       # generate jeopardy board
POST /api/v1/generate/hangman        # generate hangman words + hints
POST /api/v1/generate/spelling       # generate spelling bee words
POST /api/v1/generate/math-puzzle    # generate math puzzle
POST /api/v1/generate/word-pairs     # generate word translation pairs
GET  /api/v1/generate/public/history/{id}  # public share endpoint (no auth)

GET  /api/v1/payments/subscription/me      # current plan + quota info
POST /api/v1/payments/telegram/initiate    # start Telegram payment flow
POST /api/v1/payments/payme/               # Payme webhook
POST /api/v1/payments/click/prepare        # Click webhook

POST /api/v1/sessions/               # create live game session
GET  /api/v1/sessions/{id}           # session state + answers

GET  /api/v1/library/resources/      # saved resources list
POST /api/v1/library/resources/      # save a resource
POST /api/v1/library/generate        # generate AI storybook

GET  /api/v1/admin/users             # super_admin: all users
GET  /api/v1/org-admin/teachers      # org_admin: teachers in org
```
