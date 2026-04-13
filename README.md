
# Taskflow

A modern, full-stack task management application built with **Go**, **React**, **TypeScript**, and **PostgreSQL**. Taskflow helps you organize, track, and manage your tasks efficiently with a beautiful and intuitive user interface.

## 🌟 Features

- **Task Management**: Create, read, update, and delete tasks with ease
- **Real-time Updates**: Instant task status updates and synchronization
- **User Authentication**: Secure JWT-based authentication system
- **Responsive Design**: Beautiful UI built with React, Tailwind CSS, and shadcn/ui
- **Type-Safe**: Full TypeScript support on both frontend and backend
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **RESTful API**: Clean and well-documented REST API endpoints
- **Database Persistence**: PostgreSQL for reliable data storage

## 🛠️ Tech Stack

### Frontend
- **React 19**: Latest React with modern hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **React Router**: Client-side routing
- **Zustand**: State management
- **Axios**: HTTP client for API calls
- **Lucide React**: Beautiful icon library

### Backend
- **Go 1.26+**: High-performance backend runtime
- **Chi Router**: Lightweight HTTP router
- **PostgreSQL**: Robust relational database
- **JWT**: Secure token-based authentication
- **golang-migrate**: Database migration tool
- **sqlx**: Database access library
- **Crypto**: Built-in Go cryptography for password hashing

### DevOps & Tools
- **Docker & Docker Compose**: Containerization and orchestration
- **ESLint**: Code quality for frontend
- **TypeScript Compiler**: Type checking

## 📋 Prerequisites

Before getting started, ensure you have:
- **Node.js** (v18 or higher)
- **Go** (v1.26 or higher)
- **PostgreSQL** (v16 or higher) - or use Docker
- **Git**
- **Docker & Docker Compose** (optional, for containerized setup)

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/TusharGagal/taskflow-TusharGagal.git
cd taskflow-TusharGagal

# Copy environment variables
cp .env.example .env

# Update JWT_SECRET in .env file (change to a secure random string)
# Example: JWT_SECRET=your_very_secure_random_string_here_minimum_32_chars

# Start all services
docker-compose up --build

# Application will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Database: localhost:5432
