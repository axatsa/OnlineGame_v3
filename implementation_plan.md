# Implementation Plan — Automated Blank System & Safina Workflow

This plan implements a system for managing and filling "blanks" (service notes and refund applications). It automates template selection based on project/user permissions and moves the workflow from direct file downloads to a centralized review process by Safina.

## User Review Required

> [!IMPORTANT]
> - **Employee Access**: Employees will no longer be able to download `.docx` files directly from the bot. They will only be able to "Send to Safina".
> - **Database Schema**: New `templates` fields (JSON) will be added to [projects](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/crud.py#35-37) and `team_members` tables.
> - **Bot logic**:
  - If 1 project -> skip project selection.
  - If 1 template -> skip template selection.
  - templates = project.templates + personal.templates.
> - **Simplified Statuses**: Blanks will use a simplified status flow: [request](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/crud.py#17-33) → `review` → `confirmed`/`declined`.

## Proposed Changes

### Database & Backend Components

#### [MODIFY] [models.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/models.py)
- Add `templates: JSON` to [Project](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/lib/types.ts#1-13) and [TeamMember](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/models.py#31-48) models.
- Ensure [ExpenseRequest](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/models.py#49-81) supports `request_type` values like `"blank"` and `"blank_refund"`.

#### [NEW] [Alembic Migration](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/alembic/versions/add_templates_fields.py)
- Add `templates` columns to [projects](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/crud.py#35-37) and `team_members` with `server_default="[]"`.

#### [MODIFY] [schemas.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/schemas.py)
- Update [ProjectBase](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/schemas.py#33-36) and [TeamMemberBase](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/schemas.py#58-66) to include `templates`.
- Add `ProjectTemplatesUpdate` and `TeamMemberTemplatesUpdate` schemas with validation against available keys (`land`, `drujba`, `management`, `school`).

#### [MODIFY] [projects.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/api/projects.py) & [team.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/api/team.py)
- Add `PATCH` endpoints to update templates for projects and individual members.

#### [MODIFY] [expenses.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/api/expenses.py)
- Add `GET /{expense_id}/export-blank-docx` endpoint.
- Implement role check: Only [admin](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/notifications.py#246-256), [senior_financier](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/notifications.py#273-276), or [ceo](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/notifications.py#278-282) can export.

---

### Telegram Bot Flow

#### [MODIFY] [keyboards.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/keyboards.py)
- Add "📋 Заполнить бланк" to the main menu for non-CEO users.
- Implement `get_template_select_kb` and [get_fill_method_kb](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/keyboards.py#47-54).

#### [NEW] [blank_wizard.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/handlers/blank_wizard.py)
- **Logic**:
  - Load `user.projects` and `user.templates` (personal).
  - Branch by project count (0, 1, 2+).
  - Branch by template count (project.templates + personal.templates).
  - Keyboard: `get_project_select_kb`, `get_template_select_kb`.
- **Wizard**: Purpose entry, item-by-item cost entry.
- **Final Action**: Replace "Download" with "Send to Safina". 
- **DB Integration**: Save to [ExpenseRequest](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/models.py#49-81) table with `request_type="blank"`.
- **Notification**: Trigger `send_admin_blank_notification` to Safina.

#### [MODIFY] [notifications.py](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/services/bot/notifications.py)
- Add `send_admin_blank_notification` for Safina with specific blank details and a download inline button.

---

### Web Application (Frontend)

#### [MODIFY] [types.ts](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/lib/types.ts)
- Add `templates` to [Project](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/lib/types.ts#1-13) and [TeamMember](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/db/models.py#31-48) interfaces.

#### [MODIFY] [rbac.ts](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/lib/rbac.ts)
- Add `canDownload` helper.

#### [MODIFY] [Applications.tsx](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/pages/Applications.tsx)
- Update Kanban to show [blank](file:///d:/Projects/Safina%20bot/expense-tracker-pro/backend/app/api/blanks.py#52-129) / `blank_refund` types with icons.
- Implement simplified status filtering for blanks.

#### [MODIFY] [Projects.tsx](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/pages/Projects.tsx)
- Add multi-select for `templates` in project creation/edit form.
- Use `AVAILABLE_TEMPLATES` constant for keys.

#### [MODIFY] [Team.tsx](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/pages/Team.tsx)
- Add "Personal Templates" section in member details.
- Show project-inherited templates as disabled/grayed-out.
- Implement toggle with `store.updateMemberTemplates`.

#### [MODIFY] [ExpenseDetail.tsx](file:///d:/Projects/Safina%20bot/expense-tracker-pro/frontend/src/pages/ExpenseDetail.tsx)
- Wrap Word/Excel download buttons in `canDownload` check.
- Show specialized layout for blanks (list of items, purpose).

---

## Verification Plan

### Automated Verification
- **DB Migration**: Run `alembic upgrade head` and verify table structure via `psql` or `sqlite3`.
- **API Tests**: Use `curl` or Postman to test the new `PATCH` and `export` endpoints.

### Manual Verification
1. **Bot Flow**:
   - Open bot as a regular user.
   - Click "📋 Заполнить бланк".
   - Verify auto-selection works (if 1 template assigned to project).
   - Complete filling and click "Send to Safina".
   - Check that Safina receives a notification with a download link.
2. **Web Admin**:
   - Login as Safina.
   - See the new blank request in the Kanban.
   - Click it to view details.
   - Verify the download button works for Safina but NOT for a regular user (if they have link).
3. **Template Management**:
   - Go to Projects/Team pages.
   - Assign templates and verify they appear correctly in the bot.
