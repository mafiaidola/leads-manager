---
description: Generate a quick-start summary for the Leads Manager project
---

# Quick-Start Workflow

When the user runs `/quick-start`, perform the following:

1. **Read key project files**:
   - `package.json` (dependencies, scripts)
   - `.env.local` (environment variables — DO NOT display secrets, just list variable names)
   - `auth.ts` + `auth.config.ts` (auth setup)
   - `models/` directory (database models)

2. **Explore project structure**:
   - `app/` — routes and API endpoints
   - `components/` — UI components
   - `lib/actions/` — server actions
   - `models/` — Mongoose schemas
   - `scripts/` — utility scripts

3. **Produce a concise summary** covering:
   - Tech stack & versions (Next.js, React, MongoDB, Tailwind v4, NextAuth v5)
   - How to run locally (`npm install` → set `.env.local` → `npm run dev`)
   - Project structure overview
   - Key scripts & commands
   - Login credentials: username=admin / password=admin123
   - Production URL: https://leads-manager-iota.vercel.app

4. **Check current state**:
   - Read `task.md` from the most recent conversation artifacts if available
   - Note any in-progress tasks or pending features
   - List recently modified files (`git log -5 --oneline`)

5. **Output** the summary directly to the user as a formatted message.

## Quick Reference

```
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint check
npm run typecheck        # TypeScript check (no emit)

# Database
npm run seed:prod        # Seed production DB with default users
npm run db:health        # Check MongoDB connection

# Deployment
npm run deploy           # Git push + Vercel production deploy

# Project Info
npm run info             # Show project stats
```

## Login Credentials
| Role      | Username    | Password    |
|-----------|-------------|-------------|
| Admin     | admin       | admin123    |
| Sales     | sales1      | sales123    |
| Marketing | marketing   | market123   |

## Environment Variables Needed
```
MONGODB_URI=             # MongoDB connection string
NEXTAUTH_SECRET=         # NextAuth.js secret key
NEXTAUTH_URL=            # Production URL (https://leads-manager-iota.vercel.app)
```
