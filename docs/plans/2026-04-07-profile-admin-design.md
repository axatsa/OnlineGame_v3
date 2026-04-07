# Design: Teacher Profile and Admin Panel Improvements

## Goals
1.  **Teacher Profile**: Make it more than just a logout page. Add personal statistics, editable user info, and better layout.
2.  **Admin Panel**: Empower the Super Admin with manual control over accounts, organizations, and limits.

---

## 1. Teacher Profile Enhancements

### UI Components
- **User Summary**: Top section with Avatar, Full Name, Email, and Role.
- **Action Bar**: "Edit Profile" (modal for name), "Change Password" (existing).
- **Statistics Grid**:
    - **Activity**: Total resources generated.
    - **AI Usage**: Tokens used this month / Monthly limit (Visual progress bar).
    - **Class Stats**: Number of active classes and students.
- **Saved Resources**: Keep the existing table but optimize layout for smaller screens.

---

## 2. Cross-Device Access Bridge (Smart Board to Printer)

### The Problem
Teachers generate materials on interactive whiteboards (Smart Boards) but need to print them from a separate PC/Laptop.

### Proposed Solutions
1. **QR Code for Instant Access**:
   - Each generated resource or history item will have a "Share" button that displays a QR code.
   - The teacher scans the code with their phone/tablet to instantly open/download the file and share it (via AirPrint, Telegram, etc.).
2. **"Send to my Email"**:
   - A one-click button in the Result Editor and History to send the PDF/DOCX to the teacher's registered email address.
3. **Persistent History System**:
   - Ensure the teacher knows they can log in on any device to access their "My Materials" (History) and download the file.
- `User` model needs `created_at` to show "Member since".
- Backend needs `GET /users/me/stats` to aggregate data from `SavedResource`, `TokenUsage`, and `Class`.

---

## 3. Super Admin Panel Enhancements

### Manual Management Features
- **Teacher Management**:
    - **Add Teacher**: Modal to manually create a teacher account.
    - **Edit Teacher**: Modal to update Name, Email, and **Token Limits**.
    - **Status Control**: Block/Unblock toggle (using `is_active` field).
    - **Password Management**: Manual password reset by admin.
- **Organization Management**:
    - **Create/Edit Org**: Full CRUD for organizations (Name, Seats, Expiry).
    - **Delete Org**: Remove organization with confirmation.

### UI Improvements
- **Status Badges**: Real indicators for "Blocked" vs "Active".
- **Filtering**: Filter teachers by organization and status.

---

## 3. Technical Changes

### Database Schema updates (`apps/auth/models.py`)
- Add `is_active: bool = True` to `User`.
- Add `created_at: DateTime = func.now()` to `User`.

### Backend API Updates (`apps/admin/router.py`)
- `PATCH /admin/teachers/{user_id}`: Update info and limits.
- `POST /admin/teachers/{user_id}/toggle-status`: Block/Unblock.
- `POST /admin/teachers/{user_id}/reset-password`: Set new password.
- `PUT /admin/organizations/{org_id}`: Update org details.
- `DELETE /admin/organizations/{org_id}`: Delete org.

### Frontend Updates
- New Modals: `TeacherFormModal.tsx`, `OrgFormModal.tsx`.
- Update `AdminPanel.tsx` to handle these new actions.
- Update `Profile.tsx` with stats and edit mode.

---

## Verification Plan

### Automated Tests
- Pytest for new admin endpoints (update, block, limit adjustment).
- Verify `is_active` check in auth middleware.

### Manual Verification
1.  Log in as Super Admin, create a teacher, then block them.
2.  Try logging in as the blocked teacher (should fail).
3.  Adjust token limit for a teacher and verify the change in their profile.
4.  Edit teacher name from Admin and verify it updates.
