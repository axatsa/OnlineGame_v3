# Design Document: Admin Panel Upgrade v3 (2026-04-15)

## 1. Introduction
The current admin panel in the OnlineGame_v3 project is largely non-functional for core management tasks. Key issues include hardcoded data on the frontend, broken account blocking, non-existent or unreliable account deletion, and lack of real-time subscription data visualization.

This plan aims to transform the admin panel into a robust management tool.

## 2. Current State Analysis
- **Frontend (`AdminPanel.tsx`):** Status ("Active") and Plan ("Pro") are hardcoded for all users.
- **Backend API (`router.py`):** The `get_teachers` endpoint returns basic user info but lacks detailed subscription and active status fields needed by the UI.
- **Functionality:** 
    - Blocking toggles `is_active` in DB but isn't reflected in UI.
    - Password reset doesn't provide clear feedback or confirmation.
    - Delete functionality needs verification for data integrity (cascade deletes or soft deletes).

## 3. Proposed Changes

### 3.1 Data Synchronization (Real Data vs Hardcoded)
- **Backend:** 
    - Update `UserResponse` schema to include `is_active`, `plan`, and `subscription_expires_at`.
    - Modify `get_teachers` to join with `UserSubscription` and return actual status and plan.
- **Frontend:** 
    - Replace hardcoded mapping in `AdminPanel.tsx` with dynamic data from the updated API.

### 3.2 Core Feature Fixes
- **Blocking:** Ensure `toggle-status` is correctly handled. Add a check in `get_current_user` dependency to reject blocked users immediately.
- **Deletion:** Implement a "Safe Delete" for users and organizations:
    - Clean up `TokenUsage`, `GeneratedBook`, `SavedResource`.
    - Consider data retention policies.
- **Password Reset:** Improve the reset flow to show the temporary password clearly and log the event.

### 3.3 New Features
- **Bulk Actions:** Implement multi-selection in the teachers' table for batch blocking/deletion.
- **Subscription Overview:** Show subscription details (Free, Pro, School) and days remaining in the main list.
- **Enhanced Filters:** Add filters for `Status` (Active/Blocked) and `Plan` (Pro/School/Free).

### 3.4 Integration of Specialized AI Agents
- **`dev-backend-api`**: Primary for logic implementation and schema updates.
- **`agentic-payments`**: Ensures subscription data is correctly synced after Payme/Click webhooks.
- **`security-architect`**: Audits the deletion process and access controls for blocked accounts.

## 4. Success Criteria
- [ ] Admin panel shows real status and plans of all users.
- [ ] Account blocking prevents the user from accessing the system instantly.
- [ ] Deleting an account removes its data and is reflected in the UI.
- [ ] Bulk actions work correctly for groups of users.
- [ ] Client-side payments are verified to update the admin view correctly.

## 5. Implementation Roadmap
1. **Phase 1:** Backend Schema & API Updates (Real Data Mapping).
2. **Phase 2:** Frontend Sync (Remove Hardcode).
3. **Phase 3:** Feature Implementation (Block/Delete/Password Reset).
4. **Phase 4:** Bulk Actions & UI Polishing.
5. **Phase 5:** Final Verification & Testing.
