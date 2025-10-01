# Wheely Good Pizza Inventory and Sales Management

## Overview

- This is a web application for managing inventory, sales, and cash sessions for a pizza food truck.
- Built with React (frontend), Express (backend), SQLite (database), and Drizzle ORM.
- **Key Workflow**:
  - **Admins** pre-configure the app (e.g., add users, products/recipes, initial inventory/suppliers via Purchases page).
  - **Cashiers** log in and are guided to open a cash session (redirect if none active), then access POS for sales.
  - **Kitchen** staff have limited access, e.g., to view inventory or a dedicated order queue.
  - Login redirects based on role and session status (e.g., to /sessions if no active session).
- Features include FIFO inventory tracking, real-time stock updates, reporting, and role-based access (ADMIN, CASHIER, KITCHEN).

## Table of Contents

- [Getting Started](./getting-started/README.md)
- [Architecture](./architecture/README.md)
- [Frontend](./frontend/README.md)
- [Backend](./backend/README.md)
- [API Reference](./api/README.md)
- [Database](./database/README.md)
- [Deployment](./deployment/README.md)
- [Contributing](./contributing/README.md)
