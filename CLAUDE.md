# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TimeTracker is a full-stack project time tracking web application built with Next.js 16 (App Router), PostgreSQL with Prisma ORM, and Tailwind CSS v4. It supports team collaboration with Owner/Member roles, real-time timer tracking, and comprehensive reporting.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI

# Linting
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your production URL (e.g., https://yourapp.vercel.app)
4. Deploy

### Environment Variables
See `.env.example` for required variables. Database is hosted on Neon (free tier).

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router and Turbopack
- **Database**: PostgreSQL (Neon) with Prisma ORM v5
- **Authentication**: NextAuth.js v5 (beta) with credentials provider
- **Styling**: Tailwind CSS v4 with CSS-based configuration
- **Charts**: Recharts for reports visualization
- **UI Components**: Radix UI primitives with custom styling

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register, etc.)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── invite/            # Invitation acceptance page
├── components/
│   ├── ui/                # Reusable UI components (Button, Card, etc.)
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── timer/             # Timer component
│   └── time-entry/        # Time entry list component
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client singleton
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript type definitions
```

### Database Schema
- **User**: Authentication and profile data
- **Project**: Projects with owner and color
- **ProjectMember**: Many-to-many user-project with OWNER/MEMBER roles
- **Task**: Tasks within projects
- **TimeEntry**: Time tracking records with start/end times
- **Invitation**: Email invitations for team members

### Key Features
- One-click timer with browser tab title updates
- Manual time entry support
- Project and task management
- Team invitations (email-based)
- Reports with pie/bar charts
- CSV export for Excel compatibility
- Dark/light theme toggle
- Mobile-responsive design

### Authentication Flow
- Email/password authentication with bcrypt password hashing
- JWT-based sessions via NextAuth.js
- Protected routes redirect to /login if unauthenticated
- Password reset via email token (requires SMTP configuration)

### Key Patterns
- Server components for data fetching in layouts
- Client components for interactive features (timer, forms)
- API routes follow RESTful conventions
- Role-based access control: Owners can manage projects/members, Members can only track time
- Theme support via CSS variables and ThemeProvider context

## Known Limitations / TODO

- **No automated tests**: Unit and integration tests should be added
- **Email not configured**: Password reset requires SMTP setup
- **PWA icons missing**: Need to generate icon-192.png and icon-512.png
- **No rate limiting**: API routes should have rate limiting for production
- **Invitation emails**: Currently logs to console, needs email service integration
