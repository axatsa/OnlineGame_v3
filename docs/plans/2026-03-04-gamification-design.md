# Gamification System Design (ClassPlay)
**Date**: 2026-03-04
**Status**: Approved

## Overview
A geymified progress and economy system for students, integrated into the `OnlineGame_v3` backend.

## Architecture: Integrated Service Layer
The system uses a centralized `GamificationService` to handle all XP and Coin transactions synchronously during activity completion.

## Core Components

### 1. Data Schema
- **`xp_transactions`**: Logs individual XP gains.
- **`coin_transactions`**: Logs individual Coin gains/spends.
- **`daily_progress`**: Tracks daily limits and variety metrics.
  - `user_id`, `date`, `total_xp`, `total_coins`, `activity_history` (JSON).

### 2. Reward Logic
- **Base Rewards**: 25 XP / 6 Coins per activity.
- **Diminishing Returns**: 
  - 1st attempt: 100%
  - 2nd: 70% | 3rd: 40% | 4th: 10% | 5+: 0%
- **Variety Bonus**: +5% XP per unique activity type today (Max +20%).
- **Daily Caps**: 300 XP / 60 Coins.

### 3. Leveling
- **Formula**: `Level = (Total_XP / 100)^(1/1.5)`
- Levels are persistent and never decrease.

### 4. Shop & Economy
- **Soft Validation**: Teachers get warnings if prices deviate significantly from recommended ranges, but can proceed.
- **Organization Timezone**: Reset daily at 00:00 (Tashkent Asia/UTC+5).

## Implementation Path
1. Define database migrations for new tables.
2. Create `GamificationService` with core calculation methods.
3. Integrate with activity completion endpoints.
4. Implement cron job for daily limit resets.
