# Student Project Tracking System

A two-tier web application for tracking student projects, featuring GitHub integration, team management, and mentor evaluations.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│    Supabase     │
│   (Next.js)     │     │   (Express)     │     │  (PostgreSQL)   │
│   Vercel        │     │   Render.com    │     │     Auth        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express 4.21, TypeScript, Zod validation |
| Database | Supabase (PostgreSQL + Auth) |

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Supabase project (get URL and keys from dashboard)

### Backend
```bash
cd backend
cp .env.example .env  # Configure your env vars
npm install
npm run dev           # Runs on port 5001
```

### Frontend
```bash
cd frontend
cp .env.example .env  # Configure your env vars
npm install
npm run dev           # Runs on port 3000
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for complete deployment instructions to Vercel and Render.com.

## Project Structure

```
├── frontend/           # Next.js web application
│   ├── src/app/        # App router pages
│   ├── src/components/ # React components
│   └── src/lib/        # Utilities & API client
├── backend/            # Express REST API
│   ├── src/controllers/# Route controllers
│   ├── src/routes/     # API routes
│   └── supabase/       # Database migrations
└── DEPLOY.md           # Deployment guide
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication (login, register, logout) |
| `/api/users` | User management |
| `/api/projects` | Project CRUD operations |
| `/api/tasks` | Task management |
| `/api/teams` | Team management |
| `/api/github` | GitHub sync & commit tracking |
| `/api/evaluations` | Mentor evaluations |
