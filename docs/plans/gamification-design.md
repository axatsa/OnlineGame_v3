# Gamification System — Architecture & Implementation

**Date:** 2026-03-04  
**Status:** Implemented

---

## Architecture

Centralized `GamificationService` in `backend/apps/gamification/services.py` handles all XP and coin transactions synchronously during activity completion.

---

## Core Data Model

**`xp_transactions`** — individual XP gain events  
**`coin_transactions`** — individual coin gain/spend events  
**`daily_progress`** — per-user per-day record:
- `user_id`, `date`
- `total_xp_today`, `total_coins_today`
- `activity_history` (JSON) — tracks which activity types were completed and how many times

---

## Reward Calculation

```
Base: 25 XP / 6 coins per activity

Diminishing returns (same activity, same day):
  attempt 1 → 100%
  attempt 2 → 70%
  attempt 3 → 40%
  attempt 4 → 10%
  attempt 5+ → 0%

Variety bonus (unique activity types today):
  +5% XP per type, max +20%

Daily caps: 300 XP / 60 coins
```

---

## Leveling

```
Inverse formula: Level = (Total_XP / 100)^(1/1.5)
Equivalent: XP_for_next_level = 100 × level^1.5
```

Computed on the fly — not stored. Level can only increase.

---

## Shop

Price validation: soft warnings if teacher sets a price outside the recommended range — not a hard block.

Organization timezone: Tashkent (UTC+5). Daily limits reset at 00:00 local time.

---

## Implementation Path

1. DB migrations for new tables (`xp_transactions`, `coin_transactions`, `daily_progress`, `season_stats`, `shop_items`, `purchases`, `student_profiles`)
2. `GamificationService.process_activity_completion()` with diminishing returns and cap enforcement
3. Hook into `POST /api/v1/activity/complete`
4. Cron job for daily limit reset at 00:00
