# Taskflow

A modern, full-stack task management application built with **Go**, **React**, **TypeScript**, and **PostgreSQL**. Taskflow helps you organize, track, and manage your tasks efficiently with a beautiful, responsive interface.

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Running Locally](#running-locally)
4. [Running Migrations](#running-migrations)
5. [Test Credentials](#test-credentials)
6. [API Reference](#api-reference)
7. [What You'd Do With More Time](#what-youd-do-with-more-time)

---

## Overview

**What This Is**: Taskflow is a full-stack task management application that enables users to create projects, organize tasks, and collaborate on work. It features user authentication, project management, and task tracking with multiple statuses and priorities.

**What It Does**:
- User registration and JWT-based authentication
- Create and manage multiple projects
- Add, edit, and delete tasks within projects
- Track task status (todo, in_progress, done) and priority levels
- Real-time task list updates
- Responsive UI with protected routes

**Tech Stack**:

### Frontend
- **React 19** with TypeScript for type-safe UI
- **Vite** for fast development and optimized builds
- **React Router** for client-side navigation with protected routes
- **Zustand** for lightweight state management (auth tokens, user data)
- **Tailwind CSS** with **shadcn/ui** for beautiful, accessible components
- **Axios** for HTTP requests with interceptors
- **Lucide React** for icons

### Backend
- **Go 1.26.2** with **Chi Router** for HTTP routing
- **PostgreSQL 16** for persistent relational data storage
- **JWT (golang-jwt)** for secure token-based authentication
- **golang-migrate** for database schema versioning
- **sqlx** for database query execution
- **crypto/bcrypt** for password hashing
- Layered architecture: handlers → middleware → database

### DevOps
- **Docker** & **Docker Compose** for containerized deployment
- Multi-stage builds for optimized production images
- Nginx for frontend serving with SPA routing

---

## Architecture Decisions

### Backend Structure (Go)

**Chosen Approach**: Monolithic layered architecture with separation of concerns


**Why This Structure**:
- **Simplicity**: Monolithic keeps deployment simple, no service orchestration complexity
- **Rapid Development**: Single codebase means faster feature iteration
- **Easy Debugging**: Clear request flow: Router → Handler → Database
- **Clear Responsibility**: Each package has one job

**Tradeoffs Made**:
- **No microservices**: Easier to start with one service; scaling comes later if needed
- **No GraphQL**: REST API is simpler and faster to implement
- **Single database**: No eventual consistency issues to handle initially

**Intentionally Left Out**:
- ❌ WebSocket support for real-time collaboration (use polling instead)
- ❌ Audit logs/history tracking (could be added with `updated_at` timestamps)
- ❌ Multi-tenancy (single tenant per deployment)
- ❌ File uploads for tasks (description text only)
- ❌ Role-based access control (only owner/assignee checks)
- ❌ Soft deletes (hard delete only)

### Frontend Structure (React)

**Chosen Approach**: Component-based architecture with Zustand for centralized auth state



**Why This Design**:
- **Separation of Concerns**: Pages focus on layout, components are reusable
- **State Management**: Zustand is lightweight (no Redux boilerplate)
- **Type Safety**: Full TypeScript prevents runtime errors
- **Protected Routes**: ProtectedRoute HOC ensures auth checks before access

**Tradeoffs**:
- **Client-side auth check only**: Server still validates JWT; this is a UX enhancement
- **No service worker**: No offline support (could add for resilience)
- **Polling vs WebSockets**: Frontend polls for updates (simpler server)

### Database Schema

**Design**:
- **Users table**: Email unique, bcrypt-hashed passwords
- **Projects table**: Owner-based (project belongs to one user)
- **Tasks table**: Belongs to project, can be assigned to users
- **No junction tables yet**: Single-user projects to start

**Why Simple**:
- Clear one-to-many relationships
- No complex joins initially
- Easy to understand and debug queries

**Future Extensions**:
- Add `project_members` table for team collaboration
- Add `task_comments` for discussions
- Add `activity_log` for audit trails

### API Design

**Chosen Approach**: RESTful with JWT Bearer tokens

- **Public routes**: `/auth/register`, `/auth/login`
- **Protected routes**: Everything else requires `Authorization: Bearer <token>`
- **Standard HTTP verbs**: GET (read), POST (create), PATCH (update), DELETE (delete)
- **CORS enabled**: Frontend can call from localhost:3000 to localhost:8080

**Why REST**:
- Standardized HTTP semantics
- Easy to test with curl/Postman
- Cacheable with HTTP caching headers
- Familiar to most developers

---

## Running Locally

### Prerequisites

**Only Docker & Docker Compose required** (nothing else needs to be installed)

- ✅ Docker Desktop (includes Docker & Docker Compose)
- ✅ Git (to clone the repo)
