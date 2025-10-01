# Authentication

## Overview

- Email/password login with session-based auth.
- Roles: ADMIN (full access), CASHIER (sales/sessions), KITCHEN (limited, e.g., inventory view).

## Role-Based Access

- **ADMIN**: All features, including user management.
- **CASHIER**: Sales, sessions, inventory adjustments.
- **KITCHEN**: View-only for inventory/sessions.
- **Redirects/Guards**: Post-login redirect to /sessions if no active session. Sales page blocked without active session (shows message with link to Sessions).

## Default Account

- Email: admin@pizzatruck.com
- Password: password (change immediately)

## Login Process

1. Open the app (http://localhost:5082).
2. If not logged in, redirected to /login.
3. Enter email/password.
4. On success, redirected to dashboard.

## Creating New Accounts (Admin Only)

1. Log in as ADMIN.
2. Go to /users.
3. Fill form (email, password, name, role).
4. Submit to create.

## Roles

- ADMIN: Full access, including user management.
- CASHIER: Sales and sessions.
- KITCHEN: View inventory/recipes.

## Logout

Log out to end session.
