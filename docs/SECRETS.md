# Secrets Management — ClassPlay

## What NOT to commit

- `.env` — local dev secrets
- `.env.prod` — production secrets
- Any file containing API keys, passwords, tokens, or certificates

`.gitignore` must include:
```
.env
.env.prod
.env.local
*.pem
*.key
```

---

## Environment Variables

### Required (backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/classplay` |
| `SECRET_KEY` | JWT signing key — generate with `openssl rand -hex 32` | `a3f8...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |

### Optional (backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_PER_HOUR` | AI endpoint requests per hour per user | `60` |
| `DEFAULT_TOKEN_LIMIT` | Monthly token quota per user | `100000` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime | `10080` (7 days) |
| `SENTRY_DSN` | Sentry error tracking DSN | _(empty = disabled)_ |

### Payment Credentials (Required for Production)

> [!IMPORTANT]
> Use UNIQUE credentials for this project. Do NOT reuse IDs from other projects (like "Testora") to avoid webhook conflicts.

| Variable | Provider | Description |
|----------|----------|-------------|
| `PAYME_MERCHANT_ID` | Payme | ID of the merchant |
| `PAYME_SECRET_KEY` | Payme | Merchant key (password) |
| `CLICK_SERVICE_ID` | Click | ID of the service |
| `CLICK_MERCHANT_ID` | Click | ID of the merchant cabinet |
| `CLICK_SECRET_KEY` | Click | Secret key for signatures |
| `PAYMENT_SIMULATE` | Internal | Set `true` to skip real payments |


### Required (frontend)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend |

---

## Generate SECRET_KEY

```bash
openssl rand -hex 32
```

Copy the output into `.env` as `SECRET_KEY=<value>`.

---

## Production Setup

**Option A — env file on server** (simplest)

```bash
# On the server (NOT in the repo):
nano /home/user/classplay/.env.prod

# Run compose with it:
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**Option B — Doppler** (recommended for teams)

```bash
doppler setup
doppler run -- docker compose -f docker-compose.prod.yml up -d
```

**Option C — Railway / Render Dashboard**

Add variables directly in the platform UI. They never touch git.

---

## Key Rotation

When a key is compromised:

1. **SECRET_KEY**: Generate new value → update on server → restart backend. All existing JWTs become invalid — users will need to re-login.
2. **OPENAI_API_KEY / GEMINI_API_KEY**: Revoke in the provider console, generate a new one, update `.env.prod`, restart backend.
