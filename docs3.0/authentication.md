# Authentication Guide

## Overview

The app uses session-based authentication with roles (ADMIN, CASHIER, KITCHEN). Users must log in to access the app, and roles determine permissions.

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
