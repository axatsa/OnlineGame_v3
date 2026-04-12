# Task 01: Security & Reliability

**Priority:** Critical (Sprint 1)  
**Status:** Mostly done — HTTPS in production not confirmed

---

## Subtasks

### 1.1 Rate Limiting on AI endpoints
**Status: Done**

`slowapi` installed. Limit: 30 requests/hour per user on all `/generate/*` endpoints.  
Returns HTTP 429 with message: `"Too many requests. Try again in X minutes."`

Files: `backend/rate_limiter.py`, `backend/apps/generator/router.py`

---

### 1.2 Token Quotas in Database
**Status: Done**

`token_usage` table stores per-user monthly token consumption.  
`check_token_quota(user_id)` is called before every AI request.  
`tokens_used` is updated after each OpenAI/Gemini response using `usage.total_tokens`.  
Quota resets monthly (checked on login if >30 days have passed, or via cron).

Returns HTTP 402 when quota is exhausted.

---

### 1.3 HTTPS in Production
**Status: Pending — must be applied to server**

Setup instructions: `docs/DEPLOY_HTTPS.md`  
`docker-compose.prod.yml` uses Traefik for automatic Let's Encrypt certificates.  
Action required: verify `TRAEFIK_EMAIL` is set and ports 80/443 are open.

Verification: `curl -I https://classplay.uz` should return HTTP/2 200.

---

### 1.4 Secrets Management
**Status: Done**

Secrets are in `.env` / `.env.prod` (not in repo). `.env.example` is committed as a template.  
`docker-compose.prod.yml` uses `env_file` instead of inline values.

See `docs/SECRETS.md` for full reference.

---

### 1.5 Automated PostgreSQL Backups
**Status: Done**

`backup/` directory contains `backup.sh`.  
Script: `pg_dump` → timestamped `.sql` file → deletes files older than 7 days.  
Cron entry: `0 3 * * * /path/to/backup.sh`

---

## Definition of Done

- [x] Rate limit 429 returns when threshold exceeded
- [x] Token quotas stored in DB, 402 returned on exhaustion
- [ ] Production site accessible over HTTPS — needs manual verification on server
- [x] Secrets not in `docker-compose.prod.yml` or git history
- [x] DB backup runs on schedule
