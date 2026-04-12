# Gamification System — ClassPlay

## Overview

Student progress and economy system built into ClassPlay. Designed to increase engagement through XP, coins, leveling, and a shop — with built-in anti-abuse mechanics.

Implemented in: `backend/apps/gamification/`

---

## Roles

| Role | Capabilities |
|------|-------------|
| Student | Earn XP/coins, level up, buy items, join leaderboards |
| Teacher | View student stats, create shop items (within allowed ranges), toggle seasonal rankings |
| Organization | Manage classes, set season format (quarter/month), add students within license seats |
| Platform Admin | Manage global formulas, control anti-abuse system, adjust limits |

---

## XP (Experience Points)

- Never spent, never reset
- Used to calculate level
- Base reward: **25 XP per activity**
- Daily cap: **300 XP** (resets at 00:00 by organization timezone, default UTC+5 Tashkent)

## Coins (Currency)

- Earned through activities, spent in shop
- Full transaction history stored
- Base reward: **6 coins per activity**
- Daily cap: **60 coins**
- Cannot go negative

---

## Anti-Abuse System

### Diminishing Returns (per game per day)

| Attempt | Reward |
|---------|--------|
| 1st | 100% |
| 2nd | 70% |
| 3rd | 40% |
| 4th | 10% |
| 5th+ | 0% |

Resets daily.

### Variety Bonus

- +5% XP for each unique activity type played that day
- Max bonus: +20% per day

---

## Leveling Formula

```
XP_needed(level) = 100 × level^1.5
```

- Level increases automatically when XP threshold is reached
- Levels never decrease

---

## Season System

**Global progress** (never resets): total level, total XP, achievements.

**Seasonal progress** (resets per season):
- Schools: quarter-based seasons
- Learning centers: monthly seasons
- Season includes: XP ranking, separate leaderboard, seasonal rewards
- After season ends: ranking resets, global XP is preserved

---

## Leaderboard

- Displays top 3 + current student's position + 3 above and 3 below
- Rankings are class-scoped only — no cross-school global rankings

---

## Shop

### Item types
- Digital (avatars, frames)
- Privileges (within allowed scope)
- Real rewards

### Rules
- Prices set by teacher, platform enforces recommended ranges
- Privileges cannot: cancel tests, grant infinite XP, break academic integrity
- Purchases are irreversible — coins deducted, entry created in `purchases` table

---

## Database Tables

`student_profiles`, `xp_transactions`, `coin_transactions`, `daily_progress`, `season_stats`, `shop_items`, `purchases`

All XP/coin grants go through the transaction model — no direct field updates.

---

## Service Layer

`backend/apps/gamification/services.py` — `GamificationService`

Key methods:
- `process_activity_completion(user_id, activity_type, activity_id)` — calculates rewards with diminishing returns and variety bonus, enforces daily caps, records transactions
- Daily limit reset via cron at 00:00

---

## Non-Goals (out of scope for current version)

- Prestige system
- Cross-school tournaments
- PvP between organizations
- Random rewards / lootboxes
