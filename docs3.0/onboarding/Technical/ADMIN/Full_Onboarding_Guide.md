# Technical Admin Onboarding Guide

## Overview
ADMIN role has full RBAC access. Defined in shared/schema.ts (users table, role enum).

## Authentication
- Login: client/src/pages/Login.tsx, uses AuthContext.
- Session: express-session in server/index.ts.

## Key Components
- Layout: client/src/components/Layout.tsx (sidebar, header).
- AuthContext: client/src/contexts/AuthContext.tsx.

## Pages & Implementation
- Dashboard: client/src/pages/dashboard.tsx, uses React Query for data.
- Users: client/src/pages/Users.tsx, mutations for CRUD via api.ts.
- Inventory: client/src/pages/inventory.tsx, FIFO logic in server/lib/fifo.ts.
- Etc. (detail each page with file paths, APIs).

## Flow
Login -> /dashboard -> Navigate via routes in App.tsx.

## Advanced
- DB: Drizzle ORM in shared/schema.ts.
- API: server/routes.ts.
