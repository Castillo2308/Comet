# 🌟 COMET - Civic Safety Intelligence Platform

A comprehensive React + Node.js PWA application for citizen safety reporting, community engagement, and municipal security coordination.

## 📋 Table of Contents
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [Technology Stack](#technology-stack)

## 📁 Project Structure

```
├── src/                          # React frontend (Vite)
│   ├── pages/                   # Page components
│   ├── components/              # Reusable components
│   ├── contexts/                # React contexts (Auth, etc.)
│   └── App.tsx                  # Main app component
├── api/                         # Express.js backend
│   ├── index.js                 # Server entry point
├── routes/                      # API route handlers
├── controllers/                 # Business logic
├── models/                      # Database models
├── lib/                         # Utility libraries (Auth, DB, APIs)
├── public/                      # Static files (PWA assets, manifest)
├── dist/                        # Built production files (generated)
└── package.json                 # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 22.x** (required)
- **npm** (comes with Node.js)
- **PostgreSQL** (Neon recommended for dev) - optional for local testing

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables) section)

3. **Start development:**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🔧 Backend Setup

### Database Setup (PostgreSQL via Neon)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a PostgreSQL database
3. Copy the connection string to `.env.local`:
   ```
   NEON_DATABASE_URL=postgresql://user:password@host/database
   ```

The schema will be automatically initialized on first backend start.

### API Routes

The backend provides RESTful endpoints:
- `/api/users/*` - User management and authentication
- `/api/reports/*` - Citizen safety reports
- `/api/events/*` - Community events
- `/api/news/*` - Municipal news and announcements
- `/api/buses/*` - Public transportation tracking
- `/api/forum/*` - Community forum
- `/api/complaints/*` - Safety complaints
- `/api/security/*` - Security alerts

### Authentication

The API uses JWT tokens for authentication:
- Login via `/api/users/login` → returns JWT token
- Include token in `Authorization: Bearer <token>` header for protected routes

## 🔐 Environment Variables

Create a `.env.local` file with:

```env
# Server
PORT=5000                                          # Backend port (default: 5000)
JWT_SECRET=your-secret-key-change-in-production  # JWT signing key

# Database
NEON_DATABASE_URL=postgresql://...               # PostgreSQL connection string

# CORS Configuration
CORS_ORIGINS=http://localhost:5173, https://your-app.vercel.app

# Google Cloud APIs (optional - for advanced features)
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-secret
GOOGLE_OAUTH_REFRESH_TOKEN=your-token

# Google Drive (for file uploads)
DRIVE_REPORTS_FOLDER_ID=folder-id-for-reports
DRIVE_POSTS_FOLDER_ID=folder-id-for-community-posts

# Content Moderation (optional)
PERSPECTIVE_API_KEY=your-api-key

# Frontend
VITE_API_URL=http://localhost:5000               # Backend URL for frontend
```

**Note:** For local development without Google APIs, you can leave those fields empty. Features requiring them will gracefully fail.

## ▶️ Running the Application

### Development (Frontend + Backend)
```bash
npm run dev
```
Runs Vite dev server and backend with auto-reload.

### Production Build
```bash
npm run build
```
Creates optimized production build in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally.

### Backend Only
```bash
npm start
```
Runs only the Express backend.

### Lint Code
```bash
npm run lint
```

### Get Google Drive Token (if using Drive API)
```bash
npm run get:drive-token
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite + Node) concurrently |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm start` | Start backend only |
| `npm run lint` | Run ESLint |
| `npm run get:drive-token` | Get Google Drive refresh token |

## ✨ Features

### Frontend (React + PWA)
- ✅ Responsive design with Tailwind CSS
- ✅ Dark mode support
- ✅ Progressive Web App (offline support)
- ✅ Real-time map integration (Leaflet)
- ✅ User authentication & profiles
- ✅ Report creation with image uploads
- ✅ Community forum & discussions
- ✅ Event management
- ✅ Bus tracking system
- ✅ Admin dashboard

### Backend (Express.js + PostgreSQL)
- ✅ RESTful API
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Database schema auto-initialization
- ✅ Content moderation (Google Vision API)
- ✅ File uploads (Google Drive integration)

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite 6.1.6** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **PWA Plugin** - Offline support
- **Leaflet** - Maps

### Backend
- **Express.js 5.1.0** - Web framework
- **PostgreSQL** - Database (via Neon)
- **JWT** - Authentication
- **Helmet** - Security headers
- **CORS** - Cross-origin requests
- **Rate Limiting** - API protection

### Deployment
- **Vercel** - Frontend & backend hosting

## 📝 Notes

- The application requires Node.js 22.x
- Database migrations run automatically on backend start
- Service Worker is included for PWA functionality
- All sensitive credentials should be in environment variables (never commit `.env.local`)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Commit with clear messages
5. Push and create a pull request

---

**For more information, check the API documentation or admin dashboard documentation.**
