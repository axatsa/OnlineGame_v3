# Project Analysis Report: OnlineGame_v3

## Overview
**Project Name**: OnlineGame_v3 (likely "ClassPlay" based on API welcome message)
**Architecture**: Monorepo with separated Frontend and Backend.
**Infrastructure**: Docker Compose for containerization (PostgreSQL database).

## Tech Stack

### Frontend
- **Path**: `/front`
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State/Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM (v6)
- **Forms**: React Hook Form + Zod
- **Key Features**:
    - PDF Generation (`jspdf`, `html2canvas`)
    - Charts (`recharts`)
    - Animations (`framer-motion`)
    - **Pages**: AdminPanel, TeacherDashboard, ClassManager, Generator, GamesLibrary, Login, Profile.

### Backend
- **Path**: `/backend`
- **Framework**: FastAPI
- **Language**: Python
- **Database**: PostgreSQL (via SQLAlchemy)
- **Authentication**: JWT (`python-jose`, `passlib`)
- **AI Integration**: OpenAI SDK (`openai` package detected)
- **Key Models**:
    - `User` (Roles: teacher, super_admin)
    - `Organization` & `Payment` (SaaS/Licensing structure)
    - `ClassGroup` (Student management)
    - `TokenUsage` (AI usage tracking)
    - `SavedResource` (Content management)

## Database Schema
The database supports a multi-tenant or organization-based structure:
- **Users** belong to the system, with roles.
- **Organizations** have license seats and expiration dates.
- **ClassGroups** organize students.
- **AuditLogs** track system actions.

## Infrastructure
- **Docker**: `docker-compose.yml` defines the PostgreSQL service.
- **Environment**: `.env` file management used for secrets (DB creds, API keys).

## Observations
- The project appears to be an educational platform for teachers to generate and manage games/resources for classes.
- It includes administrative capabilities (`AdminPanel`, `AuditLog`).
- The "Generator" likely uses AI to create educational content (`TokenUsage` tracks this).
