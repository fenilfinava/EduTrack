# 🎓 Student Project Tracking System

A **full-stack web platform** that helps colleges and hackathons **track student projects, GitHub contributions, and mentor evaluations** in one centralized system.

🚀 *Selected for Hackathon – Next Round*

---

## ❓ Problem

Student projects today suffer from:
- No centralized progress tracking  
- Unclear individual contributions in team projects  
- Manual and subjective mentor evaluations  
- GitHub activity not connected to academic assessment  

---

## 💡 Solution

The **Student Project Tracking System** provides:
- A **single dashboard** for students and mentors  
- **GitHub integration** to track real contributions  
- **Team & task management** for structured execution  
- **Mentor evaluation module** with transparent feedback  

This creates **accountability, fairness, and better project outcomes**.

---

## ✨ What Makes It Impactful

- 🔗 **GitHub-based contribution tracking**
- 📊 **Real-time project progress visibility**
- 👥 **Team collaboration with role assignment**
- 🧑‍🏫 **Structured mentor evaluations**
- 🔐 **Secure authentication using Supabase**

---

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│    Supabase     │
│   (Next.js)     │     │   (Express)     │     │  (PostgreSQL)   │
│   Vercel        │     │   Render.com    │     │     Auth        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🛠 Tech Stack

### Frontend
- Next.js 16  
- React 19  
- TypeScript  
- Tailwind CSS 4  

### Backend
- Node.js  
- Express 4.21  
- TypeScript  
- Zod (schema validation)  

### Database & Authentication
- Supabase  
  - PostgreSQL  
  - Role-based authentication  

### Deployment
- Frontend: Vercel  
- Backend: Render.com  

---

## 📂 Project Structure

```

Student-Project-Tracking-System/
│
├── frontend/
│ ├── src/app/ # Next.js app router
│ ├── src/components/ # Reusable UI components
│ ├── src/lib/ # API client & utilities
│ └── src/styles/ # Styling and themes
│
├── backend/
│ ├── src/controllers/ # Business logic
│ ├── src/routes/ # REST API routes
│ ├── src/middlewares/ # Authentication & validation
│ └── supabase/ # Database migrations
│
├── DEPLOY.md # Deployment guide
├── README.md # Project documentation
└── .env.example # Environment variables
```


---

## 🔗 API Endpoints

| Endpoint | Description |
|--------|------------|
| `/api/auth` | Authentication (login, register, logout) |
| `/api/users` | User and role management |
| `/api/projects` | Project CRUD operations |
| `/api/tasks` | Task creation and tracking |
| `/api/teams` | Team creation and member roles |
| `/api/github` | GitHub repository sync & commit tracking |
| `/api/evaluations` | Mentor evaluations and feedback |

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+  
- Supabase project (URL and keys)

---

### 🔹 Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev

